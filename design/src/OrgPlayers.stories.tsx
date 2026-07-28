import type { Meta, StoryObj } from '@storybook/react';
import { PlayersScreen, PlayersTablet, PlayersMobile } from './OrgPlayers';

/* Веб → Главный судья · Игроки: участники турнира. 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Главный судья/Игроки',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <PlayersScreen /> };
export const Таблет: S = { render: () => <PlayersTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <PlayersScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <PlayersMobile />, parameters: { layout: 'centered' } };
