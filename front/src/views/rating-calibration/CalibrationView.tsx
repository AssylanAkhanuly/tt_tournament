'use client';

/* Калибровка национального рейтинга ✳ (10.09.2026, снята 11.09.2026,
   возвращена в новом виде 03.11.2026 — решения владельца продукта).

   Шесть коэффициентов Положение называет и не задаёт. Экран один: черновик
   коэффициентов строками по группам (у каждого — формула в подсказке), рядом —
   ожидаемая доля побед при этих числах; считает сервер той же формулой п. 9.3.
   «Прогона» на выдуманном наборе нет ✳ (03.11.2026, решение владельца
   продукта). «Сохранить» внизу делает черновик действующим. Пояснений на
   экране нет — они в RATING.md и QUESTIONS.md §5. */

import { ParamsActions, ParamsForm, useCalibration } from '@/features/rating-calibration';
import { RatingShell } from '@/views/rating';
import { useChairmanOnly } from '@/views/rating/useChairmanOnly';
import { Insights } from '@/widgets/rating-calibration';

export function CalibrationView() {
  const allowed = useChairmanOnly('/rating/calibration');
  const lab = useCalibration();
  const ready = allowed && !!lab.params.draft;

  return (
    <RatingShell active="Калибровка" actions={ready ? <ParamsActions lab={lab} /> : undefined}>
      {allowed && lab.params.error && (
        <p role="alert" className="mb-4 text-[13px] text-red-600">
          Коэффициенты не загрузились: {lab.params.error}
        </p>
      )}
      {ready && (
        <div className="@container">
          <div className="grid items-start gap-8 @min-[64rem]:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <div className="min-w-0 border border-neutral-200 bg-white px-5 py-5">
              <ParamsForm lab={lab} canEdit />
            </div>
            <div className="min-w-0 border border-neutral-200 bg-white px-5 py-5">
              <Insights insights={lab.insights} />
              {lab.insightsError && (
                <p role="alert" className="mt-3 text-[13px] text-red-600">
                  {lab.insightsError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </RatingShell>
  );
}
