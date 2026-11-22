/* Кабинет судьи: ввод счёта матча и результат ✳ (22.11.2026, flows/09 Э9.3, Э9.5). */

import type { Metadata } from 'next';
import { MatchScoringView } from '@/views/referee';

export const metadata: Metadata = { title: 'Ввод счёта — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ tournamentId: string; matchId: string }> }) {
  const { tournamentId, matchId } = await params;
  return <MatchScoringView tournamentId={tournamentId} matchId={matchId} />;
}
