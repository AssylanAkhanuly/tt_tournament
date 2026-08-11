/* Сгенерировано: npm run gen:flows (источник — data/role02.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role02 } from './data/role02';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/02 · Экономист / бухгалтер',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role02) };
export const S1 = { name: 'Э2.1 · Взносы за сезон', render: screenRender(role02, 'Э2.1') };
export const S2 = { name: 'Э2.2 · Карточка взноса', render: screenRender(role02, 'Э2.2') };
