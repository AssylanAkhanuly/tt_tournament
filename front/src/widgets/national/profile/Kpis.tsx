'use client';

/* Карточки показателей профиля ✳ (22.11.2026, образец владельца продукта
   Athlitiq — «очки за игру» с изменением и мини-линией): четыре карточки в
   ряд — подпись, число крупно, строка-пояснение и маленький график своего
   цвета брендбука:

   - **Рейтинг** — значение, изменение за три месяца, линия значения после
     каждой записи (последние 24);
   - **Матчей** — всего рейтинговых, сколько за три месяца, столбики по
     месяцам за полгода;
   - **Доля побед** — процент, победы : поражения, полоса победы/поражения;
   - **Форма** — побед в последних десяти матчах, клетки исходов (старые слева).

   График — **фон карточки** ✳ (27.11.2026, решение владельца продукта:
   «Chart.js, фоном каждой обёртки»): холст Chart.js во всю ширину нижней части
   карточки, без осей и подсказок, текст поверх (`KpiBackdrop`). Шкала у каждого
   графика с запасом сверху — линия и столбики держатся в нижней половине и под
   цифры не заходят. Доля побед — линия доли побед после каждого матча, форма —
   столбики последних десяти матчей (победа выше, поражение ниже).

   Источник — рейтинговая карточка (неотменённые записи); других матчей
   система не знает. Три месяца и полгода — окна наши. */

import type { ReactNode } from 'react';

import { num2, signed2, type RatingEntry, type useRatingCard } from '@/entities/rating';

import { KpiBackdrop, type Backdrop } from './KpiBackdrop';
import { CARD } from './ui';

const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function Kpi({ label, value, note, testId, chart }: { label: string; value: ReactNode; note: ReactNode; testId: string; chart: Backdrop }) {
  return (
    <div className={CARD + ' relative min-h-40 gap-1 overflow-hidden p-5'} data-testid={testId}>
      <KpiBackdrop chart={chart} label={label} />
      <span className="relative text-[13px] font-medium text-neutral-500">{label}</span>
      <span className="relative text-[28px] leading-tight font-bold tabular-nums">{value}</span>
      <span className="relative text-[12.5px] text-neutral-500">{note}</span>
    </div>
  );
}

const Up = ({ v }: { v: number }) => (
  <span className={'font-semibold ' + (v > 0 ? 'text-green-700' : v < 0 ? 'text-red-600' : 'text-neutral-500')}>
    {v > 0 ? '↑ ' : v < 0 ? '↓ ' : ''}
    {signed2(v)}
  </span>
);

/** `rating` — текущее значение (у члена сборной — из строки состава, у спортсмена — из карточки). */
export function Kpis({ rating, card }: { rating: number | null; card: ReturnType<typeof useRatingCard> }) {
  // Сервер отдаёт историю новыми вперёд; здесь — от старых к новым.
  const history: RatingEntry[] = (card.data?.history ?? [])
    .filter((h) => !h.isReverted)
    .slice()
    .reverse();
  const matches = history.filter((h) => h.kind === 'match');
  const r = card.data?.profile;
  const from3 = monthsAgo(3).toISOString().slice(0, 10);
  const before3 = history.filter((h) => h.occurredAt.slice(0, 10) < from3).at(-1);
  const change3 = rating !== null && history.length ? rating - (before3 ? before3.after : history[0].kind === 'start' ? history[0].after : history[0].before) : 0;
  const months = Array.from({ length: 6 }, (_, i) => monthsAgo(5 - i));
  const perMonth = months.map((m) => matches.filter((h) => h.occurredAt.slice(0, 7) === ym(m)).length);
  const wins = r?.wins ?? 0;
  const losses = r?.losses ?? 0;
  const share = wins + losses ? Math.round((wins / (wins + losses)) * 100) : null;
  const last = matches.slice(-10);
  // Доля побед после каждого матча — линия фона «Доли побед».
  const shareLine = matches.map((_, i) => (matches.slice(0, i + 1).filter((m) => m.won).length / (i + 1)) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4" data-testid="profile-kpis">
      <Kpi
        label="Рейтинг"
        value={rating !== null ? num2(rating) : '—'}
        note={
          <>
            <Up v={change3} /> за 3 мес
          </>
        }
        testId="kpi-rating"
        chart={{ kind: 'line', values: history.slice(-24).map((h) => h.after), color: '--color-brand-500' }}
      />
      <Kpi
        label="Матчей"
        value={r ? r.matchesPlayed : '—'}
        note={'за 3 мес — ' + matches.filter((h) => h.occurredAt.slice(0, 10) >= from3).length}
        testId="kpi-matches"
        chart={{ kind: 'bars', values: perMonth, color: '--color-qtt-violet' }}
      />
      <Kpi
        label="Доля побед"
        value={share === null ? '—' : share + ' %'}
        note={`${wins} побед · ${losses} поражений`}
        testId="kpi-share"
        chart={{ kind: 'line', values: shareLine, color: '--color-qtt-teal', min: 0, max: 100 }}
      />
      <Kpi
        label="Форма"
        value={last.length ? `${last.filter((h) => h.won).length} из ${last.length}` : '—'}
        note="победы в последних матчах"
        testId="kpi-form"
        chart={{ kind: 'form', results: last.map((h) => !!h.won) }}
      />
    </div>
  );
}
