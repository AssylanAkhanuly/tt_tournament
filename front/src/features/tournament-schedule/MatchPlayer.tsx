'use client';

/* Игрок в матче ✳ (30.10.2026, решение владельца продукта): фото и фамилия с
   инициалами — «Коновалов С. Г.». Полное имя — в подсказке. */

import type { SchedulePerson } from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';
import { PersonAvatar } from '@/shared/ui/PersonAvatar';

export function MatchPlayer({ person }: { person: SchedulePerson }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2" title={person.name} data-testid="match-player">
      <PersonAvatar name={person.name} src={person.avatar} />
      <span className="truncate">{shortName(person.name)}</span>
    </span>
  );
}

/** Пара матча: «игрок — игрок». */
export function MatchPair({ a, b }: { a: SchedulePerson; b: SchedulePerson }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2" data-testid="match-pair">
      <MatchPlayer person={a} />
      <span className="text-neutral-400">—</span>
      <MatchPlayer person={b} />
    </span>
  );
}
