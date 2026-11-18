'use client';

/* Турнир в кабинете старшего тренера региона ✳ (19.11.2026, роль 12 —
   «Заявка на старт»). Разделы турнира в сайдбаре, каждый своей страницей
   (решение владельца продукта: заявленные — отдельным разделом):
   - «Сведения» (`/coach/tournaments/<id>/info`) — сведения турнира с условиями
     допуска;
   - «Заявлены» (`…/entries`) — спортсмены, которых заявил он сам (всего
     состава тренер не видит — сервер его ему и не отдаёт), в строке —
     «Отозвать», пока приём открыт; «Подать заявку» — в полосе над таблицей,
     как «Добавить» в разделах турнира у администратора.
   Раздела «Заявлены» нет, если турнир не принимает заявку от старшего тренера
   региона (`canApplyAs` решает сервер): кто подаёт, видно в сведениях.
   Без обёрток и полей — от края до края (`bleed`). */

import { Spinner } from '@heroui/react';
import { FileText, Info } from 'lucide-react';

import { num2 } from '@/entities/rating/lib/format';
import { ROLE_REGIONAL_HEAD_COACH } from '@/entities/session';
import {
  tournamentHref,
  useMyApplications,
  useTournament,
  type ApplicationAthlete,
  type TournamentSummary,
} from '@/entities/tournament';
import { ApplicationDialog, WithdrawButton } from '@/features/tournament-application';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import type { RoleNavItem } from '@/views/workspace';
import { TournamentOverview } from '@/widgets/tournament-board';

import { CoachShell } from './CoachShell';

export type CoachSection = 'info' | 'entries';

const SECTION_LABEL: Record<CoachSection, string> = { info: 'Сведения', entries: 'Заявлены' };

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

const applies = (t: TournamentSummary | null) => !!t?.canApplyAs.includes(ROLE_REGIONAL_HEAD_COACH);

/** Разделы турнира в сайдбаре: «Заявлены» — только где тренер подаёт заявку. */
function sections(id: string, t: TournamentSummary | null): RoleNavItem[] {
  const nav: RoleNavItem[] = [
    { label: SECTION_LABEL.info, href: tournamentHref('coach', id, 'info'), icon: <Info size={16} /> },
  ];
  if (applies(t))
    nav.push({ label: SECTION_LABEL.entries, href: tournamentHref('coach', id, 'entries'), icon: <FileText size={16} /> });
  return nav;
}

function Entries({ t, onChanged }: { t: TournamentSummary; onChanged: () => void }) {
  const mine = useMyApplications(t.id);
  const reload = () => {
    mine.reload();
    onChanged();
  };
  return (
    <section className="h-full" data-testid="coach-entries">
      <DataTable
        ariaLabel="Заявленные спортсмены"
        testId="coach-entries-table"
        rows={mine.data ?? []}
        columns={entryColumns(t, reload)}
        getId={(a) => a.id}
        loading={!mine.data && !mine.error}
        error={mine.error}
        empty="Пока никого"
        rowProps={(a) => ({ 'data-testid': 'coach-entry', 'data-name': a.name })}
        actions={
          <ApplicationDialog
            tournamentId={t.id}
            as={ROLE_REGIONAL_HEAD_COACH}
            isDisabled={!t.playerRecruitment.active}
            onSubmitted={reload}
          />
        }
      />
    </section>
  );
}

export function CoachTournamentView({ id, section }: { id: string; section: CoachSection }) {
  const tournament = useTournament(id);
  const t = tournament.data;

  return (
    <CoachShell
      active={SECTION_LABEL[section]}
      bleed
      nav={sections(id, t)}
    >
      {tournament.error ? (
        <p className="p-6 text-[13px] text-red-600" data-testid="tournament-error">
          {tournament.error}
        </p>
      ) : !t ? (
        <Spinner className="m-auto" />
      ) : section === 'entries' && applies(t) ? (
        <Entries t={t} onChanged={tournament.reload} />
      ) : (
        // С `bleed` рабочая область не прокручивается сама — прокрутка здесь.
        <div className="h-full overflow-y-auto">
          <TournamentOverview t={t} />
        </div>
      )}
    </CoachShell>
  );
}
