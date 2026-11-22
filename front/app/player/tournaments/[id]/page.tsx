/* Кабинет спортсмена: сведения турнира ✳ (22.11.2026). */

import { PlayerTournamentView } from '@/views/national';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlayerTournamentView id={id} />;
}
