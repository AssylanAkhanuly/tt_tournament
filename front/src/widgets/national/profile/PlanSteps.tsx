'use client';

/* «Пункты подготовки» профиля — вертикальный степпер ✳ (22.11.2026, образец
   владельца продукта). Пункты текущего плана по датам; круг — цвет и значок
   вида (работа — синий, сбор — бирюзовый, старт — фиолетовый): выполненный —
   залитый с галочкой, текущий (первый невыполненный и не просроченный) —
   обведённый, просроченный — коралловый, будущие — серые; линия — цвет
   пройденного шага, после будущих — серая. Окно — с последнего выполненного
   перед текущим, не больше пяти. Состояние считает сервер, как на доске.
   В заголовке — кольцо доли выполненного. */

import { Button, Spinner } from '@heroui/react';
import { Check, CircleAlert, Dumbbell, Tent, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { PLAN_ITEM_LABEL, type PlanItem, type PlanItemKind, type TrainingPlan } from '@/entities/national';

import { Panel, periodLabel, ProgressRing } from './ui';

type Step = 'done' | 'current' | 'overdue' | 'todo';

const startOf = (i: PlanItem) => i.period?.from ?? '9999';

function steps(items: PlanItem[]) {
  const sorted = [...items].sort((a, b) => startOf(a).localeCompare(startOf(b)));
  let current = false;
  const all = sorted.map((item) => {
    let step: Step = item.state === 'done' ? 'done' : item.state === 'overdue' ? 'overdue' : 'todo';
    if (step === 'todo' && !current) {
      step = 'current';
      current = true;
    }
    return { item, step };
  });
  const firstOpen = all.findIndex((s) => s.step !== 'done');
  const from = firstOpen < 0 ? Math.max(0, all.length - 5) : Math.max(0, firstOpen - 1);
  return all.slice(from, from + 5);
}

export const KIND_ICON: Record<PlanItemKind, (size: number) => ReactNode> = {
  work: (s) => <Dumbbell size={s} />,
  camp: (s) => <Tent size={s} />,
  start: (s) => <Trophy size={s} />,
};
const KIND_STEP: Record<PlanItemKind, { done: string; current: string; line: string }> = {
  work: { done: 'bg-qtt-blue text-white', current: 'border-2 border-qtt-blue bg-white text-qtt-blue', line: 'bg-qtt-blue' },
  camp: { done: 'bg-qtt-teal text-white', current: 'border-2 border-qtt-teal bg-white text-qtt-teal', line: 'bg-qtt-teal' },
  start: { done: 'bg-qtt-violet text-white', current: 'border-2 border-qtt-violet bg-white text-qtt-violet', line: 'bg-qtt-violet' },
};

function circle(kind: PlanItemKind, step: Step) {
  if (step === 'done') return { cls: KIND_STEP[kind].done, icon: <Check size={16} strokeWidth={3} /> };
  if (step === 'overdue') return { cls: 'border-2 border-qtt-coral bg-white text-qtt-coral', icon: <CircleAlert size={16} /> };
  if (step === 'current') return { cls: KIND_STEP[kind].current, icon: KIND_ICON[kind](16) };
  return { cls: 'border-2 border-neutral-200 bg-white text-neutral-400', icon: KIND_ICON[kind](15) };
}

export function PlanSteps({ plans, error, plan, onOpenPlan, onOpenHistory }: {
  plans: TrainingPlan[] | null;
  error: string | null;
  plan: TrainingPlan | null;
  onOpenPlan: () => void;
  onOpenHistory: () => void;
}) {
  const list = plan ? steps(plan.items) : [];
  return (
    <Panel title="Пункты подготовки" action={plan && <ProgressRing done={plan.done} total={plan.total} />} testId="profile-points">
      {!plans ? (
        error ? <p className="m-0 text-[13px] text-red-600">{error}</p> : <Spinner size="sm" />
      ) : list.length === 0 ? (
        <p className="m-0 text-[13px] text-neutral-500">{plan ? 'Пунктов нет' : 'Плана нет'}</p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {list.map(({ item: i, step }, n) => {
            const last = n === list.length - 1;
            const c = circle(i.kind, step);
            const line = step === 'todo' ? 'bg-neutral-200' : step === 'overdue' ? 'bg-qtt-coral' : KIND_STEP[i.kind].line;
            return (
              <li key={i.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4" data-testid="profile-point" data-title={i.title} data-state={i.state} data-step={step}>
                <div className="flex flex-col items-center">
                  <span className={'grid size-9 shrink-0 place-items-center rounded-full ' + c.cls}>{c.icon}</span>
                  {!last && <span aria-hidden className={'mt-1 w-0.5 flex-1 rounded-full ' + line} />}
                </div>
                <button type="button" onClick={onOpenPlan} className={'group flex min-w-0 flex-col pt-0.5 text-left ' + (last ? '' : 'pb-6')}>
                  <span className="text-[12px] text-neutral-500 tabular-nums">{periodLabel(i.period)}</span>
                  <span className={'truncate text-[15px] leading-snug font-semibold group-hover:underline ' + (step === 'done' ? 'text-neutral-500' : '')}>{i.title}</span>
                  <span className={'text-[12.5px] ' + (step === 'overdue' ? 'text-[color-mix(in_srgb,var(--color-qtt-coral)_75%,black)]' : 'text-neutral-500')}>
                    {PLAN_ITEM_LABEL[i.kind]}
                    {i.city ? ' · ' + i.city : ''}
                    {step === 'done' ? ' · выполнено' : step === 'overdue' ? ' · просрочено' : step === 'current' && i.state === 'live' ? ' · идёт' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {plans && (
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Button variant="tertiary" className="rounded-xl" onPress={onOpenPlan} data-testid="profile-plan-open">
            {plan ? 'Весь план' : 'План подготовки'}
          </Button>
          <Button variant="tertiary" className="rounded-xl" onPress={onOpenHistory} data-testid="profile-history-open">
            История планов
          </Button>
        </div>
      )}
    </Panel>
  );
}
