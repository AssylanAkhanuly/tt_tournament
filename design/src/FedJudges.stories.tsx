import type { Meta, StoryObj } from '@storybook/react';
import { JudgesScreen, JudgesTablet, JudgesMobile } from './FedJudges';

/* Веб → Федерация · Судьи: реестр судей. 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Федерация/Судьи',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <JudgesScreen /> };
export const Таблет: S = { render: () => <JudgesTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <JudgesScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <JudgesMobile />, parameters: { layout: 'centered' } };
