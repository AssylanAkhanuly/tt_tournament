import type { Meta, StoryObj } from '@storybook/react';
import { TournamentFlowBoard } from './TournamentFlow';

/* Мобильное приложение → Игрок: обзор турнира → сетка-карта → live-табло.
   Сетка — настоящий React Flow из front/ (не мокап). */
const meta: Meta = {
  title: 'Мобильное приложение/Игрок',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Турнир: StoryObj = { render: () => <TournamentFlowBoard /> };
