/* Темы = наборы «семян» из `tokens.css`. Всё остальное (стекло, свечения,
   подложки чипов, градиенты экранов, тени, поверхности) считается от них через
   `color-mix()`, поэтому одна тема — это десяток значений, а не сотня.

   Тема выбирается в тулбаре Storybook («Тема»); декоратор в
   `.storybook/preview.tsx` выставляет эти переменные на `:root`.
   Прибить тему к истории: `globals: { theme: 'ocean' }`, ссылка на экран в
   нужной теме — `?globals=theme:sunset`.

   Чтобы 28 тем не превратились в простыню, ступени тёмного экрана, корпус
   устройства и светлые производные считает `dark()`; светлым темам нужен
   отдельный набор (текст тёмный, грани — не белые), его собирает `light()`. */

import patternLight from './pattern-nomad-light.svg';
import { CUSTOM_ID, loadCustom } from './custom';

export type ThemeGroup = 'Тёмные' | 'Светлые' | 'Свои';

export type Theme = {
  id: string;
  label: string;
  group: ThemeGroup;
  /** чем тема отличается — подпись в специмене */
  note: string;
  /** переопределения переменных; пусто — базовые значения из tokens.css */
  seeds: Record<string, string>;
};

/* ── немного цветовой арифметики (чтобы темы описывались тремя цветами) ── */

const hex = (h: string) => {
  const v = h.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
const rgb = (c: number[]) => '#' + c.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
/** a + b в пропорции t (0 — только a, 1 — только b) */
const mix = (a: string, b: string, t: number) => rgb(hex(a).map((x, i) => x + (hex(b)[i] - x) * t));
const darken = (c: string, t: number) => mix(c, '#000000', t);
/** относительная яркость — по ней решаем, какой текст класть на заливку */
const luma = (c: string) => {
  const [r, g, b] = hex(c).map((v) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** текст поверх заливки: на светлом акценте белый не читается */
const inkOn = (c: string) => (luma(c) > 0.45 ? '#101725' : '#ffffff');

type DarkInput = {
  accent: string;
  accent2: string;
  accent3?: string;
  /** чем подкрашены ступени тёмного фона; по умолчанию — акцентом */
  tint?: string;
  success?: string;
  warning?: string;
  danger?: string;
};

function dark({ accent, accent2, accent3, tint, success = '#34d399', warning = '#f0b24b', danger = '#fb7185' }: DarkInput) {
  const t = tint ?? accent;
  return {
    '--seed-accent': accent,
    '--c-accent-ink': inkOn(accent),
    '--seed-accent-2': accent2,
    '--seed-accent-3': accent3 ?? mix(accent, accent2, 0.4),
    '--seed-success': success,
    '--seed-success-ink': inkOn(success),
    '--seed-warning': warning,
    '--seed-danger': danger,
    '--seed-screen-1': mix('#080b12', t, 0.17),
    '--seed-screen-2': mix('#05070c', t, 0.12),
    '--seed-screen-3': mix('#0b0f18', t, 0.2),
    '--seed-screen-4': mix('#090d15', t, 0.18),
    '--seed-bezel-1': mix('#232838', t, 0.32),
    '--seed-bezel-2': mix('#080b12', t, 0.18),
    '--seed-board': mix('#eef1f8', accent, 0.07),
    '--seed-board-accent': darken(accent, 0.32),
    '--seed-light-accent': darken(accent, 0.28),
    '--seed-light-success': darken(success, 0.24),
  };
}

type LightInput = {
  accent: string;
  /** тёплый/холодный оттенок бумаги */
  paper?: string;
  success?: string;
  warning?: string;
  danger?: string;
};

function light({ accent, paper = '#f2f5fa', success = '#0f9d68', warning = '#c2820f', danger = '#e05260' }: LightInput) {
  const line = mix(paper, '#0f172a', 0.12);
  return {
    ...dark({ accent, accent2: mix(accent, '#8b66ff', 0.35), success, warning, danger }),
    // бумага вместо тёмного экрана
    '--seed-screen-1': paper,
    '--seed-screen-2': mix(paper, '#ffffff', 0.45),
    '--seed-screen-3': mix(paper, '#0f172a', 0.05),
    '--seed-screen-4': mix(paper, '#ffffff', 0.25),
    '--seed-bezel-1': mix(paper, '#0f172a', 0.55),
    '--seed-bezel-2': mix(paper, '#0f172a', 0.78),
    // текст и поверхности переворачиваем
    '--seed-ink': '#0f172a',
    '--c-ink-bright': '#000000',
    '--seed-muted': '#525d75',
    '--seed-dim': '#8b95a8',
    '--c-panel': '#ffffff',
    '--c-panel-2': mix(paper, '#ffffff', 0.65),
    '--c-panel-3': mix(paper, '#ffffff', 0.85),
    '--c-panel-seg': mix(paper, '#0f172a', 0.05),
    '--c-panel-quiet': mix(paper, '#0f172a', 0.07),
    // грани на светлом — не белые, иначе их не видно
    '--c-glass-line': line,
    '--c-glass-line-soft': mix(paper, '#0f172a', 0.08),
    '--c-glass-hi': '#ffffff',
    '--c-glass-ring': line,
    '--c-glass-edge': line,
    '--c-avatar-bg': mix(paper, '#0f172a', 0.1),
    // узор-обои: на светлом нужна тёмная плитка вместо белой
    '--fx-pattern': `url(${patternLight})`,
    '--seed-board': mix('#ffffff', accent, 0.05),
  };
}

/* ── список тем ─────────────────────────────────────────────── */

export const THEMES: Theme[] = [
  { id: 'fnt', label: 'ФНТ (базовая)', group: 'Тёмные', note: 'Синий флага и знака ФНТ на тёмном холодном фоне — то, что в макетах по умолчанию.', seeds: {} },

  { id: 'tengri', label: 'Тенгри', group: 'Тёмные', note: 'Чистый голубой флага и золото солнца — самый «флаговый» вариант.',
    seeds: dark({ accent: '#00afca', accent2: '#ffd400', accent3: '#4cc6ee', warning: '#ffd400' }) },
  { id: 'indigo', label: 'Индиго', group: 'Тёмные', note: 'Глубокий сине-фиолетовый, спокойный и «ночной».',
    seeds: dark({ accent: '#7c86ff', accent2: '#b06cff' }) },
  { id: 'cobalt', label: 'Кобальт', group: 'Тёмные', note: 'Чистый насыщенный синий без фиолета — деловой тон.',
    seeds: dark({ accent: '#2e7bff', accent2: '#4fa3ff', tint: '#1a3f7a' }) },
  { id: 'ocean', label: 'Океан', group: 'Тёмные', note: 'Сине-зелёный: акцент бирюзовый, фон уходит в глубину.',
    seeds: dark({ accent: '#2fb8d8', accent2: '#3f8cff', tint: '#0d4655' }) },
  { id: 'turquoise', label: 'Бирюза', group: 'Тёмные', note: 'Светлая бирюза на тёмно-изумрудном — свежо и контрастно.',
    seeds: dark({ accent: '#38d6c8', accent2: '#3fa0ff', success: '#7ee787' }) },
  { id: 'emerald', label: 'Изумруд', group: 'Тёмные', note: 'Зелёный акцент; успех сдвинут в лайм, чтобы не сливаться с ним.',
    seeds: dark({ accent: '#3fd6a8', accent2: '#2ea3ff', success: '#a3e635', warning: '#fbbf24' }) },
  { id: 'mint', label: 'Мята', group: 'Тёмные', note: 'Мягкий мятный акцент, фон чуть теплее обычного.',
    seeds: dark({ accent: '#6ee7b7', accent2: '#5eead4', success: '#bef264', tint: '#123a33' }) },
  { id: 'pine', label: 'Хвоя', group: 'Тёмные', note: 'Тёмно-хвойный фон и приглушённый зелёный — сдержанно.',
    seeds: dark({ accent: '#4ba87a', accent2: '#7fbf6a', tint: '#0c2a1e', success: '#8fd694' }) },
  { id: 'steppe', label: 'Степь', group: 'Тёмные', note: 'Хаки и охра: земляные цвета кочевья.',
    seeds: dark({ accent: '#c2b280', accent2: '#a3894f', tint: '#2a2717', success: '#93c47d', warning: '#e0a82e' }) },
  { id: 'saffron', label: 'Шафран', group: 'Тёмные', note: 'Золотисто-жёлтый акцент; предупреждение уводим в оранжевый.',
    seeds: dark({ accent: '#ffc247', accent2: '#ff9f45', tint: '#2b2010', warning: '#ff9f45' }) },
  { id: 'amber', label: 'Янтарь', group: 'Тёмные', note: 'Тёплый янтарь на кофейном фоне.',
    seeds: dark({ accent: '#ffab3d', accent2: '#ff7a45', tint: '#2c1d10' }) },
  { id: 'copper', label: 'Медь', group: 'Тёмные', note: 'Медно-рыжий, глубокий коричневый фон.',
    seeds: dark({ accent: '#e0794b', accent2: '#c05a3a', tint: '#2b1811' }) },
  { id: 'coffee', label: 'Кофе', group: 'Тёмные', note: 'Молочно-бежевый акцент на тёмно-коричневом — уютный вариант.',
    seeds: dark({ accent: '#d9b48f', accent2: '#a9784f', tint: '#241a13' }) },
  { id: 'sunset', label: 'Закат', group: 'Тёмные', note: 'Тёплый оранжево-розовый акцент на сливовом фоне.',
    seeds: dark({ accent: '#ff9f6b', accent2: '#ff5f8f', tint: '#2a1424', danger: '#ff5470' }) },
  { id: 'cherry', label: 'Вишня', group: 'Тёмные', note: 'Красный акцент; отказ уводим в малиновый, чтобы различались.',
    seeds: dark({ accent: '#f4576b', accent2: '#ff7a8a', tint: '#2b1018', danger: '#ff4d6d' }) },
  { id: 'raspberry', label: 'Малина', group: 'Тёмные', note: 'Розово-малиновый, фон холодный сливовый.',
    seeds: dark({ accent: '#ff5fa2', accent2: '#c46bff', tint: '#2a1226' }) },
  { id: 'plum', label: 'Слива', group: 'Тёмные', note: 'Глубокий фиолетовый фон, акцент сиреневый.',
    seeds: dark({ accent: '#b487ff', accent2: '#ff6fd8', tint: '#231338' }) },
  { id: 'lavender', label: 'Лаванда', group: 'Тёмные', note: 'Светлая лаванда на серо-фиолетовом — мягко и спокойно.',
    seeds: dark({ accent: '#c0a6ff', accent2: '#9ec1ff', tint: '#1e1a2e' }) },
  { id: 'ultraviolet', label: 'Ультрафиолет', group: 'Тёмные', note: 'Пурпур и маджента, фон почти чёрный — контрастно.',
    seeds: dark({ accent: '#a855f7', accent2: '#ec4899', tint: '#170b26' }) },
  { id: 'aurora', label: 'Аврора', group: 'Тёмные', note: 'Зелёно-бирюзовый акцент с фиолетовым вторым пятном — северное сияние.',
    seeds: dark({ accent: '#4ade80', accent2: '#8b5cf6', accent3: '#22d3ee', tint: '#0d2233' }) },
  { id: 'neon', label: 'Неон', group: 'Тёмные', note: 'Кислотный лайм на почти чёрном — киберспортивный вариант.',
    seeds: dark({ accent: '#c6f135', accent2: '#22d3ee', tint: '#101408', success: '#34d399' }) },
  { id: 'steel', label: 'Сталь', group: 'Тёмные', note: 'Холодная сталь: акцент сине-серый, цвет держат только статусы.',
    seeds: dark({ accent: '#8fa6c4', accent2: '#6e88a8', tint: '#141a24' }) },
  { id: 'graphite', label: 'Графит', group: 'Тёмные', note: 'Нейтральный серый без цветного акцента — предельно спокойно.',
    seeds: dark({ accent: '#9aa7bd', accent2: '#7c8aa3', tint: '#0e1013', success: '#6ee7b7', warning: '#e5c07b', danger: '#f87171' }) },
  { id: 'carbon', label: 'Карбон', group: 'Тёмные', note: 'Почти чёрный фон и белый акцент — максимум контраста.',
    seeds: dark({ accent: '#e8ecf5', accent2: '#9aa7bd', tint: '#0a0a0b' }) },

  /* Светлая на акценте самой федерации (#0a86cd — синий флага и знака ФНТ, тот
     же, что в базовой тёмной). Отдельно от «Светлой» ниже: у той акцент
     #2f6bff — обычный интерфейсный синий, к знаку отношения не имеющий. */
  { id: 'daylight-fnt', label: 'Светлая · ФНТ', group: 'Светлые', note: 'Дневная тема на синем знака ФНТ: бумага вместо тёмного экрана, акцент тот же, что в базовой тёмной.',
    seeds: light({ accent: '#0a86cd' }) },
  { id: 'daylight', label: 'Светлая', group: 'Светлые', note: 'Дневная тема на нейтральном интерфейсном синем.',
    seeds: light({ accent: '#2f6bff' }) },
  { id: 'daylight-emerald', label: 'Светлая · изумруд', group: 'Светлые', note: 'То же на светлом, но акцент зелёный.',
    seeds: light({ accent: '#0f9d68', paper: '#f1f6f3' }) },
  { id: 'daylight-sand', label: 'Светлая · песок', group: 'Светлые', note: 'Тёплая бумага и терракотовый акцент.',
    seeds: light({ accent: '#c2410c', paper: '#f8f3ec' }) },
  { id: 'daylight-slate', label: 'Светлая · графит', group: 'Светлые', note: 'Серая бумага, нейтральный акцент — для печати и документов.',
    seeds: light({ accent: '#475569', paper: '#eef0f4' }) },
];

/* ── что можно крутить руками в конструкторе ────────────────── */

export type EditableField = {
  key: string;
  label: string;
  group: string;
  hint?: string;
  /** токен полупрозрачный по смыслу — в конструкторе к нему идёт процент */
  alpha?: boolean;
};

/** Каждый цвет системы — отдельным полем. Порядок = порядок в конструкторе. */
export const EDITABLE: EditableField[] = [
  { key: '--seed-accent',        group: 'Акцент',    label: 'Акцент',                hint: 'кнопки, активные вкладки, счёт победителя' },
  { key: '--c-accent-ink',       group: 'Акцент',    label: 'Текст на акценте' },
  { key: '--seed-accent-2',      group: 'Акцент',    label: 'Второе пятно фона' },
  { key: '--seed-accent-3',      group: 'Акцент',    label: 'Третье пятно фона' },
  { key: '--c-accent-soft',      group: 'Акцент',    label: 'Подложка чипа',         hint: 'пилюля «заявка», иконка-плашка', alpha: true },
  { key: '--c-accent-line',      group: 'Акцент',    label: 'Граница «идёт сейчас»', alpha: true },
  { key: '--c-accent-glow-2',    group: 'Акцент',    label: 'Свечение под кнопкой',  alpha: true },

  { key: '--seed-success',       group: 'Статусы',   label: 'Успех',                 hint: 'победа, «идёт сейчас»' },
  { key: '--seed-success-ink',   group: 'Статусы',   label: 'Текст на зелёном' },
  { key: '--seed-warning',       group: 'Статусы',   label: 'Ожидание' },
  { key: '--seed-danger',        group: 'Статусы',   label: 'Отказ' },
  { key: '--seed-broadcast',     group: 'Статусы',   label: 'Эфир — верх градиента' },
  { key: '--seed-broadcast-2',   group: 'Статусы',   label: 'Эфир — низ градиента' },
  { key: '--c-success-soft',     group: 'Статусы',   label: 'Подложка зелёной пилюли', alpha: true },
  { key: '--c-warning-soft',     group: 'Статусы',   label: 'Подложка жёлтой пилюли',  alpha: true },
  { key: '--c-danger-soft',      group: 'Статусы',   label: 'Подложка красной пилюли', alpha: true },

  { key: '--seed-ink',           group: 'Текст',     label: 'Основной текст' },
  { key: '--c-ink-bright',       group: 'Текст',     label: 'Максимальный контраст' },
  { key: '--seed-muted',         group: 'Текст',     label: 'Второстепенный' },
  { key: '--seed-dim',           group: 'Текст',     label: 'Подсказки, даты' },

  { key: '--seed-screen-1',      group: 'Экран',     label: 'Фон — верх' },
  { key: '--seed-screen-2',      group: 'Экран',     label: 'Фон — середина' },
  { key: '--seed-screen-3',      group: 'Экран',     label: 'Фон — низ' },
  { key: '--seed-screen-4',      group: 'Экран',     label: 'Фон — низ десктопа' },
  { key: '--seed-screen-deep',   group: 'Экран',     label: '«Остров» камеры' },
  { key: '--seed-avatar-bg',     group: 'Экран',     label: 'Заглушка под фото' },
  { key: '--c-ornament',         group: 'Экран',     label: 'Лента орнамента',       hint: 'узор со щита по правому краю', alpha: true },

  { key: '--c-panel',            group: 'Поверхности', label: 'Карточка',            hint: 'по умолчанию считается от фона' },
  { key: '--c-panel-2',          group: 'Поверхности', label: 'Панель, таб-бар' },
  { key: '--c-panel-3',          group: 'Поверхности', label: 'Сайдбар, подсказка' },
  { key: '--c-glass-line',       group: 'Поверхности', label: 'Граница поверхности', alpha: true },
  { key: '--c-glass-line-soft',  group: 'Поверхности', label: 'Разделитель строк',   alpha: true },
  { key: '--c-glass-hi',         group: 'Поверхности', label: 'Световая грань сверху', alpha: true },

  { key: '--seed-board',         group: 'Светлые',   label: 'Подложка флоу-борда' },
  { key: '--seed-board-ink',     group: 'Светлые',   label: 'Текст на борде' },
  { key: '--seed-board-muted',   group: 'Светлые',   label: 'Подписи на борде' },
  { key: '--seed-board-accent',  group: 'Светлые',   label: 'Акцент борда' },
  { key: '--seed-light-bg',      group: 'Светлые',   label: 'Фон светлой страницы' },
  { key: '--seed-light-surface', group: 'Светлые',   label: 'Карточка на светлом' },
  { key: '--seed-light-accent',  group: 'Светлые',   label: 'Акцент светлых страниц' },
  { key: '--seed-light-success', group: 'Светлые',   label: 'Успех на светлом' },

  { key: '--seed-bezel-1',       group: 'Корпус',    label: 'Корпус — верх' },
  { key: '--seed-bezel-2',       group: 'Корпус',    label: 'Корпус — низ' },
];

export const EDITABLE_GROUPS = Array.from(new Set(EDITABLE.map((f) => f.group)));

/* «Свой цвет» — то, что накручено в конструкторе; значения подставляются
   в момент применения, поэтому список тем их не хранит. */
THEMES.push({
  id: CUSTOM_ID,
  label: 'Свой цвет (конструктор)',
  group: 'Свои',
  note: 'Ручная палитра из истории «Дизайн-система → Конструктор темы». Хранится в браузере и работает на всех экранах.',
  seeds: {},
});

export const DEFAULT_THEME = 'fnt';

export const THEME_GROUPS: ThemeGroup[] = ['Тёмные', 'Светлые', 'Свои'];

/** все переменные, которые вообще трогают темы — чтобы корректно снимать старые */
const ALL_KEYS = Array.from(new Set([...THEMES.flatMap((t) => Object.keys(t.seeds)), ...EDITABLE.map((f) => f.key)]));

/** Выставляет тему на элементе (по умолчанию — `:root` превью). */
export function applyTheme(id: unknown, el: HTMLElement = document.documentElement): void {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
  const seeds = theme.id === CUSTOM_ID ? loadCustom() : theme.seeds;
  for (const key of ALL_KEYS) {
    const value = seeds[key];
    if (value) el.style.setProperty(key, value);
    else el.style.removeProperty(key);
  }
  el.dataset.theme = theme.id;
}
