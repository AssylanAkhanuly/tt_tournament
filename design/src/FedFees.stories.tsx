import type { Meta, StoryObj } from '@storybook/react';
import { FeesScreen, FeesTablet, FeesMobile } from './FedFees';

/* Веб → Федерация · Взносы: реестр оплаты стартового взноса. 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Федерация/Взносы',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <FeesScreen /> };
export const Таблет: S = { render: () => <FeesTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <FeesScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <FeesMobile />, parameters: { layout: 'centered' } };
