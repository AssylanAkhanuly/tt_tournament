import type { Meta, StoryObj } from '@storybook/react';
import { RefereeDesktop } from './DesktopReferee';

/* Веб → Главный судья: десктоп-панель живого ведения турнира (20 столов,
   настоящая сетка, очередь). */
const meta: Meta = {
  title: 'Веб/Главный судья',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Панель: StoryObj = { render: () => <RefereeDesktop /> };
