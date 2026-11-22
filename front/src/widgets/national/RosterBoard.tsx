'use client';

/* Состав национальной команды — карточки ✳ (22.11.2026, образец владельца
   продукта CoachPro «Players»; прежняя таблица снята). Серая страница: слева
   поиск, отбор плашками (состав — «Все · Основной · Расширенный», группа —
   «Кадеты · Юноши · Взрослые», повторный щелчок снимает) и «Внести в сборную»
   (`canEdit`), под ними карточки спортсменов по 12 на страницу (страницы —
   `TablePagination`, как у таблиц). Карточка — как в образце: слева фигура
   спортсмена по пояс на голубой подложке (фото, если есть; нет — **заглушка:
   сгенерированный игрок в стойке** своего пола — три мужских, три женских,
   выбор по id, у человека не меняется; решение владельца продукта 22.11.2026),
   в углу фигуры — точка допуска (зелёная — допущен, коралловая — истёк, серая
   — не внесён); справа фамилия крупно, имя и отчество, регион, «группа ·
   рейтинг · план» (план — тем, кому сервер прислал планы: «7 из 9», «· ждёт» —
   на согласовании).
   Выбранная карточка залита тёмно-синим бренда.

   Заглушки сгенерированы fal.ai (FLUX dev, 22.11.2026): «вымышленный
   казахстанский спортсмен / спортсменка по пояс, в стойке с ракеткой, в
   тёмно-синей форме с голубой отделкой без знаков и надписей», фон снят
   (`imageutils/rembg`); вымышленные люди, не спортсмены федерации. Лежат в
   `public/national/players/`.

   Справа — панель выбранного (`roster-detail`): шапка на тёмно-синем — та же
   фигура крупно слева, справа состав, имя, короткие сведения; ниже строки с
   полосами —
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
import { TablePagination } from '@/shared/ui/table';

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

const PAGE = 12; // карточек на страницу — значение наше
const PLACEHOLDERS = { m: ['m-1', 'm-2', 'm-3'], f: ['f-1', 'f-2', 'f-3'] } as const;

/** Заглушка фигуры — своего пола (пол неизвестен — любая), одна и та же для человека: по id. */
function placeholderOf(m: NationalMember) {
  let h = 0;
  for (const ch of m.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const list: readonly string[] = m.person.sex ? PLACEHOLDERS[m.person.sex] : [...PLACEHOLDERS.m, ...PLACEHOLDERS.f];
  return `/national/players/${list[h % list.length]}.webp`;
}

/** Фигура спортсмена: фото или заглушка — игрок по пояс, прижат к низу. */
function Figure({ m, className, size }: { m: NationalMember; className: string; size: string }) {
  return (
    <span className={'relative block shrink-0 overflow-hidden ' + className}>
      {m.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.avatar} alt="" className="absolute inset-0 size-full object-cover" data-testid="member-photo" data-photo="yes" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholderOf(m)}
          alt=""
          aria-hidden
          loading="lazy"
          className={'absolute bottom-0 left-1/2 w-auto max-w-none -translate-x-1/2 object-contain transition-transform duration-300 group-hover:scale-[1.04] origin-bottom ' + size}
          data-testid="member-photo"
          data-photo="no"
        />
      )}
    </span>
  );
}

function Dot({ m, className }: { m: NationalMember; className: string }) {
  return (
    <span
      className={'absolute size-3.5 rounded-full border-2 border-white ' + DOT[m.clearance.status] + ' ' + className}
      title={DOT_TEXT[m.clearance.status]}
      aria-label={DOT_TEXT[m.clearance.status]}
      data-testid="clearance"
      data-status={m.clearance.status}
    />
  );
}

function Clearance({ m }: { m: NationalMember }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
      <span className={'size-2 rounded-full ' + DOT[m.clearance.status]} aria-hidden />
      {DOT_TEXT[m.clearance.status]}
    </span>
  );
}

const planText = (m: NationalMember) => (m.plan ? m.plan.done + ' из ' + m.plan.total + (m.plan.status === 'submitted' ? ' · ждёт' : '') : 'Нет');

function MemberCard({ m, on, onPick, onOpen }: { m: NationalMember; on: boolean; onPick: () => void; onOpen: () => void }) {
  const { surname, rest } = splitName(m.person.name);
  const facts: [string, ReactNode][] = [
    ['Группа', AGE_GROUP_LABEL[m.ageGroup]],
    ['Рейтинг', m.person.rating ? num2(Number(m.person.rating)) : '—'],
    ...(m.plan !== undefined ? [['План', <span key="p" data-testid="member-plan">{planText(m)}</span>] as [string, ReactNode]] : []),
  ];
  return (
    <button
      type="button"
      onClick={onPick}
      onDoubleClick={onOpen}
      aria-pressed={on}
      className={
        'group relative flex h-36 min-w-0 overflow-hidden rounded-2xl border text-left transition-[box-shadow,border-color] ' +
        (on ? 'border-transparent text-white shadow-lg shadow-brand-700/25 ' + FILL : 'border-neutral-200/80 bg-white hover:border-brand-200 hover:shadow-md')
      }
      data-testid="member-row"
      data-name={m.person.name}
    >
      <Figure m={m} className={'w-32 ' + (on ? 'bg-white/10' : 'bg-[color-mix(in_srgb,var(--color-qtt-sky)_28%,white)]')} size="h-[94%]" />
      <Dot m={m} className="top-2.5 left-2.5" />
      <span className="relative flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
        <span className="truncate text-[16px] leading-tight font-bold">{surname}</span>
        <span className={'truncate text-[13px] ' + (on ? 'text-white/75' : 'text-neutral-500')}>{rest}</span>
        <span className={'truncate text-[12px] ' + (on ? 'text-white/60' : 'text-neutral-400')}>{m.person.region || 'Регион не указан'}</span>
        <span className="mt-2.5 flex gap-x-4">
          {facts.map(([label, value]) => (
            <span key={label} className="flex min-w-0 flex-col">
              <span className={'text-[10px] font-semibold tracking-wide uppercase ' + (on ? 'text-white/60' : 'text-neutral-400')}>{label}</span>
              <span className="text-[12.5px] font-medium whitespace-nowrap tabular-nums">{value}</span>
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
      <div className={'relative flex items-end gap-3 overflow-hidden pt-5 pr-5 text-white ' + FILL}>
        <span aria-hidden className="pointer-events-none absolute -top-12 -left-12 size-56 rounded-full bg-white/5" />
        <Figure m={m} className="h-52 w-40" size="h-full" />
        <span className="absolute top-4 right-5">
          <Clearance m={m} />
        </span>
        <div className="relative flex min-w-0 flex-1 flex-col pb-5">
          <span className="text-[11px] font-semibold tracking-wide text-white/65 uppercase">{SQUAD_LABEL[m.squad]} состав</span>
          <span className="mt-0.5 truncate text-[14px] text-white/85">{rest}</span>
          <span className="truncate text-[22px] leading-tight font-bold">{surname}</span>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/15 pt-3">
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
  const [page, setPage] = useState(0);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (members.data ?? [])
      .filter((m) => (!squad || m.squad === squad) && (!group || m.ageGroup === group))
      .filter((m) => !needle || (m.person.name + ' ' + m.person.region).toLowerCase().includes(needle))
      .sort((a, b) => a.person.name.localeCompare(b.person.name, 'ru'));
  }, [members.data, q, squad, group]);
  const best = Math.max(0, ...(members.data ?? []).map((m) => Number(m.person.rating ?? 0)));
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const at = Math.min(page, pages - 1); // отбор сузил список — страница могла исчезнуть
  const shown = list.slice(at * PAGE, at * PAGE + PAGE);
  const current = list.find((m) => m.id === picked) ?? shown[0] ?? null;

  return (
    <div className="grid h-full min-h-0 bg-neutral-100 md:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]" data-testid="national-roster">
      <div className="flex min-h-0 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-3 bg-neutral-100 px-4 pt-4 pb-3">
          <SearchField aria-label="Поиск" value={q} onChange={(v) => (setQ(v), setPage(0))} className="w-64 max-md:w-full">
            <SearchField.Group className="rounded-xl bg-white">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Фамилия или регион" data-testid="roster-search" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Отбор">
            <Chip on={!squad} onPress={() => (setSquad(null), setPage(0))} testId="roster-squad-all">
              Все
            </Chip>
            {(Object.keys(SQUAD_LABEL) as Squad[]).map((s) => (
              <Chip key={s} on={squad === s} onPress={() => (setSquad(squad === s ? null : s), setPage(0))} testId={'roster-squad-' + s}>
                {SQUAD_LABEL[s]}
              </Chip>
            ))}
            <span aria-hidden className="mx-1 h-5 w-px bg-neutral-300" />
            {(Object.keys(AGE_GROUP_LABEL) as AgeGroup[]).map((g) => (
              <Chip key={g} on={group === g} onPress={() => (setGroup(group === g ? null : g), setPage(0))} testId={'roster-group-' + g}>
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
          <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2 2xl:grid-cols-3">
            {shown.map((m) => (
              <MemberCard key={m.id} m={m} on={!narrow && current?.id === m.id} onPick={() => (narrow ? onOpen(m.id) : setPicked(m.id))} onOpen={() => onOpen(m.id)} />
            ))}
          </div>
        )}
        <div className="mt-auto">
          <TablePagination page={at} pages={pages} onPage={setPage} />
        </div>
      </div>
      {!narrow && current && <Detail m={current} best={best} onOpen={() => onOpen(current.id)} />}
    </div>
  );
}
