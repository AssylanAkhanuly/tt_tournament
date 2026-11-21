/* Карточка члена сборной: без раздела — профиль. */

import { NationalMemberView } from '@/views/national';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NationalMemberView cabinet="doctor" id={id} />;
}
