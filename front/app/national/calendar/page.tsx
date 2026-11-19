/* Календарь подготовки. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { NationalCalendarView } from '@/views/national';

export const metadata: Metadata = { title: 'Календарь подготовки — ФНТ РК' };

export default function Page() {
  return <NationalCalendarView cabinet="national" />;
}
