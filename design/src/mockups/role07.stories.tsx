import { Role07Board } from './role07';

export default {
  title: 'Макеты/07 · Главный секретарь соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 5 экранов', render: () => <Role07Board /> };
