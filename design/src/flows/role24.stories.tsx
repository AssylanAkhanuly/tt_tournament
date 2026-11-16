/* Сгенерировано: npm run gen:flows (источник — data/role24.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role24 } from './data/role24';
import { Role24Board, SCREENS } from '../mockups/role24';

export default {
  title: 'Флоу/24 · Тренер клуба / главный тренер клуба',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role24}>
      <Role24Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 4 экрана',
  render: () => <FlowMap flow={role24} screens={SCREENS} />,
};
