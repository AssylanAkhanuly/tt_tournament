'use client';

/* Хуки транспорта: экран зовёт их, а не `fetch`.

   Один общий `useAsync` вместо почти одинаковых хуков — иначе состояние
   «грузится / ошибка / данные» пришлось бы писать в каждом заново, и в одном
   из них оно оказалось бы другим. */

import { useCallback, useEffect, useState } from 'react';

import {
  fetchProtocol,
  fetchProtocols,
  fetchRatingCard,
  fetchRatingList,
  previewProtocol,
  type RatingListQuery,
} from './client';
import type { ProtocolDetail, ProtocolInput, RatingCard, RatingList } from './types';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

function useAsync<T>(run: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [tick, setTick] = useState(0);
  // Ответ помнит, на какой запрос он пришёл: «грузится» — пока последний ответ
  // не на текущий запрос. Состояние в самом эффекте не трогаем, прежние данные
  // видны до прихода новых.
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  const key = JSON.stringify([deps, tick]);

  useEffect(() => {
    // Ответ на устаревший запрос не перетирает свежий: при быстрой смене
    // фильтров порядок ответов не совпадает с порядком запросов.
    let live = true;
    run()
      .then((data) => {
        if (live) setResult({ key, data, error: null });
      })
      .catch((e: Error) => {
        if (live) setResult((prev) => ({ key, data: prev?.data ?? null, error: e.message }));
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    data: result?.data ?? null,
    loading: result?.key !== key,
    error: result?.error ?? null,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}

export function useRatingList(query: RatingListQuery): AsyncState<RatingList> {
  const key = JSON.stringify(query);
  return useAsync(() => fetchRatingList(query), [key]);
}

export function useRatingCard(userId: string): AsyncState<RatingCard> {
  return useAsync(() => fetchRatingCard(userId), [userId]);
}

/** Протоколы турниров (п. 10, 13) — только председателю ГСК. */
export function useProtocols() {
  return useAsync(() => fetchProtocols(), []);
}

/** Страница протокола: участники, матчи, причина отказа. */
export function useProtocol(id: string): AsyncState<ProtocolDetail> {
  return useAsync(() => fetchProtocol(id), [id]);
}

/** Предпросмотр утверждения — с задержкой: сервер считает по-настоящему и
    откатывает. `enabled` — есть что предпросчитать; `rev` — счётчик правок
    состава и матчей: при тех же уровне и местах числа другие. */
export function useProtocolPreview(id: string, input: ProtocolInput, enabled: boolean, rev = 0, delayMs = 250) {
  // Ответ помнит, на какой запрос он пришёл: «грузится» — это когда последний
  // ответ не на текущий запрос. Состояние в самом эффекте не трогаем.
  const [result, setResult] = useState<{ key: string; data: ProtocolDetail | null } | null>(null);
  const key = JSON.stringify([id, input, rev]);

  useEffect(() => {
    if (!enabled) return;
    let live = true; // ответ на устаревший запрос не перетирает свежий
    const timer = setTimeout(() => {
      previewProtocol(id, input)
        .then((data) => {
          if (live) setResult({ key, data });
        })
        .catch(() => {
          if (live) setResult({ key, data: null });
        });
    }, delayMs);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, delayMs]);

  return {
    data: enabled && result ? result.data : null,
    loading: enabled && result?.key !== key,
  };
}
