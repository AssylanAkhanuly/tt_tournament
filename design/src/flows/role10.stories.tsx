/* Сгенерировано: npm run gen:flows (источник — data/role10.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-10.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role10 } from './data/role10';
import { Role10Board } from '../mockups/role10';

export default {
  title: 'Флоу/10 · Инспектор / супервайзер',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role10}>
      <Role10Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 4 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 10 · Инспектор / супервайзер" source="flows/10-inspektor.md" />,
};
