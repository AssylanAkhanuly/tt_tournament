/* «Лига» администратора федерации — дивизионы сезона. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { AdminLeagueView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Лига — ФНТ РК' };

export default function Page() {
  return <AdminLeagueView />;
}
