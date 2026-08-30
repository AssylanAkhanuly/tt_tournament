/* Сгенерировано: npm run gen:flows (источник — data/role15.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role15 } from './data/role15';
import { Role15Board, SCREENS } from '../mockups/role15';

export default {
  title: 'Флоу/15 · Председатель судейской коллегии региона',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 5 экранов',
  render: () => (
    <Paired flow={role15}>
      <Role15Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 5 экранов',
  render: () => <FlowMap flow={role15} screens={SCREENS} />,
};
