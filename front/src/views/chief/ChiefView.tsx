'use client';

/* Кабинет главного судьи — `/chief`: турниры, где он главный судья, календарём и
   таблицей (`TournamentBoard` с отбором по его ролям). */

import { chiefTournamentIds, useSession } from '@/entities/session';
import { tournamentHref } from '@/entities/tournament';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

import { ChiefShell } from './ChiefShell';

export function ChiefView() {
  const { user } = useSession();
  return (
    <ChiefShell active="Турниры" sub={boardViews('/chief', useBoardView())}>
      <TournamentBoard
        detailsPath={(id) => tournamentHref('chief', id)}
        canCreate={false}
        only={chiefTournamentIds(user)}
      />
    </ChiefShell>
  );
}
