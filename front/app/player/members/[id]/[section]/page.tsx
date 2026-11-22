/* Своя карточка члена сборной в кабинете спортсмена, раздел ✳ (22.11.2026). */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NationalMemberView, type MemberSection } from '@/views/national';

export const metadata: Metadata = { title: 'Мой профиль — ФНТ РК' };

const SECTIONS: MemberSection[] = ['plan', 'medical', 'history'];

export default async function Page({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!SECTIONS.includes(section as MemberSection)) notFound();
  return <NationalMemberView cabinet="player" id={id} section={section as MemberSection} />;
}
