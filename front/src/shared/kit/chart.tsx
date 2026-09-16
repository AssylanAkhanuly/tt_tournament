/* Графики в макетах — на Chart.js.

   Своими прямоугольниками график не рисуем по той же причине, по которой сетка
   в макетах настоящая (`widgets/bracket`): нарисованная картинка не отвечает на
   вопросы, которые задают графику, — где пик, что было в январе, сколько встреч
   с этим соперником. Настоящий холст отвечает, и по нему сразу видно, влезают ли
   подписи и читается ли шкала.

   Цвета берутся из токенов темы (`theme/tokens.css`) на момент отрисовки:
   Chart.js работает с холстом и `var(--…)` не понимает, поэтому значение
   вычисляем через `getComputedStyle`. Сырых цветов в макетах не появляется. */

import { useEffect, useRef } from 'react';
import Chart, { type ChartConfiguration } from 'chart.js/auto';

/** Значение токена темы: Chart.js рисует на холсте и `var(--…)` не понимает.

    `fallback` — имя запасного токена ✳ (16.09.2026. Палитра кита
    (`theme/tokens.css`) грузится в Storybook, а приложение держит свою в
    `app/globals.css`, и `--c-accent` там пуст. Пустая строка для Chart.js —
    чёрный: график в приложении выходил залитым чёрным. Запасной — тоже токен,
    сырых цветов в ките по-прежнему нет. */
export const token = (name: string, el?: HTMLElement, fallback?: string) => {
  const read = (n: string) => getComputedStyle(el ?? document.documentElement).getPropertyValue(n).trim();
  return read(name) || (fallback ? read(fallback) : '');
};

/** Полупрозрачный вариант токена — тем же способом, что `color-mix` в CSS. */
export const soft = (name: string, pct: number, el?: HTMLElement, fallback?: string) =>
  `color-mix(in srgb, ${token(name, el, fallback)} ${pct}%, transparent)`;

/** Холст с графиком. `make` вызывается на каждой перерисовке и возвращает
    конфигурацию — внутри неё уже можно читать токены: к этому моменту холст в
    документе, и тема на нём та же, что вокруг. */
export function ChartBox({
  make,
  height = 220,
  label,
}: {
  make: (el: HTMLCanvasElement) => ChartConfiguration;
  /** Высота холста: график живёт в панели, и высоту ей задаём мы. */
  height?: number;
  /** Подпись для тех, кто читает экран не глазами. */
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = new Chart(el, make(el));
    return () => chart.destroy();
  }, [make]);
  return (
    <div className="mkchart" style={{ height }}>
      <canvas ref={ref} role="img" aria-label={label} />
    </div>
  );
}
