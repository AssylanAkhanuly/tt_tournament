/* Турнир без раздела — открываем первый раздел, «Сведения». */

import { redirect } from 'next/navigation';

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect('/gsk/tournaments/' + id + '/info');
}
