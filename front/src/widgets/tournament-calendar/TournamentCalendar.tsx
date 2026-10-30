'use client';

/* Календарь турниров — сетка месяца ✳ (28.10.2026). HeroUI + Tailwind.

   Сетка без обёртки и занимает всю рабочую область: шесть недель делят её
   высоту поровну (решение владельца продукта). Турнир стоит в клетке дня
   начала, цвет метки — статус; по клику — карточка подробностей рядом. Турниры
   без даты в сетку не попадают и идут полосой под ней: иначе они бы молча
   пропали. Сегодняшняя клетка подсвечена, а поперёк неё — линия «сейчас» ✳
   (29.10.2026, решение владельца продукта): высота в клетке — доля
   прошедших суток, как красная линия в Google Календаре. Не влезают турниры
   дня — как в Google Календаре: в клетке столько, сколько помещается, последняя
   строка — «Ещё N», по ней — карточка дня со всеми турнирами (`DayMore`). */

import { Button, ButtonGroup, CloseButton, Popover } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

import {
  TournamentFacts,
  tournamentDate,
  type TournamentStatus,
  type TournamentSummary,
} from '@/entities/tournament';

import { dayKey, monthGrid } from './grid';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const STATUS_TONE: Record<TournamentStatus, string> = {
  open: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  in_progress: 'bg-green-50 text-green-700 hover:bg-green-100',
  finished: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
};

const STATUS_DOT: Record<TournamentStatus, string> = {
  open: 'bg-blue-600',
  in_progress: 'bg-green-600',
  finished: 'bg-neutral-400',
};

/** Линия «сейчас» в сегодняшней клетке: доля прошедших суток, сдвигается раз в
 *  минуту; слева на ней — значок с текущим временем. Щелчкам не мешает — по ней
 *  проходят к турнирам. */
function NowLine() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const part = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
  return (
    <div
      aria-hidden
      data-testid="calendar-now"
      className="pointer-events-none absolute inset-x-0 z-10 h-0.5 -translate-y-1/2 bg-red-500"
      // Значок высотой 16 px не уходит за край клетки ни в полночь, ни в 23:59.
      style={{ top: `clamp(8px, ${part * 100}%, calc(100% - 8px))` }}
    >
      <span
        data-testid="calendar-now-time"
        className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-4 tabular-nums text-white"
      >
        {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

/** Строк-турниров в клетке: сколько помещается под числом дня. Меряется по
 *  живой клетке и первой метке, поэтому переживает и смену размера окна, и
 *  смену шрифта. */
function useRowsPerCell(grid: RefObject<HTMLDivElement | null>) {
  const [rows, setRows] = useState(3);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const measure = () => {
      const cell = el.querySelector<HTMLElement>('[role="gridcell"]');
      if (!cell) return;
      const style = getComputedStyle(cell);
      const gap = parseFloat(style.rowGap) || 4;
      const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const head = cell.querySelector('[data-day-number]')?.getBoundingClientRect().height ?? 24;
      const chip = el.querySelector<HTMLElement>('[data-testid="calendar-tournament"]')?.offsetHeight || 20;
      const free = cell.clientHeight - pad - head;
      setRows(Math.max(1, Math.floor(free / (chip + gap))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid]);
  return rows;
}

/** «Ещё N» — карточка дня со всеми турнирами, как у Google Календаря: день
 *  недели, число, список; турнир из списка открывает свою карточку. */
function DayMore({
  date,
  items,
  hidden,
  onOpen,
}: {
  date: Date;
  items: TournamentSummary[];
  hidden: number;
  onOpen: (id: string) => void;
}) {
  return (
    <Popover>
      <Popover.Trigger
        data-testid="calendar-more"
        className="w-full shrink-0 cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[12px] font-medium text-neutral-700 hover:bg-neutral-100"
      >
        Ещё {hidden}
      </Popover.Trigger>
      <Popover.Content placement="bottom" className="w-64 rounded-xl">
        <Popover.Dialog data-testid="calendar-day" className="relative p-3">
          <CloseButton slot="close" aria-label="Закрыть" className="absolute right-2 top-2" />
          <div className="mb-3 flex flex-col items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {WEEKDAYS[(date.getDay() + 6) % 7]}
            </span>
            <Popover.Heading className="text-2xl font-medium tabular-nums">{date.getDate()}</Popover.Heading>
          </div>
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {items.map((t) => (
              <TournamentEvent key={t.id} t={t} onOpen={onOpen} />
            ))}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monthTitle = (d: Date) =>
  capital(d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', ''));

/** Турнир в клетке дня. По клику — карточка подробностей рядом с ним, как у
 *  событий в Google Календаре (образец владельца продукта, 28.10.2026):
 *  `Popover` из HeroUI, закрывается крестиком, кликом мимо и Esc. «Подробнее»
 *  ведёт на страницу турнира — куда именно, решает экран (`onOpen`). */
function TournamentEvent({ t, onOpen }: { t: TournamentSummary; onOpen: (id: string) => void }) {
  return (
    <Popover>
      <Popover.Trigger
        data-testid="calendar-tournament"
        data-status={t.status}
        title={t.name}
        className={
          'w-full shrink-0 cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[12px] font-medium ' +
          STATUS_TONE[t.status]
        }
      >
        {t.name}
      </Popover.Trigger>
      <Popover.Content placement="right top" className="w-[26rem] rounded-xl">
        <Popover.Dialog data-testid="tournament-details" className="p-5">
          <div className="flex justify-end">
            <CloseButton slot="close" aria-label="Закрыть" />
          </div>
          <div className="flex gap-4">
            {/* Точка в колонке шириной со значок строк ниже — колонки совпадают. */}
            <span className="flex w-[18px] shrink-0 justify-center pt-2">
              <span className={'h-3.5 w-3.5 rounded ' + STATUS_DOT[t.status]} />
            </span>
            <div className="min-w-0">
              <Popover.Heading className="text-xl font-semibold leading-snug">{t.name}</Popover.Heading>
              <p className="mt-0.5 text-[14px] text-neutral-600">
                {t.startsAt ? tournamentDate(t.startsAt) : 'Без даты'}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <TournamentFacts t={t} />
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" size="sm" className="rounded-xl" onPress={() => onOpen(t.id)}>
              Подробнее
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function TournamentCalendar({
  tournaments,
  onOpen,
  toolbar,
  today = new Date(),
}: {
  tournaments: TournamentSummary[];
  /** «Подробнее» в карточке турнира. */
  onOpen: (id: string) => void;
  /** Кнопки экрана справа в шапке календаря («Новый турнир»). */
  toolbar?: ReactNode;
  today?: Date;
}) {
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const grid = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const todayKey = dayKey(today);
  const gridRef = useRef<HTMLDivElement>(null);
  const rows = useRowsPerCell(gridRef);

  const byDay = useMemo(() => {
    const map = new Map<string, TournamentSummary[]>();
    for (const t of tournaments) {
      if (!t.startsAt) continue;
      const k = dayKey(t.startsAt);
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return map;
  }, [tournaments]);
  const undated = tournaments.filter((t) => !t.startsAt);

  const step = (months: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + months, 1));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-3">
        <h2 className="text-xl font-semibold tracking-tight" data-testid="calendar-month">
          {monthTitle(cursor)}
        </h2>
        <div className="flex items-center gap-3">
          <ButtonGroup variant="outline" size="sm">
            <Button isIconOnly aria-label="Предыдущий месяц" onPress={() => step(-1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button onPress={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Сегодня</Button>
            <Button isIconOnly aria-label="Следующий месяц" onPress={() => step(1)}>
              <ChevronRight size={16} />
            </Button>
          </ButtonGroup>
          {toolbar}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-neutral-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {d}
          </div>
        ))}
      </div>

      <div
        ref={gridRef}
        className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6"
        role="grid"
        aria-label={monthTitle(cursor)}
      >
        {grid.map(({ date, inMonth }) => {
          const k = dayKey(date);
          const items = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          // Не влезают все — последняя строка уходит под «Ещё N».
          const shown = items.length > rows ? items.slice(0, rows - 1) : items;
          return (
            <div
              key={k}
              role="gridcell"
              data-day={k}
              data-today={isToday || undefined}
              aria-current={isToday ? 'date' : undefined}
              className={
                'relative flex min-h-0 min-w-0 flex-col gap-1 overflow-hidden border-b border-r border-neutral-100 p-1.5 [&:nth-child(7n)]:border-r-0 ' +
                (isToday ? 'bg-blue-50/40 ring-2 ring-inset ring-blue-500' : inMonth ? 'bg-white' : 'bg-neutral-50')
              }
            >
              {isToday && <NowLine />}
              <span
                data-day-number
                className={
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] tabular-nums ' +
                  (isToday
                    ? 'bg-blue-600 font-semibold text-white'
                    : inMonth
                      ? 'text-neutral-700'
                      : 'text-neutral-400')
                }
              >
                {date.getDate()}
              </span>
              {shown.map((t) => (
                <TournamentEvent key={t.id} t={t} onOpen={onOpen} />
              ))}
              {shown.length < items.length && (
                <DayMore date={date} items={items} hidden={items.length - shown.length} onOpen={onOpen} />
              )}
            </div>
          );
        })}
      </div>

      {undated.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-neutral-200 px-6 py-2">
          <span className="shrink-0 text-[12px] font-semibold text-neutral-500">Без даты: {undated.length}</span>
          {undated.map((t) => (
            <div key={t.id} className="w-48 shrink-0">
              <TournamentEvent t={t} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
