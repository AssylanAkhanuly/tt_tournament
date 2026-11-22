'use client';

/* Судья стола ✳ (22.11.2026, flows/09 Э9.2–Э9.5; главная схема
   `flow-tournaments`: «Судья вносит счёт, результат сразу публичный»).

   «Мой стол» (`/referee/table`) — одна карточка текущего матча и одна кнопка
   («Старт матча» / «Продолжить счёт»); очереди стола на экране нет (Э9.2).
   «Ввод счёта» (`/referee/table/<турнир>/<матч>`) — табло: игроки по краям,
   счёт по партиям крупно между ними, сыгранные партии, поля партии и
   «Записать партию». Партия — по правилам (до 11, при 10 : 10 — до разрыва в
   два), счёт матча — из партий. «Подтвердить результат» появляется, только
   когда матч решён; до этого на его месте — регламент и текущий счёт.
   Короткий путь — «Записать только итог». После подтверждения — «Результат
   отправлен» (Э9.5) на том же адресе: партии целиком, кто и когда, «К моему
   столу». Правила и права — на сервере (`tournaments/scoring.py`). */

import { Button, Input, Spinner, TextField } from '@heroui/react';
import { CheckCircle2, Play, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

function Games({ m }: { m: ScoringMatch }) {
  if (!m.games.length) return null;
  return (
    <ol className="m-0 flex list-none flex-wrap justify-center gap-2 p-0" data-testid="score-games">
      {m.games.map(([a, b], i) => (
        <li key={i} className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[15px] tabular-nums text-neutral-500" data-testid="score-game">
          <span className={a > b ? 'font-semibold text-neutral-900' : ''}>{a}</span>
          {' : '}
          <span className={b > a ? 'font-semibold text-neutral-900' : ''}>{b}</span>
        </li>
      ))}
    </ol>
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

function digits(v: string) {
  return v.replace(/\D/g, '').slice(0, 2);
}

/** Два поля счёта рядом: партия или итог матча. */
function Pair({ a, b, onA, onB, label, testId }: { a: string; b: string; onA: (v: string) => void; onB: (v: string) => void; label: string; testId: string }) {
  const field = (v: string, on: (v: string) => void, side: string) => (
    <TextField value={v} onChange={(x) => on(digits(x))} aria-label={`${label}: ${side}`}>
      <Input inputMode="numeric" className={NUM + ' h-16 w-20 rounded-xl text-center text-[40px]'} data-testid={`${testId}-${side === 'игрок 1' ? 'a' : 'b'}`} onFocus={(e) => e.currentTarget.select()} />
    </TextField>
  );
  return (
    <div className="flex items-center justify-center gap-3">
      {field(a, onA, 'игрок 1')}
      <span className={NUM + ' text-[40px] text-neutral-400'}>:</span>
      {field(b, onB, 'игрок 2')}
    </div>
  );
}

function ScoreBoard({ m, act }: { m: ScoringMatch; act: (body: ScoringAction) => Promise<boolean> }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [totalMode, setTotalMode] = useState(false);
  const n = m.gamesToWin;
  const s1 = m.score1 ?? 0;
  const s2 = m.score2 ?? 0;
  const decided = s1 === n || s2 === n;
  const gameOk = a !== '' && b !== '' && validGame(Number(a), Number(b));
  const totalOk = a !== '' && b !== '' && Math.max(Number(a), Number(b)) === n && Math.min(Number(a), Number(b)) < n;
  const reset = () => {
    setA('');
    setB('');
  };

  return (
    <section className="flex h-full flex-col gap-8 overflow-y-auto px-4 py-8 md:px-10" data-testid="score-board">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6 max-md:grid-cols-1">
        <Player p={m.player1} />
        <div className="flex flex-col items-center gap-4">
          <div className={NUM + ' text-[96px] text-neutral-900'} data-testid="score-total">
            {s1} : {s2}
          </div>
          <Games m={m} />
        </div>
        <Player p={m.player2} align="right" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
        {decided ? null : totalMode ? (
          <>
            <Pair a={a} b={b} onA={setA} onB={setB} label="Итог матча" testId="score-total-input" />
            <div className="flex gap-2">
              <Button variant="tertiary" className="rounded-xl" onPress={() => { setTotalMode(false); reset(); }}>
                Считать по партиям
              </Button>
              <Button className="rounded-xl" isDisabled={!totalOk} onPress={() => void act({ action: 'submit', score1: Number(a), score2: Number(b) })} data-testid="score-submit-total">
                <CheckCircle2 size={16} /> Подтвердить итог
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[13px] font-medium text-neutral-500">Партия {m.games.length + 1}</div>
            <Pair a={a} b={b} onA={setA} onB={setB} label={`Партия ${m.games.length + 1}`} testId="score-game-input" />
            <div className="flex flex-wrap justify-center gap-2">
              {m.games.length > 0 && (
                <Button variant="tertiary" className="rounded-xl" onPress={() => void act({ action: 'undo' })} data-testid="score-undo">
                  <Undo2 size={16} /> Снять последнюю
                </Button>
              )}
              <Button className="rounded-xl" isDisabled={!gameOk} onPress={() => void act({ action: 'game', a: Number(a), b: Number(b) }).then((ok) => ok && reset())} data-testid="score-record">
                Записать партию
              </Button>
            </div>
            {m.games.length === 0 && (
              <Button variant="ghost" size="sm" className="rounded-xl text-neutral-500" onPress={() => { setTotalMode(true); reset(); }} data-testid="score-total-mode">
                Записать только итог
              </Button>
            )}
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 border-t border-neutral-200 pt-6">
        {decided ? (
          <div className="flex gap-2">
            <Button variant="tertiary" className="rounded-xl" onPress={() => void act({ action: 'undo' })} data-testid="score-undo">
              <Undo2 size={16} /> Снять последнюю
            </Button>
            <Button size="lg" className="h-14 min-w-64 rounded-xl bg-green-600 text-[16px] text-white" onPress={() => void act({ action: 'submit' })} data-testid="score-submit">
              <CheckCircle2 size={18} /> Подтвердить результат
            </Button>
          </div>
        ) : (
          <p className="m-0 text-[14px] text-neutral-500" data-testid="score-rule">
            {wins(n)}, сейчас {s1} : {s2}
          </p>
        )}
      </div>
    </section>
  );
}

function ResultSent({ m }: { m: ScoringMatch }) {
  const router = useRouter();
  const winner = m.winnerId === m.player1.id ? m.player1 : m.player2;
  return (
    <section className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-10 text-center" data-testid="score-result">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-green-700">
        <CheckCircle2 size={20} /> Результат принят
      </div>
      <div className="grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-6 max-md:grid-cols-1">
        <Player p={m.player1} />
        <div className={NUM + ' text-[80px] text-neutral-900'} data-testid="result-total">
          {m.score1} : {m.score2}
        </div>
        <Player p={m.player2} align="right" />
      </div>
      {m.games.length ? <Games m={m} /> : <p className="m-0 text-[13px] text-neutral-500">Партии не заполнялись — записан итог матча</p>}
      <div className="text-[14px] text-neutral-600">
        Победитель — <span className="font-semibold text-neutral-900">{winner.name}</span>
      </div>
      <div className="text-[13px] text-neutral-500" data-testid="result-by">
        {m.resultBy} · {when(m.resultAt)}
      </div>
      <Button size="lg" className="h-12 rounded-xl" onPress={() => router.push(TABLE)} data-testid="result-back">
        К моему столу
      </Button>
    </section>
  );
}

export function MatchScoringView({ tournamentId, matchId }: { tournamentId: string; matchId: string }) {
  const router = useRouter();
  const loaded = useLoad(() => fetchScoring(tournamentId, matchId), `scoring:${tournamentId}:${matchId}`);
  const [fresh, setFresh] = useState<ScoringMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const m = fresh ?? loaded.data;

  const act = (body: ScoringAction) =>
    scoreMatch(tournamentId, matchId, body).then(
      (d) => {
        setFresh(d);
        setError(null);
      },
      (e: Error) => {
        setError(e.message);
        throw e;
      },
    );
  const safeAct = (body: ScoringAction) => act(body).then(() => true, () => false);

  const title = m ? `Стол ${m.table ?? '—'} · ${m.tournament.name}` : 'Ввод счёта';
  return (
    <RefereeShell active="Мой стол" bleed title={title} back={{ label: 'Мой стол', onPress: () => router.push(TABLE) }}>
      {loaded.error ? (
        <p className="p-6 text-[13px] text-red-600">{loaded.error}</p>
      ) : !m ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          {error && <p className="m-0 px-6 pt-3 text-center text-[13px] text-red-600" data-testid="score-error">{error}</p>}
          {m.status === 'finished' ? (
            <ResultSent m={m} />
          ) : m.canScore && m.status === 'pending' ? (
            <div className="m-auto">
              <Button size="lg" className="h-14 min-w-64 rounded-xl" onPress={() => void safeAct({ action: 'start' })} data-testid="table-start">
                <Play size={18} /> Старт матча
              </Button>
            </div>
          ) : m.canScore ? (
            <ScoreBoard m={m} act={safeAct} />
          ) : (
            <p className="m-auto text-[14px] text-neutral-500">Счёт этого матча ведёт назначенный судья</p>
          )}
        </div>
      )}
    </RefereeShell>
  );
}
