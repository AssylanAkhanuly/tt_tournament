'use client';

/* Шапка профиля ✳ (22.11.2026, решения владельца продукта): у члена сборной
   два снимка — **аватар** (лицо) и **фигура** (снимок по пояс, до бёдер).

   - **Баннер — вся шапка во всю высоту**: линейный градиент бренда
     (тёмно-синий → голубой), справа фигура во всю высоту — загруженный снимок
     или сгенерированный игрок своего пола (заглушка, `public/national/players`),
     позади неё огромная контурная цифра места в рейтинг-листе узкой «номерной»
     гарнитурой (как в карточке состава).
   - Слева на баннере белым: **аватар** — фото или лицо той же заглушки, кольцо
     — цвет допуска (зелёное — допущен, коралловое — истёк, серое — не внесён),
     корона — член национальной сборной; состав и группа, имя в две строки
     (фамилия, затем имя и отчество), сведения через черту — место в листе,
     возраст, регион, «в сборной с»; «написать», «позвонить», штабу —
     «Убрать из сборной».

   Штаб меняет снимки прямо здесь: значок-камера у аватара и «Фигура» на
   баннере (JPG, PNG, WebP до 8 МБ — предел наш; снять — в том же меню). */

import { Dropdown, Tooltip } from '@heroui/react';
import { Camera, Crown, Mail, Phone } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import { AGE_GROUP_LABEL, dmy, setMemberImage, SQUAD_LABEL, type MemberImageKind, type NationalMember } from '@/entities/national';
import type { useRatingCard } from '@/entities/rating';

import { RemoveMemberButton } from '../MemberControls';
import { placeholderOf } from '../RosterParts';
import { CARD } from './ui';

/* Кольцо фото — цвет допуска. Классы целиком. */
const RING = { ok: 'ring-green-500', expired: 'ring-qtt-coral', none: 'ring-neutral-200' } as const;

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
        <a href={href} aria-label={label + ': ' + value} className={'grid size-10 place-items-center rounded-full text-white shadow-sm hover:brightness-110 ' + tone} data-testid={testId}>
          {icon}
        </a>
      </Tooltip.Trigger>
      <Tooltip.Content>{value}</Tooltip.Content>
    </Tooltip>
  );
}

function Fact({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-l border-white/15 px-5 first:border-l-0 first:pl-0">
      <dd className={'m-0 text-[19px] leading-tight font-semibold tabular-nums ' + (accent ? 'text-qtt-peach' : 'text-white')}>{value}</dd>
      <dt className="text-[12px] text-white/60">{label}</dt>
    </div>
  );
}

/** Меню снимка для штаба: загрузить новый или снять загруженный. */
function ImageMenu({ member, kind, has, onChanged, children, label }: {
  member: NationalMember;
  kind: MemberImageKind;
  has: boolean;
  onChanged: () => void;
  children: ReactNode;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const run = (file: File | null) =>
    setMemberImage(member.id, kind, file).then(
      () => {
        setError(null);
        onChanged();
      },
      (e: Error) => setError(e.message),
    );
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        data-testid={'image-input-' + kind}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void run(f);
        }}
      />
      <Dropdown>
        <Dropdown.Trigger aria-label={label} data-testid={'image-open-' + kind}>
          {children}
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="rounded-xl">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === 'upload') input.current?.click();
              else void run(null);
            }}
          >
            <Dropdown.Item id="upload" textValue="Загрузить" className="rounded-xl">
              Загрузить снимок
            </Dropdown.Item>
            {has ? (
              <Dropdown.Item id="remove" textValue="Снять" className="rounded-xl text-red-600">
                Снять снимок
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {error && <span className="absolute top-full right-0 mt-1 rounded-lg bg-white px-2 py-1 text-[12px] whitespace-nowrap text-red-600 shadow">{error}</span>}
    </>
  );
}

/** Кто в шапке: общий вид для члена сборной и для любого спортсмена ✳
 *  (22.11.2026: свой профиль в кабинете спортсмена — по рейтинговой карточке). */
export type HeroPerson = {
  id: string;
  name: string;
  region: string;
  birthYear: number | null;
  birthDate: string | null;
  sex: '' | 'm' | 'f';
  avatar: string | null;
  figure: string | null;
};

/** Шапка профиля без сборной: баннер-градиент с фигурой и местом в листе,
 *  аватар, имя, сведения. Сборная добавляет своё слотами (`Hero` ниже). */
export function ProfileHero({ who, place, tag, joined, ring, crown, contacts, avatarSlot, figureSlot }: {
  who: HeroPerson;
  place?: number;
  /** Строка бренда над именем (у сборной — состав и группа). */
  tag?: string;
  /** «В сборной с». */
  joined?: string | null;
  /** Кольцо фото — цвет допуска; нет — белое. */
  ring?: keyof typeof RING;
  crown?: boolean;
  contacts?: ReactNode;
  avatarSlot?: ReactNode;
  figureSlot?: ReactNode;
}) {
  const [surname, ...rest] = who.name.split(/\s+/);
  const years = age(who.birthDate, who.birthYear);
  const face = { id: who.id, person: { sex: who.sex }, avatar: who.avatar };
  return (
    <section
      className={
        CARD +
        ' relative min-h-72 overflow-hidden border-0 bg-[linear-gradient(110deg,var(--color-brand-700)_0%,var(--color-brand-600)_45%,color-mix(in_srgb,var(--color-brand-500)_70%,var(--color-brand-600))_100%)] text-white'
      }
      data-testid="member-hero"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" data-testid="member-banner">
        {place && (
          <span
            className="absolute top-1/2 right-44 translate-x-1/3 -translate-y-1/2 font-[family-name:var(--font-jersey)] text-[300px] leading-[0.72] text-transparent tabular-nums select-none [-webkit-text-stroke:1.5px_color-mix(in_srgb,white_28%,transparent)] max-lg:hidden"
            data-testid="member-place"
          >
            {place}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={who.figure ?? placeholderOf(face)}
          alt=""
          className="absolute right-10 bottom-0 h-[94%] w-auto max-w-none object-contain object-bottom max-md:hidden"
          data-testid="member-figure"
          data-photo={who.figure ? 'yes' : 'no'}
        />
      </div>
      {figureSlot && <span className="absolute top-3 right-3 z-10">{figureSlot}</span>}
      <div className="relative flex min-h-72 flex-wrap items-center gap-x-8 gap-y-5 p-6 md:pr-80">
        <div className="relative shrink-0">
          <div
            className={'grid size-36 place-items-center overflow-hidden rounded-full border-4 border-white bg-qtt-peach ' + (ring ? 'ring-4 ' + RING[ring] : '')}
            data-testid="member-photo-ring"
            data-status={ring ?? ''}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={who.avatar ?? placeholderOf(face)}
              alt={who.name}
              className={'size-full object-cover ' + (who.avatar ? '' : 'origin-[50%_12%] scale-[2.1] object-top')}
              data-testid="member-photo"
              data-photo={who.avatar ? 'yes' : 'no'}
            />
          </div>
          {crown && (
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
          )}
          {avatarSlot && <span className="absolute right-1 bottom-1">{avatarSlot}</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {tag && <span className="text-[12px] font-semibold tracking-wide text-brand-200 uppercase">{tag}</span>}
          <h1 className="m-0 mt-1 text-[34px] leading-[1.1] font-bold tracking-tight text-white" data-testid="member-name">
            <span className="block">{surname}</span> <span className="block">{rest.join(' ')}</span>
          </h1>
          <dl className="m-0 mt-5 flex flex-wrap gap-y-3">
            {place && <Fact label="Место в листе" value={'№ ' + place} accent />}
            {years !== null && <Fact label="Возраст" value={years + ' ' + yearsWord(years)} />}
            {who.region && <Fact label="Регион" value={who.region} />}
            {joined && <Fact label="В сборной с" value={dmy(joined)} />}
          </dl>
          {contacts && <div className="mt-5 flex flex-wrap items-center gap-2">{contacts}</div>}
        </div>
      </div>
    </section>
  );
}

export function Hero({ member, card, canEdit, onChanged, onRemoved }: {
  member: NationalMember;
  card: ReturnType<typeof useRatingCard>;
  canEdit: boolean;
  onChanged: () => void;
  onRemoved: () => void;
}) {
  const p = member.person;
  const pr = member.profile;
  const hasContacts = !!(pr?.email || pr?.phone || canEdit);
  return (
    <ProfileHero
      who={{
        id: member.id,
        name: p.name,
        region: p.region,
        birthYear: p.birthYear,
        birthDate: pr?.birthDate ?? null,
        sex: p.sex,
        avatar: pr?.avatar ?? member.avatar,
        figure: member.figure,
      }}
      place={card.data?.place}
      tag={SQUAD_LABEL[member.squad] + ' состав · ' + AGE_GROUP_LABEL[member.ageGroup]}
      joined={pr?.joined ?? null}
      ring={member.clearance.status}
      crown
      contacts={
        hasContacts && (
          <>
            {pr?.email && <Contact href={'mailto:' + pr.email} label="Написать" value={pr.email} tone="bg-qtt-blue" icon={<Mail size={17} />} testId="member-mail" />}
            {pr?.phone && <Contact href={'tel:' + pr.phone} label="Позвонить" value={pr.phone} tone="bg-qtt-teal" icon={<Phone size={17} />} testId="member-call" />}
            {canEdit && (
              <span className="rounded-xl bg-white/95">
                <RemoveMemberButton member={member} onRemove={onRemoved} />
              </span>
            )}
          </>
        )
      }
      figureSlot={
        canEdit && (
          <ImageMenu member={member} kind="figure" has={!!member.figure} onChanged={onChanged} label="Снимок по пояс">
            <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-neutral-700 shadow-sm hover:bg-white">
              <Camera size={14} /> Фигура
            </span>
          </ImageMenu>
        )
      }
      avatarSlot={
        canEdit && (
          <ImageMenu member={member} kind="avatar" has={!!member.avatar} onChanged={onChanged} label="Аватар">
            <span className="grid size-9 place-items-center rounded-full border-2 border-white bg-brand-500 text-white shadow-md hover:brightness-110">
              <Camera size={15} />
            </span>
          </ImageMenu>
        )
      }
    />
  );
}
