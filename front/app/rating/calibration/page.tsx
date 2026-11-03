/* Калибровка рейтинга — раздел председателя ГСК ✳ (03.11.2026). Маршрут тонкий:
   композиция во `views`. */

import type { Metadata } from 'next';
import { CalibrationView } from '@/views/rating-calibration';

export const metadata: Metadata = { title: 'Калибровка рейтинга — ФНТ РК' };

export default function Page() {
  return <CalibrationView />;
}
