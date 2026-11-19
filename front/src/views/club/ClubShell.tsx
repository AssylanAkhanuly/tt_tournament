'use client';

/* Оболочка кабинета администратора клуба ✳ (19.11.2026, роль 13): `RoleShell`
   с ролью клуба и разделами. Новая страница кабинета оборачивается сюда. */

import { CalendarClock, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_CLUB_ADMIN } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';

/** Разделы кабинета. Новый раздел — строка здесь. */
const NAV: RoleNavItem[] = [
  { label: 'Команды', href: '/club', icon: <Users size={16} /> },
  // Расписание встреч команд клуба ✳ (19.11.2026) — только отправленное федерацией.
  { label: 'Расписание', href: '/club/schedule', icon: <CalendarClock size={16} /> },
];

export function ClubShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <RoleShell kind={ROLE_CLUB_ADMIN} title="Администратор клуба" nav={NAV} active={active} bleed>
      {children}
    </RoleShell>
  );
}
