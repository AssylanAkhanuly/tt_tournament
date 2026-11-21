'use client';

/* Профиль члена сборной ✳ (22.11.2026, образец владельца продукта — экран
   «Mon profil»: шапка с фото и строками сведений, «мои курсы» — пунктами
   подготовки, «недавняя активность» — рейтингом, сбоку — ссылка на медкарту).

   - **Шапка** — фото (нет снимка — инициалы), состав, группа и допуск,
     сведения строками со значками (в сборной с, регион, дата рождения,
     почта, телефон, личный тренер), рейтинг крупно и место в листе.
     Главному тренеру под ней — правка (`MemberControls`).
   - **Пункты подготовки** — текущий план временной лентой: ближайшие
     невыполненные сначала, вид — цветом брендбука, состояние — меткой (его
     считает сервер, как на доске); строка и «Весь план» — вкладка плана.
   - **Медкарта** — допуск, число ограничений и «Открыть медкарту».
   - **Рейтинг** — последние изменения из рейтинговой карточки; строка ведёт
     в карточку рейтинга.

   Блок показывается тому, кому сервер открыл раздел (`member.access`). От
   края до края, блоки разделены чертой — без карточек-обёрток. */

import { Button, Chip, Spinner } from '@heroui/react';
import {
  Cake,
  CalendarCheck,
  ChevronRight,
  Dumbbell,
  Flag,
  HeartPulse,
  Mail,
  MapPin,
  Merge,
  PenLine,
  Phone,
  Swords,
  Tent,
  Trophy,
  Undo2,
  UserRound,
  UserX,
} from 'lucide-react';
import type { ReactNode } from 'react';

import {
  AGE_GROUP_LABEL,
  dmy,
  fetchPlans,
  PLAN_ITEM_LABEL,
  SQUAD_LABEL,
  useLoad,
  type BoardItemState,
  type NationalMember,
  type PlanItem,
  type PlanItemKind,
} from '@/entities/national';
import { num2, plainLabel, signed2, useRatingCard, type RatingEntry, type RatingEntryKind } from '@/entities/rating';

import { MemberControls } from './MemberControls';
import { ClearanceChip } from './RosterTable';

const KIND_ICON: Record<PlanItemKind, ReactNode> = { work: <Dumbbell size={18} />, camp: <Tent size={18} />, start: <Trophy size={18} /> };
/* Классы целиком: Tailwind собирает только то, что видит в тексте. */
const KIND_TONE: Record<PlanItemKind, { tile: string; icon: string; dot: string; ring: string }> = {
  work: {
    tile: 'bg-[color-mix(in_srgb,var(--color-qtt-blue)_7%,white)]',
    icon: 'text-qtt-blue',
    dot: 'bg-qtt-blue',
    ring: 'border-qtt-blue',
  },
  camp: {
    tile: 'bg-[color-mix(in_srgb,var(--color-qtt-teal)_7%,white)]',
    icon: 'text-qtt-teal',
    dot: 'bg-qtt-teal',
    ring: 'border-qtt-teal',
  },
  start: {
    tile: 'bg-[color-mix(in_srgb,var(--color-qtt-violet)_7%,white)]',
    icon: 'text-qtt-violet',
    dot: 'bg-qtt-violet',
    ring: 'border-qtt-violet',
  },
};
const STATE_CHIP: Record<BoardItemState, { label: string; color: 'success' | 'accent' | 'danger' | 'default' }> = {
  done: { label: 'Выполнено', color: 'success' },
  live: { label: 'Идёт', color: 'accent' },
  overdue: { label: 'Просрочено', color: 'danger' },
  planned: { label: 'Запланировано', color: 'default' },
};
const ENTRY_ICON: Record<RatingEntryKind, ReactNode> = {
  start: <Flag size={18} />,
  match: <Swords size={18} />,
  prize: <Trophy size={18} />,
  no_show: <UserX size={18} />,
  correction: <PenLine size={18} />,
  void: <Undo2 size={18} />,
  merge: <Merge size={18} />,
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('')
    .toUpperCase();

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** «Сегодня», «Вчера» или дата — как в образце. */
function when(iso: string) {
  const day = iso.slice(0, 10);
  const now = new Date();
  if (day === localIso(now)) return 'Сегодня';
  if (day === localIso(new Date(now.getTime() - 86400000))) return 'Вчера';
  return dmy(day);
}

function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
      {action}
    </div>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-[14px]">
      <span className="text-neutral-500">{icon}</span>
      <span className="text-neutral-500">{label}:</span>
      <span className="min-w-0 truncate font-medium">{children}</span>
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
  return (
    <section className="flex flex-wrap items-start gap-x-10 gap-y-6 border-b border-neutral-200 px-6 py-7" data-testid="member-strip">
      <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-qtt-violet)_10%,white)] ring-4 ring-[color-mix(in_srgb,var(--color-qtt-violet)_6%,white)]">
        {pr?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pr.avatar} alt={p.name} className="size-full object-cover" data-testid="member-photo" />
        ) : (
          <span className="text-[40px] font-semibold text-qtt-violet" data-testid="member-photo">
            {initials(p.name)}
          </span>
        )}
      </div>
      <div className="flex min-w-[16rem] flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="soft">{SQUAD_LABEL[member.squad]} состав</Chip>
          <Chip size="sm" variant="soft">{AGE_GROUP_LABEL[member.ageGroup]}</Chip>
          <ClearanceChip clearance={member.clearance} />
        </div>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {pr && <Fact icon={<CalendarCheck size={16} />} label="В сборной с">{dmy(pr.joined)}</Fact>}
          {p.region && <Fact icon={<MapPin size={16} />} label="Регион">{p.region}</Fact>}
          {(pr?.birthDate || p.birthYear) && (
            <Fact icon={<Cake size={16} />} label="Дата рождения">{pr?.birthDate ? dmy(pr.birthDate) : p.birthYear}</Fact>
          )}
          {pr?.email && <Fact icon={<Mail size={16} />} label="Эл. почта">{pr.email}</Fact>}
          {pr?.phone && <Fact icon={<Phone size={16} />} label="Телефон">{pr.phone}</Fact>}
          {member.personalCoach && <Fact icon={<UserRound size={16} />} label="Личный тренер">{member.personalCoach.name}</Fact>}
        </ul>
      </div>
      <div className="text-right" data-testid="member-rating">
        <div className="text-[40px] leading-none font-semibold tabular-nums">{p.rating ? num2(Number(p.rating)) : '—'}</div>
        <div className="mt-1.5 text-[12.5px] text-neutral-500">рейтинг{place ? ` · ${place.place} место из ${place.of}` : ''}</div>
      </div>
      {canEdit && (
        <div className="w-full">
          <MemberControls member={member} onChanged={onChanged} onRemoved={onRemoved} />
        </div>
      )}
    </section>
  );
}

/** Невыполненные по датам (без срока — после датированных), затем
 *  выполненные, последние сначала; не больше четырёх. */
const startOf = (i: PlanItem) => i.period?.from ?? '9999';
function nearest(items: PlanItem[]) {
  const open = items.filter((i) => i.state !== 'done').sort((a, b) => startOf(a).localeCompare(startOf(b)));
  const done = items.filter((i) => i.state === 'done').sort((a, b) => startOf(b).localeCompare(startOf(a)));
  return [...open, ...done].slice(0, 4);
}

function PlanPoints({ member, onOpenPlan }: { member: NationalMember; onOpenPlan: () => void }) {
  const plans = useLoad(() => fetchPlans(member.id), member.id);
  const plan = plans.data && (plans.data.find((p) => p.id === member.plan?.planId) ?? plans.data[0]);
  const items = plan ? nearest(plan.items) : [];
  return (
    <section className="px-6 py-6 lg:border-r lg:border-neutral-200" data-testid="profile-points">
      <SectionHead
        title="Пункты подготовки"
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
      ) : items.length === 0 ? (
        <p className="m-0 text-[13px] text-neutral-500">{plan ? 'Пунктов нет' : 'Плана нет'}</p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {items.map((i, n) => {
            const tone = KIND_TONE[i.kind];
            const chip = STATE_CHIP[i.state];
            const dates = !i.period ? 'без срока' : i.period.from === i.period.to ? dmy(i.period.from) : dmy(i.period.from) + ' — ' + dmy(i.period.to);
            return (
              <li key={i.id} className="relative flex gap-4 pb-3 last:pb-0" data-testid="profile-point" data-title={i.title} data-state={i.state}>
                {n < items.length - 1 && <span aria-hidden className="absolute top-1/2 left-[11px] h-full w-0.5 bg-neutral-200" />}
                <span aria-hidden className={'z-[1] grid size-6 shrink-0 self-center place-items-center rounded-full border-2 bg-white ' + tone.ring}>
                  <i className={'size-2.5 rounded-full ' + tone.dot} />
                </span>
                <button
                  type="button"
                  onClick={onOpenPlan}
                  className={'flex min-w-0 flex-1 items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-[filter] hover:brightness-[0.98] ' + tone.tile}
                >
                  <span className={'grid size-11 shrink-0 place-items-center rounded-full bg-white ' + tone.icon}>{KIND_ICON[i.kind]}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={'truncate text-[14px] font-medium ' + (i.state === 'done' ? 'text-neutral-500' : '')}>{i.title}</span>
                    <span className="truncate text-[12.5px] text-neutral-500">
                      {PLAN_ITEM_LABEL[i.kind]} · {dates}
                    </span>
                  </span>
                  <Chip size="sm" variant="soft" color={chip.color}>
                    {chip.label}
                  </Chip>
                  <ChevronRight size={16} className="shrink-0 text-neutral-400" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {plan && (
        <div className="mt-5 flex justify-center">
          <Button variant="tertiary" className="rounded-xl" onPress={onOpenPlan} data-testid="profile-plan-open">
            Весь план
          </Button>
        </div>
      )}
    </section>
  );
}

function MedSummary({ member, onOpenMedical }: { member: NationalMember; onOpenMedical: () => void }) {
  return (
    <section className="flex flex-col px-6 py-6" data-testid="profile-medical">
      <SectionHead title="Медкарта" />
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
    </section>
  );
}

function entryText(e: RatingEntry) {
  const title = e.tournamentName ?? plainLabel(e.kindLabel);
  if (e.kind === 'match')
    return { title, sub: [e.won === null ? null : e.won ? 'Победа' : 'Поражение', e.opponentName, e.score].filter(Boolean).join(' · ') };
  return { title, sub: plainLabel(e.reason || e.kindLabel) };
}

function RecentRating({ userId, card }: { userId: string; card: ReturnType<typeof useRatingCard> }) {
  const recent = (card.data?.history ?? []).slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 5);
  return (
    <section className="px-6 py-6" data-testid="profile-rating">
      <SectionHead
        title="Рейтинг"
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
      ) : recent.length === 0 ? (
        <p className="m-0 text-[13px] text-neutral-500">Изменений нет</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {recent.map((e) => {
            const t = entryText(e);
            return (
              <li key={e.id} className="border-b border-neutral-100 last:border-b-0" data-testid="profile-rating-row">
                <a href={`/rating/${userId}`} className="-mx-6 flex items-center gap-4 px-6 py-3 hover:bg-neutral-50">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">{ENTRY_ICON[e.kind]}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] font-medium">{t.title}</span>
                    <span className="truncate text-[12.5px] text-neutral-500">{t.sub}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className={'text-[14px] font-semibold tabular-nums ' + (e.delta > 0 ? 'text-green-700' : e.delta < 0 ? 'text-red-600' : 'text-neutral-500')}>
                      {signed2(e.delta)}
                    </span>
                    <span className="text-[12px] text-neutral-500">{when(e.occurredAt)}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-neutral-400" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function MemberProfile({
  member,
  onOpenPlan,
  onOpenMedical,
  onChanged,
  onRemoved,
}: {
  member: NationalMember;
  onOpenPlan: () => void;
  onOpenMedical: () => void;
  onChanged: () => void;
  onRemoved: () => void;
}) {
  const card = useRatingCard(member.person.id);
  const plans = member.access.plans;
  const medical = member.access.medical !== null;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto [&>*]:shrink-0" data-testid="member-profile">
      <Header
        member={member}
        place={card.data ? { place: card.data.place, of: card.data.of } : null}
        canEdit={member.access.roster}
        onChanged={onChanged}
        onRemoved={onRemoved}
      />
      {(plans || medical) && (
        <div className={'grid border-b border-neutral-200 ' + (plans && medical ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : '')}>
          {plans && <PlanPoints member={member} onOpenPlan={onOpenPlan} />}
          {medical && <MedSummary member={member} onOpenMedical={onOpenMedical} />}
        </div>
      )}
      <RecentRating userId={member.person.id} card={card} />
    </div>
  );
}
