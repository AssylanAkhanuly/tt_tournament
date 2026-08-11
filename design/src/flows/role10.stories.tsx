/* Сгенерировано: npm run gen:flows (источник — data/role10.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role10 } from './data/role10';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/10 · Инспектор / супервайзер',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role10) };
export const S1 = { name: 'Э10.1 · Соревнования на контроле', render: screenRender(role10, 'Э10.1') };
export const S2 = { name: 'Э10.2 · Ход турнира глазами инспектора', render: screenRender(role10, 'Э10.2') };
export const S3 = { name: 'Э10.3 · Журнал правок и спорных ситуаций', render: screenRender(role10, 'Э10.3') };
export const S4 = { name: 'Э10.4 · Заключение', render: screenRender(role10, 'Э10.4') };
