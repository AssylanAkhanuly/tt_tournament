'use client';

/* «Лига» кабинета судьи ✳ (19.11.2026, LEAGUE.md «Расписание тура»): встречи
   Евразийской лиги, на которые его посадили судьёй стола, — из отправленных
   расписаний туров. Только смотреть. */

import { Spinner } from '@heroui/react';

import { fetchMyLeague, useLoad } from '@/entities/league';
import { ParticipantSchedule } from '@/widgets/league';

import { RefereeShell } from './RefereeShell';

export function RefereeLeagueView() {
  const my = useLoad(fetchMyLeague, 'my');
  return (
    <RefereeShell active="Лига" bleed>
      {my.error ? (
        <p className="p-6 text-[13px] text-red-600">{my.error}</p>
      ) : !my.data ? (
        <Spinner className="m-auto" />
      ) : (
        <ParticipantSchedule matches={my.data.judging} testId="referee-league" empty="Назначений на встречи Лиги нет" />
      )}
    </RefereeShell>
  );
}
