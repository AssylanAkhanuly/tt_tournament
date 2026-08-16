import { Role01Board } from './role01';
import { Role01PhoneBoard, Role01TabletBoard } from './role01resp';

export default {
  title: 'Макеты/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

export const Flow = { name: 'Макеты по флоу · 14 экранов', render: () => <Role01Board /> };

export const Tablet = { name: 'Адаптив · планшет', render: () => <Role01TabletBoard /> };

export const Phone = { name: 'Адаптив · телефон', render: () => <Role01PhoneBoard /> };
