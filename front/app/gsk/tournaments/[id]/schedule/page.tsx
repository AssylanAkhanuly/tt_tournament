/* Турнир, раздел «Расписание» — только смотреть: строит главный судья.
   Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { GskTournamentView } from '@/views/rating-calendar';

export const metadata: Metadata = { title: 'Расписание — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GskTournamentView id={id} section="schedule" />;
}
