/* Сгенерировано: npm run gen:flows (источник — data/role01.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role01 } from './data/role01';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role01) };
export const S1 = { name: 'Э1.1 · Панель Федерации', render: screenRender(role01, 'Э1.1') };
export const S2 = { name: 'Э1.2 · Календарь сезона', render: screenRender(role01, 'Э1.2') };
export const S3 = { name: 'Э1.3 · Карточка турнира', render: screenRender(role01, 'Э1.3') };
export const S4 = { name: 'Э1.4 · Форма «Завести соревнование»', render: screenRender(role01, 'Э1.4') };
export const S5 = { name: 'Э1.5 · Пользователи и роли', render: screenRender(role01, 'Э1.5') };
export const S6 = { name: 'Э1.6 · Реестры', render: screenRender(role01, 'Э1.6') };
export const S7 = { name: 'Э1.7 · Журнал действий', render: screenRender(role01, 'Э1.7') };
export const S8 = { name: 'Э1.8 · Новости и страницы', render: screenRender(role01, 'Э1.8') };
