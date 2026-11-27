'use client';

/* Рейтинг-лист карточками ✳ (23.11.2026, решение владельца продукта: «как у
   тренера сборной»). Карточка — как в составе сборной (`RosterBoard`): слева
   фигура на персиковом (снимков у рейтинга нет — заглушка своего пола), справа
   место в листе огромной контурной цифрой фоном, фамилия, имя и отчество,
   регион; внизу — рейтинг и год рождения. Нажатие открывает карточку
   спортсмена. Сетка: одна колонка на телефоне, две — от `sm`, три — от `2xl`.
   Карточка — общий `PlayerCard` ✳ (24.11.2026): белый градиент вместо персика. */

import type { RatingProfile } from '@/entities/rating';
import { num2 } from '@/entities/rating';
import { placeholderFigure } from '@/shared/lib/figure';
import { PlayerCard, PlayerFigure } from '@/shared/ui/PlayerCard';

function split(name: string): { surname: string; rest: string } {
  const [surname = '', ...rest] = name.trim().split(/\s+/);
  return { surname: surname.toUpperCase(), rest: rest.join(' ') };
}

/** Карточка спортсмена как в рейтинг-листе — общая для листа и обзора турнира ✳ (23.11.2026). */
export type RatingCardData = { userId: string; name: string; value: number | null; region: string; birthYear: number | null; sex: string };

export function RatingPlayerCard({ r, place, onOpen, testId = 'rating-card' }: { r: RatingCardData; place: number; onOpen: () => void; testId?: string }) {
  const { surname, rest } = split(r.name);
  return (
    <PlayerCard
      figure={<PlayerFigure src={placeholderFigure(r.userId, r.sex)} />}
      place={place}
      surname={surname}
      rest={rest}
      region={r.region}
      facts={[
        { label: 'Рейтинг', value: r.value !== null ? num2(r.value) : '—', testId: 'rating-value' },
        { label: 'Год', value: r.birthYear ? String(r.birthYear) : '—' },
      ]}
      onPress={onOpen}
      testId={testId}
      data={{ player: r.name }}
    />
  );
}

export function RatingCards({ rows, first, onOpen }: { rows: RatingProfile[]; first: number; onOpen: (userId: string) => void }) {
  return (
    <div className="grid gap-4 bg-neutral-100 p-4 sm:grid-cols-2 2xl:grid-cols-3" data-testid="rating-cards">
      {rows.map((r, i) => (
        <RatingPlayerCard key={r.userId} r={r} place={first + i + 1} onOpen={() => onOpen(r.userId)} />
      ))}
    </div>
  );
}
