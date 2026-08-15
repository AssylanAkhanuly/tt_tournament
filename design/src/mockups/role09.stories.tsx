import { Role09Board } from './role09';

export default {
  title: 'Макеты/09 · Судья',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 6 экранов', render: () => <Role09Board /> };
