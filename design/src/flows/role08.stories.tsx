/* Сгенерировано: npm run gen:flows (источник — data/role08.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-08.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/08 · Заместитель главного судьи',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 8 · Заместитель главного судьи" source="flows/08-zam-glavnogo-sudi.md" />,
};
