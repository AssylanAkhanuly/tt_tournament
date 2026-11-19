/* Сезон Лиги, раздел «Лиги · Команды». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminSeasonView } from '@/views/dashboard';

export const metadata: Metadata = { title: 'Сезон — Лига — ФНТ РК' };

const SECTIONS = ['leagues', 'teams'] as const;

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  // Прежний раздел «Регистрация» — теперь «Настройки» в «Командах».
  if (section === 'registration') redirect(`/dashboard/league/seasons/${id}/teams`);
  if (!(SECTIONS as readonly string[]).includes(section)) notFound();
  return <AdminSeasonView id={id} section={section as (typeof SECTIONS)[number]} />;
}
