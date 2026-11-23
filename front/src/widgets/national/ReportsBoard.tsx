'use client';

/* Рапорты на командирование ✳ (19.11.2026, NATIONAL.md; флоу Э11.4).
   Очередь таблицей: мероприятие, возрастная группа, автор, состав, когда,
   состояние. «Новый рапорт» — у тех, кто пишет (`canWrite`): мероприятие из
   календаря подготовки, группа, спортсмены (старшему тренеру региона —
   только своего региона, решает сервер), текст и/или файл. Строка открывает
   панель справа: **сам рапорт** — шапка, текст, поимённый состав, файл — и
   история согласования; там же решение главного тренера («Согласовать»,
   «Вернуть на доработку», «Отклонить» — последние два с комментарием) или
   доработка автором. HeroUI + Tailwind. */

import { Button, Chip, Drawer, Label, ListBox, Modal, SearchField, Spinner, TextArea, TextField, useOverlayState } from '@heroui/react';
import { FileText, Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import {
  AGE_GROUP_LABEL,
  createReport,
  decideReport,
  dmy,
  fetchEvents,
  fetchReportCandidates,
  fetchReports,
  REPORT_ACTION_LABEL,
  REPORT_STATUS_LABEL,
  reportFileUrl,
  resubmitReport,
  useLoad,
  type AgeGroup,
  type NationalPerson,
  type ReportStatus,
  type TravelReport,
} from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

import { FormDialog } from './PlanBoard';
import { SideContent, SideDialog } from '@/shared/ui/SidePanel';

const STATUS_COLOR: Record<ReportStatus, 'warning' | 'danger' | 'success' | 'default'> = {
  submitted: 'warning',
  returned: 'danger',
  rejected: 'default',
  approved: 'success',
};
const GROUPS = (Object.keys(AGE_GROUP_LABEL) as AgeGroup[]).map((g) => ({ id: g, label: AGE_GROUP_LABEL[g] }));
/** Время с сервера (UTC) — в местное: «19.11.2026 06:11». */
const when = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Выбор спортсменов для рапорта: поиск и отметка нескольких. */
function AthletePicker({ value, onChange, initial }: { value: string[]; onChange: (ids: string[]) => void; initial?: NationalPerson[] }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState<NationalPerson[] | null>(null);
  const [known, setKnown] = useState<Record<string, NationalPerson>>(() => Object.fromEntries((initial ?? []).map((p) => [p.id, p])));
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      fetchReportCandidates(q)
        .then((list) => {
          if (!live) return;
          setFound(list);
          setKnown((k) => ({ ...k, ...Object.fromEntries(list.map((p) => [p.id, p])) }));
        })
        .catch(() => live && setFound([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);
  const picked = value.map((id) => known[id]).filter(Boolean);
  return (
    <div className="flex flex-col gap-2">
      <Label>Состав</Label>
      {picked.length > 0 && (
        <p className="m-0 text-[13px]" data-testid="report-picked">
          {picked.map((p) => p.name).join(', ')}
        </p>
      )}
      <SearchField aria-label="Поиск спортсменов" value={q} onChange={setQ}>
        <SearchField.Group className="rounded-xl">
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Фамилия или имя" data-testid="report-search" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <div className="max-h-44 overflow-y-auto">
        {!found ? (
          <Spinner className="mx-auto my-3 block" />
        ) : (
          <ListBox
            aria-label="Спортсмены"
            selectionMode="multiple"
            selectedKeys={value}
            onSelectionChange={(keys) => onChange([...(keys as Set<string>)].map(String))}
            renderEmptyState={() => <p className="py-3 text-center text-[13px] text-neutral-500">Никого не найдено</p>}
          >
            {found.map((p) => (
              <ListBox.Item key={p.id} id={p.id} textValue={p.name} className="rounded-xl" data-testid="report-candidate" data-name={p.name}>
                <span className="flex w-full items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-[12px] text-neutral-500">{[p.birthYear, p.region].filter(Boolean).join(' · ')}</span>
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        )}
      </div>
    </div>
  );
}

function FileInput({ onChange }: { onChange: (f: File | null) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[14px]">
      <span className="font-medium">Файл рапорта</span>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="text-[13px]"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        data-testid="report-file"
      />
    </label>
  );
}

function NewReportDialog({ onCreated }: { onCreated: () => void }) {
  const state = useOverlayState();
  const calendar = useLoad(fetchEvents, 'events');
  const [eventId, setEventId] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [athleteIds, setAthleteIds] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!eventId) return;
    setBusy(true);
    setError(null);
    try {
      await createReport({ eventId, ageGroup, text, athleteIds, file });
      state.close();
      setEventId(null);
      setAthleteIds([]);
      setText('');
      setFile(null);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const events = calendar.data?.events ?? [];
  return (
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="report-create-open">
        <Plus size={16} /> Новый рапорт
      </Button>
      <ModalSheet size="md" tall testId="report-create">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Рапорт на командирование</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <Picker
              label="Мероприятие"
              showLabel
              value={eventId}
              placeholder={events.length ? 'Выберите' : 'В календаре подготовки пусто'}
              options={events.map((ev) => ({ id: ev.id, label: ev.title + ' · ' + dmy(ev.startsOn) }))}
              onChange={setEventId}
              testId="report-event"
            />
            <Picker label="Возрастная группа" showLabel value={ageGroup} options={GROUPS} onChange={(k) => setAgeGroup(k as AgeGroup)} testId="report-group" />
            <AthletePicker value={athleteIds} onChange={setAthleteIds} />
            <TextField value={text} onChange={setText}>
              <Label>Текст рапорта</Label>
              <TextArea rows={4} className="rounded-xl" data-testid="report-text" />
            </TextField>
            <FileInput onChange={setFile} />
            {error && <p className="m-0 text-[13px] text-red-600" data-testid="report-error">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!eventId || busy || (!text.trim() && !file)} data-testid="report-submit">
              Подать
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}

function CommentDecision({ report, decision, label, onDone }: { report: TravelReport; decision: 'return' | 'reject'; label: string; onDone: () => void }) {
  const [comment, setComment] = useState('');
  return (
    <FormDialog
      testId={'report-' + decision}
      title={label}
      submitLabel={label}
      danger
      ready={!!comment.trim()}
      submit={async () => {
        await decideReport(report.id, decision, comment);
        setComment('');
        onDone();
      }}
      trigger={
        <Button variant="danger-soft" className="rounded-xl" data-testid={'report-' + decision + '-open'}>
          {label}
        </Button>
      }
    >
      <TextField isRequired value={comment} onChange={setComment}>
        <Label>Комментарий</Label>
        <TextArea rows={3} className="rounded-xl" data-testid={'report-' + decision + '-comment'} />
      </TextField>
    </FormDialog>
  );
}

function ResubmitDialog({ report, onDone }: { report: TravelReport; onDone: () => void }) {
  const [text, setText] = useState(report.text);
  const [athleteIds, setAthleteIds] = useState(report.athletes.map((a) => a.id));
  const [file, setFile] = useState<File | null>(null);
  return (
    <FormDialog
      testId="report-resubmit"
      title="Доработать рапорт"
      submitLabel="Подать снова"
      ready={!!text.trim() || !!file || !!report.fileName}
      submit={async () => {
        await resubmitReport(report.id, { text, athleteIds, file });
        onDone();
      }}
      trigger={
        <Button variant="primary" className="rounded-xl" data-testid="report-resubmit-open">
          Доработать
        </Button>
      }
    >
      <AthletePicker value={athleteIds} onChange={setAthleteIds} initial={report.athletes} />
      <TextField value={text} onChange={setText}>
        <Label>Текст рапорта</Label>
        <TextArea rows={4} className="rounded-xl" data-testid="report-resubmit-text" />
      </TextField>
      <FileInput onChange={setFile} />
    </FormDialog>
  );
}

function ReportDrawer({ report, onClose, onChanged }: { report: TravelReport | null; onClose: () => void; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const done = () => {
    onChanged();
    onClose();
  };
  const r = report;
  return (
    <Drawer.Backdrop isOpen={r !== null} onOpenChange={(open) => !open && onClose()}>
      <SideContent>
        <SideDialog className="sm:w-[34rem]" data-testid="report-drawer">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-semibold">Рапорт</Drawer.Heading>
          </Drawer.Header>
          {r && (
            <>
              <Drawer.Body className="flex flex-col gap-6">
                {/* Лист рапорта: решают по тому, что в нём написано. */}
                <article className="flex flex-col gap-3 border border-neutral-200 bg-white px-6 py-5 text-neutral-900" data-testid="report-sheet">
                  <header className="text-right text-[13px] leading-snug">
                    <div>Главному тренеру национальной команды</div>
                    <div>от {r.author.name}</div>
                  </header>
                  <h3 className="m-0 text-center text-[15px] font-semibold">Рапорт</h3>
                  <p className="m-0 text-[14px]">
                    О командировании на «{r.event.title}» ({r.event.city || '—'}, {dmy(r.event.startsOn)} — {dmy(r.event.endsOn)}),
                    возрастная группа — {AGE_GROUP_LABEL[r.ageGroup].toLowerCase()}.
                  </p>
                  {r.text && <p className="m-0 whitespace-pre-line text-[14px]" data-testid="report-text-view">{r.text}</p>}
                  <div>
                    <div className="text-[13px] font-semibold">Поимённый состав</div>
                    {r.athletes.length ? (
                      <ol className="m-0 mt-1 pl-5 text-[14px]" data-testid="report-athletes">
                        {r.athletes.map((a) => (
                          <li key={a.id}>
                            {a.name}
                            <span className="text-neutral-500"> · {[a.birthYear, a.region].filter(Boolean).join(' · ')}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="m-0 mt-1 text-[13px] text-red-700" data-testid="report-no-athletes">
                        Состав не указан
                      </p>
                    )}
                  </div>
                  {r.fileName && (
                    <a
                      href={reportFileUrl(r.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[14px] font-medium text-brand-700 underline"
                      data-testid="report-file-link"
                    >
                      <FileText size={16} /> {r.fileName}
                    </a>
                  )}
                  <footer className="text-right text-[13px] text-neutral-500">{dmy(r.createdAt)}</footer>
                </article>

                <section className="flex flex-col gap-2" data-testid="report-history">
                  <h3 className="m-0 text-[13px] font-semibold">История согласования</h3>
                  <ol className="m-0 flex list-none flex-col gap-2 p-0">
                    {r.history.map((h, i) => (
                      <li key={i} className="border-l-2 border-neutral-200 pl-3 text-[13px]" data-testid="report-history-row" data-action={h.action}>
                        <div>
                          <span className="font-medium">{REPORT_ACTION_LABEL[h.action]}</span>
                          <span className="text-neutral-500"> · {h.by} · {when(h.at)}</span>
                        </div>
                        {h.comment && <div className="text-neutral-700">{h.comment}</div>}
                      </li>
                    ))}
                  </ol>
                </section>
                {error && <p className="m-0 text-[13px] text-red-600">{error}</p>}
              </Drawer.Body>
              {(r.canDecide || r.canResubmit) && (
                <Drawer.Footer className="flex flex-wrap items-center justify-end gap-2">
                  {r.canDecide && (
                    <>
                      <CommentDecision report={r} decision="reject" label="Отклонить" onDone={done} />
                      <CommentDecision report={r} decision="return" label="Вернуть на доработку" onDone={done} />
                      <Button
                        variant="primary"
                        className="rounded-xl"
                        onPress={() =>
                          void decideReport(r.id, 'approve')
                            .then(done)
                            .catch((e: Error) => setError(e.message))
                        }
                        data-testid="report-approve"
                      >
                        Согласовать
                      </Button>
                    </>
                  )}
                  {r.canResubmit && <ResubmitDialog report={r} onDone={done} />}
                </Drawer.Footer>
              )}
            </>
          )}
        </SideDialog>
      </SideContent>
    </Drawer.Backdrop>
  );
}

const COLUMNS: DataColumn<TravelReport>[] = [
  { id: 'event', label: 'Мероприятие', rowHeader: true, sortValue: (r) => r.event.title, render: (r) => <span className="font-medium">{r.event.title}</span> },
  { id: 'dates', label: 'Сроки', sortValue: (r) => r.event.startsOn, render: (r) => dmy(r.event.startsOn) + ' — ' + dmy(r.event.endsOn) },
  { id: 'group', label: 'Группа', sortValue: (r) => r.ageGroup, render: (r) => AGE_GROUP_LABEL[r.ageGroup] },
  { id: 'author', label: 'Автор', sortValue: (r) => r.author.name, render: (r) => r.author.name },
  { id: 'athletes', label: 'Состав', align: 'right', sortValue: (r) => r.athletes.length, render: (r) => r.athletes.length || '—' },
  { id: 'created', label: 'Подан', descFirst: true, sortValue: (r) => r.createdAt, render: (r) => dmy(r.createdAt) },
  {
    id: 'status',
    label: 'Состояние',
    sortValue: (r) => r.status,
    render: (r) => (
      <Chip size="sm" variant="soft" color={STATUS_COLOR[r.status]} data-testid="report-status" data-status={r.status}>
        {REPORT_STATUS_LABEL[r.status]}
      </Chip>
    ),
  },
];

export function ReportsBoard({ canWrite }: { canWrite: boolean }) {
  const reports = useLoad(fetchReports, 'reports');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = (reports.data ?? []).find((r) => r.id === openId) ?? null;
  return (
    <>
      <DataTable
        ariaLabel="Рапорты на командирование"
        testId="reports"
        rows={reports.data ?? []}
        columns={COLUMNS}
        getId={(r) => r.id}
        loading={!reports.data && !reports.error}
        error={reports.error}
        empty="Рапортов нет"
        search={{ placeholder: 'Мероприятие или автор', text: (r) => r.event.title + ' ' + r.author.name }}
        defaultSort={{ column: 'created', direction: 'descending' }}
        actions={canWrite ? <NewReportDialog onCreated={reports.reload} /> : undefined}
        onRowAction={(r) => setOpenId(r.id)}
        rowProps={(r) => ({ 'data-testid': 'report-row', 'data-event': r.event.title, 'data-status': r.status })}
      />
      <ReportDrawer report={open} onClose={() => setOpenId(null)} onChanged={reports.reload} />
    </>
  );
}
