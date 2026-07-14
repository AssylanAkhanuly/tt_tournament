"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Minus, Plus, Swords, Zap } from "lucide-react";
import { Drawer } from "vaul";
import { api, ActiveMatch } from "@/lib/api";
import { useLang } from "@/lib/i18n";

// you-win presets (top row) / opponent-win presets (bottom row)
const QUICK: [number, number][] = [
  [3, 0], [3, 1], [3, 2],
  [0, 3], [1, 3], [2, 3],
];

export default function MatchClient() {
  const { t } = useLang();
  const router = useRouter();
  const [match, setMatch] = useState<ActiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [you, setYou] = useState(0);
  const [opp, setOpp] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.getMyActiveMatch()
      .then((r) => setMatch(r.active_match))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!match) return;
    if (you === opp) { setError("Ничья недопустима."); return; }
    setSaving(true); setError(null);
    const score1 = match.you_is_player1 ? you : opp;
    const score2 = match.you_is_player1 ? opp : you;
    try {
      if (match.kind === "group" && match.group_id != null) {
        await api.submitGroupScore(match.tournament_id, match.group_id, match.match_id, score1, score2);
      } else {
        await api.submitScore(match.tournament_id, match.match_id, score1, score2);
      }
      setOpen(false);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError((e as Record<string, string>)?.detail ?? "Не удалось сохранить.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-[15px] text-white/50">{t.your_match}: —</p>
        <button onClick={() => router.push("/dashboard")}
          className="mt-4 px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
          {t.home}
        </button>
      </div>
    );
  }

  const opponent = match.opponent_name ?? "—";

  return (
    <div className="max-w-md mx-auto">
      <button onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-white/50 hover:text-white text-[14px] font-medium transition-colors">
        <ArrowLeft size={18} /> {t.home}
      </button>

      <div className="rounded-3xl border border-white/[0.08] overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="px-6 pt-6 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />{t.your_match}
          </p>
          <h1 className="text-[22px] font-black text-white mt-1 leading-tight">{match.tournament_name}</h1>
          {match.table_number != null && (
            <p className="text-[14px] text-white/55 mt-1.5 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-300" />{t.table_label} {match.table_number}
            </p>
          )}
        </div>
        <div className="px-6 pb-6 flex items-center gap-4">
          <div className="flex-1 rounded-2xl border border-blue-500/35 bg-blue-500/[0.10] px-4 py-4 text-center min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-300/70">Вы</p>
            <p className="text-[16px] font-bold text-white mt-1 truncate">{match.your_name}</p>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <Swords size={18} className="text-white/30" />
            <span className="text-[11px] font-bold text-white/30 mt-1">VS</span>
          </div>
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-4 text-center min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">Соперник</p>
            <p className="text-[16px] font-bold text-white/85 mt-1 truncate">{opponent}</p>
          </div>
        </div>
      </div>

      {match.i_proposed ? (
        <div className="mt-5 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] px-5 py-4 flex items-center gap-4">
          <Clock size={22} className="text-amber-400 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-amber-200">Ждём подтверждения соперника</p>
            <p className="text-[13px] text-white/50 mt-0.5">
              Вы предложили{" "}
              {match.you_is_player1
                ? `${match.proposed_score1} : ${match.proposed_score2}`
                : `${match.proposed_score2} : ${match.proposed_score1}`}
            </p>
          </div>
        </div>
      ) : (
        <button onClick={() => { setError(null); setOpen(true); }}
          className="w-full mt-5 py-4 rounded-2xl font-bold text-[16px] bg-blue-600 hover:bg-blue-500 text-white
                     transition-all active:scale-[.98] shadow-[0_8px_24px_rgba(59,130,246,0.4)]">
          {t.enter_score}
        </button>
      )}

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[90]" />
          <Drawer.Content
            className="fixed bottom-0 inset-x-0 z-[91] mt-24 flex flex-col rounded-t-[24px] border-t border-white/[0.12] outline-none"
            style={{ background: "var(--elevated)" }}>
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="px-5 pt-3 pb-8 w-full max-w-md mx-auto space-y-4">
              <Drawer.Title className="text-[18px] font-bold text-white">{t.enter_score}</Drawer.Title>

              <div className="space-y-2.5">
                {[
                  { name: match.your_name, val: you, set: setYou },
                  { name: opponent, val: opp, set: setOpp },
                ].map(({ name, val, set }, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 border border-white/[0.08] bg-white/[0.04]">
                    <span className="flex-1 text-[14px] font-semibold text-white/80 truncate">{name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { set(Math.max(0, val - 1)); setError(null); }}
                        className="w-9 h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center justify-center text-white/50 hover:text-white active:scale-90">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-[28px] font-black tabular-nums leading-none text-white/85">{val}</span>
                      <button onClick={() => { set(val + 1); setError(null); }}
                        className="w-9 h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center justify-center text-white/50 hover:text-white active:scale-90">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {QUICK.map(([a, b]) => {
                  const isActive = you === a && opp === b;
                  return (
                    <button key={`${a}:${b}`} onClick={() => { setYou(a); setOpp(b); setError(null); }}
                      className={`py-2.5 rounded-xl text-[14px] font-bold transition-all active:scale-95 ${
                        isActive ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
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

              <button onClick={submit} disabled={saving || you === opp}
                className="w-full py-3.5 rounded-xl font-bold text-[16px] bg-blue-600 hover:bg-blue-500 text-white
                           transition-all active:scale-[.98] disabled:opacity-35 shadow-[0_4px_20px_rgba(59,130,246,0.35)]">
                {saving ? "Сохранение..." : `${you} : ${opp} — Сохранить`}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
