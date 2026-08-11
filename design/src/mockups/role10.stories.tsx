import { Role10Board } from './role10';

export default {
  title: 'Макеты/10 · Инспектор / супервайзер',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 4 экрана', render: () => <Role10Board /> };
