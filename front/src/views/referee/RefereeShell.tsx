'use client';

/* Оболочка страниц кабинета судьи: `RoleShell` с ролью судьи и разделами
   кабинета. Новая страница кабинета оборачивается сюда. */

import { CalendarDays, Table2, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_REFEREE } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import type { ShellSubItem } from '@/widgets/app-shell';

/** Разделы кабинета. Новый раздел — строка здесь. */
const NAV: RoleNavItem[] = [
  { label: 'Календарь', href: '/referee', icon: <CalendarDays size={16} /> },
  // Судья стола ✳ (22.11.2026, flows/09 Э9.2): текущий матч стола и ввод счёта.
  { label: 'Мой стол', href: '/referee/table', icon: <Table2 size={16} /> },
  // Встречи Евразийской лиги, которые он судит ✳ (19.11.2026) — из отправленных расписаний.
  { label: 'Лига', href: '/referee/league', icon: <Trophy size={16} /> },
];

export function RefereeShell({
  active,
  bleed,
  nav = NAV,
  context,
  home,
  sub,
  actions,
  title,
  back,
  children,
}: {
  active: string;
  bleed?: boolean;
  /** Свои разделы вместо разделов кабинета — внутри турнира. */
  nav?: RoleNavItem[];
  context?: ReactNode;
  /** Куда ведёт знак в шапке (страница турнира — список турниров кабинета). */
  home?: string;
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  /** Полоса внизу рабочей области. */
  actions?: ReactNode;
  /** Заголовок страницы внутри раздела (без вкладок) и стрелка «назад» перед ним. */
  title?: string;
  back?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  return (
    <RoleShell sub={sub} kind={ROLE_REFEREE} title="Судья" nav={nav} context={context}
      home={home} active={active} bleed={bleed} actions={actions}
      pageTitle={title} sections={title ? [] : undefined} back={back}>
      {children}
    </RoleShell>
  );
}
