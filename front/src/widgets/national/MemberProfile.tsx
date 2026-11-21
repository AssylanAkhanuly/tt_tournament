'use client';

/* Профиль члена сборной ✳ (22.11.2026, образец владельца продукта — экран
   «Mon profil»; доработки владельца продукта того же дня). Сверху вниз:

   - **Шапка** — полоса мягкого градиента доп. цветов брендбука, на ней фото
     (нет снимка — инициалы) с кольцом цвета допуска (зелёное — допущен,
     коралловое — истёк, серое — не внесён) и короной члена сборной; имя
     крупно (заголовка страницы над профилем нет — имя здесь); регион, группа
     и состав — полями ниже, а не подписью под именем; справа круглые кнопки «написать» и «позвонить» и штабу
     «Убрать из сборной». Ниже — сведения строками «подпись: значение» без
     значков (значки — только где нужны: шаги, кнопки связи, корона): состав,
     группа, личный тренер (штабу — с меню выбора, `ValueSelect`), в сборной
     с, дата рождения, почта, телефон.
   - **Полоса показателей** — рейтинг, место в листе, матчей, победы и
     поражения, доля побед, выполнение плана кольцом.
   - **Пункты подготовки** (`profile/PlanSteps`) и правая колонка
     (`profile/SideBlocks`): личные встречи, медкарта полосой цвета допуска,
     спортивная карточка.
   - **Рейтинг** (`profile/RatingBlock`) — последние пять матчей и график с
     выбором периода.

   Вкладок разделов нет: разделы открываются из блоков. Блок показывается
   тому, кому сервер открыл раздел (`member.access`). От края до края, блоки
   разделены чертой. */

import { Tooltip } from '@heroui/react';
import { Crown, Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  AGE_GROUP_LABEL,
  dmy,
  fetchPlans,
  SQUAD_LABEL,
  useLoad,
  type AgeGroup,
  type NationalMember,
  type Squad,
} from '@/entities/national';
import { num2, useRatingCard } from '@/entities/rating';

import { NO_COACH, RemoveMemberButton, useMemberEdit, ValueSelect } from './MemberControls';
import { PlanSteps } from './profile/PlanSteps';
import { RatingBlock } from './profile/RatingBlock';
import { HeadToHead, MedStatus, SportLink } from './profile/SideBlocks';
import { ProgressRing } from './profile/ui';
import { AGE_GROUPS, SQUADS } from './RosterTable';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('')
    .toUpperCase();

/* Кольцо фото — цвет допуска. Классы целиком. */
const RING = { ok: 'ring-green-500', expired: 'ring-qtt-coral', none: 'ring-neutral-200' } as const;

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-2 text-[14px]">
      <span className="shrink-0 text-neutral-500">{label}:</span>
      <span className="flex min-w-0 items-center font-medium">{children}</span>
    </li>
  );
}

function Contact({ href, label, value, tone, icon, testId }: { href: string; label: string; value: string; tone: string; icon: ReactNode; testId: string }) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <a href={href} aria-label={label + ': ' + value} className={'grid size-10 place-items-center rounded-full text-white shadow-sm hover:brightness-110 ' + tone} data-testid={testId}>
          {icon}
        </a>
      </Tooltip.Trigger>
      <Tooltip.Content>{value}</Tooltip.Content>
    </Tooltip>
  );
}

function Header({ member, canEdit, onChanged, onRemoved }: { member: NationalMember; canEdit: boolean; onChanged: () => void; onRemoved: () => void }) {
  const p = member.person;
  const pr = member.profile;
  const edit = useMemberEdit(canEdit);
  const coach = member.personalCoach?.name ?? 'Без личного тренера';
  return (
    <section className="border-b border-neutral-200" data-testid="member-strip">
      <div
        aria-hidden
        className="h-28 bg-[linear-gradient(115deg,color-mix(in_srgb,var(--color-qtt-sky)_55%,white),color-mix(in_srgb,var(--color-qtt-lilac)_28%,white)_55%,color-mix(in_srgb,var(--color-qtt-peach)_32%,white))]"
      />
      <div className="-mt-14 flex flex-wrap items-end gap-x-6 gap-y-4 px-6">
        {/* Корона — член национальной сборной; кольцо — допуск ✳ (22.11.2026). */}
        <div className="relative shrink-0">
          <div
            className={
              'grid size-32 place-items-center overflow-hidden rounded-full border-4 border-white bg-[color-mix(in_srgb,var(--color-qtt-violet)_10%,white)] ring-4 ' +
              RING[member.clearance.status]
            }
            data-testid="member-photo-ring"
            data-status={member.clearance.status}
          >
            {pr?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pr.avatar} alt={p.name} className="size-full object-cover" data-testid="member-photo" />
            ) : (
              <span className="text-[38px] font-semibold text-qtt-violet" data-testid="member-photo">
                {initials(p.name)}
              </span>
            )}
          </div>
          <Tooltip>
            <Tooltip.Trigger
              aria-label="В национальной сборной"
              className="absolute -top-2 -right-1 grid size-10 place-items-center rounded-full bg-white text-qtt-peach shadow-md"
              data-testid="member-crown"
            >
              <Crown size={20} className="fill-current" />
            </Tooltip.Trigger>
            <Tooltip.Content>В национальной сборной</Tooltip.Content>
          </Tooltip>
        </div>
        <div className="min-w-0 flex-1 pb-1.5">
          <h1 className="m-0 truncate text-[28px] leading-tight font-semibold tracking-tight" data-testid="member-name">
            {p.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 pb-2">
          {pr?.email && <Contact href={'mailto:' + pr.email} label="Написать" value={pr.email} tone="bg-qtt-blue" icon={<Mail size={17} />} testId="member-mail" />}
          {pr?.phone && <Contact href={'tel:' + pr.phone} label="Позвонить" value={pr.phone} tone="bg-qtt-teal" icon={<Phone size={17} />} testId="member-call" />}
          {canEdit && <RemoveMemberButton member={member} onRemove={onRemoved} />}
        </div>
      </div>
      <div className="px-6 pt-5 pb-6">
        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-3 p-0 md:grid-cols-2 xl:grid-cols-3">
          <Fact label="Состав">
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
          <Fact label="Группа">
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
          <Fact label="Личный тренер">
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
          {p.region && <Fact label="Регион">{p.region}</Fact>}
          {pr && (
            <Fact label="В сборной с">
              {dmy(pr.joined)}
            </Fact>
          )}
          {(pr?.birthDate || p.birthYear) && (
            <Fact label="Дата рождения">
              {pr?.birthDate ? dmy(pr.birthDate) : p.birthYear}
            </Fact>
          )}
          {pr?.email && (
            <Fact label="Эл. почта">
              <span className="truncate">{pr.email}</span>
            </Fact>
          )}
          {pr?.phone && (
            <Fact label="Телефон">
              {pr.phone}
            </Fact>
          )}
        </ul>
        {edit.error && <p className="m-0 mt-3 text-[13px] text-red-600">{edit.error}</p>}
      </div>
    </section>
  );
}

/** Полоса показателей: клетки через тонкую черту, как полоса карточки рейтинга. */
function Kpis({ member, card }: { member: NationalMember; card: ReturnType<typeof useRatingCard> }) {
  const r = card.data?.profile;
  const share = r && r.wins + r.losses ? Math.round((r.wins / (r.wins + r.losses)) * 100) : null;
  const cells: [string, ReactNode, string][] = [
    ['Рейтинг', member.person.rating ? num2(Number(member.person.rating)) : '—', 'rating'],
    ['Место в листе', card.data ? `${card.data.place} из ${card.data.of}` : '—', 'place'],
    ['Матчей', r ? r.matchesPlayed : '—', 'matches'],
    ['Победы / поражения', r ? `${r.wins} / ${r.losses}` : '—', 'wl'],
    ['Доля побед', share === null ? '—' : share + ' %', 'share'],
  ];
  return (
    <div className="grid grid-cols-2 gap-px border-b border-neutral-200 bg-neutral-200 sm:grid-cols-3 xl:grid-cols-6" data-testid="profile-kpis">
      {cells.map(([label, value, id]) => (
        <div key={id} className="flex flex-col justify-center gap-1 bg-white px-6 py-4" data-testid={'kpi-' + id}>
          <span className="text-[12px] text-neutral-500">{label}</span>
          <span className={'leading-none font-semibold tabular-nums ' + (id === 'rating' ? 'text-[28px] text-brand-600' : 'text-[22px]')}>{value}</span>
        </div>
      ))}
      <div className="flex items-center gap-3 bg-white px-6 py-4" data-testid="kpi-plan">
        {member.plan ? <ProgressRing done={member.plan.done} total={member.plan.total} size={48} /> : null}
        <span className="flex flex-col gap-1">
          <span className="text-[12px] text-neutral-500">План</span>
          <span className="text-[15px] leading-none font-semibold">{member.plan ? `${member.plan.done} из ${member.plan.total}` : member.access.plans ? 'Нет' : '—'}</span>
        </span>
      </div>
    </div>
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
  const showPlans = member.access.plans;
  const plans = useLoad(() => (showPlans ? fetchPlans(member.id) : Promise.resolve([])), member.id + (showPlans ? ':plans' : ''));
  const plan = plans.data ? (plans.data.find((x) => x.id === member.plan?.planId) ?? plans.data[0] ?? null) : null;
  const medical = member.access.medical !== null;
  const sport = member.access.sport;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto [&>*]:shrink-0" data-testid="member-profile">
      <Header member={member} canEdit={member.access.roster} onChanged={onChanged} onRemoved={onRemoved} />
      <Kpis member={member} card={card} />
      <div className={'grid border-b border-neutral-200 ' + (showPlans ? 'lg:grid-cols-[minmax(0,1fr)_24rem]' : '')}>
          {showPlans && <PlanSteps plans={plans.data} error={plans.error} plan={plan} onOpenPlan={onOpenPlan} onOpenHistory={onOpenHistory} />}
          <div className="flex flex-col">
            <HeadToHead history={card.data ? card.data.history.filter((h) => !h.isReverted).slice().reverse() : card.error ? [] : null} />
            {medical && <MedStatus member={member} onOpenMedical={onOpenMedical} />}
            {sport && <SportLink onOpen={onOpenSport} />}
          </div>
        </div>
      <RatingBlock userId={member.person.id} card={card} />
    </div>
  );
}
