'use client';

/* Кабинеты бригады турнира ✳ (24.11.2026): главный секретарь (`/secretary`,
   роль 7, flows/07) и заместитель главного судьи (`/deputy`, роль 8,
   flows/08). Устроены как кабинет главного судьи: в сайдбаре «Турниры» — его
   турниры, у турнира вкладки — «Сведения» (тот же обзор, что у главного
   судьи, на чтение, с полосой полномочий), «Расписание» и «Столы» (ход
   турнира с полосой полномочий).

   Чем различаются — решает сервер: секретарь собирает и правит черновик
   расписания и передаёт его главному судье, отправляет судья; заместитель
   расписание только смотрит. Счёт правит тот, у кого полномочия главного
   судьи (`authority.py`). «Спортсмены» и «Судьи» ✳ (24.11.2026) — только
   смотреть: заявки рассматривает главный судья (flows/07: экрана заявок у
   секретаря нет), коллегию набирает председатель ГСК. */

import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_CHIEF_SECRETARY, ROLE_DEPUTY_CHIEF_REFEREE, tournamentIdsFor, useSession } from '@/entities/session';
import { tournamentHref } from '@/entities/tournament';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import type { ShellSubItem } from '@/widgets/app-shell';
import { BrigadeDesk, boardViews, TournamentBoard, useBoardView, useTournamentPage, type TournamentSectionId } from '@/widgets/tournament-board';

export type BrigadeCabinet = 'secretary' | 'deputy';

const CABINETS: Record<BrigadeCabinet, { kind: string; title: string; base: string }> = {
  secretary: { kind: ROLE_CHIEF_SECRETARY, title: 'Главный секретарь', base: '/secretary' },
  deputy: { kind: ROLE_DEPUTY_CHIEF_REFEREE, title: 'Заместитель главного судьи', base: '/deputy' },
};

// «Спортсмены» и «Судьи» — только смотреть ✳ (24.11.2026, решение владельца продукта).
const SECTIONS: TournamentSectionId[] = ['info', 'players', 'referees', 'schedule', 'tables'];

function BrigadeShell({ who, sub, sections, section, home, children }: {
  who: BrigadeCabinet;
  sub?: ShellSubItem[];
  sections?: RoleNavItem[];
  section?: string;
  home?: string;
  children: ReactNode;
}) {
  const c = CABINETS[who];
  const nav: RoleNavItem[] = [{ label: 'Турниры', href: c.base, icon: <CalendarDays size={16} /> }];
  return (
    <RoleShell kind={c.kind} title={c.title} nav={nav} sub={sub} home={home} active="Турниры" bleed sections={sections} section={section}>
      {children}
    </RoleShell>
  );
}

/** Турниры, где человек в этой должности, — календарём и таблицей. */
export function BrigadeView({ who }: { who: BrigadeCabinet }) {
  const { user } = useSession();
  const c = CABINETS[who];
  return (
    <BrigadeShell who={who} sub={boardViews(c.base, useBoardView())}>
      <TournamentBoard detailsPath={(id) => tournamentHref(who, id)} canCreate={false} only={tournamentIdsFor(user, c.kind)} />
    </BrigadeShell>
  );
}

export function BrigadeTournamentView({ who, id, section }: { who: BrigadeCabinet; id: string; section: TournamentSectionId }) {
  const page = useTournamentPage({ id, section, cabinet: who, back: CABINETS[who].base, sections: SECTIONS, recruitment: false, readOnly: true });
  return (
    <BrigadeShell who={who} sections={page.nav} section={page.active} home={page.home}>
      {section === 'info' ? <BrigadeDesk id={id} /> : page.body}
    </BrigadeShell>
  );
}
