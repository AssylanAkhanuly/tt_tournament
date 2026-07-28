import type { Meta, StoryObj } from '@storybook/react';
import { BracketScreen, BracketTablet, BracketMobile } from './OrgBracket';

/* Веб → Главный судья · Сетка: посев и жеребьёвка. 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Главный судья/Сетка',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <BracketScreen /> };
export const Таблет: S = { render: () => <BracketTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <BracketScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <BracketMobile />, parameters: { layout: 'centered' } };
