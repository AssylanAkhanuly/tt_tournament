'use client';

/* Свой профиль спортсмена не из сборной ✳ (22.11.2026, решение владельца
   продукта): та же шапка и блоки, что у профиля члена сборной, но по
   рейтинговой карточке — шапка (фигура и аватар — заглушки своего пола,
   место в листе), показатели, динамика рейтинга, личные встречи. Медкарты и
   плана подготовки нет — они только у членов сборной (им кабинет спортсмена
   открывает профиль сборной). */

import { Spinner } from '@heroui/react';

import { useRatingCard } from '@/entities/rating';

import { ProfileHero } from './profile/Hero';
import { Kpis } from './profile/Kpis';
import { RatingBlock } from './profile/RatingBlock';
import { HeadToHead } from './profile/SideBlocks';

export function PlayerProfile({ userId }: { userId: string }) {
  const card = useRatingCard(userId);
  if (card.loading) return <Spinner className="m-auto" />;
  if (!card.data)
    return (
      <p className="m-0 p-6 text-[13px] text-neutral-500" data-testid="player-no-card">
        Рейтинговой карточки нет
      </p>
    );
  const r = card.data.profile;
  const history = card.data.history.filter((h) => !h.isReverted).slice().reverse();
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-neutral-100" data-testid="player-profile">
      <div className="flex flex-col gap-4 p-4">
        <ProfileHero
          who={{
            id: userId,
            name: r.name,
            region: r.region,
            birthYear: r.birthYear,
            birthDate: r.birthDate,
            sex: r.sex === 'm' || r.sex === 'f' ? r.sex : '',
            avatar: null,
            figure: null,
          }}
          place={card.data.place}
        />
        <Kpis rating={r.value} card={card} />
        <RatingBlock userId={userId} card={card} />
        <HeadToHead me={{ name: r.name, avatar: null }} history={history} />
      </div>
    </div>
  );
}
