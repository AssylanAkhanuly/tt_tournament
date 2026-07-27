import type { Meta, StoryObj } from '@storybook/react';
import { PlayerHome, PlayerNotifications, PlayerStats, PlayerTournaments, PlayerFlowBoard } from './PlayerApp';

/* Экраны игрока (тёмная тема iOS), собранные по мокапу-ориентиру из
   пайплайна gen/. Каждый экран — отдельная история, плюс общий флоу-борд. */
const meta: Meta = {
  title: 'Игрок/Мобильное приложение',
  parameters: { layout: 'centered' },
};
export default meta;
type S = StoryObj;

export const Главная: S = { render: () => <PlayerHome /> };
export const Уведомления: S = { render: () => <PlayerNotifications /> };
export const Статистика: S = { render: () => <PlayerStats /> };
export const Турниры: S = { render: () => <PlayerTournaments /> };
export const ФлоуБорд: S = { render: () => <PlayerFlowBoard />, parameters: { layout: 'fullscreen' } };
