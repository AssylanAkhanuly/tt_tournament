'use client';

/* Состав национальной команды ✳ (19.11.2026, NATIONAL.md; флоу Э11.1):
   таблица на всю область — спортсмен, состав, возрастная группа, регион,
   личный тренер, рейтинг, медицинский допуск, ограничения нагрузки и (тем,
   кому сервер прислал планы) план — долей «7 из 9», а не признаком; «· ждёт»
   — план на согласовании. Строки — те, кого человеку видно (решает сервер). «Внести в сборную» — только
   главному тренеру (`canEdit`). Строка открывает карточку — адрес строит
   экран. HeroUI + Tailwind. */

import { Button, Chip, ListBox, Modal, SearchField, Spinner, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  addMember,
  AGE_GROUP_LABEL,
  dmy,
  fetchMemberCandidates,
  fetchMembers,
  SQUAD_LABEL,
  useLoad,
  type AgeGroup,
  type Clearance,
  type NationalMember,
  type NationalPerson,
  type Squad,
} from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

export function ClearanceChip({ clearance }: { clearance: Clearance }) {
  const { status, until } = clearance;
  const text = status === 'none' ? 'Не внесён' : (status === 'ok' ? 'До ' : 'Истёк ') + dmy(until);
  const color = status === 'ok' ? 'success' : status === 'expired' ? 'danger' : 'default';
  return (
    <Chip size="sm" variant="soft" color={color} data-testid="clearance" data-status={status}>
      {text}
    </Chip>
  );
}

const SQUADS = (Object.keys(SQUAD_LABEL) as Squad[]).map((s) => ({ id: s, label: SQUAD_LABEL[s] }));
const AGE_GROUPS = (Object.keys(AGE_GROUP_LABEL) as AgeGroup[]).map((g) => ({ id: g, label: AGE_GROUP_LABEL[g] }));
export { AGE_GROUPS, SQUADS };

function AddMemberDialog({ onAdded }: { onAdded: () => void }) {
  const state = useOverlayState();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<NationalPerson[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [squad, setSquad] = useState<Squad>('main');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state.isOpen) return;
    let live = true;
    const t = setTimeout(() => {
      fetchMemberCandidates(q)
        .then((list) => live && setFound(list))
        .catch(() => live && setFound([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, state.isOpen]);

  async function submit() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      await addMember(picked, squad, ageGroup);
      state.close();
      setPicked(null);
      setQ('');
      onAdded();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="member-add-open">
        <Plus size={16} /> Внести в сборную
      </Button>
      <ModalSheet size="md" tall testId="member-add">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Внести в сборную</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-4">
          <SearchField aria-label="Поиск спортсменов" value={q} onChange={setQ}>
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Фамилия или имя" data-testid="member-search" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="max-h-64 min-h-24 overflow-y-auto">
            {!found ? (
              <Spinner className="mx-auto my-4 block" />
            ) : (
              <ListBox
                aria-label="Спортсмены"
                selectionMode="single"
                selectedKeys={picked ? [picked] : []}
                onSelectionChange={(keys) => setPicked(([...(keys as Set<string>)][0] as string) ?? null)}
                renderEmptyState={() => <p className="py-4 text-center text-[13px] text-neutral-500">Никого не найдено</p>}
              >
                {found.map((p) => (
                  <ListBox.Item key={p.id} id={p.id} textValue={p.name} className="rounded-xl" data-testid="member-candidate" data-name={p.name}>
                    <span className="flex w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="text-[12px] text-neutral-500">
                        {[p.birthYear, p.region].filter(Boolean).join(' · ')}
                      </span>
                      <span className="w-12 text-right text-[12px] tabular-nums">{p.rating}</span>
                    </span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Picker label="Состав" showLabel value={squad} options={SQUADS} onChange={(k) => setSquad(k as Squad)} testId="member-squad" />
            <Picker
              label="Возрастная группа"
              showLabel
              value={ageGroup}
              options={AGE_GROUPS}
              onChange={(k) => setAgeGroup(k as AgeGroup)}
              testId="member-age-group"
            />
          </div>
          {error && <p className="m-0 text-[13px] text-red-600" data-testid="member-error">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
            Отмена
          </Button>
          <Button variant="primary" className="rounded-xl" isDisabled={!picked || busy} onPress={() => void submit()} data-testid="member-add-submit">
            Внести
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </Modal>
  );
}

export function RosterTable({ canEdit, onOpen }: { canEdit: boolean; onOpen: (memberId: string) => void }) {
  const members = useLoad(fetchMembers, 'members');
  // Колонку плана показывает тот, кому сервер прислал планы (`plan` в строке).
  const showPlan = (members.data ?? []).some((m) => m.plan !== undefined);

  const columns: DataColumn<NationalMember>[] = [
    { id: 'name', label: 'Спортсмен', rowHeader: true, sortValue: (m) => m.person.name, render: (m) => <span className="font-medium">{m.person.name}</span> },
    { id: 'squad', label: 'Состав', sortValue: (m) => m.squad, render: (m) => SQUAD_LABEL[m.squad] },
    { id: 'age', label: 'Группа', sortValue: (m) => m.ageGroup, render: (m) => AGE_GROUP_LABEL[m.ageGroup] },
    { id: 'region', label: 'Регион', sortValue: (m) => m.person.region, render: (m) => m.person.region || '—' },
    {
      id: 'coach',
      label: 'Личный тренер',
      sortValue: (m) => m.personalCoach?.name ?? '',
      render: (m) => m.personalCoach?.name ?? <span className="text-neutral-400">—</span>,
    },
    {
      id: 'rating',
      label: 'Рейтинг',
      align: 'right',
      descFirst: true,
      sortValue: (m) => Number(m.person.rating ?? 0),
      render: (m) => <span className="tabular-nums">{m.person.rating ?? '—'}</span>,
    },
    ...(showPlan
      ? [
          {
            id: 'plan',
            label: 'План',
            align: 'right' as const,
            sortValue: (m: NationalMember) => (m.plan ? m.plan.done / Math.max(m.plan.total, 1) : -1),
            render: (m: NationalMember) => (
              <span className="tabular-nums" data-testid="member-plan">
                {m.plan ? m.plan.done + ' из ' + m.plan.total + (m.plan.status === 'submitted' ? ' · ждёт' : '') : 'Нет'}
              </span>
            ),
          },
        ]
      : []),
    { id: 'clearance', label: 'Допуск', sortValue: (m) => m.clearance.status, render: (m) => <ClearanceChip clearance={m.clearance} /> },
    {
      id: 'limits',
      label: 'Ограничения',
      align: 'right',
      sortValue: (m) => m.limits,
      render: (m) => <span className={m.limits ? 'font-semibold text-amber-700' : 'text-neutral-400'}>{m.limits || '—'}</span>,
    },
  ];

  return (
    <DataTable
      ariaLabel="Состав сборной"
      testId="national-roster"
      rows={members.data ?? []}
      columns={columns}
      getId={(m) => m.id}
      loading={!members.data && !members.error}
      error={members.error}
      empty="В сборной никого нет"
      search={{ placeholder: 'Фамилия или регион', text: (m) => m.person.name + ' ' + m.person.region }}
      defaultSort={{ column: 'name', direction: 'ascending' }}
      actions={canEdit ? <AddMemberDialog onAdded={members.reload} /> : undefined}
      onRowAction={(m) => onOpen(m.id)}
      rowProps={(m) => ({ 'data-testid': 'member-row', 'data-name': m.person.name })}
    />
  );
}

