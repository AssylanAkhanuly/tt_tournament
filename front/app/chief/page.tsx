/* Кабинет главного судьи. Маршрут тонкий: композиция во `views`. Suspense —
   экран читает вид из адреса (`?view=`). */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChiefView } from '@/views/chief';

export const metadata: Metadata = { title: 'Главный судья — ФНТ РК' };

export default function Page() {
  return (
    <Suspense>
      <ChiefView />
    </Suspense>
  );
}
