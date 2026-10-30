/* Кабинет спортсмена — пока пустой ✳ (28.10.2026). Маршрут тонкий: композиция
   во `views` (клиентская — роль берётся из сессии). */

import type { Metadata } from 'next';
import { PlayerView } from '@/views/workspace';

export const metadata: Metadata = { title: 'Спортсмен — ФНТ РК' };

export default function Page() {
  return <PlayerView />;
}
