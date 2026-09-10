/* Журнал изменений рейтинга — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { JournalView } from '@/views/rating-journal';

export const metadata: Metadata = {
  title: 'Журнал рейтинга — ФНТ РК',
};

export default function JournalPage() {
  return <JournalView />;
}
