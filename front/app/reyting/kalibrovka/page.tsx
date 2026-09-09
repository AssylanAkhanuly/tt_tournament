/* Калибровка коэффициентов рейтинга. */

import type { Metadata } from 'next';
import { RatingLabView } from '@/views/rating-lab';

export const metadata: Metadata = {
  title: 'Калибровка рейтинга — ФНТ РК',
  description:
    'Подбор коэффициентов Национального рейтинга: ввод спортсменов и матчей, прогон на боевом движке, наблюдения по шкале.',
};

export default function CalibrationPage() {
  return <RatingLabView />;
}
