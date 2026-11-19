/* Медкарта члена сборной у врача. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { DoctorMemberView } from '@/views/national-doctor';

export const metadata: Metadata = { title: 'Медкарта — ФНТ РК' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorMemberView id={id} />;
}
