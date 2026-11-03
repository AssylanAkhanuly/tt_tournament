'use client';

/* Страница турнира в кабинете судьи ✳ (29.10.2026, решение владельца
   продукта): обзор турнира, заявка на судейство — полоса внизу рабочей области
   с окном подачи ✳ (01.11.2026) — составов (спортсменов и других судей) судья
   не видит, сервер их ему и не отдаёт. Разделов в сайдбаре нет: над пустым
   меню — «← Все турниры», название и дата. */

import { Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { useTournament } from '@/entities/tournament';
import { ApplicationPanel } from '@/features/referee-application';
import { TournamentContext } from '@/widgets/tournament-board';

import { RefereeShell } from './RefereeShell';
import { TournamentOverview } from './TournamentOverview';

export function RefereeTournamentView({ id }: { id: string }) {
  const router = useRouter();
  const tournament = useTournament(id);
  const t = tournament.data;

  return (
    <RefereeShell
      active=""
      nav={[]}
      context={<TournamentContext t={t} onBack={() => router.push('/referee')} />}
      actions={t && <ApplicationPanel tournament={t} />}
    >
      {tournament.error ? (
        <p className="text-[13px] text-red-600" data-testid="tournament-error">
          {tournament.error}
        </p>
      ) : !t ? (
        <Spinner className="m-auto" />
      ) : (
        <TournamentOverview t={t} />
      )}
    </RefereeShell>
  );
}
