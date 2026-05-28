"use client";

import { useEffect, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { Match } from "@/lib/types";

interface Props {
  match: Match;
  onClose: () => void;
  onSubmit: (score1: number, score2: number) => Promise<void>;
}

// Common table-tennis best-of-5 results
const QUICK: [number, number][] = [
  [3, 0], [3, 1], [3, 2],
  [0, 3], [1, 3], [2, 3],
];

export default function ScoreModal({ match, onClose, onSubmit }: Props) {
  const [s1, setS1]         = useState(0);
  const [s2, setS2]         = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const p1 = match.player1?.name ?? "Игрок 1";
  const p2 = match.player2?.name ?? "Игрок 2";

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pick(a: number, b: number) { setS1(a); setS2(b); setError(null); }

  async function save() {
    if (s1 === s2) { setError("Ничья недопустима."); return; }
    setLoading(true); setError(null);
    try { await onSubmit(s1, s2); }
    catch (err: unknown) {
      setError((err as Record<string, string>)?.detail ?? "Не удалось сохранить.");
    } finally { setLoading(false); }
  }

  const p1wins = s1 > s2;
  const p2wins = s2 > s1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 bg-black/75 backdrop-blur-md p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="border border-white/[0.12] rounded-[24px]
                      shadow-[0_32px_80px_rgba(0,0,0,0.7)] w-full max-w-[360px]
                      overflow-hidden"
           style={{ background: "var(--elevated)" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
              Р{match.round_number} · М{match.match_number}
              {match.table_number ? ` · Стол ${match.table_number}` : ""}
            </p>
            <h2 className="text-[20px] font-bold text-white mt-0.5 leading-tight">
              Счёт матча
            </h2>
          </div>
          <button onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.13]
                       flex items-center justify-center text-white/35 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">

          {/* ── Player score rows ────────────────────────────────────── */}
          <div className="space-y-2.5">
            {[
              { name: p1, score: s1, setScore: setS1, wins: p1wins },
              { name: p2, score: s2, setScore: setS2, wins: p2wins },
            ].map(({ name, score, setScore, wins }, i) => (
              <div key={i}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 border
                            transition-all duration-200 ${
                  wins
                    ? "border-emerald-500/35 bg-emerald-500/[0.08]"
                    : "border-white/[0.08] bg-white/[0.04]"
                }`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center
                                 text-[14px] font-black shrink-0 transition-all ${
                  wins ? "bg-emerald-500/25 text-emerald-300" : "bg-white/[0.07] text-white/35"
                }`}>
                  {name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <span className={`flex-1 text-[14px] font-semibold truncate transition-colors ${
                  wins ? "text-white" : "text-white/55"
                }`}>
                  {name}
                </span>

                {/* Stepper */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setScore(Math.max(0, score - 1)); setError(null); }}
                    className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14]
                               flex items-center justify-center text-white/50 hover:text-white
                               transition-all active:scale-[.90]"
                  >
                    <Minus size={13} />
                  </button>
                  <span className={`w-10 text-center text-[28px] font-black tabular-nums
                                    leading-none transition-colors ${
                    wins ? "text-emerald-300" : "text-white/80"
                  }`}>
                    {score}
                  </span>
                  <button
                    onClick={() => { setScore(score + 1); setError(null); }}
                    className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14]
                               flex items-center justify-center text-white/50 hover:text-white
                               transition-all active:scale-[.90]"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick presets ─────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
              Быстрый результат
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK.map(([a, b]) => {
                const active = s1 === a && s2 === b;
                const p1Win  = a > b;
                return (
                  <button
                    key={`${a}:${b}`}
                    onClick={() => pick(a, b)}
                    className={`py-2 rounded-xl text-[13px] font-bold transition-all active:scale-[.95] ${
                      active
                        ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                        : p1Win
                        ? "bg-white/[0.06] hover:bg-white/[0.11] text-white/55 hover:text-white"
                        : "bg-white/[0.04] hover:bg-white/[0.09] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {a} : {b}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/20 text-center mt-2">
              Первые 3 строки — победа {p1} · Вторые — победа {p2}
            </p>
          </div>

          {/* ── Error ────────────────────────────────────────────────── */}
          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20
                          rounded-xl px-4 py-2.5 text-center">
              {error}
            </p>
          )}

          {/* ── Submit ───────────────────────────────────────────────── */}
          <button
            onClick={save}
            disabled={loading || s1 === s2}
            className="w-full py-3.5 rounded-xl font-bold text-[16px] transition-all
                       active:scale-[.98] disabled:opacity-35
                       bg-blue-600 hover:bg-blue-500 text-white
                       shadow-[0_4px_20px_rgba(59,130,246,0.35)]"
          >
            {loading ? "Сохранение..." : `${s1} : ${s2} — Сохранить`}
          </button>

          {/* ── Cancel ───────────────────────────────────────────────── */}
          <button onClick={onClose}
            className="w-full py-2.5 text-[14px] font-medium text-white/30
                       hover:text-white/60 transition-colors">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
