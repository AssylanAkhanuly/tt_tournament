/* Основная формула: §9 Положения, потолок изменения — §12. */

/** E = 1 / (1 + 10^((Rсоперника − Rспортсмена) / D)) — §9.3. */
export const expectedScore = (rating: number, opponent: number, D: number): number =>
  1 / (1 + Math.pow(10, (opponent - rating) / D));

export type DeltaInput = {
  rating: number;
  opponent: number;
  won: boolean;
  D: number;
  K: number;
  C: number;
  P: number;
  /** Потолок изменения за матч (§12.1); 0 — без потолка. */
  maxDelta: number;
};

/** Изменение рейтинга за матч: P × K × C × (S − E) — §9.2. */
export const matchDelta = ({ rating, opponent, won, D, K, C, P, maxDelta }: DeltaInput): number => {
  const S = won ? 1 : 0;
  const raw = P * K * C * (S - expectedScore(rating, opponent, D));
  if (!maxDelta) return raw;
  // §12.3: ограничение действует одинаково на рост и на падение.
  return Math.sign(raw) * Math.min(Math.abs(raw), maxDelta);
};
