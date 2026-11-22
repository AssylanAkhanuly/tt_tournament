'use client';

/* Табло судьи стола в духе эфирной заставки ✳ (22.11.2026, решение владельца
   продукта: ориентир — экран «Player stats» киберспортивного эфира).

   Сцена во всю ширину на тёмно-синем бренда: по краям — фигуры игроков во
   всю высоту (снимок по пояс из профиля сборной; нет снимка — заглушка своего
   пола, та же, что в профиле), под ними — плашки с фамилией и регионом. В
   центре — счёт матча крупно и столбец партий, как строки статистики в эфире:
   слева очки игрока 1, по центру номер партии, справа — игрока 2. Строк
   столько, сколько партий может быть в матче (`2·N − 1`); несыгранные — пустые,
   следующая подсвечена. */

import type { ScoringPlayer } from '@/entities/tournament';
import { placeholderOf } from '@/widgets/national/RosterParts';

const NUM = 'font-[family-name:var(--font-jersey)] tabular-nums leading-none';

type Side = 'left' | 'right';

function Figure({ p, side, src }: { p: ScoringPlayer; side: Side; src: string }) {
  return (
    <>
      <div
        aria-hidden
        className={
          'absolute bottom-0 h-3/4 w-3/4 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-400)_45%,transparent),transparent)] blur-2xl ' +
          (side === 'left' ? 'left-0' : 'right-0')
        }
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={
          'absolute bottom-0 h-[94%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_12px_30px_rgb(0_0_0/0.45)] ' +
          (side === 'left' ? 'left-1/2 -translate-x-[60%]' : 'right-1/2 translate-x-[60%]')
        }
        data-testid={'board-figure-' + side}
        data-photo={p.figure ? 'yes' : 'no'}
      />
    </>
  );
}

function Plate({ p, side, lead }: { p: ScoringPlayer; side: Side; lead: boolean }) {
  const [surname, ...rest] = p.name.split(/\s+/);
  return (
    <div
      className={
        'absolute bottom-5 z-10 flex max-w-[88%] items-stretch shadow-[0_10px_30px_rgb(0_0_0/0.35)] ' +
        (side === 'left' ? 'left-0' : 'right-0 flex-row-reverse')
      }
      data-testid={'board-plate-' + side}
    >
      <div className={'w-2 shrink-0 ' + (lead ? 'bg-qtt-peach' : 'bg-brand-400')} />
      <div className={'min-w-0 bg-white px-5 py-2.5 ' + (side === 'right' ? 'text-right' : 'text-left')}>
        <div className="truncate text-[22px] leading-tight font-extrabold tracking-wide text-brand-800 uppercase" title={p.name}>
          {surname}
        </div>
        <div className="truncate text-[13px] text-neutral-500">
          {[rest.join(' '), p.region].filter(Boolean).join(' · ')}
        </div>
      </div>
    </div>
  );
}

/** Снимок фигуры или заглушка; заглушка справа не повторяет левую — два
    одинаковых игрока на табло читаются как ошибка. */
function figureOf(p: ScoringPlayer, avoid?: string): string {
  if (p.figure) return p.figure;
  let src = placeholderOf({ id: p.id, person: { sex: p.sex } });
  for (let k = 1; src === avoid && k < 8; k++) src = placeholderOf({ id: p.id + k, person: { sex: p.sex } });
  return src;
}

function Column({ p, side, lead, src }: { p: ScoringPlayer; side: Side; lead: boolean; src: string }) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden max-md:h-72">
      <Figure p={p} side={side} src={src} />
      <Plate p={p} side={side} lead={lead} />
    </div>
  );
}

function GameRow({ i, game, next }: { i: number; game?: [number, number]; next: boolean }) {
  const [a, b] = game ?? [];
  const cell = (v: number | undefined, win: boolean) => (
    <span className={NUM + ' py-1.5 text-center text-[26px] ' + (v === undefined ? 'text-white/20' : win ? 'text-white' : 'text-white/45')}>
      {v ?? '—'}
    </span>
  );
  return (
    <li
      className={
        'grid grid-cols-[1fr_7rem_1fr] items-center ' +
        (next ? 'bg-[color-mix(in_srgb,var(--color-brand-400)_28%,transparent)]' : 'odd:bg-white/[0.06] even:bg-white/[0.02]')
      }
      data-testid={game ? 'score-game' : undefined}
      data-score={game ? `${a} : ${b}` : undefined}
    >
      {cell(a, a !== undefined && b !== undefined && a > b)}
      <span className={'text-center text-[11px] font-semibold tracking-[0.18em] uppercase ' + (next ? 'text-brand-200' : 'text-white/55')}>
        Партия {i + 1}
      </span>
      {cell(b, a !== undefined && b !== undefined && b > a)}
    </li>
  );
}

export function BoardStage({ player1, player2, score1, score2, games, gamesToWin, caption, live, totalTestId }: {
  player1: ScoringPlayer;
  player2: ScoringPlayer;
  score1: number;
  score2: number;
  games: [number, number][];
  gamesToWin: number;
  caption: string;
  /** Матч не решён: строки под все возможные партии, следующая подсвечена. */
  live: boolean;
  totalTestId: string;
}) {
  // Идёт матч — все партии, какие могут быть; решён — только сыгранные.
  const src1 = figureOf(player1);
  const src2 = figureOf(player2, src1);
  const rows = live ? Math.max(2 * gamesToWin - 1, games.length) : games.length;
  return (
    <section
      className="relative grid h-[min(56vh,480px)] min-h-[400px] w-full shrink-0 grid-cols-[1fr_minmax(300px,400px)_1fr] overflow-hidden bg-[linear-gradient(160deg,var(--color-brand-800)_0%,var(--color-brand-700)_55%,color-mix(in_srgb,var(--color-brand-600)_80%,var(--color-brand-800))_100%)] text-white max-md:h-auto max-md:grid-cols-2"
      data-testid="board-stage"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_46px,color-mix(in_srgb,white_4%,transparent)_46px_48px)]"
      />
      <Column p={player1} side="left" lead={score1 > score2} src={src1} />
      <div className="relative z-10 flex flex-col justify-center gap-3 px-2 py-6 max-md:order-last max-md:col-span-2 max-md:px-4">
        <div className="text-center text-[12px] font-semibold tracking-[0.22em] text-brand-200 uppercase">{caption}</div>
        <div className="flex items-center justify-center gap-5" data-testid={totalTestId} aria-label={`${score1} : ${score2}`}>
          <span className={NUM + ' text-[88px] ' + (score1 > score2 ? 'text-white' : 'text-white/70')}>{score1}</span>{' '}
          <span className={NUM + ' text-[56px] text-brand-300'}>:</span>{' '}
          <span className={NUM + ' text-[88px] ' + (score2 > score1 ? 'text-white' : 'text-white/70')}>{score2}</span>
        </div>
        {rows > 0 && (
          <div className="overflow-hidden border border-white/10 bg-[color-mix(in_srgb,var(--color-brand-900)_55%,transparent)]">
            <div className="bg-brand-500 py-1.5 text-center text-[12px] font-bold tracking-[0.3em] text-white uppercase">Партии</div>
            <ol className="m-0 list-none p-0" data-testid="score-games">
              {Array.from({ length: rows }, (_, i) => (
                <GameRow key={i} i={i} game={games[i]} next={live && i === games.length} />
              ))}
            </ol>
          </div>
        )}
      </div>
      <Column p={player2} side="right" lead={score2 > score1} src={src2} />
    </section>
  );
}
