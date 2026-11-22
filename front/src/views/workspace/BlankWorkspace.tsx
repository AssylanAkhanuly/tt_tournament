'use client';

/* Пустой кабинет роли ✳ (28.10.2026, решение владельца продукта): оболочка
   есть, разделов нет — их задаст владелец продукта. Кабинет спортсмена
   (`/player`) был таким до 22.11.2026 — теперь у него разделы (`views/national/PlayerViews`).
   Новый раздел — пункт `nav` у `RoleShell` и маршрут под адресом кабинета. */

import { RoleShell } from './RoleShell';

export function BlankWorkspace({ kind, title }: { kind: string; title: string }) {
  return (
    <RoleShell kind={kind} title={title} nav={[]}>
      <div data-testid="workspace-blank" data-role={kind} />
    </RoleShell>
  );
}
