'use client';

/* Календарь подготовки ✳ (19.11.2026, NATIONAL.md; флоу Э11.3): сборы и
   целевые старты сезона таблицей. Заводит и правит штаб (`canEdit` с
   сервера); остальные — читают. Строка у штаба открывает правку. HeroUI +
   Tailwind. */

import { AlertDialog, Button, Input, Label, Modal, TextField, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  AGE_GROUP_LABEL,
  createEvent,
  deleteEvent,
  dmy,
  EVENT_KIND_LABEL,
  fetchEvents,
  updateEvent,
  useLoad,
  type AgeGroup,
  type EventInput,
  type EventKind,
  type TrainingEvent,
} from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { AlertSheet, ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

const KINDS = (Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((k) => ({ id: k, label: EVENT_KIND_LABEL[k] }));
const ALL = 'all';
const GROUPS = [{ id: ALL, label: 'Вся сборная' }, ...(Object.keys(AGE_GROUP_LABEL) as AgeGroup[]).map((g) => ({ id: g, label: AGE_GROUP_LABEL[g] }))];

const blank = (): EventInput => {
  const d = new Date().toISOString().slice(0, 10);
  return { kind: 'camp', title: '', city: '', startsOn: d, endsOn: d, ageGroup: '' };
};

function EventDialog({
  event,
  isOpen,
  onOpenChange,
  onSaved,
}: {
  event: TrainingEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EventInput>(() =>
    event
      ? { kind: event.kind, title: event.title, city: event.city, startsOn: event.startsOn, endsOn: event.endsOn, ageGroup: event.ageGroup }
      : blank(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<EventInput>) => setForm((f) => ({ ...f, ...patch }));

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onOpenChange(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void run(() => (event ? updateEvent(event.id, form) : createEvent(form)));
  }

  return (
    <ModalSheet size="sm" testId="event-dialog" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading className="text-lg font-semibold">{event ? event.title : 'Новое мероприятие'}</Modal.Heading>
      </Modal.Header>
      <form onSubmit={submit}>
        <Modal.Body className="flex flex-col gap-4">
          <Picker label="Вид" showLabel value={form.kind} options={KINDS} onChange={(k) => set({ kind: k as EventKind })} testId="event-kind" />
          <TextField isRequired value={form.title} onChange={(v) => set({ title: v })}>
            <Label>Название</Label>
            <Input className="rounded-xl" data-testid="event-title" />
          </TextField>
          <TextField value={form.city} onChange={(v) => set({ city: v })}>
            <Label>Где</Label>
            <Input className="rounded-xl" data-testid="event-city" />
          </TextField>
          <div className="grid grid-cols-2 gap-3">
            <TextField isRequired value={form.startsOn} onChange={(v) => set({ startsOn: v })}>
              <Label>С</Label>
              <Input type="date" className="rounded-xl" data-testid="event-starts" />
            </TextField>
            <TextField isRequired value={form.endsOn} onChange={(v) => set({ endsOn: v })}>
              <Label>По</Label>
              <Input type="date" className="rounded-xl" data-testid="event-ends" />
            </TextField>
          </div>
          <Picker
            label="Для кого"
            showLabel
            value={form.ageGroup || ALL}
            options={GROUPS}
            onChange={(k) => set({ ageGroup: k === ALL ? '' : (k as AgeGroup) })}
            testId="event-group"
          />
          {error && <p className="m-0 text-[13px] text-red-600" data-testid="event-error">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          {event && (
            <AlertDialog>
              <Button variant="danger-soft" className="rounded-xl" isDisabled={busy} data-testid="event-delete">
                Удалить
              </Button>
              <AlertSheet className="rounded-xl">
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading>Удалить мероприятие?</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p className="text-[14px]">{event.title}</p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary" className="rounded-xl">
                    Отмена
                  </Button>
                  <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void run(() => deleteEvent(event.id))}>
                    Удалить
                  </Button>
                </AlertDialog.Footer>
              </AlertSheet>
            </AlertDialog>
          )}
          <Button type="submit" variant="primary" className="rounded-xl" isDisabled={busy || !form.title.trim()} data-testid="event-submit">
            Сохранить
          </Button>
        </Modal.Footer>
      </form>
    </ModalSheet>
  );
}

const COLUMNS: DataColumn<TrainingEvent>[] = [
  { id: 'dates', label: 'Даты', sortValue: (e) => e.startsOn, render: (e) => dmy(e.startsOn) + ' — ' + dmy(e.endsOn) },
  { id: 'kind', label: 'Вид', sortValue: (e) => e.kind, render: (e) => EVENT_KIND_LABEL[e.kind] },
  { id: 'title', label: 'Мероприятие', rowHeader: true, sortValue: (e) => e.title, render: (e) => <span className="font-medium">{e.title}</span> },
  { id: 'city', label: 'Где', sortValue: (e) => e.city, render: (e) => e.city || '—' },
  { id: 'group', label: 'Для кого', sortValue: (e) => e.ageGroup, render: (e) => (e.ageGroup ? AGE_GROUP_LABEL[e.ageGroup] : 'Вся сборная') },
];

export function TrainingCalendar() {
  const calendar = useLoad(fetchEvents, 'events');
  const create = useOverlayState();
  const [editing, setEditing] = useState<TrainingEvent | null>(null);
  const canEdit = !!calendar.data?.canEdit;
  return (
    <>
      <DataTable
        ariaLabel="Календарь подготовки"
        testId="training-calendar"
        rows={calendar.data?.events ?? []}
        columns={COLUMNS}
        getId={(e) => e.id}
        loading={!calendar.data && !calendar.error}
        error={calendar.error}
        empty="Мероприятий нет"
        search={{ placeholder: 'Название или город', text: (e) => e.title + ' ' + e.city }}
        defaultSort={{ column: 'dates', direction: 'ascending' }}
        actions={
          canEdit ? (
            <Button variant="primary" size="sm" className="rounded-xl" onPress={create.open} data-testid="event-create-open">
              <Plus size={16} /> Мероприятие
            </Button>
          ) : undefined
        }
        onRowAction={canEdit ? (e) => setEditing(e) : undefined}
        rowProps={(e) => ({ 'data-testid': 'event-row', 'data-title': e.title })}
      />
      {create.isOpen && <EventDialog event={null} isOpen onOpenChange={(o) => !o && create.close()} onSaved={calendar.reload} />}
      {editing && <EventDialog key={editing.id} event={editing} isOpen onOpenChange={(o) => !o && setEditing(null)} onSaved={calendar.reload} />}
    </>
  );
}
