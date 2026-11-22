'use client';

/* Кабинет спортсмена (`/player`) ✳ (22.11.2026, решения владельца продукта;
   до того — пустой). Свой профиль — по адресу кабинета, открывается пунктом
   «Профиль» в меню человека (отдельного раздела нет — решение владельца
   продукта); в меню разделов — **«Календарь»** турниров.

   - Член сборной видит свою карточку сборной — тот же профиль, что у штаба,
     только смотреть: план подготовки, медкарта без диагнозов и УМО
     (`NationalMemberView` с кабинетом `player`; права — с сервера).
   - Остальные — свой профиль по рейтинговой карточке, без медкарты и плана
     (`PlayerProfile`).
   - «Календарь» — тот же `TournamentBoard`, что у судьи, без «Нового
     турнира»; «Подробнее» — сведения турнира (`TournamentOverview`). */

import { Spinner } from '@heroui/react';
import type { ReactNode } from 'react';

import { fetchNationalMe, useLoad } from '@/entities/national';
import { ROLE_PLAYER, useSession } from '@/entities/session';
import { useTournament } from '@/entities/tournament';
import { RoleShell } from '@/views/workspace';
import { PlayerProfile } from '@/widgets/national';
import { boardViews, TournamentBoard, TournamentOverview, useBoardView } from '@/widgets/tournament-board';

import { NationalMemberView } from './NationalViews';
import { PLAYER_NAV, PLAYER_PROFILE } from './playerNav';

function PlayerShell({ active, sub, children }: { active: string; sub?: { label: string; href: string; active?: boolean }[]; children: ReactNode }) {
  return (
    <RoleShell kind={ROLE_PLAYER} title="Спортсмен" nav={PLAYER_NAV} active={active} sub={sub} profileHref={PLAYER_PROFILE} bleed>
      {children}
    </RoleShell>
  );
}

export function PlayerView() {
  const me = useLoad(fetchNationalMe, 'me');
  const { user } = useSession();
  if (me.data?.member) return <NationalMemberView cabinet="player" id={me.data.member} />;
  return (
    <PlayerShell active="Мой профиль">
      {!me.data && !me.error ? <Spinner className="m-auto" /> : user ? <PlayerProfile userId={user.id} /> : null}
    </PlayerShell>
  );
}

export function PlayerCalendarView() {
  return (
    <PlayerShell active="Календарь" sub={boardViews('/player/calendar', useBoardView())}>
      <TournamentBoard detailsPath={(id) => `/player/tournaments/${id}`} canCreate={false} />
    </PlayerShell>
  );
}

export function PlayerTournamentView({ id }: { id: string }) {
  const tournament = useTournament(id);
  const t = tournament.data;
  return (
    <PlayerShell active="Календарь">
      {tournament.error ? (
        <p className="p-6 text-[13px] text-red-600" data-testid="tournament-error">
          {tournament.error}
        </p>
      ) : !t ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="h-full overflow-y-auto">
          <TournamentOverview t={t} />
        </div>
      )}
    </PlayerShell>
  );
}
