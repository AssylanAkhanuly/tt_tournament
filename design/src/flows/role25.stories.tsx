/* Сгенерировано: npm run gen:flows (источник — data/role25.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role25 } from './data/role25';
import { Role25Board, SCREENS } from '../mockups/role25';

export default {
  title: 'Флоу/25 · Юрист',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role25}>
      <Role25Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 5 экранов',
  render: () => <FlowMap flow={role25} screens={SCREENS} />,
};
