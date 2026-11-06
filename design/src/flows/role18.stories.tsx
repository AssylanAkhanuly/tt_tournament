/* Сгенерировано: npm run gen:flows (источник — data/role18.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role18 } from './data/role18';
import { Role18Board, SCREENS } from '../mockups/role18';

export default {
  title: 'Флоу/18 · Врач соревнований',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role18}>
      <Role18Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 5 экранов',
  render: () => <FlowMap flow={role18} screens={SCREENS} />,
};
