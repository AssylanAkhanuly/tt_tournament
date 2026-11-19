'use client';

/* «Расписание» кабинета клуба ✳ (19.11.2026, LEAGUE.md «Расписание тура»):
   встречи команд клуба из отправленных расписаний туров — время, тур, лига,
   стол, соперник, судья, счёт. Черновик видит только федерация. */

import { Spinner } from '@heroui/react';

import { fetchMyLeague, useLoad } from '@/entities/league';
import { ParticipantSchedule } from '@/widgets/league';

import { ClubShell } from './ClubShell';

export function ClubScheduleView() {
  const my = useLoad(fetchMyLeague, 'my');
  return (
    <ClubShell active="Расписание">
      {my.error ? (
        <p className="p-6 text-[13px] text-red-600">{my.error}</p>
      ) : !my.data ? (
        <Spinner className="m-auto" />
      ) : (
        <ParticipantSchedule matches={my.data.matches} testId="club-schedule" empty="Расписания пока нет" />
      )}
    </ClubShell>
  );
}
