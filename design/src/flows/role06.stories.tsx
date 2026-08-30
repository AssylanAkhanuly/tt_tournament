/* Сгенерировано: npm run gen:flows (источник — data/role06.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role06 } from './data/role06';
import { Role06Board, SCREENS } from '../mockups/role06';

export default {
  title: 'Флоу/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 11 экранов',
  render: () => (
    <Paired flow={role06}>
      <Role06Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 11 экранов',
  render: () => <FlowMap flow={role06} screens={SCREENS} />,
};
