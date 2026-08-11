/* Сгенерировано: npm run gen:flows (источник — data/role05.ts).
   Руками не правим — правим данные роли и запускаем генератор. */

import { role05 } from './data/role05';
import { boardRender, screenRender } from './kit';

export default {
  title: 'Флоу/05 · Председатель ГСК',
  parameters: { layout: 'fullscreen' },
};

export const Board = { name: 'Весь флоу', render: boardRender(role05) };
export const S1 = { name: 'Э5.1 · Мои соревнования', render: screenRender(role05, 'Э5.1') };
export const S2 = { name: 'Э5.2 · Заявки судей на турнир', render: screenRender(role05, 'Э5.2') };
export const S3 = { name: 'Э5.3 · Наряд судей на турнир', render: screenRender(role05, 'Э5.3') };
export const S4 = { name: 'Э5.4 · Протокол на утверждении', render: screenRender(role05, 'Э5.4') };
export const S5 = { name: 'Э5.5 · Рейтинг судей — журнал начислений', render: screenRender(role05, 'Э5.5') };
export const S6 = { name: 'Э5.6 · Документы на проверке (S3 / S4)', render: screenRender(role05, 'Э5.6') };
export const S7 = { name: 'Э5.7 · Публикация рейтинга и апелляции', render: screenRender(role05, 'Э5.7') };
