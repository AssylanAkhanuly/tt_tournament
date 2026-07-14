"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Participant, User } from "@/lib/types";
import PhoneInput from "./PhoneInput";

interface Props {
  tournamentId: string;
  existingUserIds: Set<string>;
  onClose: () => void;
  onAdded: (participant: Participant) => void;
}

export default function AddPlayerModal({ tournamentId, existingUserIds, onClose, onAdded }: Props) {
  const [view, setView]               = useState<"list" | "create">("list");
  const [query, setQuery]             = useState("");
  const [users, setUsers]             = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks IDs just added this session (for checkmark animation)
  const [justAdded, setJustAdded]     = useState<Set<string>>(new Set());
  // Temp PIN banner for newly created accounts
  const [pinBanner, setPinBanner]     = useState<{ name: string; pin: string } | null>(null);

  // Per-row loading
  const [addingId, setAddingId]       = useState<string | null>(null);

  // Create-new form
  const [newPhone, setNewPhone]       = useState("");
  const [newPhoneOk, setNewPhoneOk]   = useState(false);
  const [newName, setNewName]         = useState("");
  const [newRating, setNewRating]     = useState(100);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Load / search users ────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingList(true);
      try {
        setUsers(await api.searchUsers(query));
      } catch {
        setUsers([]);
      } finally {
        setLoadingList(false);
      }
    }, query ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // ── Add existing user — stays on list ──────────────────────────────────────
  async function handleAddExisting(user: User) {
    setAddingId(user.id);
    try {
      const result = await api.addParticipant(tournamentId, user.phone) as Participant & { temp_password?: string };
      onAdded(result);
      setJustAdded((s) => new Set(s).add(user.id));
      if (result.temp_password) {
        setPinBanner({ name: result.user.name, pin: result.temp_password });
      }
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      alert(e?.detail ?? "Не удалось добавить игрока.");
    } finally {
      setAddingId(null);
    }
  }

  // ── Create new user — returns to list with PIN banner ─────────────────────
  async function handleCreate() {
    if (!newPhoneOk || newName.trim().length < 2) return;
    setCreating(true); setCreateError(null);
    try {
      const result = await api.addParticipant(tournamentId, newPhone, newName.trim(), newRating) as Participant & { temp_password?: string };
      onAdded(result);
      setJustAdded((s) => new Set(s).add(result.user.id));
      if (result.temp_password) {
        setPinBanner({ name: result.user.name, pin: result.temp_password });
      }
      // Reset form & return to list
      setNewPhone(""); setNewName(""); setNewRating(100); setNewPhoneOk(false);
      setView("list");
    } catch (err: unknown) {
      setCreateError((err as Record<string, string>)?.detail ?? "Не удалось добавить игрока.");
    } finally { setCreating(false); }
  }

  const CARD_BG  = "bg-[#0f2040]";
  const INPUT_CLS = "w-full px-4 py-3 bg-white/[0.08] border border-white/[0.12] rounded-xl text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/70 transition-all";
  const LABEL    = "text-[11px] font-semibold uppercase tracking-widest text-white/45";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`${CARD_BG} rounded-[20px] border border-white/[0.10] shadow-2xl
                       w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2">
            {view === "create" && (
              <button onClick={() => { setView("list"); setCreateError(null); }}
                className="text-white/40 hover:text-white mr-1 transition-colors">
                ←
              </button>
            )}
            <UserPlus size={17} className="text-blue-400" />
            <h2 className="text-[16px] font-semibold text-white">
              {view === "list" ? "Добавить игрока" : "Новый игрок"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 flex items-center
                       justify-center text-white/50 hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>

        {/* ── PIN banner (newly created account) ── */}
        {pinBanner && (
          <div className="mx-4 mt-3 shrink-0 bg-amber-400/10 border border-amber-400/20
                          rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-amber-300">
                Аккаунт создан для {pinBanner.name}
              </p>
              <p className="text-[11px] text-white/45 mb-1">Временный PIN-код:</p>
              <p className="text-[28px] font-black text-amber-300 tracking-[0.3em] font-mono leading-none">
                {pinBanner.pin}
              </p>
            </div>
            <button onClick={() => setPinBanner(null)}
              className="text-white/30 hover:text-white/70 transition-colors mt-0.5 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── CREATE NEW ── */}
        {view === "create" && (
          <div className="px-5 py-5 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <label className={LABEL}>Номер телефона *</label>
              <PhoneInput value={newPhone} onChange={setNewPhone} onComplete={setNewPhoneOk} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Имя игрока *</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Алан Смагулов" className={INPUT_CLS} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Рейтинг</label>
              <input type="number" min={0} value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value) || 0)}
                placeholder="100" className={INPUT_CLS} />
            </div>
            {createError && (
              <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {createError}
              </p>
            )}
            <button onClick={handleCreate}
              disabled={creating || !newPhoneOk || newName.trim().length < 2}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.98]
                         disabled:opacity-40 text-white font-semibold text-[15px] transition-all">
              {creating ? "Добавление..." : "Создать и добавить"}
            </button>
            <p className="text-[12px] text-white/35 text-center">
              Если игрок уже есть — он будет найден по номеру
            </p>
          </div>
        )}

        {/* ── PLAYER LIST ── */}
        {view === "list" && (
          <>
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по имени или номеру..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.07] border border-white/[0.10]
                             rounded-xl text-[14px] text-white placeholder:text-white/30
                             focus:outline-none focus:border-blue-500/60 transition-all" />
                {query && (
                  <button onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              {loadingList ? (
                <div className="py-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-white/40">
                    {query ? "Никого не найдено" : "Нет зарегистрированных игроков"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {users.map((u) => {
                    const alreadyIn = existingUserIds.has(u.id) || justAdded.has(u.id);
                    const isAdding  = addingId === u.id;
                    return (
                      <div key={u.id}
                        className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                          alreadyIn ? "" : "hover:bg-white/[0.04]"
                        }`}>
                        <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/30
                                        flex items-center justify-center text-[13px] font-bold
                                        text-blue-300 shrink-0 select-none">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-white truncate">{u.name}</p>
                          <p className="text-[12px] text-white/40 mt-0.5">{u.phone}</p>
                        </div>

                        {alreadyIn ? (
                          <span className="text-[12px] font-semibold text-emerald-400/70
                                           bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0
                                           flex items-center gap-1">
                            <Check size={11} />Участвует
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddExisting(u)}
                            disabled={isAdding || addingId !== null}
                            className="shrink-0 text-[13px] font-semibold px-3.5 py-1.5 rounded-xl
                                       bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30
                                       text-blue-300 hover:text-blue-200 disabled:opacity-40
                                       transition-all active:scale-[.97]">
                            {isAdding ? "..." : "Добавить"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
              <button onClick={() => setView("create")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                           border border-dashed border-white/20 text-[14px] font-medium
                           text-white/50 hover:text-white/80 hover:border-white/35 transition-all">
                <Plus size={15} />Добавить нового игрока
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
