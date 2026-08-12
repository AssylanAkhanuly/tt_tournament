/* Сгенерировано: npm run gen:flows (источник — data/role06.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-06.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role06 } from './data/role06';
import { Role06Board } from '../mockups/role06';

export default {
  title: 'Флоу/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role06}>
      <Role06Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 7 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 6 · Главный судья соревнований" source="flows/06-glavnyy-sudya.md" />,
};
