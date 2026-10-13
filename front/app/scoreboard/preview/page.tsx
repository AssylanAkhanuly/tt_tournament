import type { Metadata } from 'next';

import { boardKeyFrom } from '@/entities/scoreboard/api';
import { fetchBoard } from '@/entities/scoreboard/api.server';
import { ScoreboardPreviewView } from '@/views/scoreboard/ScoreboardPreviewView';

export const metadata: Metadata = {
  title: 'Табло · как в эфире',
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ board?: string | string[]; label?: string | string[]; bg?: string | string[] }> };

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value)?.trim();

// Обе плашки в одном кадре 16:9 — посмотреть картинку целиком без OBS.
// `?board=` и `?label=` те же, что у самих источников; `?bg=light` — светлый кадр.
export default async function ScoreboardPreviewPage({ searchParams }: Props) {
  const { board, label, bg } = await searchParams;
  return (
    <ScoreboardPreviewView
      initial={await fetchBoard(boardKeyFrom(board))}
      label={first(label) || undefined}
      light={first(bg) === 'light'}
    />
  );
}
