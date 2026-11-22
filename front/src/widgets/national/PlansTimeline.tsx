'use client';

/* Доска планов подготовки ✳ (21.11.2026, образец владельца продукта — экран
   расписания Visitly; NATIONAL.md «Доска планов»). Строка на члена сборной,
   столбцы — дни окна (неделя или месяц), на строке — пункты его планов:
   работа на дне срока, сбор и старт — на датах мероприятия.

   Сетка — как у календаря кабинета: тонкие сплошные линии, выходные чуть
   темнее, сегодняшний день — номер в тёмном круге и подсветка столбца, линия
   «сейчас» поперёк. Цвет пункта — его вид (дополнительные цвета брендбука:
   работа — синий, сбор — бирюзовый, старт — фиолетовый), состояние — форма:
   запланировано — светлая заливка с полосой слева, идёт — сплошная заливка,
   выполнено — серое, просрочено — коралловый пунктир; пункт несогласованного
   плана обведён персиковым. Состояние считает сервер.

   Как в календаре ✳ (22.11.2026): щелчок по пустому дню или протягивание по
   дням строки — создание на выбранные дни (`BoardCreate`: пункт плана или
   новый план); работу можно растянуть за край — новые даты уходят на сервер
   (`useBoardDrag`). Щелчок по пункту — карточка: даты, вид, состояние плана,
   «Открыть план» и отметка «выполнено». HeroUI + Tailwind. */

import { Button, Popover, Spinner, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { Check, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AGE_GROUP_LABEL,
  fetchPlanBoard,
  movePlanItem,
  PLAN_ITEM_LABEL,
  PLAN_STATUS_LABEL,
  setPlanItemDone,
  useLoad,
  type AgeGroup,
  type BoardItem,
  type BoardRow,
  type PlanItemKind,
} from '@/entities/national';

import { BoardCreate, type CreateAt } from './BoardCreate';
import { MemberFace } from './RosterParts';
import { useBoardDrag } from './useBoardDrag';

type Scale = 'week' | 'month';

const DAY = 86400000;
const LANE = 40; // высота дорожки: блок 36 px и зазор
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(s + 'T00:00:00Z');
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const dayLabel = (s: string) => {
  const d = parse(s);
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
};
const rangeLabel = (a: string, b: string) => (a === b ? dayLabel(a) : dayLabel(a) + ' — ' + dayLabel(b));
const span = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / DAY) + 1;
const daysWord = (n: number) =>
  n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'день' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'дня' : 'дней');
const weekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

/** Окно: неделя с понедельника или календарный месяц, сдвиг `shift` шагов. */
function windowOf(today: Date, scale: Scale, shift: number) {
  if (scale === 'week') {
    const monday = addDays(today, -((today.getUTCDay() + 6) % 7) + shift * 7);
    return { from: monday, to: addDays(monday, 6) };
  }
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + shift, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  return { from: first, to: last };
}

/** Пункты строки по дорожкам: пересекающиеся во времени — на разных. */
function lanes(items: BoardItem[]) {
  const ends: string[] = [];
  return items.map((i) => {
    let lane = ends.findIndex((e) => e < i.startsOn);
    if (lane < 0) lane = ends.length;
    ends[lane] = i.endsOn;
    return { item: i, lane };
  });
}

/* Цвет вида — доп. цвета брендбука (`qtt-*` во входе Tailwind). Классы
   записаны целиком: Tailwind собирает только то, что видит в тексте. */
const PLANNED: Record<PlanItemKind, string> = {
  work: 'border-l-qtt-blue bg-[color-mix(in_srgb,var(--color-qtt-blue)_10%,white)] text-neutral-900',
  camp: 'border-l-qtt-teal bg-[color-mix(in_srgb,var(--color-qtt-teal)_10%,white)] text-neutral-900',
  start: 'border-l-qtt-violet bg-[color-mix(in_srgb,var(--color-qtt-violet)_10%,white)] text-neutral-900',
};
const LIVE: Record<PlanItemKind, string> = {
  work: 'border-l-qtt-blue bg-qtt-blue text-white',
  camp: 'border-l-qtt-teal bg-qtt-teal text-white',
  start: 'border-l-qtt-violet bg-qtt-violet text-white',
};
const SWATCH: Record<PlanItemKind, string> = { work: 'bg-qtt-blue', camp: 'bg-qtt-teal', start: 'bg-qtt-violet' };

function blockClass(item: BoardItem) {
  const unapproved = item.planStatus !== 'approved' && (item.state === 'planned' || item.state === 'live');
  const base =
    item.state === 'done'
      ? 'border-l-neutral-300 bg-neutral-100 text-neutral-500'
      : item.state === 'overdue'
        ? 'border border-dashed border-qtt-coral bg-[color-mix(in_srgb,var(--color-qtt-coral)_10%,white)] text-[color-mix(in_srgb,var(--color-qtt-coral)_70%,black)]'
        : item.state === 'live'
          ? LIVE[item.kind]
          : PLANNED[item.kind];
  return base + (unapproved ? ' ring-2 ring-inset ring-qtt-peach' : '');
}

const STATE_LABEL: Record<BoardItem['state'], string> = {
  done: 'Выполнено',
  live: 'Идёт',
  planned: 'Запланировано',
  overdue: 'Просрочено',
};
const STATE_DOT: Record<BoardItem['state'], string> = {
  done: 'bg-green-600',
  live: 'bg-qtt-blue',
  planned: 'bg-neutral-400',
  overdue: 'bg-qtt-coral',
};

function Legend() {
  const sw = 'inline-block size-2.5 rounded-[3px]';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
      {(['work', 'camp', 'start'] as PlanItemKind[]).map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <i className={sw + ' ' + SWATCH[k]} />
          {PLAN_ITEM_LABEL[k]}
        </span>
      ))}
      <span className="h-3 w-px bg-neutral-200" />
      <span className="flex items-center gap-1.5"><i className={sw + ' bg-neutral-200'} />Выполнено</span>
      <span className="flex items-center gap-1.5"><i className={sw + ' border border-dashed border-qtt-coral'} />Просрочено</span>
      <span className="flex items-center gap-1.5"><i className={sw + ' ring-2 ring-inset ring-qtt-peach'} />План не согласован</span>
    </div>
  );
}

/** Выделение протягиванием: пунктирная рамка на выбранных днях и их число. */
function Selection({ a, b, pct }: { a: string; b: string; pct: (s: string) => number }) {
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const left = pct(lo);
  const right = pct(iso(addDays(parse(hi), 1)));
  return (
    <div
      className="pointer-events-none absolute inset-y-1 z-[5] flex items-center justify-center rounded-md border-2 border-dashed border-brand-500 bg-brand-50/80 text-[11.5px] font-medium text-brand-700"
      style={{ left: `calc(${left}% + 3px)`, width: `calc(${right - left}% - 6px)` }}
      data-testid="plan-board-selection"
    >
      {daysWord(span(lo, hi))}
    </div>
  );
}

function ItemCard({ row, item, onOpenPlan, onChanged }: { row: BoardRow; item: BoardItem; onOpenPlan: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const dates = rangeLabel(item.startsOn, item.endsOn);
  async function toggle() {
    setBusy(true);
    try {
      await setPlanItemDone(item.id, item.state !== 'done');
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex w-80 flex-col gap-3" data-testid="plan-board-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Popover.Heading className="text-[15px] leading-snug font-semibold">{item.title}</Popover.Heading>
          <p className="flex items-center gap-1.5 text-[12px] text-neutral-500">
            <i className={'inline-block size-2 rounded-[2px] ' + SWATCH[item.kind]} />
            {row.member.person.name} · {PLAN_ITEM_LABEL[item.kind]}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-2 py-0.5 text-[11.5px]">
          <i className={'size-1.5 rounded-full ' + STATE_DOT[item.state]} />
          {STATE_LABEL[item.state]}
        </span>
      </div>
      <dl className="flex flex-col rounded-lg border border-neutral-200 text-[13px]">
        {[
          ['Даты', dates],
          ['План', PLAN_STATUS_LABEL[item.planStatus]],
          ...(item.city ? [['Где', item.city]] : []),
        ].map(([k, v], n) => (
          <div key={k} className={'flex items-center justify-between gap-3 px-3 py-2 ' + (n ? 'border-t border-neutral-200' : '')}>
            <dt className="text-neutral-500">{k}</dt>
            <dd className={'text-right font-medium ' + (k === 'План' && item.planStatus !== 'approved' ? 'text-[color-mix(in_srgb,var(--color-qtt-peach)_60%,black)]' : '')}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        <Button className="flex-1 rounded-lg" onPress={onOpenPlan} data-testid="plan-board-open">
          Открыть план <ExternalLink size={14} />
        </Button>
        {row.canMark && (
          <Button variant="tertiary" className="rounded-lg" isDisabled={busy} onPress={toggle} data-testid="plan-board-done">
            <Check size={14} /> {item.state === 'done' ? 'Снять отметку' : 'Выполнено'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function PlansTimeline({ onOpenPlan }: { onOpenPlan: (memberId: string) => void }) {
  const [scale, setScale] = useState<Scale>('week');
  const [shift, setShift] = useState(0);
  const [group, setGroup] = useState<AgeGroup | 'all'>('all');
  const [create, setCreate] = useState<CreateAt | null>(null);
  // Сегодня — по местному календарю: в ранние часы UTC ещё вчерашний.
  const today = useMemo(() => {
    const n = new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  }, []);
  const { from, to } = windowOf(today, scale, shift);
  const key = iso(from) + iso(to);
  const board = useLoad(() => fetchPlanBoard(iso(from), iso(to)), key);

  const days = Math.round((to.getTime() - from.getTime()) / DAY) + 1;
  const cols = Array.from({ length: days }, (_, i) => addDays(from, i));
  const gridCols = { gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` };
  const pct = (s: string) => ((parse(s).getTime() - from.getTime()) / DAY / days) * 100;
  const todayIso = iso(today);
  const nowPct = today >= from && today <= to ? (((today.getTime() - from.getTime()) / DAY + new Date().getHours() / 24) / days) * 100 : null;

  /* Растянутый пункт стоит на новых датах, пока доска не перечитана: запись
     привязана к ответу, на котором сделана, — новый ответ её снимает сам. */
  const [moved, setMoved] = useState<{ data: unknown; id: string; start: string; end: string } | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const { drag, trackProps } = useBoardDrag({
    from,
    days,
    onCreate: (row, start, end) => setCreate({ row, from: start, to: end }),
    onResize: async (item, start, end) => {
      setMoved({ data: board.data, id: item.id, start, end });
      setMoveError(null);
      try {
        await movePlanItem(item.id, start, end);
      } catch (e) {
        setMoveError((e as Error).message);
      }
      board.reload();
    },
  });
  /** Даты пункта на экране: идёт растягивание — его, только что растянут — новые. */
  const shownDates = (item: BoardItem) => {
    if (drag?.kind === 'resize' && drag.item.id === item.id) return { start: drag.start, end: drag.end };
    if (moved && moved.data === board.data && moved.id === item.id) return { start: moved.start, end: moved.end };
    return { start: item.startsOn, end: item.endsOn };
  };

  const all = board.data?.rows ?? [];
  const rows = group === 'all' ? all : all.filter((r) => r.member.ageGroup === group);

  const title = scale === 'week' ? dayLabel(iso(from)) + ' — ' + dayLabel(iso(to)) : MONTHS_NOM[from.getUTCMonth()] + ' ' + from.getUTCFullYear();
  /** Фон дня: сегодня — голубая подложка, выходные — серая. */
  const dayBg = (d: Date) => (iso(d) === todayIso ? 'bg-brand-50/70' : weekend(d) ? 'bg-neutral-50' : '');

  return (
    // От края до края рабочей области ✳ (21.11.2026): полей и рамки у доски нет.
    <div className="flex h-full min-h-0 flex-col overflow-y-auto" data-testid="plan-board">
      {/* Без заголовка и подписи ✳ (21.11.2026, решение владельца продукта):
          раздел назван в меню; период — у стрелок. Переключатели — HeroUI. */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 max-md:px-4">
        <div className="flex items-center gap-1">
          <Button isIconOnly size="sm" variant="tertiary" aria-label="Назад" onPress={() => setShift((s) => s - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setShift(0)} data-testid="plan-board-today">
            Сегодня
          </Button>
          <Button isIconOnly size="sm" variant="tertiary" aria-label="Вперёд" onPress={() => setShift((s) => s + 1)}>
            <ChevronRight size={16} />
          </Button>
          <span className="ml-2 text-[15px] font-semibold tabular-nums" data-testid="plan-board-period">
            {title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleButtonGroup
            size="sm"
            aria-label="Масштаб"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[scale]}
            onSelectionChange={(keys) => {
              const v = [...keys][0] as Scale | undefined;
              if (v) {
                setScale(v);
                setShift(0);
              }
            }}
          >
            <ToggleButton id="week" data-testid="plan-board-week">Неделя</ToggleButton>
            <ToggleButton id="month" data-testid="plan-board-month">Месяц</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            size="sm"
            aria-label="Группа"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[group]}
            onSelectionChange={(keys) => {
              const v = [...keys][0] as AgeGroup | 'all' | undefined;
              if (v) setGroup(v);
            }}
          >
            {(['all', 'cadet', 'junior', 'adult'] as const).map((g) => (
              <ToggleButton key={g} id={g}>
                {g === 'all' ? 'Все' : AGE_GROUP_LABEL[g]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>

      <section className="flex min-w-0 flex-col border-t border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-neutral-200 px-4 py-2.5">
          {moveError && (
            <span className="mr-auto text-[12px] text-red-600" data-testid="plan-board-move-error">
              {moveError}
            </span>
          )}
          <Legend />
        </div>
        <div className="overflow-x-auto">
          <div className={scale === 'week' ? 'min-w-[900px]' : 'min-w-[1300px]'}>
            {/* Шапка дней — как у календаря: день недели, число; сегодня — в круге. */}
            <div className="grid grid-cols-[15rem_minmax(0,1fr)] border-b border-neutral-200">
              <span className="flex items-end border-r border-neutral-200 px-4 pb-2 text-[11px] font-medium text-neutral-500">Спортсмен</span>
              <div className="grid" style={gridCols}>
                {cols.map((d) => {
                  const on = iso(d) === todayIso;
                  return (
                    <div key={iso(d)} className={'flex flex-col items-center gap-0.5 border-l border-neutral-100 py-1.5 ' + dayBg(d)}>
                      <span className={'text-[10.5px] font-medium uppercase ' + (on ? 'text-brand-600' : 'text-neutral-500')}>{WD[d.getUTCDay()]}</span>
                      <span
                        className={
                          'grid size-7 place-items-center rounded-full text-[13px] tabular-nums ' +
                          (on ? 'bg-brand-600 font-semibold text-white' : weekend(d) ? 'text-neutral-500' : 'text-neutral-800')
                        }
                        data-today={on || undefined}
                      >
                        {d.getUTCDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {!board.data ? (
              <div className="flex h-40 items-center justify-center">{board.error ? <span className="text-red-600">{board.error}</span> : <Spinner />}</div>
            ) : (
              <div className="relative">
                {nowPct !== null && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 left-60 z-20" aria-hidden>
                    <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-qtt-coral" style={{ left: nowPct + '%' }} data-testid="plan-board-now" />
                  </div>
                )}
                {rows.length === 0 && (
                  <p className="py-8 text-center text-[13px] text-neutral-500" data-testid="table-empty">
                    Спортсменов нет
                  </p>
                )}
                {rows.map((r) => {
                  const placed = lanes(r.items);
                  const laneCount = Math.max(1, ...placed.map((p) => p.lane + 1));
                  const canCreate = (r.plan && r.canAdd) || (!r.plan && r.canCreatePlan);
                  return (
                    <div key={r.member.id} className="grid grid-cols-[15rem_minmax(0,1fr)] border-b border-neutral-200 last:border-b-0" data-testid="plan-board-row" data-name={r.member.person.name}>
                      <button type="button" onClick={() => onOpenPlan(r.member.id)} className="flex items-center gap-2.5 border-r border-neutral-200 px-4 py-2 text-left hover:bg-neutral-50">
                        <MemberFace m={r.member} className="size-8" />
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-[13px] font-medium">{r.member.person.name}</span>
                          <span className="truncate text-[11px] text-neutral-500">
                            {AGE_GROUP_LABEL[r.member.ageGroup]}
                            {r.plan ? ' · ' + r.plan.done + ' из ' + r.plan.total : ''}
                          </span>
                        </span>
                      </button>
                      <div
                        {...trackProps(r, !!canCreate)}
                        className={'relative grid touch-none select-none ' + (drag?.rowId === r.member.id ? (drag.kind === 'resize' ? 'cursor-ew-resize' : 'cursor-copy') : '')}
                        style={{ ...gridCols, minHeight: laneCount * LANE + 8 + 'px' }}
                      >
                        {/* Клетки дней: щелчок или протягивание — создать (указатель
                            ведёт `useBoardDrag`); с клавиатуры — Enter на дне. */}
                        {cols.map((d) => (
                          <button
                            key={iso(d)}
                            type="button"
                            disabled={!canCreate}
                            onClick={(e) => e.detail === 0 && setCreate({ row: r, from: iso(d), to: iso(d) })}
                            aria-label={'Создать: ' + r.member.person.name + ', ' + dayLabel(iso(d))}
                            className={'border-l border-neutral-100 ' + dayBg(d) + (canCreate ? ' cursor-copy hover:bg-brand-50' : ' cursor-default')}
                            data-testid="plan-board-cell"
                            data-date={iso(d)}
                          />
                        ))}
                        {!r.plan && r.items.length === 0 && (
                          <p className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 truncate text-[12px] text-neutral-400" data-testid="plan-board-noplan">
                            Нет плана на этот период
                          </p>
                        )}
                        {/* Выделение протягиванием: дни будущего пункта. */}
                        {drag?.kind === 'create' && drag.rowId === r.member.id && (
                          <Selection a={drag.a} b={drag.b} pct={pct} />
                        )}
                        {placed.map(({ item, lane }) => {
                          const { start, end } = shownDates(item);
                          const left = Math.max(0, pct(start));
                          const right = Math.min(100, pct(iso(addDays(parse(end), 1))));
                          const resizing = drag?.kind === 'resize' && drag.item.id === item.id;
                          // Край за окном не тянется: его дня нет на экране.
                          const edges = item.canMove ? (['start', 'end'] as const).filter((k) => (k === 'start' ? start >= iso(from) : end <= iso(to))) : [];
                          return (
                            <div
                              key={item.id}
                              className={'group absolute h-9 ' + (resizing ? 'z-30' : 'z-10')}
                              style={{ left: `calc(${left}% + 3px)`, width: `calc(${right - left}% - 6px)`, top: 4 + lane * LANE + 'px' }}
                            >
                              <Popover>
                                <Popover.Trigger
                                  className={
                                    'flex size-full flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-2 text-left shadow-xs ' +
                                    blockClass(item) +
                                    (resizing ? ' shadow-md ring-2 ring-brand-500' : '')
                                  }
                                  data-testid="plan-board-item"
                                  data-state={item.state}
                                  data-start={start}
                                  data-end={end}
                                >
                                  <span className={'truncate text-[12px] leading-tight font-medium ' + (item.state === 'done' ? 'line-through' : '')}>{item.title}</span>
                                  <span className="truncate text-[10.5px] leading-tight opacity-75">
                                    {resizing ? rangeLabel(start, end) : PLAN_ITEM_LABEL[item.kind] + (item.city ? ' · ' + item.city : '')}
                                  </span>
                                </Popover.Trigger>
                                <Popover.Content placement="bottom" className="rounded-xl">
                                  <Popover.Dialog className="p-4">
                                    <ItemCard row={r} item={item} onOpenPlan={() => onOpenPlan(r.member.id)} onChanged={board.reload} />
                                  </Popover.Dialog>
                                </Popover.Content>
                              </Popover>
                              {/* Ручки краёв: видны при наведении, тянутся указателем. */}
                              {edges.map((k) => (
                                <span
                                  key={k}
                                  aria-hidden
                                  data-edge={k}
                                  data-item={item.id}
                                  data-testid={'plan-board-edge-' + k}
                                  className={
                                    'absolute inset-y-0 flex w-2.5 cursor-ew-resize items-center justify-center ' +
                                    (k === 'start' ? '-left-1' : '-right-1') +
                                    (resizing ? '' : ' opacity-0 group-hover:opacity-100')
                                  }
                                >
                                  <i className="h-4 w-1 rounded-full bg-white shadow-[0_0_0_1px_var(--color-neutral-400)]" />
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      <BoardCreate at={create} onClose={() => setCreate(null)} onDone={board.reload} />
    </div>
  );
}
