/* Своя карточка члена сборной в кабинете спортсмена: без раздела — профиль. */

import { NationalMemberView } from '@/views/national';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NationalMemberView cabinet="player" id={id} />;
}
