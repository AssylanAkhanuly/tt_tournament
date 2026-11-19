'use client';

/* Кабинет администратора федерации (роль 1, ROLES.md) ✳ (28.10.2026).

   HeroUI + Tailwind, без кита. Главная страница — все соревнования системы:
   календарь и таблица (`TournamentBoard`, тот же раздел есть у председателя
   ГСК). Дивизионы Евразийской лиги стоят там же, рядом с турнирами, и
   заводятся «Новым турниром» с видом «Евразийская лига» ✳ (19.11.2026,
   решение владельца продукта: не отдельной вкладкой). Оболочка и проверка
   роли — `AdminShell`. */

import { tournamentHref } from '@/entities/tournament';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

import { AdminShell } from './AdminShell';
import { divisionHref } from './leagueHref';

export function DashboardView() {
  return (
    <AdminShell active="Календарь" bleed sub={boardViews('/dashboard', useBoardView())}>
      <TournamentBoard detailsPath={(id) => tournamentHref('dashboard', id)} leaguePath={divisionHref} canCreate />
    </AdminShell>
  );
}
