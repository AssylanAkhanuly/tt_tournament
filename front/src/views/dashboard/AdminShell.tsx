'use client';

/* Оболочка страниц кабинета администратора федерации: `RoleShell` с ролью
   администратора и разделами кабинета. Новая страница кабинета оборачивается
   сюда. */

import { CalendarDays, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_FEDERATION_ADMIN } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import type { ShellSubItem } from '@/widgets/app-shell';

/** Разделы кабинета. Новый раздел — строка здесь. */
const NAV: RoleNavItem[] = [
  { label: 'Календарь', href: '/dashboard', icon: <CalendarDays size={16} /> },
  // Евразийская лига ✳ (19.11.2026, LEAGUE.md).
  { label: 'Лига', href: '/dashboard/league', icon: <Trophy size={16} /> },
];

export function AdminShell({
  active,
  title,
  bleed,
  nav = NAV,
  context,
  home,
  sub,
  children,
}: {
  active: string;
  title?: string;
  bleed?: boolean;
  /** Свои разделы вместо разделов кабинета — внутри турнира. */
  nav?: RoleNavItem[];
  context?: ReactNode;
  /** Куда ведёт знак в шапке (страница турнира — список турниров кабинета). */
  home?: string;
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  children: ReactNode;
}) {
  return (
    <RoleShell
      sub={sub}
      kind={ROLE_FEDERATION_ADMIN}
      title="Администратор федерации"
      nav={nav}
      context={context}
      home={home}
      active={active}
      pageTitle={title}
      bleed={bleed}
    >
      {children}
    </RoleShell>
  );
}
