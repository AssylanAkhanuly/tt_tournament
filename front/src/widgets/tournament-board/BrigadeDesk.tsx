'use client';

/* «Сведения» бригады турнира ✳ (24.11.2026): главный секретарь (flows/07) и
   заместитель главного судьи (flows/08) видят тот же обзор, что главный судья
   (решение владельца продукта: «вид — как у главного судьи»), только на
   чтение (`readOnly`): показатели, сетка, карта, даты, параметры, лучшие по
   рейтингу. Сверху — полоса полномочий главного судьи: у кого ход турнира,
   вернуть (держателю). Отдельного списка работ (Э7.1) нет — расписание и
   ход турнира открываются вкладками. */

import { AuthorityBar } from '@/features/tournament-authority';

import { TournamentDashboard } from './TournamentDashboard';

export function BrigadeDesk({ id }: { id: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="brigade-desk">
      <AuthorityBar tournamentId={id} />
      <div className="min-h-0 flex-1">
        <TournamentDashboard id={id} readOnly />
      </div>
    </div>
  );
}
