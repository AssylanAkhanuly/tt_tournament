'use client';

/* Фон карточки показателя — график Chart.js ✳ (27.11.2026, решение владельца
   продукта: «Chart.js, фоном каждой обёртки»). Холст лежит под текстом во всю
   ширину нижней части карточки: без осей, сетки, легенды и подсказок, указатель
   его не ловит. Шкала с запасом сверху (`HEADROOM`) — график держится в нижней
   половине и под цифры не заходит.

   Цвета — токены темы через `token()` кита: Chart.js рисует на холсте и
   `var(--…)` не понимает. */

import Chart, { type ChartConfiguration } from 'chart.js/auto';
import { useEffect, useRef } from 'react';

import { token } from '@/shared/kit/chart';

export type Backdrop =
  | { kind: 'line'; values: number[]; color: string; min?: number; max?: number }
  | { kind: 'bars'; values: number[]; color: string }
  | { kind: 'form'; results: boolean[] };

/** Во сколько раз шкала выше данных: график занимает нижнюю часть холста. */
const HEADROOM = 2.2;
const FORM_SLOTS = 10;

const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

function config(chart: Backdrop, el: HTMLElement): ChartConfiguration {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    events: [] as [],
    layout: { padding: 0 },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };
  const hidden = { display: false, grid: { display: false } };

  if (chart.kind === 'line') {
    const color = token(chart.color, el, '--color-brand-500');
    const values = chart.values.length === 1 ? [chart.values[0], chart.values[0]] : chart.values;
    const lo = chart.min ?? Math.min(...values);
    const hi = chart.max ?? Math.max(...values);
    const span = hi - lo || 1;
    return {
      type: 'line',
      data: {
        labels: values.map((_, i) => i),
        datasets: [
          {
            data: values,
            borderColor: color,
            borderWidth: 2,
            backgroundColor: mix(color, 14),
            fill: 'start',
            tension: 0.35,
            pointRadius: 0,
          },
        ],
      },
      options: {
        ...base,
        scales: { x: hidden, y: { ...hidden, min: lo - span * 0.05, max: lo + span * HEADROOM } },
      },
    };
  }

  const empty = token('--color-neutral-100', el);
  if (chart.kind === 'bars') {
    const color = token(chart.color, el, '--color-brand-500');
    const top = Math.max(1, ...chart.values);
    return {
      type: 'bar',
      data: {
        labels: chart.values.map((_, i) => i),
        datasets: [
          {
            // Пустой месяц — низкий серый столбик: ряд читается как шкала месяцев.
            data: chart.values.map((n) => (n ? n : top * 0.08)),
            backgroundColor: chart.values.map((n) => (n ? mix(color, 30) : empty)),
            borderRadius: 4,
            barPercentage: 0.86,
            categoryPercentage: 1,
          },
        ],
      },
      options: { ...base, scales: { x: hidden, y: { ...hidden, min: 0, max: top * HEADROOM } } },
    };
  }

  // Форма: десять мест, старые слева; победа — высокий столбик, поражение — ниже.
  const win = token('--color-green-500', el);
  const loss = token('--color-qtt-coral', el, '--color-red-500');
  const slots = Array.from({ length: FORM_SLOTS }, (_, i) => chart.results[i - (FORM_SLOTS - chart.results.length)]);
  return {
    type: 'bar',
    data: {
      labels: slots.map((_, i) => i),
      datasets: [
        {
          data: slots.map((w) => (w === undefined ? 0.25 : w ? 1 : 0.55)),
          backgroundColor: slots.map((w) => (w === undefined ? empty : mix(w ? win : loss, 45))),
          borderRadius: 4,
          barPercentage: 0.82,
          categoryPercentage: 1,
        },
      ],
    },
    options: { ...base, scales: { x: hidden, y: { ...hidden, min: 0, max: HEADROOM } } },
  };
}

export function KpiBackdrop({ chart, label }: { chart: Backdrop; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Перерисовка — только когда сменились данные, а не на каждый рендер.
  const key = JSON.stringify(chart);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const instance = new Chart(el, config(JSON.parse(key) as Backdrop, el));
    return () => instance.destroy();
  }, [key]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]" data-testid="kpi-chart" data-chart-label={label}>
      <canvas ref={ref} />
    </div>
  );
}
