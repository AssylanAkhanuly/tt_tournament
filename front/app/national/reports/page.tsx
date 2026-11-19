/* Рапорты на командирование. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { NationalReportsView } from '@/views/national';

export const metadata: Metadata = { title: 'Рапорты — ФНТ РК' };

export default function Page() {
  return <NationalReportsView cabinet="national" />;
}
