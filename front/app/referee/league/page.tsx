/* Встречи Лиги в кабинете судьи. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { RefereeLeagueView } from '@/views/referee';

export const metadata: Metadata = { title: 'Лига — Судья — ФНТ РК' };

export default function Page() {
  return <RefereeLeagueView />;
}
