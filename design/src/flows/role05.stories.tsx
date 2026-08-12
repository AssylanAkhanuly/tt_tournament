/* Сгенерировано: npm run gen:flows (источник — data/role05.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-05.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role05 } from './data/role05';
import { Role05Board } from '../mockups/role05';

export default {
  title: 'Флоу/05 · Председатель ГСК',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role05}>
      <Role05Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 7 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 5 · Председатель ГСК" source="flows/05-predsedatel-gsk.md" />,
};
