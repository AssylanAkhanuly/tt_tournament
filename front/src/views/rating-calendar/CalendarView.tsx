'use client';

/* «Календарь» председателя ГСК ✳ (28.10.2026) — тот же раздел, что главная у
   администратора федерации: все турниры календарём и таблицей
   (`TournamentBoard`). «Новый турнир» председателю не показываем: заводить
   турниры сервер разрешает только `is_staff` и админам клуба.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/entities/session';
import { tournamentHref } from '@/entities/tournament';
import { RatingShell } from '@/views/rating';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

export function CalendarView() {
  const router = useRouter();
  const { loading, isGskChairman, isFederationAdmin } = useSession();

  useEffect(() => {
    if (!loading && !isGskChairman) router.replace('/login?next=/calendar');
  }, [loading, isGskChairman, router]);

  return (
    <RatingShell active="Календарь" bleed sub={boardViews('/calendar', useBoardView())}>
      {isGskChairman && (
        <TournamentBoard
          detailsPath={(id) => tournamentHref('gsk', id)}
          canCreate={isFederationAdmin}
        />
      )}
    </RatingShell>
  );
}
