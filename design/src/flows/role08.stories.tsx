/* Сгенерировано: npm run gen:flows (источник — data/role08.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role08 } from './data/role08';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/08 · Заместитель главного судьи',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role08) };
export const S1 = { name: 'Э8.1 · Мой турнир — режим замещения', render: screenRender(role08, 'Э8.1') };
export const S2 = { name: 'Э8.2 · Ход турнира — когда замещает', render: screenRender(role08, 'Э8.2') };
export const S3 = { name: 'Э8.3 · Мой рейтинг судьи', render: screenRender(role08, 'Э8.3') };
