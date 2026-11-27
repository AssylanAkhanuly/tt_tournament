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

   Вид ✳ (23.11.2026): карточки по 20 на страницу, мелкие — до пяти в ряд, или
   таблица (`?view=table`). Оба вида — общий `DataTable` (у карточек — его вид
   `cards`): один заголовок с поиском и переключателем вида справа, те же страницы.

   Данные — снимок расписания (`useSchedule`), тот же, что у «Матчей» и «Дня»;
   экран перечитывает его раз в 15 секунд, пока открыт — счёт идёт со столов. */

import { Button, Chip, Label, Modal, NumberField, Spinner, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { LayoutGrid, List, Pencil } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { scoreMatch, useSchedule, type Schedule, type ScheduledMatch, type SchedulePerson } from '@/entities/tournament';
import { placeholderFigure } from '@/shared/lib/figure';
import { shortName } from '@/shared/lib/name';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { PersonAvatar } from '@/shared/ui/PersonAvatar';

import { groupTone } from './groupTone';

const NUM = 'font-[family-name:var(--font-jersey)] tabular-nums leading-none';
const REFRESH_MS = 15_000;
/** Карточек столов на странице ✳ (23.11.2026). */
const PAGE = 20;

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

/** Лицо игрока: снимок, иначе лицо заглушки-фигуры на персиковом — как в
    составе сборной и на табло судьи стола. */
function Face({ p }: { p: SchedulePerson }) {
  return (
    <span className="block size-8 shrink-0 overflow-hidden rounded-full bg-qtt-peach ring-2 ring-white/80" data-photo={p.avatar ? 'yes' : 'no'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.avatar ?? placeholderFigure(p.id)}
        alt=""
        className={'size-full object-cover ' + (p.avatar ? '' : 'origin-top scale-[1.2] object-top')}
      />
    </span>
  );
}

function Side({ p, score, lead, align }: { p: SchedulePerson; score: number | null; lead: boolean; align: 'left' | 'right' }) {
  return (
    <div className={'flex min-w-0 flex-1 items-center gap-3 px-4 @max-md:gap-1 @max-md:px-2 ' + (align === 'right' ? 'flex-row-reverse' : '')}>
      {/* Игрок — без подложки ✳ (23.11.2026, решение владельца продукта): аватар и фамилия с тенью текста. */}
      <span
        className={
          'flex min-w-0 items-center gap-2 [text-shadow:0_1px_3px_var(--color-brand-950),0_0_8px_var(--color-brand-950)] @max-md:flex-col @max-md:gap-1 ' +
          (align === 'right' ? '@md:flex-row-reverse' : '')
        }
      >
        <Face p={p} />
        <span className="max-w-[76px] min-w-0 truncate text-[12px] font-semibold text-white @max-md:text-[10.5px] @md:max-w-none" title={p.name}>
          {shortName(p.name)}
        </span>
      </span>
      <span className="flex-1" />
      {score !== null && <span className={NUM + ' text-[28px] ' + (lead ? 'text-white' : 'text-white/60')}>{score}</span>}
    </div>
  );
}

function TableCard({ table, m, s }: { table: number; m: ScheduledMatch | null; s: Schedule }) {
  const isLive = !!m && live(m);
  const shown = isLive ? [m!.score1 ?? 0, m!.score2 ?? 0] : [null, null];
  return (
    <article className="@container flex min-w-0 flex-col gap-1.5" data-testid="table-card" data-table={table} data-state={isLive ? 'live' : m ? 'next' : 'free'}>
      <header className="flex items-center gap-2 px-1">
        <span className="text-[13px] font-semibold">Стол {table}</span>
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
      <div className="flex min-h-7 items-center justify-center gap-1.5 text-[12px]" data-testid="table-referee">
        {m?.referee ? (
          <>
            <PersonAvatar name={m.referee.name} src={m.referee.avatar} id={m.referee.id} />
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
    <section className="flex min-h-0 flex-col overflow-hidden bg-white" data-testid={testId}>
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

// ── вид таблицей ─────────────────────────────────────────────────────────────

type TableRow = { table: number; m: ScheduledMatch | null };

const stateOf = (m: ScheduledMatch | null) => (!m ? 'свободен' : live(m) ? 'идёт' : 'в ' + hhmm(m.scheduledAt));

function Person({ p }: { p: SchedulePerson }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="block size-8 shrink-0 overflow-hidden rounded-full bg-qtt-peach">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.avatar ?? placeholderFigure(p.id)} alt="" className={'size-full object-cover ' + (p.avatar ? '' : 'origin-top scale-[1.2] object-top')} />
      </span>
      <span className="truncate" title={p.name}>
        {shortName(p.name)}
      </span>
    </span>
  );
}

const TABLE_COLUMNS: DataColumn<TableRow>[] = [
  { id: 'table', label: 'Стол', sortValue: (r) => r.table, render: (r) => <span className="font-semibold">Стол {r.table}</span> },
  {
    id: 'state',
    label: 'Состояние',
    sortValue: (r) => stateOf(r.m),
    render: (r) => (
      <Chip size="sm" variant="soft" color={r.m && live(r.m) ? 'success' : 'default'}>
        {stateOf(r.m)}
      </Chip>
    ),
  },
  { id: 'group', label: 'Группа', sortValue: (r) => r.m?.groupName ?? null, render: (r) => (r.m ? r.m.groupName + (r.m.round ? ' · круг ' + r.m.round : '') : '—') },
  { id: 'p1', label: 'Игрок 1', sortValue: (r) => r.m?.player1.name ?? null, render: (r) => (r.m ? <Person p={r.m.player1} /> : '—') },
  {
    id: 'score',
    label: 'Счёт',
    align: 'right',
    render: (r) => (r.m && live(r.m) ? <span className={NUM + ' text-[20px]'}>{(r.m.score1 ?? 0) + ':' + (r.m.score2 ?? 0)}</span> : '—'),
  },
  { id: 'p2', label: 'Игрок 2', sortValue: (r) => r.m?.player2.name ?? null, render: (r) => (r.m ? <Person p={r.m.player2} /> : '—') },
  { id: 'referee', label: 'Судья стола', sortValue: (r) => r.m?.referee?.name ?? null, render: (r) => (r.m?.referee ? shortName(r.m.referee.name) : '—') },
];

// ── исправить счёт ───────────────────────────────────────────────────────────

/** Исправить подтверждённый счёт ✳ (24.11.2026, flows/07 Э7.6, flows/08 Э8.2) —
    тому, у кого полномочия главного судьи (`canRun` с сервера); правит один.
    Итогом в партиях: у победителя ровно N, у проигравшего меньше — проверяет
    сервер. Кто внёс — в журнале счёта (`ScoreLog`). */
function CorrectScore({ tournamentId, m, gamesToWin, onDone }: { tournamentId: string; m: ScheduledMatch; gamesToWin: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(m.score1 ?? 0);
  const [b, setB] = useState(m.score2 ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await scoreMatch(tournamentId, m.id, { action: 'correct', score1: a, score2: b });
      setOpen(false);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const step = (label: string, value: number, set: (v: number) => void, testId: string) => (
    <NumberField value={value} onChange={(v) => set(Number.isNaN(v) ? 0 : v)} minValue={0} maxValue={gamesToWin} className="flex items-center justify-between gap-3">
      <Label className="min-w-0 truncate text-[14px]">{label}</Label>
      <NumberField.Group className="h-9 w-32 rounded-xl">
        <NumberField.DecrementButton aria-label={'Меньше: ' + label} />
        <NumberField.Input className="text-center" data-testid={testId} />
        <NumberField.IncrementButton aria-label={'Больше: ' + label} />
      </NumberField.Group>
    </NumberField>
  );
  return (
    <>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Исправить счёт"
        className="rounded-full"
        onPress={() => {
          setA(m.score1 ?? 0);
          setB(m.score2 ?? 0);
          setOpen(true);
        }}
        data-testid="tables-correct"
      >
        <Pencil size={14} />
      </Button>
      <ModalSheet isOpen={open} onOpenChange={setOpen} size="sm" testId="correct-dialog">
        <Modal.CloseTrigger aria-label="Закрыть" />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Исправить счёт</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-3">
          {step(shortName(m.player1.name), a, setA, 'correct-score1')}
          {step(shortName(m.player2.name), b, setB, 'correct-score2')}
          {error && <p className="m-0 text-[13px] text-red-600">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" className="rounded-xl" onPress={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant="primary" className="rounded-xl" isPending={busy} onPress={() => void save()} data-testid="correct-save">
            Сохранить
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </>
  );
}

// ── экран ────────────────────────────────────────────────────────────────────

export function TablesBoard({ tournamentId }: { tournamentId: string }) {
  const loaded = useSchedule(tournamentId);
  const { reload } = loaded;
  const params = useSearchParams();
  const router = useRouter();
  const asTable = params.get('view') === 'table';
  // Вид — в адресе (`?view=table`): переживает перезагрузку и ссылку.
  function setView(v: string) {
    const next = new URLSearchParams(params.toString());
    if (v === 'table') next.set('view', 'table');
    else next.delete('view');
    const qs = next.toString();
    router.replace(qs ? '?' + qs : '?', { scroll: false });
  }
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
      {/* Один заголовок на оба вида ✳ (23.11.2026, решение владельца продукта):
          поиск и справа переключатель «Карточки · Таблица»; страницы — те же. */}
      <div className="flex min-h-0 flex-col max-md:min-h-[60vh]">
        <DataTable
          ariaLabel="Столы"
          testId="tables-table"
          rows={tables.map((t) => ({ table: t, m: onTable(s.matches, t) }))}
          columns={TABLE_COLUMNS}
          getId={(r) => String(r.table)}
          search={{ placeholder: 'Игрок или судья', text: (r) => (r.m ? [r.m.player1.name, r.m.player2.name, r.m.referee?.name ?? ''].join(' ') : '') }}
          defaultSort={{ column: 'table', direction: 'ascending' }}
          pageSize={asTable ? 25 : PAGE}
          rowProps={(r) => ({ 'data-testid': 'tables-row', 'data-table': String(r.table) })}
          actions={
            <ToggleButtonGroup
              size="sm"
              aria-label="Вид"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[asTable ? 'table' : 'cards']}
              onSelectionChange={(keys) => {
                const v = [...keys][0];
                if (v) setView(String(v));
              }}
            >
              <ToggleButton id="cards" aria-label="Карточки" data-testid="tables-view-cards">
                <LayoutGrid size={16} />
              </ToggleButton>
              <ToggleButton id="table" aria-label="Таблица" data-testid="tables-view-table">
                <List size={16} />
              </ToggleButton>
            </ToggleButtonGroup>
          }
          cards={
            asTable
              ? undefined
              : (rows) => (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 bg-neutral-50 p-5 max-md:p-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {rows.map((r) => (
                      <TableCard key={r.table} table={r.table} m={r.m} s={s} />
                    ))}
                  </div>
                )
          }
        />
      </div>
      <aside className="flex min-h-0 flex-col gap-2 border-l border-neutral-200 bg-neutral-100 max-md:border-t max-md:border-l-0 md:grid md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
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
                <Row
                  key={m.id}
                  m={m}
                  right={
                    <span className="flex shrink-0 items-center gap-1" data-testid="tables-result" data-match={m.id}>
                      <span className={NUM + ' text-[22px]'}>{m.isWalkover ? '+:−' : `${m.score1 ?? 0}:${m.score2 ?? 0}`}</span>
                      {s.canRun && !m.isWalkover && <CorrectScore tournamentId={tournamentId} m={m} gamesToWin={s.gamesToWin} onDone={reload} />}
                    </span>
                  }
                />
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
