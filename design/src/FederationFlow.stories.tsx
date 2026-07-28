import type { Meta, StoryObj } from '@storybook/react';
import { FederationFlowBoard } from './FederationFlow';
import { FederationTabletBoard, FederationMobileBoard } from './FederationResponsive';

/* Веб → Федерация: календарь/создать → выбрать судью → приёмка результатов.
   Три версии одного флоу — десктоп / планшет / телефон. */
const meta: Meta = {
  title: 'Веб/Федерация/Календарь и приёмка',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <FederationFlowBoard /> };
export const Таблет: S = { render: () => <FederationTabletBoard /> };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <FederationFlowBoard frame="land" /> };
export const Мобилка: S = { render: () => <FederationMobileBoard /> };
