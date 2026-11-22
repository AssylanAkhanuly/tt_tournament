'use client';

/* Профиль члена сборной ✳ (22.11.2026, образцы владельца продукта — Orbix
   «Player Profile» и Athlitiq, совмещённые; прежний вид «Mon profil» снят).
   Серая страница, белые карточки с промежутком — так в обоих образцах
   (отступление от правила «от края до края» — по прямой просьбе владельца
   продукта для этого экрана). Две колонки:

   - **слева** — шапка-«герой» (`profile/Hero`: фото с кольцом допуска и
     короной, состав и группа, имя, место в листе, возраст, регион, «в сборной
     с», связь); карточки показателей (`profile/Kpis`: рейтинг, матчей, доля
     побед, форма — с мини-графиками); динамика рейтинга (`profile/RatingBlock`,
     график с периодом); ниже рядом — пункты подготовки (`profile/PlanSteps`,
     степпер) и личные встречи (`profile/SideBlocks`);
   - **справа** (прилипает при прокрутке) — сведения (`profile/Facts`: состав,
     группа, личный тренер — штабу с выбором), медкарта, спортивная карточка.

   Вкладок разделов нет: разделы открываются из блоков. Блок показывается
   тому, кому сервер открыл раздел (`member.access`). На узком экране колонки
   встают одна под другой. */

import { fetchPlans, useLoad, type NationalMember } from '@/entities/national';
import { useRatingCard } from '@/entities/rating';

import { Facts } from './profile/Facts';
import { Hero } from './profile/Hero';
import { Kpis } from './profile/Kpis';
import { PlanSteps } from './profile/PlanSteps';
import { RatingBlock } from './profile/RatingBlock';
import { HeadToHead, MedStatus, SportLink } from './profile/SideBlocks';

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
  const canEdit = member.access.roster;
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-neutral-100" data-testid="member-profile">
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Hero member={member} card={card} canEdit={canEdit} onRemoved={onRemoved} />
          <Kpis member={member} card={card} />
          <RatingBlock userId={member.person.id} card={card} />
          <div className="grid gap-4 lg:grid-cols-2">
            {showPlans && <PlanSteps plans={plans.data} error={plans.error} plan={plan} onOpenPlan={onOpenPlan} onOpenHistory={onOpenHistory} />}
            <HeadToHead
              me={{
                name: member.person.name,
                avatar: member.profile?.avatar ?? null,
              }}
              history={
                card.data
                  ? card.data.history
                      .filter((h) => !h.isReverted)
                      .slice()
                      .reverse()
                  : card.error
                    ? []
                    : null
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <Facts member={member} canEdit={canEdit} onChanged={onChanged} />
          {member.access.medical !== null && <MedStatus member={member} onOpenMedical={onOpenMedical} />}
          {member.access.sport && <SportLink onOpen={onOpenSport} />}
        </div>
      </div>
    </div>
  );
}
