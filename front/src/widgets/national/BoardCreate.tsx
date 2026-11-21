'use client';

/* Создание с доски планов ✳ (21.11.2026, решение владельца продукта: «как в
   календаре — создать щелчком по клетке»). Щелчок по пустому дню в строке
   спортсмена открывает окно:

   - у спортсмена есть план, и правит его этот человек (`canAdd`) — «Новый
     пункт» на этот день: работа (что делаем, срок — щёлкнутый день) или сбор /
     старт — выбором из календаря подготовки (сроки берутся оттуда, как в
     карточке плана);
   - плана на период нет, а заводить можно (`canCreatePlan`) — «Новый план»
     с началом в щёлкнутый день и окончанием через четыре недели (подстановка
     наша, правится в окне).

   Права проверяет сервер; окно только не предлагает недоступное. */

import { Button, Input, Label, Modal, TextField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useState, type FormEvent } from 'react';

import {
  addPlanItem,
  createPlan,
  fetchEvents,
  PLAN_ITEM_LABEL,
  useLoad,
  type BoardRow,
  type PlanItemKind,
} from '@/entities/national';
import { DateInput } from '@/shared/ui/DateInput';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

const plusDays = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

export type CreateAt = { row: BoardRow; date: string };

export function BoardCreate({ at, onClose, onDone }: { at: CreateAt | null; onClose: () => void; onDone: () => void }) {
  return (
    <ModalSheet size="sm" isOpen={!!at} onOpenChange={(o) => !o && onClose()} testId="plan-board-create">
      {at && (at.row.plan && at.row.canAdd ? <ItemForm at={at} onClose={onClose} onDone={onDone} /> : <PlanForm at={at} onClose={onClose} onDone={onDone} />)}
    </ModalSheet>
  );
}

function Shell({ title, error, ready, busy, onSubmit, onClose, children }: {
  title: string;
  error: string | null;
  ready: boolean;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading className="text-lg font-semibold">{title}</Modal.Heading>
      </Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body className="flex flex-col gap-4">
          {children}
          {error && <p className="m-0 text-[13px] text-red-600" data-testid="plan-board-create-error">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" className="rounded-xl" onPress={onClose}>
            Отмена
          </Button>
          <Button type="submit" className="rounded-xl" isDisabled={!ready || busy} data-testid="plan-board-create-submit">
            Создать
          </Button>
        </Modal.Footer>
      </form>
    </>
  );
}

function useSubmit(run: () => Promise<unknown>, onDone: () => void, onClose: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await run();
      onDone();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return { error, busy, onSubmit };
}

function ItemForm({ at, onClose, onDone }: { at: CreateAt; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState<PlanItemKind>('work');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<string | null>(at.date);
  const [eventId, setEventId] = useState<string | null>(null);
  const events = useLoad(fetchEvents, 'events');
  const options = (events.data?.events ?? [])
    .filter((e) => e.kind === kind)
    .map((e) => ({ id: e.id, label: e.title + (e.city ? ' · ' + e.city : '') }));
  const ready = kind === 'work' ? !!title.trim() && !!due : !!eventId;
  const s = useSubmit(
    () => addPlanItem(at.row.plan!.id, { kind, title: kind === 'work' ? title.trim() : '', due: kind === 'work' ? due ?? '' : '', eventId: kind === 'work' ? null : eventId }),
    onDone,
    onClose,
  );
  return (
    <Shell title={'Новый пункт · ' + at.row.member.person.name} ready={ready} {...s} onClose={onClose}>
      <ToggleButtonGroup
        size="sm"
        aria-label="Вид"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[kind]}
        onSelectionChange={(keys) => {
          const v = [...keys][0] as PlanItemKind | undefined;
          if (v) {
            setKind(v);
            setEventId(null);
          }
        }}
      >
        {(['work', 'camp', 'start'] as PlanItemKind[]).map((k) => (
          <ToggleButton key={k} id={k}>
            {PLAN_ITEM_LABEL[k]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {kind === 'work' ? (
        <>
          <TextField isRequired value={title} onChange={setTitle} autoFocus>
            <Label>Что делаем</Label>
            <Input className="rounded-xl" data-testid="plan-board-create-title" />
          </TextField>
          <DateInput label="Срок" value={due} onChange={setDue} testId="plan-board-create-due" />
        </>
      ) : (
        <Picker
          label={kind === 'camp' ? 'Сбор из календаря подготовки' : 'Старт из календаря подготовки'}
          showLabel
          value={eventId}
          options={options}
          onChange={setEventId}
          placeholder={options.length ? 'Выберите' : 'В календаре подготовки нет'}
          testId="plan-board-create-event"
        />
      )}
    </Shell>
  );
}

function PlanForm({ at, onClose, onDone }: { at: CreateAt; onClose: () => void; onDone: () => void }) {
  const [startsOn, setStartsOn] = useState<string | null>(at.date);
  const [endsOn, setEndsOn] = useState<string | null>(plusDays(at.date, 27));
  const [goal, setGoal] = useState('');
  const s = useSubmit(() => createPlan(at.row.member.id, { startsOn: startsOn!, endsOn: endsOn!, goal: goal.trim() }), onDone, onClose);
  return (
    <Shell title={'Новый план · ' + at.row.member.person.name} ready={!!startsOn && !!endsOn} {...s} onClose={onClose}>
      <DateInput label="С" value={startsOn} onChange={setStartsOn} testId="plan-board-create-from" />
      <DateInput label="По" value={endsOn} onChange={setEndsOn} testId="plan-board-create-to" />
      <TextField value={goal} onChange={setGoal}>
        <Label>Цель периода</Label>
        <Input className="rounded-xl" data-testid="plan-board-create-goal" />
      </TextField>
    </Shell>
  );
}
