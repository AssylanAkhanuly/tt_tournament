import type { Meta, StoryObj } from '@storybook/react';
import { FederationFlowBoard } from './FederationFlow';

/* Веб → Федерация: календарь/создать → выбрать судью → приёмка результатов. */
const meta: Meta = {
  title: 'Веб/Федерация',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Флоу: StoryObj = { render: () => <FederationFlowBoard /> };
