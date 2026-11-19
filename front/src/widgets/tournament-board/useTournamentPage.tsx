'use client';

/* Общее у страниц турнира администратора и председателя ГСК ✳ (30.10.2026):
   разделы в сайдбаре и содержимое раздела — и у главного судьи турнира (свой
   набор разделов). Шапки турнира в сайдбаре («← Все турниры», название, дата,
   значок) нет ✳ (19.11.2026, решение владельца продукта): к списку турниров
   ведёт знак в шапке (`home`). Оболочку
   кабинета (`AdminShell`, `RatingShell`, `ChiefShell`) даёт страница кабинета —
   сюда она не попадает, и ветвлений по ролям здесь нет. */

import { useSearchParams } from 'next/navigation';

import {
  tournamentHref,
  usePendingRefereeApplications,
  useTournament,
  type TournamentCabinet,
} from '@/entities/tournament';

import {
  sectionLabel,
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
  /** Список турниров кабинета — туда ведёт знак в шапке. */
  back: string;
  /** Разделы кабинета; нет — все. */
  sections?: TournamentSectionId[];
  recruitment?: boolean;
}) {
  const tournament = useTournament(id);
  // Подпункты разделов — из адреса; число ждущих заявок — значок у «Заявок»
  // (только где «Судьи» есть: главному судье сервер заявки не отдаёт).
  const params = useSearchParams();
  const view = params.get('view');
  const pending = usePendingRefereeApplications(id, !sections || sections.includes('referees'));
  const at: SectionView = {
    tab: params.get('tab') === 'applications' ? 'applications' : 'roster',
    view: view === 'day' || view === 'groups' || view === 'bracket' ? view : 'matches',
    pending,
  };
  return {
    /** Название турнира — для хлебных крошек кабинета; до ответа — пусто. */
    name: tournament.data?.name ?? '',
    active: sectionLabel(section),
    nav: tournamentNav(tournamentHref(cabinet, id), sections, at),
    home: back,
    body: tournament.error ? (
      <p className="p-6 text-[13px] text-red-600" data-testid="tournament-error">
        {tournament.error}
      </p>
    ) : (
      <TournamentSection id={id} section={section} recruitment={recruitment} />
    ),
  };
}
