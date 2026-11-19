/* Тур лиги, раздел «Встречи · Судьи · Расписание». Маршрут тонкий: композиция во `views`.
   Suspense — экран читает вид расписания из адреса (`?view=day`). */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AdminTourView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Тур — Лига — ФНТ РК' };

const SECTIONS = ['matches', 'referees', 'schedule'] as const;

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!(SECTIONS as readonly string[]).includes(section)) notFound();
  return (
    <Suspense>
      <AdminTourView id={id} section={section as (typeof SECTIONS)[number]} />
    </Suspense>
  );
}
