'use client';

/* «Что показал прогон» — ради этого калибровка и нужна: не число рядом с
   фамилией, а поведение шкалы. Показатели считает сервер (`rating/analysis.py`)
   и присылает в ответе: это та же формула п. 9.3, и копия здесь разошлась бы с
   боевой. Экран только подаёт.

   Только числа ✳ (10.09.2026, решение владельца продукта): разбора словами —
   разброс, путь новичка, инфляция суммы — на экране нет, он в RATING.md,
   раздел 7. Остаётся одно предупреждение: матчи, которые не удалось учесть. */

import { signed2, type PreviewResult } from '@/entities/rating';
import type { ParamOverrides } from '@/features/rating-lab/types';
import { Panel, StatTiles } from '@/shared/kit/app';

const pct = (x: number) => Math.round(x * 100) + ' %';

export function FindingsPanel({
  result,
  params,
}: {
  result: PreviewResult | null;
  params: ParamOverrides | null;
}) {
  if (!result || !params) {
    return (
      <Panel title="Что показал прогон">
        <p className="py-4 text-[13px] text-neutral-500">Расчёта ещё нет.</p>
      </Panel>
    );
  }

  const { history, injected, skipped, insights } = result;
  const capped = history.filter((h) => h.capped).length;

  return (
    <Panel title="Что показал прогон">
      <StatTiles
        items={[
          { v: String(history.length / 2 || 0), k: 'матчей учтено' },
          { v: signed2(injected), k: 'изменение суммы рейтингов', tone: Math.abs(injected) > 1 ? 'a' : undefined },
          { v: String(capped), k: 'изменений обрезано потолком', tone: capped ? 'a' : undefined },
          { v: pct(insights.win_share_ms_over_kms), k: 'МС против КМС при этом D' },
        ]}
      />

      {!!skipped.length && (
        <p className="text-[13px] leading-snug text-amber-700">
          Не учтено матчей: {skipped.length}. {skipped.map((s) => s.reason).join('; ')}.
        </p>
      )}
    </Panel>
  );
}
