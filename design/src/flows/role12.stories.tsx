/* Сгенерировано: npm run gen:flows (источник — data/role12.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-12.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/12 · Старший тренер региона',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 5 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 12 · Старший тренер региона" source="flows/12-starshiy-trener-regiona.md" />,
};
