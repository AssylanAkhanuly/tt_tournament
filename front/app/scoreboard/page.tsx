import type { Metadata } from 'next';

import { boardKeyFrom } from '@/entities/scoreboard/api';
import { fetchBoard } from '@/entities/scoreboard/api.server';
import { ScoreboardControlView } from '@/views/scoreboard/ScoreboardControlView';

export const metadata: Metadata = {
  title: 'Табло трансляции · пульт · ФНТ РК',
};

// Счёт живёт в Django и меняется постоянно — страницу не кэшируем.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ board?: string | string[] }> };

export default async function ScoreboardPage({ searchParams }: Props) {
  // ?board=<ключ> — какой стол ведём: у турнира их может быть несколько.
  const key = boardKeyFrom((await searchParams).board);
  return <ScoreboardControlView initial={await fetchBoard(key)} />;
}
