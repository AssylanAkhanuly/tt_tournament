/* Сгенерировано: npm run gen:flows (источник — data/role00j.ts).
   Руками не правим — правим данные роли и её макеты, затем: npm run gen:flows. */

import { Paired } from './paired';
import { FlowMap } from './map';
import { role00j } from './data/role00j';
import { Role00jBoard, SCREENS } from '../mockups/role00j';

export default {
  title: 'Флоу/00 · Кабинет судьи — вне турнира',
  parameters: { layout: 'fullscreen' },
};

/* Парный вид первым: под каждым узлом маршрута стоит его макет — требование и
   картинка читаются вместе, а не в двух разных разделах дерева. */
export const Nodes = {
  name: 'Узлы и макеты · 7 экранов',
  render: () => (
    <Paired flow={role00j}>
      <Role00jBoard />
    </Paired>
  ),
};

/* Карта: граф маршрута и макет выбранного экрана рядом. */
export const Route = {
  name: 'Карта · 7 экранов',
  render: () => <FlowMap flow={role00j} screens={SCREENS} />,
};
