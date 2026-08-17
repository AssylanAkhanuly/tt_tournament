/* Сгенерировано: npm run gen:flows (источник — data/role12.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role12 } from './data/role12';
import { Role12Board, SCREENS } from '../mockups/role12';

export default {
  title: 'Флоу/12 · Старший тренер региона',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role12}>
      <Role12Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 7 экранов',
  render: () => <FlowMap flow={role12} screens={SCREENS} />,
};
