import type { Meta, StoryObj } from '@storybook/react';
import { JudgeApplyFlowBoard } from './JudgeApplyFlow';

/* Веб → Судья: турниры для судейства → заявка → на рассмотрении → назначен. */
const meta: Meta = {
  title: 'Веб/Судья',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const ЗаявкаНаСудейство: StoryObj = { render: () => <JudgeApplyFlowBoard /> };
