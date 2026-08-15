/* Сгенерировано: npm run gen:flows (источник — data/role02.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role02 } from './data/role02';
import { Role02Board, SCREENS } from '../mockups/role02';

export default {
  title: 'Флоу/02 · Экономист / бухгалтер',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 3 экрана',
  render: () => (
    <Paired flow={role02}>
      <Role02Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 3 экрана',
  render: () => <FlowMap flow={role02} screens={SCREENS} />,
};
