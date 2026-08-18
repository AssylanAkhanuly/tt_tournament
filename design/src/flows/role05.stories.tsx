/* Сгенерировано: npm run gen:flows (источник — data/role05.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role05 } from './data/role05';
import { Role05Board, SCREENS } from '../mockups/role05';

export default {
  title: 'Флоу/05 · Председатель ГСК',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 13 экранов',
  render: () => (
    <Paired flow={role05}>
      <Role05Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 13 экранов',
  render: () => <FlowMap flow={role05} screens={SCREENS} />,
};
