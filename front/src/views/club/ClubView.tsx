'use client';

/* Кабинет администратора клуба ✳ (19.11.2026, роль 13; LEAGUE.md «Заявка
   клуба»). Раздел «Команды» — команды клуба в Евразийской лиге по сезонам:
   лига, состав, состояние заявки. «Заявить команду» — в сезон, где идёт
   регистрация. Строка открывает состав: клуб набирает игроков сам, пока идёт
   регистрация и заявка не принята (решает сервер — `canEdit`); у отклонённой —
   причина и «Подать снова». Оболочка — `RoleShell` с ролью клуба. */

import { Button, Spinner } from '@heroui/react';
import { useState } from 'react';

import { fetchMyLeague, GENDER_LABEL, resubmitTeam, useLoad, type ClubTeam } from '@/entities/league';
import { ApplyTeamDialog } from '@/features/league-application';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { SquadDialog, TeamStatusChip } from '@/widgets/league';

import { ClubShell } from './ClubShell';

const COLUMNS: DataColumn<ClubTeam>[] = [
  { id: 'name', label: 'Команда', rowHeader: true, sortValue: (t) => t.name, render: (t) => <span className="font-medium">{t.name}</span> },
  { id: 'season', label: 'Сезон', sortValue: (t) => t.seasonName, render: (t) => t.seasonName },
  {
    id: 'league',
    label: 'Лига',
    sortValue: (t) => t.divisionName,
    render: (t) => t.divisionName + ' · ' + GENDER_LABEL[t.gender].toLowerCase(),
  },
  { id: 'members', label: 'Игроков', align: 'right', sortValue: (t) => t.membersCount, render: (t) => t.membersCount },
  { id: 'status', label: 'Заявка', sortValue: (t) => t.status, render: (t) => <TeamStatusChip status={t.status} /> },
];

/** Предел состава на сезон — тот же, что у федерации (`LeagueRules.squad_max`) ✳. */
const SQUAD_MAX = 8;

export function ClubView() {
  const my = useLoad(fetchMyLeague, 'my');
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const team = my.data?.teams.find((t) => t.id === open) ?? null;

  async function resubmit(t: ClubTeam) {
    setError(null);
    try {
      await resubmitTeam(t.id);
      my.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <ClubShell active="Команды">
      {my.error ? (
        <p className="p-6 text-[13px] text-red-600">{my.error}</p>
      ) : !my.data ? (
        <Spinner className="m-auto" />
      ) : (
        <>
          <DataTable
            ariaLabel="Команды клуба"
            testId="club-teams"
            rows={my.data.teams}
            columns={COLUMNS}
            getId={(t) => t.id}
            empty={my.data.seasons.length ? 'Команд нет — заявите команду' : 'Команд нет'}
            search={{ placeholder: 'Команда, сезон, лига', testId: 'club-team-search', text: (t) => [t.name, t.seasonName, t.divisionName].join(' ') }}
            actions={<ApplyTeamDialog my={my.data} onCreated={(id) => { my.reload(); setOpen(id); }} />}
            onRowAction={(t) => setOpen(t.id)}
            rowProps={(t) => ({ 'data-testid': 'club-team-row', 'data-name': t.name, 'data-status': t.status })}
          />
          <SquadDialog team={team} squadMax={SQUAD_MAX} onClose={() => setOpen(null)} onChanged={my.reload}>
            {team && (
              <div className="flex flex-col gap-2 rounded-xl bg-neutral-50 px-3 py-3 text-[13px]" data-testid="club-team-state">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-600">
                    {team.seasonName} · {team.divisionName}
                  </span>
                  <TeamStatusChip status={team.status} />
                </div>
                {team.decisionComment && (
                  <p className="text-neutral-700" data-testid="club-team-comment">
                    Комментарий федерации: {team.decisionComment}
                  </p>
                )}
                {!team.canEdit && team.status !== 'rejected' && (
                  <p className="text-neutral-500">
                    {team.status === 'accepted' ? 'Заявка принята — состав меняет федерация.' : 'Регистрация закрыта — состав меняет федерация.'}
                  </p>
                )}
                {team.canResubmit && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-fit self-end rounded-xl"
                    onPress={() => void resubmit(team)}
                    data-testid="club-team-resubmit"
                  >
                    Подать снова
                  </Button>
                )}
                {error && <p className="text-red-600">{error}</p>}
              </div>
            )}
          </SquadDialog>
        </>
      )}
    </ClubShell>
  );
}
