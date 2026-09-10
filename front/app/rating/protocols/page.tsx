/* Протоколы для рейтинга — раздел председателя ГСК. */

import type { Metadata } from 'next';
import { ProtocolsView } from '@/views/rating-protocols';

export const metadata: Metadata = {
  title: 'Протоколы — ФНТ РК',
};

export default function ProtocolsPage() {
  return <ProtocolsView />;
}
