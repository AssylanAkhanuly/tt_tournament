/* Турнир, раздел «Спортсмены». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { ChiefTournamentView } from '@/views/chief';

export const metadata: Metadata = { title: 'Спортсмены — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChiefTournamentView id={id} section="players" />;
}
