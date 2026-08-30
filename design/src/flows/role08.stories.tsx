/* Сгенерировано: npm run gen:flows (источник — data/role08.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role08 } from './data/role08';
import { Role08Board, SCREENS } from '../mockups/role08';

export default {
  title: 'Флоу/08 · Заместитель главного судьи',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role08}>
      <Role08Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 4 экрана',
  render: () => <FlowMap flow={role08} screens={SCREENS} />,
};
