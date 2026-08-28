/* Сгенерировано: npm run gen:flows (источник — data/role16.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role16 } from './data/role16';
import { Role16Board, SCREENS } from '../mockups/role16';

export default {
  title: 'Флоу/16 · Дисциплинарный комитет',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role16}>
      <Role16Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 4 экрана',
  render: () => <FlowMap flow={role16} screens={SCREENS} />,
};
