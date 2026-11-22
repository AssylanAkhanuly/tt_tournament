'use client';

/* Состав национальной команды — карточки ✳ (22.11.2026, образец владельца
   продукта CoachPro «Players»; прежняя таблица снята). Серая страница: слева
   поиск, отбор плашками (состав — «Все · Основной · Расширенный», группа —
   «Кадеты · Юноши · Взрослые», повторный щелчок снимает) и «Внести в сборную»
   (`canEdit`), под ними карточки спортсменов: фото (нет снимка — инициалы) с
   точкой цвета допуска, фамилия крупно, имя и отчество, строка «группа ·
   регион · план» (план — тем, кому сервер прислал планы: «7 из 9», «· ждёт» —
   на согласовании); бледная крупная цифра — рейтинг, как номер игрока в
   образце. Выбранная карточка залита тёмно-синим бренда.

   Справа — панель выбранного (`roster-detail`): шапка с фото, составом и
   именем на тёмно-синем, короткие сведения, ниже строки с полосами —
   рейтинг (доля от лучшего в составе), план, доля побед (рейтинговая
   карточка), матчей, допуск, ограничения нагрузки, личный тренер — и
   «Открыть профиль». Двойной щелчок по карточке открывает профиль сразу; на
   телефоне панели нет — щелчок открывает профиль. Строки — те, кого человеку
   видно (решает сервер). */

import { Button, SearchField, Spinner } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { AGE_GROUP_LABEL, fetchMembers, SQUAD_LABEL, useLoad, type AgeGroup, type NationalMember, type Squad } from '@/entities/national';
import { num2, useRatingCard } from '@/entities/rating';
import { useNarrow } from '@/shared/kit/app';

import { initials } from './profile/Hero';
import { AddMemberDialog, ClearanceChip } from './RosterParts';

/* Точка допуска на фото. Классы целиком. */
const DOT = { ok: 'bg-green-500', expired: 'bg-qtt-coral', none: 'bg-neutral-300' } as const;
const DOT_TEXT = { ok: 'Допущен', expired: 'Допуск истёк', none: 'Допуск не внесён' } as const;
/* Заливка выбранной карточки и шапки панели — тёмно-синий бренда с отливом в голубой. */
const FILL = 'bg-[linear-gradient(135deg,var(--color-brand-700),var(--color-brand-600)_55%,color-mix(in_srgb,var(--color-brand-500)_55%,var(--color-brand-600)))]';

const splitName = (name: string) => {
  const [surname, ...rest] = name.split(/\s+/);
  return { surname, rest: rest.join(' ') };
};

function Photo({ m, size }: { m: NationalMember; size: string }) {
  return (
    <span className="relative shrink-0">
      <span className={'grid place-items-center overflow-hidden rounded-full border-2 border-white bg-[color-mix(in_srgb,var(--color-qtt-violet)_12%,white)] ' + size}>
        {m.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.avatar} alt="" className="size-full object-cover" />
        ) : (
          <span className="font-semibold text-qtt-violet">{initials(m.person.name)}</span>
        )}
      </span>
      <span
        className={'absolute right-0 bottom-0.5 size-3.5 rounded-full border-2 border-white ' + DOT[m.clearance.status]}
        title={DOT_TEXT[m.clearance.status]}
        aria-label={DOT_TEXT[m.clearance.status]}
        data-testid="clearance"
        data-status={m.clearance.status}
      />
    </span>
  );
}

const planText = (m: NationalMember) => (m.plan ? m.plan.done + ' из ' + m.plan.total + (m.plan.status === 'submitted' ? ' · ждёт' : '') : 'Нет');

function MemberCard({ m, on, onPick, onOpen }: { m: NationalMember; on: boolean; onPick: () => void; onOpen: () => void }) {
  const { surname, rest } = splitName(m.person.name);
  const facts: [string, ReactNode][] = [
    ['Группа', AGE_GROUP_LABEL[m.ageGroup]],
    ['Регион', m.person.region || '—'],
    ...(m.plan !== undefined ? [['План', <span key="p" data-testid="member-plan">{planText(m)}</span>] as [string, ReactNode]] : []),
  ];
  return (
    <button
      type="button"
      onClick={onPick}
      onDoubleClick={onOpen}
      aria-pressed={on}
      className={
        'group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-[box-shadow,border-color] ' +
        (on ? 'border-transparent text-white shadow-lg shadow-brand-700/20 ' + FILL : 'border-neutral-200/80 bg-white hover:border-brand-200 hover:shadow-sm')
      }
      data-testid="member-row"
      data-name={m.person.name}
    >
      {m.person.rating && (
        <span aria-hidden className={'pointer-events-none absolute top-2 right-4 text-[34px] leading-none font-bold tabular-nums ' + (on ? 'text-white/15' : 'text-neutral-100')}>
          {num2(Number(m.person.rating))}
        </span>
      )}
      <Photo m={m} size="size-16 text-[18px]" />
      <span className="relative flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[16px] leading-tight font-bold">{surname}</span>
        <span className={'truncate text-[13px] ' + (on ? 'text-white/75' : 'text-neutral-500')}>{rest}</span>
        <span className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
          {facts.map(([label, value]) => (
            <span key={label} className="flex min-w-0 flex-col">
              <span className={'text-[10px] font-semibold tracking-wide uppercase ' + (on ? 'text-white/60' : 'text-neutral-400')}>{label}</span>
              <span className="text-[12.5px] font-medium whitespace-nowrap">{value}</span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function Bar({ label, value, share, tone }: { label: string; value: ReactNode; share: number | null; tone: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-[13.5px]">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
        {share !== null && <div className={'h-full rounded-full ' + tone} style={{ width: `${Math.round(Math.min(1, Math.max(0, share)) * 100)}%` }} />}
      </div>
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-[13.5px]">
      <span className="shrink-0 text-neutral-600">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{children}</span>
    </div>
  );
}

function Detail({ m, best, onOpen }: { m: NationalMember; best: number; onOpen: () => void }) {
  const card = useRatingCard(m.person.id);
  const r = card.data?.profile;
  const share = r && r.wins + r.losses ? r.wins / (r.wins + r.losses) : null;
  const rating = m.person.rating ? Number(m.person.rating) : null;
  const { surname, rest } = splitName(m.person.name);
  const age = m.person.birthYear ? new Date().getFullYear() - m.person.birthYear : null;
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto border-l border-neutral-200 bg-white" data-testid="roster-detail" data-name={m.person.name}>
      <div className={'relative flex items-center gap-5 overflow-hidden px-6 py-7 text-white ' + FILL}>
        <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/5" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 left-16 size-40 rounded-full bg-white/5" />
        <Photo m={m} size="size-24 text-[26px]" />
        <div className="relative flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wide text-white/65 uppercase">{SQUAD_LABEL[m.squad]} состав</span>
          <span className="mt-0.5 truncate text-[14px] text-white/85">{rest}</span>
          <span className="truncate text-[22px] leading-tight font-bold">{surname}</span>
          <div className="mt-3 flex gap-5 border-t border-white/15 pt-3">
            {[
              ['Возраст', age ?? '—'],
              ['Группа', AGE_GROUP_LABEL[m.ageGroup]],
              ['Регион', m.person.region || '—'],
            ].map(([label, value]) => (
              <span key={label} className="flex min-w-0 flex-col">
                <span className="text-[10px] font-semibold tracking-wide text-white/55 uppercase">{label}</span>
                <span className="truncate text-[13px] font-medium">{value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Bar label="Рейтинг" value={rating !== null ? num2(rating) : '—'} share={rating !== null && best > 0 ? rating / best : null} tone="bg-brand-500" />
        {m.plan !== undefined && <Bar label="План подготовки" value={planText(m)} share={m.plan ? m.plan.done / Math.max(1, m.plan.total) : null} tone="bg-qtt-violet" />}
        <Bar label="Доля побед" value={card.loading ? <Spinner size="sm" /> : share === null ? '—' : Math.round(share * 100) + ' %'} share={share} tone="bg-qtt-teal" />
        <div className="mt-1 flex flex-col gap-3">
          <Line label="Матчей">{r ? r.matchesPlayed : '—'}</Line>
          <Line label="Место в листе">{card.data ? `${card.data.place} из ${card.data.of}` : '—'}</Line>
          <Line label="Допуск">
            <ClearanceChip clearance={m.clearance} />
          </Line>
          <Line label="Ограничения нагрузки">
            <span className={m.limits ? 'font-semibold text-amber-700' : ''}>{m.limits || 'Нет'}</span>
          </Line>
          <Line label="Личный тренер">{m.personalCoach?.name ?? 'Нет'}</Line>
        </div>
        <Button variant="primary" className="mt-auto w-full rounded-xl" onPress={onOpen} data-testid="member-open">
          Открыть профиль <ArrowRight size={16} />
        </Button>
      </div>
    </aside>
  );
}

function Chip({ on, onPress, children, testId }: { on: boolean; onPress: () => void; children: ReactNode; testId: string }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={on}
      className={
        'rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ' +
        (on ? 'bg-brand-600 text-white' : 'border border-neutral-200 bg-white text-neutral-600 hover:border-brand-200 hover:text-brand-700')
      }
      data-testid={testId}
    >
      {children}
    </button>
  );
}

export function RosterBoard({ canEdit, onOpen }: { canEdit: boolean; onOpen: (memberId: string) => void }) {
  const members = useLoad(fetchMembers, 'members');
  const narrow = useNarrow();
  const [q, setQ] = useState('');
  const [squad, setSquad] = useState<Squad | null>(null);
  const [group, setGroup] = useState<AgeGroup | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (members.data ?? [])
      .filter((m) => (!squad || m.squad === squad) && (!group || m.ageGroup === group))
      .filter((m) => !needle || (m.person.name + ' ' + m.person.region).toLowerCase().includes(needle))
      .sort((a, b) => a.person.name.localeCompare(b.person.name, 'ru'));
  }, [members.data, q, squad, group]);
  const best = Math.max(0, ...(members.data ?? []).map((m) => Number(m.person.rating ?? 0)));
  const current = list.find((m) => m.id === picked) ?? list[0] ?? null;

  return (
    <div className="grid h-full min-h-0 bg-neutral-100 md:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]" data-testid="national-roster">
      <div className="flex min-h-0 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-3 bg-neutral-100 px-4 pt-4 pb-3">
          <SearchField aria-label="Поиск" value={q} onChange={setQ} className="w-64 max-md:w-full">
            <SearchField.Group className="rounded-xl bg-white">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Фамилия или регион" data-testid="roster-search" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Отбор">
            <Chip on={!squad} onPress={() => setSquad(null)} testId="roster-squad-all">
              Все
            </Chip>
            {(Object.keys(SQUAD_LABEL) as Squad[]).map((s) => (
              <Chip key={s} on={squad === s} onPress={() => setSquad(squad === s ? null : s)} testId={'roster-squad-' + s}>
                {SQUAD_LABEL[s]}
              </Chip>
            ))}
            <span aria-hidden className="mx-1 h-5 w-px bg-neutral-300" />
            {(Object.keys(AGE_GROUP_LABEL) as AgeGroup[]).map((g) => (
              <Chip key={g} on={group === g} onPress={() => setGroup(group === g ? null : g)} testId={'roster-group-' + g}>
                {AGE_GROUP_LABEL[g]}
              </Chip>
            ))}
          </div>
          {canEdit && (
            <div className="ml-auto">
              <AddMemberDialog onAdded={members.reload} />
            </div>
          )}
        </div>
        {!members.data ? (
          members.error ? (
            <p className="m-0 px-4 text-[13px] text-red-600">{members.error}</p>
          ) : (
            <Spinner className="mx-auto my-10 block" />
          )
        ) : list.length === 0 ? (
          <p className="m-0 py-16 text-center text-[13px] text-neutral-500" data-testid="table-empty">
            {members.data.length ? 'Никого не найдено' : 'В сборной никого нет'}
          </p>
        ) : (
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 2xl:grid-cols-3">
            {list.map((m) => (
              <MemberCard key={m.id} m={m} on={!narrow && current?.id === m.id} onPick={() => (narrow ? onOpen(m.id) : setPicked(m.id))} onOpen={() => onOpen(m.id)} />
            ))}
          </div>
        )}
      </div>
      {!narrow && current && <Detail m={current} best={best} onOpen={() => onOpen(current.id)} />}
    </div>
  );
}
