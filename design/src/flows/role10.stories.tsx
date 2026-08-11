/* Сгенерировано: npm run gen:flows (источник — data/role10.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-10.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/10 · Инспектор / супервайзер',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 4 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 10 · Инспектор / супервайзер" source="flows/10-inspektor.md" />,
};
