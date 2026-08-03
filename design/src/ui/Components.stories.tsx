import type { Meta, StoryObj } from '@storybook/react';
import { ComponentGallery } from './Components';

/* Витрина примитивов `src/ui`. Тема и гарнитура — тулбар сверху. */
const meta: Meta<typeof ComponentGallery> = {
  title: 'Дизайн-система/Компоненты',
  component: ComponentGallery,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Витрина: StoryObj<typeof ComponentGallery> = {};
