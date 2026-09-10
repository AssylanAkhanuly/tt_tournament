'use client';

/* Действия председателя ГСК над рейтингом спортсмена: неявка и исправление.

   Хук держит только состояние действия — идёт ли запрос, чем кончился. Сам
   запрос в транспорте (`entities/rating`), права — на сервере. */

import { useCallback, useState } from 'react';

import { correctRating, registerNoShow, type RatingEntry } from '@/entities/rating';

export type ActionKind = 'no_show' | 'correction';

export function useRatingActions(userId: string, onDone: () => void) {
  const [busy, setBusy] = useState<ActionKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<RatingEntry | null>(null);

  const run = useCallback(
    async (kind: ActionKind, action: () => Promise<RatingEntry>) => {
      setBusy(kind);
      setError(null);
      try {
        const entry = await action();
        setLast(entry);
        onDone(); // карточка перечитывается: значение и история уже новые
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [onDone],
  );

  const noShow = useCallback(
    (reason: string) => run('no_show', () => registerNoShow(userId, reason)),
    [run, userId],
  );

  const correct = useCallback(
    (value: number, reason: string) => run('correction', () => correctRating(userId, value, reason)),
    [run, userId],
  );

  return { noShow, correct, busy, error, last };
}
