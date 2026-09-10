'use client';

/* Выбор из списка в диалогах председателя: пол, старт, уровень, игроки матча.

   Родной `select`, а не выпадашка кита: `FilterSeg` раскрывается абсолютным
   слоем и внутри прокручиваемого тела диалога обрезается. Вид — как у полей
   ввода кита рядом (подпись сверху, та же рамка). */

import type { CompetitionLevel } from '@/entities/rating';

/** Уровни соревнований — таблица п. 13 (коэффициент C). */
export const LEVELS: [CompetitionLevel, string][] = [
  ['top', 'Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12'],
  ['republic', 'Чемпионаты РК по возрастам, ЕЛНТ, республиканские'],
  ['region', 'Областные и городские'],
  ['amateur', 'Любительские'],
];

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
  return (
    <label className={'flex flex-col gap-1 ' + (wide ? 'col-span-2' : '')}>
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-2.5 text-sm outline-none focus:border-blue-500"
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
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
