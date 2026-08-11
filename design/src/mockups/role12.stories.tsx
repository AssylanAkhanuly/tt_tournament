import { Role12Board } from './role12';

export default {
  title: 'Макеты/12 · Старший тренер региона',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 5 экранов', render: () => <Role12Board /> };
