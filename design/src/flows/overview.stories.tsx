/* Обзор раздела «Флоу»: все роли карточками, отсюда — в маршрут любой роли. */

import { ROLES } from './data/all';
import { RolesOverview } from './spec';

export default {
  title: 'Флоу/Обзор',
  parameters: { layout: 'fullscreen' },
};

export const AllRoles = {
  name: 'Все роли',
  render: () => <RolesOverview roles={ROLES} />,
};
