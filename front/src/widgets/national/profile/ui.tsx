'use client';

/* Общие кирпичи профиля члена сборной ✳ (22.11.2026): карточка блока,
   заголовок блока, кольцо доли, мини-линия карточек показателей. Значков без нужды нет (решение владельца продукта 22.11.2026):
   они — у шагов степпера, круглых кнопок связи и короны. Цвета — доп. цвета брендбука
   (`qtt-*` во входе Tailwind); классы записаны целиком: Tailwind собирает
   только то, что видит в тексте. */

import type { ReactNode } from 'react';

import { dmy } from '@/entities/national';

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 text-[15px] font-semibold">{title}</h2>
      {action}
    </div>
  );
}

/** Карточка блока профиля: белая на серой странице ✳ (22.11.2026, образцы
    владельца продукта — Orbix «Player Profile» и Athlitiq). */
export const CARD = 'flex min-w-0 flex-col rounded-2xl border border-neutral-200/80 bg-white';

export function Panel({ title, action, testId, className = '', children }: { title?: string; action?: ReactNode; testId?: string; className?: string; children: ReactNode }) {
  return (
    <section className={CARD + ' p-5 ' + className} data-testid={testId}>
      {title && <SectionHead title={title} action={action} />}
      {children}
    </section>
  );
}

/** Мини-линия карточки показателя: значения слева направо, с мягкой заливкой. */
export function Spark({ values, stroke, fill }: { values: number[]; stroke: string; fill: string }) {
  if (values.length < 2) return <div className="h-10" />;
  const w = 200;
  const h = 40;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
  const line = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} className={fill} />
      <path d={line} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={stroke} />
    </svg>
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
