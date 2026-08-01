import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/tokens.css';
import { DEFAULT_FONT, FONTS, fontStack } from '../src/fonts';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: {
      // Порядок разделов: глобальный «Обзор» (карта флоу и т.п.) первым,
      // дальше платформы, дизайн-система в конце.
      storySort: { order: ['Обзор', 'Веб', 'Мобильное приложение', 'Дизайн-система'] },
    },
  },

  // Примерка гарнитур: в тулбаре выбираем шрифт, он подставляется в токен
  // `--font`, на котором сидят все макеты. Историю можно прибить к своему
  // шрифту через `globals: { font: 'onest' }` в её аннотации.
  globalTypes: {
    font: {
      name: 'Шрифт',
      description: 'Гарнитура макета',
      toolbar: {
        icon: 'paragraph',
        items: FONTS.map((f) => ({ value: f.id, title: f.label })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { font: DEFAULT_FONT },

  decorators: [
    (Story, ctx) => {
      const stack = fontStack(ctx.globals.font);
      // Синхронно, чтобы не мигало на первом кадре; --font живёт на :root.
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--font', stack);
      }
      return <Story />;
    },
  ],
};

export default preview;
