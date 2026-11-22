/* Кабинет спортсмена: «Мой профиль» ✳ (22.11.2026). Маршрут тонкий:
   композиция во `views` (клиентская — роль и карточка берутся из сессии). */

import type { Metadata } from 'next';
import { PlayerView } from '@/views/national';

export const metadata: Metadata = { title: 'Спортсмен — ФНТ РК' };

export default function Page() {
  return <PlayerView />;
}
