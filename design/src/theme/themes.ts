/* Темы = наборы «семян» из `tokens.css`. Больше ничего менять не нужно:
   всё остальное (стекло, свечения, подложки чипов, градиенты экранов, тени)
   считается от них через `color-mix()`, поэтому одна правка перекрашивает
   и макеты, и примитивы, и специмены.

   Тема выбирается в тулбаре Storybook («Тема»); декоратор в
   `.storybook/preview.tsx` просто выставляет эти переменные на `:root`.
   Прибить тему к истории: `globals: { theme: 'emerald' }` в её аннотации,
   ссылка на экран в нужной теме — `?globals=theme:sunset`. */

export type ThemeId = 'fnt' | 'emerald' | 'sunset' | 'graphite';

export type Theme = {
  id: ThemeId;
  label: string;
  /** чем тема отличается — подпись в специмене */
  note: string;
  /** переопределения `--seed-*`; пусто — базовые значения из tokens.css */
  seeds: Record<string, string>;
};

/** порядок в тулбаре и в специмене */
export const THEMES: Theme[] = [
  {
    id: 'fnt',
    label: 'ФНТ (базовая)',
    note: 'Синий акцент федерации на тёмном стекле — то, что в макетах по умолчанию.',
    seeds: {},
  },
  {
    id: 'emerald',
    label: 'Изумруд',
    note: 'Зелёно-бирюзовый акцент, холодный тёмный фон. Проверка: успех и акцент не сливаются.',
    seeds: {
      '--seed-accent': '#3fd6a8',
      '--seed-accent-2': '#2ea3ff',
      '--seed-accent-3': '#35c8c0',
      '--seed-success': '#a3e635',
      '--seed-success-ink': '#132200',
      '--seed-warning': '#fbbf24',
      '--seed-danger': '#fb7185',
      '--seed-screen-1': '#07191c',
      '--seed-screen-2': '#051215',
      '--seed-screen-3': '#082024',
      '--seed-screen-4': '#071d20',
      '--seed-bezel-1': '#1e3b3b',
      '--seed-bezel-2': '#06161a',
      '--seed-board': '#eef6f4',
      '--seed-board-accent': '#0f9b74',
      '--seed-light-accent': '#0d9488',
      '--seed-light-success': '#16a34a',
    },
  },
  {
    id: 'sunset',
    label: 'Закат',
    note: 'Тёплый оранжево-розовый акцент на сливовом фоне — «вечерняя трансляция».',
    seeds: {
      '--seed-accent': '#ff9f6b',
      '--seed-accent-2': '#ff5f8f',
      '--seed-accent-3': '#ffb457',
      '--seed-success': '#34d399',
      '--seed-warning': '#facc15',
      '--seed-danger': '#ff5470',
      '--seed-screen-1': '#1b1022',
      '--seed-screen-2': '#150b1a',
      '--seed-screen-3': '#211427',
      '--seed-screen-4': '#1d1124',
      '--seed-bezel-1': '#3a2140',
      '--seed-bezel-2': '#160b1b',
      '--seed-board': '#f8f0ec',
      '--seed-board-accent': '#d2622a',
      '--seed-light-accent': '#ea580c',
      '--seed-light-success': '#059669',
    },
  },
  {
    id: 'graphite',
    label: 'Графит',
    note: 'Нейтральная сталь без цветного акцента — видно, что цвет держат только статусы.',
    seeds: {
      '--seed-accent': '#9aa7bd',
      '--seed-accent-2': '#7c8aa3',
      '--seed-accent-3': '#8f9bb3',
      '--seed-success': '#6ee7b7',
      '--seed-warning': '#e5c07b',
      '--seed-danger': '#f87171',
      '--seed-screen-1': '#101318',
      '--seed-screen-2': '#0b0d11',
      '--seed-screen-3': '#14181e',
      '--seed-screen-4': '#12161b',
      '--seed-bezel-1': '#2b3038',
      '--seed-bezel-2': '#0b0d11',
      '--seed-board': '#f0f1f4',
      '--seed-board-accent': '#4b5563',
      '--seed-light-accent': '#475569',
      '--seed-light-success': '#0f766e',
    },
  },
];

export const DEFAULT_THEME: ThemeId = 'fnt';

/** все переменные, которые вообще трогают темы — чтобы корректно снимать старые */
const ALL_KEYS = Array.from(new Set(THEMES.flatMap((t) => Object.keys(t.seeds))));

/** Выставляет тему на элементе (по умолчанию — `:root` превью). */
export function applyTheme(id: unknown, el: HTMLElement = document.documentElement): void {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
  for (const key of ALL_KEYS) {
    const value = theme.seeds[key];
    if (value) el.style.setProperty(key, value);
    else el.style.removeProperty(key);
  }
  el.dataset.theme = theme.id;
}
