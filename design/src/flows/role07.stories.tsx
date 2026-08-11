/* Сгенерировано: npm run gen:flows (источник — data/role07.ts).
   Руками не правим — правим данные роли, затем: npm run gen:diagrams →
   powershell -File diagrams/build.ps1 → npm run gen:flows. */

import scheme from '../../../diagrams/out/flow-role-07.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/07 · Главный секретарь соревнований',
  parameters: { layout: 'fullscreen' },
};

export const Sheme = {
  name: 'Схема · 5 экранов',
  render: () => <Scheme src={scheme} alt="Флоу роли 7 · Главный секретарь соревнований" source="flows/07-glavnyy-sekretar.md" />,
};
