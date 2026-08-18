/* Сгенерировано: npm run gen:flows (источник — data/role07.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role07 } from './data/role07';
import { Role07Board, SCREENS } from '../mockups/role07';

export default {
  title: 'Флоу/07 · Главный секретарь соревнований',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 6 экранов',
  render: () => (
    <Paired flow={role07}>
      <Role07Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 6 экранов',
  render: () => <FlowMap flow={role07} screens={SCREENS} />,
};
