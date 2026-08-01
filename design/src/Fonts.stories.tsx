import type { Meta, StoryObj } from '@storybook/react';
import { FontSpecimen } from './Fonts';

/* Сравнение гарнитур в одном кадре. Примерить шрифт на живом экране — тулбар
   «Шрифт» сверху: он меняет токен --font во всех историях. */
const meta: Meta<typeof FontSpecimen> = {
  title: 'Дизайн-система/Шрифты',
  component: FontSpecimen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Специмен: StoryObj<typeof FontSpecimen> = {};
