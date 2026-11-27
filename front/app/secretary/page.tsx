/* Кабинет: главный секретарь ✳ (24.11.2026). Маршрут тонкий: композиция во `views`.
   Suspense — экран читает вид из адреса (`?view=`). */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrigadeView } from '@/views/brigade';

export const metadata: Metadata = { title: 'Главный секретарь — ФНТ РК' };

export default function Page() {
  return (
    <Suspense>
      <BrigadeView who="secretary" />
    </Suspense>
  );
}
