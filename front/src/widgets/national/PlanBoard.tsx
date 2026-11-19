'use client';

/* План подготовки члена сборной ✳ (19.11.2026, NATIONAL.md; флоу Э11.5) —
   главному тренеру. Планы по периодам (выбор периода, если их несколько),
   у плана — цель и «N из M»; пункты таблицей: отметка «выполнено», тип
   (работа · сбор · старт), что делаем, срок. «Пункт плана» и «Новый план» —
   справа в полосе. HeroUI + Tailwind. */

import { Button, Input, Label, Modal, TextField, Tooltip, useOverlayState } from '@heroui/react';
import { Plus, Square, SquareCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import {
  addPlanItem,
  createPlan,
  deletePlanItem,
  dmy,
  fetchPlans,
  PLAN_ITEM_LABEL,
  setPlanItemDone,
  useLoad,
  type PlanItem,
  type PlanItemKind,
  type TrainingPlan,
} from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

const ITEM_KINDS = (Object.keys(PLAN_ITEM_LABEL) as PlanItemKind[]).map((k) => ({ id: k, label: PLAN_ITEM_LABEL[k] }));
const period = (p: TrainingPlan) => dmy(p.startsOn) + ' — ' + dmy(p.endsOn);

/** Окно с формой: кнопка-открывашка, поля, ошибка сервера у кнопок. */
function FormDialog({
  trigger,
  title,
  submit,
  ready,
  testId,
  children,
}: {
  trigger: ReactNode;
  title: string;
  submit: () => Promise<unknown>;
  ready: boolean;
  testId: string;
  children: ReactNode;
}) {
  const state = useOverlayState();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submit();
      state.close();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal state={state}>
      {trigger}
      <ModalSheet size="sm" testId={testId}>
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">{title}</Modal.Heading>
        </Modal.Header>
        <form onSubmit={onSubmit}>
          <Modal.Body className="flex flex-col gap-4">
            {children}
            {error && <p className="m-0 text-[13px] text-red-600" data-testid={testId + '-error'}>{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!ready || busy} data-testid={testId + '-submit'}>
              Сохранить
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}

function NewPlanDialog({ memberId, onCreated }: { memberId: string; onCreated: (planId: string) => void }) {
  const year = new Date().getFullYear();
  const [startsOn, setStartsOn] = useState(`${year}-01-01`);
  const [endsOn, setEndsOn] = useState(`${year}-12-31`);
  const [goal, setGoal] = useState('');
  return (
    <FormDialog
      testId="plan-create"
      title="Новый план"
      ready={!!startsOn && !!endsOn}
      submit={async () => onCreated((await createPlan(memberId, { startsOn, endsOn, goal })).id)}
      trigger={
        <Button variant="tertiary" size="sm" className="rounded-xl" data-testid="plan-create-open">
          <Plus size={16} /> Новый план
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <TextField isRequired value={startsOn} onChange={setStartsOn}>
          <Label>С</Label>
          <Input type="date" className="rounded-xl" data-testid="plan-starts" />
        </TextField>
        <TextField isRequired value={endsOn} onChange={setEndsOn}>
          <Label>По</Label>
          <Input type="date" className="rounded-xl" data-testid="plan-ends" />
        </TextField>
      </div>
      <TextField value={goal} onChange={setGoal}>
        <Label>Цель периода</Label>
        <Input className="rounded-xl" data-testid="plan-goal" />
      </TextField>
    </FormDialog>
  );
}

function ItemDialog({ planId, onAdded }: { planId: string; onAdded: () => void }) {
  const [kind, setKind] = useState<PlanItemKind>('work');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  return (
    <FormDialog
      testId="item-create"
      title="Пункт плана"
      ready={!!title.trim()}
      submit={async () => {
        await addPlanItem(planId, { kind, title, due });
        setTitle('');
        setDue('');
        onAdded();
      }}
      trigger={
        <Button variant="primary" size="sm" className="rounded-xl" data-testid="item-create-open">
          <Plus size={16} /> Пункт плана
        </Button>
      }
    >
      <Picker label="Тип" showLabel value={kind} options={ITEM_KINDS} onChange={(k) => setKind(k as PlanItemKind)} testId="item-kind" />
      <TextField isRequired value={title} onChange={setTitle}>
        <Label>Что делаем</Label>
        <Input className="rounded-xl" data-testid="item-title" />
      </TextField>
      <TextField value={due} onChange={setDue}>
        <Label>Срок</Label>
        <Input type="date" className="rounded-xl" data-testid="item-due" />
      </TextField>
    </FormDialog>
  );
}

export function PlanBoard({ memberId, onChanged }: { memberId: string; onChanged?: () => void }) {
  const plans = useLoad(() => fetchPlans(memberId), memberId);
  const [chosen, setChosen] = useState<string | null>(null);
  const list = plans.data ?? [];
  const plan = list.find((p) => p.id === chosen) ?? list[0] ?? null;
  const reload = () => {
    plans.reload();
    onChanged?.();
  };

  const columns: DataColumn<PlanItem>[] = [
    {
      id: 'done',
      label: 'Выполнено',
      sortable: false,
      render: (i) => (
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label={'Выполнено: ' + i.title}
          aria-pressed={i.done}
          className={'rounded-xl ' + (i.done ? 'text-emerald-600' : 'text-neutral-400')}
          onPress={() => void setPlanItemDone(i.id, !i.done).then(reload)}
          data-testid="item-done"
          data-done={i.done ? 'yes' : 'no'}
        >
          {i.done ? <SquareCheck size={18} /> : <Square size={18} />}
        </Button>
      ),
    },
    { id: 'kind', label: 'Тип', sortValue: (i) => i.kind, render: (i) => PLAN_ITEM_LABEL[i.kind] },
    {
      id: 'title',
      label: 'Что делаем',
      rowHeader: true,
      sortValue: (i) => i.title,
      render: (i) => <span className={i.done ? 'text-neutral-500 line-through' : 'font-medium'}>{i.title}</span>,
    },
    { id: 'due', label: 'Срок', sortValue: (i) => i.due, render: (i) => dmy(i.due) },
    {
      id: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (i) => (
        <Tooltip>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Убрать пункт"
            className="rounded-xl text-red-600"
            onPress={() => void deletePlanItem(i.id).then(reload)}
            data-testid="item-delete"
          >
            <Trash2 size={15} />
          </Button>
          <Tooltip.Content>Убрать пункт</Tooltip.Content>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {plan && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-200 px-6 py-3" data-testid="plan-head">
          {list.length > 1 ? (
            <Picker
              label="Период"
              className="w-60 min-w-0"
              value={plan.id}
              options={list.map((p) => ({ id: p.id, label: period(p) }))}
              onChange={setChosen}
              testId="plan-period"
            />
          ) : (
            <span className="text-[14px] font-medium">{period(plan)}</span>
          )}
          <span className="min-w-0 flex-1 truncate text-[14px]">{plan.goal}</span>
          <span className="text-[14px] font-semibold tabular-nums" data-testid="plan-progress">
            {plan.done} из {plan.total}
          </span>
        </div>
      )}
      <DataTable
        ariaLabel="План подготовки"
        testId="plan-items"
        rows={plan?.items ?? []}
        columns={columns}
        getId={(i) => i.id}
        loading={!plans.data && !plans.error}
        error={plans.error}
        empty={plan ? 'Пунктов нет' : 'Плана нет'}
        actions={
          <div className="flex gap-2">
            <NewPlanDialog
              memberId={memberId}
              onCreated={(id) => {
                setChosen(id);
                reload();
              }}
            />
            {plan && <ItemDialog planId={plan.id} onAdded={reload} />}
          </div>
        }
        rowProps={(i) => ({ 'data-testid': 'item-row', 'data-title': i.title })}
      />
    </div>
  );
}
