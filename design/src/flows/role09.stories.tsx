/* Сгенерировано: npm run gen:flows (источник — data/role09.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-09.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/09 · Судья',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 5 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 9 · Судья" source="flows/09-sudya.md" />,
};
