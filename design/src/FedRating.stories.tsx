import type { Meta, StoryObj } from '@storybook/react';
import { RatingScreen, RatingTablet, RatingMobile } from './FedRating';

/* Веб → Федерация · Игроки/Рейтинг: республиканский рейтинг. 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Федерация/Игроки и рейтинг',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <RatingScreen /> };
export const Таблет: S = { render: () => <RatingTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <RatingScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <RatingMobile />, parameters: { layout: 'centered' } };
