import type { Meta, StoryObj } from '@storybook/react';
import { ThemeBuilder } from './Builder';

/* Конструктор темы: каждый цвет системы — своей пипеткой. «Применить»
   сохраняет палитру как тему «Свой цвет», её видно в тулбаре «Тема» и можно
   ходить с ней по всем экранам. */
const meta: Meta<typeof ThemeBuilder> = {
  title: 'Дизайн-система/Конструктор темы',
  component: ThemeBuilder,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Палитра: StoryObj<typeof ThemeBuilder> = {};
