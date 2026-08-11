/* Сгенерировано: npm run gen:flows (источник — data/role07.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role07 } from './data/role07';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/07 · Главный секретарь соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role07) };
export const S1 = { name: 'Э7.1 · Рабочий стол секретаря', render: screenRender(role07, 'Э7.1') };
export const S2 = { name: 'Э7.2 · Жеребьёвка', render: screenRender(role07, 'Э7.2') };
export const S3 = { name: 'Э7.3 · Сетка — сборка', render: screenRender(role07, 'Э7.3') };
export const S4 = { name: 'Э7.4 · Расписание', render: screenRender(role07, 'Э7.4') };
export const S5 = { name: 'Э7.5 · Протоколы', render: screenRender(role07, 'Э7.5') };
