"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Match, Participant, Tournament, User } from "@/lib/types";
import { api } from "@/lib/api";
import ParticipantList from "@/components/ParticipantList";
import BracketView from "@/components/BracketView";
import ScoreModal from "@/components/ScoreModal";

// QRCodeDisplay uses window.location.origin — load client-only
const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });

interface Props {
  user: User;
  tournament: Tournament;
  participants: Participant[];
  initialMatches: Match[];
}

const STATUS_LABEL: Record<Tournament["status"], string> = {
  open: "Открыт",
  in_progress: "В процессе",
  finished: "Завершён",
};

const STATUS_COLOR: Record<Tournament["status"], string> = {
  open: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  finished: "bg-gray-100 text-gray-600",
};

export default function TournamentDetailClient({
  user,
  tournament,
  participants,
  initialMatches,
}: Props) {
  const router = useRouter();
  const [currentTournament, setTournament] = useState<Tournament>(tournament);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);

  const startsAt = currentTournament.starts_at
    ? new Date(currentTournament.starts_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // ── Start tournament ──────────────────────────────────────────────────────
  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      const result = await api.startTournament(currentTournament.id);
      setTournament(result.tournament);
      setMatches(result.matches);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setStartError(e?.detail ?? "Не удалось начать турнир.");
    } finally {
      setStarting(false);
    }
  }

  // ── Submit score ──────────────────────────────────────────────────────────
  async function handleScoreSubmit(score1: number, score2: number) {
    if (!scoreMatch) return;
    const updated = await api.submitScore(currentTournament.id, scoreMatch.id, score1, score2);
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

    // Also refresh newly unlocked next-round matches from server
    const freshMatches = await api.getMatches(currentTournament.id);
    setMatches(freshMatches);

    // Refresh tournament status (might be finished now)
    const freshT = await api.getTournament(currentTournament.id);
    setTournament(freshT);

    setScoreMatch(null);
  }

  // ── My active matches (for player view) ───────────────────────────────────
  const myActiveMatches = matches.filter(
    (m) =>
      m.status === "in_progress" &&
      (m.player1?.id === user.id || m.player2?.id === user.id)
  );

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Назад к турнирам
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{currentTournament.name}</h1>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[currentTournament.status]}`}
          >
            {STATUS_LABEL[currentTournament.status]}
          </span>
        </div>
        {currentTournament.description && (
          <p className="text-gray-500 mt-2">{currentTournament.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
          {startsAt && <span>📅 {startsAt}</span>}
          <span>👥 {currentTournament.participant_count} участников</span>
          <span>Создан: {new Date(currentTournament.created_at).toLocaleDateString("ru-RU")}</span>
        </div>
      </div>

      {/* ── Admin controls ─────────────────────────────────────────────────── */}
      {user.is_staff && currentTournament.status === "open" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-semibold text-amber-900 mb-1">Турнир ещё не начат</h2>
          <p className="text-sm text-amber-700 mb-4">
            Когда все участники зарегистрированы, нажмите «Начать турнир» — будет создан сетка плей-офф.
          </p>
          {startError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{startError}</p>
          )}
          <button
            onClick={handleStart}
            disabled={starting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {starting ? "Создание сетки..." : "🏆 Начать турнир"}
          </button>
        </div>
      )}

      {/* ── Winner banner ──────────────────────────────────────────────────── */}
      {currentTournament.status === "finished" && (() => {
        const finalMatch = matches.find(
          (m) => m.round_number === Math.max(...matches.map((x) => x.round_number))
        );
        return finalMatch?.winner ? (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-6 text-center text-white shadow-md">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-bold">Победитель турнира</h2>
            <p className="text-2xl font-black mt-1">{finalMatch.winner.name}</p>
          </div>
        ) : null;
      })()}

      {/* ── Bracket view ──────────────────────────────────────────────────── */}
      {matches.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Турнирная сетка</h2>
          <BracketView
            matches={matches}
            currentUser={user}
            isAdmin={user.is_staff}
            onEnterScore={setScoreMatch}
          />
        </div>
      )}

      {/* ── My active matches (player only) ───────────────────────────────── */}
      {!user.is_staff && myActiveMatches.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h2 className="font-semibold text-blue-900 mb-3">Ваши текущие матчи</h2>
          <div className="space-y-3">
            {myActiveMatches.map((m) => {
              const opponent =
                m.player1?.id === user.id ? m.player2 : m.player1;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Раунд {m.round_number} · Матч {m.match_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      vs {opponent?.name ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => setScoreMatch(m)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Счёт
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* QR code — admins only */}
        {user.is_staff && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">QR-код для вступления</h2>
            <QRCodeDisplay joinToken={currentTournament.join_token} />
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Участники ({participants.length})
          </h2>
          <ParticipantList participants={participants} />
        </div>
      </div>

      {/* Score modal */}
      {scoreMatch && (
        <ScoreModal
          match={scoreMatch}
          onClose={() => setScoreMatch(null)}
          onSubmit={handleScoreSubmit}
        />
      )}
    </div>
  );
}
