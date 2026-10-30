/* Ссылка «поделиться» на турнир: ведёт в кабинет того, кто открыл
   (`views/tournament/TournamentLinkView`). Своей страницы нет. */

import { TournamentLinkView } from '@/views/tournament';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentLinkView id={id} />;
}
