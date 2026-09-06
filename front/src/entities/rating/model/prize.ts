/* Коэффициент за призовое место P — §10 Положения. */

const P_BY_PLACE: Record<number, number> = { 1: 1.2, 2: 1.15, 3: 1.1 };

/** §10.3–10.5. При отсутствии матча за 3-е место бронзовых двое (§10.4). */
export const prizeFactor = (
  place: number | undefined,
  opts: { noThirdPlaceMatch?: boolean } = {},
): number => {
  if (!place) return 1;
  if (opts.noThirdPlaceMatch && place === 4) return 1.1;
  return P_BY_PLACE[place] ?? 1;
};
