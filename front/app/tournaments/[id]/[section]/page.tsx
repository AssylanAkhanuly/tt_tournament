/* Ссылка «поделиться» на раздел турнира: ведёт в тот же раздел кабинета того,
   кто открыл (`views/tournament/TournamentLinkView`). */

import { notFound } from 'next/navigation';
import { TournamentLinkView } from '@/views/tournament';

const SECTIONS = ['info', 'players', 'referees', 'schedule'] as const;

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  const s = SECTIONS.find((x) => x === section);
  if (!s) notFound();
  return <TournamentLinkView id={id} section={s} />;
}
