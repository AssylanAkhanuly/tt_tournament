/* Кабинет главного тренера сборной — состав. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { NationalView } from '@/views/national';

export const metadata: Metadata = { title: 'Главный тренер сборной — ФНТ РК' };

export default function Page() {
  return <NationalView />;
}
