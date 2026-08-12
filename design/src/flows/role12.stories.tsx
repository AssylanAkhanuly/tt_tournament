/* Сгенерировано: npm run gen:flows (источник — data/role12.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-12.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role12 } from './data/role12';
import { Role12Board } from '../mockups/role12';

export default {
  title: 'Флоу/12 · Старший тренер региона',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role12}>
      <Role12Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 5 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 12 · Старший тренер региона" source="flows/12-starshiy-trener-regiona.md" />,
};
