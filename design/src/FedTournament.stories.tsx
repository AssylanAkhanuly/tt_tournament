import type { Meta, StoryObj } from '@storybook/react';
import { TournamentScreen, TournamentTablet, TournamentMobile } from './FedTournament';

/* Веб → Федерация · Турнир: карточка турнира (сводка + сетка). 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Федерация/Турнир',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <TournamentScreen /> };
export const Таблет: S = { render: () => <TournamentTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <TournamentScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <TournamentMobile />, parameters: { layout: 'centered' } };
