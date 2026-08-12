/* Сгенерировано: npm run gen:flows (источник — data/role09.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-09.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role09 } from './data/role09';
import { Role09Board } from '../mockups/role09';

export default {
  title: 'Флоу/09 · Судья',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role09}>
      <Role09Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 5 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 9 · Судья" source="flows/09-sudya.md" />,
};
