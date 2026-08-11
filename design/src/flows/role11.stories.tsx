/* Сгенерировано: npm run gen:flows (источник — data/role11.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-11.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/11 · Главный тренер национальной команды',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 3 экрана',
  render: () => <Scheme src={scheme} alt="Флоу роли 11 · Главный тренер национальной команды" source="flows/11-glavnyy-trener-sbornoy.md" />,
};
