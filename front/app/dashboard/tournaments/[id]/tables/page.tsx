/* Турнир, раздел «Столы» у администратора федерации ✳ (24.11.2026): вкладка
   была, а маршрута не было — открывалась 404. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { AdminTournamentView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Столы — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTournamentView id={id} section="tables" />;
}
