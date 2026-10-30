/* Кабинет судьи. Маршрут тонкий: композиция во `views`. Suspense — экран
   читает вид из адреса (`?view=`), без границы Next не соберёт страницу. */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RefereeView } from '@/views/referee';

export const metadata: Metadata = { title: 'Судья — ФНТ РК' };

export default function Page() {
  return (
    <Suspense>
      <RefereeView />
    </Suspense>
  );
}
