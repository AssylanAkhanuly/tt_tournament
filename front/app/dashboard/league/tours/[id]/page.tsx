/* Тур лиги: встречи и счёт. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { AdminTourView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Тур — Лига — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTourView id={id} />;
}
