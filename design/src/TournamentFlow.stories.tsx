import type { Meta, StoryObj } from '@storybook/react';
import { TournamentFlowBoard } from './TournamentFlow';

/* По правилу design/README.md: в Storybook показываем ТОЛЬКО флоу, отдельные
   экраны не выносим. Экраны (обзор → сетка-карта → судья стола → live-табло) —
   это компоненты внутри флоу-борда. Сетка — реальный React Flow из front/. */
const meta: Meta = {
  title: 'Турнир/Флоу',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Флоу: StoryObj = { render: () => <TournamentFlowBoard /> };
