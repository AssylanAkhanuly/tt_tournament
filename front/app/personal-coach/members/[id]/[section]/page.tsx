/* Карточка члена сборной, раздел. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NationalMemberView, type MemberSection } from '@/views/national';

export const metadata: Metadata = { title: 'Член сборной — ФНТ РК' };

const SECTIONS: MemberSection[] = ['plan', 'medical', 'history', 'sport'];

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!SECTIONS.includes(section as MemberSection)) notFound();
  return <NationalMemberView cabinet="personal" id={id} section={section as MemberSection} />;
}
