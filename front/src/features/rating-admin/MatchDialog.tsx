'use client';

/* Внести матч турнира вручную ✳ (11.09.2026): кто с кем и счёт по партиям.
   Победитель — у кого больше партий; ничьих в настольном теннисе нет, и
   сервер такой матч не примет. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import type { NewMatch } from '@/entities/rating';
import { FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';
import { FormError, parseNum, SelectField } from './fields';

export function MatchDialog({
  players,
  onClose,
  onSubmit,
}: {
  /** Участники турнира: [userId, имя]. */
  players: [string, string][];
  onClose: () => void;
  onSubmit: (match: NewMatch) => Promise<void>;
}) {
  const [a, setA] = useState(players[0]?.[0] ?? '');
  const [b, setB] = useState(players[1]?.[0] ?? '');
  const [sa, setSa] = useState('');
  const [sb, setSb] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const na = parseNum(sa);
  const nb = parseNum(sb);
  const ready = !!a && !!b && a !== b && na !== null && nb !== null && na !== nb;

  async function submit() {
    if (na === null || nb === null) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ a, b, scoreA: na, scoreB: nb });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Матч"
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
        <SelectField label="Спортсмен" value={a} options={players} onChange={setA} />
        <TextInput label="Партии спортсмена" value={sa} onChange={setSa} />
        <SelectField label="Соперник" value={b} options={players} onChange={setB} />
        <TextInput label="Партии соперника" value={sb} onChange={setSb} />
      </FormGrid>
      <FormError text={error} />
    </InlineDialog>
  );
}
