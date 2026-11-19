'use client';

/* «Лига» — дивизионы сезона ✳ (19.11.2026, LEAGUE.md). Таблица дивизионов
   (мужчины и женщины, по уровню), «Новый дивизион», выбор сезона. Строка
   открывает дивизион — адрес строит экран (`divisionHref`). HeroUI + Tailwind. */

import { Button, Input, Label, Modal, TextField, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  createDivision,
  fetchDivisions,
  GENDER_LABEL,
  useLoad,
  type Division,
  type LeagueGender,
} from '@/entities/league';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

const COLUMNS: DataColumn<Division>[] = [
  { id: 'name', label: 'Дивизион', rowHeader: true, sortValue: (d) => d.level, render: (d) => <span className="font-medium">{d.name}</span> },
  { id: 'gender', label: 'Розыгрыш', sortValue: (d) => d.gender, render: (d) => GENDER_LABEL[d.gender] },
  { id: 'level', label: 'Уровень', align: 'right', sortValue: (d) => d.level, render: (d) => d.level },
  { id: 'teams', label: 'Команд', align: 'right', sortValue: (d) => d.teamsCount ?? 0, render: (d) => d.teamsCount ?? 0 },
];

function NewDivisionDialog({ season, onCreated }: { season: number; onCreated: () => void }) {
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
      await createDivision({ season, gender, name: name.trim(), level: Number(level) || 1 });
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
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="division-create-open">
        <Plus size={16} /> Новый дивизион
      </Button>
      <ModalSheet size="sm" testId="division-create">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Новый дивизион · {season}</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <TextField isRequired value={name} onChange={setName}>
              <Label>Название</Label>
              <Input className="rounded-xl" data-testid="division-name" />
            </TextField>
            <Picker
              label="Розыгрыш"
              showLabel
              value={gender}
              options={(['m', 'f'] as LeagueGender[]).map((g) => ({ id: g, label: GENDER_LABEL[g] }))}
              onChange={(k) => setGender(k as LeagueGender)}
              testId="division-gender"
            />
            <TextField value={level} onChange={(v) => setLevel(v.replace(/\D/g, ''))}>
              <Label>Уровень (1 — Суперлига)</Label>
              <Input inputMode="numeric" className="rounded-xl" data-testid="division-level" />
            </TextField>
            {error && <p className="text-[13px] text-red-600" data-testid="division-error">{error}</p>}
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

export function LeagueHome({ onOpen, canEdit }: { onOpen: (divisionId: string) => void; canEdit: boolean }) {
  const thisYear = new Date().getFullYear();
  const [season, setSeason] = useState(thisYear);
  const divisions = useLoad(() => fetchDivisions(season), String(season));
  const seasons = [thisYear + 1, thisYear, thisYear - 1];

  return (
    <DataTable
      ariaLabel="Дивизионы"
      testId="league-divisions"
      rows={divisions.data ?? []}
      columns={COLUMNS}
      getId={(d) => d.id}
      loading={!divisions.data && !divisions.error}
      error={divisions.error}
      empty="Дивизионов нет"
      defaultSort={{ column: 'name', direction: 'ascending' }}
      filters={
        <Picker
          label="Сезон"
          className="w-32 min-w-0"
          value={String(season)}
          options={seasons.map((s) => ({ id: String(s), label: 'Сезон ' + s }))}
          onChange={(k) => setSeason(Number(k))}
          testId="league-season"
        />
      }
      actions={canEdit ? <NewDivisionDialog season={season} onCreated={divisions.reload} /> : undefined}
      onRowAction={(d) => onOpen(d.id)}
      rowProps={(d) => ({ 'data-testid': 'division-row', 'data-name': d.name })}
    />
  );
}
