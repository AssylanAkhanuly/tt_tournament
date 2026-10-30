'use client';

/* Итог матча расписания — один на все виды ✳ (30.10.2026): в таблице группы, в
   «Матчах» и в «Дне». Счёт — партии со стороны игрока `side` (по умолчанию —
   первого): победа жирным зелёным; неявка — «+:−» у победителя, «−:+» у
   проигравшего; идёт — «идёт»; счёт предложен и ждёт подтверждения — «на
   подтв.»; не сыгран — `pending` (у таблицы группы это время матча). */

import type { ReactNode } from 'react';

import type { ScheduledMatch } from '@/entities/tournament';

export function MatchResult({
  match,
  side,
  pending = null,
}: {
  match: ScheduledMatch;
  /** Чьими глазами счёт (id игрока); нет — игрока 1. */
  side?: string;
  /** Что показать у несыгранного. */
  pending?: ReactNode;
}) {
  const me = side ?? match.player1.id;
  if (match.status === 'finished' && match.winner) {
    const won = match.winner === me;
    if (match.isWalkover)
      return (
        <span className={won ? 'font-semibold text-green-700' : 'text-red-600'} title="неявка" data-testid="match-result">
          {won ? '+:−' : '−:+'}
        </span>
      );
    const [a, b] = me === match.player1.id ? [match.score1, match.score2] : [match.score2, match.score1];
    return (
      <span className={'tabular-nums ' + (won ? 'font-semibold text-green-700' : 'text-neutral-600')} data-testid="match-result">
        {a}:{b}
      </span>
    );
  }
  if (match.status === 'in_progress')
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800" data-testid="match-result">
        идёт
      </span>
    );
  if (match.status === 'score_proposed')
    return (
      <span
        className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800"
        title="счёт ждёт подтверждения"
        data-testid="match-result"
      >
        на подтв.
      </span>
    );
  return <>{pending}</>;
}
