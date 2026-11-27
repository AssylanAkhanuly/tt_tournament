/* Турнир, раздел «Спортсмены» — только смотреть (заместитель, ✳ 24.11.2026). Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrigadeTournamentView } from '@/views/brigade';

export const metadata: Metadata = { title: 'Спортсмены — турнир — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <BrigadeTournamentView who="deputy" id={id} section="players" />
    </Suspense>
  );
}
