/* Сгенерировано: npm run gen:flows (источник — data/role12.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role12 } from './data/role12';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/12 · Старший тренер региона',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role12) };
export const S1 = { name: 'Э12.1 · Мой регион', render: screenRender(role12, 'Э12.1') };
export const S2 = { name: 'Э12.2 · Календарь главных стартов', render: screenRender(role12, 'Э12.2') };
export const S3 = { name: 'Э12.3 · Формирование состава', render: screenRender(role12, 'Э12.3') };
export const S4 = { name: 'Э12.4 · Мои заявки', render: screenRender(role12, 'Э12.4') };
export const S5 = { name: 'Э12.5 · Свои на турнире — просмотр', render: screenRender(role12, 'Э12.5') };
