'use client';

/* Кабинет врача соревнований — `/medic` ✳ (22.11.2026, ROLES.md роль 18;
   flows/18 Э18.2–Э18.3; главная схема `flow-tournaments`: «Врач допустил по
   справке?»). «Турниры» — его турниры календарём и таблицей; у турнира —
   «Допуск участников»: таблица участников с решением, «Допустить» и «Не
   допустить» (с причиной — без неё сервер не примет). С назначенным врачом в
   жеребьёвку и расписание идут только допущенные; решать можно, пока
   расписание не отправлено (правила — `tournaments/medical.py`). */

import { Button, Chip, Label, Modal, Spinner, TextArea, TextField, Tooltip } from '@heroui/react';
import { CalendarDays, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { ROLE_COMPETITION_DOCTOR, tournamentIdsFor, useSession } from '@/entities/session';
import { decideMedical, fetchMedical, MEDICAL_LABEL, useTournament, type MedicalAdmission, type MedicalRow, type MedicalStatus } from '@/entities/tournament';
import { useLoad } from '@/shared/lib/useLoad';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import { boardViews, TournamentBoard, useBoardView } from '@/widgets/tournament-board';

const NAV: RoleNavItem[] = [{ label: 'Турниры', href: '/medic', icon: <CalendarDays size={16} /> }];

function MedicShell({ active, sub, back, title, children }: {
  active: string;
  sub?: { label: string; href: string; active?: boolean }[];
  back?: { label: string; onPress: () => void };
  title?: string;
  children: ReactNode;
}) {
  return (
    <RoleShell kind={ROLE_COMPETITION_DOCTOR} title="Врач соревнований" nav={NAV} active={active} sub={sub} back={back} pageTitle={title} sections={title ? [] : undefined} bleed>
      {children}
    </RoleShell>
  );
}

export function MedicView() {
  const { user } = useSession();
  return (
    <MedicShell active="Турниры" sub={boardViews('/medic', useBoardView())}>
      <TournamentBoard detailsPath={(id) => `/medic/tournaments/${id}`} canCreate={false} only={tournamentIdsFor(user, ROLE_COMPETITION_DOCTOR)} />
    </MedicShell>
  );
}

const TONE: Record<MedicalStatus, 'success' | 'danger' | 'default'> = { admitted: 'success', denied: 'danger', '': 'default' };

function StatusChip({ row }: { row: MedicalRow }) {
  const chip = (
    <Chip size="sm" variant="soft" color={TONE[row.status]} data-testid="medical-status" data-status={row.status}>
      {MEDICAL_LABEL[row.status]}
    </Chip>
  );
  if (!row.note) return chip;
  return (
    <Tooltip>
      <Tooltip.Trigger aria-label={'Причина: ' + row.note}>{chip}</Tooltip.Trigger>
      <Tooltip.Content>{row.note}</Tooltip.Content>
    </Tooltip>
  );
}

/** Окно недопуска: причина обязательна. */
function DenyDialog({ row, onDeny }: { row: MedicalRow; onDeny: (note: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(row.note);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button size="sm" variant="ghost" className="rounded-xl text-red-600" onPress={() => setOpen(true)} data-testid="medical-deny">
        <X size={15} /> Не допустить
      </Button>
      <ModalSheet isOpen={open} onOpenChange={setOpen} size="sm" testId="medical-deny-dialog">
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">{row.name}</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-3">
          <TextField isRequired value={note} onChange={setNote}>
            <Label>Причина недопуска</Label>
            <TextArea rows={3} className="rounded-xl" data-testid="medical-note" />
          </TextField>
          {error && <p className="m-0 text-[13px] text-red-600">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" className="rounded-xl" onPress={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            className="rounded-xl"
            isDisabled={!note.trim()}
            onPress={() => void onDeny(note).then(() => setOpen(false), (e: Error) => setError(e.message))}
            data-testid="medical-deny-submit"
          >
            Не допустить
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </>
  );
}

function Admission({ tournamentId }: { tournamentId: string }) {
  const loaded = useLoad(() => fetchMedical(tournamentId), tournamentId + ':medical');
  const [fresh, setFresh] = useState<MedicalAdmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const data = fresh ?? loaded.data;
  const decide = (row: MedicalRow, status: MedicalStatus, note = '') =>
    decideMedical(tournamentId, row.userId, status, note).then((d) => {
      setFresh(d);
      setError(null);
    });

  const columns: DataColumn<MedicalRow>[] = [
    { id: 'name', label: 'Спортсмен', rowHeader: true, sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
    { id: 'year', label: 'Год рождения', sortValue: (r) => r.birthYear ?? 0, render: (r) => r.birthYear ?? '—' },
    { id: 'region', label: 'Регион', sortValue: (r) => r.region, render: (r) => r.region || '—' },
    { id: 'status', label: 'Допуск', sortValue: (r) => r.status, render: (r) => <StatusChip row={r} /> },
    { id: 'by', label: 'Решил', sortable: false, render: (r) => r.by || '—' },
    ...(data?.canDecide
      ? [
          {
            id: 'actions',
            label: '',
            sortable: false,
            align: 'right' as const,
            render: (r: MedicalRow) => (
              <span className="flex justify-end gap-1">
                {r.status !== 'admitted' && (
                  <Button size="sm" variant="ghost" className="rounded-xl text-green-700" onPress={() => void decide(r, 'admitted').catch((e: Error) => setError(e.message))} data-testid="medical-admit">
                    <Check size={15} /> Допустить
                  </Button>
                )}
                {r.status !== 'denied' && <DenyDialog row={r} onDeny={(note) => decide(r, 'denied', note)} />}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error && <p className="m-0 px-6 py-2 text-[13px] text-red-600">{error}</p>}
      <DataTable
        ariaLabel="Допуск участников"
        testId="medical-admission"
        rows={data?.participants ?? []}
        columns={columns}
        getId={(r) => r.userId}
        loading={!data && !loaded.error}
        error={loaded.error}
        empty="Участников нет"
        search={{ placeholder: 'Фамилия или регион', text: (r) => r.name + ' ' + r.region }}
        count={(n) => n + ' всего'}
        defaultSort={{ column: 'name', direction: 'ascending' }}
        rowProps={(r) => ({ 'data-testid': 'medical-row', 'data-name': r.name })}
      />
    </div>
  );
}

export function MedicTournamentView({ id }: { id: string }) {
  const tournament = useTournament(id);
  const router = useRouter();
  return (
    <MedicShell
      active="Турниры"
      title={tournament.data ? tournament.data.name + ' · Допуск участников' : undefined}
      back={{ label: 'Турниры', onPress: () => router.push('/medic') }}
    >
      {tournament.error ? <p className="p-6 text-[13px] text-red-600">{tournament.error}</p> : !tournament.data ? <Spinner className="m-auto" /> : <Admission tournamentId={id} />}
    </MedicShell>
  );
}
