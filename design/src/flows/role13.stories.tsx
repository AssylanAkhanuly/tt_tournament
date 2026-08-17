/* Сгенерировано: npm run gen:flows (источник — data/role13.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role13 } from './data/role13';
import { Role13Board, SCREENS } from '../mockups/role13';

export default {
  title: 'Флоу/13 · Администратор клуба',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 9 экранов',
  render: () => (
    <Paired flow={role13}>
      <Role13Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 9 экранов',
  render: () => <FlowMap flow={role13} screens={SCREENS} />,
};
