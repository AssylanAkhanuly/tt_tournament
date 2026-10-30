/* Кабинет администратора федерации. Маршрут тонкий: композиция во `views`.
   Suspense — экран читает вид из адреса (`?view=`), без границы Next не соберёт
   страницу. */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Администратор федерации — ФНТ РК' };

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  );
}
