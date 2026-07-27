import type { Meta, StoryObj } from '@storybook/react';
import { RefereeDesktop } from './DesktopReferee';

/* Десктоп главного судьи — живое ведение турнира. */
const meta: Meta = {
  title: 'Главный судья/Десктоп',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Обзор: StoryObj = { render: () => <RefereeDesktop /> };
