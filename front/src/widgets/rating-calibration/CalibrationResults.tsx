'use client';

/* Что значат коэффициенты калибровки ✳ (03.11.2026): ожидаемая доля побед и
   путь новичка до КМС при черновике. Посчитал сервер (`POST
   /api/rating/preview/`, `insights`), здесь только показ — строками
   «поле — значение». */

import type { ReactNode } from 'react';

import type { PreviewInsights } from '@/entities/rating';

const pct = (x: number) => (x * 100).toFixed(1).replace('.', ',') + ' %';
/** Что выбранные коэффициенты значат на практике (п. 9.3). */
export function Insights({ insights }: { insights: PreviewInsights | null }) {
  const rows: [string, ReactNode][] = insights
    ? [
        ['Мастер спорта (50,00) над КМС (40,00)', pct(insights.win_share_ms_over_kms)],
        ['Сильнейший при разрыве 5 баллов', pct(insights.win_share_gap_5)],
        ['Сильнейший при разрыве 20 баллов', pct(insights.win_share_gap_20)],
        ['Побед подряд от 1,00 до КМС', insights.matches_new_to_kms ?? 'не доходит'],
      ]
    : [];
  return (
    <section data-testid="calibration-insights">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Ожидаемая доля побед</h2>
      <dl className="m-0 text-[14px]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-neutral-100 py-2.5 last:border-b-0">
            <dt className="text-neutral-600">{label}</dt>
            <dd className="m-0 font-semibold tabular-nums" data-testid="insight">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
