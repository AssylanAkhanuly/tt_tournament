"use client";

import { useState } from "react";
import { Match } from "@/lib/types";

interface Props {
  match: Match;
  onClose: () => void;
  onSubmit: (score1: number, score2: number) => Promise<void>;
}

export default function ScoreModal({ match, onClose, onSubmit }: Props) {
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setError("Введите корректный счёт (целое число ≥ 0).");
      return;
    }
    if (s1 === s2) {
      setError("Ничья недопустима — один игрок должен победить.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit(s1, s2);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e?.detail ?? "Не удалось сохранить счёт.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Ввести счёт</h2>
        <p className="text-sm text-gray-500 mb-5">
          Раунд {match.round_number}, матч {match.match_number}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player 1 */}
          <div className="flex items-center gap-3">
            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
              {match.player1?.name ?? "—"}
            </span>
            <input
              type="number"
              min={0}
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              placeholder="0"
              required
              className="w-20 text-center px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-lg font-bold"
            />
          </div>

          {/* Divider */}
          <div className="text-center text-gray-400 text-xs font-medium">vs</div>

          {/* Player 2 */}
          <div className="flex items-center gap-3">
            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
              {match.player2?.name ?? "—"}
            </span>
            <input
              type="number"
              min={0}
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              placeholder="0"
              required
              className="w-20 text-center px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-lg font-bold"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
