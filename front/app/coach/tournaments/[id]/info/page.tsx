/* Турнир в кабинете старшего тренера региона, раздел «Сведения»: сведения турнира с условиями допуска.
   Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { CoachTournamentView } from '@/views/coach';

export const metadata: Metadata = { title: 'Сведения — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CoachTournamentView id={id} section="info" />;
}
