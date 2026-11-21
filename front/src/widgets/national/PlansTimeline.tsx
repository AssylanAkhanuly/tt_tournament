'use client';

/* Доска планов подготовки ✳ (21.11.2026, образец владельца продукта — экран
   расписания Visitly; NATIONAL.md «Доска планов»). Строка на члена сборной,
   столбцы — дни окна (неделя или месяц), на строке — пункты его планов:
   работа на дне срока, сбор и старт — на датах мероприятия. Состояние пункта
   (выполнено / идёт / запланировано / просрочено) считает сервер; пункт плана,
   который ещё не согласован, обведён жёлтым. Над строками — сводка: всё ли в
   срок. Линия «сегодня» поперёк. Щелчок по пункту — карточка: даты, вид,
   состояние плана, «Открыть план» и отметка «выполнено» (кому можно — решает
   сервер, `canMark`). HeroUI + Tailwind. */

import { Button, Popover, Spinner, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { Check, ChevronLeft, ChevronRight, CircleAlert, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AGE_GROUP_LABEL,
  fetchPlanBoard,
  PLAN_ITEM_LABEL,
  PLAN_STATUS_LABEL,
  setPlanItemDone,
  useLoad,
  type AgeGroup,
  type BoardItem,
  type BoardRow,
} from '@/entities/national';

type Scale = 'week' | 'month';

const DAY = 86400000;
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

const BLOCK: Record<BoardItem['state'], string> = {
  done: 'border-neutral-200 bg-neutral-100 text-neutral-500',
  live: 'border-neutral-900 bg-neutral-900 text-white',
  planned: 'border-neutral-300 bg-white text-neutral-800',
  overdue: 'border-dashed border-red-400 bg-red-50 text-red-700',
};
const STATE_LABEL: Record<BoardItem['state'], string> = {
  done: 'Выполнено',
  live: 'Идёт',
  planned: 'Запланировано',
  overdue: 'Просрочено',
};

function Legend() {
  const sw = 'inline-block size-2.5 border';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] tracking-wide text-neutral-500 uppercase">
      <span className="flex items-center gap-1.5"><i className={sw + ' border-neutral-300 bg-white'} />Запланировано</span>
      <span className="flex items-center gap-1.5"><i className={sw + ' border-neutral-900 bg-neutral-900'} />Идёт</span>
      <span className="flex items-center gap-1.5"><i className={sw + ' border-neutral-200 bg-neutral-100'} />Выполнено</span>
      <span className="flex items-center gap-1.5"><i className={sw + ' border-dashed border-red-400 bg-red-50'} />Просрочено</span>
      <span className="flex items-center gap-1.5"><i className={sw + ' border-amber-400 bg-white'} />План не согласован</span>
    </div>
  );
}

function ItemCard({ row, item, onOpenPlan, onChanged }: { row: BoardRow; item: BoardItem; onOpenPlan: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const dates = item.startsOn === item.endsOn ? dayLabel(item.startsOn) : dayLabel(item.startsOn) + ' — ' + dayLabel(item.endsOn);
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
          <p className="text-[12px] text-neutral-500">
            {row.member.person.name} · {PLAN_ITEM_LABEL[item.kind]}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-2 py-0.5 text-[11.5px]">
          <i
            className={
              'size-1.5 rounded-full ' +
              (item.state === 'done' ? 'bg-green-600' : item.state === 'overdue' ? 'bg-red-600' : item.state === 'live' ? 'bg-neutral-900' : 'bg-neutral-400')
            }
          />
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
            <dd className={'text-right font-medium ' + (k === 'План' && item.planStatus !== 'approved' ? 'text-amber-700' : '')}>{v}</dd>
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
  const today = useMemo(() => parse(iso(new Date())), []);
  const { from, to } = windowOf(today, scale, shift);
  const key = iso(from) + iso(to);
  const board = useLoad(() => fetchPlanBoard(iso(from), iso(to)), key);

  const days = Math.round((to.getTime() - from.getTime()) / DAY) + 1;
  const cols = Array.from({ length: days }, (_, i) => addDays(from, i));
  const pct = (s: string) => ((parse(s).getTime() - from.getTime()) / DAY / days) * 100;
  const todayPct = today >= from && today <= to ? ((today.getTime() - from.getTime()) / DAY + 0.5) / days * 100 : null;

  const all = board.data?.rows ?? [];
  const rows = group === 'all' ? all : all.filter((r) => r.member.ageGroup === group);
  const overdue = rows.flatMap((r) => r.items.filter((i) => i.state === 'overdue').map((i) => ({ r, i })));
  const totalItems = rows.reduce((n, r) => n + r.items.length, 0);

  const title = scale === 'week' ? dayLabel(iso(from)) + ' — ' + dayLabel(iso(to)) : MONTHS_NOM[from.getUTCMonth()] + ' ' + from.getUTCFullYear();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-6 py-5 max-md:px-4" data-testid="plan-board">
      {/* Без заголовка и подписи ✳ (21.11.2026, решение владельца продукта):
          раздел назван в меню; период — у стрелок. Переключатели — HeroUI. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <section className="flex min-w-0 flex-col border border-neutral-200 bg-neutral-50">
        <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-2">
          <Legend />
        </div>
        <div className="overflow-x-auto border-t border-neutral-200 bg-white">
          <div className={scale === 'week' ? 'min-w-[900px]' : 'min-w-[1300px]'}>
            {/* Шапка дней */}
            <div className="grid grid-cols-[14rem_minmax(0,1fr)] border-b border-neutral-200 text-[10.5px] tracking-wide text-neutral-500 uppercase">
              <span className="border-r border-neutral-200 px-3 py-2">Спортсмен · план</span>
              <div className="relative grid" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
                {cols.map((d) => {
                  const on = iso(d) === iso(today);
                  return (
                    <span key={iso(d)} className={'border-l border-neutral-100 px-1.5 py-2 text-center ' + (on ? 'font-semibold text-neutral-900' : '')}>
                      {scale === 'week' ? WD[d.getUTCDay()] + ' ' + d.getUTCDate() : d.getUTCDate()}
                    </span>
                  );
                })}
              </div>
            </div>

            {!board.data ? (
              <div className="flex h-40 items-center justify-center">{board.error ? <span className="text-red-600">{board.error}</span> : <Spinner />}</div>
            ) : (
              <div className="relative">
                {todayPct !== null && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 left-56 z-10" aria-hidden>
                    <div className="absolute inset-y-0 w-px bg-neutral-900" style={{ left: todayPct + '%' }} data-testid="plan-board-now" />
                  </div>
                )}
                {/* Сводка: всё ли в срок */}
                <div className="grid grid-cols-[14rem_minmax(0,1fr)] border-b border-neutral-200 bg-neutral-50/60">
                  <div className="flex items-center gap-2.5 border-r border-neutral-200 px-3 py-3">
                    {overdue.length ? (
                      <CircleAlert size={18} className="text-red-600" />
                    ) : (
                      <span className="grid size-7 place-items-center rounded-md bg-green-50 text-green-700"><Check size={15} /></span>
                    )}
                    <span className="flex flex-col leading-tight">
                      <span className={'text-[13px] font-semibold ' + (overdue.length ? 'text-red-700' : 'text-green-700')} data-testid="plan-board-summary">
                        {overdue.length ? 'Просрочено: ' + overdue.length : 'Всё в срок'}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {totalItems - overdue.length} из {totalItems} пунктов
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center px-3 py-2">
                    <p className="w-full truncate rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-[12px] text-neutral-600">
                      {overdue.length
                        ? overdue.slice(0, 4).map(({ r, i }) => r.member.person.name + ' — ' + i.title).join(' · ')
                        : 'Нет просроченных пунктов'}
                    </p>
                  </div>
                </div>

                {rows.length === 0 && (
                  <p className="py-8 text-center text-[13px] text-neutral-500" data-testid="table-empty">
                    Спортсменов нет
                  </p>
                )}
                {rows.map((r) => {
                  const placed = lanes(r.items);
                  const laneCount = Math.max(1, ...placed.map((p) => p.lane + 1));
                  return (
                    <div key={r.member.id} className="grid grid-cols-[14rem_minmax(0,1fr)] border-b border-neutral-200" data-testid="plan-board-row" data-name={r.member.person.name}>
                      <button type="button" onClick={() => onOpenPlan(r.member.id)} className="flex items-center gap-2.5 border-r border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-200 text-[12px] font-semibold text-neutral-700">
                          {r.member.person.name.slice(0, 1)}
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-[13px] font-medium">{r.member.person.name}</span>
                          <span className="truncate text-[10.5px] tracking-wide text-neutral-500 uppercase">
                            {AGE_GROUP_LABEL[r.member.ageGroup]}
                            {r.plan ? ' · ' + r.plan.done + '/' + r.plan.total : ''}
                          </span>
                        </span>
                      </button>
                      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))`, minHeight: laneCount * 46 + 8 + 'px' }}>
                        {cols.map((d) => (
                          <span key={iso(d)} className="border-l border-dashed border-neutral-100" />
                        ))}
                        {!r.plan && r.items.length === 0 && (
                          <p className="absolute inset-x-3 top-1/2 -translate-y-1/2 truncate rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-[12px] text-neutral-500" data-testid="plan-board-noplan">
                            Нет плана на этот период
                          </p>
                        )}
                        {placed.map(({ item, lane }) => {
                          const left = Math.max(0, pct(item.startsOn));
                          const right = Math.min(100, pct(iso(addDays(parse(item.endsOn), 1))));
                          const unapproved = item.planStatus !== 'approved' && item.state !== 'done' && item.state !== 'overdue';
                          return (
                            <Popover key={item.id}>
                              <Popover.Trigger
                                className={
                                  'absolute flex h-10 flex-col justify-center overflow-hidden rounded-md border px-2 text-left ' +
                                  BLOCK[item.state] +
                                  (unapproved ? ' border-amber-400' : '')
                                }
                                style={{ left: `calc(${left}% + 3px)`, width: `calc(${right - left}% - 6px)`, top: 4 + lane * 46 + 'px' }}
                                data-testid="plan-board-item"
                                data-state={item.state}
                              >
                                <span className="truncate text-[12px] leading-tight font-medium">{item.title}</span>
                                <span className="truncate font-mono text-[10.5px] leading-tight opacity-75">
                                  {PLAN_ITEM_LABEL[item.kind]}
                                  {item.city ? ' · ' + item.city : ''}
                                </span>
                              </Popover.Trigger>
                              <Popover.Content placement="bottom" className="rounded-xl">
                                <Popover.Dialog className="p-4">
                                  <ItemCard row={r} item={item} onOpenPlan={() => onOpenPlan(r.member.id)} onChanged={board.reload} />
                                </Popover.Dialog>
                              </Popover.Content>
                            </Popover>
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
    </div>
  );
}
