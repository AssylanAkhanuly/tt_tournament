/* Профиль человека. Маршрут тонкий: композиция во `views`. */

import type { Metadata } from 'next';
import { PersonView } from '@/views/person';

export const metadata: Metadata = { title: 'Профиль — ФНТ РК' };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonView id={id} />;
}
