'use client';

/* Действие председателя ГСК над рейтингом спортсмена: исправление значения
   («Редактировать» ✳ 03.11.2026; кнопка неявки с карточки снята, ручка
   `no-show/` на сервере осталась).

   Хук держит только состояние действия — идёт ли запрос и чем кончился. Сам
   запрос в транспорте (`entities/rating`), права — на сервере. Возвращает
   записанную строку журнала: по ней экран говорит, что именно изменилось, а
   не пересчитывает сам. */

import { useCallback, useState } from 'react';

import { correctRating, type RatingEntry } from '@/entities/rating';

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

  const correct = useCallback(
    (value: number, reason: string) => run(() => correctRating(userId, value, reason)),
    [run, userId],
  );

  return { correct, busy, error };
}
