import { Role13Board } from './role13';

export default {
  title: 'Макеты/13 · Администратор клуба',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 3 экрана', render: () => <Role13Board /> };
