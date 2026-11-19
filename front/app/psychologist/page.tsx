/* Психолог сборной — состав. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { NationalRosterView } from '@/views/national';

export const metadata: Metadata = { title: 'Психолог сборной — ФНТ РК' };

export default function Page() {
  return <NationalRosterView cabinet="psychologist" />;
}
