'use client';

/* Турнир в кабинете главного судьи — `/chief/tournaments/<id>/<раздел>`:
   «Сведения» и «Спортсмены» он ведёт, «Расписание» строит и отправляет,
   «Столы» ✳ (23.11.2026) — все столы карточками, что сейчас на каждом.
   «Судей» нет — коллегию набирает председатель ГСК; нет и «Настроек» приёма
   заявок игроков. Чужого турнира (где он не главный) сервер не отдаст. */

import { useTournamentPage, type TournamentSectionId } from '@/widgets/tournament-board';

import { ChiefShell } from './ChiefShell';

// «Судьи» ✳ (24.11.2026) — коллегия на чтение и «Доступ к правке»: здесь главный судья
// передаёт полномочия секретарю или заместителю (набирает коллегию председатель ГСК).
const SECTIONS: TournamentSectionId[] = ['info', 'players', 'referees', 'schedule', 'tables'];

export function ChiefTournamentView({ id, section }: { id: string; section: TournamentSectionId }) {
  const page = useTournamentPage({ id, section, cabinet: 'chief', back: '/chief', sections: SECTIONS, recruitment: false, refereesReadOnly: true });
  return (
    // Сайдбар — разделы кабинета («Турниры»), разделы турнира — вкладками под
    // названием ✳ (23.11.2026, решение владельца продукта; как у администратора);
    // заголовка над вкладками нет — только вкладки вверху.
    <ChiefShell active="Турниры" sections={page.nav} section={page.active} home={page.home}>
      {page.body}
    </ChiefShell>
  );
}
