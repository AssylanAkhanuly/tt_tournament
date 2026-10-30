/* Турнир, раздел «Судьи». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { AdminTournamentView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Судьи — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTournamentView id={id} section="referees" />;
}
