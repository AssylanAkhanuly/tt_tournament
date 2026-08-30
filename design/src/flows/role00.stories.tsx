/* Сгенерировано: npm run gen:flows (источник — data/role00.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role00 } from './data/role00';
import { Role00Board, SCREENS } from '../mockups/role00';

export default {
  title: 'Флоу/00 · Сквозные экраны',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role00}>
      <Role00Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 7 экранов',
  render: () => <FlowMap flow={role00} screens={SCREENS} />,
};
