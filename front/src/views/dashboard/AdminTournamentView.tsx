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
    // Сайдбар — разделы кабинета («Календарь»), разделы турнира — вкладками
    // под названием ✳ (21.11.2026, образец Aligno).
    <AdminShell
      active="Календарь"
      sections={page.nav}
      section={page.active}
      title={page.name}
      home={page.home}
      bleed
    >
      {page.body}
    </AdminShell>
  );
}
