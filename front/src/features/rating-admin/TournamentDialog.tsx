'use client';

/* Завести турнир протоколом вручную ✳ (11.09.2026): название, дата, уровень
   и до скольких побед играется матч. Участники и матчи вносятся уже на
   странице турнира.

   Возрастные ограничения ✳ (15.09.2026, замечания федерации): сколько угодно
   категорий — диапазонов дат рождения («2009 г.р. и моложе» = 01.01.2009 —
   сегодня, «Ветераны 40–49» = 01.01.1977 — 31.12.1986). Новая строка
   заполняется диапазоном «17 лет назад — сегодня», даты правятся вручную. Без
   категорий турнир без возрастных ограничений. */

import { Button } from '@heroui/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { createProtocol, type CompetitionLevel, type NewTournament, type ProtocolDetail } from '@/entities/rating';
import { DateInput, FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';
import { FormError, LEVELS, SelectField } from './fields';

const GAMES: ['2' | '3' | '4', string][] = [
  ['3', 'До 3 побед'],
  ['4', 'До 4 побед'],
  ['2', 'До 2 побед'],
];

type Category = NewTournament['ageCategories'][number];

/** Дата по местному времени — `toISOString` дал бы дату по Гринвичу. */
const iso = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const today = () => iso(new Date());

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
  const [games, setGames] = useState<'2' | '3' | '4'>('3');
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesOk = categories.every((c) => c.bornFrom && c.bornTo && c.bornFrom <= c.bornTo);

  function addCategory() {
    const year = new Date().getFullYear() - 17;
    setCategories([...categories, { name: '', bornFrom: year + '-01-01', bornTo: today() }]);
  }

  function patch(i: number, change: Partial<Category>) {
    setCategories(categories.map((c, j) => (j === i ? { ...c, ...change } : c)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onDone(
        await createProtocol({
          name: name.trim(),
          date,
          level,
          gamesToWin: Number(games),
          ageCategories: categories.map((c) => ({ ...c, name: c.name.trim() })),
        }),
      );
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
            isDisabled={busy || !name.trim() || !date || !categoriesOk}
            onPress={() => void submit()}
          >
            Завести
          </Button>
        </>
      }
    >
      <FormGrid>
        <TextInput label="Название" ariaLabel="Название турнира" value={name} onChange={setName} wide />
        <DateInput label="Дата" value={date} onChange={setDate} />
        <SelectField label="Матч" value={games} options={GAMES} onChange={setGames} />
        <SelectField label="Уровень" value={level} options={LEVELS} onChange={setLevel} wide />
      </FormGrid>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold">Возрастные ограничения</span>
          <Button size="sm" variant="ghost" data-testid="age-category-add" onPress={addCategory}>
            <Plus size={14} /> Категория
          </Button>
        </div>
        {categories.map((c, i) => (
          <div
            key={i}
            data-testid="age-category"
            className="mb-2 flex items-start gap-2 rounded-lg border border-neutral-200 p-3"
          >
            <div className="min-w-0 flex-1">
              <FormGrid>
                <TextInput
                  label="Название категории"
                  placeholder="2009 г.р. и моложе"
                  value={c.name}
                  onChange={(v) => patch(i, { name: v })}
                  wide
                />
                <DateInput label="Дата рождения от" value={c.bornFrom} onChange={(v) => patch(i, { bornFrom: v })} />
                <DateInput label="Дата рождения до" value={c.bornTo} onChange={(v) => patch(i, { bornTo: v })} />
              </FormGrid>
            </div>
            <button
              type="button"
              aria-label="Убрать категорию"
              onClick={() => setCategories(categories.filter((_, j) => j !== i))}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <FormError text={error} />
    </InlineDialog>
  );
}
