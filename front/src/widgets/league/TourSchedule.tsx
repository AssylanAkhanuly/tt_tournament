'use client';

/* «Расписание» тура Лиги ✳ (19.11.2026, решение владельца продукта: «как у
   обычного турнира»; LEAGUE.md «Расписание тура»). Пока расписания нет —
   параметры (столов, минут на встречу, игровые дни — `PlayDays` турнира) и
   «Сформировать». Черновик и отправленное — два вида (подпункты в сайдбаре,
   `?view=day`): «Список» — встречи по времени (время, стол, круг, встреча,
   счёт) и «День» — по образцу владельца продукта: полоса дней сверху, столы
   колонками с числом встреч, шкала часов и линия «сейчас», встреча — карточка
   цвета своего круга высотой в длительность. В черновике строка или блок открывают правку стола и времени
   (занятый стол, занятую команду и занятого судью отбивает сервер), в полосе — «Параметры»
   (сформировать заново) и «Отправить» с подтверждением; отправленное — только
   смотреть. Что можно — решает сервер (`schedule.canEdit`). HeroUI + Tailwind. */

import { AlertDialog, Button, Chip, Drawer, I18nProvider, Input, Label, TextField, useOverlayState } from '@heroui/react';
import { Send, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  buildTourSchedule,
  editMatchSchedule,
  finalizeTourSchedule,
  type TeamMatch,
  type TourDetail,
  type TourPlayDay,
} from '@/entities/league';
import { Clock, PlayDays, toneAt } from '@/features/tournament-schedule';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { DateInput } from '@/shared/ui/DateInput';
import { AlertSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';
import { SideContent, SideDialog } from '@/shared/ui/SidePanel';

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
  const [referee, setReferee] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  // Открылась другая встреча — черновик правки с её значений.
  if (match && match.id !== shown) {
    setShown(match.id);
    setDay(match.scheduledAt ? isoDay(match.scheduledAt) : null);
    setTime(match.scheduledAt ? hhmm(match.scheduledAt) : '10:00');
    setTable(String(match.table ?? 1));
    setReferee(match.referee?.id ?? null);
    setError(null);
  }

  async function save() {
    if (!match || !day) return;
    setBusy(true);
    setError(null);
    try {
      await editMatchSchedule(match.id, { table: Number(table), scheduledAt: day + 'T' + time, refereeId: referee });
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
      <SideContent>
        <SideDialog className="sm:w-[26rem]" data-testid="tour-match-edit">
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
            <Picker
              label="Судья стола"
              showLabel
              value={referee}
              options={tour.schedule.referees.map((r) => ({ id: r.id, label: r.name }))}
              onChange={setReferee}
              testId="tour-match-referee"
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
        </SideDialog>
      </SideContent>
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
  { id: 'referee', label: 'Судья', sortValue: (m) => m.referee?.name ?? null, render: (m) => m.referee?.name ?? '—' },
  { id: 'score', label: 'Счёт', align: 'right', sortable: false, render: score },
];

/** Пикселей на минуту в «Дне»: встреча 120 минут — карточка 192 px. */
const PX = 1.6;

/** Дни полосы сверху: игровые дни расписания и дни встреч, по порядку. */
function stripDays(tour: TourDetail): string[] {
  const keys = new Set(tour.schedule.days.map((d) => d.date));
  tour.matches.forEach((m) => m.scheduledAt && keys.add(isoDay(m.scheduledAt)));
  return [...keys].sort();
}

/** Слова имени без служебных меток вроде «[demo]»: фамилия — первое. */
const words = (name: string) => name.split(/\s+/).filter((w) => /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(w));


/** Линия «сейчас» поперёк столов — только в сегодняшнем дне ✳, как в календаре. */
function NowLine({ start, end }: { start: number; end: number }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const at = now.getHours() * 60 + now.getMinutes();
  if (at < start || at > end) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-red-500"
      style={{ top: (at - start) * PX }}
      data-testid="tour-day-now"
    >
      <span className="absolute -left-14 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-4 tabular-nums text-white">
        {hhmm(now)}
      </span>
    </div>
  );
}

/** Карточка встречи цвета круга: команды, «10:00 › 12:00», метки — круг,
 *  судья, счёт. Значков нет (решение владельца продукта 20.11.2026). */
function MatchCard({ match, minutes, top, onOpen }: { match: TeamMatch; minutes: number; top: number; onOpen?: (m: TeamMatch) => void }) {
  const tone = toneAt((match.roundNumber ?? 1) - 1);
  const from = match.scheduledAt!;
  const to = new Date(from.getTime() + minutes * 60_000);
  const done = match.status === 'finished';
  const details = [
    hhmm(from) + ' › ' + hhmm(to),
    match.teamA.name + ' — ' + match.teamB.name,
    'круг ' + (match.roundNumber ?? '—'),
    match.referee ? 'судья ' + match.referee.name : '',
    done ? 'счёт ' + score(match) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  // Короткая встреча (меньше ~55 минут на шкале) — одна строка: время и пара;
  // остальное — в подсказке, иначе метки обрезаются краем карточки.
  if (minutes * PX < 90) {
    return (
      <button
        type="button"
        disabled={!onOpen}
        onClick={() => onOpen?.(match)}
        title={details}
        className={'absolute inset-x-1.5 flex items-center gap-2 overflow-hidden rounded-lg border px-2 text-left text-[12px] transition enabled:hover:shadow-md ' + tone.block}
        style={{ top: top + 2, height: minutes * PX - 4 }}
        data-testid="tour-day-match"
      >
        <span className="shrink-0 tabular-nums opacity-80">{hhmm(from)}</span>
        <span className="min-w-0 truncate font-semibold">
          {match.teamA.name} — {match.teamB.name}
        </span>
        {done && <span className="ml-auto shrink-0 font-semibold tabular-nums">{score(match)}</span>}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={!onOpen}
      onClick={() => onOpen?.(match)}
      className={
        'absolute inset-x-1.5 flex flex-col gap-1.5 overflow-hidden rounded-xl border p-2.5 text-left shadow-xs transition enabled:hover:shadow-md ' +
        tone.block
      }
      style={{ top: top + 3, height: minutes * PX - 6 }}
      title={details}
      data-testid="tour-day-match"
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-semibold leading-tight">{match.teamA.name}</span>
        <span className="truncate text-[13px] font-semibold leading-tight">{match.teamB.name}</span>
      </span>
      <span className="text-[12px] tabular-nums opacity-80">
        {hhmm(from)} › {hhmm(to)}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        <span className={'rounded-md px-1.5 py-0.5 text-[11px] font-medium ' + tone.chip}>Круг {match.roundNumber ?? '—'}</span>
        {match.referee && (
          <span className={'rounded-md px-1.5 py-0.5 text-[11px] font-medium ' + tone.chip} title={match.referee.name}>
            Судья: {words(match.referee.name)[0] ?? match.referee.name}
          </span>
        )}
        {done && <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">{score(match)}</span>}
      </span>
    </button>
  );
}

/** «День» ✳ (19.11.2026, образец владельца продукта): полоса дней сверху —
 *  день недели и число, выбранный подсвечен, у дня — число встреч; столбец на
 *  стол с числом встреч в шапке; шкала часов слева, линия «сейчас» в
 *  сегодняшнем дне; встреча — карточка цвета своего круга высотой в
 *  длительность. */
function DayGrid({ tour, toolbar, onOpen }: { tour: TourDetail; toolbar: ReactNode; onOpen?: (m: TeamMatch) => void }) {
  const { matches, schedule } = tour;
  const days = useMemo(() => stripDays(tour), [tour]);
  const [picked, setPicked] = useState<string | null>(null);
  const key = picked && days.includes(picked) ? picked : (days.find((d) => matches.some((m) => m.scheduledAt && isoDay(m.scheduledAt) === d)) ?? days[0]);
  const ofDay = matches.filter((m) => m.scheduledAt && m.table && isoDay(m.scheduledAt) === key);
  const hours = schedule.days.find((d) => d.date === key) ?? schedule.days[0];
  const at = (m: TeamMatch) => m.scheduledAt!.getHours() * 60 + m.scheduledAt!.getMinutes();
  const start = Math.min(minutesOf(hours?.start ?? '10:00'), ...ofDay.map(at));
  const end = Math.max(minutesOf(hours?.end ?? '18:00'), ...ofDay.map((m) => at(m) + schedule.matchMinutes));
  const marks = Array.from({ length: Math.floor((end - start) / 60) + 1 }, (_, i) => start + i * 60);
  const tables = Array.from({ length: schedule.tables }, (_, i) => i + 1);
  const count = (d: string) => matches.filter((m) => m.scheduledAt && isoDay(m.scheduledAt) === d).length;
  const today = isoDay(new Date());

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="tour-schedule-day">
      {/* Полоса дней — как у образца: день недели и число, выбранный — тёмная плашка. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-6 py-2.5">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Игровые дни">
          {days.map((d) => {
            const date = new Date(d + 'T12:00:00');
            const on = d === key;
            const n = count(d);
            return (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPicked(d)}
                className={
                  'relative flex w-16 shrink-0 flex-col items-center rounded-xl px-2 py-1.5 transition ' +
                  (on ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100')
                }
                data-testid="tour-day-tab"
                data-day={d}
              >
                <span className="text-[11px] font-medium capitalize opacity-80">
                  {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                </span>
                <span className="text-[18px] font-semibold leading-tight tabular-nums">{date.getDate()}</span>
                {n > 0 && (
                  <span
                    className={
                      'absolute right-1 top-1 grid min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold leading-4 ' +
                      (on ? 'bg-white text-brand-700' : 'bg-brand-500 text-white')
                    }
                  >
                    {n}
                  </span>
                )}
                {d === today && !on && <span className="absolute bottom-0.5 size-1 rounded-full bg-red-500" aria-label="сегодня" />}
              </button>
            );
          })}
        </div>
        {toolbar}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `4.5rem repeat(${tables.length}, minmax(15rem, 1fr))` }}>
          {/* Шапка: подпись колонки времени и столы с числом встреч. */}
          <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Столы
          </div>
          {tables.map((t) => (
            <div
              key={t}
              className="sticky top-0 z-20 flex items-baseline justify-center gap-1.5 border-b border-l border-neutral-200 bg-white px-3 py-3"
            >
              <span className="text-[14px] font-semibold">Стол {t}</span>
              <span className="text-[12px] tabular-nums text-neutral-400">{ofDay.filter((m) => m.table === t).length}</span>
            </div>
          ))}

          <div className="relative" style={{ height: (end - start) * PX }}>
            {marks.map((t) => (
              <span key={t} className="absolute right-3 -translate-y-1/2 text-[11px] tabular-nums text-neutral-400 first:translate-y-0" style={{ top: (t - start) * PX }}>
                {pad(Math.floor(t / 60))}:{pad(t % 60)}
              </span>
            ))}
          </div>
          {tables.map((t, k) => (
            <div key={t} className="relative border-l border-neutral-200" style={{ height: (end - start) * PX }} data-testid="tour-day-table" data-table={t}>
              {marks.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-dashed border-neutral-200" style={{ top: (h - start) * PX }} />
              ))}
              {key === today && k === 0 && (
                <div className="absolute inset-y-0 left-0" style={{ width: `calc(${tables.length * 100}% + ${tables.length - 1}px)` }}>
                  <NowLine start={start} end={end} />
                </div>
              )}
              {ofDay
                .filter((m) => m.table === t)
                .map((m) => (
                  <MatchCard key={m.id} match={m} minutes={schedule.matchMinutes} top={(at(m) - start) * PX} onOpen={onOpen} />
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
        <SideContent>
          <SideDialog className="sm:w-[34rem]" data-testid="tour-schedule-params-drawer">
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
          </SideDialog>
        </SideContent>
      </Drawer.Backdrop>
    </>
  );
}
