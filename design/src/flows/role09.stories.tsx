/* Сгенерировано: npm run gen:flows (источник — data/role09.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role09 } from './data/role09';
import { Role09Board, SCREENS } from '../mockups/role09';

export default {
  title: 'Флоу/09 · Судья',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role09}>
      <Role09Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 7 экранов',
  render: () => <FlowMap flow={role09} screens={SCREENS} />,
};
