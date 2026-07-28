import type { Meta, StoryObj } from '@storybook/react';
import { TableJudgeFlowBoard } from './TableJudgeFlow';

/* Веб (адаптив) → Судья стола: назначен стол → ввод счёта → матч завершён. */
const meta: Meta = {
  title: 'Веб/Судья стола',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Флоу: StoryObj = { render: () => <TableJudgeFlowBoard /> };
