import type { Meta, StoryObj } from '@storybook/react';
import { ColorSpecimen } from './Colors';

/* Палитра дизайн-системы. Цвет меняется в `src/theme/tokens.css`, тема
   выбирается в тулбаре («Тема») — обновятся и этот специмен, и все макеты. */
const meta: Meta<typeof ColorSpecimen> = {
  title: 'Дизайн-система/Цвета',
  component: ColorSpecimen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Токены: StoryObj<typeof ColorSpecimen> = {};
