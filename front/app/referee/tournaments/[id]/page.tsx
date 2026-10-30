/* Турнир в кабинете судьи: сведения и заявка на судейство, составов нет.
   Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { RefereeTournamentView } from '@/views/referee';

export const metadata: Metadata = { title: 'Турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RefereeTournamentView id={id} />;
}
