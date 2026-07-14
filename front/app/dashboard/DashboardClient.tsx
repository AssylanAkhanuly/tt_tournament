"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, ChevronRight, Users, Trophy, Settings, Building2 } from "lucide-react";
import { Club, User } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  user: User;
  clubs: Club[];
}

// ── Avatar gradient ───────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#3b82f6","#6366f1"], ["#06b6d4","#3b82f6"], ["#8b5cf6","#ec4899"],
  ["#10b981","#06b6d4"], ["#f59e0b","#ef4444"], ["#22c55e","#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

// ── Create Club Form ──────────────────────────────────────────────────────────
const INPUT = "w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder:text-white/25 focus:outline-none transition-all [color-scheme:dark]";

function CreateClubForm({ onCreated, onCancel }: { onCreated: (c: Club) => void; onCancel: () => void }) {
  const [name, setName]   = useState("");
  const [desc, setDesc]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError(null);
    try {
      const club = await api.createClub({ name: name.trim(), description: desc.trim() || undefined });
      onCreated(club);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e?.detail ?? "Ошибка создания.");
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-white/[0.10] overflow-hidden"
         style={{ background: "var(--elevated)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <p className="text-[15px] font-bold text-white">Новый клуб</p>
        <button onClick={onCancel}
          className="w-7 h-7 rounded-full bg-white/[0.07] hover:bg-white/[0.13]
                     flex items-center justify-center text-white/40 hover:text-white transition-all">
          <X size={14} />
        </button>
      </div>
      <form onSubmit={submit} className="px-5 py-5 space-y-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Название клуба *" required autoFocus
          className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60"} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Описание (необязательно)" rows={2}
          className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60 resize-none"} />
        {error && (
          <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20
                        rounded-xl px-4 py-2.5">{error}</p>
        )}
        <button type="submit" disabled={loading || !name.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.98]
                     disabled:opacity-35 text-white font-bold text-[15px] transition-all"
          style={{ boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}>
          {loading ? "Создание..." : "Создать клуб"}
        </button>
      </form>
    </div>
  );
}

// ── Club Card ─────────────────────────────────────────────────────────────────
function ClubCard({ club }: { club: Club }) {
  const [g1, g2] = avatarGrad(club.name);

  return (
    <Link href={`/dashboard/clubs/${club.id}`}
      className="group flex flex-col rounded-2xl border border-white/[0.08]
                 hover:border-white/[0.16] transition-all duration-200 overflow-hidden"
      style={{ background: "var(--card)" }}
    >
      {/* Top gradient bar */}
      <div className="h-[3px] w-full"
           style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }} />

      <div className="flex-1 px-5 py-4">
        {/* Name + admin badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {club.photo ? (
              <img src={club.photo} alt={club.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
                style={{ boxShadow: `0 4px 12px ${g1}40` }} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px]
                              font-black text-white shrink-0"
                   style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`,
                            boxShadow: `0 4px 12px ${g1}40` }}>
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-white/95 truncate group-hover:text-white transition-colors">
                {club.name}
              </p>
              {club.description && (
                <p className="text-[12px] text-white/35 truncate mt-0.5">{club.description}</p>
              )}
            </div>
          </div>
          {club.is_admin && (
            <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full border
                             whitespace-nowrap bg-blue-400/12 text-blue-300 border-blue-500/20
                             flex items-center gap-1">
              <Settings size={10} />Админ
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[12px] text-white/35">
          <span className="flex items-center gap-1.5">
            <Trophy size={11} className="shrink-0" />
            {club.tournament_count} турниров
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 size={11} className="shrink-0" />
            {club.table_count} столов
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={11} className="shrink-0" />
            {club.admin_count} адм.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-5 py-3 border-t border-white/[0.06]">
        <span className="text-[12px] text-white/35 group-hover:text-white/70
                         flex items-center gap-0.5 transition-colors">
          Открыть <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardClient({ user, clubs: initialClubs }: Props) {
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [showForm, setShowForm] = useState(false);

  function handleCreated(club: Club) {
    setClubs((prev) => [club, ...prev]);
    setShowForm(false);
  }

  const myClubs    = clubs.filter((c) => c.is_admin);
  const otherClubs = clubs.filter((c) => !c.is_admin);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-black text-white leading-tight tracking-tight">
            Клубы
          </h1>
          <p className="text-[13px] text-white/35 mt-1">
            {new Date().toLocaleDateString("ru-RU", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
        </div>
        {user.is_staff && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                        font-bold text-[14px] transition-all active:scale-[.97] ${
              showForm
                ? "bg-white/[0.08] text-white/55 hover:bg-white/[0.12] border border-white/[0.10]"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
            style={showForm ? undefined : { boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Отмена" : "Новый клуб"}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && <CreateClubForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      {/* Empty state */}
      {clubs.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/[0.08] py-24 text-center"
             style={{ background: "var(--card)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))" }}>
            <Building2 size={28} className="text-blue-400" />
          </div>
          <p className="text-[18px] font-bold text-white">Клубов нет</p>
          <p className="text-[14px] text-white/35 mt-1">
            {user.is_staff ? "Создайте первый клуб" : "Клубы ещё не созданы"}
          </p>
          {user.is_staff && (
            <button onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] transition-all">
              <Plus size={15} />Создать
            </button>
          )}
        </div>
      )}

      {/* My clubs (where user is admin) */}
      {myClubs.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 px-1">
            Мои клубы · {myClubs.length}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myClubs.map((c) => <ClubCard key={c.id} club={c} />)}
          </div>
        </section>
      )}

      {/* Other clubs */}
      {otherClubs.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 px-1">
            {myClubs.length > 0 ? `Другие клубы · ${otherClubs.length}` : `Все клубы · ${otherClubs.length}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherClubs.map((c) => <ClubCard key={c.id} club={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
