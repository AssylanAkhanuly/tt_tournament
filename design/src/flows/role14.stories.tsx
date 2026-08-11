/* Сгенерировано: npm run gen:flows (источник — data/role14.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-14.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/14 · Спортсмен',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 7 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 14 · Спортсмен" source="flows/14-sportsmen.md" />,
};
