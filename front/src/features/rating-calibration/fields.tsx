'use client';

/* Поля калибровки: строки «подпись слева, поле справа» по группам — как
   «Сведения» турнира, — число (`NumberField` с «−» и «+» по краям), выбор
   (`Picker`: на телефоне — панель снизу), переключатель.
   У подписи — значок с подсказкой: формула Положения, в которой стоит этот
   коэффициент, и он в ней выделен (`formulas.tsx`) ✳ 03.11.2026. Подсказка
   места на экране не занимает. HeroUI + Tailwind. */

import { I18nProvider, NumberField, Switch, Tooltip } from '@heroui/react';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { Picker } from '@/shared/ui/Picker';

export function Group({ title, children, testId }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="border-b border-neutral-200 py-5 first:pt-0 last:border-b-0" data-testid={testId}>
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{title}</h2>
      <div className="divide-y divide-neutral-100">{children}</div>
    </section>
  );
}

export function Row({ label, formula, children }: { label: string; formula?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-1 items-center gap-2 py-3 @[560px]:grid-cols-[minmax(0,1fr)_12rem] @[560px]:gap-5">
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-700">
        {label}
        {formula && (
          <Tooltip delay={200}>
            <Tooltip.Trigger
              aria-label={'Формула: ' + label}
              className="text-neutral-400 hover:text-neutral-600"
              data-testid="formula-open"
            >
              <Info size={14} />
            </Tooltip.Trigger>
            <Tooltip.Content className="px-3 py-2 text-[13px] leading-6" data-testid="formula">
              {formula}
            </Tooltip.Content>
          </Tooltip>
        )}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Num({
  label,
  value,
  onChange,
  step = 0.01,
  min = 0,
  max,
  isDisabled,
  testId,
  className = 'w-full',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  isDisabled?: boolean;
  testId?: string;
  className?: string;
}) {
  // По-русски — «0,6», а не «0.6». По краям — «−» и «+» с шагом коэффициента
  // ✳ (03.11.2026, решение владельца продукта). У группы HeroUI сетка
  // «40px 1fr 40px» как раз под эти кнопки: без них поле вставало в колонку в
  // 40px и резало число (0,6 → «0,»).
  return (
    <I18nProvider locale="ru-RU">
      <NumberField
        aria-label={label}
        value={value}
        onChange={(v) => !Number.isNaN(v) && onChange(v)}
        step={step}
        minValue={min}
        maxValue={max}
        isDisabled={isDisabled}
        formatOptions={{ maximumFractionDigits: step < 1 ? 3 : 0 }}
        className={className}
      >
        <NumberField.Group className="w-full rounded-xl">
          <NumberField.DecrementButton aria-label={'Уменьшить: ' + label} />
          <NumberField.Input data-testid={testId} className="w-full min-w-0 text-center tabular-nums" />
          <NumberField.IncrementButton aria-label={'Увеличить: ' + label} />
        </NumberField.Group>
      </NumberField>
    </I18nProvider>
  );
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  isDisabled,
  testId,
  className = 'w-full min-w-0',
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  isDisabled?: boolean;
  testId?: string;
  className?: string;
}) {
  return (
    <Picker
      label={label}
      value={value}
      options={options.map(([id, text]) => ({ id, label: text }))}
      onChange={(k) => onChange(k as T)}
      isDisabled={isDisabled}
      className={className}
      testId={testId}
    />
  );
}

export function Toggle({
  label,
  value,
  onChange,
  isDisabled,
  testId,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isDisabled?: boolean;
  testId?: string;
}) {
  return (
    <Switch isSelected={value} onChange={onChange} aria-label={label} isDisabled={isDisabled} data-testid={testId}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}
