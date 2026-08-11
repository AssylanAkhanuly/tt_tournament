/* Сгенерировано: npm run gen:flows (источник — data/role14.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role14 } from './data/role14';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/14 · Спортсмен',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role14) };
export const S1 = { name: 'Э14.1 · Главная', render: screenRender(role14, 'Э14.1') };
export const S2 = { name: 'Э14.2 · Календарь', render: screenRender(role14, 'Э14.2') };
export const S3 = { name: 'Э14.3 · Заявка на ОРТ', render: screenRender(role14, 'Э14.3') };
export const S4 = { name: 'Э14.4 · Моя заявка', render: screenRender(role14, 'Э14.4') };
export const S5 = { name: 'Э14.5 · Мой турнир и мой матч', render: screenRender(role14, 'Э14.5') };
export const S6 = { name: 'Э14.6 · Аналитика', render: screenRender(role14, 'Э14.6') };
export const S7 = { name: 'Э14.7 · Профиль и взнос', render: screenRender(role14, 'Э14.7') };
