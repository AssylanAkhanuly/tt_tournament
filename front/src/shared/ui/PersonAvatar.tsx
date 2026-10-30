'use client';

/* Фото человека ✳ (29.10.2026, решение владельца продукта): снимок, если он
   есть, иначе заглушка — силуэт человека на нейтральном круге (а не буква
   имени: в таблицах спортсменов фото — часть строки, и заглушка должна
   читаться как «фото нет», а не как ещё одна надпись). HeroUI `Avatar`. */

import { Avatar } from '@heroui/react';
import { UserRound } from 'lucide-react';

const ICON = { sm: 16, md: 20, lg: 26 } as const;

export function PersonAvatar({
  name,
  src,
  size = 'sm',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Avatar size={size} className="shrink-0" data-testid="person-avatar" data-photo={src ? 'yes' : 'no'}>
      {src && <Avatar.Image src={src} alt={name} />}
      <Avatar.Fallback className="bg-neutral-200 text-neutral-500" aria-label={name}>
        <UserRound size={ICON[size]} />
      </Avatar.Fallback>
    </Avatar>
  );
}
