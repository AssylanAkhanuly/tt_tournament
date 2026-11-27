/* Турнир, раздел «Судьи» у главного судьи ✳ (24.11.2026): коллегия на чтение и
   «Доступ к правке». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { ChiefTournamentView } from '@/views/chief';

export const metadata: Metadata = { title: 'Судьи — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChiefTournamentView id={id} section="referees" />;
}
