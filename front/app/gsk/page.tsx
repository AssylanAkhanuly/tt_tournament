/* Рейтинг игроков в кабинете председателя ГСК ✳ (24.11.2026): тот же лист, что
   публичный `/rating`, но по адресу кабинета — как `/dashboard`, `/chief`.
   Suspense — лист читает вид из адреса (`?view=`). */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RatingListView } from '@/views/rating';

export const metadata: Metadata = { title: 'Рейтинг игроков — ФНТ РК' };

export default function GskRatingPage() {
  return (
    <Suspense>
      <RatingListView />
    </Suspense>
  );
}
