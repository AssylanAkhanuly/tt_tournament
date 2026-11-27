/* «Календарь» председателя ГСК. Маршрут тонкий: композиция во `views`.
   Suspense — экран читает вид из адреса (`?view=`). */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalendarView } from '@/views/rating-calendar';

export const metadata: Metadata = { title: 'Календарь — ФНТ РК' };

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarView />
    </Suspense>
  );
}
