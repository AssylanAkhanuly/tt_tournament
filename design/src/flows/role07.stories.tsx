/* Сгенерировано: npm run gen:flows (источник — data/role07.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-07.png';
import { Scheme } from './scheme';
import { Paired } from './paired';
import { role07 } from './data/role07';
import { Role07Board } from '../mockups/role07';

export default {
  title: 'Флоу/07 · Главный секретарь соревнований',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role07}>
      <Role07Board />
    </Paired>
  ),
};

export const Sheme = {
  name: 'Схема · 5 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 7 · Главный секретарь соревнований" source="flows/07-glavnyy-sekretar.md" />,
};
