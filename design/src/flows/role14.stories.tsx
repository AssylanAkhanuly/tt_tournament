/* Сгенерировано: npm run gen:flows (источник — data/role14.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role14 } from './data/role14';
import { Role14Board, SCREENS } from '../mockups/role14';

export default {
  title: 'Флоу/14 · Спортсмен',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 15 экранов',
  render: () => (
    <Paired flow={role14}>
      <Role14Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 15 экранов',
  render: () => <FlowMap flow={role14} screens={SCREENS} />,
};
