/* Сгенерировано: npm run gen:flows (источник — data/role17.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role17 } from './data/role17';
import { Role17Board, SCREENS } from '../mockups/role17';

export default {
  title: 'Флоу/17 · Региональная федерация',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 2 экрана',
  render: () => (
    <Paired flow={role17}>
      <Role17Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 2 экрана',
  render: () => <FlowMap flow={role17} screens={SCREENS} />,
};
