/* Сгенерировано: npm run gen:flows (источник — data/role02.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-02.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/02 · Экономист / бухгалтер',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 2 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 2 · Экономист / бухгалтер" source="flows/02-ekonomist.md" />,
};
