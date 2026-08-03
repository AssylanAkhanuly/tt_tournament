import type { Meta, StoryObj } from '@storybook/react';
import { GalleryBase, GalleryData, GalleryDomain, GalleryFeedback, GalleryForms, GalleryNav } from './Components';

/* Витрины примитивов `src/ui`, по разделам. Тема и гарнитура — тулбар сверху:
   всё нарисовано на токенах, поэтому перекрашивается вместе с макетами. */
const meta: Meta = {
  title: 'Дизайн-система/Компоненты',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Основа: StoryObj = { render: () => <GalleryBase /> };
export const Формы: StoryObj = { render: () => <GalleryForms /> };
export const Навигация: StoryObj = { render: () => <GalleryNav /> };
export const Данные: StoryObj = { render: () => <GalleryData /> };
export const ОбратнаяСвязь: StoryObj = { name: 'Обратная связь', render: () => <GalleryFeedback /> };
export const Турнирные: StoryObj = { render: () => <GalleryDomain /> };
