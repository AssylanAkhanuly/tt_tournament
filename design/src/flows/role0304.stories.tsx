/* Сгенерировано: npm run gen:flows (источник — data/role0304.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-03-04.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/03–04 · Менеджеры-наблюдатели',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 3 и 4 · Менеджеры-наблюдатели" source="flows/03-04-menedzhery-nablyudateli.md" />,
};
