/* Сгенерировано: npm run gen:flows (источник — data/role13.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-13.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role13 } from './data/role13';
import { Role13Board } from '../mockups/role13';

export default {
  title: 'Флоу/13 · Администратор клуба',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 3 экрана',
  render: () => (
    <Paired flow={role13}>
      <Role13Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 13 · Администратор клуба" source="flows/13-admin-kluba.md" />,
};
