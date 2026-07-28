import type { Meta, StoryObj } from '@storybook/react';
import { JudgeApplyFlowBoard } from './JudgeApplyFlow';
import { JudgeApplyDesktopBoard, JudgeApplyTabletBoard } from './JudgeApplyResponsive';

/* Веб → Судья · Заявка на судейство: турниры → заявка → на рассмотрении → назначен.
   Три версии одного флоу — десктоп / планшет / телефон. */
const meta: Meta = {
  title: 'Веб/Судья/Заявка на судейство',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <JudgeApplyDesktopBoard /> };
export const Таблет: S = { render: () => <JudgeApplyTabletBoard /> };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <JudgeApplyDesktopBoard frame="land" /> };
export const Мобилка: S = { render: () => <JudgeApplyFlowBoard /> };
