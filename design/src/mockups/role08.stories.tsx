import { Role08Board, Shift8_1 } from './role08';

export default {
  title: 'Макеты/08 · Заместитель главного судьи',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 4 экрана', render: () => <Role08Board /> };

