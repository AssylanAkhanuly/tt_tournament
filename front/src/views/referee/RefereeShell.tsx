'use client';

/* Оболочка страниц кабинета судьи: `RoleShell` с ролью судьи и разделами
   кабинета. Новая страница кабинета оборачивается сюда. */

import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_REFEREE } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import type { ShellSubItem } from '@/widgets/app-shell';

/** Разделы кабинета. Новый раздел — строка здесь. */
const NAV: RoleNavItem[] = [{ label: 'Календарь', href: '/referee', icon: <CalendarDays size={16} /> }];

export function RefereeShell({
  active,
  bleed,
  nav = NAV,
  context,
  sub,
  children,
}: {
  active: string;
  bleed?: boolean;
  /** Свои разделы вместо разделов кабинета — внутри турнира. */
  nav?: RoleNavItem[];
  context?: ReactNode;
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  children: ReactNode;
}) {
  return (
    <RoleShell sub={sub} kind={ROLE_REFEREE} title="Судья" nav={nav} context={context} active={active} bleed={bleed}>
      {children}
    </RoleShell>
  );
}
