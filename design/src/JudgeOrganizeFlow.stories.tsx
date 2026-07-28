import type { Meta, StoryObj } from '@storybook/react';
import { JudgeOrganizeFlowBoard } from './JudgeOrganizeFlow';

/* Веб → Судья: организация турнира (настройка → на утверждении). */
const meta: Meta = {
  title: 'Веб/Судья',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const ОрганизацияТурнира: StoryObj = { render: () => <JudgeOrganizeFlowBoard /> };
