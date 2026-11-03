'use client';

/* Поля диалогов председателя: выбор из списка и число со ступенями.

   Выбор — общий `Picker` ✳ (03.11.2026; раньше — родной `select`): на
   телефоне он открывает панель снизу, на десктопе — `Select` HeroUI.

   Счёт партий — ступенями «− N +» ✳ (11.09.2026, решение владельца продукта):
   число партий маленькое и ограничено сверху, печатать его незачем. */

import { Minus, Plus } from 'lucide-react';

import type { CompetitionLevel } from '@/entities/rating';
import { Picker } from '@/shared/ui/Picker';

/** Уровни соревнований — таблица п. 13 (коэффициент C). */
export const LEVELS: [CompetitionLevel, string][] = [
  ['top', 'Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12'],
  ['republic', 'Чемпионаты РК по возрастам, ЕЛНТ, республиканские'],
  ['region', 'Областные и городские'],
  ['amateur', 'Любительские'],
];

const Label = ({ children }: { children: string }) => (
  <span className="text-xs font-medium text-neutral-500">{children}</span>
);

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  wide,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
  wide?: boolean;
}) {
  // Выбор — общий `Picker` ✳ (03.11.2026): на телефоне — панель снизу, на
  // десктопе — `Select` HeroUI; его список — слой поверх окна, не обрезается.
  // Пустое значение («не указан») — ключ «-»: пустая строка ключом не годится.
  return (
    <div className={'flex min-w-0 flex-col gap-1 ' + (wide ? 'col-span-2' : '')}>
      <Label>{label}</Label>
      <Picker
        label={label}
        value={value === '' ? '-' : value}
        options={options.map(([v, t]) => ({ id: v === '' ? '-' : v, label: t }))}
        onChange={(k) => onChange((k === '-' ? '' : k) as T)}
      />
    </div>
  );
}

/** Число со ступенями: «−» и «+» по краям, значение посередине. */
export function Stepper({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const step =
    'flex w-11 shrink-0 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:cursor-default disabled:text-neutral-300 disabled:hover:bg-transparent';
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div
        role="group"
        aria-label={label}
        className="flex h-9 items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-white"
      >
        <button type="button" aria-label="Уменьшить" disabled={value <= min} onClick={() => onChange(value - 1)} className={step}>
          <Minus size={15} />
        </button>
        <output className="flex flex-1 items-center justify-center border-x border-neutral-200 text-[15px] font-semibold tabular-nums">
          {value}
        </output>
        <button type="button" aria-label="Увеличить" disabled={value >= max} onClick={() => onChange(value + 1)} className={step}>
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

/** Ошибка сервера под формой — его текст, а не придуманный экраном. */
export const FormError = ({ text }: { text: string | null }) =>
  text ? (
    <p role="alert" data-testid="chairman-error" className="mt-3 text-[13px] text-red-600">
      {text}
    </p>
  ) : null;

/** «40,15» и «40.15» — одно и то же число; пустое — null. */
export const parseNum = (v: string): number | null => {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
