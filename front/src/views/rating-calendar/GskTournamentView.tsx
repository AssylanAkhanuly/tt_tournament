'use client';

/* Страница турнира в кабинете председателя ГСК — `/gsk/tournaments/<id>/<раздел>`
   ✳ (30.10.2026). Разделы и содержимое — общие с администратором
   (`useTournamentPage`), оболочка — кабинета председателя (`RatingShell`).
   Не председателя уводим на вход; права всё равно проверяет сервер. */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/entities/session';
import { tournamentHref } from '@/entities/tournament';
import { RatingShell } from '@/views/rating';
import { useTournamentPage, type TournamentSectionId } from '@/widgets/tournament-board';

export function GskTournamentView({ id, section }: { id: string; section: TournamentSectionId }) {
  const router = useRouter();
  const { loading, isGskChairman } = useSession();
  const page = useTournamentPage({ id, section, cabinet: 'gsk', back: '/calendar' });

  useEffect(() => {
    if (!loading && !isGskChairman) router.replace('/login?next=' + encodeURIComponent(tournamentHref('gsk', id, section)));
  }, [loading, isGskChairman, router, id, section]);

  return (
    <RatingShell
      active={page.active}
      nav={page.nav.map(({ label, href, icon, children }) => [label, href, icon, children])}
      context={page.context}
      bleed
    >
      {isGskChairman && page.body}
    </RatingShell>
  );
}
