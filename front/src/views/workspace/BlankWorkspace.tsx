'use client';

/* Пустой кабинет роли ✳ (28.10.2026, решение владельца продукта): оболочка
   есть, разделов нет — их задаст владелец продукта. Так сейчас устроен
   кабинет спортсмена (`/player`); у судьи разделы уже есть (`views/referee`).
   Новый раздел — пункт `nav` у `RoleShell` и маршрут под адресом кабинета. */

import { ROLE_PLAYER } from '@/entities/session';

import { RoleShell } from './RoleShell';

export function BlankWorkspace({ kind, title }: { kind: string; title: string }) {
  return (
    <RoleShell kind={kind} title={title} nav={[]}>
      <div data-testid="workspace-blank" data-role={kind} />
    </RoleShell>
  );
}

/** Кабинет спортсмена — `/player`. */
export const PlayerView = () => <BlankWorkspace kind={ROLE_PLAYER} title="Спортсмен" />;
