"use client";

import { Match, User } from "@/lib/types";

interface Props {
  matches: Match[];
  currentUser: User | null;
  isAdmin: boolean;
  onEnterScore: (match: Match) => void;
}

// Layout constants (px)
const CARD_H = 88;   // height of one match card
const GAP = 12;      // vertical gap between cards in the same column
const COL_W = 184;   // card / column width
const COL_GAP = 32;  // horizontal gap between columns

function roundLabel(r: number, maxRound: number): string {
  if (r === maxRound) return "Финал";
  if (r === maxRound - 1) return "Полуфинал";
  if (r === maxRound - 2) return "Четвертьфинал";
  return `Раунд ${r}`;
}

interface MatchCardProps {
  match: Match;
  currentUser: User | null;
  isAdmin: boolean;
  onEnterScore: (match: Match) => void;
}

function PlayerRow({
  player,
  score,
  isWinner,
  pending,
}: {
  player: User | null;
  score: number | null;
  isWinner: boolean;
  pending: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm ${
        isWinner
          ? "bg-green-50 text-green-800 font-semibold"
          : pending
          ? "text-gray-400 italic"
          : "text-gray-700"
      }`}
    >
      <span className="truncate max-w-[110px]">
        {isWinner && "🏆 "}
        {player ? player.name : "—"}
      </span>
      {score !== null && (
        <span className="ml-2 font-bold tabular-nums">{score}</span>
      )}
    </div>
  );
}

function MatchCard({ match, currentUser, isAdmin, onEnterScore }: MatchCardProps) {
  const canScore =
    match.status === "in_progress" &&
    (isAdmin ||
      currentUser?.id === match.player1?.id ||
      currentUser?.id === match.player2?.id);

  const isWinner1 = match.winner !== null && match.winner.id === match.player1?.id;
  const isWinner2 = match.winner !== null && match.winner.id === match.player2?.id;
  const pending = match.status === "pending";

  return (
    <div
      className={`absolute w-full rounded-xl border shadow-sm bg-white overflow-hidden transition-shadow ${
        canScore ? "border-blue-300 hover:shadow-md" : "border-gray-200"
      }`}
      style={{ height: CARD_H }}
    >
      {/* Match header */}
      <div
        className={`px-2 py-0.5 text-[10px] font-medium ${
          match.status === "finished"
            ? "bg-gray-100 text-gray-500"
            : match.status === "in_progress"
            ? "bg-blue-50 text-blue-600"
            : "bg-gray-50 text-gray-400"
        }`}
      >
        М{match.match_number}
        {match.status === "in_progress" && " · Идёт"}
        {match.status === "finished" && " · Завершён"}
        {match.status === "pending" && " · Ожидание"}
      </div>

      {/* Players */}
      <div className="px-1 pt-1 space-y-0.5">
        <PlayerRow player={match.player1} score={match.score1} isWinner={isWinner1} pending={pending} />
        <div className="text-[10px] text-gray-400 text-center leading-none">vs</div>
        <PlayerRow player={match.player2} score={match.score2} isWinner={isWinner2} pending={pending} />
      </div>

      {/* Score button */}
      {canScore && (
        <button
          onClick={() => onEnterScore(match)}
          className="absolute bottom-1 right-1 left-1 text-[11px] py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Ввести счёт
        </button>
      )}
    </div>
  );
}

export default function BracketView({ matches, currentUser, isAdmin, onEnterScore }: Props) {
  if (matches.length === 0) return null;

  const rounds = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => a - b);
  const maxRound = rounds[rounds.length - 1];

  // Infer bracket_size from the max number of matches in round 1
  const r1Matches = matches.filter((m) => m.round_number === 1).length;
  const bracketSize = r1Matches * 2; // could also compute 2^maxRound if you prefer
  const totalH = (bracketSize / 2) * (CARD_H + GAP);

  const totalW = rounds.length * COL_W + (rounds.length - 1) * COL_GAP;

  return (
    <div className="overflow-x-auto pb-2">
      {/* Column headers */}
      <div
        className="flex mb-3"
        style={{ width: totalW, gap: COL_GAP }}
      >
        {rounds.map((r) => (
          <div key={r} style={{ width: COL_W }} className="text-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {roundLabel(r, maxRound)}
            </span>
          </div>
        ))}
      </div>

      {/* Bracket body */}
      <div className="flex" style={{ width: totalW, gap: COL_GAP, height: totalH }}>
        {rounds.map((r) => {
          const roundMatches = matches
            .filter((m) => m.round_number === r)
            .sort((a, b) => a.match_number - b.match_number);

          // Vertical interval grows by 2× per round for correct alignment
          const interval = Math.pow(2, r - 1) * (CARD_H + GAP);
          const firstOffset = interval / 2 - CARD_H / 2;

          return (
            <div
              key={r}
              className="relative flex-shrink-0"
              style={{ width: COL_W, height: totalH }}
            >
              {roundMatches.map((match, idx) => (
                <div
                  key={match.id}
                  className="absolute"
                  style={{
                    top: Math.round(firstOffset + idx * interval),
                    width: COL_W,
                    height: CARD_H,
                  }}
                >
                  <MatchCard
                    match={match}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    onEnterScore={onEnterScore}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
