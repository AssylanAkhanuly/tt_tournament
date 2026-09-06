/* Неявка без уважительной причины — §15.4–15.6; нижняя граница — §15.15. */

import { round2 } from './round';

/** Размер снижения по счёту неявки: первая, повторная, каждая последующая. */
export const noShowPenalty = (occurrence: number): number => {
  if (occurrence <= 0) return 0;
  if (occurrence === 1) return 0.2;
  if (occurrence === 2) return 0.3;
  return 0.5;
};

/** §15.15: рейтинговое значение не может быть отрицательным. */
export const applyNoShow = (rating: number, occurrence: number): number =>
  Math.max(0, round2(rating - noShowPenalty(occurrence)));
