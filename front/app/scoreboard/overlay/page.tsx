import type { Metadata } from 'next';

import { boardKeyFrom } from '@/entities/scoreboard/api';
import { fetchBoard } from '@/entities/scoreboard/api.server';
import { ScoreboardOverlayView } from '@/views/scoreboard/ScoreboardOverlayView';

export const metadata: Metadata = {
  title: 'Табло · оверлей',
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ board?: string | string[] }> };

// Текущий счёт отдаём прямо в разметке: при перезапуске источника в OBS плашка
// появляется сразу с верным счётом, не дожидаясь первого опроса.
export default async function ScoreboardOverlayPage({ searchParams }: Props) {
  const key = boardKeyFrom((await searchParams).board);
  return <ScoreboardOverlayView initial={await fetchBoard(key)} />;
}
