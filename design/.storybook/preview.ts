import type { Preview } from '@storybook/react';
import '../src/tokens.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: {
      // Флоу — первым, чтобы Storybook открывался сразу на странице флоу
      storySort: { order: ['Флоу', 'Экраны', 'Дизайн-система'] },
    },
  },
};

export default preview;
