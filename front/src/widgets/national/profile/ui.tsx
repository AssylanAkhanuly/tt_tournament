'use client';

/* Общие кирпичи профиля члена сборной ✳ (22.11.2026): заголовок блока,
   кольцо доли. Значков без нужды нет (решение владельца продукта 22.11.2026):
   они — у шагов степпера, круглых кнопок связи и короны. Цвета — доп. цвета брендбука
   (`qtt-*` во входе Tailwind); классы записаны целиком: Tailwind собирает
   только то, что видит в тексте. */

import type { ReactNode } from 'react';

import { dmy } from '@/entities/national';

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
      {action}
    </div>
  );
}

/** Кольцо доли: выполнено из всего — дугой цвета брендбука, число внутри. */
export function ProgressRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const share = total ? done / total : 0;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }} data-testid="progress-ring" data-done={done} data-total={total}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} className="stroke-neutral-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
          className="stroke-qtt-blue transition-[stroke-dashoffset]"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share)}
        />
      </svg>
      <span className="absolute text-[10.5px] font-semibold tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}

/** Сегодня по местной дате, ISO. */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Дней от сегодня до даты (ISO), по календарю. */
export function daysUntil(iso: string) {
  return Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(todayIso() + 'T00:00:00Z')) / 86400000);
}

export const daysWord = (n: number) =>
  n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'день' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'дня' : 'дней');

export const periodLabel = (p: { from: string; to: string } | null) =>
  !p ? 'Без срока' : p.from === p.to ? dmy(p.from) : dmy(p.from) + ' — ' + dmy(p.to);
