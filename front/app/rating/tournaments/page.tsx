/* Турниры для рейтинга — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { TournamentsView } from '@/views/rating-tournaments';

export const metadata: Metadata = {
  title: 'Турниры — ФНТ РК',
};

export default function TournamentsPage() {
  return <TournamentsView />;
}
