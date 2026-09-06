/* Следствия из параметров: что выбранные D, K и потолок значат на практике.

   Это не расчёт рейтинга, а его чтение: сколько побед подряд нужно новичку,
   чтобы догнать свой уровень, и какую долю встреч выигрывает более сильный при
   выбранном D. Считается здесь, а не на экране, — экран только показывает. */

import { expectedScore, matchDelta } from './elo';
import type { RatingParams } from './params';
import { round2 } from './round';

/** Ожидаемая доля побед сильного над слабым при выбранном масштабе D (§9.3). */
export const winShare = (strong: number, weak: number, D: number): number => expectedScore(strong, weak, D);

/** Сколько побед подряд над соперниками уровня `level` нужно, чтобы дойти от
    `from` до `level`. null — при таких параметрах не доходит никогда. */
export const matchesToLevel = ({
  from,
  level,
  params,
  limit = 400,
}: {
  from: number;
  level: number;
  params: RatingParams;
  limit?: number;
}): number | null => {
  let rating = round2(from);
  for (let n = 0; n < limit; n++) {
    if (rating >= level) return n;
    const transition = n < params.transitionMatches;
    const K = transition ? params.kTransition : params.kStandard;
    const cap = !params.maxDelta || (transition && !params.capInTransition) ? 0 : params.maxDelta;
    const delta = round2(
      matchDelta({ rating, opponent: level, won: true, D: params.D, K, C: 1, P: 1, maxDelta: cap }),
    );
    if (delta <= 0) return null;
    rating = round2(rating + delta);
  }
  return null;
};
