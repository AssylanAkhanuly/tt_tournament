/* Карточка спортсмена — публичная страница (ТЗ §3, экран Э0.4). */

import type { Metadata } from 'next';
import { PlayerCardView } from '@/views/rating';

export const metadata: Metadata = {
  title: 'Карточка спортсмена — ФНТ РК',
  description: 'Рейтинг спортсмена, статистика и история изменений с основаниями.',
};

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlayerCardView userId={id} />;
}
