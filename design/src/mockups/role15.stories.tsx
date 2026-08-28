import { Role15Board } from './role15';

export default {
  title: 'Макеты/15 · Председатель СК региона',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 5 экранов', render: () => <Role15Board /> };
