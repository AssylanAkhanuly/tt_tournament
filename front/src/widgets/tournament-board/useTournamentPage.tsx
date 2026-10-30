'use client';

/* Общее у страниц турнира администратора и председателя ГСК ✳ (30.10.2026):
   разделы в сайдбаре, его шапка («← Все турниры», название, дата) и
   содержимое раздела — и у главного судьи турнира (свой набор разделов). Оболочку
   кабинета (`AdminShell`, `RatingShell`, `ChiefShell`) даёт страница кабинета —
   сюда она не попадает, и ветвлений по ролям здесь нет. */

import { useRouter, useSearchParams } from 'next/navigation';

import {
  tournamentHref,
  usePendingRefereeApplications,
  useTournament,
  type TournamentCabinet,
} from '@/entities/tournament';

import {
  sectionLabel,
  TournamentContext,
  tournamentNav,
  TournamentSection,
  type SectionView,
  type TournamentSectionId,
} from './TournamentPage';

export function useTournamentPage({
  id,
  section,
  cabinet,
  back,
  sections,
  recruitment = true,
}: {
  id: string;
  section: TournamentSectionId;
  /** Кабинет — его адреса у разделов. */
  cabinet: TournamentCabinet;
  /** «← Все турниры» — календарь кабинета. */
  back: string;
  /** Разделы кабинета; нет — все. */
  sections?: TournamentSectionId[];
  recruitment?: boolean;
}) {
  const router = useRouter();
  const tournament = useTournament(id);
  // Подпункты разделов — из адреса; число ждущих заявок — значок у «Заявок»
  // (только где «Судьи» есть: главному судье сервер заявки не отдаёт).
  const params = useSearchParams();
  const view = params.get('view');
  const pending = usePendingRefereeApplications(id, !sections || sections.includes('referees'));
  const at: SectionView = {
    tab: params.get('tab') === 'applications' ? 'applications' : 'roster',
    view: view === 'day' || view === 'groups' ? view : 'matches',
    pending,
  };
  return {
    active: sectionLabel(section),
    nav: tournamentNav(tournamentHref(cabinet, id), sections, at),
    context: <TournamentContext t={tournament.data} onBack={() => router.push(back)} />,
    body: tournament.error ? (
      <p className="p-6 text-[13px] text-red-600" data-testid="tournament-error">
        {tournament.error}
      </p>
    ) : (
      <TournamentSection id={id} section={section} recruitment={recruitment} />
    ),
  };
}
