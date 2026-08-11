import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/theme/tokens.css';
import '../src/ui/ui.css';
import { DEFAULT_FONT, FONTS, ensureFontsLoaded, fontStack } from '../src/fonts';
import { DEFAULT_THEME, THEMES, applyTheme } from '../src/theme/themes';

// Гарнитуры грузим из списка `src/fonts.ts` — он единственный источник, ссылка
// на Google Fonts собирается из него же (иначе список и <link> разъезжаются).
ensureFontsLoaded();

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: {
      // Порядок разделов: глобальный «Обзор» (карта флоу и т.п.) первым, за ним
      // «Флоу» (маршруты ролей поэкранно), дальше платформы, дизайн-система в
      // конце. Внутри «Флоу» первым идёт свой обзор, остальные роли — по
      // номеру: он дополнен нулём в заголовке (`01 · …`), поэтому обычная
      // сортировка строкой даёт правильный порядок.
      storySort: {
        order: [
          'Обзор',
          'Флоу',
          ['Обзор', '*'],
          'Макеты',
          'Веб',
          'Мобильное приложение',
          'Дизайн-система',
        ],
      },
    },
  },

  // Тулбар: тема (цвет) и гарнитура. Оба переключателя работают одинаково —
  // подменяют переменные на `:root`, на которых сидит вся вёрстка макетов.
  // Прибить к истории: `globals: { theme: 'sunset', font: 'onest' }`.
  globalTypes: {
    theme: {
      name: 'Тема',
      description: 'Цветовая тема (семена токенов)',
      toolbar: {
        icon: 'paintbrush',
        // подпись справа = группа темы (тёмные / светлые), как в списке шрифтов
        items: THEMES.map((t) => ({ value: t.id, title: t.label, right: t.group.toLowerCase() })),
        dynamicTitle: true,
      },
    },
    font: {
      name: 'Шрифт',
      description: 'Гарнитура макета',
      toolbar: {
        icon: 'paragraph',
        items: FONTS.map((f) => ({
          value: f.id,
          title: f.label,
          // подпись справа = раздел списка (гротеск / дисплейный / …)
          right: f.group === 'Системный' ? undefined : f.group.toLowerCase(),
        })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME, font: DEFAULT_FONT },

  decorators: [
    (Story, ctx) => {
      // Синхронно, чтобы не мигало на первом кадре; переменные живут на :root.
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--font', fontStack(ctx.globals.font));
        applyTheme(ctx.globals.theme);
      }
      return <Story />;
    },
  ],
};

export default preview;
