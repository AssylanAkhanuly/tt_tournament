/* Обзор раздела «Флоу»: схема со всеми ролями сразу — кто с какого экрана
   начинает, что нажимает и чего не может. Детали по роли — в её схеме. */

import scheme from '../../../diagrams/out/flow-roles.png';
import { Scheme } from './scheme';

export default {
  title: 'Флоу/Обзор',
  parameters: { layout: 'fullscreen' },
};

export const AllRoles = {
  name: 'Все роли — одна схема',
  render: () => (
    <Scheme src={scheme} alt="Рабочий путь всех четырнадцати ролей" source="flows/README.md" />
  ),
};
