/* Апелляции на рейтинг — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { AppealsView } from '@/views/rating-appeals';

export const metadata: Metadata = {
  title: 'Апелляции — ФНТ РК',
};

export default function AppealsPage() {
  return <AppealsView />;
}
