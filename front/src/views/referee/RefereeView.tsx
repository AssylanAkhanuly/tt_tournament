'use client';

/* Кабинет судьи (`/referee`) ✳ (29.10.2026, решение владельца продукта):
   раздел «Календарь» — все турниры системы календарём и таблицей
   (`TournamentBoard`, тот же раздел, что главная администратора федерации).
   «Подробнее» — страница турнира кабинета судьи `/referee/tournaments/<id>`:
   сведения и заявка. «Новый турнир» судье не показываем: заводить турниры сервер разрешает только
   `is_staff` и админам клуба. Оболочка и проверка роли — `RefereeShell`. */

import { tournamentHref } from '@/entities/tournament';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

import { RefereeShell } from './RefereeShell';

export function RefereeView() {
  return (
    <RefereeShell active="Календарь" bleed sub={boardViews('/referee', useBoardView())}>
      <TournamentBoard
        detailsPath={(id) => tournamentHref('referee', id)}
        canCreate={false}
      />
    </RefereeShell>
  );
}
