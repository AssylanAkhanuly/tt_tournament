'use client';

/* Турнир в кабинете главного судьи — `/chief/tournaments/<id>/<раздел>`:
   «Сведения» и «Спортсмены» он ведёт, «Расписание» строит и отправляет.
   «Судей» нет — коллегию набирает председатель ГСК; нет и «Настроек» приёма
   заявок игроков. Чужого турнира (где он не главный) сервер не отдаст. */

import { useTournamentPage, type TournamentSectionId } from '@/widgets/tournament-board';

import { ChiefShell } from './ChiefShell';

const SECTIONS: TournamentSectionId[] = ['info', 'players', 'schedule'];

export function ChiefTournamentView({ id, section }: { id: string; section: TournamentSectionId }) {
  const page = useTournamentPage({ id, section, cabinet: 'chief', back: '/chief', sections: SECTIONS, recruitment: false });
  return (
    <ChiefShell active={page.active} nav={page.nav} context={page.context}>
      {page.body}
    </ChiefShell>
  );
}
