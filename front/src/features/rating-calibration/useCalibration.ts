'use client';

/* Состояние калибровки ✳ (восстановлена 03.11.2026): черновик коэффициентов.
   «Прогона» на выдуманном наборе нет ✳ (03.11.2026, решение владельца продукта).

   Черновик стартует с действующих коэффициентов — калибровка это «а что если
   подвинуть вот от этого». Что значат числа (ожидаемая доля побед, путь
   новичка до КМС) считает сервер той же формулой п. 9.3: экран шлёт черновик в
   ручку предпросчёта без спортсменов и берёт из ответа `insights`.
   «Сохранить» делает черновик действующим (только председатель ГСК, сервер
   проверит). */

import { useCallback, useMemo, useState } from 'react';

import { saveRatingParams, usePreview, useRatingParams, type CompetitionLevel, type RatingParams } from '@/entities/rating';

/** Черновик коэффициентов. Имена — как у движка и ручки предпросчёта. */
export type ParamDraft = {
  d: number;
  k_standard: number;
  k_transition: number;
  transition_matches: number;
  max_delta: number;
  cap_in_transition: boolean;
  prize_mode: RatingParams['prizeMode'];
  baseline: RatingParams['baseline'];
  ittf_r_max: number;
  ittf_k: number;
  level_c: Record<CompetitionLevel, number>;
  prize_p: Record<'1' | '2' | '3', number>;
};

export const draftOf = (p: RatingParams): ParamDraft => ({
  d: p.d,
  k_standard: p.kStandard,
  k_transition: p.kTransition,
  transition_matches: p.transitionMatches,
  max_delta: p.maxDelta,
  cap_in_transition: p.capInTransition,
  prize_mode: p.prizeMode,
  baseline: p.baseline,
  ittf_r_max: p.ittfRMax,
  ittf_k: p.ittfK,
  level_c: { top: p.cTop, republic: p.cRepublic, region: p.cRegion, amateur: p.cAmateur },
  prize_p: { '1': p.pFirst, '2': p.pSecond, '3': p.pThird },
});

/** Черновик → поля сервера (`PATCH /api/rating/params/`). */
const patchOf = (d: ParamDraft) => ({
  d: d.d,
  k_standard: d.k_standard,
  k_transition: d.k_transition,
  transition_matches: d.transition_matches,
  max_delta: d.max_delta,
  cap_in_transition: d.cap_in_transition,
  prize_mode: d.prize_mode,
  baseline: d.baseline,
  ittf_r_max: d.ittf_r_max,
  ittf_k: d.ittf_k,
  c_top: d.level_c.top,
  c_republic: d.level_c.republic,
  c_region: d.level_c.region,
  c_amateur: d.level_c.amateur,
  p_first: d.prize_p['1'],
  p_second: d.prize_p['2'],
  p_third: d.prize_p['3'],
});

export function useCalibration() {
  const server = useRatingParams();
  const [own, setOwn] = useState<ParamDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saved = useMemo(() => (server.data ? draftOf(server.data) : null), [server.data]);
  const draft = own ?? saved;
  const changed = !!own && JSON.stringify(own) !== JSON.stringify(saved);

  const setParams = useCallback(
    (patch: Partial<ParamDraft>) => setOwn((d) => ({ ...(d ?? saved!), ...patch })),
    [saved],
  );
  const resetParams = useCallback(() => {
    setOwn(null);
    setSaveError(null);
  }, []);
  const saveParams = useCallback(async () => {
    if (!own) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveRatingParams(patchOf(own));
      setOwn(null);
      server.reload();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [own, server]);

  const input = useMemo(
    () => (draft ? { players: [], tournaments: [], matches: [], params: draft as unknown as Record<string, unknown> } : null),
    [draft],
  );
  const preview = usePreview(input);

  return {
    params: { draft, loading: server.loading, error: server.error, changed, saving, saveError },
    setParams,
    resetParams,
    saveParams,
    insights: preview.data?.insights ?? null,
    insightsError: preview.error,
  };
}

export type Calibration = ReturnType<typeof useCalibration>;
