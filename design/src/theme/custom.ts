/* «Свой цвет» — тема, которую собирают руками в конструкторе
   (история «Дизайн-система → Конструктор темы»).

   Значения живут в localStorage, поэтому переживают перезагрузку и работают
   на любой истории: выбрал в тулбаре тему «Свой цвет» — и все экраны
   перекрашиваются тем, что накрутили в конструкторе. */

export const CUSTOM_ID = 'custom';
const KEY = 'ttfrk-theme-custom';

export type Seeds = Record<string, string>;

export function loadCustom(): Seeds {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Seeds) : {};
  } catch {
    return {};
  }
}

export function saveCustom(seeds: Seeds): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(seeds));
}

export function clearCustom(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(KEY);
}

/** Текущее значение переменной в виде #rrggbb — считаем краской, а не парсером:
    `color-mix()` и `var()` браузер уже посчитал за нас. */
export function resolveColor(name: string, el: HTMLElement = document.documentElement): string {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;opacity:0;pointer-events:none;background:var(${name})`;
  el.appendChild(probe);
  const painted = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const nums = painted.match(/[\d.]+/g);
  if (!nums) return '#000000';
  // Chrome отдаёт результат color-mix() как `color(srgb 0.07 0.09 0.15)` —
  // каналы 0..1, а не 0..255; обычный цвет приходит как rgb(11, 17, 32)
  const scale = painted.startsWith('color(') ? 255 : 1;   // в color(srgb …) каналы 0..1
  return (
    '#' +
    nums
      .slice(0, 3)
      .map((n) => Math.round(Number(n) * scale).toString(16).padStart(2, '0'))
      .join('')
  );
}
