'use client';

/* Действия председателя ГСК над рейтингом спортсмена: неявка и исправление.

   Хук держит только состояние действия — идёт ли запрос и чем кончился. Сам
   запрос в транспорте (`entities/rating`), права — на сервере. Возвращает
   записанную строку журнала: по ней экран говорит, что именно изменилось, а
   не пересчитывает сам. */

import { useCallback, useState } from 'react';

import { correctRating, registerNoShow, type RatingEntry } from '@/entities/rating';

export function useRatingActions(userId: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<RatingEntry>): Promise<RatingEntry | null> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const noShow = useCallback(
    (reason: string) => run(() => registerNoShow(userId, reason)),
    [run, userId],
  );

  const correct = useCallback(
    (value: number, reason: string) => run(() => correctRating(userId, value, reason)),
    [run, userId],
  );

  return { noShow, correct, busy, error };
}
