/* Стартовый рейтинг: §6.1 (новый), §6.3 (перенос прежнего), §17 (из ITTF). */

import { round2 } from './round';

/** §6.1: спортсмену без подтверждённой рейтинговой истории — 1,00. */
export const newPlayerRating = (): number => 1;

/** §6.3: прежнее значение переносится один к одному, без коэффициентов. */
export const fromLegacyRating = (legacy: number): number => round2(legacy);

/** §17.4: R = Rmax − k × ln(N), округление до двух знаков (§17.5),
    нижняя граница 1,00 (§17.6). */
export const fromIttfPosition = (position: number, { rMax, k }: { rMax: number; k: number }): number => {
  if (!Number.isFinite(position) || position < 1) return 1;
  return Math.max(1, round2(rMax - k * Math.log(position)));
};
