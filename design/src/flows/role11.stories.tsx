/* Сгенерировано: npm run gen:flows (источник — data/role11.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-11.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role11 } from './data/role11';
import { Role11Board } from '../mockups/role11';

export default {
  title: 'Флоу/11 · Главный тренер национальной команды',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 3 экрана',
  render: () => (
    <Paired flow={role11}>
      <Role11Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 11 · Главный тренер национальной команды" source="flows/11-glavnyy-trener-sbornoy.md" />,
};
