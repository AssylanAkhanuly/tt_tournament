/* Турнир в кабинете старшего тренера региона: сведения и заявка своего
   региона. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { CoachTournamentView } from '@/views/coach';

export const metadata: Metadata = { title: 'Турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CoachTournamentView id={id} />;
}
