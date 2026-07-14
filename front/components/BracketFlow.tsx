"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Match, User } from "@/lib/types";

// ── Layout constants ──────────────────────────────────────────────────────────
const CARD_W      = 220;
const CARD_H      = 148;
const H_GAP       = 100;
const BASE_VSPACE = CARD_H + 36; // vertical slot for round-1 cards

// ── Round label helper ────────────────────────────────────────────────────────
function roundLabel(r: number, maxRound: number): string {
  if (r === maxRound)     return "Финал";
  if (r === maxRound - 1) return "Полуфинал";
  if (r === maxRound - 2) return "1/4 финала";
  return `Раунд ${r}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type MatchNodeData = {
  match: Match;
  currentUser: User | null;
  isAdmin: boolean;
  onEnterScore: (match: Match) => void;
  absentIds?: Set<string>;
};

type LabelNodeData = { label: string };

// ── Round-label node ──────────────────────────────────────────────────────────
function RoundLabelNode({ data }: NodeProps) {
  return (
    <div
      style={{ width: CARD_W }}
      className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 pb-2 pointer-events-none select-none"
    >
      {(data as LabelNodeData).label}
    </div>
  );
}

// ── Match card node ───────────────────────────────────────────────────────────
function MatchNode({ data }: NodeProps) {
  const { match, currentUser, isAdmin, onEnterScore, absentIds } = data as MatchNodeData;

  const isLive     = match.status === "in_progress";
  const isFinished = match.status === "finished";
  const isProposed = match.status === "score_proposed";  // awaiting opponent confirmation

  const canScore =
    isLive &&
    (isAdmin ||
      currentUser?.id === match.player1?.id ||
      currentUser?.id === match.player2?.id);
  // Admin can also open a proposed match to override the result.
  const canOpen = canScore || (isAdmin && isProposed);

  // Show the pending numbers + winner while a score awaits confirmation.
  const dScore1 = isProposed ? match.proposed_score1 : match.score1;
  const dScore2 = isProposed ? match.proposed_score2 : match.score2;
  const effWinner = isProposed ? match.proposed_winner : match.winner;
  const isW1 = effWinner !== null && effWinner?.id === match.player1?.id;
  const isW2 = effWinner !== null && effWinner?.id === match.player2?.id;

  return (
    <div
      style={{ width: CARD_W }}
      className={`rounded-2xl overflow-hidden transition-all select-none ${
        isLive
          ? "border border-blue-500/50 shadow-[0_0_28px_rgba(59,130,246,0.18)] bg-[#091c38]"
          : isFinished
          ? "border border-white/[0.09] bg-[#0a1628]"
          : "border border-white/[0.06] bg-[#0a1628]/70"
      }`}
    >
      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-3 py-[5px] ${
        isLive     ? "bg-blue-500/[0.18]" :
        isFinished ? "bg-white/[0.035]"   :
                     "bg-white/[0.02]"
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          isLive ? "text-blue-300" : isProposed ? "text-amber-300" : isFinished ? "text-emerald-400/70" : "text-white/20"
        }`}>
          {isLive     && "● Live"}
          {isProposed && "⏳ Ожидает"}
          {isFinished && "✓ Завершён"}
          {!isLive && !isFinished && !isProposed && `М${match.match_number}`}
        </span>

        <div className="flex items-center gap-1.5">
          {match.table_number != null && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              isLive
                ? "bg-blue-500/30 text-blue-200"
                : "bg-white/[0.08] text-white/30"
            }`}>
              Ст.{match.table_number}
            </span>
          )}
          {(isLive || isFinished) && (
            <span className="text-[10px] text-white/20">М{match.match_number}</span>
          )}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className={`h-px ${isLive ? "bg-blue-500/20" : "bg-white/[0.05]"}`} />

      {/* ── Players ─────────────────────────────────────────────────────── */}
      <div className="py-1">
        {[
          { player: match.player1, score: dScore1, isWinner: isW1 },
          { player: match.player2, score: dScore2, isWinner: isW2 },
        ].map(({ player, score, isWinner }, i) => {
          // Yellow when currently absent, or when this player was the no-show in
          // this match (the loser of a walkover) — so past forfeits read clearly.
          const absent = (!!player && !!absentIds?.has(player.id)) ||
            (match.is_walkover && !!player && !!match.winner && player.id !== match.winner.id);
          return (
          <div key={i}>
            <div className={`flex items-center gap-2 px-3 py-[7px] ${
              isWinner ? "bg-emerald-500/[0.11]" : absent ? "bg-amber-500/[0.07]" : ""
            }`}>
              <span className="w-3.5 shrink-0 text-[11px] text-center">
                {isWinner ? "🏆" : ""}
              </span>
              <span className={`flex-1 text-[13px] truncate leading-tight ${
                isWinner
                  ? "font-semibold text-emerald-300"
                  : absent
                  ? "font-semibold text-amber-300"
                  : player
                  ? "text-white/75"
                  : "text-white/20 italic"
              }`}>
                {player ? player.name : "TBD"}
                {absent && <span className="ml-1 text-[9px] font-bold text-amber-300 uppercase">н/я</span>}
              </span>
              {score !== null && score !== undefined && (
                <span className={`text-[16px] font-black tabular-nums leading-none ${
                  isWinner ? "text-emerald-300" : "text-white/45"
                }`}>
                  {score}
                </span>
              )}
            </div>
            {i === 0 && (
              <div className={`h-px mx-3 ${isLive ? "bg-blue-500/15" : "bg-white/[0.04]"}`} />
            )}
          </div>
          );
        })}
      </div>

      {/* ── Enter-score button ───────────────────────────────────────────── */}
      {canOpen && (
        <div className="px-3 pb-2.5 pt-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEnterScore(match); }}
            className={`w-full text-[12px] py-1.5 rounded-xl active:scale-[.97] text-white font-semibold transition-all ${
              isProposed ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {isProposed ? "Изменить счёт" : "Ввести счёт"}
          </button>
        </div>
      )}

      {/* React Flow handles (invisible) */}
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const nodeTypes = { matchNode: MatchNode, roundLabel: RoundLabelNode };

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  matches: Match[];
  currentUser: User | null;
  isAdmin: boolean;
  onEnterScore: (match: Match) => void;
  /** User ids of players marked absent — badged + dimmed in the bracket. */
  absentIds?: Set<string>;
  /** Container className — caller controls size; defaults to a minimum 500px tall block */
  className?: string;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function BracketFlow({ matches, currentUser, isAdmin, onEnterScore, absentIds, className }: Props) {
  const rounds = useMemo(
    () => [...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b),
    [matches]
  );
  const maxRound = rounds[rounds.length - 1] ?? 1;

  // Detect consolation bracket format (has any consolation match)
  const hasConsolation = matches.some((m) => m.is_consolation);

  // ── Build nodes ─────────────────────────────────────────────────────────
  const builtNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];

    rounds.forEach((r, rIdx) => {
      const roundMatches = matches
        .filter((m) => m.round_number === r)
        .sort((a, b) => {
          // Winners bracket first, then consolation
          if (a.is_consolation !== b.is_consolation) return a.is_consolation ? 1 : -1;
          return a.match_number - b.match_number;
        });

      const x = rIdx * (CARD_W + H_GAP);

      if (hasConsolation) {
        // All-places bracket: fixed slot height per match, no doubling
        const slotH = CARD_H + 24;

        nodes.push({
          id: `label-${r}`,
          type: "roundLabel",
          position: { x, y: -36 },
          data: { label: roundLabel(r, maxRound) },
          draggable: false, selectable: false,
        });

        roundMatches.forEach((match, idx) => {
          nodes.push({
            id: `m-${match.id}`,
            type: "matchNode",
            position: { x, y: idx * slotH },
            data: { match, currentUser, isAdmin, onEnterScore, absentIds } satisfies MatchNodeData,
            draggable: false, selectable: false,
          });
        });
      } else {
        // Standard single-elimination: slot doubles each round
        const slotH = BASE_VSPACE * Math.pow(2, rIdx);
        const cardTopOffset = slotH / 2 - CARD_H / 2;

        nodes.push({
          id: `label-${r}`,
          type: "roundLabel",
          position: { x, y: -36 },
          data: { label: roundLabel(r, maxRound) },
          draggable: false, selectable: false,
        });

        roundMatches.forEach((match, idx) => {
          nodes.push({
            id: `m-${match.id}`,
            type: "matchNode",
            position: { x, y: cardTopOffset + idx * slotH },
            data: { match, currentUser, isAdmin, onEnterScore, absentIds } satisfies MatchNodeData,
            draggable: false, selectable: false,
          });
        });
      }
    });

    return nodes;
  }, [matches, rounds, maxRound, currentUser, isAdmin, onEnterScore, hasConsolation]);

  // ── Build edges ─────────────────────────────────────────────────────────
  const builtEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    if (hasConsolation) {
      // Consolation bracket: no connecting edges — clean column grid
      // Progression is implied by column order (left = earlier rounds)
    } else {
      // Standard single-elimination: match_number * 2 math
      for (const match of matches) {
        if (match.round_number === 1) continue;
        const prevRound = match.round_number - 1;
        const src1 = matches.find(
          (m) => m.round_number === prevRound && m.match_number === match.match_number * 2 - 1
        );
        const src2 = matches.find(
          (m) => m.round_number === prevRound && m.match_number === match.match_number * 2
        );
        for (const src of [src1, src2]) {
          if (!src) continue;
          const isFinished = src.status === "finished";
          const isLive     = src.status === "in_progress";
          edges.push({
            id: `e-${src.id}-${match.id}`,
            source: `m-${src.id}`,
            target: `m-${match.id}`,
            type: "smoothstep",
            animated: isLive,
            style: {
              stroke: isFinished ? "rgba(34,197,94,0.45)"
                : isLive ? "rgba(59,130,246,0.60)"
                : "rgba(255,255,255,0.09)",
              strokeWidth: isFinished || isLive ? 2 : 1.5,
            },
          });
        }
      }
    }

    return edges;
  }, [matches, hasConsolation]);

  // ── Keep state in sync when matches prop changes (e.g. after score submit) ──
  const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(builtEdges);

  useEffect(() => { setNodes(builtNodes); }, [builtNodes, setNodes]);
  useEffect(() => { setEdges(builtEdges); }, [builtEdges, setEdges]);

  if (matches.length === 0) return null;

  return (
    <div className={className ?? "w-full h-full bg-[#050c18]"}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
