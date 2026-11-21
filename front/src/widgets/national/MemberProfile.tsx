'use client';

/* Профиль члена сборной ✳ (22.11.2026, образец владельца продукта — экран
   «Mon profil»: шапка с фото и строками сведений, «мои курсы» — пунктами
   подготовки, «недавняя активность» — рейтингом, сбоку — ссылка на медкарту).

   - **Шапка** — фото (нет снимка — инициалы) с короной члена сборной;
     сведения строками со значками в цветных плитках (доп. цвета брендбука
     `qtt-*`, значки lucide): состав, группа, личный тренер — штабу значение
     с меню выбора («Состав: Основной ▾», `ValueSelect`), допуск, в сборной
     с, регион, дата рождения, почта, телефон; рейтинг крупно, место в листе
     и штабу «Убрать из сборной».
   - **Пункты подготовки** — вертикальный степпер по образцу владельца
     продукта: пункты текущего плана по датам; круг — цвет вида (работа —
     синий, сбор — бирюзовый, старт — фиолетовый) и его значок; выполненный —
     залитый с галочкой, текущий — обведённый со значком вида, просроченный —
     коралловый, будущие — серые; линия между шагами — цвет пройденного шага,
     после будущих — серая. Над названием — даты, под ним — вид. Окно — с
     последнего выполненного перед текущим, не больше пяти. Состояние считает
     сервер, как на доске. «Весь план» и «История планов» — разделы карточки.
   - **Медкарта** — допуск, число ограничений и «Открыть медкарту»;
     **Спортивная карточка** — «Открыть» (психологу).
   - **Рейтинг** — график Chart.js (`Line` кита, тот же, что в карточке
     рейтинга): значение после каждой записи, точка — цветом изменения,
     подсказка — турнир, соперник, счёт.

   Вкладок разделов нет ✳ (22.11.2026, решение владельца продукта): разделы
   открываются из блоков профиля. Блок показывается тому, кому сервер открыл
   раздел (`member.access`). От края до края, блоки разделены чертой. */

import { Button, Spinner, Tooltip } from '@heroui/react';
import {
  Brain,
  Cake,
  CalendarCheck,
  Check,
  CircleAlert,
  Crown,
  Dumbbell,
  HeartPulse,
  Layers,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Tent,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

import {
  AGE_GROUP_LABEL,
  dmy,
  fetchPlans,
  PLAN_ITEM_LABEL,
  SQUAD_LABEL,
  useLoad,
  type AgeGroup,
  type NationalMember,
  type PlanItem,
  type PlanItemKind,
  type Squad,
} from '@/entities/national';
import { num2, plainLabel, signed2, useRatingCard } from '@/entities/rating';
import { Line } from '@/shared/kit/app';

import { NO_COACH, RemoveMemberButton, useMemberEdit, ValueSelect } from './MemberControls';
import { AGE_GROUPS, ClearanceChip, SQUADS } from './RosterTable';

/* Плитки значков — доп. цвета брендбука. Классы целиком: Tailwind собирает
   только то, что видит в тексте. */
type Tone = 'blue' | 'teal' | 'violet' | 'coral' | 'peach' | 'lime' | 'steel';
const TILE: Record<Tone, string> = {
  blue: 'bg-[color-mix(in_srgb,var(--color-qtt-blue)_12%,white)] text-qtt-blue',
  teal: 'bg-[color-mix(in_srgb,var(--color-qtt-teal)_12%,white)] text-qtt-teal',
  violet: 'bg-[color-mix(in_srgb,var(--color-qtt-violet)_12%,white)] text-qtt-violet',
  coral: 'bg-[color-mix(in_srgb,var(--color-qtt-coral)_12%,white)] text-qtt-coral',
  peach: 'bg-[color-mix(in_srgb,var(--color-qtt-peach)_18%,white)] text-[color-mix(in_srgb,var(--color-qtt-peach)_70%,black)]',
  lime: 'bg-[color-mix(in_srgb,var(--color-qtt-lime)_22%,white)] text-[color-mix(in_srgb,var(--color-qtt-lime)_55%,black)]',
  steel: 'bg-[color-mix(in_srgb,var(--color-qtt-steel)_16%,white)] text-[color-mix(in_srgb,var(--color-qtt-steel)_75%,black)]',
};

function IconTile({ tone, children, size = 'sm' }: { tone: Tone; children: ReactNode; size?: 'sm' | 'md' }) {
  return <span className={'grid shrink-0 place-items-center rounded-lg ' + (size === 'md' ? 'size-9' : 'size-7') + ' ' + TILE[tone]}>{children}</span>;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('')
    .toUpperCase();

function SectionHead({ title, icon, tone, action }: { title: string; icon: ReactNode; tone: Tone; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="m-0 flex items-center gap-2.5 text-[17px] font-semibold">
        <IconTile tone={tone} size="md">
          {icon}
        </IconTile>
        {title}
      </h2>
      {action}
    </div>
  );
}

function Fact({ icon, tone, label, children }: { icon: ReactNode; tone: Tone; label: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-3 text-[14px]">
      <IconTile tone={tone}>{icon}</IconTile>
      <span className="shrink-0 text-neutral-500">{label}:</span>
      <span className="flex min-w-0 items-center font-medium">{children}</span>
    </li>
  );
}

function Header({ member, place, canEdit, onChanged, onRemoved }: {
  member: NationalMember;
  place: { place: number; of: number } | null;
  canEdit: boolean;
  onChanged: () => void;
  onRemoved: () => void;
}) {
  const p = member.person;
  const pr = member.profile;
  const edit = useMemberEdit(canEdit);
  const coach = member.personalCoach?.name ?? 'Без личного тренера';
  return (
    <section className="flex flex-wrap items-start gap-x-10 gap-y-6 border-b border-neutral-200 px-6 py-7" data-testid="member-strip">
      {/* Корона — член национальной сборной ✳ (22.11.2026, решение владельца продукта). */}
      <div className="relative shrink-0">
        <div className="grid size-36 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-qtt-violet)_10%,white)] ring-4 ring-[color-mix(in_srgb,var(--color-qtt-violet)_6%,white)]">
          {pr?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pr.avatar} alt={p.name} className="size-full object-cover" data-testid="member-photo" />
          ) : (
            <span className="text-[40px] font-semibold text-qtt-violet" data-testid="member-photo">
              {initials(p.name)}
            </span>
          )}
        </div>
        <Tooltip>
          <Tooltip.Trigger
            aria-label="В национальной сборной"
            className="absolute -top-1 right-1 grid size-10 place-items-center rounded-full bg-white text-qtt-peach shadow-md ring-2 ring-white"
            data-testid="member-crown"
          >
            <Crown size={20} className="fill-current" />
          </Tooltip.Trigger>
          <Tooltip.Content>В национальной сборной</Tooltip.Content>
        </Tooltip>
      </div>
      <div className="flex min-w-[18rem] flex-1 flex-col gap-3">
        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-3 p-0 xl:grid-cols-2">
          <Fact icon={<Users size={15} />} tone="blue" label="Состав">
            {canEdit ? (
              <ValueSelect
                label="Состав"
                value={member.squad}
                text={SQUAD_LABEL[member.squad]}
                options={SQUADS}
                onChange={(k) => void edit.run(() => edit.update(member.id, { squad: k as Squad }), onChanged)}
                testId="strip-squad"
              />
            ) : (
              SQUAD_LABEL[member.squad]
            )}
          </Fact>
          <Fact icon={<Layers size={15} />} tone="teal" label="Группа">
            {canEdit ? (
              <ValueSelect
                label="Возрастная группа"
                value={member.ageGroup}
                text={AGE_GROUP_LABEL[member.ageGroup]}
                options={AGE_GROUPS}
                onChange={(k) => void edit.run(() => edit.update(member.id, { ageGroup: k as AgeGroup }), onChanged)}
                testId="strip-age-group"
              />
            ) : (
              AGE_GROUP_LABEL[member.ageGroup]
            )}
          </Fact>
          <Fact icon={<UserRound size={15} />} tone="violet" label="Личный тренер">
            {canEdit ? (
              <ValueSelect
                label="Личный тренер"
                value={member.personalCoach?.id ?? NO_COACH}
                text={coach}
                options={[{ id: NO_COACH, label: 'Без личного тренера' }, ...edit.coaches.map((c) => ({ id: c.id, label: c.name }))]}
                onChange={(k) => void edit.run(() => edit.update(member.id, { personalCoachId: k === NO_COACH ? null : k }), onChanged)}
                testId="strip-personal-coach"
              />
            ) : (
              coach
            )}
          </Fact>
          <Fact icon={<ShieldCheck size={15} />} tone="lime" label="Допуск">
            <ClearanceChip clearance={member.clearance} />
          </Fact>
          {pr && (
            <Fact icon={<CalendarCheck size={15} />} tone="steel" label="В сборной с">
              {dmy(pr.joined)}
            </Fact>
          )}
          {p.region && (
            <Fact icon={<MapPin size={15} />} tone="coral" label="Регион">
              {p.region}
            </Fact>
          )}
          {(pr?.birthDate || p.birthYear) && (
            <Fact icon={<Cake size={15} />} tone="peach" label="Дата рождения">
              {pr?.birthDate ? dmy(pr.birthDate) : p.birthYear}
            </Fact>
          )}
          {pr?.email && (
            <Fact icon={<Mail size={15} />} tone="blue" label="Эл. почта">
              <span className="truncate">{pr.email}</span>
            </Fact>
          )}
          {pr?.phone && (
            <Fact icon={<Phone size={15} />} tone="teal" label="Телефон">
              {pr.phone}
            </Fact>
          )}
        </ul>
        {edit.error && <p className="m-0 text-[13px] text-red-600">{edit.error}</p>}
      </div>
      <div className="flex flex-col items-end gap-3" data-testid="member-rating">
        <div className="text-right">
          <div className="text-[40px] leading-none font-semibold tabular-nums">{p.rating ? num2(Number(p.rating)) : '—'}</div>
          <div className="mt-1.5 text-[12.5px] text-neutral-500">рейтинг{place ? ` · ${place.place} место из ${place.of}` : ''}</div>
        </div>
        {canEdit && <RemoveMemberButton member={member} onRemove={onRemoved} />}
      </div>
    </section>
  );
}

type Step = 'done' | 'current' | 'overdue' | 'todo';

/** Шаги степпера: по датам (без срока — в конце); выполненный — `done`,
 *  просроченный — `overdue`, первый из остальных — `current`, дальше `todo`.
 *  Окно — с последнего выполненного перед текущим, не больше пяти. */
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

const KIND_ICON: Record<PlanItemKind, (size: number) => ReactNode> = {
  work: (s) => <Dumbbell size={s} />,
  camp: (s) => <Tent size={s} />,
  start: (s) => <Trophy size={s} />,
};
/* Круг и линия по виду пункта — доп. цвета брендбука. */
const KIND_STEP: Record<PlanItemKind, { done: string; current: string; line: string }> = {
  work: { done: 'bg-qtt-blue text-white', current: 'border-2 border-qtt-blue bg-white text-qtt-blue', line: 'bg-qtt-blue' },
  camp: { done: 'bg-qtt-teal text-white', current: 'border-2 border-qtt-teal bg-white text-qtt-teal', line: 'bg-qtt-teal' },
  start: { done: 'bg-qtt-violet text-white', current: 'border-2 border-qtt-violet bg-white text-qtt-violet', line: 'bg-qtt-violet' },
};
const OVERDUE = 'border-2 border-qtt-coral bg-white text-qtt-coral';
const TODO = 'border-2 border-neutral-200 bg-white text-neutral-400';

function stepCircle(kind: PlanItemKind, step: Step) {
  if (step === 'done') return { cls: KIND_STEP[kind].done, icon: <Check size={16} strokeWidth={3} /> };
  if (step === 'overdue') return { cls: OVERDUE, icon: <CircleAlert size={16} /> };
  if (step === 'current') return { cls: KIND_STEP[kind].current, icon: KIND_ICON[kind](16) };
  return { cls: TODO, icon: KIND_ICON[kind](15) };
}

function PlanPoints({ member, onOpenPlan, onOpenHistory }: { member: NationalMember; onOpenPlan: () => void; onOpenHistory: () => void }) {
  const plans = useLoad(() => fetchPlans(member.id), member.id);
  const plan = plans.data && (plans.data.find((p) => p.id === member.plan?.planId) ?? plans.data[0]);
  const list = plan ? steps(plan.items) : [];
  return (
    <section className="px-6 py-6 lg:border-r lg:border-neutral-200" data-testid="profile-points">
      <SectionHead
        title="Пункты подготовки"
        icon={<ListChecks size={18} />}
        tone="blue"
        action={
          plan && (
            <span className="text-[13px] text-neutral-500 tabular-nums">
              {plan.done} из {plan.total}
            </span>
          )
        }
      />
      {!plans.data ? (
        plans.error ? <p className="m-0 text-[13px] text-red-600">{plans.error}</p> : <Spinner size="sm" />
      ) : list.length === 0 ? (
        <p className="m-0 text-[13px] text-neutral-500">{plan ? 'Пунктов нет' : 'Плана нет'}</p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {list.map(({ item: i, step }, n) => {
            const last = n === list.length - 1;
            const circle = stepCircle(i.kind, step);
            const dates = !i.period ? 'Без срока' : i.period.from === i.period.to ? dmy(i.period.from) : dmy(i.period.from) + ' — ' + dmy(i.period.to);
            // Линия после шага — цвет пройденного (выполненный, текущий), коралловая
            // после просроченного, серая после будущих.
            const line = step === 'todo' ? 'bg-neutral-200' : step === 'overdue' ? 'bg-qtt-coral' : KIND_STEP[i.kind].line;
            return (
              <li key={i.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4" data-testid="profile-point" data-title={i.title} data-state={i.state} data-step={step}>
                <div className="flex flex-col items-center">
                  <span className={'grid size-9 shrink-0 place-items-center rounded-full ' + circle.cls}>{circle.icon}</span>
                  {!last && <span aria-hidden className={'mt-1 w-0.5 flex-1 rounded-full ' + line} />}
                </div>
                <button type="button" onClick={onOpenPlan} className={'group flex min-w-0 flex-col pt-0.5 text-left ' + (last ? '' : 'pb-6')}>
                  <span className="text-[12px] text-neutral-500 tabular-nums">{dates}</span>
                  <span className={'truncate text-[15px] leading-snug font-semibold group-hover:underline ' + (step === 'done' ? 'text-neutral-500' : '')}>{i.title}</span>
                  <span className={'text-[12.5px] ' + (step === 'overdue' ? 'text-[color-mix(in_srgb,var(--color-qtt-coral)_75%,black)]' : 'text-neutral-500')}>
                    {PLAN_ITEM_LABEL[i.kind]}
                    {step === 'done' ? ' · выполнено' : step === 'overdue' ? ' · просрочено' : step === 'current' && i.state === 'live' ? ' · идёт' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {plans.data && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="tertiary" className="rounded-xl" onPress={onOpenPlan} data-testid="profile-plan-open">
            {plan ? 'Весь план' : 'План подготовки'}
          </Button>
          <Button variant="tertiary" className="rounded-xl" onPress={onOpenHistory} data-testid="profile-history-open">
            История планов
          </Button>
        </div>
      )}
    </section>
  );
}

function SideBlock({ title, icon, tone, testId, children }: { title: string; icon: ReactNode; tone: Tone; testId: string; children: ReactNode }) {
  return (
    <section className="flex flex-col border-b border-neutral-200 px-6 py-6 last:border-b-0" data-testid={testId}>
      <SectionHead title={title} icon={icon} tone={tone} />
      {children}
    </section>
  );
}

function MedSummary({ member, onOpenMedical }: { member: NationalMember; onOpenMedical: () => void }) {
  return (
    <SideBlock title="Медкарта" icon={<HeartPulse size={18} />} tone="coral" testId="profile-medical">
      <dl className="m-0 flex flex-col gap-3 text-[14px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-neutral-500">Допуск</dt>
          <dd className="m-0">
            <ClearanceChip clearance={member.clearance} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-neutral-500">Ограничения нагрузки</dt>
          <dd className="m-0 font-medium tabular-nums">{member.limits || 'Нет'}</dd>
        </div>
      </dl>
      <Button className="mt-5 w-full rounded-xl" onPress={onOpenMedical} data-testid="profile-medical-open">
        <HeartPulse size={16} /> Открыть медкарту
      </Button>
    </SideBlock>
  );
}

function SportLink({ onOpen }: { onOpen: () => void }) {
  return (
    <SideBlock title="Спортивная карточка" icon={<Brain size={18} />} tone="violet" testId="profile-sport">
      <Button className="w-full rounded-xl" onPress={onOpen} data-testid="profile-sport-open">
        <Brain size={16} /> Открыть
      </Button>
    </SideBlock>
  );
}

const ruDate = (iso: string) => dmy(iso.slice(0, 10));

function RatingChart({ userId, card }: { userId: string; card: ReturnType<typeof useRatingCard> }) {
  const points = (card.data?.history ?? [])
    .filter((h) => !h.isReverted)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((h) => ({
      t: ruDate(h.occurredAt),
      v: h.after,
      note: h.tournamentName ?? plainLabel(h.kindLabel),
      tone: h.delta > 0 ? ('up' as const) : h.delta < 0 ? ('down' as const) : undefined,
      lines: [
        ruDate(h.occurredAt),
        'рейтинг ' + num2(h.after) + (h.kind === 'start' ? '' : ' · ' + signed2(h.delta)),
        ...(h.opponentName ? [h.opponentName + (h.score ? ' · ' + h.score : '')] : []),
        ...(h.reason && h.kind !== 'start' ? [plainLabel(h.reason)] : []),
      ],
    }));
  return (
    <section className="px-6 py-6" data-testid="profile-rating">
      <SectionHead
        title="Рейтинг"
        icon={<TrendingUp size={18} />}
        tone="teal"
        action={
          card.data && (
            <a href={`/rating/${userId}`} className="text-[13px] font-medium text-brand-600 hover:underline" data-testid="profile-rating-open">
              Вся история
            </a>
          )
        }
      />
      {card.loading ? (
        <Spinner size="sm" />
      ) : card.error ? (
        <p className="m-0 text-[13px] text-neutral-500">Рейтинговой карточки нет</p>
      ) : points.length === 0 ? (
        <p className="m-0 text-[13px] text-neutral-500">Изменений нет</p>
      ) : (
        <div data-testid="profile-rating-chart" data-points={points.length}>
          <Line points={points} label="Рейтинг" height={220} />
        </div>
      )}
    </section>
  );
}

export function MemberProfile({
  member,
  onOpenPlan,
  onOpenHistory,
  onOpenMedical,
  onOpenSport,
  onChanged,
  onRemoved,
}: {
  member: NationalMember;
  onOpenPlan: () => void;
  onOpenHistory: () => void;
  onOpenMedical: () => void;
  onOpenSport: () => void;
  onChanged: () => void;
  onRemoved: () => void;
}) {
  const card = useRatingCard(member.person.id);
  const plans = member.access.plans;
  const medical = member.access.medical !== null;
  const sport = member.access.sport;
  const side = medical || sport;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto [&>*]:shrink-0" data-testid="member-profile">
      <Header
        member={member}
        place={card.data ? { place: card.data.place, of: card.data.of } : null}
        canEdit={member.access.roster}
        onChanged={onChanged}
        onRemoved={onRemoved}
      />
      {(plans || side) && (
        <div className={'grid border-b border-neutral-200 ' + (plans && side ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : '')}>
          {plans && <PlanPoints member={member} onOpenPlan={onOpenPlan} onOpenHistory={onOpenHistory} />}
          {side && (
            <div className="flex flex-col">
              {medical && <MedSummary member={member} onOpenMedical={onOpenMedical} />}
              {sport && <SportLink onOpen={onOpenSport} />}
            </div>
          )}
        </div>
      )}
      <RatingChart userId={member.person.id} card={card} />
    </div>
  );
}
