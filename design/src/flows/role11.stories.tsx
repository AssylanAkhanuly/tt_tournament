/* Сгенерировано: npm run gen:flows (источник — data/role11.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role11 } from './data/role11';
import { Role11Board, SCREENS } from '../mockups/role11';

export default {
  title: 'Флоу/11 · Главный тренер национальной команды',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'daylight-fnt' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 4 экрана',
  render: () => (
    <Paired flow={role11}>
      <Role11Board />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 4 экрана',
  render: () => <FlowMap flow={role11} screens={SCREENS} />,
};
