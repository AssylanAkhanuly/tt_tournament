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

   Источник — рейтинговая карточка (неотменённые записи); других матчей
   система не знает. Три месяца и полгода — окна наши. */

import type { ReactNode } from 'react';

import type { NationalMember } from '@/entities/national';
import { num2, signed2, type RatingEntry, type useRatingCard } from '@/entities/rating';

import { CARD, Spark } from './ui';

const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const MONTH = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function Kpi({ label, value, note, testId, children }: { label: string; value: ReactNode; note: ReactNode; testId: string; children: ReactNode }) {
  return (
    <div className={CARD + ' gap-1 p-5'} data-testid={testId}>
      <span className="text-[13px] font-medium text-neutral-500">{label}</span>
      <span className="text-[28px] leading-tight font-bold tabular-nums">{value}</span>
      <span className="text-[12.5px] text-neutral-500">{note}</span>
      <div className="mt-3 flex h-10 items-end">{children}</div>
    </div>
  );
}

const Up = ({ v }: { v: number }) => (
  <span className={'font-semibold ' + (v > 0 ? 'text-green-700' : v < 0 ? 'text-red-600' : 'text-neutral-500')}>
    {v > 0 ? '↑ ' : v < 0 ? '↓ ' : ''}
    {signed2(v)}
  </span>
);

export function Kpis({ member, card }: { member: NationalMember; card: ReturnType<typeof useRatingCard> }) {
  // Сервер отдаёт историю новыми вперёд; здесь — от старых к новым.
  const history: RatingEntry[] = (card.data?.history ?? [])
    .filter((h) => !h.isReverted)
    .slice()
    .reverse();
  const matches = history.filter((h) => h.kind === 'match');
  const r = card.data?.profile;
  const from3 = monthsAgo(3).toISOString().slice(0, 10);
  const before3 = history.filter((h) => h.occurredAt.slice(0, 10) < from3).at(-1);
  const rating = member.person.rating ? Number(member.person.rating) : null;
  const change3 = rating !== null && history.length ? rating - (before3 ? before3.after : history[0].kind === 'start' ? history[0].after : history[0].before) : 0;
  const months = Array.from({ length: 6 }, (_, i) => monthsAgo(5 - i));
  const perMonth = months.map((m) => matches.filter((h) => h.occurredAt.slice(0, 7) === ym(m)).length);
  const top = Math.max(1, ...perMonth);
  const wins = r?.wins ?? 0;
  const losses = r?.losses ?? 0;
  const share = wins + losses ? Math.round((wins / (wins + losses)) * 100) : null;
  const last = matches.slice(-10);

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
      >
        <Spark values={history.slice(-24).map((h) => h.after)} stroke="stroke-brand-500" fill="fill-brand-500/10" />
      </Kpi>
      <Kpi label="Матчей" value={r ? r.matchesPlayed : '—'} note={'за 3 мес — ' + matches.filter((h) => h.occurredAt.slice(0, 10) >= from3).length} testId="kpi-matches">
        <div className="grid h-full w-full grid-cols-6 items-end gap-1.5">
          {perMonth.map((n, i) => (
            <span key={i} className="flex h-full flex-col justify-end" title={MONTH[months[i].getMonth()] + ': ' + n}>
              <span
                className={'block rounded-t-[3px] ' + (n ? 'bg-qtt-violet' : 'bg-neutral-100')}
                style={{
                  height: n ? `${Math.max(12, (n / top) * 100)}%` : '12%',
                }}
              />
            </span>
          ))}
        </div>
      </Kpi>
      <Kpi label="Доля побед" value={share === null ? '—' : share + ' %'} note={`${wins} побед · ${losses} поражений`} testId="kpi-share">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-100" aria-hidden>
          {wins + losses > 0 && (
            <>
              <span className="bg-qtt-teal" style={{ width: `${(wins / (wins + losses)) * 100}%` }} />
              <span className="bg-[color-mix(in_srgb,var(--color-qtt-coral)_55%,white)]" style={{ width: `${(losses / (wins + losses)) * 100}%` }} />
            </>
          )}
        </div>
      </Kpi>
      <Kpi label="Форма" value={last.length ? `${last.filter((h) => h.won).length} из ${last.length}` : '—'} note="победы в последних матчах" testId="kpi-form">
        <div className="grid w-full grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, i) => {
            const m = last[i - (10 - last.length)];
            return (
              <span
                key={i}
                title={m ? (m.opponentName ?? '') + (m.score ? ' · ' + m.score : '') : undefined}
                className={'h-6 rounded-[4px] ' + (!m ? 'bg-neutral-100' : m.won ? 'bg-green-500' : 'bg-[color-mix(in_srgb,var(--color-qtt-coral)_70%,white)]')}
                data-testid={m ? 'form-cell' : undefined}
                data-won={m ? (m.won ? 'yes' : 'no') : undefined}
              />
            );
          })}
        </div>
      </Kpi>
    </div>
  );
}
