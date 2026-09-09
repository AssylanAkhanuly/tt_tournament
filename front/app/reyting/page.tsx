/* Рейтинг игроков — публичная страница (ТЗ §3, экран Э0.4).
   Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { RatingListView } from '@/views/rating';

export const metadata: Metadata = {
  title: 'Рейтинг игроков — ФНТ РК',
  description:
    'Национальный рейтинг спортсменов Республики Казахстан по настольному теннису: таблица с фильтрами по полу, возрасту и региону, карточка спортсмена с историей начислений.',
};

export default function RatingPage() {
  return <RatingListView />;
}
