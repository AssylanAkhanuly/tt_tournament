'use client';

/* «Расписание» тура Лиги ✳ (19.11.2026, решение владельца продукта: «как у
   обычного турнира»; LEAGUE.md «Расписание тура»). Пока расписания нет —
   параметры (столов, минут на встречу, игровые дни — `PlayDays` турнира) и
   «Сформировать». Черновик и отправленное — два вида (подпункты в сайдбаре,
   `?view=day`): «Список» — встречи по времени (время, стол, круг, встреча,
   счёт) и «День» — сетка «столы × часы», встреча — блок высотой в её
   длительность. В черновике строка или блок открывают правку стола и времени
   (занятый стол и занятую команду отбивает сервер), в полосе — «Параметры»
   (сформировать заново) и «Отправить» с подтверждением; отправленное — только
   смотреть. Что можно — решает сервер (`schedule.canEdit`). HeroUI + Tailwind. */

import { AlertDialog, Button, Chip, Drawer, I18nProvider, Input, Label, TextField, useOverlayState } from '@heroui/react';
import { ChevronLeft, ChevronRight, Send, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import {
  buildTourSchedule,
  editMatchSchedule,
  finalizeTourSchedule,
  type TeamMatch,
  type TourDetail,
  type TourPlayDay,
} from '@/entities/league';
import { Clock, PlayDays } from '@/features/tournament-schedule';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { DateInput } from '@/shared/ui/DateInput';
import { AlertSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

export type TourScheduleView = 'list' | 'day';

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hhmm = (d: Date) => pad(d.getHours()) + ':' + pad(d.getMinutes());
const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const when = (d: Date | null) => (d ? d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + hhmm(d) : '—');
const score = (m: TeamMatch) => (m.status === 'finished' ? m.rubbersA + ' : ' + m.rubbersB : '—');

/** Параметры расписания: столов, минут на встречу, игровые дни → «Сформировать». */
function ScheduleParams({ tour, onBuilt, submitLabel }: { tour: TourDetail; onBuilt: () => void; submitLabel: string }) {
  const s = tour.schedule;
  const [tables, setTables] = useState(String(s.tables));
  const [minutes, setMinutes] = useState(String(s.matchMinutes));
  const [days, setDays] = useState<TourPlayDay[]>(
    s.days.length ? s.days : [{ date: tour.startsOn ?? isoDay(new Date()), start: '10:00', end: '18:00' }],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    setError(null);
    try {
      await buildTourSchedule(tour.id, { tables: Number(tables) || 0, matchMinutes: Number(minutes) || 0, days });
      onBuilt();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="tour-schedule-params">
      <div className="flex gap-3">
        <TextField value={tables} onChange={(v) => setTables(v.replace(/\D/g, ''))} className="w-40">
          <Label>Столов</Label>
          <Input inputMode="numeric" className="rounded-xl" data-testid="tour-schedule-tables" />
        </TextField>
        <TextField value={minutes} onChange={(v) => setMinutes(v.replace(/\D/g, ''))} className="w-48">
          <Label>Минут на встречу</Label>
          <Input inputMode="numeric" className="rounded-xl" data-testid="tour-schedule-minutes" />
        </TextField>
      </div>
      <PlayDays value={days} onChange={setDays} />
      {error && (
        <p className="text-[13px] text-red-600" data-testid="tour-schedule-error">
          {error}
        </p>
      )}
      <Button variant="primary" className="self-start rounded-xl" isDisabled={busy} onPress={() => void build()} data-testid="tour-schedule-build">
        {submitLabel}
      </Button>
    </div>
  );
}

/** Правка встречи в черновике: стол и время. Конфликт показывает сервер. */
function MatchEdit({ tour, match, onClose, onSaved }: { tour: TourDetail; match: TeamMatch | null; onClose: () => void; onSaved: () => void }) {
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [table, setTable] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  // Открылась другая встреча — черновик правки с её значений.
  if (match && match.id !== shown) {
    setShown(match.id);
    setDay(match.scheduledAt ? isoDay(match.scheduledAt) : null);
    setTime(match.scheduledAt ? hhmm(match.scheduledAt) : '10:00');
    setTable(String(match.table ?? 1));
    setError(null);
  }

  async function save() {
    if (!match || !day) return;
    setBusy(true);
    setError(null);
    try {
      await editMatchSchedule(match.id, { table: Number(table), scheduledAt: day + 'T' + time });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer.Backdrop isOpen={!!match} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="sm:w-[26rem]" data-testid="tour-match-edit">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header className="border-b border-neutral-200 pb-4">
            <Drawer.Heading className="text-lg font-semibold">
              {match?.teamA.name} — {match?.teamB.name}
            </Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4 pt-5">
            <DateInput inline label="День" value={day} onChange={setDay} testId="tour-match-day" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] font-medium">Начало</span>
              {/* Русская локаль: 24 часа и подписи сегментов по-русски, как в «Игровых днях». */}
              <I18nProvider locale="ru-RU">
                <Clock label="Начало" value={time} onChange={setTime} testId="tour-match-time" />
              </I18nProvider>
            </div>
            <Picker
              label="Стол"
              showLabel
              value={table}
              options={Array.from({ length: tour.schedule.tables }, (_, i) => ({ id: String(i + 1), label: 'Стол ' + (i + 1) }))}
              onChange={setTable}
              testId="tour-match-table"
            />
            {error && (
              <p className="text-[13px] text-red-600" data-testid="tour-match-error">
                {error}
              </p>
            )}
          </Drawer.Body>
          <Drawer.Footer className="flex justify-end gap-2">
            <Button variant="tertiary" className="rounded-xl" onPress={onClose}>
              Отмена
            </Button>
            <Button variant="primary" className="rounded-xl" isDisabled={busy || !day} onPress={() => void save()} data-testid="tour-match-save">
              Сохранить
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

const COLUMNS: DataColumn<TeamMatch>[] = [
  { id: 'time', label: 'Время', sortValue: (m) => m.scheduledAt?.getTime() ?? null, render: (m) => when(m.scheduledAt) },
  { id: 'table', label: 'Стол', align: 'right', sortValue: (m) => m.table, render: (m) => m.table ?? '—' },
  { id: 'round', label: 'Круг', align: 'right', sortValue: (m) => m.roundNumber, render: (m) => m.roundNumber ?? '—' },
  {
    id: 'match',
    label: 'Встреча',
    rowHeader: true,
    sortValue: (m) => m.teamA.name,
    render: (m) => (
      <span className="font-medium">
        {m.teamA.name} — {m.teamB.name}
      </span>
    ),
  },
  { id: 'score', label: 'Счёт', align: 'right', sortable: false, render: score },
];

/** Пикселей на минуту в «Дне»: встреча 120 минут — блок 192 px. */
const PX = 1.6;

/** «День»: столбец на стол, блок встречи высотой в длительность, дни — стрелками. */
function DayGrid({ tour, toolbar, onOpen }: { tour: TourDetail; toolbar: ReactNode; onOpen?: (m: TeamMatch) => void }) {
  const { matches, schedule } = tour;
  const days = useMemo(
    () => [...new Set(matches.filter((m) => m.scheduledAt).map((m) => isoDay(m.scheduledAt!)))].sort(),
    [matches],
  );
  const [index, setIndex] = useState(0);
  const key = days[Math.min(index, days.length - 1)];
  const ofDay = matches.filter((m) => m.scheduledAt && m.table && isoDay(m.scheduledAt) === key);
  const hours = schedule.days.find((d) => d.date === key) ?? schedule.days[0];
  const at = (m: TeamMatch) => m.scheduledAt!.getHours() * 60 + m.scheduledAt!.getMinutes();
  const start = Math.min(minutesOf(hours?.start ?? '10:00'), ...ofDay.map(at));
  const end = Math.max(minutesOf(hours?.end ?? '18:00'), ...ofDay.map((m) => at(m) + schedule.matchMinutes));
  const marks = Array.from({ length: Math.floor((end - start) / 60) + 1 }, (_, i) => start + i * 60);
  const tables = Array.from({ length: schedule.tables }, (_, i) => i + 1);
  const title = key
    ? new Date(key + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—';

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="tour-schedule-day">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center gap-1">
          <Button isIconOnly size="sm" variant="ghost" aria-label="Предыдущий день" isDisabled={index <= 0} onPress={() => setIndex((i) => i - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Следующий день"
            isDisabled={index >= days.length - 1}
            onPress={() => setIndex((i) => i + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        <h2 className="m-0 text-[17px] font-semibold first-letter:uppercase">{title}</h2>
        <span className="text-[13px] text-neutral-500">Встреч: {ofDay.length}</span>
        <div className="flex-1" />
        {toolbar}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `4rem repeat(${tables.length}, minmax(13rem, 1fr))` }}>
          <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white" />
          {tables.map((t) => (
            <div
              key={t}
              className="sticky top-0 z-20 border-b border-l border-neutral-200 bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-wider text-neutral-500"
            >
              Стол {t}
            </div>
          ))}
          <div className="relative" style={{ height: (end - start) * PX }}>
            {marks.map((t) => (
              <span key={t} className="absolute right-2 text-[11px] tabular-nums text-neutral-500" style={{ top: (t - start) * PX }}>
                {pad(Math.floor(t / 60))}:{pad(t % 60)}
              </span>
            ))}
          </div>
          {tables.map((t) => (
            <div key={t} className="relative border-l border-neutral-200" style={{ height: (end - start) * PX }} data-testid="tour-day-table" data-table={t}>
              {marks.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-neutral-100" style={{ top: (h - start) * PX }} />
              ))}
              {ofDay
                .filter((m) => m.table === t)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!onOpen}
                    onClick={() => onOpen?.(m)}
                    className="absolute inset-x-1 flex flex-col gap-0.5 overflow-hidden rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5 text-left text-[12px] text-brand-900 enabled:hover:bg-brand-100"
                    style={{ top: (at(m) - start) * PX + 2, height: schedule.matchMinutes * PX - 4 }}
                    data-testid="tour-day-match"
                  >
                    <span className="tabular-nums text-brand-700">
                      {hhmm(m.scheduledAt!)} · круг {m.roundNumber ?? '—'}
                    </span>
                    <span className="font-semibold">{m.teamA.name}</span>
                    <span className="font-semibold">{m.teamB.name}</span>
                    {m.status === 'finished' && <span className="tabular-nums">{score(m)}</span>}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TourSchedule({ tour, view, onChanged }: { tour: TourDetail; view: TourScheduleView; onChanged: () => void }) {
  const s = tour.schedule;
  const [editing, setEditing] = useState<TeamMatch | null>(null);
  const params = useOverlayState();
  const [error, setError] = useState<string | null>(null);

  if (s.status === 'none') {
    return s.canEdit ? (
      <div className="h-full overflow-y-auto px-6 py-5">
        <ScheduleParams tour={tour} onBuilt={onChanged} submitLabel="Сформировать" />
      </div>
    ) : (
      <p className="p-6 text-[14px] text-neutral-500" data-testid="tour-schedule-empty">
        Расписания пока нет
      </p>
    );
  }

  const draft = s.status === 'draft';
  const open = draft && s.canEdit ? setEditing : undefined;

  async function finalize() {
    setError(null);
    try {
      await finalizeTourSchedule(tour.id);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      {error && <span className="text-[13px] text-red-600">{error}</span>}
      <Chip size="sm" variant="soft" color={draft ? 'warning' : 'success'} data-testid="tour-schedule-status">
        {draft ? 'Черновик' : 'Отправлено'}
      </Chip>
      {draft && s.canEdit && (
        <>
          <Button variant="outline" size="sm" className="rounded-xl" onPress={params.open} data-testid="tour-schedule-params-open">
            <SlidersHorizontal size={16} /> Параметры
          </Button>
          <AlertDialog>
            <Button variant="primary" size="sm" className="rounded-xl" data-testid="tour-schedule-finalize">
              <Send size={16} /> Отправить
            </Button>
            <AlertSheet className="rounded-xl" testId="tour-schedule-finalize-confirm">
              <AlertDialog.Header>
                <AlertDialog.Heading>Отправить расписание тура?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-[14px]">После отправки время и столы встреч не меняются.</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" className="rounded-xl">
                  Отмена
                </Button>
                <Button slot="close" variant="primary" className="rounded-xl" onPress={() => void finalize()}>
                  Отправить
                </Button>
              </AlertDialog.Footer>
            </AlertSheet>
          </AlertDialog>
        </>
      )}
    </div>
  );

  return (
    <>
      {view === 'day' ? (
        <DayGrid tour={tour} toolbar={toolbar} onOpen={open} />
      ) : (
        <DataTable
          ariaLabel={'Расписание тура ' + tour.number}
          testId="tour-schedule"
          rows={tour.matches}
          columns={COLUMNS}
          getId={(m) => String(m.id)}
          empty="Встреч нет"
          defaultSort={{ column: 'time', direction: 'ascending' }}
          actions={toolbar}
          onRowAction={open}
          rowProps={(m) => ({ 'data-testid': 'tour-schedule-row', 'data-table': String(m.table ?? ''), 'data-time': m.scheduledAt?.toISOString() ?? '' })}
        />
      )}
      <MatchEdit tour={tour} match={editing} onClose={() => setEditing(null)} onSaved={onChanged} />
      <Drawer.Backdrop isOpen={params.isOpen} onOpenChange={params.setOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="sm:w-[34rem]" data-testid="tour-schedule-params-drawer">
            <Drawer.CloseTrigger aria-label="Закрыть" />
            <Drawer.Header className="border-b border-neutral-200 pb-4">
              <Drawer.Heading className="text-lg font-semibold">Параметры расписания</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="pt-5">
              <ScheduleParams
                tour={tour}
                submitLabel="Сформировать заново"
                onBuilt={() => {
                  params.close();
                  onChanged();
                }}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
