/* Сквозной ход турнира по категориям календаря — истории собраны руками, а не
   генератором.

   Генератор (`npm run gen:flows`) делает истории ролей из `data/roleNN.ts`;
   здесь роли нет — есть турнир, который идёт через них все. Категорий три
   (ТЗ §4.1), и различаются они тем, кто заявляет: главные старты — старший
   тренер региона, Евразийскую лигу — администратор клуба командой, открытый
   турнир — спортсмен сам. Общее у них написано один раз, данные путей —
   в `data/tournament.ts`.

   Клубных турниров здесь нет: они вне контура флоу (`flows/README.md`). */

import { TournamentMap } from './tournament';

export default {
  title: 'Флоу/Ход турнира',
  parameters: { layout: 'fullscreen' },
};

export const Main = {
  name: 'Главный старт · заявляет регион',
  render: () => <TournamentMap tour="main" />,
};

export const League = {
  name: 'Евразийская лига · заявляет клуб командой',
  render: () => <TournamentMap tour="league" />,
};

export const Open = {
  name: 'Открытый республиканский · заявляется сам',
  render: () => <TournamentMap tour="ort" />,
};
