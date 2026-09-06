/* Маршрут пилотного калькулятора рейтинга. Тонкий: композиция — во `views`. */

import type { Metadata } from 'next';
import { RatingLabView } from '@/views/rating-lab';

export const metadata: Metadata = {
  title: 'Пилотный калькулятор Национального рейтинга — ФНТ РК',
  description:
    'Расчёт по проекту Положения о Национальном рейтинге спортсменов РК от 28.08.2026: ввод спортсменов и матчей, подбор коэффициентов, рейтинговая история.',
};

export default function RatingPage() {
  return <RatingLabView />;
}
