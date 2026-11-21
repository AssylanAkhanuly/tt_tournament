'use client';

/* Правая колонка профиля ✳ (22.11.2026, решения владельца продукта):

   - **Ближайший старт** — ближайший невыполненный старт текущего плана, не
     закончившийся (нет старта — ближайший сбор): сколько дней до него
     крупно, название, даты, город. Берётся из пунктов плана — сбор и старт в
     план попадают только из календаря подготовки, значит даты те же.
   - **Медкарта** — допуск полосой цвета состояния: зелёная — допущен (и до
     какого числа), персиковая — истекает в ближайшие 30 дней (**порог наш**),
     коралловая — истёк, серая — не внесён; ограничения и «Открыть медкарту».
   - **Спортивная карточка** — «Открыть» (психологу). */

import { Button } from '@heroui/react';
import { Brain, CalendarClock, HeartPulse, Tent, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { dmy, type NationalMember, type PlanItem, type TrainingPlan } from '@/entities/national';

import { daysUntil, daysWord, periodLabel, SectionHead, todayIso, type Tone } from './ui';

const EXPIRING_DAYS = 30; // за сколько дней предупреждать об окончании допуска — значение наше

function Block({ title, icon, tone, testId, children }: { title: string; icon: ReactNode; tone: Tone; testId: string; children: ReactNode }) {
  return (
    <section className="flex flex-col border-b border-neutral-200 px-6 py-6 last:border-b-0" data-testid={testId}>
      <SectionHead title={title} icon={icon} tone={tone} />
      {children}
    </section>
  );
}

function nearestEvent(plan: TrainingPlan | null): PlanItem | null {
  if (!plan) return null;
  const today = todayIso();
  const open = plan.items.filter((i) => i.state !== 'done' && i.period && i.period.to >= today).sort((a, b) => a.period!.from.localeCompare(b.period!.from));
  return open.find((i) => i.kind === 'start') ?? open.find((i) => i.kind === 'camp') ?? null;
}

export function NextStart({ plan }: { plan: TrainingPlan | null }) {
  const item = nearestEvent(plan);
  const isStart = item?.kind !== 'camp';
  if (!item)
    return (
      <Block title="Ближайший старт" icon={<Trophy size={18} />} tone="violet" testId="profile-next">
        <p className="m-0 text-[13px] text-neutral-500">Стартов в плане нет</p>
      </Block>
    );
  const days = daysUntil(item.period!.from);
  const when = days > 0 ? 'через ' + daysWord(days) : days === 0 ? 'сегодня' : 'идёт';
  return (
    <Block
      title={isStart ? 'Ближайший старт' : 'Ближайший сбор'}
      icon={isStart ? <Trophy size={18} /> : <Tent size={18} />}
      tone={isStart ? 'violet' : 'teal'}
      testId="profile-next"
    >
      <div
        className={
          'flex flex-col gap-1 rounded-xl px-4 py-4 ' +
          (isStart ? 'bg-[color-mix(in_srgb,var(--color-qtt-violet)_8%,white)]' : 'bg-[color-mix(in_srgb,var(--color-qtt-teal)_8%,white)]')
        }
      >
        <span className={'text-[26px] leading-tight font-semibold ' + (isStart ? 'text-qtt-violet' : 'text-qtt-teal')} data-testid="profile-next-when">
          {when}
        </span>
        <span className="text-[15px] font-semibold">{item.title}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
          <CalendarClock size={14} />
          {periodLabel(item.period)}
          {item.city ? ' · ' + item.city : ''}
        </span>
      </div>
    </Block>
  );
}

export function MedStatus({ member, onOpenMedical }: { member: NationalMember; onOpenMedical: () => void }) {
  const { status, until } = member.clearance;
  const left = status === 'ok' && until ? daysUntil(until) : null;
  const tone =
    status === 'expired'
      ? { band: 'bg-[color-mix(in_srgb,var(--color-qtt-coral)_12%,white)] text-[color-mix(in_srgb,var(--color-qtt-coral)_70%,black)]', title: 'Допуск истёк', sub: dmy(until) }
      : status === 'none'
        ? { band: 'bg-neutral-100 text-neutral-600', title: 'Допуск не внесён', sub: '' }
        : left !== null && left <= EXPIRING_DAYS
          ? { band: 'bg-[color-mix(in_srgb,var(--color-qtt-peach)_20%,white)] text-[color-mix(in_srgb,var(--color-qtt-peach)_60%,black)]', title: 'Допуск истекает', sub: 'до ' + dmy(until) + ' · через ' + daysWord(left) }
          : { band: 'bg-green-50 text-green-800', title: 'Допущен', sub: 'до ' + dmy(until) + (left !== null ? ' · ещё ' + daysWord(left) : '') };
  return (
    <Block title="Медкарта" icon={<HeartPulse size={18} />} tone="coral" testId="profile-medical">
      <div className={'flex flex-col gap-0.5 rounded-xl px-4 py-3.5 ' + tone.band} data-testid="clearance" data-status={status}>
        <span className="text-[17px] font-semibold">{tone.title}</span>
        {tone.sub && <span className="text-[13px] opacity-80">{tone.sub}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[14px]">
        <span className="text-neutral-500">Ограничения нагрузки</span>
        <span className="font-medium tabular-nums" data-testid="profile-limits">
          {member.limits || 'Нет'}
        </span>
      </div>
      <Button className="mt-5 w-full rounded-xl" onPress={onOpenMedical} data-testid="profile-medical-open">
        <HeartPulse size={16} /> Открыть медкарту
      </Button>
    </Block>
  );
}

export function SportLink({ onOpen }: { onOpen: () => void }) {
  return (
    <Block title="Спортивная карточка" icon={<Brain size={18} />} tone="violet" testId="profile-sport">
      <Button className="w-full rounded-xl" onPress={onOpen} data-testid="profile-sport-open">
        <Brain size={16} /> Открыть
      </Button>
    </Block>
  );
}
