/* Турнир, раздел «Расписание» — кабинет: главный секретарь. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrigadeTournamentView } from '@/views/brigade';

export const metadata: Metadata = { title: 'Расписание — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <BrigadeTournamentView who="secretary" id={id} section="schedule" />
    </Suspense>
  );
}
