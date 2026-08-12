/* Сгенерировано: npm run gen:flows (источник — data/role02.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-02.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role02 } from './data/role02';
import { Role02Board } from '../mockups/role02';

export default {
  title: 'Флоу/02 · Экономист / бухгалтер',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 2 экрана',
  render: () => (
    <Paired flow={role02}>
      <Role02Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 2 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 2 · Экономист / бухгалтер" source="flows/02-ekonomist.md" />,
};
