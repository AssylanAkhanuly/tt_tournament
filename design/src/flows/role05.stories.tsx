/* Сгенерировано: npm run gen:flows (источник — data/role05.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-05.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/05 · Председатель ГСК',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 7 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 5 · Председатель ГСК" source="flows/05-predsedatel-gsk.md" />,
};
