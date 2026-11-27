'use client';

/* Свой профиль спортсмена не из сборной ✳ (22.11.2026, решение владельца
   продукта): та же шапка и блоки, что у профиля члена сборной, но по
   рейтинговой карточке — шапка (фигура и аватар — заглушки своего пола,
   место в листе), показатели, динамика рейтинга, личные встречи. Медкарты и
   плана подготовки нет — они только у членов сборной (им кабинет спортсмена
   открывает профиль сборной). Тот же вид — у страницы человека `/people/<id>`
   ✳ (24.11.2026, решение владельца продукта): ниже блоков — её роли
   (`children`); нет карточки — `fallback`. */

import { Spinner } from '@heroui/react';
import type { ReactNode } from 'react';

import { useRatingCard } from '@/entities/rating';
import { STATUS_DOT } from '@/widgets/rating';

import { ProfileHero } from './profile/Hero';
import { Kpis } from './profile/Kpis';
import { RatingBlock } from './profile/RatingBlock';
import { HeadToHead } from './profile/SideBlocks';

export function PlayerProfile({ userId, children, fallback }: { userId: string; children?: ReactNode; fallback?: ReactNode }) {
  return <PlayerProfileView userId={userId} card={useRatingCard(userId)} fallback={fallback}>{children}</PlayerProfileView>;
}

/** Тот же профиль по уже загруженной карточке — экрану, который сам её
    перечитывает (карточка спортсмена после «Редактировать»). `ownPage` —
    это и есть страница карточки: ссылки «Вся история» на саму себя нет. */
export function PlayerProfileView({ userId, card, children, fallback, ownPage = false }: {
  userId: string;
  card: ReturnType<typeof useRatingCard>;
  children?: ReactNode;
  fallback?: ReactNode;
  ownPage?: boolean;
}) {
  if (card.loading && !card.data) return <Spinner className="m-auto" />;
  if (!card.data)
    return fallback ?? (
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
          // Удалённый из рейтинга ✳ (27.11.2026) места в листе не занимает —
          // вместо места значок в шапке.
          place={r.removedAt ? undefined : card.data.place}
          danger={!!r.removedAt}
          badge={
            r.removedAt ? (
              // Текстом в голове шапки, без плашки ✳ (27.11.2026, решение владельца продукта).
              <span className="flex items-center gap-2 text-[13px] font-semibold text-white/85" data-testid="card-removed">
                <span aria-hidden className="size-2 rounded-full bg-white" />
                Удалён из рейтинга {new Date(r.removedAt).toLocaleDateString('ru-RU')}
              </span>
            ) : undefined
          }
          // Статус — точкой на фото (зелёная — активен), подпись — в подсказке.
          avatarSlot={
            <span
              role="img"
              aria-label={r.statusLabel}
              title={r.statusLabel}
              data-testid="card-status"
              data-status={r.status}
              className={'block size-5 rounded-full ring-4 ring-white ' + STATUS_DOT[r.status]}
            />
          }
        />
        <Kpis rating={r.value} card={card} />
        <RatingBlock userId={userId} card={card} historyLink={!ownPage} />
        <HeadToHead me={{ name: r.name, avatar: null }} history={history} />
        {children}
      </div>
    </div>
  );
}
