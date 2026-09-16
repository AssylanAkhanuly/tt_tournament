'use client';

/* Внести матч турнира вручную ✳ (11.09.2026): кто с кем и счёт по партиям.

   Счёт — ступенями от 0 до числа побед, до которого играется матч: больше
   набрать нельзя. Внести можно, когда у одного ровно столько, у другого
   меньше — ничьих в настольном теннисе нет. Соперник выбирается из остальных:
   выбрать одного и того же с двух сторон нельзя, а выбор в «Спортсмен»
   того, кто стоит соперником, меняет их местами. Сервер проверяет то же.

   Деление мужчины / женщины ✳ (16.09.2026, замечания федерации): «чтобы весь
   список спортсменов не выходил». Переключатель стоит в самом диалоге и
   начинается с того, что выбрано на странице, — за отбором не нужно выходить
   из ввода матча. Выбран пол — спортсмены другого в списках не появляются. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import type { NewMatch } from '@/entities/rating';
import { FormGrid, InlineDialog, QuietAction, Segmented } from '@/shared/kit/app';
import { FormError, SelectField, Stepper } from './fields';

export type MatchPlayer = { id: string; name: string; sex: string };

const SEXES: ['' | 'm' | 'f', string][] = [
  ['', 'Все'],
  ['m', 'Мужчины'],
  ['f', 'Женщины'],
];

export function MatchDialog({
  players,
  gamesToWin,
  initialSex = '',
  onClose,
  onSubmit,
}: {
  /** Участники турнира. */
  players: MatchPlayer[];
  /** До скольких побед играется матч. */
  gamesToWin: number;
  /** Пол, выбранный в отборе страницы турнира. */
  initialSex?: '' | 'm' | 'f';
  onClose: () => void;
  onSubmit: (match: NewMatch) => Promise<void>;
}) {
  const [sex, setSex] = useState<'' | 'm' | 'f'>(initialSex);
  const [a, setA] = useState(players[0]?.id ?? '');
  const [b, setB] = useState(players[1]?.id ?? '');
  const [sa, setSa] = useState(0);
  const [sb, setSb] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = players.filter((p) => !sex || p.sex === sex);
  // Выбранный мог уйти из списка при смене пола — тогда берём первого из тех,
  // кто в нём остался: диалог не должен ссылаться на невидимого спортсмена.
  const first = (skip?: string) => list.find((p) => p.id !== skip)?.id ?? '';
  const aId = list.some((p) => p.id === a) ? a : first();
  const bId = list.some((p) => p.id === b) && b !== aId ? b : first(aId);

  const ready = !!aId && !!bId && aId !== bId && Math.max(sa, sb) === gamesToWin && Math.min(sa, sb) < gamesToWin;

  function pickA(id: string) {
    if (id === bId) setB(aId);
    setA(id);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ a: aId, b: bId, scoreA: sa, scoreB: sb });
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
      <div className="mb-3" data-testid="match-sex">
        <Segmented
          items={SEXES.map(([, l]) => l)}
          value={SEXES.find(([v]) => v === sex)?.[1] ?? 'Все'}
          onPick={(l) => setSex(SEXES.find(([, x]) => x === l)?.[0] ?? '')}
          ariaLabel="Пол спортсменов"
        />
      </div>
      <FormGrid>
        <SelectField
          label="Спортсмен"
          value={aId}
          options={list.map((p) => [p.id, p.name] as [string, string])}
          onChange={pickA}
        />
        <Stepper label="Партии спортсмена" value={sa} max={gamesToWin} onChange={setSa} />
        <SelectField
          label="Соперник"
          value={bId}
          options={list.filter((p) => p.id !== aId).map((p) => [p.id, p.name] as [string, string])}
          onChange={setB}
        />
        <Stepper label="Партии соперника" value={sb} max={gamesToWin} onChange={setSb} />
      </FormGrid>
      <FormError text={error} />
    </InlineDialog>
  );
}
