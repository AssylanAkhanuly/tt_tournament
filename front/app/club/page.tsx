/* Кабинет администратора клуба. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { ClubView } from '@/views/club';

export const metadata: Metadata = { title: 'Администратор клуба — ФНТ РК' };

export default function Page() {
  return <ClubView />;
}
