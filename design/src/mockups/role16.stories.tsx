import { Role16Board } from './role16';

export default {
  title: 'Макеты/16 · Дисциплинарный комитет',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 4 экрана', render: () => <Role16Board /> };
