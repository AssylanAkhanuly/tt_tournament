/* Сгенерировано: npm run gen:flows (источник — data/role13.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-13.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/13 · Администратор клуба',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 13 · Администратор клуба" source="flows/13-admin-kluba.md" />,
};
