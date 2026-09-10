/* Выпуски рейтинга — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { EditionsView } from '@/views/rating-editions';

export const metadata: Metadata = {
  title: 'Выпуски рейтинга — ФНТ РК',
};

export default function EditionsPage() {
  return <EditionsView />;
}
