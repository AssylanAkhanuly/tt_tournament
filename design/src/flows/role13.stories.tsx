/* Сгенерировано: npm run gen:flows (источник — data/role13.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role13 } from './data/role13';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/13 · Администратор клуба',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role13) };
export const S1 = { name: 'Э13.1 · Мой клуб', render: screenRender(role13, 'Э13.1') };
export const S2 = { name: 'Э13.2 · Регистрация людей', render: screenRender(role13, 'Э13.2') };
export const S3 = { name: 'Э13.3 · Команды Лиги', render: screenRender(role13, 'Э13.3') };
