/* Сгенерировано: npm run gen:flows (источник — data/role06.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role06 } from './data/role06';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role06) };
export const S1 = { name: 'Э6.1 · Мой турнир', render: screenRender(role06, 'Э6.1') };
export const S2 = { name: 'Э6.2 · Заявки участников', render: screenRender(role06, 'Э6.2') };
export const S3 = { name: 'Э6.3 · Сетка: формат, посев, сборка', render: screenRender(role06, 'Э6.3') };
export const S4 = { name: 'Э6.4 · Расписание и столы', render: screenRender(role06, 'Э6.4') };
export const S5 = { name: 'Э6.5 · Судьи на столах', render: screenRender(role06, 'Э6.5') };
export const S6 = { name: 'Э6.6 · Ход турнира', render: screenRender(role06, 'Э6.6') };
export const S7 = { name: 'Э6.7 · Итоговый протокол', render: screenRender(role06, 'Э6.7') };
