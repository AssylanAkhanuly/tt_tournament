/* Дивизион лиги, раздел «Таблица · Команды · Туры». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminDivisionView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Дивизион — Лига — ФНТ РК' };

const SECTIONS = ['table', 'teams', 'tours'] as const;

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!(SECTIONS as readonly string[]).includes(section)) notFound();
  return <AdminDivisionView id={id} section={section as (typeof SECTIONS)[number]} />;
}
