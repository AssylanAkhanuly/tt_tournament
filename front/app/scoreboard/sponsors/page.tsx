import type { Metadata } from 'next';

import { ScoreboardSponsorsView } from '@/views/scoreboard/ScoreboardSponsorsView';

export const metadata: Metadata = {
  title: 'Табло · партнёры',
};

type Props = { searchParams: Promise<{ label?: string | string[] }> };

// Подпись перед знаками (город, турнир) задаётся адресом источника в OBS:
// `?label=ASTANA`. Без неё полоса начинается сразу со знаков.
export default async function ScoreboardSponsorsPage({ searchParams }: Props) {
  const { label } = await searchParams;
  const text = (Array.isArray(label) ? label[0] : label)?.trim();
  return <ScoreboardSponsorsView label={text || undefined} />;
}
