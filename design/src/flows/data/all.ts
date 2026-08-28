/* Все роли одним списком — для обзорной страницы раздела.

   Лежит здесь, а не в файле историй: Storybook считает историей каждый
   именованный экспорт `*.stories.tsx`, и список ролей превращался в пустую
   «историю» в боковом меню. */

import type { RoleFlow } from '../types';
import { role00 } from './role00';
import { role00j } from './role00j';
import { role01 } from './role01';
import { role02 } from './role02';
import { role0304 } from './role0304';
import { role05 } from './role05';
import { role06 } from './role06';
import { role07 } from './role07';
import { role08 } from './role08';
import { role09 } from './role09';
import { role10 } from './role10';
import { role11 } from './role11';
import { role12 } from './role12';
import { role13 } from './role13';
import { role14 } from './role14';
import { role15 } from './role15';
import { role16 } from './role16';

export const ROLES: RoleFlow[] = [
  role00,
  role00j,
  role01,
  role02,
  role0304,
  role05,
  role06,
  role07,
  role08,
  role09,
  role10,
  role11,
  role12,
  role13,
  role14,
  role15,
  role16,
];
