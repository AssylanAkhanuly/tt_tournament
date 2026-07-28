import type { Preview } from '@storybook/react';
import '../src/tokens.css';

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
};

export default preview;
