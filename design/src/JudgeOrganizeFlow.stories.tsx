import type { Meta, StoryObj } from '@storybook/react';
import { JudgeOrganizeFlowBoard } from './JudgeOrganizeFlow';
import { OrganizeTabletBoard, OrganizeMobileBoard } from './JudgeOrganizeResponsive';

/* Веб → Судья · Организация турнира: настройка → на утверждении.
   Три версии одного флоу — десктоп / планшет / телефон. */
const meta: Meta = {
  title: 'Веб/Судья/Организация турнира',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <JudgeOrganizeFlowBoard /> };
export const Таблет: S = { render: () => <OrganizeTabletBoard /> };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <JudgeOrganizeFlowBoard frame="land" /> };
export const Мобилка: S = { render: () => <OrganizeMobileBoard /> };
