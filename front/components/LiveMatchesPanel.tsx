"use client";

import { useState } from "react";
import { Match, TournamentTable } from "@/lib/types";
import { api } from "@/lib/api";
import { Zap, ChevronDown, Check } from "lucide-react";

interface Props {
  tournamentId: string;
  matches: Match[];
  isAdmin: boolean;
  onMatchUpdated: (match: Match) => void;
  onEnterScore: (match: Match) => void;
  tables: TournamentTable[];
}

// ── Custom table picker (replaces native <select> to avoid white-dropdown bug) ─
function TablePicker({
  tables, value, onChange, placeholder = "Выбрать стол",
}: {
  tables: TournamentTable[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = tables.find((t) => String(t.number) === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 text-[12px] px-3 py-1.5 rounded-xl
                   bg-white/[0.07] border border-white/[0.10] text-white min-w-[140px]
                   hover:bg-white/[0.11] focus:outline-none focus:border-blue-500/60 transition-all"
      >
        <span className={selected ? "text-white" : "text-white/40"}>{selected?.display_name ?? placeholder}</span>
        <ChevronDown size={12} className={`text-white/35 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border border-white/[0.12]
                          shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
               style={{ background: "var(--elevated)", minWidth: "160px" }}>
            {tables.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-white/30">Нет свободных столов</p>
            ) : (
              tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onChange(String(t.number)); setOpen(false); }}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5
                              text-[13px] transition-colors hover:bg-white/[0.07] ${
                    String(t.number) === value
                      ? "text-blue-300 bg-blue-500/10"
                      : "text-white/70"
                  }`}
                >
                  {t.display_name}
                  {String(t.number) === value && <Check size={13} className="text-blue-400 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function LiveMatchesPanel({
  tournamentId, matches, isAdmin, onMatchUpdated, onEnterScore, tables,
}: Props) {
  const [assigning, setAssigning] = useState<number | null>(null);

  const live    = matches.filter((m) => m.status === "in_progress");
  const pending = matches.filter((m) => m.status === "pending" && m.player1 && m.player2);

  const activeTables = tables.filter((t) => t.is_active);
  const usedNums     = new Set(live.map((m) => m.table_number).filter(Boolean));
  const freeTables   = activeTables.filter((t) => !usedNums.has(t.number));
  const tableNameMap = Object.fromEntries(tables.map((t) => [t.number, t.display_name]));

  async function assignTable(match: Match, tableNum: number | null) {
    setAssigning(match.id);
    try {
      const updated = await api.assignTable(tournamentId, match.id, tableNum);
      onMatchUpdated(updated);
    } catch { /* silent */ }
    finally { setAssigning(null); }
  }

  const hasMatches = live.length > 0 || pending.length > 0;

  return (
    <div className="flex h-full min-h-0">

      {/* ══ LEFT: Table grid ══════════════════════════════════════════════════ */}
      <div className="w-[260px] shrink-0 flex flex-col border-r border-white/[0.07] overflow-y-auto"
           style={{ background: "var(--surface)" }}>

        <div className="px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Столы</p>
            <p className="text-[11px] text-white/20">
              {freeTables.length} св. · {usedNums.size} зан.
            </p>
          </div>

          {activeTables.length === 0 ? (
            <p className="text-[12px] text-white/20 py-4 text-center">Нет столов</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {activeTables.map((t) => {
                const m = live.find((x) => x.table_number === t.number);
                return (
                  <button
                    key={t.id}
                    disabled={!m}
                    onClick={() => m && onEnterScore(m)}
                    title={m
                      ? `${m.player1?.name ?? "?"} vs ${m.player2?.name ?? "?"}`
                      : `${t.display_name} свободен`}
                    className={`relative rounded-xl flex flex-col items-center justify-center
                                gap-0.5 py-3 font-bold transition-all select-none text-center ${
                      m
                        ? "bg-blue-600 hover:bg-blue-500 active:scale-[.92] cursor-pointer shadow-[0_0_14px_rgba(59,130,246,0.35)]"
                        : "bg-white/[0.04] border border-white/[0.06] cursor-default"
                    }`}
                  >
                    <span className={`text-[13px] leading-none truncate max-w-[90%] px-1 ${
                      m ? "text-white" : "text-white/15"
                    }`}>
                      {t.display_name}
                    </span>
                    {m ? (
                      <span className="text-[8px] font-bold text-blue-200 uppercase tracking-wide">live</span>
                    ) : (
                      <span className="text-[8px] text-white/10 uppercase tracking-wide">free</span>
                    )}
                    {m && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full
                                       bg-blue-300 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeTables.length > 0 && (
            <p className="text-[10px] text-white/15 text-center mt-2.5">
              Нажмите для ввода счёта
            </p>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Match list ════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4 space-y-5">

        {!hasMatches && (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
            <Zap size={32} className="text-white/10" />
            <p className="text-[15px] text-white/25">Нет активных матчей</p>
          </div>
        )}

        {/* Live matches */}
        {live.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-3
                          flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Идут сейчас ({live.length})
            </p>
            <div className="space-y-2.5">
              {live.map((m) => (
                <LiveMatchCard
                  key={m.id}
                  match={m}
                  isAdmin={isAdmin}
                  assigning={assigning === m.id}
                  freeTables={freeTables}
                  tableNameMap={tableNameMap}
                  onAssign={(t) => assignTable(m, t)}
                  onClear={() => assignTable(m, null)}
                  onScore={() => onEnterScore(m)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pending matches */}
        {pending.length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-3">
              Ожидают стола ({pending.length})
            </p>
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden
                            divide-y divide-white/[0.05]"
                 style={{ background: "var(--card)" }}>
              {pending.map((m) => (
                <PendingRow
                  key={m.id}
                  match={m}
                  isAdmin={isAdmin}
                  freeTables={freeTables}
                  assigning={assigning === m.id}
                  onAssign={(t) => assignTable(m, t)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Live match card ───────────────────────────────────────────────────────────
interface CardProps {
  match: Match;
  isAdmin: boolean;
  assigning: boolean;
  freeTables: TournamentTable[];
  tableNameMap: Record<number, string>;
  onAssign: (t: number) => void;
  onClear: () => void;
  onScore: () => void;
}

function LiveMatchCard({ match, isAdmin, assigning, freeTables, tableNameMap, onAssign, onClear, onScore }: CardProps) {
  const [tableInput, setTableInput] = useState("");
  const currentName = match.table_number ? (tableNameMap[match.table_number] ?? `Стол ${match.table_number}`) : null;

  return (
    <div className="rounded-2xl border border-blue-500/20 overflow-hidden"
         style={{ background: "rgba(59,130,246,0.04)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2
                      bg-blue-500/[0.08] border-b border-blue-500/15">
        <span className="text-[11px] font-bold text-blue-300/60 uppercase tracking-wider">
          ● Р{match.round_number} · М{match.match_number}
        </span>
        {currentName ? (
          <span className="text-[11px] font-bold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full">
            {currentName}
          </span>
        ) : (
          <span className="text-[11px] text-white/20">Без стола</span>
        )}
      </div>

      {/* Players */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center
                          text-[12px] font-bold text-white/40 shrink-0">
            {match.player1?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <span className="text-[14px] font-semibold text-white truncate">
            {match.player1?.name ?? "—"}
          </span>
        </div>
        <span className="text-[11px] font-bold text-white/20 shrink-0">VS</span>
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-[14px] font-semibold text-white truncate text-right">
            {match.player2?.name ?? "—"}
          </span>
          <div className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center
                          text-[12px] font-bold text-white/40 shrink-0">
            {match.player2?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        {isAdmin && (
          currentName ? (
            <button onClick={onClear} disabled={assigning}
              className="text-[12px] px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10]
                         text-white/45 hover:text-white disabled:opacity-40 transition-all
                         border border-white/[0.07]">
              Освободить {currentName}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <TablePicker tables={freeTables} value={tableInput} onChange={setTableInput} />
              <button
                onClick={() => { const n = parseInt(tableInput); if (!isNaN(n)) onAssign(n); }}
                disabled={!tableInput || assigning}
                className="text-[12px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500
                           text-white disabled:opacity-40 font-semibold transition-all active:scale-[.97]">
                {assigning ? "..." : "Назначить"}
              </button>
            </div>
          )
        )}

        <button onClick={onScore}
          className="ml-auto text-[13px] px-4 py-1.5 rounded-xl bg-emerald-500/20
                     hover:bg-emerald-500/30 border border-emerald-500/25 text-emerald-300
                     font-semibold transition-all active:scale-[.97]">
          Ввести счёт
        </button>
      </div>
    </div>
  );
}

// ── Pending match row ─────────────────────────────────────────────────────────
interface PendingProps {
  match: Match;
  isAdmin: boolean;
  freeTables: TournamentTable[];
  assigning: boolean;
  onAssign: (t: number) => void;
}

function PendingRow({ match, isAdmin, freeTables, assigning, onAssign }: PendingProps) {
  const [tableInput, setTableInput] = useState("");
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white/70">
          <span className="font-semibold text-white">{match.player1?.name}</span>
          <span className="text-white/25 mx-1.5">vs</span>
          <span className="font-semibold text-white">{match.player2?.name}</span>
        </p>
        <p className="text-[11px] text-white/25 mt-0.5">
          Р{match.round_number} · М{match.match_number}
        </p>
      </div>
      {isAdmin && freeTables.length > 0 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <TablePicker tables={freeTables} value={tableInput} onChange={setTableInput} placeholder="Стол" />
          <button
            onClick={() => { const n = parseInt(tableInput); if (!isNaN(n)) onAssign(n); }}
            disabled={!tableInput || assigning}
            className="text-[12px] px-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14]
                       text-white/60 hover:text-white disabled:opacity-40 transition-all font-semibold">
            {assigning ? "..." : "→"}
          </button>
        </div>
      )}
    </div>
  );
}
