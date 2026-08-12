/* Сгенерировано: npm run gen:flows (источник — data/role01.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-01.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role01 } from './data/role01';
import { Role01Board } from '../mockups/role01';

export default {
  title: 'Флоу/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 8 экранов',
  render: () => (
    <Paired flow={role01}>
      <Role01Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 8 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 1 · Администратор Федерации" source="flows/01-admin-federacii.md" />,
};
