/* Сгенерировано: npm run gen:flows (источник — data/role00.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-00.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role00 } from './data/role00';
import { Role00Board } from '../mockups/role00';

export default {
  title: 'Флоу/00 · Сквозные экраны',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role00}>
      <Role00Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 4 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 0 · Сквозные экраны" source="flows/00-obshchie-ekrany.md" />,
};
