/* Сгенерировано: npm run gen:flows (источник — data/role0304.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role0304 } from './data/role0304';
import { Role0304Board, SCREENS } from '../mockups/role0304';

export default {
  title: 'Флоу/03–04 · Менеджеры-наблюдатели',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role0304}>
      <Role0304Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 4 экрана',
  render: () => <FlowMap flow={role0304} screens={SCREENS} />,
};
