/* Карточка члена сборной: «План подготовки · Медкарта». Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NationalMemberView } from '@/views/national';

export const metadata: Metadata = { title: 'Член сборной — ФНТ РК' };

const SECTIONS = ['plan', 'medical'] as const;

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!(SECTIONS as readonly string[]).includes(section)) notFound();
  return <NationalMemberView id={id} section={section as (typeof SECTIONS)[number]} />;
}
