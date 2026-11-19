/* Расписание кабинета клуба. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { ClubScheduleView } from '@/views/club';

export const metadata: Metadata = { title: 'Расписание — Администратор клуба — ФНТ РК' };

export default function Page() {
  return <ClubScheduleView />;
}
