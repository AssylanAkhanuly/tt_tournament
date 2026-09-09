'use client';

/* Карточка спортсмена — публичная (ТЗ §3, экран Э0.4: «профиль игрока —
   рейтинг, статистика, история матчей»).

   Персональные данные ограничены рейтинговыми: п. 23.5 Положения разрешает
   публиковать только то, что нужно для идентификации спортсмена и работы
   рейтинга. Контакты и документы сюда не попадают вовсе — их нет в ответе. */

import { useRatingCard } from '@/entities/rating';
import { EmptyBox } from '@/shared/kit/app';
import { PlayerCard } from '@/widgets/rating';
import { RatingShell } from './RatingShell';

export function PlayerCardView({ userId }: { userId: string }) {
  const { data, loading, error } = useRatingCard(userId);

  const title = data?.profile.name ?? 'Карточка спортсмена';

  return (
    <RatingShell
      title={title}
      back={{ href: '/reyting', label: 'Рейтинг игроков' }}
      lead={
        data
          ? 'Рейтинговая карточка: значение, счётчики и история всех изменений с их основаниями.'
          : undefined
      }
    >
      {error && (
        <EmptyBox
          title={error.includes('карточк') ? 'Карточки нет' : 'Карточка не загрузилась'}
          text={
            error.includes('карточк')
              ? 'У этого спортсмена ещё нет рейтинговой карточки — он не сыграл ни одного рейтингового матча.'
              : error + '. Проверьте, что рейтинговый сервис запущен.'
          }
        />
      )}
      {!error && loading && (
        <p className="py-6 text-[13px] text-neutral-500">Карточка загружается…</p>
      )}
      {!error && data && <PlayerCard card={data} />}
    </RatingShell>
  );
}
