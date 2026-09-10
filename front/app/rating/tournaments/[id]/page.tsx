/* Страница турнира: протокол, участники, матчи — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { TournamentView } from '@/views/rating-tournament';

export const metadata: Metadata = {
  title: 'Турнир — ФНТ РК',
};

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentView id={id} />;
}
