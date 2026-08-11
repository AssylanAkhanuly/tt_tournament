/* Сгенерировано: npm run gen:flows (источник — data/role01.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-01.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/01 · Администратор Федерации',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 8 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 1 · Администратор Федерации" source="flows/01-admin-federacii.md" />,
};
