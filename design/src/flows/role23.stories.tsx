/* Сгенерировано: npm run gen:flows (источник — data/role23.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role23 } from './data/role23';
import { Role23Board, SCREENS } from '../mockups/role23';

export default {
  title: 'Флоу/23 · Руководитель клуба / спортшколы',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role23}>
      <Role23Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 5 экранов',
  render: () => <FlowMap flow={role23} screens={SCREENS} />,
};
