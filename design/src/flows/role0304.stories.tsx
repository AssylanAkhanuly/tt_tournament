/* Сгенерировано: npm run gen:flows (источник — data/role0304.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-03-04.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role0304 } from './data/role0304';
import { Role0304Board } from '../mockups/role0304';

export default {
  title: 'Флоу/03–04 · Менеджеры-наблюдатели',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 3 экрана',
  render: () => (
    <Paired flow={role0304}>
      <Role0304Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 3 и 4 · Менеджеры-наблюдатели" source="flows/03-04-menedzhery-nablyudateli.md" />,
};
