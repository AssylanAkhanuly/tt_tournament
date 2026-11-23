'use client';

/* Кабинет главного судьи турнира ✳ (30.10.2026, решение владельца продукта):
   `RoleShell` с ролью главного судьи (роль 6, ТЗ §2; роль с областью «турнир»).
   В кабинете — только его турниры; у турнира — «Сведения», «Спортсмены» и
   «Расписание», которое строит и отправляет он один. */

import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_CHIEF_REFEREE } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import type { ShellSubItem } from '@/widgets/app-shell';

const NAV: RoleNavItem[] = [{ label: 'Турниры', href: '/chief', icon: <CalendarDays size={16} /> }];

export function ChiefShell({
  active,
  nav = NAV,
  context,
  home,
  sub,
  title,
  sections,
  section,
  children,
}: {
  active: string;
  nav?: RoleNavItem[];
  context?: ReactNode;
  /** Куда ведёт знак в шапке (страница турнира — список турниров кабинета). */
  home?: string;
  /** Подпункты активного раздела (вид экрана: «Месяц», «Таблица») ✳ 30.10.2026. */
  sub?: ShellSubItem[];
  /** Страница внутри кабинета (турнир): заголовок и разделы вкладками под ним ✳ (23.11.2026). */
  title?: string;
  sections?: RoleNavItem[];
  section?: string;
  children: ReactNode;
}) {
  return (
    <RoleShell sub={sub} kind={ROLE_CHIEF_REFEREE} title="Главный судья" nav={nav} context={context}
      home={home} active={active} bleed pageTitle={title} sections={sections} section={section}>
      {children}
    </RoleShell>
  );
}
