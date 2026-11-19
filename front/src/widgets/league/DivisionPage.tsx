'use client';

/* Дивизион Евразийской лиги ✳ (19.11.2026, LEAGUE.md) — разделы:
   «Таблица» (места, очки, встречи и партии — считает сервер движком),
   «Команды» (заявка команды клуба, состав на сезон в окне команды —
   `SquadDialog`, общий с кабинетом клуба; колонка «Заявка» — решение федерации),
   «Туры» (новый тур — сервер сразу составляет встречи по круговой; строка
   ведёт на тур). Без обёрток и полей: таблицы от края до края.
   HeroUI + Tailwind. */

import { Button, Input, Label, Modal, TextField, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  createClub,
  createTour,
  fetchClubs,
  registerTeam,
  useLoad,
  type DivisionDetail,
  type LeagueTeam,
  type StandingRow,
  type TourSummary,
} from '@/entities/league';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

import { SquadDialog, TeamStatusChip } from './SquadDialog';

export type DivisionSection = 'table' | 'teams' | 'tours';
export const DIVISION_SECTIONS: { id: DivisionSection; label: string }[] = [
  { id: 'table', label: 'Таблица' },
  { id: 'teams', label: 'Команды' },
  { id: 'tours', label: 'Туры' },
];

const diff = (a: number, b: number) => a + ':' + b;

const TABLE: DataColumn<StandingRow>[] = [
  { id: 'place', label: '№', sortable: false, render: (r) => r.place },
  { id: 'team', label: 'Команда', rowHeader: true, sortable: false, render: (r) => <span className="font-medium">{r.team}</span> },
  { id: 'played', label: 'И', align: 'right', sortable: false, render: (r) => r.played },
  { id: 'won', label: 'В', align: 'right', sortable: false, render: (r) => r.won },
  { id: 'lost', label: 'П', align: 'right', sortable: false, render: (r) => r.lost },
  { id: 'rubbers', label: 'Встречи', align: 'right', sortable: false, render: (r) => diff(r.rubbersFor, r.rubbersAgainst) },
  { id: 'games', label: 'Партии', align: 'right', sortable: false, render: (r) => diff(r.gamesFor, r.gamesAgainst) },
  { id: 'points', label: 'Очки', align: 'right', sortable: false, render: (r) => <span className="font-semibold">{r.points}</span> },
];

function TeamDialog({ divisionId, onCreated }: { divisionId: string; onCreated: () => void }) {
  const state = useOverlayState();
  const clubs = useLoad(fetchClubs, divisionId);
  const [clubId, setClubId] = useState<string>('');
  const [newClub, setNewClub] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const NEW = 'new';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const club = clubId === NEW || !clubId ? await createClub(newClub.trim()) : { id: clubId };
      await registerTeam(divisionId, club.id, name.trim());
      state.close();
      setName('');
      setNewClub('');
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const options = [...(clubs.data ?? []).map((c) => ({ id: c.id, label: c.name })), { id: NEW, label: 'Новый клуб…' }];
  const picked = clubId || (clubs.data?.length ? '' : NEW);
  const ready = picked === NEW ? newClub.trim() !== '' : picked !== '';

  return (
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="team-create-open">
        <Plus size={16} /> Заявить команду
      </Button>
      <ModalSheet size="sm" testId="team-create">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Заявка команды</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <Picker label="Клуб" showLabel value={picked || null} options={options} onChange={setClubId} testId="team-club" />
            {picked === NEW && (
              <TextField isRequired value={newClub} onChange={setNewClub}>
                <Label>Название клуба</Label>
                <Input className="rounded-xl" data-testid="team-new-club" />
              </TextField>
            )}
            <TextField value={name} onChange={setName}>
              <Label>Название команды</Label>
              <Input placeholder="Как у клуба" className="rounded-xl" data-testid="team-name" />
            </TextField>
            {error && <p className="text-[13px] text-red-600" data-testid="team-error">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!ready || busy}>
              Заявить
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}

function TourDialog({ divisionId, next, onCreated }: { divisionId: string; next: number; onCreated: () => void }) {
  const state = useOverlayState();
  const [number, setNumber] = useState(String(next));
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createTour(divisionId, { number: Number(number), city: city.trim(), startsOn: date || null });
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
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="tour-create-open">
        <Plus size={16} /> Новый тур
      </Button>
      <ModalSheet size="sm" testId="tour-create">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Новый тур</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <TextField isRequired value={number} onChange={(v) => setNumber(v.replace(/\D/g, ''))}>
              <Label>Номер тура</Label>
              <Input inputMode="numeric" className="rounded-xl" data-testid="tour-number" />
            </TextField>
            <TextField value={city} onChange={setCity}>
              <Label>Город</Label>
              <Input className="rounded-xl" data-testid="tour-city" />
            </TextField>
            <TextField value={date} onChange={setDate}>
              <Label>Дата</Label>
              <Input type="date" className="rounded-xl" data-testid="tour-date" />
            </TextField>
            {error && <p className="text-[13px] text-red-600" data-testid="tour-error">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!number || busy}>
              Завести
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}

const TEAMS: DataColumn<LeagueTeam>[] = [
  { id: 'name', label: 'Команда', rowHeader: true, sortValue: (t) => t.name, render: (t) => <span className="font-medium">{t.name}</span> },
  { id: 'club', label: 'Клуб', sortValue: (t) => t.clubName, render: (t) => t.clubName },
  { id: 'members', label: 'Состав', align: 'right', sortValue: (t) => t.membersCount, render: (t) => t.membersCount },
  // Заявка клуба ✳ (19.11.2026): в туры и таблицу идут только принятые.
  { id: 'status', label: 'Заявка', sortValue: (t) => t.status, render: (t) => <TeamStatusChip status={t.status} /> },
];

const TOURS: DataColumn<TourSummary>[] = [
  { id: 'number', label: 'Тур', rowHeader: true, sortValue: (t) => t.number, render: (t) => <span className="font-medium">Тур {t.number}</span> },
  { id: 'city', label: 'Город', sortValue: (t) => t.city, render: (t) => t.city || '—' },
  { id: 'date', label: 'Дата', sortValue: (t) => t.startsOn, render: (t) => (t.startsOn ? t.startsOn.split('-').reverse().join('.') : '—') },
  { id: 'matches', label: 'Сыграно', align: 'right', sortable: false, render: (t) => t.finished + ' из ' + t.matches },
];

export function DivisionPage({
  division,
  section,
  canEdit,
  squadMax,
  onOpenTour,
  onChanged,
}: {
  division: DivisionDetail;
  section: DivisionSection;
  canEdit: boolean;
  squadMax: number;
  onOpenTour: (tourId: string) => void;
  onChanged: () => void;
}) {
  const [squad, setSquad] = useState<LeagueTeam | null>(null);

  if (section === 'teams') {
    return (
      <>
        <DataTable
          ariaLabel="Команды"
          testId="league-teams"
          rows={division.teams}
          columns={TEAMS}
          getId={(t) => t.id}
          empty="Команд нет"
          actions={canEdit ? <TeamDialog divisionId={division.id} onCreated={onChanged} /> : undefined}
          onRowAction={(t) => setSquad(t)}
          rowProps={(t) => ({ 'data-testid': 'team-row', 'data-name': t.name })}
        />
        <SquadDialog team={squad} squadMax={squadMax} onClose={() => setSquad(null)} onChanged={onChanged} />
      </>
    );
  }
  if (section === 'tours') {
    return (
      <DataTable
        ariaLabel="Туры"
        testId="league-tours"
        rows={division.tours}
        columns={TOURS}
        getId={(t) => t.id}
        empty="Туров нет"
        actions={
          canEdit ? <TourDialog divisionId={division.id} next={division.tours.length + 1} onCreated={onChanged} /> : undefined
        }
        onRowAction={(t) => onOpenTour(t.id)}
        rowProps={(t) => ({ 'data-testid': 'tour-row' })}
      />
    );
  }
  return (
    <DataTable
      ariaLabel="Таблица дивизиона"
      testId="league-table"
      rows={division.table}
      columns={TABLE}
      getId={(r) => r.teamId}
      empty="Команд нет"
      rowProps={(r) => ({ 'data-testid': 'standing-row', 'data-team': r.team })}
    />
  );
}
