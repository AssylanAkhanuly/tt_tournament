'use client';

/* Турнир в кабинете старшего тренера региона ✳ (19.11.2026, роль 12 —
   «Заявка на старт»): сведения турнира и спортсмены, которых заявил он сам
   («Заявлены»); всего состава тренер не видит — сервер его ему и не отдаёт.
   Заявка — полоса внизу рабочей области, как у судьи: срок приёма и
   «Подать заявку», если турнир принимает заявку от старшего тренера региона
   (`canApplyAs` решает сервер). На турнир, куда спортсмен подаёт сам, кнопки
   нет — кто подаёт, видно в сведениях. В строке «Заявлены» — «Отозвать»
   ✳ (19.11.2026), пока приём открыт. */

import { Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { num2 } from '@/entities/rating/lib/format';
import { ROLE_REGIONAL_HEAD_COACH } from '@/entities/session';
import {
  recruitmentLabel,
  useMyApplications,
  useTournament,
  type ApplicationAthlete,
  type TournamentSummary,
} from '@/entities/tournament';
import { ApplicationDialog, WithdrawButton } from '@/features/tournament-application';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { TournamentContext, TournamentOverview } from '@/widgets/tournament-board';

import { CoachShell } from './CoachShell';

const COLUMNS: DataColumn<ApplicationAthlete>[] = [
  { id: 'name', label: 'Спортсмен', rowHeader: true, sortValue: (a) => a.name, render: (a) => a.name },
  { id: 'year', label: 'Год рождения', sortValue: (a) => a.birthYear, render: (a) => a.birthYear ?? '—' },
  { id: 'region', label: 'Регион', sortValue: (a) => a.region, render: (a) => a.region || '—' },
  {
    id: 'rating',
    label: 'Рейтинг',
    align: 'right',
    descFirst: true,
    sortValue: (a) => a.rating,
    render: (a) => (a.rating === null ? '—' : num2(a.rating)),
  },
];

/** Колонки «Заявлены» с «Отозвать» в конце строки — пока приём открыт. */
const entryColumns = (t: TournamentSummary, onWithdrawn: () => void): DataColumn<ApplicationAthlete>[] =>
  t.playerRecruitment.active && t.status === 'open'
    ? [
        ...COLUMNS,
        {
          id: 'withdraw',
          label: '',
          sortable: false,
          align: 'right',
          render: (a) => <WithdrawButton tournamentId={t.id} athlete={a} onWithdrawn={onWithdrawn} />,
        },
      ]
    : COLUMNS;

function ApplicationBar({ t, onSubmitted }: { t: TournamentSummary; onSubmitted: () => void }) {
  if (!t.canApplyAs.includes(ROLE_REGIONAL_HEAD_COACH)) return null;
  const r = t.playerRecruitment;
  // Срок или «закрыт»; приём без срока виден по самой кнопке.
  const term = r.active && !r.until ? null : recruitmentLabel(r);
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-3" data-testid="coach-application-bar">
      {term && (
        <span className="mr-auto text-[14px] text-neutral-600" data-testid="recruitment-state">
          {term}
        </span>
      )}
      <ApplicationDialog
        tournamentId={t.id}
        as={ROLE_REGIONAL_HEAD_COACH}
        isDisabled={!r.active}
        onSubmitted={onSubmitted}
      />
    </div>
  );
}

export function CoachTournamentView({ id }: { id: string }) {
  const router = useRouter();
  const tournament = useTournament(id);
  const mine = useMyApplications(id);
  const t = tournament.data;

  return (
    <CoachShell
      active=""
      nav={[]}
      context={<TournamentContext t={t} onBack={() => router.push('/coach')} />}
      actions={
        t && (
          <ApplicationBar
            t={t}
            onSubmitted={() => {
              mine.reload();
              tournament.reload();
            }}
          />
        )
      }
    >
      {tournament.error ? (
        <p className="text-[13px] text-red-600" data-testid="tournament-error">
          {tournament.error}
        </p>
      ) : !t ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="flex w-full max-w-4xl flex-col gap-6">
          <TournamentOverview t={t} />
          {t.canApplyAs.includes(ROLE_REGIONAL_HEAD_COACH) && (
            <section className="flex flex-col gap-2" data-testid="coach-entries">
              <h2 className="m-0 text-[15px] font-semibold">Заявлены</h2>
              <DataTable
                ariaLabel="Заявленные спортсмены"
                testId="coach-entries-table"
                rows={mine.data ?? []}
                columns={entryColumns(t, () => {
                  mine.reload();
                  tournament.reload();
                })}
                getId={(a) => a.id}
                loading={!mine.data && !mine.error}
                error={mine.error}
                empty="Пока никого"
                rowProps={(a) => ({ 'data-testid': 'coach-entry', 'data-name': a.name })}
              />
            </section>
          )}
        </div>
      )}
    </CoachShell>
  );
}
