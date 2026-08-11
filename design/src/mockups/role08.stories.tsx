import { Role08Board } from './role08';

export default {
  title: 'Макеты/08 · Заместитель главного судьи',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 3 экрана', render: () => <Role08Board /> };
