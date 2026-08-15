/* Сгенерировано: npm run gen:flows (источник — data/role01.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role01 } from './data/role01';
import { Role01Board, SCREENS } from '../mockups/role01';

export default {
  title: 'Флоу/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 15 экранов',
  render: () => (
    <Paired flow={role01}>
      <Role01Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 15 экранов',
  render: () => <FlowMap flow={role01} screens={SCREENS} />,
};
