'use client';

/* «Рейтинг» профиля ✳ (22.11.2026, решения владельца продукта):

   - карточек последних матчей нет ✳ (22.11.2026, решение владельца продукта):
     встречи с соперниками — блок «Личные встречи» справа;
   - **график** Chart.js (`Line` кита, тот же, что в карточке рейтинга):
     значение после каждой записи, точка — цветом изменения, подсказка —
     турнир, соперник, счёт. Период — «3 мес · 6 мес · Год · Всё»
     (`ToggleButtonGroup` HeroUI); над графиком — наибольшее и наименьшее
     значение за период и изменение за него (последнее «стало» минус значение на
     начало периода).

   Отменённые записи не участвуют — значение карточки — сумма неотменённых. */

import { Spinner, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useState } from 'react';

import { dmy } from '@/entities/national';
import { num2, plainLabel, signed2, useRatingCard } from '@/entities/rating';
import { Line } from '@/shared/kit/app';

import { SectionHead } from './ui';

type Period = '3m' | '6m' | '1y' | 'all';
const PERIODS: { id: Period; label: string; months: number | null }[] = [
  { id: '3m', label: '3 мес', months: 3 },
  { id: '6m', label: '6 мес', months: 6 },
  { id: '1y', label: 'Год', months: 12 },
  { id: 'all', label: 'Всё', months: null },
];

const ruDate = (iso: string) => dmy(iso.slice(0, 10));

function since(months: number | null) {
  if (months === null) return '';
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <span className="flex flex-col">
      <span className="text-[11.5px] text-neutral-500">{label}</span>
      <span className={'text-[15px] font-semibold tabular-nums ' + (tone === 'up' ? 'text-green-700' : tone === 'down' ? 'text-red-600' : '')}>{value}</span>
    </span>
  );
}

export function RatingBlock({ userId, card }: { userId: string; card: ReturnType<typeof useRatingCard> }) {
  const [period, setPeriod] = useState<Period>('all');
  // Сервер отдаёт историю новыми вперёд и в порядке записи: у записей одного
  // турнира время одно, пересортировка по нему перемешала бы их.
  const history = (card.data?.history ?? []).filter((h) => !h.isReverted).slice().reverse();
  const from = since(PERIODS.find((p) => p.id === period)!.months);
  const shown = history.filter((h) => h.occurredAt.slice(0, 10) >= from);
  const points = shown.map((h) => ({
    t: ruDate(h.occurredAt),
    v: h.after,
    note: h.tournamentName ?? plainLabel(h.kindLabel),
    tone: h.delta > 0 ? ('up' as const) : h.delta < 0 ? ('down' as const) : undefined,
    lines: [
      ruDate(h.occurredAt),
      'рейтинг ' + num2(h.after) + (h.kind === 'start' ? '' : ' · ' + signed2(h.delta)),
      ...(h.opponentName ? [h.opponentName + (h.score ? ' · ' + h.score : '')] : []),
      ...(h.reason && h.kind !== 'start' ? [plainLabel(h.reason)] : []),
    ],
  }));
  const values = shown.map((h) => h.after);
  // Изменение за период — от значения на его начало; стартовая запись «было»
  // не имеет (0), от неё считаем от её «стало».
  const base = shown.length ? (shown[0].kind === 'start' ? shown[0].after : shown[0].before) : 0;
  const change = shown.length ? shown[shown.length - 1].after - base : 0;

  return (
    <section className="px-6 py-6" data-testid="profile-rating">
      <SectionHead
        title="Рейтинг"
        action={
          card.data && (
            <a href={`/rating/${userId}`} className="text-[13px] font-medium text-brand-600 hover:underline" data-testid="profile-rating-open">
              Вся история
            </a>
          )
        }
      />
      {card.loading ? (
        <Spinner size="sm" />
      ) : card.error ? (
        <p className="m-0 text-[13px] text-neutral-500">Рейтинговой карточки нет</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
            <div className="flex gap-8" data-testid="profile-rating-stats">
              <Stat label="Наибольший" value={values.length ? num2(Math.max(...values)) : '—'} />
              <Stat label="Наименьший" value={values.length ? num2(Math.min(...values)) : '—'} />
              <Stat label="За период" value={shown.length ? signed2(change) : '—'} tone={change > 0 ? 'up' : change < 0 ? 'down' : undefined} />
            </div>
            <ToggleButtonGroup
              size="sm"
              aria-label="Период"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[period]}
              onSelectionChange={(keys) => {
                const v = [...keys][0] as Period | undefined;
                if (v) setPeriod(v);
              }}
            >
              {PERIODS.map((p) => (
                <ToggleButton key={p.id} id={p.id} data-testid={'rating-period-' + p.id}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
          {points.length === 0 ? (
            <p className="m-0 py-10 text-center text-[13px] text-neutral-500">За период изменений нет</p>
          ) : (
            <div data-testid="profile-rating-chart" data-points={points.length}>
              <Line points={points} label="Рейтинг" height={220} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
