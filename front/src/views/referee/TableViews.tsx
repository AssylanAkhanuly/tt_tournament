'use client';

/* Судья стола ✳ (22.11.2026, flows/09 Э9.2–Э9.5; главная схема
   `flow-tournaments`: «Судья вносит счёт, результат сразу публичный»).

   «Мой стол» (`/referee/table`) — одна карточка текущего матча и одна кнопка
   («Старт матча» / «Продолжить счёт»); очереди стола на экране нет (Э9.2).
   «Ввод счёта» (`/referee/table/<турнир>/<матч>`) — табло `ScoreStage` ✳
   (23.11.2026): стол с фигурами игроков, по краям очки идущей партии с «+» /
   «−», в центре номер партии и счёт матча, в углу таблица партий — щелчок
   переключает на сыгранную, её можно поправить и сохранить. Язычок карточки —
   главное действие: «Записать партию» (активна, когда очки по правилам — до 11,
   при 10 : 10 — до разрыва в два), «Сохранить партию N», «Подтвердить
   результат» (только у решённого матча). Очки идущей партии — на телефоне
   (`useDraft`), на сервер уходит партия целиком. Короткий путь — «Записать только итог». После подтверждения — «Результат
   отправлен» (Э9.5) на том же адресе: партии целиком, кто и когда, «К моему
   столу». Правила и права — на сервере (`tournaments/scoring.py`). */

import { Button, Spinner } from '@heroui/react';
import { CheckCircle2, Play, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import {
  fetchMyTable,
  fetchScoring,
  scoreMatch,
  validGame,
  type ScoringAction,
  type ScoringMatch,
  type ScoringPlayer,
} from '@/entities/tournament';
import { useLoad } from '@/shared/lib/useLoad';
import { PersonAvatar } from '@/shared/ui/PersonAvatar';

import { ScoreStage, StageTab, type Pair } from './ScoreStage';
import { RefereeShell } from './RefereeShell';

const TABLE = '/referee/table';
const matchHref = (m: ScoringMatch) => `${TABLE}/${m.tournament.id}/${m.id}`;
const NUM = 'font-[family-name:var(--font-jersey)] tabular-nums leading-none';

function when(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function wins(n: number): string {
  return `до ${n} ${n === 1 ? 'победы' : 'побед'} в партиях`;
}

/** Строка под заголовком матча на табло: стол, группа, круг. */
function caption(m: ScoringMatch): string {
  return [m.table ? `Стол ${m.table}` : '', `Группа ${m.group}`, m.round ? `круг ${m.round}` : ''].filter(Boolean).join(' · ');
}

/** Текущий матч стола: идущий, иначе ближайший несыгранный. */
function current(matches: ScoringMatch[]): ScoringMatch | undefined {
  return matches.find((m) => m.status === 'in_progress') ?? matches.find((m) => m.status === 'pending');
}

function Player({ p, align = 'left' }: { p: ScoringPlayer; align?: 'left' | 'right' }) {
  return (
    <div className={'flex min-w-0 items-center gap-3 ' + (align === 'right' ? 'flex-row-reverse text-right' : '')}>
      <PersonAvatar name={p.name} src={p.avatar} size="lg" />
      <div className="min-w-0">
        <div className="line-clamp-2 text-[17px] font-semibold text-neutral-900" title={p.name}>{p.name}</div>
        {p.region && <div className="truncate text-[13px] text-neutral-500">{p.region}</div>}
      </div>
    </div>
  );
}

// ── Э9.2 Мой стол ─────────────────────────────────────────────────────────────

export function RefereeTableView() {
  const router = useRouter();
  const my = useLoad(fetchMyTable, 'my-table');
  const [error, setError] = useState<string | null>(null);
  const m = my.data ? current(my.data) : undefined;

  const go = (match: ScoringMatch) => {
    if (match.status !== 'pending') return router.push(matchHref(match));
    scoreMatch(match.tournament.id, match.id, { action: 'start' }).then(
      () => router.push(matchHref(match)),
      (e: Error) => setError(e.message),
    );
  };

  return (
    <RefereeShell active="Мой стол" bleed>
      {my.error ? (
        <p className="p-6 text-[13px] text-red-600">{my.error}</p>
      ) : !my.data ? (
        <Spinner className="m-auto" />
      ) : !m ? (
        <p className="m-auto text-[15px] text-neutral-500" data-testid="table-free">Стол свободен</p>
      ) : (
        <section className="flex h-full flex-col items-center justify-center gap-8 px-4 py-10" data-testid="table-match">
          <div className="text-center">
            <div className="text-[13px] font-medium tracking-wide text-neutral-500 uppercase">{m.tournament.name}</div>
            <div className={NUM + ' mt-2 text-[56px] text-neutral-900'} data-testid="table-number">Стол {m.table ?? '—'}</div>
            <div className="mt-1 text-[14px] text-neutral-500">
              {when(m.scheduledAt)} · группа {m.group}{m.round ? ` · круг ${m.round}` : ''}
            </div>
          </div>
          <div className="grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-6 max-md:grid-cols-1 max-md:text-center">
            <Player p={m.player1} />
            <div className={NUM + ' text-center text-[64px] text-neutral-900'} data-testid="table-score">
              {m.status === 'in_progress' ? `${m.score1 ?? 0} : ${m.score2 ?? 0}` : '—'}
            </div>
            <Player p={m.player2} align="right" />
          </div>
          <div className="text-[14px] text-neutral-500">{wins(m.gamesToWin)}</div>
          {error && <p className="m-0 text-[13px] text-red-600">{error}</p>}
          <Button size="lg" className="h-14 min-w-64 rounded-xl text-[16px]" onPress={() => go(m)} data-testid="table-start">
            <Play size={18} /> {m.status === 'pending' ? 'Старт матча' : 'Продолжить счёт'}
          </Button>
        </section>
      )}
    </RefereeShell>
  );
}

// ── Э9.3 Ввод счёта · Э9.5 Результат отправлен ────────────────────────────────

/** Очки идущей партии живут на телефоне судьи до записи партии и переживают
    перезагрузку страницы (хранилище закрыто — просто с нуля). */
function useDraft(matchId: number): [Pair, (p: Pair) => void] {
  const key = `scoring-draft:${matchId}`;
  const [draft, setDraft] = useState<Pair>(() => {
    try {
      const v: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
      return Array.isArray(v) && v.length === 2 ? [Number(v[0]) || 0, Number(v[1]) || 0] : [0, 0];
    } catch {
      return [0, 0];
    }
  });
  const save = (p: Pair) => {
    setDraft(p);
    try {
      localStorage.setItem(key, JSON.stringify(p));
    } catch {
      /* закрытое хранилище — очки только в памяти */
    }
  };
  return [draft, save];
}

const same = (x?: Pair, y?: Pair) => !!x && !!y && x[0] === y[0] && x[1] === y[1];
const decidedOf = (m: ScoringMatch) => (m.score1 ?? 0) === m.gamesToWin || (m.score2 ?? 0) === m.gamesToWin;
/** Какую партию показать после ответа сервера: идущую, у решённого — последнюю. */
const focusOf = (m: ScoringMatch) => (decidedOf(m) ? Math.max(0, m.games.length - 1) : m.games.length);

function Center({ label, score, testId, note }: { label: string; score: string; testId: string; note?: string }) {
  return (
    <>
      <div className="text-[11px] font-semibold tracking-[0.18em] text-brand-200 uppercase" data-testid="score-game-label">{label}</div>
      <div className={NUM + ' text-[40px] md:text-[56px]'} data-testid={testId}>{score}</div>
      {note && <div className="text-[12px] text-white/55" data-testid="score-rule">{note}</div>}
    </>
  );
}

const LINK = 'text-[13px] font-medium text-white/70 underline-offset-4 hover:text-white hover:underline';

function ScoreBoard({ m, act }: { m: ScoringMatch; act: (body: ScoringAction) => Promise<ScoringMatch | null> }) {
  const n = m.gamesToWin;
  const s1 = m.score1 ?? 0;
  const s2 = m.score2 ?? 0;
  const decided = decidedOf(m);
  const live = decided ? null : m.games.length;
  const [draft, setDraft] = useDraft(m.id);
  const [edits, setEdits] = useState<Record<number, Pair>>({});
  const [sel, setSel] = useState(() => focusOf(m));
  const [total, setTotal] = useState<Pair | null>(null);

  const isLive = total === null && sel === live;
  const recorded = m.games[sel] as Pair | undefined;
  const edited = !isLive && recorded && edits[sel] && !same(edits[sel], recorded) ? edits[sel] : undefined;
  const shown: Pair = total ?? (isLive ? draft : (edited ?? recorded ?? [0, 0]));

  const step = (side: 0 | 1, d: 1 | -1) => {
    const next = [...shown] as Pair;
    next[side] = Math.max(0, next[side] + d);
    if (total) next[side] = Math.min(n, next[side]);
    navigator.vibrate?.(8);
    if (total) setTotal(next);
    else if (isLive) setDraft(next);
    else setEdits({ ...edits, [sel]: next });
  };
  const after = (fresh: ScoringMatch | null, then?: () => void) => {
    if (!fresh) return;
    then?.();
    setSel(focusOf(fresh));
  };
  const dropEdit = () => {
    const rest = { ...edits };
    delete rest[sel];
    setEdits(rest);
  };

  let tab: ReactNode;
  let below: ReactNode = null;
  if (total) {
    const ok = Math.max(...total) === n && Math.min(...total) < n;
    tab = (
      <StageTab onPress={() => void act({ action: 'submit', score1: total[0], score2: total[1] })} disabled={!ok} tone="success" testId="score-submit-total">
        <CheckCircle2 size={18} /> Подтвердить итог
      </StageTab>
    );
    below = <button type="button" className={LINK} onClick={() => setTotal(null)}>Считать по партиям</button>;
  } else if (isLive) {
    tab = (
      <StageTab
        onPress={() => void act({ action: 'game', a: draft[0], b: draft[1] }).then((f) => after(f, () => setDraft([0, 0])))}
        disabled={!validGame(draft[0], draft[1])}
        testId="score-record"
      >
        Записать партию
      </StageTab>
    );
    if (m.games.length === 0 && draft[0] + draft[1] === 0)
      below = <button type="button" className={LINK} onClick={() => setTotal([0, 0])} data-testid="score-total-mode">Записать только итог</button>;
  } else if (edited) {
    tab = (
      <StageTab
        onPress={() => void act({ action: 'set_game', index: sel, a: edited[0], b: edited[1] }).then((f) => after(f, dropEdit))}
        disabled={!validGame(edited[0], edited[1])}
        testId="score-save-game"
      >
        Сохранить партию {sel + 1}
      </StageTab>
    );
    below = <button type="button" className={LINK} onClick={dropEdit} data-testid="score-cancel-edit">Отменить правку</button>;
  } else {
    tab = decided ? (
      <StageTab onPress={() => void act({ action: 'submit' })} tone="success" testId="score-submit">
        <CheckCircle2 size={18} /> Подтвердить результат
      </StageTab>
    ) : (
      <StageTab onPress={() => setSel(live ?? 0)} tone="quiet" testId="score-to-live">
        К партии {(live ?? 0) + 1}
      </StageTab>
    );
    if (sel === m.games.length - 1)
      below = (
        <button type="button" className={LINK + ' inline-flex items-center gap-1.5'} onClick={() => void act({ action: 'undo' }).then((f) => after(f))} data-testid="score-undo">
          <Undo2 size={14} /> Снять партию {sel + 1}
        </button>
      );
  }

  return (
    <ScoreStage
      player1={m.player1}
      player2={m.player2}
      points={shown}
      onStep={step}
      center={
        total ? (
          <Center label="Итог матча" score={`${total[0]} : ${total[1]}`} testId="score-total" note={wins(n)} />
        ) : (
          <Center label={`Партия ${sel + 1}`} score={`${s1} : ${s2}`} testId="score-total" note={wins(n)} />
        )
      }
      title={m.tournament.name}
        caption={caption(m)}
      games={m.games}
      rows={Math.max(2 * n - 1, m.games.length)}
      live={total ? null : live}
      draft={draft}
      selected={total ? -1 : sel}
      onSelect={total ? undefined : setSel}
      tab={tab}
      below={below}
    />
  );
}

function ResultSent({ m }: { m: ScoringMatch }) {
  const router = useRouter();
  const [sel, setSel] = useState(Math.max(0, m.games.length - 1));
  const g = m.games[sel] as Pair | undefined;
  return (
    <div className="h-full" data-testid="score-result">
      <ScoreStage
        player1={m.player1}
        player2={m.player2}
        points={g ?? [m.score1 ?? 0, m.score2 ?? 0]}
        center={<Center label="Результат принят" score={`${m.score1 ?? 0} : ${m.score2 ?? 0}`} testId="result-total" note={g ? `партия ${sel + 1}` : 'итог матча'} />}
        title={m.tournament.name}
        caption={caption(m)}
        games={m.games}
        rows={m.games.length}
        live={null}
        draft={[0, 0]}
        selected={sel}
        onSelect={setSel}
        tab={
          <StageTab onPress={() => router.push(TABLE)} testId="result-back">
            К моему столу
          </StageTab>
        }
        below={
          <span className="text-[13px] text-white/60" data-testid="result-by">
            {m.resultBy} · {when(m.resultAt)}
          </span>
        }
      />
    </div>
  );
}

export function MatchScoringView({ tournamentId, matchId }: { tournamentId: string; matchId: string }) {
  const loaded = useLoad(() => fetchScoring(tournamentId, matchId), `scoring:${tournamentId}:${matchId}`);
  const [fresh, setFresh] = useState<ScoringMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const m = fresh ?? loaded.data;

  const act = (body: ScoringAction) =>
    scoreMatch(tournamentId, matchId, body).then(
      (d) => {
        setFresh(d);
        setError(null);
        return d;
      },
      (e: Error) => {
        setError(e.message);
        return null;
      },
    );

  // Заголовок матча — в вырезе карточки табло, шапки страницы нет.
  return (
    <RefereeShell active="Мой стол" bleed>
      {loaded.error ? (
        <p className="p-6 text-[13px] text-red-600">{loaded.error}</p>
      ) : !m ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="relative flex h-full min-h-0 flex-col overflow-y-auto">
          {error && (
            <p className="absolute top-3 left-1/2 z-30 m-0 max-w-[90%] -translate-x-1/2 bg-red-600 px-4 py-2 text-center text-[13px] text-white shadow-lg" data-testid="score-error">
              {error}
            </p>
          )}
          {m.status === 'finished' ? (
            <ResultSent m={m} />
          ) : m.canScore && m.status === 'pending' ? (
            <div className="m-auto">
              <Button size="lg" className="h-14 min-w-64 rounded-xl" onPress={() => void act({ action: 'start' })} data-testid="table-start">
                <Play size={18} /> Старт матча
              </Button>
            </div>
          ) : m.canScore ? (
            <ScoreBoard m={m} act={act} />
          ) : (
            <p className="m-auto text-[14px] text-neutral-500">Счёт этого матча ведёт назначенный судья</p>
          )}
        </div>
      )}
    </RefereeShell>
  );
}
