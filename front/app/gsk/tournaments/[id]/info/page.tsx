/* Турнир, раздел «Сведения». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { GskTournamentView } from '@/views/rating-calendar';

export const metadata: Metadata = { title: 'Сведения — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GskTournamentView id={id} section="info" />;
}
