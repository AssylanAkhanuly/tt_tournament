'use client';

/* Новый спортсмен ✳ (11.09.2026) — председатель ГСК заводит карточку.

   Один диалог на два места: «Добавить спортсмена» над рейтинг-листом и
   «Новый спортсмен» в участниках турнира вручную. Что делать с введённым,
   решает тот, кто открыл (`onSubmit`); диалог только собирает поля.

   Старт по Положению: новый — 1,00 (п. 6.1), перенос прежнего рейтинга
   (п. 6.3), позиция ITTF (п. 17.4). Число считает сервер. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import type { NewAthlete, RatingOrigin } from '@/entities/rating';
import { FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';
import { FormError, parseNum, SelectField } from './fields';

const ORIGINS: [RatingOrigin, string][] = [
  ['new', 'Новый — 1,00'],
  ['legacy', 'Перенос прежнего рейтинга'],
  ['ittf', 'Позиция ITTF'],
];
const SEXES: [NewAthlete['sex'], string][] = [
  ['', '—'],
  ['m', 'Мужской'],
  ['f', 'Женский'],
];

export function AthleteDialog({
  sub,
  onClose,
  onSubmit,
}: {
  sub?: string;
  onClose: () => void;
  /** Завести; ошибка сервера — брошенным исключением, диалог её покажет. */
  onSubmit: (athlete: NewAthlete) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [sex, setSex] = useState<NewAthlete['sex']>('');
  const [year, setYear] = useState('');
  const [origin, setOrigin] = useState<RatingOrigin>('new');
  const [start, setStart] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startNum = parseNum(start);
  const ready = name.trim() !== '' && (origin === 'new' || startNum !== null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        region: region.trim(),
        sex,
        birthYear: parseNum(year),
        origin,
        legacy: origin === 'legacy' ? startNum : null,
        ittfPosition: origin === 'ittf' ? startNum : null,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Новый спортсмен"
      sub={sub}
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button
            variant="primary"
            data-testid="athlete-submit"
            isDisabled={busy || !ready}
            onPress={() => void submit()}
          >
            Завести
          </Button>
        </>
      }
    >
      <FormGrid>
        <TextInput label="Фамилия и имя" value={name} onChange={setName} wide />
        <TextInput label="Регион" value={region} onChange={setRegion} />
        <TextInput label="Год рождения" value={year} onChange={setYear} />
        <SelectField label="Пол" value={sex} options={SEXES} onChange={setSex} />
        <SelectField label="Старт" value={origin} options={ORIGINS} onChange={setOrigin} />
        {origin !== 'new' && (
          <TextInput
            label={origin === 'legacy' ? 'Прежний рейтинг' : 'Позиция в рейтинге ITTF'}
            value={start}
            onChange={setStart}
          />
        )}
      </FormGrid>
      <FormError text={error} />
    </InlineDialog>
  );
}
