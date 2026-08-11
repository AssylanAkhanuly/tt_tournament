/* Сгенерировано: npm run gen:flows (источник — data/role11.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role11 } from './data/role11';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/11 · Главный тренер национальной команды',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role11) };
export const S1 = { name: 'Э11.1 · Кандидаты в сборную', render: screenRender(role11, 'Э11.1') };
export const S2 = { name: 'Э11.2 · Карточка спортсмена — чтение', render: screenRender(role11, 'Э11.2') };
export const S3 = { name: 'Э11.3 · Сравнение кандидатов', render: screenRender(role11, 'Э11.3') };
