/* Доска планов подготовки ✳ (21.11.2026). Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { NationalPlansView } from '@/views/national';

export const metadata: Metadata = { title: 'Планы подготовки — ФНТ РК' };

export default function Page() {
  return <NationalPlansView cabinet="personal" />;
}
