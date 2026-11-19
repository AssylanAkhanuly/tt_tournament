/* Сезон Лиги, раздел «Лиги · Регистрация». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminSeasonView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Сезон — Лига — ФНТ РК' };

const SECTIONS = ['leagues', 'registration'] as const;

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!(SECTIONS as readonly string[]).includes(section)) notFound();
  return <AdminSeasonView id={id} section={section as (typeof SECTIONS)[number]} />;
}
