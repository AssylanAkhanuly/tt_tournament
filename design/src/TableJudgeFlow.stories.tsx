import type { Meta, StoryObj } from '@storybook/react';
import { TableJudgeFlowBoard } from './TableJudgeFlow';
import { TableJudgeDesktopBoard, TableJudgeTabletBoard } from './TableJudgeResponsive';

/* Веб (адаптив) → Судья стола: назначен стол → ввод счёта → матч завершён.
   Три версии одного флоу — десктоп / планшет / телефон (правило design/README.md). */
const meta: Meta = {
  title: 'Веб/Судья стола',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <TableJudgeDesktopBoard /> };
export const Таблет: S = { render: () => <TableJudgeTabletBoard /> };
export const Мобилка: S = { render: () => <TableJudgeFlowBoard /> };
