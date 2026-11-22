/* Кабинет спортсмена: календарь турниров ✳ (22.11.2026). */

import type { Metadata } from 'next';
import { PlayerCalendarView } from '@/views/national';

export const metadata: Metadata = { title: 'Календарь — ФНТ РК' };

export default function Page() {
  return <PlayerCalendarView />;
}
