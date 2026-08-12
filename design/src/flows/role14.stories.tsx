/* Сгенерировано: npm run gen:flows (источник — data/role14.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-14.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role14 } from './data/role14';
import { Role14Board } from '../mockups/role14';

export default {
  title: 'Флоу/14 · Спортсмен',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role14}>
      <Role14Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 7 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 14 · Спортсмен" source="flows/14-sportsmen.md" />,
};
