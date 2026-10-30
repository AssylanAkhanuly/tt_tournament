'use client';

/* Страница турнира в кабинете судьи ✳ (29.10.2026, решение владельца
   продукта): сведения о турнире и заявка на судейство — составов (спортсменов
   и других судей) судья не видит, сервер их ему и не отдаёт. Разделов в
   сайдбаре нет: над пустым меню — «← Все турниры», название и дата. */

import { Card, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { TournamentFacts, useTournament } from '@/entities/tournament';
import { ApplicationPanel } from '@/features/referee-application';
import { TournamentContext } from '@/widgets/tournament-board';

import { RefereeShell } from './RefereeShell';

export function RefereeTournamentView({ id }: { id: string }) {
  const router = useRouter();
  const tournament = useTournament(id);
  const t = tournament.data;

  return (
    <RefereeShell
      active=""
      nav={[]}
      context={<TournamentContext t={t} onBack={() => router.push('/referee')} />}
    >
      {tournament.error ? (
        <p className="text-[13px] text-red-600" data-testid="tournament-error">
          {tournament.error}
        </p>
      ) : !t ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
          <Card className="rounded-xl" data-testid="tournament-about">
            <Card.Header>
              <Card.Title className="text-[15px] font-semibold">Сведения</Card.Title>
            </Card.Header>
            <Card.Content>
              <TournamentFacts t={t} withDate />
            </Card.Content>
          </Card>
          <ApplicationPanel tournamentId={id} recruitment={t.refereeRecruitment} />
        </div>
      )}
    </RefereeShell>
  );
}
