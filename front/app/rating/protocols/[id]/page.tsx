/* Страница протокола турнира — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { ProtocolView } from '@/views/rating-protocol';

export const metadata: Metadata = {
  title: 'Протокол турнира — ФНТ РК',
};

export default async function ProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProtocolView id={id} />;
}
