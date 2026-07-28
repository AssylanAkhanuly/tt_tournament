import type { Meta, StoryObj } from '@storybook/react';
import { PlayerFlowBoard } from './PlayerApp';

/* Только флоу (см. design/README.md): отдельные экраны (главная, уведомления,
   статистика, турниры) — компоненты внутри флоу-борда, отдельными историями
   их не показываем. */
const meta: Meta = {
  title: 'Игрок/Мобильное приложение',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Флоу: StoryObj = { render: () => <PlayerFlowBoard /> };
