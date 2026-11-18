'use client';

/* Кабинет старшего тренера региона (`/coach`) ✳ (19.11.2026, роль 12):
   «Соревнования» — все турниры календарём и таблицей (`TournamentBoard`, тот
   же раздел, что у судьи); значок вида показывает главные старты, на которые
   заявляет он. «Подробнее» — `/coach/tournaments/<id>`: сведения и заявка.
   Заводить турниры тренеру сервер не даёт — «Нового турнира» нет. */

import { tournamentHref } from '@/entities/tournament';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

import { CoachShell } from './CoachShell';

export function CoachView() {
  return (
    <CoachShell active="Соревнования" bleed sub={boardViews('/coach', useBoardView())}>
      <TournamentBoard detailsPath={(id) => tournamentHref('coach', id)} canCreate={false} />
    </CoachShell>
  );
}
