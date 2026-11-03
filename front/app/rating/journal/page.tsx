/* Журнал рейтинга — раздел председателя ГСК ✳ (03.11.2026). Маршрут тонкий:
   композиция во `views`. */

import type { Metadata } from 'next';
import { JournalView } from '@/views/rating-journal';

export const metadata: Metadata = { title: 'Журнал рейтинга — ФНТ РК' };

export default function Page() {
  return <JournalView />;
}
