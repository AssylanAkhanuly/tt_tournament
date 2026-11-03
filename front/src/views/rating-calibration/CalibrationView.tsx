'use client';

/* Калибровка национального рейтинга ✳ (10.09.2026, снята 11.09.2026,
   возвращена в новом виде 03.11.2026 — решения владельца продукта).

   Шесть коэффициентов Положение называет и не задаёт. Экран один: черновик
   коэффициентов строками по группам, у каждого — формула в подсказке.
   «Прогона» на выдуманном наборе и панели «Ожидаемая доля побед» нет
   ✳ (03.11.2026, решения владельца продукта). «Сохранить» внизу делает
   черновик действующим. Пояснений на экране нет — они в RATING.md и
   QUESTIONS.md §5. */

import { ParamsActions, ParamsForm, useCalibration } from '@/features/rating-calibration';
import { RatingShell } from '@/views/rating';
import { useChairmanOnly } from '@/views/rating/useChairmanOnly';

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
        <div className="w-full max-w-4xl border border-neutral-200 bg-white px-5 py-5">
          <ParamsForm lab={lab} canEdit />
        </div>
      )}
    </RatingShell>
  );
}
