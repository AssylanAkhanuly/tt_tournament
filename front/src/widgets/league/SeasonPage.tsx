'use client';

/* Сезон Евразийской лиги ✳ (19.11.2026, LEAGUE.md «Сезон») — разделы:
   «Лиги» (лиги сезона таблицей, «Новая лига»; строка ведёт в лигу) и
   «Команды» (все команды сезона с клубом, лигой, составом и состоянием
   заявки; строка открывает решение по заявке клуба — `TeamDecision`; «Настройки» — регистрация команд и «Сезон завершён», как
   приём заявок у спортсменов турнира, решение владельца продукта). Без обёрток
   и полей: таблицы от края до края. Что можно — решает сервер (завершённый сезон отбивает
   правку); экран прячет «Новую лигу» у завершённого, чтобы не звать на отказ.
   HeroUI + Tailwind. */

import { Button, Input, Label, Modal, TextField, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  createDivision,
  GENDER_LABEL,
  type DivisionListItem,
  type LeagueGender,
  type SeasonDetail,
  type SeasonTeam,
} from '@/entities/league';
import { SeasonSettings, TeamDecision } from '@/features/league-season';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

import { TeamStatusChip } from './SquadDialog';

export type SeasonSection = 'leagues' | 'teams';
export const SEASON_SECTIONS: { id: SeasonSection; label: string }[] = [
  { id: 'leagues', label: 'Лиги' },
  { id: 'teams', label: 'Команды' },
];

const COLUMNS: DataColumn<DivisionListItem>[] = [
  { id: 'name', label: 'Лига', rowHeader: true, sortValue: (d) => d.level, render: (d) => <span className="font-medium">{d.name}</span> },
  { id: 'gender', label: 'Розыгрыш', sortValue: (d) => d.gender, render: (d) => GENDER_LABEL[d.gender] },
  { id: 'level', label: 'Уровень', align: 'right', sortValue: (d) => d.level, render: (d) => d.level },
  { id: 'teams', label: 'Команд', align: 'right', sortValue: (d) => d.teamsCount, render: (d) => d.teamsCount },
  { id: 'tours', label: 'Туров', align: 'right', sortValue: (d) => d.toursCount, render: (d) => d.toursCount },
];

function NewLeagueDialog({ seasonId, onCreated }: { seasonId: string; onCreated: () => void }) {
  const state = useOverlayState();
  const [name, setName] = useState('Суперлига');
  const [gender, setGender] = useState<LeagueGender>('m');
  const [level, setLevel] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createDivision({ seasonId, gender, name: name.trim(), level: Number(level) || 1 });
      state.close();
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="league-create-open">
        <Plus size={16} /> Новая лига
      </Button>
      <ModalSheet size="sm" testId="league-create">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Новая лига</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <TextField isRequired value={name} onChange={setName}>
              <Label>Название</Label>
              <Input className="rounded-xl" data-testid="league-name" />
            </TextField>
            <Picker
              label="Розыгрыш"
              showLabel
              value={gender}
              options={(['m', 'f'] as LeagueGender[]).map((g) => ({ id: g, label: GENDER_LABEL[g] }))}
              onChange={(k) => setGender(k as LeagueGender)}
              testId="league-gender"
            />
            <TextField value={level} onChange={(v) => setLevel(v.replace(/\D/g, ''))}>
              <Label>Уровень (1 — Суперлига)</Label>
              <Input inputMode="numeric" className="rounded-xl" data-testid="league-level" />
            </TextField>
            {error && <p className="text-[13px] text-red-600" data-testid="league-error">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!name.trim() || busy}>
              Завести
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}

const TEAM_COLUMNS: DataColumn<SeasonTeam>[] = [
  { id: 'name', label: 'Команда', rowHeader: true, sortValue: (t) => t.name, render: (t) => <span className="font-medium">{t.name}</span> },
  { id: 'club', label: 'Клуб', sortValue: (t) => t.clubName, render: (t) => t.clubName },
  { id: 'league', label: 'Лига', sortValue: (t) => t.divisionName, render: (t) => t.divisionName },
  { id: 'gender', label: 'Розыгрыш', sortValue: (t) => t.gender, render: (t) => GENDER_LABEL[t.gender] },
  { id: 'members', label: 'Игроков', align: 'right', descFirst: true, sortValue: (t) => t.members, render: (t) => t.members },
  { id: 'status', label: 'Заявка', sortValue: (t) => t.status, render: (t) => <TeamStatusChip status={t.status} /> },
];

/** «Команды» сезона: строка открывает решение по заявке клуба. */
function SeasonTeams({
  season,
  onOpenDivision,
  onChanged,
}: {
  season: SeasonDetail;
  onOpenDivision: (divisionId: string, divisionSection?: 'teams') => void;
  onChanged: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = season.teams.find((t) => t.id === openId) ?? null;
  return (
    <>
      <DataTable
        ariaLabel="Команды сезона"
        testId="season-teams"
        rows={season.teams}
        columns={TEAM_COLUMNS}
        getId={(t) => t.id}
        empty="Команд нет"
        search={{
          placeholder: 'Команда, клуб, лига',
          testId: 'season-team-search',
          text: (t) => [t.name, t.clubName, t.divisionName].join(' '),
        }}
        defaultSort={{ column: 'league', direction: 'ascending' }}
        actions={<SeasonSettings season={season} onChanged={onChanged} />}
        onRowAction={(t) => setOpenId(t.id)}
        rowProps={(t) => ({ 'data-testid': 'season-team-row', 'data-name': t.name, 'data-status': t.status })}
      />
      <TeamDecision
        team={open}
        onClose={() => setOpenId(null)}
        onDecided={onChanged}
        onOpenLeague={(divisionId) => onOpenDivision(divisionId, 'teams')}
      />
    </>
  );
}

export function SeasonPage({
  season,
  section,
  onOpenDivision,
  onChanged,
}: {
  season: SeasonDetail;
  section: SeasonSection;
  /** Лига сезона; у команды — сразу её раздел «Команды». */
  onOpenDivision: (divisionId: string, divisionSection?: 'teams') => void;
  onChanged: () => void;
}) {
  if (section === 'teams') {
    // Все команды сезона; «Настройки» — регистрация и завершение сезона, как
    // приём заявок у спортсменов турнира; строка — решение по заявке клуба.
    return <SeasonTeams season={season} onOpenDivision={onOpenDivision} onChanged={onChanged} />;
  }
  return (
    <DataTable
      ariaLabel="Лиги сезона"
      testId="season-leagues"
      rows={season.divisions}
      columns={COLUMNS}
      getId={(d) => d.id}
      empty="Лиг нет"
      defaultSort={{ column: 'name', direction: 'ascending' }}
      actions={season.closed ? undefined : <NewLeagueDialog seasonId={season.id} onCreated={onChanged} />}
      onRowAction={(d) => onOpenDivision(d.id)}
      rowProps={(d) => ({ 'data-testid': 'league-row', 'data-name': d.name })}
    />
  );
}
