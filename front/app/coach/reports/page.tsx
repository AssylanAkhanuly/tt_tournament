/* Рапорты старшего тренера региона. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { CoachReportsView } from '@/views/coach';

export const metadata: Metadata = { title: 'Рапорты — ФНТ РК' };

export default function Page() {
  return <CoachReportsView />;
}
