'use client';

/* Табло судьи стола ✳ (23.11.2026, решения владельца продукта; ориентиры —
   карточка матча Apple Sports и карточка с вырезом «Matchday» из присланного
   образца).

   Всё табло — одна карточка во всю рабочую область (с полями вокруг): сверху
   по центру вырез с заголовком матча (турнир; стол, группа, круг), внутри —
   рамка стола (кромка по форме карточки, сетка, средняя линия) и фигуры
   игроков: верхние 60 % снимка по пояс из профиля сборной (нет снимка
   — заглушка своего пола), приглушены и растворяются книзу, без ореола.
   Половины игроков разделены градиентом от центра к краям — у каждого свой
   цвет. Внизу по краям — очки идущей партии крупно со столбиком «+» / «−»,
   под ними аватары и фамилии, в центре номер партии и счёт матча; под ними —
   язычок с главным действием (записать партию, сохранить правку, подтвердить
   результат). В углу — таблица партий: столбец — партия, щелчок переключает
   табло на неё. Формы выреза и язычка считаются по живому размеру
   (`clip-path: path()`), чтобы изгибы не растягивались вместе с карточкой.
   Синего стола под карточкой больше нет (решение 23.11.2026). */

import { Minus, Plus } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import type { ScoringPlayer } from '@/entities/tournament';
import { shortName } from '@/shared/lib/name';
import { placeholderOf } from '@/widgets/national/RosterParts';

const NUM = 'font-[family-name:var(--font-jersey)] tabular-nums leading-none';
/** Разделение игроков: от центра к краям — голубой бренда слева, коралловый справа. */
const SPLIT =
  'bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand-500)_38%,transparent)_0%,transparent_50%,color-mix(in_srgb,var(--color-qtt-coral)_34%,transparent)_100%)]';

export type Pair = [number, number];
type Side = 'left' | 'right';

/** Снимок фигуры или заглушка; справа заглушка не повторяет левую. */
export function figureOf(p: ScoringPlayer, avoid?: string): string {
  if (p.figure) return p.figure;
  let src = placeholderOf({ id: p.id, person: { sex: p.sex } });
  for (let k = 1; src === avoid && k < 8; k++) src = placeholderOf({ id: p.id + k, person: { sex: p.sex } });
  return src;
}

// ── формы ────────────────────────────────────────────────────────────────────

function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<[number, number, number] | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox([el.offsetWidth, el.offsetHeight, el.offsetTop]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

/** Карточка во всю ширину страницы (с полями вокруг) и вырезом сверху по
    центру: плавные S-изгибы, как у образца. */
function cardPath(w: number, h: number, notch: number, depth: number, r = 28): string {
  const k = 22;
  // Вырез не заходит на скругления углов, как бы узок ни был экран.
  notch = Math.min(notch, w - 2 * (r + k));
  const x1 = (w - notch) / 2;
  const x2 = (w + notch) / 2;
  return (
    `M0 ${r}Q0 0 ${r} 0L${x1 - k} 0C${x1} 0 ${x1} ${depth} ${x1 + k} ${depth}` +
    `L${x2 - k} ${depth}C${x2} ${depth} ${x2} 0 ${x2 + k} 0L${w - r} 0Q${w} 0 ${w} ${r}` +
    `L${w} ${h - r}Q${w} ${h} ${w - r} ${h}L${r} ${h}Q0 ${h} 0 ${h - r}Z`
  );
}

/** Язычок снизу: основание во всю ширину, плечи расходятся S-изгибами. */
function tabPath(w: number, h: number): string {
  const f = 26;
  return `M0 ${h}C${f} ${h} ${f} 0 ${2 * f} 0L${w - 2 * f} 0C${w - f} 0 ${w - f} ${h} ${w} ${h}Z`;
}

// ── стол и фигуры ────────────────────────────────────────────────────────────

/** Рамка стола внутри карточки: кромка повторяет форму карточки с отступом,
    сетка — от выреза до низа, средняя линия поперёк; обе рвутся вокруг блока
    счёта (`gap` — его верх и низ). */
function TableFrame({ w, h, notch, depth, gap }: { w: number; h: number; notch: number; depth: number; gap?: [number, number] }) {
  const m = 14;
  const net = gap
    ? [[depth + m, gap[0] - 12], [gap[1] + 12, h - m]].filter(([a, b]) => b > a)
    : [[depth + m, h - m]];
  // Средняя линия рвётся вокруг блока счёта, если проходит через него (сетка
  // счёта — не шире 760 px и с полями по краям карточки, как в разметке ниже).
  const half = Math.min(760, w - 64) / 2 + 16;
  const crosses = gap && h / 2 > gap[0] - 12 && h / 2 < gap[1] + 12;
  const mid = crosses ? [[m, w / 2 - half], [w / 2 + half, w - m]].filter(([a, b]) => b > a) : [[m, w - m]];
  return (
    <svg aria-hidden className="absolute inset-0 size-full">
      <path d={cardPath(w - 2 * m, h - 2 * m, notch + m, depth, 28 - m)} transform={`translate(${m} ${m})`} fill="none" className="stroke-white/45" strokeWidth={2.5} />
      {net.map(([y1, y2]) => (
        <line key={y1} x1={w / 2} y1={y1} x2={w / 2} y2={y2} className="stroke-white/40" strokeWidth={2.5} />
      ))}
      {mid.map(([x1, x2]) => (
        <line key={x1} x1={x1} y1={h / 2} x2={x2} y2={h / 2} className="stroke-white/20" strokeWidth={1} />
      ))}
    </svg>
  );
}

/** `bottom` — от низа карточки: фигура стоит на блоке счёта, чуть заходя за него. */
function Figure({ src, side, photo, bottom, height }: { src: string; side: Side; photo: boolean; bottom?: number; height?: number }) {
  return (
    <div
      aria-hidden
      style={bottom !== undefined ? { bottom, height } : undefined}
      data-placed={bottom !== undefined ? '' : undefined}
      className={
        'pointer-events-none absolute top-0 h-[46%] w-[50%] overflow-hidden data-[placed]:top-auto [mask-image:linear-gradient(to_bottom,black_45%,transparent_95%)] md:h-[48%] md:w-[34%] ' +
        (side === 'left' ? 'left-0 md:left-[6%]' : 'right-0 md:right-[6%]')
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute top-0 left-1/2 h-[166%] w-auto max-w-none -translate-x-1/2 opacity-85 saturate-[0.85]"
        data-testid={'board-figure-' + side}
        data-photo={photo ? 'yes' : 'no'}
      />
    </div>
  );
}

// ── карточка ─────────────────────────────────────────────────────────────────

function Avatar({ p, src }: { p: ScoringPlayer; src: string }) {
  return (
    <span className="block size-12 shrink-0 overflow-hidden rounded-full bg-qtt-peach ring-2 ring-white/80 md:size-14">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.avatar ?? src}
        alt=""
        className={'size-full object-cover ' + (p.avatar ? '' : 'origin-[50%_12%] scale-[2.2] object-top')}
      />
    </span>
  );
}

function Stepper({ n, name, onStep }: { n: 1 | 2; name: string; onStep: (d: 1 | -1) => void }) {
  const btn = 'flex h-12 w-11 items-center justify-center text-white transition active:bg-white/25 disabled:opacity-30 md:h-14 md:w-12';
  return (
    <div className="flex shrink-0 flex-col overflow-hidden rounded-full bg-white/12 ring-1 ring-white/25 backdrop-blur">
      <button type="button" className={btn} aria-label={`Плюс очко: ${name}`} data-testid={`point-plus-${n}`} onClick={() => onStep(1)}>
        <Plus size={20} strokeWidth={2.5} />
      </button>
      <span className="mx-2 h-px bg-white/25" />
      <button type="button" className={btn} aria-label={`Минус очко: ${name}`} data-testid={`point-minus-${n}`} onClick={() => onStep(-1)}>
        <Minus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SidePoints({ n, p, value, lead, onStep, side, avatar }: {
  n: 1 | 2;
  p: ScoringPlayer;
  value: number;
  lead: boolean;
  onStep?: (d: 1 | -1) => void;
  side: Side;
  avatar: string;
}) {
  return (
    <div className={'flex min-w-0 flex-col gap-3 ' + (side === 'left' ? 'items-start' : 'items-end')}>
      <div className={'flex items-center gap-2.5 md:gap-4 ' + (side === 'right' ? 'flex-row-reverse' : '')}>
        {onStep && <Stepper n={n} name={p.name} onStep={onStep} />}
        <span className={NUM + ' text-[76px] md:text-[120px] ' + (lead ? 'text-white' : 'text-white/75')} data-testid={`points-${n}`}>
          {value}
        </span>
      </div>
      <div className={'flex min-w-0 items-center gap-2.5 ' + (side === 'right' ? 'flex-row-reverse text-right' : '')}>
        <Avatar p={p} src={avatar} />
        <div className="min-w-0" data-testid={'board-name-' + side}>
          <div className="truncate text-[15px] leading-tight font-bold md:text-[18px]" title={p.name}>{shortName(p.name)}</div>
          {p.region && <div className="truncate text-[12px] text-white/60">{p.region}</div>}
        </div>
      </div>
    </div>
  );
}

/** Язычок карточки — главное действие (или подпись, если действия нет). */
export function StageTab({ children, onPress, disabled, testId, tone = 'accent' }: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testId?: string;
  tone?: 'accent' | 'success' | 'quiet';
}) {
  const [ref, box] = useBox<HTMLDivElement>();
  const bg =
    disabled || tone === 'quiet'
      ? 'bg-[color-mix(in_srgb,white_12%,var(--color-brand-900))] text-white/55'
      : tone === 'success'
        ? 'bg-qtt-lime text-brand-900'
        : 'bg-brand-500 text-brand-950';
  return (
    <div
      ref={ref}
      className={'absolute bottom-0 left-1/2 h-14 w-[min(78%,360px)] -translate-x-1/2 transition-colors md:h-16 ' + bg}
      style={box ? { clipPath: `path('${tabPath(box[0], box[1])}')` } : undefined}
    >
      {onPress ? (
        <button
          type="button"
          className="flex size-full items-center justify-center gap-2 pt-1 text-[16px] font-bold disabled:cursor-not-allowed md:text-[17px]"
          disabled={disabled}
          onClick={onPress}
          data-testid={testId}
        >
          {children}
        </button>
      ) : (
        <div className="flex size-full items-center justify-center gap-2 pt-1 text-[15px] font-semibold" data-testid={testId}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── таблица партий в углу ────────────────────────────────────────────────────

function GamesTable({ games, rows, live, draft, selected, onSelect, avatars, players }: {
  games: Pair[];
  rows: number;
  /** Номер идущей партии; нет — матч решён. */
  live: number | null;
  draft: Pair;
  selected: number;
  onSelect?: (i: number) => void;
  avatars: [string, string];
  players: [ScoringPlayer, ScoringPlayer];
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--color-brand-950)_60%,transparent)] p-1 ring-1 ring-white/15 backdrop-blur-xl" data-testid="score-games">
      <div className="flex flex-col items-center justify-end gap-1 px-1 pb-1">
        {players.map((p, k) => (
          <span key={p.id} className="block size-6 overflow-hidden rounded-full bg-qtt-peach ring-1 ring-white/60" title={p.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar ?? avatars[k]} alt="" className={'size-full object-cover ' + (p.avatar ? '' : 'origin-[50%_12%] scale-[2.2] object-top')} />
          </span>
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => {
        const g = games[i] ?? (i === live ? draft : undefined);
        const played = i < games.length;
        const open = played || i === live;
        const [a, b] = g ?? [];
        const cell = (v: number | undefined, win: boolean) => (
          <span className={NUM + ' flex h-6 items-center justify-center text-[18px] ' + (v === undefined ? 'text-white/25' : i === live ? 'text-brand-300' : win ? 'text-white' : 'text-white/45')}>
            {v ?? '–'}
          </span>
        );
        return (
          <button
            key={i}
            type="button"
            disabled={!open || !onSelect}
            onClick={() => onSelect?.(i)}
            aria-label={`Партия ${i + 1}`}
            aria-pressed={i === selected}
            className={'flex w-7 flex-col gap-1 rounded-xl pb-1 transition md:w-8 ' + (i === selected ? 'bg-white/18 ring-1 ring-white/40' : open ? 'hover:bg-white/8' : '')}
            data-testid={played ? 'score-game' : `game-tab-${i}`}
            data-score={played ? `${a} : ${b}` : undefined}
          >
            <span className={'flex h-5 items-center justify-center gap-0.5 text-[10px] font-semibold ' + (i === live ? 'text-brand-300' : 'text-white/55')}>
              {i === live && <span className="size-1.5 animate-pulse rounded-full bg-brand-400" />}
              {i + 1}
            </span>
            {cell(a, a !== undefined && b !== undefined && a > b && played)}
            {cell(b, a !== undefined && b !== undefined && b > a && played)}
          </button>
        );
      })}
    </div>
  );
}

// ── сцена ────────────────────────────────────────────────────────────────────

export function ScoreStage({
  player1,
  player2,
  points,
  onStep,
  center,
  title,
  caption,
  games,
  rows,
  live,
  draft,
  selected,
  onSelect,
  tab,
  below,
}: {
  player1: ScoringPlayer;
  player2: ScoringPlayer;
  /** Крупные числа по краям: очки выбранной партии (или итог матча). */
  points: Pair;
  /** «+» / «−» у чисел; нет — только смотреть. */
  onStep?: (side: 0 | 1, d: 1 | -1) => void;
  center: ReactNode;
  /** Заголовок матча в вырезе карточки (турнир) и строка под ним (стол, группа, круг). */
  title: string;
  caption: string;
  games: Pair[];
  rows: number;
  live: number | null;
  draft: Pair;
  selected: number;
  onSelect?: (i: number) => void;
  /** Язычок с действием внизу карточки. */
  tab: ReactNode;
  /** Мелкая строка над язычком (снять партию, короткий путь, кто подтвердил). */
  below?: ReactNode;
}) {
  const src1 = figureOf(player1);
  const src2 = figureOf(player2, src1);
  const [cardRef, cardBox] = useBox<HTMLDivElement>();
  const [capRef, capBox] = useBox<HTMLDivElement>();
  const [bodyRef, bodyBox] = useBox<HTMLDivElement>();
  // Низ фигур — на 64 px ниже верха блока счёта.
  const figureBottom = cardBox && bodyBox ? Math.max(0, cardBox[1] - bodyBox[2] - 64) : undefined;
  // Высота — не больше места между вырезом и блоком счёта: голова не уходит под вырез.
  const figureHeight = cardBox && bodyBox ? Math.max(120, Math.min(cardBox[1] * 0.47, bodyBox[2] + 64 - (capBox?.[1] ?? 52) - 24)) : undefined;
  const depth = capBox?.[1] ?? 52;
  const notch = (capBox?.[0] ?? 160) + 28;
  const d = cardBox ? cardPath(cardBox[0], cardBox[1], notch, depth) : undefined;
  const [a, b] = points;

  return (
    <section className="flex h-full min-h-[640px] w-full p-3 md:min-h-[600px] md:p-6" data-testid="board-stage">
      {/* Форма режет только слой фона: заголовок стоит в вырезе, а фигуры — внутри карточки. */}
      <div ref={cardRef} className="relative isolate flex w-full flex-col text-white">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden" style={d ? { clipPath: `path('${d}')` } : undefined}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-brand-700)_0%,var(--color-brand-900)_70%)]" />
          <div className={'absolute inset-0 ' + SPLIT} />
          <Figure src={src1} side="left" photo={!!player1.figure} bottom={figureBottom} height={figureHeight} />
          <Figure src={src2} side="right" photo={!!player2.figure} bottom={figureBottom} height={figureHeight} />
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,var(--color-brand-900)_35%,transparent)]" />
          {cardBox && <TableFrame w={cardBox[0]} h={cardBox[1]} notch={notch} depth={depth} gap={bodyBox ? [bodyBox[2], bodyBox[2] + bodyBox[1]] : undefined} />}
        </div>
        {d && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full overflow-visible">
            <path d={d} fill="none" className="stroke-white/20" strokeWidth={1.5} />
          </svg>
        )}
        <div
          ref={capRef}
          className="absolute top-0 left-1/2 flex max-w-[calc(100%-150px)] -translate-x-1/2 flex-col items-center gap-0.5 px-2 pt-2 pb-2.5 text-center text-neutral-900"
          data-testid="board-title"
        >
          <div className="max-w-full truncate text-[13px] leading-tight font-bold md:text-[17px]" title={title}>{title}</div>
          <div className="max-w-full truncate text-[10px] font-semibold tracking-[0.1em] text-neutral-500 uppercase md:text-[11px] md:tracking-[0.14em]">{caption}</div>
        </div>

        {rows > 0 && (
          <div className="absolute top-[84px] right-6 z-20 md:top-8 md:right-8">
            <GamesTable games={games} rows={rows} live={live} draft={draft} selected={selected} onSelect={onSelect} avatars={[src1, src2]} players={[player1, player2]} />
          </div>
        )}

        <div ref={bodyRef} className="relative mt-auto px-4 pb-20 md:my-auto md:px-8 md:pt-8 md:pb-8">
          <div className="mx-auto grid max-w-[760px] grid-cols-[1fr_auto_1fr] items-start gap-2 md:gap-6">
            <SidePoints n={1} p={player1} value={a} lead={a > b} side="left" avatar={src1} onStep={onStep && ((x) => onStep(0, x))} />
            <div className="flex min-w-[84px] flex-col items-center gap-1.5 pt-3 text-center md:pt-6">{center}</div>
            <SidePoints n={2} p={player2} value={b} lead={b > a} side="right" avatar={src2} onStep={onStep && ((x) => onStep(1, x))} />
          </div>
          {below && <div className="mt-4 flex justify-center">{below}</div>}
        </div>
        {tab}
      </div>
    </section>
  );
}
