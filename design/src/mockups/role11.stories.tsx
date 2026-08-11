import { Role11Board } from './role11';

export default {
  title: 'Макеты/11 · Главный тренер национальной команды',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 3 экрана', render: () => <Role11Board /> };
