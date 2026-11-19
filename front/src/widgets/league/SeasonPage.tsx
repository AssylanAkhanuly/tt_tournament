'use client';

/* Сезон Евразийской лиги ✳ (19.11.2026, LEAGUE.md «Сезон») — разделы:
   «Лиги» (лиги сезона таблицей, «Новая лига»; строка ведёт в лигу) и
   «Регистрация» (окно регистрации команд и «Сезон завершён» черновиком).
   Без обёрток и полей: таблица от края до края, настройки — строками «подпись
   слева, поле справа». Что можно — решает сервер (завершённый сезон отбивает
   правку); экран прячет «Новую лигу» у завершённого, чтобы не звать на отказ.
   HeroUI + Tailwind. */

import { Button, Input, Label, Modal, Switch, TextField, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  createDivision,
  GENDER_LABEL,
  updateSeason,
  type DivisionListItem,
  type LeagueGender,
  type SeasonDetail,
} from '@/entities/league';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { DateInput } from '@/shared/ui/DateInput';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

export type SeasonSection = 'leagues' | 'registration';
export const SEASON_SECTIONS: { id: SeasonSection; label: string }[] = [
  { id: 'leagues', label: 'Лиги' },
  { id: 'registration', label: 'Регистрация' },
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

function SettingSwitch({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <Switch isSelected={value} onChange={onChange} className="w-full" data-testid={testId}>
      <Switch.Content className="w-full justify-between">
        <Label className="text-[14px] font-medium">{label}</Label>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

type Draft = { open: boolean; until: string | null; closed: boolean };
const draftOf = (s: SeasonDetail): Draft => ({ open: s.registration.open, until: s.registration.until, closed: s.closed });

function RegistrationSection({ season, onChanged }: { season: SeasonDetail; onChanged: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(season));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saved = draftOf(season);
  const dirty = draft.open !== saved.open || draft.until !== saved.until || draft.closed !== saved.closed;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await updateSeason(season.id, {
        registrationOpen: draft.open,
        registrationUntil: draft.open ? draft.until : null,
        closed: draft.closed,
      });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Строки от края до края, поле — внутри строки; кнопки — внизу.
  const row = 'border-b border-neutral-200 px-6 py-4';
  return (
    <div className="flex h-full flex-col" data-testid="season-registration">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={row}>
          <SettingSwitch
            label="Регистрация команд"
            value={draft.open}
            onChange={(open) => setDraft((d) => ({ ...d, open }))}
            testId="season-registration-switch"
          />
        </div>
        {/* Срок — только у открытой регистрации: у закрытой ему нечего ограничивать. */}
        {draft.open && (
          <div className={row}>
            <DateInput
              inline
              label="Срок, до"
              value={draft.until}
              onChange={(until) => setDraft((d) => ({ ...d, until }))}
              testId="season-registration-until"
            />
          </div>
        )}
        <div className={row}>
          <SettingSwitch
            label="Сезон завершён"
            value={draft.closed}
            onChange={(closed) => setDraft((d) => ({ ...d, closed }))}
            testId="season-closed-switch"
          />
        </div>
        {error && (
          <p className="px-6 py-3 text-[13px] text-red-600" data-testid="season-error">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-6 py-3">
        <Button variant="tertiary" className="rounded-xl" isDisabled={!dirty || busy} onPress={() => setDraft(saved)}>
          Отменить
        </Button>
        <Button variant="primary" className="rounded-xl" isDisabled={!dirty || busy} onPress={save} data-testid="season-save">
          Сохранить
        </Button>
      </div>
    </div>
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
  onOpenDivision: (divisionId: string) => void;
  onChanged: () => void;
}) {
  if (section === 'registration') {
    // Ключ — сохранённое состояние: после «Сохранить» черновик берётся заново.
    return <RegistrationSection key={JSON.stringify(draftOf(season))} season={season} onChanged={onChanged} />;
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
