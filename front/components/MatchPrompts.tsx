"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { api, ActiveMatch } from "@/lib/api";

const CONFIRM_ID = "tt-confirm-score";
const ACTIVE_ID  = "tt-active-match";

/**
 * Global, app-wide match prompts driven by the active-match poll. Renders no
 * markup of its own — it imperatively shows Sonner toasts on every page:
 *  • opponent entered a score I must confirm → a persistent confirm/reject toast
 *  • otherwise, my live match (or "awaiting opponent") → a tappable banner toast
 * The confirm toast takes precedence and can't be swiped away (required action).
 */
export default function MatchPrompts({
  match, refresh,
}: { match: ActiveMatch | null; refresh: () => void }) {
  const router = useRouter();
  const busyRef = useRef(false);
  const lastSig = useRef<string>("none");
  // Active-match toasts the user dismissed — don't nag again for that match.
  const dismissedActive = useRef<Set<string>>(new Set());

  useEffect(() => {
    const m = match;
    if (!m) {
      toast.dismiss(CONFIRM_ID);
      toast.dismiss(ACTIVE_ID);
      lastSig.current = "none";
      return;
    }

    const key = `${m.kind}-${m.match_id}`;
    const sig = [
      key, m.awaiting_my_confirmation, m.i_proposed,
      m.proposed_score1, m.proposed_score2, m.table_number,
    ].join("|");
    if (sig === lastSig.current) return;   // nothing relevant changed — avoid flicker
    lastSig.current = sig;

    // ── Opponent proposed a score → I must confirm or reject it (priority) ─────
    if (m.awaiting_my_confirmation) {
      toast.dismiss(ACTIVE_ID);
      const a = m.proposed_score1 ?? 0;
      const b = m.proposed_score2 ?? 0;
      const opp = m.opponent_name ?? "Соперник";

      const act = async (accept: boolean) => {
        if (busyRef.current) return;
        busyRef.current = true;
        try {
          if (m.kind === "bracket") await api.confirmScore(m.tournament_id, m.match_id, accept);
          else await api.confirmGroupScore(m.tournament_id, m.group_id!, m.match_id, accept);
          toast.dismiss(CONFIRM_ID);
          lastSig.current = "none";
          if (accept) {
            toast.success("Счёт подтверждён");
          } else {
            toast("Счёт отклонён — введите свой счёт");
            router.push(`/dashboard/tournaments/${m.tournament_id}`);
          }
          refresh();
        } catch (e: unknown) {
          toast.error((e as Record<string, string>)?.detail ?? "Не удалось обработать.");
        } finally {
          busyRef.current = false;
        }
      };

      toast.custom(() => (
        <div className="w-[92vw] max-w-[400px] rounded-2xl border border-amber-500/45 bg-[#0b1524]
                        shadow-[0_16px_44px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="px-4 pt-3.5 pb-2 flex items-start gap-2.5">
            <span className="text-[20px] leading-none">🏓</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-amber-200">Подтвердите счёт</p>
              <p className="text-[12px] text-white/70 truncate">{opp} ввёл счёт {a} : {b}</p>
            </div>
          </div>
          <div className="flex gap-2 px-3 pb-3">
            <button onClick={() => act(true)}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[13px] active:scale-[.98]">
              ✓ Подтвердить
            </button>
            <button onClick={() => act(false)}
              className="flex-1 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-bold text-[13px] active:scale-[.98]">
              ✗ Отклонить
            </button>
          </div>
        </div>
      ), { id: CONFIRM_ID, duration: Infinity, dismissible: false, unstyled: true });
      return;
    }

    // ── Otherwise: my live match, or I proposed and await the opponent ────────
    toast.dismiss(CONFIRM_ID);
    if (dismissedActive.current.has(key)) return;

    const waiting = !!m.i_proposed;
    const tablePrefix = m.table_number ? `Стол ${m.table_number} · ` : "";
    toast.custom(() => (
      <button
        onClick={() => { toast.dismiss(ACTIVE_ID); router.push("/dashboard/match"); }}
        className="w-[92vw] max-w-[400px] text-left rounded-2xl border border-blue-500/35 bg-[#0b1524]
                   shadow-[0_16px_44px_rgba(0,0,0,0.6)] px-4 py-3 flex items-center gap-3 active:scale-[.99]">
        <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
          <Zap size={18} className="text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wide">
            {waiting ? "Ожидание подтверждения" : "Ваш матч"}
          </p>
          <p className="text-[13px] font-semibold text-white truncate">{tablePrefix}{m.tournament_name}</p>
          {m.opponent_name && <p className="text-[12px] text-white/55 truncate">против {m.opponent_name}</p>}
        </div>
      </button>
    ), {
      id: ACTIVE_ID, duration: Infinity, unstyled: true,
      onDismiss: () => dismissedActive.current.add(key),
    });
  }, [match, refresh, router]);

  return null;
}
