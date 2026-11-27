'use client';

/* Фото человека ✳ (29.10.2026, решение владельца продукта): снимок, если он
   есть, иначе заглушка. С 24.11.2026 (решение владельца продукта: «аватары в
   таблицах судей и спортсменов») заглушка — лицо фигуры-заглушки своего пола
   на белом градиенте, как в карточках (`placeholderFigure`), если вызывающий
   дал `id`; без `id` — прежний силуэт на нейтральном круге. HeroUI `Avatar`. */

import { Avatar } from '@heroui/react';
import { UserRound } from 'lucide-react';

import { placeholderFigure } from '@/shared/lib/figure';

const ICON = { sm: 16, md: 20, lg: 26 } as const;

export function PersonAvatar({
  name,
  src,
  size = 'sm',
  id,
  sex,
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  /** Чья заглушка — одна и та же фигура у человека везде. */
  id?: string;
  sex?: string | null;
}) {
  return (
    <Avatar size={size} className="shrink-0" data-testid="person-avatar" data-photo={src ? 'yes' : 'no'}>
      {src && <Avatar.Image src={src} alt={name} />}
      {!src && id ? (
        <span className="block size-full overflow-hidden rounded-full bg-[linear-gradient(180deg,white,var(--color-neutral-100))] ring-1 ring-neutral-200" aria-label={name} role="img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={placeholderFigure(id, sex)} alt="" className="size-full origin-top scale-[1.2] object-cover object-top" />
        </span>
      ) : (
        <Avatar.Fallback className="bg-neutral-200 text-neutral-500" aria-label={name}>
          <UserRound size={ICON[size]} />
        </Avatar.Fallback>
      )}
    </Avatar>
  );
}
