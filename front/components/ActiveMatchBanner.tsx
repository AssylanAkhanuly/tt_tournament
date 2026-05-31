"use client";

import { useState } from "react";
import { Zap, X, Minus, Plus, ChevronRight, Swords } from "lucide-react";
import { api, ActiveMatch } from "@/lib/api";
import { useLang } from "@/lib/i18n";

// you-win presets (top row) and opponent-win presets (bottom row)
const QUICK: [number, number][] = [
  [3, 0], [3, 1], [3, 2],
  [0, 3], [1, 3], [2, 3],
];

export default function ActiveMatchBanner({ match }: { match: ActiveMatch }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scored, setScored] = useState(false);

  // Once the player submits the score the match is finished — hide the banner
  // immediately (the 20s poll would otherwise keep it around).
  if (scored) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-left mb-4 rounded-2xl overflow-hidden border border-blue-500/30
                   bg-gradient-to-r from-blue-600/25 to-cyan-500/10 hover:from-blue-600/35 transition-all active:scale-[.99]"
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-blue-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wide">{t.your_match}</p>
            <p className="text-[14px] font-semibold text-white truncate">
              {match.table_number ? `${t.table_label} ${match.table_number} · ` : ""}{match.tournament_name}
            </p>
            {match.opponent_name && (
              <p className="text-[12px] text-white/55 truncate">{t.vs_opponent} {match.opponent_name}</p>
            )}
          </div>
          <ChevronRight size={18} className="text-blue-300 shrink-0" />
        </div>
      </button>

      {open && (
        <ActiveMatchDrawer
          match={match}
          onClose={() => setOpen(false)}
          onScored={() => { setScored(true); setOpen(false); }}
        />
      )}
    </>
  );
}

function ActiveMatchDrawer({
  match, onClose, onScored,
}: {
  match: ActiveMatch;
  onClose: () => void;
  onScored: () => void;
}) {
  const { t } = useLang();
  const [showScore, setShowScore] = useState(false);
  const [you, setYou] = useState(0);
  const [opp, setOpp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opponent = match.opponent_name ?? "—";

  async function submit() {
    if (you === opp) { setError("Ничья недопустима."); return; }
    setLoading(true); setError(null);
    // Map you/opponent back onto player1/player2 for the API.
    const score1 = match.you_is_player1 ? you : opp;
    const score2 = match.you_is_player1 ? opp : you;
    try {
      if (match.kind === "group" && match.group_id != null) {
        await api.submitGroupScore(match.tournament_id, match.group_id, match.match_id, score1, score2);
      } else {
        await api.submitScore(match.tournament_id, match.match_id, score1, score2);
      }
      onScored();
    } catch (e: unknown) {
      setError((e as Record<string, string>)?.detail ?? "Не удалось сохранить.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[400px] rounded-[24px] border border-white/[0.12] overflow-hidden
                      shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
           style={{ background: "var(--elevated)" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />{t.your_match}
            </p>
            <h2 className="text-[19px] font-bold text-white mt-0.5 leading-tight truncate">
              {match.tournament_name}
            </h2>
            {match.table_number != null && (
              <p className="text-[13px] text-white/50 mt-0.5">{t.table_label} {match.table_number}</p>
            )}
          </div>
          <button onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.13]
                       flex items-center justify-center text-white/35 hover:text-white transition-all shrink-0">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* You vs opponent */}
          <div className="flex items-center gap-3">
            <PlayerChip name={match.your_name} you score={showScore ? you : null} />
            <div className="flex flex-col items-center shrink-0">
              <Swords size={16} className="text-white/30" />
              <span className="text-[10px] font-bold text-white/30 mt-0.5">VS</span>
            </div>
            <PlayerChip name={opponent} score={showScore ? opp : null} />
          </div>

          {!showScore ? (
            <button onClick={() => setShowScore(true)}
              className="w-full py-3.5 rounded-xl font-bold text-[16px] bg-blue-600 hover:bg-blue-500
                         text-white transition-all active:scale-[.98] shadow-[0_4px_20px_rgba(59,130,246,0.35)]">
              {t.enter_score}
            </button>
          ) : (
            <>
              {/* Steppers */}
              <div className="space-y-2.5">
                {[
                  { name: match.your_name, val: you, set: setYou },
                  { name: opponent, val: opp, set: setOpp },
                ].map(({ name, val, set }, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 border border-white/[0.08] bg-white/[0.04]">
                    <span className="flex-1 text-[14px] font-semibold text-white/80 truncate">{name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { set(Math.max(0, val - 1)); setError(null); }}
                        className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center justify-center text-white/50 hover:text-white active:scale-90">
                        <Minus size={13} />
                      </button>
                      <span className="w-9 text-center text-[26px] font-black tabular-nums leading-none text-white/85">{val}</span>
                      <button onClick={() => { set(val + 1); setError(null); }}
                        className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center justify-center text-white/50 hover:text-white active:scale-90">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick presets (you : opponent) */}
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK.map(([a, b]) => {
                  const active = you === a && opp === b;
                  return (
                    <button key={`${a}:${b}`} onClick={() => { setYou(a); setOpp(b); setError(null); }}
                      className={`py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                        active ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                               : "bg-white/[0.05] hover:bg-white/[0.10] text-white/55 hover:text-white"
                      }`}>
                      {a} : {b}
                    </button>
                  );
                })}
              </div>

              {error && (
                <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
                  {error}
                </p>
              )}

              <button onClick={submit} disabled={loading || you === opp}
                className="w-full py-3.5 rounded-xl font-bold text-[16px] bg-blue-600 hover:bg-blue-500 text-white
                           transition-all active:scale-[.98] disabled:opacity-35 shadow-[0_4px_20px_rgba(59,130,246,0.35)]">
                {loading ? "Сохранение..." : `${you} : ${opp} — Сохранить`}
              </button>
            </>
          )}

          <button onClick={onClose}
            className="w-full py-2 text-[14px] font-medium text-white/30 hover:text-white/60 transition-colors">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerChip({ name, score, you }: { name: string; score: number | null; you?: boolean }) {
  return (
    <div className={`flex-1 min-w-0 rounded-2xl px-3 py-2.5 border text-center ${
      you ? "border-blue-500/35 bg-blue-500/[0.10]" : "border-white/[0.08] bg-white/[0.04]"
    }`}>
      <p className={`text-[13px] font-bold truncate ${you ? "text-blue-200" : "text-white/80"}`}>{name}</p>
      {score != null && (
        <p className="text-[24px] font-black tabular-nums leading-none mt-1 text-white">{score}</p>
      )}
    </div>
  );
}
