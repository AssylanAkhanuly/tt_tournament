import { Role01Board } from './role01';
import { Role01PhoneBoard, Role01TabletBoard } from './role01resp';

export default {
  title: 'Макеты/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 15 экранов', render: () => <Role01Board /> };

export const Phone = { name: 'Адаптив · телефон', render: () => <Role01PhoneBoard /> };
