import { Role01Board } from './role01';

export default {
  title: 'Макеты/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 8 экранов', render: () => <Role01Board /> };
