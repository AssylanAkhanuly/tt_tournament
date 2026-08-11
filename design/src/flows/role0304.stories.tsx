/* Сгенерировано: npm run gen:flows (источник — data/role0304.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role0304 } from './data/role0304';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/03–04 · Менеджеры-наблюдатели',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role0304) };
export const S1 = { name: 'Э3.1 · Обзорная панель', render: screenRender(role0304, 'Э3.1') };
export const S2 = { name: 'Э3.2 · Модули в режиме чтения', render: screenRender(role0304, 'Э3.2') };
export const S3 = { name: 'Э3.3 · Подписки', render: screenRender(role0304, 'Э3.3') };
