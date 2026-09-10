'use client';

/* Завести турнир протоколом вручную ✳ (11.09.2026): название, дата, уровень.
   Участники и матчи вносятся уже на странице турнира. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import { createProtocol, type CompetitionLevel, type ProtocolDetail } from '@/entities/rating';
import { DateInput, FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';
import { FormError, LEVELS, SelectField } from './fields';

/** Сегодня по местному времени — `toISOString` дал бы дату по Гринвичу. */
const today = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

export function TournamentDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (created: ProtocolDetail) => void;
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  const [level, setLevel] = useState<CompetitionLevel>('republic');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onDone(await createProtocol({ name: name.trim(), date, level }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Новый турнир"
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button
            variant="primary"
            data-testid="tournament-submit"
            isDisabled={busy || !name.trim() || !date}
            onPress={() => void submit()}
          >
            Завести
          </Button>
        </>
      }
    >
      <FormGrid>
        <TextInput label="Название" value={name} onChange={setName} wide />
        <DateInput label="Дата" value={date} onChange={setDate} />
        <SelectField label="Уровень" value={level} options={LEVELS} onChange={setLevel} wide />
      </FormGrid>
      <FormError text={error} />
    </InlineDialog>
  );
}
