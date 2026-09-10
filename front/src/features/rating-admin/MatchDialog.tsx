'use client';

/* Внести матч турнира вручную ✳ (11.09.2026): кто с кем и счёт по партиям.

   Счёт — ступенями от 0 до числа побед, до которого играется матч: больше
   набрать нельзя. Внести можно, когда у одного ровно столько, у другого
   меньше — ничьих в настольном теннисе нет. Соперник выбирается из остальных:
   выбрать одного и того же с двух сторон нельзя, а выбор в «Спортсмен»
   того, кто стоит соперником, меняет их местами. Сервер проверяет то же. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import type { NewMatch } from '@/entities/rating';
import { FormGrid, InlineDialog, QuietAction } from '@/shared/kit/app';
import { FormError, SelectField, Stepper } from './fields';

export function MatchDialog({
  players,
  gamesToWin,
  onClose,
  onSubmit,
}: {
  /** Участники турнира: [userId, имя]. */
  players: [string, string][];
  /** До скольких побед играется матч. */
  gamesToWin: number;
  onClose: () => void;
  onSubmit: (match: NewMatch) => Promise<void>;
}) {
  const [a, setA] = useState(players[0]?.[0] ?? '');
  const [b, setB] = useState(players[1]?.[0] ?? '');
  const [sa, setSa] = useState(0);
  const [sb, setSb] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!a && !!b && a !== b && Math.max(sa, sb) === gamesToWin && Math.min(sa, sb) < gamesToWin;

  function pickA(id: string) {
    if (id === b) setB(a);
    setA(id);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ a, b, scoreA: sa, scoreB: sb });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Матч"
      sub={'До ' + gamesToWin + ' побед'}
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button variant="primary" data-testid="match-submit" isDisabled={busy || !ready} onPress={() => void submit()}>
            Внести
          </Button>
        </>
      }
    >
      <FormGrid>
        <SelectField label="Спортсмен" value={a} options={players} onChange={pickA} />
        <Stepper label="Партии спортсмена" value={sa} max={gamesToWin} onChange={setSa} />
        <SelectField label="Соперник" value={b} options={players.filter(([id]) => id !== a)} onChange={setB} />
        <Stepper label="Партии соперника" value={sb} max={gamesToWin} onChange={setSb} />
      </FormGrid>
      <FormError text={error} />
    </InlineDialog>
  );
}
