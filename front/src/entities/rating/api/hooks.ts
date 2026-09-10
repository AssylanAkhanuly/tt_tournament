'use client';

/* Хуки транспорта: экран зовёт их, а не `fetch`.

   Один общий `useAsync` вместо трёх почти одинаковых хуков — иначе состояние
   «грузится / ошибка / данные» пришлось бы писать в каждом заново, и в одном
   из трёх оно оказалось бы другим. */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchAppeals,
  fetchEditionDraft,
  fetchEditions,
  fetchJournal,
  fetchProtocols,
  type JournalQuery,
  fetchRatingCard,
  fetchRatingList,
  fetchRatingParams,
  previewRating,
  saveRatingParams,
  type RatingListQuery,
} from './client';
import type {
  EditionDraftRow,
  PreviewMatch,
  PreviewPlayer,
  PreviewResult,
  PreviewTournament,
  RatingCard,
  RatingEdition,
  RatingList,
  RatingParams,
} from './types';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

function useAsync<T>(run: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  // Ответ на устаревший запрос не должен перетирать свежий: при быстрой смене
  // фильтров порядок ответов не совпадает с порядком запросов.
  const latest = useRef(0);

  useEffect(() => {
    const seq = ++latest.current;
    setLoading(true);
    run()
      .then((value) => {
        if (seq !== latest.current) return;
        setData(value);
        setError(null);
      })
      .catch((e: Error) => {
        if (seq !== latest.current) return;
        setError(e.message);
      })
      .finally(() => {
        if (seq === latest.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}

export function useRatingList(query: RatingListQuery): AsyncState<RatingList> {
  const key = JSON.stringify(query);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useAsync(() => fetchRatingList(query), [key]);
}

export function useRatingCard(userId: string): AsyncState<RatingCard> {
  return useAsync(() => fetchRatingCard(userId), [userId]);
}

/** Выпуски, новые первыми (п. 8.2). */
export function useEditions(): AsyncState<RatingEdition[]> {
  return useAsync(() => fetchEditions(), []);
}

/** Черновик следующего выпуска — только председателю ГСК. */
export function useEditionDraft(): AsyncState<EditionDraftRow[]> {
  return useAsync(() => fetchEditionDraft(), []);
}

/** Апелляции (п. 21) — только председателю ГСК; фильтр по вкладке — на экране. */
export function useAppeals() {
  return useAsync(() => fetchAppeals(), []);
}

/** Протоколы для рейтинга (п. 10, 13) — только председателю ГСК. */
export function useProtocols() {
  return useAsync(() => fetchProtocols(), []);
}

/** Журнал изменений (п. 20, 22.2) — только председателю ГСК. */
export function useJournal(query: JournalQuery) {
  const key = JSON.stringify(query);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useAsync(() => fetchJournal(query), [key]);
}

export function useRatingParams() {
  const state = useAsync(() => fetchRatingParams(), []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaving(true);
      setSaveError(null);
      try {
        await saveRatingParams(patch);
        state.reload();
      } catch (e) {
        setSaveError((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [state],
  );

  return { ...state, save, saving, saveError };
}

export type PreviewInput = {
  players: PreviewPlayer[];
  tournaments: PreviewTournament[];
  matches: PreviewMatch[];
  params?: Record<string, unknown>;
};

/** Предпросчёт с задержкой: расчёт живёт на сервере, и слать запрос на каждое
    нажатие клавиши в поле коэффициента незачем. */
export function usePreview(input: PreviewInput, delayMs = 250) {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(input);
  const latest = useRef(0);

  useEffect(() => {
    if (!input.players.length) {
      setData(null);
      setError(null);
      return;
    }
    const seq = ++latest.current;
    setLoading(true);
    const timer = setTimeout(() => {
      previewRating(input)
        .then((value) => {
          if (seq !== latest.current) return;
          setData(value);
          setError(null);
        })
        .catch((e: Error) => {
          if (seq !== latest.current) return;
          setError(e.message);
        })
        .finally(() => {
          if (seq === latest.current) setLoading(false);
        });
    }, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delayMs]);

  return { data, loading, error };
}
