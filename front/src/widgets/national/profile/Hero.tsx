'use client';

/* Шапка профиля — карточка-«герой» ✳ (22.11.2026, образец владельца продукта
   Athlitiq, совмещённый с Orbix «Player Profile»): сверху баннер-картинка
   (одна из шести, fal.ai, по id), на неё заходит круглый аватар — фото, а без
   снимка лицо сгенерированного игрока своего пола на персиковом, как в
   карточке состава (решение владельца продукта 22.11.2026) с кольцом цвета допуска (зелёное —
   допущен, коралловое — истёк, серое — не внесён) и короной члена сборной;
   над именем — состав и группа строкой бренда, имя в две строки (фамилия,
   затем имя и отчество); под ним — короткие сведения через черту: место в
   рейтинг-листе (цветом бренда, как номер игрока в образце), возраст, регион,
   «в сборной с». Справа вверху — «написать», «позвонить» и штабу «Убрать из
   сборной». Бледная крупная цифра справа — место в листе. */

import { Tooltip } from '@heroui/react';
import { Crown, Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

import { AGE_GROUP_LABEL, dmy, SQUAD_LABEL, type NationalMember } from '@/entities/national';
import type { useRatingCard } from '@/entities/rating';

import { RemoveMemberButton } from '../MemberControls';
import { bannerOf, placeholderOf } from '../RosterParts';
import { CARD } from './ui';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('')
    .toUpperCase();

/* Кольцо фото — цвет допуска. Классы целиком. */
const RING = {
  ok: 'ring-green-500',
  expired: 'ring-qtt-coral',
  none: 'ring-neutral-200',
} as const;

const yearsWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'год' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'года' : 'лет');

/** Полных лет по дате рождения; без даты — по году. */
function age(birthDate: string | null | undefined, birthYear: number | null) {
  const now = new Date();
  if (birthDate) {
    const [y, m, d] = birthDate.split('-').map(Number);
    return now.getFullYear() - y - (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d) ? 1 : 0);
  }
  return birthYear ? now.getFullYear() - birthYear : null;
}

function Contact({ href, label, value, tone, icon, testId }: { href: string; label: string; value: string; tone: string; icon: ReactNode; testId: string }) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <a
          href={href}
          aria-label={label + ': ' + value}
          className={'grid size-10 place-items-center rounded-full text-white shadow-sm hover:brightness-110 ' + tone}
          data-testid={testId}
        >
          {icon}
        </a>
      </Tooltip.Trigger>
      <Tooltip.Content>{value}</Tooltip.Content>
    </Tooltip>
  );
}

function Fact({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-l border-neutral-200 px-5 first:border-l-0 first:pl-0">
      <dd className={'m-0 text-[19px] leading-tight font-semibold tabular-nums ' + (accent ? 'text-brand-500' : '')}>{value}</dd>
      <dt className="text-[12px] text-neutral-500">{label}</dt>
    </div>
  );
}

export function Hero({ member, card, canEdit, onRemoved }: { member: NationalMember; card: ReturnType<typeof useRatingCard>; canEdit: boolean; onRemoved: () => void }) {
  const p = member.person;
  const pr = member.profile;
  const [surname, ...rest] = p.name.split(/\s+/);
  const years = age(pr?.birthDate, p.birthYear);
  const place = card.data?.place;
  return (
    <section className={CARD + ' relative overflow-hidden'} data-testid="member-hero">
      {/* Баннер-картинка сверху, аватар заходит на него ✳ (22.11.2026, решение
          владельца продукта). */}
      <div className="relative h-40 bg-brand-600">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerOf(member)} alt="" className="absolute inset-0 size-full object-cover" data-testid="member-banner" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-brand-800)_45%,transparent),transparent_60%)]" />
      </div>
      {place && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-6 bottom-4 font-[family-name:var(--font-jersey)] text-[180px] leading-[0.72] text-transparent tabular-nums select-none [-webkit-text-stroke:1.5px_var(--color-neutral-200)]"
        >
          {place}
        </span>
      )}
      <div className="relative flex flex-wrap items-start gap-x-8 gap-y-5 px-6 pb-6">
        {/* Корона — член национальной сборной; кольцо — допуск ✳ (22.11.2026). */}
        <div className="relative -mt-16 shrink-0">
          <div
            className={'grid size-36 place-items-center overflow-hidden rounded-full border-4 border-white bg-qtt-peach ring-4 ' + RING[member.clearance.status]}
            data-testid="member-photo-ring"
            data-status={member.clearance.status}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pr?.avatar ?? member.avatar ?? placeholderOf(member)}
              alt={p.name}
              className={'size-full object-cover ' + (pr?.avatar ?? member.avatar ? '' : 'origin-[50%_12%] scale-[2.1] object-top')}
              data-testid="member-photo"
              data-photo={pr?.avatar ?? member.avatar ? 'yes' : 'no'}
            />
          </div>
          <Tooltip>
            <Tooltip.Trigger
              aria-label="В национальной сборной"
              className="absolute -top-1 right-0 grid size-10 place-items-center rounded-full bg-white text-qtt-peach shadow-md"
              data-testid="member-crown"
            >
              <Crown size={20} className="fill-current" />
            </Tooltip.Trigger>
            <Tooltip.Content>В национальной сборной</Tooltip.Content>
          </Tooltip>
        </div>
        <div className="flex min-w-0 flex-1 flex-col pt-5">
          <span className="text-[12px] font-semibold tracking-wide text-brand-500 uppercase">
            {SQUAD_LABEL[member.squad]} состав · {AGE_GROUP_LABEL[member.ageGroup]}
          </span>
          <h1 className="m-0 mt-1 text-[32px] leading-[1.1] font-bold tracking-tight" data-testid="member-name">
            <span className="block">{surname}</span> <span className="block">{rest.join(' ')}</span>
          </h1>
          <dl className="m-0 mt-5 flex flex-wrap gap-y-3">
            {place && <Fact label="Место в листе" value={'№ ' + place} accent />}
            {years !== null && <Fact label="Возраст" value={years + ' ' + yearsWord(years)} />}
            {p.region && <Fact label="Регион" value={p.region} />}
            {pr && <Fact label="В сборной с" value={dmy(pr.joined)} />}
          </dl>
        </div>
        <div className="flex items-center gap-2 self-start pt-5">
          {pr?.email && <Contact href={'mailto:' + pr.email} label="Написать" value={pr.email} tone="bg-qtt-blue" icon={<Mail size={17} />} testId="member-mail" />}
          {pr?.phone && <Contact href={'tel:' + pr.phone} label="Позвонить" value={pr.phone} tone="bg-qtt-teal" icon={<Phone size={17} />} testId="member-call" />}
          {canEdit && <RemoveMemberButton member={member} onRemove={onRemoved} />}
        </div>
      </div>
    </section>
  );
}
