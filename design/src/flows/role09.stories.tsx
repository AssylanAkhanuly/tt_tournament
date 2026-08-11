/* Сгенерировано: npm run gen:flows (источник — data/role09.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role09 } from './data/role09';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/09 · Судья',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role09) };
export const S1 = { name: 'Э9.1 · Мои турниры', render: screenRender(role09, 'Э9.1') };
export const S2 = { name: 'Э9.2 · Мой стол', render: screenRender(role09, 'Э9.2') };
export const S3 = { name: 'Э9.3 · Ввод счёта', render: screenRender(role09, 'Э9.3') };
export const S4 = { name: 'Э9.4 · История матча', render: screenRender(role09, 'Э9.4') };
export const S5 = { name: 'Э9.5 · Мой рейтинг судьи', render: screenRender(role09, 'Э9.5') };
