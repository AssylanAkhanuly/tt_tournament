/* Главная по образцу ✳ (21.11.2026). Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { HomeView } from '@/views/home';

export const metadata: Metadata = { title: 'Главная — ФНТ РК' };

export default function HomePage() {
  return <HomeView />;
}
