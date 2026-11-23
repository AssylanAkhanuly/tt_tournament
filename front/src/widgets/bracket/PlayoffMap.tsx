'use client';

/* Карта плей-офф турнира «группы + плей-офф» ✳ (30.10.2026, решение владельца
   продукта): сетка по итогам групп, только смотреть. Посев и метки считает
   сервер (`back/tournaments/playoff.py`): позиция — «A1», «B2»; группа сыграна
   целиком — в позиции её игрок (фамилия с инициалами и фото), рядом метка.
   Рисует плакат `BracketPoster` ✳ (23.11.2026; до того — `BracketFlow`, он
   остался у демо-сетки `/bracket`). */

import { useMemo } from 'react';

import type { Bracket, Side } from '@/entities/bracket/model';
import type { PlayoffMap as PlayoffData, PlayoffSide } from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';

import { BracketPoster } from './BracketPoster';

const toSide = (s: PlayoffSide | null): Side | null =>
  s && {
    id: s.player?.id ?? s.label,
    name: s.player ? shortName(s.player.name) : s.label,
    tag: s.label,
    avatarUrl: s.player?.avatar ?? undefined,
    placeholder: !s.player,
  };

export function PlayoffMap({ playoff, still = false }: { playoff: PlayoffData; still?: boolean }) {
  const bracket = useMemo<Bracket>(
    () => ({
      format: 'single_elimination',
      matches: playoff.matches.map((m) => ({
        id: m.round + '-' + m.slot,
        round: m.round,
        slot: m.slot,
        a: toSide(m.a),
        b: toSide(m.b),
        status: 'pending',
      })),
    }),
    [playoff],
  );
  if (!playoff.matches.length)
    return (
      <p className="px-6 py-8 text-[14px] text-neutral-500" data-testid="playoff-empty">
        Сетки нет
      </p>
    );
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="playoff-map">
      {/* На обзоре — восьмёрка целиком (как плакат лендинга), в «Сетке» — вся сетка по ширине. */}
      <BracketPoster bracket={bracket} lastRounds={still ? 3 : undefined} fit={still ? 'contain' : 'width'} />
    </div>
  );
}
