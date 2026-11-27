/* Кабинет: заместитель главного судьи ✳ (24.11.2026). Маршрут тонкий: композиция во `views`.
   Suspense — экран читает вид из адреса (`?view=`). */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrigadeView } from '@/views/brigade';

export const metadata: Metadata = { title: 'Заместитель главного судьи — ФНТ РК' };

export default function Page() {
  return (
    <Suspense>
      <BrigadeView who="deputy" />
    </Suspense>
  );
}
