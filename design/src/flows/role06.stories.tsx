/* Сгенерировано: npm run gen:flows (источник — data/role06.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-06.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/06 · Главный судья соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 7 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 6 · Главный судья соревнований" source="flows/06-glavnyy-sudya.md" />,
};
