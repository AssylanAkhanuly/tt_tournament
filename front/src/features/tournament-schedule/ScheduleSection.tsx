'use client';

/* «Расписание» турнира «группы + плей-офф» ✳ (30.10.2026, решение владельца
   продукта; ТЗ §4.5–4.6). Правила — на сервере (`back/tournaments/schedule.py`).

   Главный судья задаёт параметры (столов, длительность матча, игровые дни —
   дата и часы каждого, `PlayDays`) и
   формирует черновик: группы змейкой, пары по кругам, у каждого матча время,
   стол и судья стола. Черновик он правит — щелчок по матчу открывает карточку
   справа (время, стол, судья), игрока можно перенести в другую группу — и
   отправляет. Отправленное не меняется. Администратор и председатель ГСК видят
   то же без правки (`canEdit` с сервера). Три вида: «Матчи» — таблицей, «День» —
   сеткой дня по столам (`ScheduleDay`), «Группы»; выбирают их подпункты раздела
   в сайдбаре, вкладок на экране нет (решение владельца продукта). HeroUI +
   Tailwind. */

import { AlertDialog, Button, Chip, Drawer, ListBox, NumberField, Select } from '@heroui/react';
import { CalendarClock, Send, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import {
  buildSchedule,
  editScheduledMatch,
  finalizeSchedule,
  useSchedule,
  type Schedule,
  type ScheduledMatch,
  type ScheduleSettings,
} from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

import { groupTone } from './groupTone';
import { MatchPair } from './MatchPlayer';
import { MatchResult } from './MatchResult';
import { PlayDays } from './PlayDays';
import { ScheduleDay } from './ScheduleDay';
import { ScheduleGroups } from './ScheduleGroups';

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (d: Date) => pad(d.getHours()) + ':' + pad(d.getMinutes());
const dm = (d: Date) => pad(d.getDate()) + '.' + pad(d.getMonth() + 1);

function Pick<T extends string | number>({
  label,
  value,
  options,
  onChange,
  testId,
  width = 'w-32',
}: {
  label: string;
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
  width?: string;
}) {
  return (
    <Select
      aria-label={label}
      selectedKey={value === null ? null : String(value)}
      onSelectionChange={(k) => {
        const o = options.find((x) => String(x.id) === String(k));
        if (o) onChange(o.id);
      }}
      className={width}
    >
      <Select.Trigger className="rounded-xl" data-testid={testId}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="rounded-xl">
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={String(o.id)} id={String(o.id)} textValue={o.label} className="rounded-xl">
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** Строка настройки: подпись слева, поле справа. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-[14px] font-medium">{label}</span>
      {children}
    </div>
  );
}

function Count({ label, value, onChange, min, testId }: { label: string; value: number; onChange: (v: number) => void; min: number; testId: string }) {
  return (
    <NumberField aria-label={label} value={value} onChange={(v) => !Number.isNaN(v) && onChange(v)} minValue={min} className="w-32">
      <NumberField.Group className="rounded-xl">
        <NumberField.DecrementButton />
        <NumberField.Input data-testid={testId} />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}

/** Параметры расписания: столов и длительность матча, ниже — игровые дни
 *  отдельным разделом (дата и часы каждого дня). */
function SettingsFields({ value, onChange }: { value: ScheduleSettings; onChange: (s: ScheduleSettings) => void }) {
  return (
    <div className="flex flex-col gap-3" data-testid="schedule-settings">
      <div className="divide-y divide-neutral-100">
        <Row label="Столов">
          <Count label="Столов" value={value.tables} min={1} onChange={(tables) => onChange({ ...value, tables })} testId="schedule-tables" />
        </Row>
        <Row label="Матч, минут">
          <Count label="Матч, минут" value={value.matchMinutes} min={5} onChange={(matchMinutes) => onChange({ ...value, matchMinutes })} testId="schedule-minutes" />
        </Row>
      </div>
      <PlayDays value={value.days} onChange={(days) => onChange({ ...value, days })} />
    </div>
  );
}

/** Возможные начала матча: шагом матча в часы каждого игрового дня. */
function slotOptions(s: Schedule) {
  const minutes = (v: string) => {
    const [h, m] = v.split(':').map(Number);
    return h * 60 + m;
  };
  const out: { id: string; label: string; at: Date }[] = [];
  for (const day of s.settings.days) {
    const [y, mo, d] = day.date.split('-').map(Number);
    for (let t = minutes(day.start); t + s.settings.matchMinutes <= minutes(day.end); t += s.settings.matchMinutes) {
      const at = new Date(y, mo - 1, d, Math.floor(t / 60), t % 60);
      out.push({ id: at.toISOString(), label: dm(at) + ' ' + hm(at), at });
    }
  }
  return out;
}

/** Карточка матча справа: время, стол, судья — черновиком с «Сохранить». */
function MatchDrawer({
  schedule,
  match,
  tournamentId,
  onClose,
  onSaved,
}: {
  schedule: Schedule;
  match: ScheduledMatch | null;
  tournamentId: string;
  onClose: () => void;
  onSaved: (s: Schedule) => void;
}) {
  return (
    <Drawer.Backdrop isOpen={match !== null} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="sm:w-[28rem]" data-testid="schedule-match-drawer">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header className="border-b border-neutral-200 pb-4">
            <Drawer.Heading className="text-lg font-semibold">Матч</Drawer.Heading>
          </Drawer.Header>
          {match && (
            <MatchForm key={match.id} schedule={schedule} match={match} tournamentId={tournamentId} onSaved={onSaved} onCancel={onClose} />
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function MatchForm({
  schedule,
  match,
  tournamentId,
  onSaved,
  onCancel,
}: {
  schedule: Schedule;
  match: ScheduledMatch;
  tournamentId: string;
  onSaved: (s: Schedule) => void;
  onCancel: () => void;
}) {
  const [at, setAt] = useState(match.scheduledAt?.toISOString() ?? null);
  const [table, setTable] = useState(match.table);
  const [referee, setReferee] = useState(match.referee?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = at !== (match.scheduledAt?.toISOString() ?? null) || table !== match.table || referee !== (match.referee?.id ?? null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      onSaved(
        await editScheduledMatch(tournamentId, match.id, {
          scheduledAt: at ? new Date(at) : undefined,
          table: table ?? undefined,
          refereeId: referee ?? undefined,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Drawer.Body className="flex flex-col gap-5 pt-5">
        <div data-testid="schedule-match-players">
          <p className="text-[15px] font-semibold">
            <MatchPair a={match.player1} b={match.player2} />
          </p>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Группа {match.groupName} · круг {match.round}
          </p>
        </div>
        <div className="divide-y divide-neutral-100">
          <Row label="Время">
            <Pick label="Время" value={at} options={slotOptions(schedule)} onChange={setAt} width="w-44" testId="schedule-match-time" />
          </Row>
          <Row label="Стол">
            <Pick
              label="Стол"
              value={table}
              options={Array.from({ length: schedule.settings.tables }, (_, i) => ({ id: i + 1, label: String(i + 1) }))}
              onChange={setTable}
              testId="schedule-match-table"
            />
          </Row>
          <Row label="Судья">
            <Pick
              label="Судья"
              value={referee}
              options={schedule.referees.map((r) => ({ id: r.id, label: r.name }))}
              onChange={setReferee}
              width="w-56"
              testId="schedule-match-referee"
            />
          </Row>
        </div>
        {error && (
          <p className="text-[13px] text-red-600" data-testid="schedule-match-error">
            {error}
          </p>
        )}
      </Drawer.Body>
      <Drawer.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" className="rounded-xl" onPress={onCancel}>
          Отменить
        </Button>
        <Button variant="primary" className="rounded-xl" isDisabled={!changed || busy} onPress={() => void save()} data-testid="schedule-match-save">
          Сохранить
        </Button>
      </Drawer.Footer>
    </>
  );
}

/** Колонки «Матчей»; метка группы — её цветом (`groupTone`). */
const matchColumns = (groups: Schedule['groups']): DataColumn<ScheduledMatch>[] => [
  {
    id: 'time',
    label: 'Время',
    sortValue: (m) => (m.scheduledAt ? +m.scheduledAt : null),
    render: (m) => (m.scheduledAt ? dm(m.scheduledAt) + ' ' + hm(m.scheduledAt) : '—'),
  },
  { id: 'table', label: 'Стол', align: 'right', sortValue: (m) => m.table, render: (m) => m.table ?? '—' },
  {
    id: 'group',
    label: 'Группа',
    sortValue: (m) => m.groupName,
    render: (m) => (
      <span className={'inline-flex min-w-7 justify-center rounded-md px-1.5 py-0.5 text-[12px] font-semibold ' + groupTone(groups, m.group).chip}>
        {m.groupName}
      </span>
    ),
  },
  { id: 'round', label: 'Круг', align: 'right', sortValue: (m) => m.round, render: (m) => m.round ?? '—' },
  {
    id: 'pair',
    label: 'Матч',
    rowHeader: true,
    render: (m) => <MatchPair a={m.player1} b={m.player2} />,
  },
  {
    id: 'result',
    label: 'Счёт',
    align: 'right',
    render: (m) => <MatchResult match={m} pending={<span className="text-neutral-400">—</span>} />,
  },
  {
    id: 'referee',
    label: 'Судья стола',
    sortValue: (m) => m.referee?.name ?? null,
    render: (m) => (m.referee ? shortName(m.referee.name) : <span className="text-red-600">не назначен</span>),
  },
];

type View = 'matches' | 'day' | 'groups';

export function ScheduleSection({ tournamentId }: { tournamentId: string }) {
  const loaded = useSchedule(tournamentId);
  // Ответ правки — свежее расписание целиком; держим его поверх загруженного.
  const [fresh, setFresh] = useState<Schedule | null>(null);
  const s = fresh ?? loaded.data;
  // Вид — в адресе (`?view=day|groups`; «Матчи» — без параметра): переживает
  // перезагрузку и ссылку. Выбирают его подпункты «Расписания» в сайдбаре.
  const params = useSearchParams();
  const asked = params.get('view');
  const view: View = asked === 'day' || asked === 'groups' ? asked : 'matches';
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState<ScheduleSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<Schedule>) {
    setBusy(true);
    setError(null);
    try {
      setFresh(await action());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loaded.error) return <p className="p-6 text-[13px] text-red-600">{loaded.error}</p>;
  if (!s) return null;
  const settings = draft ?? s.settings;

  // Расписания ещё нет: главному судье — параметры и «Сформировать», остальным — пустое состояние.
  if (s.status === 'none') {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white" data-testid="schedule" data-status="none">
        {s.canEdit ? (
          <div className="max-w-xl p-6">
            <SettingsFields value={settings} onChange={setDraft} />
            {error && (
              <p className="mt-3 text-[13px] text-red-600" data-testid="schedule-error">
                {error}
              </p>
            )}
            <Button
              variant="primary"
              className="mt-4 rounded-xl"
              isDisabled={busy}
              onPress={() => void run(() => buildSchedule(tournamentId, settings))}
              data-testid="schedule-build"
            >
              <CalendarClock size={16} /> Сформировать
            </Button>
          </div>
        ) : (
          <p className="p-6 text-center text-[13px] text-neutral-500" data-testid="schedule-empty">
            Расписания пока нет
          </p>
        )}
      </div>
    );
  }

  const toolbar = (
    <>
      <Chip size="sm" variant="soft" color={s.status === 'final' ? 'success' : 'warning'} data-testid="schedule-status">
        {s.status === 'final' ? 'Отправлено' : 'Черновик'}
      </Chip>
      {s.canEdit && (
        <>
          <Drawer>
            <Button variant="outline" size="sm" className="rounded-xl" data-testid="schedule-params">
              <SlidersHorizontal size={16} /> Параметры
            </Button>
            <Drawer.Backdrop>
              <Drawer.Content placement="right">
                <Drawer.Dialog className="sm:w-[30rem]" data-testid="schedule-params-drawer">
                  {({ close }) => (
                    <>
                      <Drawer.CloseTrigger aria-label="Закрыть" />
                      <Drawer.Header className="border-b border-neutral-200 pb-4">
                        <Drawer.Heading className="text-lg font-semibold">Параметры</Drawer.Heading>
                      </Drawer.Header>
                      <Drawer.Body className="pt-5">
                        <SettingsFields value={settings} onChange={setDraft} />
                        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
                      </Drawer.Body>
                      <Drawer.Footer className="flex justify-end gap-2">
                        <Button variant="tertiary" className="rounded-xl" onPress={() => setDraft(null)} isDisabled={!draft}>
                          Отменить
                        </Button>
                        <Button
                          variant="primary"
                          className="rounded-xl"
                          isDisabled={busy}
                          onPress={() =>
                            void run(() => buildSchedule(tournamentId, settings)).then(() => {
                              setDraft(null);
                              close();
                            })
                          }
                          data-testid="schedule-rebuild"
                        >
                          Сформировать заново
                        </Button>
                      </Drawer.Footer>
                    </>
                  )}
                </Drawer.Dialog>
              </Drawer.Content>
            </Drawer.Backdrop>
          </Drawer>
          <AlertDialog>
            <Button variant="primary" size="sm" className="rounded-xl" isDisabled={busy} data-testid="schedule-finalize">
              <Send size={16} /> Отправить
            </Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog className="rounded-xl" data-testid="schedule-finalize-confirm">
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="warning" />
                    <AlertDialog.Heading>Отправить расписание?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p className="text-[14px]">После отправки расписание и состав не изменить.</p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary" className="rounded-xl">
                      Отмена
                    </Button>
                    <Button slot="close" variant="primary" className="rounded-xl" onPress={() => void run(() => finalizeSchedule(tournamentId))}>
                      Отправить
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white" data-testid="schedule" data-status={s.status}>
      {error && (
        <p className="px-6 pt-3 text-[13px] text-red-600" data-testid="schedule-error">
          {error}
        </p>
      )}
      {view === 'matches' ? (
        <DataTable
          ariaLabel="Матчи"
          testId="schedule-matches"
          rows={s.matches}
          columns={matchColumns(s.groups)}
          getId={(m) => String(m.id)}
          search={{ placeholder: 'Игрок или судья', text: (m) => m.player1.name + ' ' + m.player2.name + ' ' + (m.referee?.name ?? '') }}
          count={(n) => 'Матчей: ' + n}
          actions={toolbar}
          defaultSort={{ column: 'time', direction: 'ascending' }}
          pageSize={50}
          empty="Матчей нет"
          onRowAction={s.canEdit ? (m) => setOpen(m.id) : undefined}
          rowProps={(m) => ({ 'data-testid': 'schedule-match', 'data-id': String(m.id), 'data-table': String(m.table ?? '') })}
        />
      ) : view === 'day' ? (
        <ScheduleDay schedule={s} toolbar={toolbar} onOpen={s.canEdit ? setOpen : undefined} />
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-b border-neutral-200 px-6 py-3">{toolbar}</div>
          <ScheduleGroups schedule={s} tournamentId={tournamentId} onChanged={setFresh} />
        </>
      )}
      <MatchDrawer
        schedule={s}
        match={s.matches.find((m) => m.id === open) ?? null}
        tournamentId={tournamentId}
        onClose={() => setOpen(null)}
        onSaved={(next) => {
          setFresh(next);
          setOpen(null);
        }}
      />
    </div>
  );
}
