/* Тур без раздела — на «Встречи». */

import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/league/tours/${id}/matches`);
}
