'use client';

/* Кабинет администратора федерации (роль 1, ROLES.md) ✳ (28.10.2026).

   HeroUI + Tailwind, без кита. Главная страница — все турниры системы:
   календарь и таблица (`TournamentBoard`, тот же раздел есть у председателя
   ГСК). Оболочка и проверка роли — `AdminShell`. */

import { tournamentHref } from '@/entities/tournament';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

import { AdminShell } from './AdminShell';

export function DashboardView() {
  return (
    <AdminShell active="Календарь" bleed sub={boardViews('/dashboard', useBoardView())}>
      <TournamentBoard detailsPath={(id) => tournamentHref('dashboard', id)} canCreate />
    </AdminShell>
  );
}
