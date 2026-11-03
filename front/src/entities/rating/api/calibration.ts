/* Калибровка ✳ (восстановлена 03.11.2026): действующие коэффициенты.
   Читаются всеми, правит председатель ГСК. Ручка предпросчёта на сервере
   осталась, экран её больше не зовёт ✳ (03.11.2026). */

import { n, request } from './http';
import type { RatingParams } from './types';

const toParams = (raw: Record<string, unknown>): RatingParams => ({
  id: n(raw.id),
  name: String(raw.name ?? ''),
  d: n(raw.d),
  kStandard: n(raw.k_standard),
  kTransition: n(raw.k_transition),
  transitionMatches: n(raw.transition_matches),
  maxDelta: n(raw.max_delta),
  capInTransition: Boolean(raw.cap_in_transition),
  cTop: n(raw.c_top),
  cRepublic: n(raw.c_republic),
  cRegion: n(raw.c_region),
  cAmateur: n(raw.c_amateur),
  pFirst: n(raw.p_first),
  pSecond: n(raw.p_second),
  pThird: n(raw.p_third),
  prizeMode: raw.prize_mode as RatingParams['prizeMode'],
  baseline: raw.baseline as RatingParams['baseline'],
  minRating: n(raw.min_rating),
  ittfRMax: n(raw.ittf_r_max),
  ittfK: n(raw.ittf_k),
  updatedAt: String(raw.updated_at ?? ''),
  sources: (raw.sources ?? {}) as RatingParams['sources'],
});

/** Действующие коэффициенты вместе с происхождением каждого числа. */
export async function fetchRatingParams(): Promise<RatingParams> {
  return toParams(await request<Record<string, unknown>>('/params/'));
}

/** Сделать набор действующим. Имена полей — как у сервера (`k_standard`…). */
export async function saveRatingParams(patch: Record<string, unknown>): Promise<RatingParams> {
  return toParams(
    await request<Record<string, unknown>>('/params/', { method: 'PATCH', body: JSON.stringify(patch) }),
  );
}
