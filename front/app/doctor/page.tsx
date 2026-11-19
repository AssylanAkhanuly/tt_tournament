/* Кабинет врача сборной — состав. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { DoctorView } from '@/views/national-doctor';

export const metadata: Metadata = { title: 'Врач сборной — ФНТ РК' };

export default function Page() {
  return <DoctorView />;
}
