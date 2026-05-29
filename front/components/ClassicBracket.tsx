"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Match, User } from "@/lib/types";

// ── Layout constants ────────────────────────────────────────────────────────
const CARD_W       = 220;
const CARD_H       = 92;          // estimated card height for slot/line maths
const COL_GAP      = 104;
const SLOT_H       = CARD_H + 22; // vertical slot per match inside a section
const SECTION_GAP  = 52;          // gap between stacked place-band sections
const LABEL_H      = 26;
const TOP_PADDING  = 30;
const LEFT_PADDING = 30;
const INITIAL_PAN  = { x: 40, y: 24 };
const INITIAL_SCALE = 0.82;

type LayoutLine  = { id: string; d: string; loser?: boolean };
type LayoutLabel = { id: string; text: string; x: number; y: number; width: number; section?: boolean };
type LayoutItem  = { id: string; match: Match; x: number; y: number; seed1: number | null; seed2: number | null };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Round column header: 1/64 … ФИНАЛ relative to the deepest winners round.
function roundLabel(round: number, maxRound: number): string {
  const fromEnd = maxRound - round;
  if (fromEnd === 0) return "ФИНАЛ";
  if (fromEnd === 1) return "1 / 2";
  if (fromEnd === 2) return "1 / 4";
  const denom = 2 ** (fromEnd); // 1/8, 1/16 …
  return `1 / ${denom}`;
}

function sectionTitle(lo: number, hi: number): string {
  if (lo === 1) return "Основная сетка";
  if (lo === hi) return `Место ${lo}`;
  return `Места ${lo}–${hi}`;
}

function LabelBox({ text, width, section }: { text: string; width: number; section?: boolean }) {
  if (section) {
    return (
      <div style={{ width }} className="flex items-center gap-2 pointer-events-none select-none">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300/70 shrink-0">
          {text}
        </span>
        <div className="h-px flex-1 bg-sky-300/15" />
      </div>
    );
  }
  return (
    <div
      style={{ width, height: LABEL_H }}
      className="pointer-events-none flex items-center justify-center border border-sky-300/40 bg-sky-200/[0.07] text-[11px] font-bold uppercase tracking-[0.14em] text-sky-100/85"
    >
      {text}
    </div>
  );
}

function MatchCard({
  match,
  seed1,
  seed2,
  currentUser,
  isAdmin,
  onActivate,
}: {
  match: Match;
  seed1: number | null;
  seed2: number | null;
  currentUser: User | null;
  isAdmin: boolean;
  onActivate: (match: Match) => void;
}) {
  const isLive     = match.status === "in_progress";
  const isFinished = match.status === "finished";
  const canScore =
    isLive &&
    (isAdmin ||
      currentUser?.id === match.player1?.id ||
      currentUser?.id === match.player2?.id);

  const p1Winner = !!match.winner && match.winner.id === match.player1?.id;
  const p2Winner = !!match.winner && match.winner.id === match.player2?.id;

  function row(player: User | null, seed: number | null, score: number | null, winner: boolean, isLast?: boolean) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 ${
          !isLast ? "border-b border-white/[0.05]" : ""
        } ${winner ? "bg-emerald-500/[0.10]" : ""}`}
      >
        <span className="w-5 shrink-0 text-right text-[9px] font-bold tabular-nums text-white/25">
          {player && seed ? seed : ""}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[12px] leading-tight ${
              winner
                ? "font-bold text-white"
                : player
                ? "font-semibold text-white/82"
                : "italic text-white/24"
            }`}
          >
            {player?.name ?? "—"}
          </div>
        </div>
        {player && (
          <span className="shrink-0 text-[9px] font-medium text-red-300/65 tabular-nums">
            {player.rating}
          </span>
        )}
        <div
          className={`w-4 text-right text-[15px] font-black tabular-nums ${
            winner ? "text-red-300" : "text-red-300/85"
          }`}
        >
          {score ?? ""}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: CARD_W }}
      onClick={canScore ? () => onActivate(match) : undefined}
      title={canScore ? "Ввести счёт" : undefined}
      className={`overflow-hidden border shadow-[0_8px_30px_rgba(0,0,0,0.18)] ${
        canScore ? "cursor-pointer ring-1 ring-blue-400/40 hover:ring-blue-300/80 hover:border-blue-300/80" : ""
      } ${
        isLive
          ? "border-blue-400/60 bg-[#0e2344]"
          : isFinished
          ? "border-white/[0.18] bg-[#111a28]"
          : "border-white/[0.12] bg-[#0d1624]"
      }`}
    >
      <div
        className={`flex items-center justify-between px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${
          isLive ? "bg-blue-500/18 text-blue-200" : "bg-white/[0.04] text-white/28"
        }`}
      >
        <span>{isLive ? "Live" : `M${match.match_number}`}</span>
        <div className="flex items-center gap-1.5">
          {match.table_number != null && <span>Ст.{match.table_number}</span>}
          {!isLive && isFinished && <span>Готово</span>}
        </div>
      </div>
      {row(match.player1, seed1, match.score1, p1Winner)}
      {row(match.player2, seed2, match.score2, p2Winner, true)}
    </div>
  );
}

export default function ClassicBracket({
  matches,
  currentUser,
  isAdmin,
  onEnterScore,
  className,
}: {
  matches: Match[];
  currentUser: User | null;
  isAdmin: boolean;
  onEnterScore: (match: Match) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const movedRef = useRef(false); // distinguishes a card click from a pan drag

  const [pan,   setPan]   = useState(INITIAL_PAN);
  const [scale, setScale] = useState(INITIAL_SCALE);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const layout = useMemo(() => {
    const labels: LayoutLabel[] = [];
    const items: LayoutItem[] = [];
    const lines: LayoutLine[] = [];
    const empty = { items, labels, lines, width: 600, height: 400 };
    if (matches.length === 0) return empty;

    const byId = new Map<number, Match>(matches.map((m) => [m.id, m]));

    // ── Seed numbers: rank every distinct player by rating (best = seed 1) ────
    const seedById = new Map<string, number>();
    {
      const seen = new Map<string, User>();
      for (const m of matches) {
        if (m.player1) seen.set(m.player1.id, m.player1);
        if (m.player2) seen.set(m.player2.id, m.player2);
      }
      [...seen.values()]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .forEach((u, i) => seedById.set(u.id, i + 1));
    }
    const playerCount = seedById.size; // real field size (bracket is padded to 2^n)

    // ── Place intervals from the winner_next / loser_next graph ───────────────
    // size(m) = number of final places contested in m's interval.
    // start(m) = the best (lowest) place number of that interval.
    const sizeMemo = new Map<number, number>();
    const computeSize = (m: Match): number => {
      const cached = sizeMemo.get(m.id);
      if (cached !== undefined) return cached;
      sizeMemo.set(m.id, 2); // cycle guard
      if (!m.winner_next_id && !m.loser_next_id) return 2;
      const w = m.winner_next_id ? byId.get(m.winner_next_id) : null;
      const l = m.loser_next_id ? byId.get(m.loser_next_id) : null;
      const s = ((w ? computeSize(w) : 0) + (l ? computeSize(l) : 0)) || 2;
      sizeMemo.set(m.id, s);
      return s;
    };

    const incoming = new Set<number>();
    for (const m of matches) {
      if (m.winner_next_id) incoming.add(m.winner_next_id);
      if (m.loser_next_id)  incoming.add(m.loser_next_id);
    }
    const startMemo = new Map<number, number>();
    const setStart = (m: Match, s: number) => {
      if (startMemo.has(m.id)) return;
      startMemo.set(m.id, s);
      const w = m.winner_next_id ? byId.get(m.winner_next_id) : null;
      const l = m.loser_next_id ? byId.get(m.loser_next_id) : null;
      if (w) setStart(w, s);
      if (l) setStart(l, s + (w ? computeSize(w) : 0));
    };
    for (const m of matches) if (!incoming.has(m.id)) setStart(m, 1);

    const startOf = (m: Match) => startMemo.get(m.id) ?? 1;

    // ── True-phantom detection (slots that will never receive a real player) ──
    const truePhantoms = (() => {
      const fedBy = new Map<number, number[]>();
      for (const m of matches) {
        for (const nid of [m.winner_next_id, m.loser_next_id]) {
          if (nid) (fedBy.get(nid) ?? fedBy.set(nid, []).get(nid)!).push(m.id);
        }
      }
      const phantoms = new Set<number>();
      const rounds = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b);
      for (const round of rounds) {
        for (const m of matches.filter((x) => x.round_number === round)) {
          const feeders = fedBy.get(m.id) ?? [];
          if (feeders.length === 0) {
            if (!m.player1 && !m.player2) phantoms.add(m.id);
          } else if (feeders.every((id) => phantoms.has(id))) {
            phantoms.add(m.id);
          }
        }
      }
      return phantoms;
    })();
    const isPhantom = (m: Match) => truePhantoms.has(m.id);

    // Hide every match that no real player can ever appear in:
    //  • byes / ghosts — auto-finished with no score (a bye seats its single
    //    player directly in the next round, RTTF-style; a ghost had none);
    //  • unreachable — its whole place range lies beyond the real field
    //    (e.g. places 21–32 for 20 players), so it only resolves phantom places.
    const isFinishedEmpty = (m: Match) =>
      m.status === "finished" && m.score1 == null && m.score2 == null;
    const isUnreachable = (m: Match) => startOf(m) > playerCount;

    const hidden = (m: Match) => isPhantom(m) || isFinishedEmpty(m) || isUnreachable(m);

    const visible = matches.filter((m) => !hidden(m));
    if (visible.length === 0) return empty;

    const allRounds = [...new Set(visible.map((m) => m.round_number))].sort((a, b) => a - b);
    const maxRound  = allRounds[allRounds.length - 1];
    const colX = (round: number) => LEFT_PADDING + (round - 1) * (CARD_W + COL_GAP);

    // ── Group matches into place-band sections ────────────────────────────────
    // Main bracket (interval starting at place 1) is its own section; every
    // other match is grouped by the power-of-two place block it resolves into:
    //   3–4 | 5–8 | 9–16 | 17–32 …  (block b spans 2^(b-1)+1 .. 2^b)
    const sectionKey = (m: Match): number => {
      const lo = startOf(m);
      if (lo === 1) return 0;
      return Math.ceil(Math.log2(lo)); // 2,3,4 …
    };
    const sectionBounds = (key: number): [number, number] =>
      key === 0 ? [1, 2] : [2 ** (key - 1) + 1, 2 ** key];

    const sections = new Map<number, Match[]>();
    for (const m of visible) {
      const k = sectionKey(m);
      (sections.get(k) ?? sections.set(k, []).get(k)!).push(m);
    }
    const sectionKeys = [...sections.keys()].sort((a, b) => a - b);

    // ── Lay out each section as a centered bracket, stacked vertically ────────
    const posY = new Map<number, number>(); // global y (top of card)
    // Leave room for the round-column headers AND each section's own header.
    let cursorY = TOP_PADDING + LABEL_H * 2 + 16;

    for (const key of sectionKeys) {
      const ms = sections.get(key)!;
      const rounds = [...new Set(ms.map((m) => m.round_number))].sort((a, b) => a - b);
      const localY = new Map<number, number>();
      let maxLocal = 0;

      const feedersOf = (m: Match) =>
        ms.filter((f) => f.winner_next_id === m.id || f.loser_next_id === m.id);

      for (const r of rounds) {
        const col = ms
          .filter((m) => m.round_number === r)
          .sort((a, b) => a.match_number - b.match_number);

        // Tentative y: average of already-placed same-section feeders.
        const tentative = col.map((m, i) => {
          const fed = feedersOf(m).filter((f) => localY.has(f.id));
          if (fed.length) {
            const ys = fed.map((f) => localY.get(f.id)!);
            return { m, y: ys.reduce((a, b) => a + b, 0) / ys.length };
          }
          return { m, y: i * SLOT_H };
        });

        // Reflow within the column to enforce non-overlap while keeping order.
        tentative.sort((a, b) => a.y - b.y);
        let last = -Infinity;
        for (const t of tentative) {
          if (t.y < last + SLOT_H) t.y = last + SLOT_H;
          last = t.y;
          localY.set(t.m.id, t.y);
          maxLocal = Math.max(maxLocal, t.y);
        }
      }

      // Section header. The bracket is padded to a power of two, so structural
      // place ranges can exceed the real field (e.g. "17–32" for 20 players).
      // Cap the displayed range at the actual player count — places beyond it
      // are phantom byes that no real player can finish in.
      const [lo, hiRaw] = sectionBounds(key);
      const hi = Math.min(hiRaw, playerCount);
      const headerWidth =
        (rounds[rounds.length - 1] - rounds[0] + 1) * (CARD_W + COL_GAP) - COL_GAP;
      labels.push({
        id: `sec-${key}`,
        text: sectionTitle(lo, hi),
        x: colX(rounds[0]),
        y: cursorY - LABEL_H,
        width: Math.max(CARD_W, headerWidth),
        section: true,
      });

      // Commit global positions
      for (const m of ms) {
        const gy = cursorY + (localY.get(m.id) ?? 0);
        posY.set(m.id, gy);
        items.push({
          id: `m-${m.id}`,
          match: m,
          x: colX(m.round_number),
          y: gy,
          seed1: m.player1 ? seedById.get(m.player1.id) ?? null : null,
          seed2: m.player2 ? seedById.get(m.player2.id) ?? null : null,
        });
      }

      cursorY += maxLocal + CARD_H + LABEL_H + SECTION_GAP;
    }

    // ── Round column headers (across the top) ─────────────────────────────────
    for (const round of allRounds) {
      labels.push({
        id: `round-${round}`,
        text: roundLabel(round, maxRound),
        x: colX(round),
        y: TOP_PADDING,
        width: CARD_W,
      });
    }

    // ── Connector lines ───────────────────────────────────────────────────────
    // Winner edges route through the column-gap midpoint so the two feeders of
    // a match merge into one clean elbow (classic bracket look). Loser/drop
    // edges are spread across distinct vertical "lanes" within the gap so the
    // long cross-band connectors fan out and stay individually traceable
    // instead of stacking into an unreadable wall.
    type Edge = { m: Match; t: Match };
    const winnerEdges: Edge[] = [];
    const loserEdges:  Edge[] = [];
    for (const m of visible) {
      if (!posY.has(m.id)) continue;
      const we = m.winner_next_id ? byId.get(m.winner_next_id) : null;
      if (we && !hidden(we) && posY.has(we.id)) winnerEdges.push({ m, t: we });
      const le = m.loser_next_id ? byId.get(m.loser_next_id) : null;
      if (le && !hidden(le) && posY.has(le.id)) loserEdges.push({ m, t: le });
    }

    const elbow = (fromX: number, fromY: number, vx: number, toY: number, toX: number) =>
      `M ${fromX} ${fromY} H ${vx} V ${toY} H ${toX}`;

    // Winner elbows — vertical at the target column's gap midpoint.
    for (const { m, t } of winnerEdges) {
      const fromX = colX(m.round_number) + CARD_W;
      const toX   = colX(t.round_number);
      lines.push({
        id: `w-${m.id}-${t.id}`,
        d: elbow(fromX, posY.get(m.id)! + CARD_H / 2, toX - COL_GAP * 0.5, posY.get(t.id)! + CARD_H / 2, toX),
      });
    }

    // Loser drops — one lane per drop within the left part of the gap, ordered
    // by source height so neighbouring drops occupy neighbouring lanes.
    const loserByRound = new Map<number, Edge[]>();
    for (const e of loserEdges) {
      const r = e.m.round_number;
      (loserByRound.get(r) ?? loserByRound.set(r, []).get(r)!).push(e);
    }
    for (const [, arr] of loserByRound) {
      arr.sort((a, b) => posY.get(a.m.id)! - posY.get(b.m.id)!);
      const K = arr.length;
      const band = COL_GAP * 0.5;
      arr.forEach((e, i) => {
        const fromX = colX(e.m.round_number) + CARD_W;
        const toX   = colX(e.t.round_number);
        const vx    = fromX + 10 + (K > 1 ? (i * band) / (K - 1) : 0);
        lines.push({
          id: `l-${e.m.id}-${e.t.id}`,
          d: elbow(fromX, posY.get(e.m.id)! + CARD_H / 2, vx, posY.get(e.t.id)! + CARD_H / 2, toX),
          loser: true,
        });
      });
    }

    const maxX = items.length ? Math.max(...items.map((i) => i.x + CARD_W)) + 200 : 600;
    const maxY = cursorY + 120;
    return { items, labels, lines, width: maxX, height: maxY };
  }, [matches]);

  // ── Wheel zoom (non-passive) ───────────────────────────────────────────────
  const panRef   = useRef(pan);
  const scaleRef = useRef(scale);
  useEffect(() => { panRef.current   = pan;   }, [pan]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect   = el.getBoundingClientRect();
      const cx     = e.clientX - rect.left;
      const cy     = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.08 : 0.925;
      const prev   = scaleRef.current;
      const next   = clamp(prev * factor, 0.2, 2.0);
      const { x: px, y: py } = panRef.current;
      setScale(next);
      setPan({ x: cx - ((cx - px) / prev) * next, y: cy - ((cy - py) / prev) * next });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Pointer drag (pan) ─────────────────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-pan='true']")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
  }
  function endDrag() { dragRef.current = null; }

  // Open the score modal only on a genuine click (not at the end of a pan drag).
  const activate = (m: Match) => { if (!movedRef.current) onEnterScore(m); };

  if (matches.length === 0) return null;

  return (
    <div className={className ?? "h-full w-full bg-transparent"}>
      <div
        ref={containerRef}
        className="relative h-full w-full cursor-grab overflow-hidden bg-[#07111d] touch-none select-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Zoom / reset controls */}
        <div
          data-no-pan="true"
          className="absolute left-3 top-3 z-20 flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1524]/92 shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {[
            { label: "+", action: () => setScale((v) => clamp(v * 1.12, 0.2, 2.0)) },
            { label: "−", action: () => setScale((v) => clamp(v * 0.9,  0.2, 2.0)) },
            { label: "↺", action: () => { setPan(INITIAL_PAN); setScale(INITIAL_SCALE); } },
          ].map((item) => (
            <button
              key={item.label}
              data-no-pan="true"
              onClick={item.action}
              className="h-10 w-10 border-b border-white/[0.06] text-[16px] font-semibold text-white/72 transition hover:bg-white/[0.05] last:border-b-0"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width:     layout.width,
            height:    layout.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          {/* SVG connector lines */}
          <svg
            width={layout.width}
            height={layout.height}
            className="absolute left-0 top-0 overflow-visible pointer-events-none"
          >
            {layout.lines.map((line) => (
              <path
                key={line.id}
                d={line.d}
                fill="none"
                stroke={line.loser ? "rgba(251,191,36,0.20)" : "rgba(125,211,252,0.34)"}
                strokeWidth={line.loser ? 1 : 1.5}
                strokeDasharray={line.loser ? "4 4" : undefined}
                strokeLinecap="square"
                shapeRendering={line.loser ? undefined : "crispEdges"}
              />
            ))}
          </svg>

          {/* Labels */}
          {layout.labels.map((label) => (
            <div key={label.id} className="absolute" style={{ left: label.x, top: label.y }}>
              <LabelBox text={label.text} width={label.width} section={label.section} />
            </div>
          ))}

          {/* Match cards */}
          {layout.items.map((item) => (
            <div key={item.id} className="absolute" style={{ left: item.x, top: item.y }}>
              <MatchCard
                match={item.match}
                seed1={item.seed1}
                seed2={item.seed2}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onActivate={activate}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
