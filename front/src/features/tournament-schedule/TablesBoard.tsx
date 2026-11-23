'use client';

/* «Столы» ✳ (23.11.2026, решение владельца продукта): все столы турнира
   карточками — что сейчас на каждом. Экран надвое: слева (80 %) — столы, справа
   — две панели поровну: сверху «Ближайшие матчи» (ещё не начатые, по времени),
   снизу «Последние результаты» (завершённые, последние по времени — первыми).

   Карточка стола нарисована столом для настольного тенниса: синяя
   столешница с белой кромкой, продольной средней линией и сеткой поперёк. На
   половинах — игроки идущего матча (иначе ближайшего на этом столе): аватар,
   фамилия, счёт матча по партиям; сбоку у сетки — судья стола, как он и сидит.
   Стол без матчей — «свободен».

   Данные — снимок расписания (`useSchedule`), тот же, что у «Матчей» и «Дня»;
   экран перечитывает его раз в 15 секунд, пока открыт — счёт идёт со столов. */

import { Chip, Spinner } from '@heroui/react';
import { useEffect } from 'react';

import { useSchedule, type Schedule, type ScheduledMatch, type SchedulePerson } from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';
import { PersonAvatar } from '@/shared/ui/PersonAvatar';

import { groupTone } from './groupTone';

const NUM = 'font-[family-name:var(--font-jersey)] tabular-nums leading-none';
const REFRESH_MS = 15_000;

const hhmm = (d: Date | null) => (d ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—');
const byTime = (a: ScheduledMatch, b: ScheduledMatch) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0);
const finished = (m: ScheduledMatch) => m.status === 'finished';
const live = (m: ScheduledMatch) => m.status === 'in_progress';

/** Что показать на столе: идущий матч, иначе ближайший несыгранный. */
function onTable(matches: ScheduledMatch[], table: number): ScheduledMatch | null {
  const here = matches.filter((m) => m.table === table).sort(byTime);
  return here.find(live) ?? here.find((m) => !finished(m)) ?? null;
}

// ── карточка стола ───────────────────────────────────────────────────────────

function Side({ p, score, lead, align }: { p: SchedulePerson; score: number | null; lead: boolean; align: 'left' | 'right' }) {
  return (
    <div className={'flex min-w-0 flex-1 items-center gap-3 px-4 @max-md:gap-1 @max-md:px-2 ' + (align === 'right' ? 'flex-row-reverse' : '')}>
      {/* Игрок — плашкой поверх столешницы: средняя линия проходит под ней, а не по имени. */}
      <span
        className={
          'flex min-w-0 items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--color-brand-950)_55%,transparent)] py-1 backdrop-blur-sm @max-md:flex-col @max-md:gap-1 @max-md:rounded-2xl @max-md:px-2 @max-md:py-1.5 ' +
          (align === 'right' ? '@md:flex-row-reverse @md:pr-1 @md:pl-3' : '@md:pr-3 @md:pl-1')
        }
      >
        <span className="shrink-0 rounded-full ring-2 ring-white/80">
          <PersonAvatar name={p.name} src={p.avatar} size="md" />
        </span>
        <span className="max-w-[88px] min-w-0 truncate text-[13px] font-semibold text-white @max-md:text-[11px] @md:max-w-none" title={p.name}>
          {shortName(p.name)}
        </span>
      </span>
      <span className="flex-1" />
      {score !== null && <span className={NUM + ' text-[40px] ' + (lead ? 'text-white' : 'text-white/60')}>{score}</span>}
    </div>
  );
}

function TableCard({ table, m, s }: { table: number; m: ScheduledMatch | null; s: Schedule }) {
  const isLive = !!m && live(m);
  const shown = isLive ? [m!.score1 ?? 0, m!.score2 ?? 0] : [null, null];
  return (
    <article className="@container flex min-w-0 flex-col gap-2" data-testid="table-card" data-table={table} data-state={isLive ? 'live' : m ? 'next' : 'free'}>
      <header className="flex items-center gap-2 px-1">
        <span className="text-[15px] font-semibold">Стол {table}</span>
        {m && <span className={'rounded-md px-1.5 py-0.5 text-[11px] font-semibold ' + groupTone(s.groups, m.group).chip}>{m.groupName}</span>}
        {m?.round ? <span className="text-[12px] text-neutral-500">круг {m.round}</span> : null}
        <span className="ml-auto">
          {isLive ? (
            <Chip size="sm" color="success" variant="soft">идёт</Chip>
          ) : m ? (
            <Chip size="sm" variant="soft">в {hhmm(m.scheduledAt)}</Chip>
          ) : (
            <Chip size="sm" variant="soft">свободен</Chip>
          )}
        </span>
      </header>

      {/* Столешница: кромка, средняя линия вдоль, сетка поперёк. */}
      <div className="relative aspect-[2.2/1] overflow-hidden rounded-lg bg-[linear-gradient(160deg,var(--color-qtt-blue),var(--color-brand-700))] shadow-[0_8px_20px_color-mix(in_srgb,var(--color-brand-900)_22%,transparent)]">
        <div aria-hidden className="absolute inset-2 rounded-sm border-2 border-white/85" />
        <div aria-hidden className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-white/60" />
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 bg-[repeating-linear-gradient(0deg,color-mix(in_srgb,white_85%,transparent)_0_2px,transparent_2px_5px)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-brand-950)_40%,transparent)]" />
        {m ? (
          <div className="absolute inset-0 flex items-center">
            <Side p={m.player1} score={shown[0]} lead={(shown[0] ?? 0) > (shown[1] ?? 0)} align="left" />
            <span className="w-3 shrink-0" />
            <Side p={m.player2} score={shown[1]} lead={(shown[1] ?? 0) > (shown[0] ?? 0)} align="right" />
          </div>
        ) : (
          <p className="absolute inset-0 m-0 flex items-center justify-center text-[13px] text-white/70">Матчей нет</p>
        )}
      </div>

      {/* Судья — сбоку стола у сетки. */}
      <div className="flex min-h-9 items-center justify-center gap-2 text-[13px]" data-testid="table-referee">
        {m?.referee ? (
          <>
            <PersonAvatar name={m.referee.name} src={m.referee.avatar} />
            <span className="truncate text-neutral-700">{shortName(m.referee.name)}</span>
            <span className="text-neutral-400">судья</span>
          </>
        ) : m ? (
          <span className="text-neutral-400">судья не назначен</span>
        ) : null}
      </div>
    </article>
  );
}

// ── панели справа ────────────────────────────────────────────────────────────

function Panel({ title, testId, children }: { title: string; testId: string; children: React.ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden [&+section]:border-t [&+section]:border-neutral-200" data-testid={testId}>
      <h2 className="m-0 shrink-0 border-b border-neutral-200 px-4 py-3 text-[14px] font-semibold">{title}</h2>
      <div className="min-h-0 flex-1 md:overflow-y-auto">{children}</div>
    </section>
  );
}

function Row({ m, right }: { m: ScheduledMatch; right: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2.5 text-[13px]">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{shortName(m.player1.name)}</div>
        <div className="truncate font-medium">{shortName(m.player2.name)}</div>
      </div>
      {right}
    </li>
  );
}

// ── экран ────────────────────────────────────────────────────────────────────

export function TablesBoard({ tournamentId }: { tournamentId: string }) {
  const loaded = useSchedule(tournamentId);
  const { reload } = loaded;
  useEffect(() => {
    const t = setInterval(reload, REFRESH_MS);
    return () => clearInterval(t);
  }, [reload]);

  const s = loaded.data;
  if (loaded.error && !s) return <p className="p-6 text-[13px] text-red-600">{loaded.error}</p>;
  if (!s) return <Spinner className="m-auto" />;
  if (s.status === 'none') return <p className="m-auto text-[14px] text-neutral-500" data-testid="tables-empty">Расписания пока нет</p>;

  const used = s.matches.map((m) => m.table ?? 0);
  const count = Math.max(s.settings.tables, ...used);
  const tables = Array.from({ length: count }, (_, i) => i + 1);
  const upcoming = s.matches.filter((m) => m.status === 'pending').sort(byTime).slice(0, 12);
  const results = s.matches.filter(finished).sort(byTime).reverse().slice(0, 12);

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-neutral-50 md:grid md:grid-cols-[4fr_1fr] md:overflow-hidden" data-testid="tables-board">
      <div className="min-h-0 p-6 max-md:p-4 md:overflow-y-auto">
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-2 2xl:grid-cols-3">
          {tables.map((t) => (
            <TableCard key={t} table={t} m={onTable(s.matches, t)} s={s} />
          ))}
        </div>
      </div>
      <aside className="min-h-0 border-l md:grid md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] border-neutral-200 bg-white max-md:border-t max-md:border-l-0">
        <Panel title="Ближайшие матчи" testId="tables-upcoming">
          {upcoming.length ? (
            <ul className="m-0 list-none p-0">
              {upcoming.map((m) => (
                <Row
                  key={m.id}
                  m={m}
                  right={
                    <span className="shrink-0 text-right text-[12px] text-neutral-500">
                      <span className="block font-semibold text-neutral-800 tabular-nums">{hhmm(m.scheduledAt)}</span>
                      стол {m.table ?? '—'}
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-neutral-500">Нет</p>
          )}
        </Panel>
        <Panel title="Последние результаты" testId="tables-results">
          {results.length ? (
            <ul className="m-0 list-none border-t border-neutral-200 p-0 [&>li:first-child]:border-t-0">
              {results.map((m) => (
                <Row key={m.id} m={m} right={<span className={NUM + ' shrink-0 text-[22px]'}>{m.isWalkover ? '+:−' : `${m.score1 ?? 0}:${m.score2 ?? 0}`}</span>} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-neutral-500">Нет</p>
          )}
        </Panel>
      </aside>
    </div>
  );
}
