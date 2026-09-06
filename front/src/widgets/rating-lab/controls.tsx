'use client';

/* Мелкие управляемые поля калькулятора. В ките (`shared/kit/app`) полей выбора
   и числовых полей нет — там макетные компоненты, которые держат значение сами;
   здесь значение живёт снаружи, иначе расчёт не пересчитается. Вид — тот же,
   что у кита: те же классы, те же прямые углы. */

import type { ReactNode } from 'react';

const BOX =
  'w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[13px] outline-none ' +
  'focus:border-blue-500 disabled:bg-neutral-100 disabled:text-neutral-400';

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="flex min-w-0 flex-col gap-1">
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    {children}
    {hint && <span className="text-[11px] leading-snug text-neutral-400">{hint}</span>}
  </label>
);

export function Text({
  value,
  onChange,
  ariaLabel,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  testId?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      data-testid={testId}
      className={BOX}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Num({
  value,
  onChange,
  ariaLabel,
  step = 1,
  min,
  max,
  disabled,
  testId,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <input
      type="number"
      aria-label={ariaLabel}
      data-testid={testId}
      className={BOX + ' tabular-nums'}
      value={Number.isFinite(value) ? value : ''}
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  testId,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  testId?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      data-testid={testId}
      className={BOX}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const Btn = ({
  onClick,
  children,
  tone = 'quiet',
  ariaLabel,
  testId,
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: 'primary' | 'quiet' | 'danger';
  ariaLabel?: string;
  testId?: string;
}) => {
  const skin =
    tone === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : tone === 'danger'
        ? 'border border-neutral-300 text-red-600 hover:bg-red-50'
        : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50';
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-testid={testId}
      onClick={onClick}
      className={'rounded-lg px-3 py-1.5 text-[13px] font-medium ' + skin}
    >
      {children}
    </button>
  );
};

/** Пометка происхождения числа: из Положения или наше допущение. */
export const Source = ({ fixed, clause }: { fixed: boolean; clause: string }) => (
  <span
    className={
      'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ' +
      (fixed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')
    }
    title={fixed ? 'Значение задано Положением' : 'В Положении значение не задано — величина наша, требует решения федерации'}
  >
    {fixed ? 'по Положению' : 'не задано'} {clause}
  </span>
);

/** Число рейтинга в формате 00,00 (§6 Положения — запятая, два знака). */
export const num2 = (x: number): string => x.toFixed(2).replace('.', ',');
export const signed2 = (x: number): string => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(2).replace('.', ',');
