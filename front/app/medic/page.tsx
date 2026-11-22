/* Кабинет врача соревнований ✳ (22.11.2026). Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { MedicView } from '@/views/medic';

export const metadata: Metadata = { title: 'Врач соревнований — ФНТ РК' };

export default function Page() {
  return <MedicView />;
}
