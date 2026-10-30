'use client';

/* Карта плей-офф турнира «группы + плей-офф» ✳ (30.10.2026, решение владельца
   продукта): сетка по итогам групп, только смотреть. Посев и метки считает
   сервер (`back/tournaments/playoff.py`): позиция — «A1», «B2»; группа сыграна
   целиком — в позиции её игрок (фамилия с инициалами и фото), рядом метка.
   Рисует тот же `BracketFlow`, что демо-сетка `/bracket`. */

import { useMemo } from 'react';

import type { Bracket, Side } from '@/entities/bracket/model';
import type { PlayoffMap as PlayoffData, PlayoffSide } from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';

import { BracketFlow } from './BracketFlow';

const toSide = (s: PlayoffSide | null): Side | null =>
  s && {
    id: s.player?.id ?? s.label,
    name: s.player ? s.label + ' · ' + shortName(s.player.name) : s.label,
    avatarUrl: s.player?.avatar ?? undefined,
    placeholder: !s.player,
  };

export function PlayoffMap({ playoff }: { playoff: PlayoffData }) {
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
    <div className="min-h-0 flex-1" data-testid="playoff-map">
      <BracketFlow bracket={bracket} />
    </div>
  );
}
