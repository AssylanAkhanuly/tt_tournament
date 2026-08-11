import { Role06Board } from './role06';

export default {
  title: 'Макеты/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 7 экранов', render: () => <Role06Board /> };
