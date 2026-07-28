import type { Meta, StoryObj } from '@storybook/react';
import { PlayerFlowBoard } from './PlayerApp';

/* Только флоу (design/README.md). Раздел: Мобильное приложение → Игрок. */
const meta: Meta = {
  title: 'Мобильное приложение/Игрок',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Приложение: StoryObj = { render: () => <PlayerFlowBoard /> };
