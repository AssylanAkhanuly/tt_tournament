'use client';

/* Медицинская карта члена сборной ✳ (19.11.2026, NATIONAL.md; флоу Э11.2).
   Что прислал сервер, то и рисуем: врачу (`full`) — вкладки ✳ (22.11.2026):
   «Записи» (все записи таблицей, «Добавить запись», удаление), «Сводка УМО»
   и девять блоков УМО (`MedicalUmo`); вкладка — в адресе `?tab=`. Главному
   тренеру — действующие ограничения нагрузки (допуск — в шапке карточки,
   диагнозов нет) и, если сервер открыл (`umo`), те же вкладки УМО только
   для просмотра ✳ (22.11.2026, решение владельца продукта). HeroUI + Tailwind. */

import { AlertDialog, Button, Input, Label, Modal, Tabs, TextArea, TextField, Tooltip, useOverlayState } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';

import {
  addMedical,
  deleteMedical,
  dmy,
  fetchMedical,
  MEDICAL_KIND_LABEL,
  useLoad,
  type MedicalInput,
  type MedicalKind,
  type MedicalRecord,
} from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { AlertSheet, ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

import { UMO_TABS, UmoPanel } from './MedicalUmo';

const KINDS = (Object.keys(MEDICAL_KIND_LABEL) as MedicalKind[]).map((k) => ({ id: k, label: MEDICAL_KIND_LABEL[k] }));
const today = () => new Date().toISOString().slice(0, 10);

function RecordDialog({ memberId, onAdded }: { memberId: string; onAdded: () => void }) {
  const state = useOverlayState();
  const blank: MedicalInput = { kind: 'clearance', date: today(), until: '', title: '', note: '', loadLimit: '' };
  const [form, setForm] = useState<MedicalInput>(blank);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<MedicalInput>) => setForm((f) => ({ ...f, ...patch }));
  const isClearance = form.kind === 'clearance';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await addMedical(memberId, isClearance ? { ...form, loadLimit: '' } : form);
      state.close();
      setForm(blank);
      onAdded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="medical-add-open">
        <Plus size={16} /> Добавить запись
      </Button>
      <ModalSheet size="md" testId="medical-add">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Новая запись</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <Picker label="Запись" showLabel value={form.kind} options={KINDS} onChange={(k) => set({ kind: k as MedicalKind })} testId="medical-kind" />
            <div className="grid grid-cols-2 gap-3">
              <TextField isRequired value={form.date} onChange={(v) => set({ date: v })}>
                <Label>Дата</Label>
                <Input type="date" className="rounded-xl" data-testid="medical-date" />
              </TextField>
              <TextField isRequired={isClearance} value={form.until} onChange={(v) => set({ until: v })}>
                <Label>{isClearance ? 'Допуск до' : 'Действует до'}</Label>
                <Input type="date" className="rounded-xl" data-testid="medical-until" />
              </TextField>
            </div>
            <TextField value={form.title} onChange={(v) => set({ title: v })}>
              <Label>{form.kind === 'umo' || isClearance ? 'Заключение' : 'Диагноз'}</Label>
              <Input className="rounded-xl" data-testid="medical-title" />
            </TextField>
            {!isClearance && (
              <TextField value={form.loadLimit} onChange={(v) => set({ loadLimit: v })}>
                <Label>Ограничение нагрузки</Label>
                <Input placeholder="Без ограничения" className="rounded-xl" data-testid="medical-limit" />
              </TextField>
            )}
            <TextField value={form.note} onChange={(v) => set({ note: v })}>
              <Label>Подробно</Label>
              <TextArea rows={3} className="rounded-xl" data-testid="medical-note" />
            </TextField>
            {error && <p className="m-0 text-[13px] text-red-600" data-testid="medical-error">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={busy || !form.date} data-testid="medical-submit">
              Добавить
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}

function DeleteRecord({ record, onDeleted }: { record: MedicalRecord; onDeleted: () => void }) {
  return (
    <AlertDialog>
      <Tooltip>
        <Button isIconOnly variant="ghost" size="sm" aria-label="Удалить запись" className="rounded-xl text-red-600" data-testid="medical-delete">
          <Trash2 size={15} />
        </Button>
        <Tooltip.Content>Удалить запись</Tooltip.Content>
      </Tooltip>
      <AlertSheet className="rounded-xl">
        <AlertDialog.Header>
          <AlertDialog.Icon status="danger" />
          <AlertDialog.Heading>Удалить запись?</AlertDialog.Heading>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <p className="text-[14px]">
            {MEDICAL_KIND_LABEL[record.kind]} · {dmy(record.date)}
          </p>
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button slot="close" variant="tertiary" className="rounded-xl">
            Отмена
          </Button>
          <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void deleteMedical(record.id).then(onDeleted)}>
            Удалить
          </Button>
        </AlertDialog.Footer>
      </AlertSheet>
    </AlertDialog>
  );
}

export function MedicalCardView({ memberId, onChanged }: { memberId: string; onChanged?: () => void }) {
  const card = useLoad(() => fetchMedical(memberId), memberId);
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') ?? 'records';
  const setTab = (t: string) => {
    const next = new URLSearchParams(params.toString());
    if (t === 'records') next.delete('tab');
    else next.set('tab', t);
    const qs = next.toString();
    router.replace(qs ? '?' + qs : '?', { scroll: false });
  };
  const reload = () => {
    card.reload();
    onChanged?.();
  };

  const tabbed = (first: { id: string; label: string }, firstView: ReactNode) => (
    <div className="flex h-full min-h-0 flex-col" data-testid="medical-card">
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} className="shrink-0 overflow-x-auto border-b border-neutral-200 px-4 py-2">
        <Tabs.ListContainer className="rounded-xl">
          <Tabs.List aria-label="Разделы медкарты">
            {[first, ...UMO_TABS].map((t) => (
              <Tabs.Tab key={t.id} id={t.id} className="whitespace-nowrap" data-testid={'medical-tab-' + t.id}>
                {t.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{tab === 'records' ? firstView : <UmoPanel memberId={memberId} tab={tab} onTab={setTab} />}</div>
    </div>
  );

  if (card.data && !card.data.full) {
    const limits = card.data.limits;
    const limitsTable = (
      <DataTable
        ariaLabel="Ограничения нагрузки"
        testId="medical-limits"
        rows={limits.map((l, i) => ({ ...l, id: String(i) }))}
        columns={[
          { id: 'limit', label: 'Ограничение нагрузки', rowHeader: true, sortable: false, render: (l) => l.loadLimit },
          { id: 'until', label: 'До', sortable: false, render: (l) => (l.until ? dmy(l.until) : 'Бессрочно') },
        ]}
        getId={(l) => l.id}
        empty="Ограничений нет"
        rowProps={() => ({ 'data-testid': 'limit-row' })}
      />
    );
    return card.data.umo ? tabbed({ id: 'records', label: 'Ограничения' }, limitsTable) : limitsTable;
  }

  const columns: DataColumn<MedicalRecord>[] = [
    { id: 'date', label: 'Дата', descFirst: true, sortValue: (r) => r.date, render: (r) => dmy(r.date) },
    { id: 'kind', label: 'Запись', rowHeader: true, sortValue: (r) => r.kind, render: (r) => <span className="font-medium">{MEDICAL_KIND_LABEL[r.kind]}</span> },
    { id: 'title', label: 'Заключение / диагноз', sortable: false, render: (r) => r.title || '—' },
    { id: 'limit', label: 'Ограничение нагрузки', sortable: false, render: (r) => r.loadLimit || '—' },
    { id: 'until', label: 'До', sortValue: (r) => r.until, render: (r) => dmy(r.until) },
    { id: 'by', label: 'Внёс', sortable: false, render: (r) => r.createdBy || '—' },
    { id: 'actions', label: '', sortable: false, align: 'right', render: (r) => <DeleteRecord record={r} onDeleted={reload} /> },
  ];

  const records = (
    <DataTable
      ariaLabel="Медицинская карта"
      testId="medical-records"
      rows={card.data?.records ?? []}
      columns={columns}
      getId={(r) => r.id}
      loading={!card.data && !card.error}
      error={card.error}
      empty="Записей нет"
      defaultSort={{ column: 'date', direction: 'descending' }}
      actions={<RecordDialog memberId={memberId} onAdded={reload} />}
      rowProps={(r) => ({ 'data-testid': 'medical-row', 'data-kind': r.kind })}
    />
  );
  if (!card.data) return records;
  return tabbed({ id: 'records', label: 'Записи' }, records);
}
