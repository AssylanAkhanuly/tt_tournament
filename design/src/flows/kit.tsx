/* Сборка историй раздела «Флоу»: одна роль = один файл историй, один экран
   флоу = одна история.

   Здесь только функции-рендеры. Заголовок раздела и имя истории пишутся в
   самих файлах историй литералами — Storybook строит дерево статическим
   разбором файла и вызов функции в `export default` не понимает («CSF: default
   export must be an object»), а имя, выставленное в рантайме, в боковое меню не
   попадает. Чтобы литералы не разъехались с данными, файлы историй
   генерируются (`npm run gen:flows`) и проверяются (`npm run lint:flows`). */

import { FlowBoard, ScreenSpec } from './spec';
import type { RoleFlow } from './types';

/** Обзор роли: все экраны маршрута карточками, границы прав, вопросы. */
export const boardRender = (role: RoleFlow) => () => <FlowBoard role={role} />;

/** Страница одного экрана: зоны, поля, действия, состояния. */
export function screenRender(role: RoleFlow, id: string) {
  const screen = role.screens.find((s) => s.id === id);
  // Падаем на сборке: значит код экрана в истории разошёлся с данными роли.
  if (!screen) throw new Error(`Экран ${id} не описан у роли ${role.num} (${role.source})`);
  return () => <ScreenSpec role={role} screen={screen} />;
}
