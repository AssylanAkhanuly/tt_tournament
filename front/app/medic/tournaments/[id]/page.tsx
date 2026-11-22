/* Кабинет врача соревнований: допуск участников турнира ✳ (22.11.2026). */

import type { Metadata } from 'next';
import { MedicTournamentView } from '@/views/medic';

export const metadata: Metadata = { title: 'Допуск участников — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MedicTournamentView id={id} />;
}
