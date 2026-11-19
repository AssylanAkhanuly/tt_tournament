'use client';

/* Кабинет администратора федерации (роль 1, ROLES.md) ✳ (28.10.2026).

   HeroUI + Tailwind, без кита. Главная страница — все турниры системы:
   календарь и таблица (`TournamentBoard`, тот же раздел есть у председателя
   ГСК). Третий вид раздела — «Лига» (`?view=league`): Евразийская лига не
   отдельный раздел меню, а вид календаря соревнований ✳ (19.11.2026, решение
   владельца продукта). Оболочка и проверка роли — `AdminShell`. */

import { useRouter, useSearchParams } from 'next/navigation';

import { tournamentHref } from '@/entities/tournament';
import { LeagueHome } from '@/widgets/league';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

import { AdminShell } from './AdminShell';
import { LEAGUE_BASE, LEAGUE_HOME } from './leagueHref';

export function DashboardView() {
  const router = useRouter();
  const board = useBoardView();
  const league = useSearchParams().get('view') === 'league';
  const sub = [
    ...boardViews('/dashboard', league ? 'league' : board),
    { label: 'Лига', href: LEAGUE_HOME, active: league },
  ];
  return (
    <AdminShell active="Календарь" bleed sub={sub}>
      {league ? (
        <LeagueHome canEdit onOpen={(id) => router.push(`${LEAGUE_BASE}/${id}/table`)} />
      ) : (
        <TournamentBoard detailsPath={(id) => tournamentHref('dashboard', id)} canCreate />
      )}
    </AdminShell>
  );
}
