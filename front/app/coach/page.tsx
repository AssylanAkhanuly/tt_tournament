/* Кабинет старшего тренера региона. Маршрут тонкий: композиция во `views`.
   Suspense — экран читает вид из адреса (`?view=`). */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CoachView } from '@/views/coach';

export const metadata: Metadata = { title: 'Старший тренер региона — ФНТ РК' };

export default function Page() {
  return (
    <Suspense>
      <CoachView />
    </Suspense>
  );
}
