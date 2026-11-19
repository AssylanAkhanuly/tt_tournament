'use client';

/* Оболочка кабинета старшего тренера региона ✳ (19.11.2026, роль 12):
   `RoleShell` с его ролью и разделами. Новая страница кабинета оборачивается
   сюда. */

import { CalendarDays, FileSignature } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_REGIONAL_HEAD_COACH } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import type { ShellSubItem } from '@/widgets/app-shell';

/** Разделы кабинета. Новый раздел — строка здесь. */
const NAV: RoleNavItem[] = [
  { label: 'Соревнования', href: '/coach', icon: <CalendarDays size={16} /> },
  // Рапорты на командирование главному тренеру сборной ✳ (19.11.2026, Э12.8 / Э11.4).
  { label: 'Рапорты', href: '/coach/reports', icon: <FileSignature size={16} /> },
];

export function CoachShell({
  active,
  bleed,
  nav = NAV,
  context,
  home,
  sub,
  actions,
  children,
}: {
  active: string;
  bleed?: boolean;
  /** Свои разделы вместо разделов кабинета — внутри турнира. */
  nav?: RoleNavItem[];
  context?: ReactNode;
  /** Куда ведёт знак в шапке (страница турнира — список турниров кабинета). */
  home?: string;
  sub?: ShellSubItem[];
  /** Полоса внизу рабочей области. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <RoleShell
      kind={ROLE_REGIONAL_HEAD_COACH}
      title="Старший тренер региона"
      nav={nav}
      context={context}
      home={home}
      active={active}
      bleed={bleed}
      sub={sub}
      actions={actions}
    >
      {children}
    </RoleShell>
  );
}
