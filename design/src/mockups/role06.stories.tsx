import { Role06Board, Tournament6_1 } from './role06';

export default {
  title: 'Макеты/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 11 экранов', render: () => <Role06Board /> };

