'use client';

/* Новый спортсмен ✳ (11.09.2026) — председатель ГСК заводит карточку.

   Один диалог на два места: «Добавить спортсмена» над рейтинг-листом и
   «Новый спортсмен» в участниках турнира вручную. Что делать с введённым,
   решает тот, кто открыл (`onSubmit`); диалог только собирает поля.

   Старт по Положению: новый — 1,00 (п. 6.1), перенос прежнего рейтинга
   (п. 6.3), позиция ITTF (п. 17.4). Число считает сервер.

   Дата рождения, а не год ✳ (15.09.2026): возрастные категории соревнования —
   диапазоны дат (замечания федерации). Год сервер выводит из даты.

   Регион — выбор из закреплённого списка ✳ (16.09.2026, замечания федерации):
   три города и семнадцать областей. Список приходит с сервера, где стоит и
   проверка, — иначе написания разойдутся, и выборка по региону развалится. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import { useRegions, type NewAthlete, type RatingOrigin } from '@/entities/rating';
import { DateInput, FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';
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
  initialSex = '',
  onClose,
  onSubmit,
}: {
  sub?: string;
  /** Пол, уже выбранный в отборе страницы турнира. */
  initialSex?: NewAthlete['sex'];
  onClose: () => void;
  /** Завести; ошибка сервера — брошенным исключением, диалог её покажет. */
  onSubmit: (athlete: NewAthlete) => Promise<void>;
}) {
  const regions = useRegions();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [sex, setSex] = useState<NewAthlete['sex']>(initialSex);
  const [birthDate, setBirthDate] = useState('');
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
        birthDate: birthDate || null,
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
        <TextInput label="Фамилия Имя Отчество" value={name} onChange={setName} wide />
        <SelectField
          label="Регион"
          value={region}
          options={[['', '—'], ...(regions.data ?? []).map((r) => [r, r] as [string, string])]}
          onChange={setRegion}
        />
        <DateInput label="Дата рождения" value={birthDate} onChange={setBirthDate} />
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
