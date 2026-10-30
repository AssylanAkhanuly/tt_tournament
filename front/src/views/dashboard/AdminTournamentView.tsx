'use client';

/* Страница турнира в кабинете администратора федерации —
   `/dashboard/tournaments/<id>/<раздел>` ✳ (30.10.2026). Роль проверяет оболочка
   кабинета (`AdminShell`); разделы и содержимое — общие с председателем ГСК
   (`useTournamentPage`). */

import { useTournamentPage, type TournamentSectionId } from '@/widgets/tournament-board';

import { AdminShell } from './AdminShell';

export function AdminTournamentView({ id, section }: { id: string; section: TournamentSectionId }) {
  const page = useTournamentPage({ id, section, cabinet: 'dashboard', back: '/dashboard' });
  return (
    <AdminShell active={page.active} nav={page.nav} context={page.context} bleed>
      {page.body}
    </AdminShell>
  );
}
