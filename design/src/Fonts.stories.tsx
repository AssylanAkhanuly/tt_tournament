import type { Meta, StoryObj } from '@storybook/react';
/* Файл специмена называется FontSpecimen.tsx, а не Fonts.tsx: на файловых
   системах без учёта регистра (Windows) импорт './Fonts' попадал в './fonts.ts'
   — список гарнитур вместо компонента, и сборка падала. */
import { FontSpecimen } from './FontSpecimen';

/* Сравнение гарнитур в одном кадре. Примерить шрифт на живом экране — тулбар
   «Шрифт» сверху: он меняет токен --font во всех историях. */
const meta: Meta<typeof FontSpecimen> = {
  title: 'Дизайн-система/Шрифты',
  component: FontSpecimen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Специмен: StoryObj<typeof FontSpecimen> = {};
