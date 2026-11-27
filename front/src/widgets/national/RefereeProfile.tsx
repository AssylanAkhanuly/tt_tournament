'use client';

/* Профиль судьи ✳ (24.11.2026, решение владельца продукта: «профиль судьи —
   как у спортсмена»). Тот же вид, что `PlayerProfile`: серая страница, белые
   карточки — шапка с фигурой и аватаром (заглушки, снимков у судей нет),
   четыре показателя и «История судейства» таблицей: турнир, город, должность,
   отсуженные матчи, состояние; строка ведёт на турнир.

   Показатели — факты из системы: турниров, главным судьёй, матчей судьёй
   стола (подтверждённых), последний турнир. Рейтинга судей (flows Э0.11) ещё
   нет — когда появится, встанет пятой карточкой и графиком. */

import { Chip, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { STATUS_LABEL, useRefereeProfile, type RefereeHistoryRow, type RefereeProfile as Profile } from '@/entities/tournament';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

import { ProfileHero } from './profile/Hero';
import { CARD } from './profile/ui';

const day = (iso: string | null) => (iso ? new Date(iso.length === 10 ? iso + 'T12:00' : iso).toLocaleDateString('ru-RU') : '—');

function Kpi({ label, value, note, testId }: { label: string; value: ReactNode; note?: ReactNode; testId: string }) {
  return (
    <div className={CARD + ' gap-1 p-5'} data-testid={testId}>
      <span className="text-[13px] font-medium text-neutral-500">{label}</span>
      <span className="text-[28px] leading-tight font-bold tabular-nums">{value}</span>
      {note && <span className="text-[12.5px] text-neutral-500">{note}</span>}
    </div>
  );
}

const COLUMNS: DataColumn<RefereeHistoryRow>[] = [
  { id: 'date', label: 'Дата', className: 'w-28', sortValue: (h) => h.tournament.startsAt, render: (h) => <span className="tabular-nums text-neutral-500">{day(h.tournament.startsAt)}</span> },
  { id: 'name', label: 'Турнир', rowHeader: true, sortValue: (h) => h.tournament.name, render: (h) => h.tournament.name },
  { id: 'city', label: 'Город', render: (h) => <span className="text-neutral-600">{h.tournament.city || '—'}</span> },
  { id: 'position', label: 'Должность', sortValue: (h) => h.positionLabel, render: (h) => h.positionLabel },
  { id: 'matches', label: 'Матчей', align: 'right', sortValue: (h) => h.matches, render: (h) => <span className="tabular-nums">{h.matches || '—'}</span> },
  {
    id: 'status',
    label: 'Состояние',
    render: (h) => (
      <Chip size="sm" variant="soft" color={h.tournament.status === 'in_progress' ? 'success' : 'default'}>
        {STATUS_LABEL[h.tournament.status]}
      </Chip>
    ),
  },
];

/** История судейства — отдельной карточкой: её же кладут под профиль спортсмена, если он ещё и судья. */
export function RefereeHistory({ profile, tournamentHref }: { profile: Profile; tournamentHref: (id: string) => string }) {
  const router = useRouter();
  return (
    <section className={CARD + ' overflow-hidden'} data-testid="referee-history">
      <h2 className="m-0 px-5 pt-5 pb-3 text-[15px] font-semibold">История судейства</h2>
      <DataTable
        ariaLabel="История судейства"
        rows={profile.history}
        columns={COLUMNS}
        getId={(h) => h.tournament.id}
        defaultSort={{ column: 'date', direction: 'descending' }}
        empty="В турнирах ещё не судил"
        onRowAction={(h) => router.push(tournamentHref(h.tournament.id))}
        rowProps={(h) => ({ 'data-testid': 'referee-history-row', 'data-position': h.position })}
      />
    </section>
  );
}

export function RefereeProfile({ userId, tournamentHref, children, fallback }: {
  userId: string;
  tournamentHref: (id: string) => string;
  children?: ReactNode;
  fallback?: ReactNode;
}) {
  const loaded = useRefereeProfile(userId);
  if (loaded.loading && !loaded.data) return <Spinner className="m-auto" />;
  const p = loaded.data;
  if (!p || !p.isReferee) return <>{fallback ?? null}</>;
  const top = p.history.find((h) => h.position === 'chief_referee') ? 'Главный судья' : 'Судья';
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-neutral-100" data-testid="referee-profile">
      <div className="flex flex-col gap-4 p-4">
        <ProfileHero
          who={{ id: p.user.id, name: p.user.name, region: '', birthYear: null, birthDate: null, sex: '', avatar: p.user.avatar, figure: null }}
          tag={top}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4" data-testid="referee-kpis">
          <Kpi label="Турниров" value={p.tournaments} testId="kpi-tournaments" />
          <Kpi label="Главным судьёй" value={p.asChief} testId="kpi-chief" />
          <Kpi label="Матчей судьёй стола" value={p.matches} note="подтверждённых" testId="kpi-matches" />
          <Kpi label="Последний турнир" value={day(p.last)} testId="kpi-last" />
        </div>
        <RefereeHistory profile={p} tournamentHref={tournamentHref} />
        {children}
      </div>
    </div>
  );
}

