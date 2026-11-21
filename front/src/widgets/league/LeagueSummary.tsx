'use client';

/* «Лиги» сезона — строки-сводки ✳ (21.11.2026, решение владельца продукта:
   вариант «Summary rows that expand» из разбора каркаса, без колонки проблем).
   Строка на лигу: название и команд, полоска туров (сегмент на тур, цвет —
   состояние, решает сервер `tour_state`), ближайший тур — красным, если у него
   проблема. Щелчок по строке раскрывает туры лиги: город и дата, состояние или
   проблема, «Открыть» — на страницу тура; «Открыть лигу» — на страницу лиги.
   Сегментов — не меньше четырёх (туров за сезон по ТЗ §4.10) или по самой
   длинной лиге; незаведённые — пустые. Без обёрток: строки от края до края.
   HeroUI + Tailwind. */

import { Button } from '@heroui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { GENDER_LABEL, type DivisionListItem, type SeasonTour, type TourState } from '@/entities/league';

const SEG: Record<TourState | 'empty', string> = {
  done: 'bg-green-500',
  live: 'bg-brand-500',
  ready: 'bg-brand-300',
  draft: 'bg-amber-400',
  planned: 'bg-neutral-300',
  issue: 'bg-red-500',
  empty: 'bg-neutral-100',
};

const LABEL: Record<TourState, string> = {
  done: 'Сыграно',
  live: 'Идёт',
  ready: 'Расписание отправлено',
  draft: 'Черновик расписания',
  planned: 'Без расписания',
  issue: '',
};

const day = (iso: string | null) => (iso ? iso.split('-').reverse().join('.').slice(0, 5) : '—');
const stateText = (t: SeasonTour) => (t.state === 'issue' ? t.problem : LABEL[t.state]);
const teamsWord = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return n + ' команда';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return n + ' команды';
  return n + ' команд';
};

function Row({
  league,
  segments,
  open,
  onToggle,
  onOpenLeague,
  onOpenTour,
}: {
  league: DivisionListItem;
  segments: number;
  open: boolean;
  onToggle: () => void;
  onOpenLeague: () => void;
  onOpenTour: (tourId: string) => void;
}) {
  const tours = league.tours ?? [];
  const next = tours.find((t) => t.state !== 'done');
  const slots = Array.from({ length: segments }, (_, i) => tours.find((t) => t.number === i + 1) ?? null);
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="grid cursor-pointer grid-cols-[minmax(10rem,1fr)_minmax(12rem,1.6fr)_minmax(8rem,0.8fr)] items-center gap-4 border-b border-neutral-200 px-6 py-3 hover:bg-neutral-50 max-md:grid-cols-[1fr_auto] max-md:px-4"
        data-testid="league-row"
        data-name={league.name}
      >
        <span className="flex min-w-0 items-center gap-2">
          {open ? <ChevronDown size={15} className="shrink-0 text-neutral-500" /> : <ChevronRight size={15} className="shrink-0 text-neutral-500" />}
          <span className="min-w-0 truncate">
            <span className="text-[14px] font-medium">{league.name}</span>
            <span className="text-[12.5px] text-neutral-500">
              {' · '}
              {GENDER_LABEL[league.gender].toLowerCase()} · {teamsWord(league.teamsCount)}
            </span>
          </span>
        </span>
        <span className="flex gap-1 max-md:hidden" aria-label="Туры">
          {slots.map((t, i) => (
            <span
              key={i}
              title={t ? 'Тур ' + t.number + ' · ' + stateText(t) : 'Тур ' + (i + 1) + ' · не заведён'}
              className={'h-2 flex-1 rounded-sm ' + SEG[t ? t.state : 'empty']}
              data-testid="league-tour-seg"
              data-state={t ? t.state : 'empty'}
            />
          ))}
        </span>
        <span
          className={'text-right text-[13px] tabular-nums md:text-left ' + (next?.state === 'issue' ? 'font-semibold text-red-600' : 'text-neutral-600')}
          data-testid="league-next"
        >
          {next ? 'Тур ' + next.number + ' · ' + day(next.startsOn) : '—'}
        </span>
      </div>
      {open && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-2 max-md:px-4" data-testid="league-tours">
          {tours.length === 0 && <p className="py-2 text-[13px] text-neutral-500">Туров нет</p>}
          {tours.map((t) => (
            <div key={t.id} className="grid grid-cols-[4.5rem_1fr_1.4fr_auto] items-center gap-3 py-1.5 text-[13px]" data-testid="league-tour-row">
              <span className="font-medium">Тур {t.number}</span>
              <span className="truncate text-neutral-600">
                {t.city || '—'} · {day(t.startsOn)}
              </span>
              <span className={t.state === 'issue' ? 'font-semibold text-red-600' : 'text-neutral-700'}>{stateText(t)}</span>
              <Button size="sm" variant="ghost" className="rounded-xl" onPress={() => onOpenTour(t.id)}>
                Открыть
              </Button>
            </div>
          ))}
          <div className="flex justify-end pt-1">
            <Button size="sm" variant="tertiary" className="rounded-xl" onPress={onOpenLeague} data-testid="league-open">
              Открыть лигу
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function LeagueSummary({
  leagues,
  actions,
  onOpenLeague,
  onOpenTour,
}: {
  leagues: DivisionListItem[];
  /** Кнопки справа в полосе над строками («Новая лига»). */
  actions?: ReactNode;
  onOpenLeague: (divisionId: string) => void;
  onOpenTour: (tourId: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const segments = Math.max(4, ...leagues.map((l) => Math.max(0, ...(l.tours ?? []).map((t) => t.number))));
  // Мужчины, потом женщины; внутри — по уровню.
  const rows = [...leagues].sort((a, b) => (a.gender === b.gender ? a.level - b.level : a.gender === 'm' ? -1 : 1));
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="season-leagues">
      <div className="flex shrink-0 items-center justify-end gap-2 px-6 py-3 max-md:px-4">{actions}</div>
      <div className="grid grid-cols-[minmax(10rem,1fr)_minmax(12rem,1.6fr)_minmax(8rem,0.8fr)] gap-4 border-y border-neutral-200 bg-neutral-100 px-6 py-2 text-[12px] font-medium text-neutral-500 max-md:hidden">
        <span>Лига</span>
        <span>Туры</span>
        <span>Ближайший</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <p className="py-6 text-center text-[13px] text-neutral-500" data-testid="table-empty">
            Лиг нет
          </p>
        )}
        {rows.map((l) => (
          <Row
            key={l.id}
            league={l}
            segments={segments}
            open={open.has(l.id)}
            onToggle={() => toggle(l.id)}
            onOpenLeague={() => onOpenLeague(l.id)}
            onOpenTour={onOpenTour}
          />
        ))}
      </div>
    </div>
  );
}
