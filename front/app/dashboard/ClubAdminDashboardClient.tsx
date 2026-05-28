"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Plus, X, ChevronRight, Users, Zap, Clock,
  Trophy, Calendar, Building2, LayoutList, CalendarDays,
} from "lucide-react";
import { Club, Tournament, User } from "@/lib/types";
import { api } from "@/lib/api";

const TournamentCalendar = dynamic(
  () => import("@/components/TournamentCalendar"),
  { ssr: false }
);

interface Props {
  user: User;
  clubs: Club[];
  tournaments: Tournament[];
}

type ViewMode = "list" | "calendar";

// ── Status config ─────────────────────────────────────────────────────────────
const S = {
  open:        { dot: "bg-emerald-400",            badge: "bg-emerald-400/12 text-emerald-300 border-emerald-500/20",  label: "Открыт",   accent: "rgba(34,197,94,0.12)",  chip: "bg-emerald-500/20 text-emerald-200 border-l-[2px] border-emerald-400"  },
  in_progress: { dot: "bg-cyan-400 animate-pulse", badge: "bg-cyan-400/12 text-cyan-300 border-cyan-500/20",          label: "Live",     accent: "rgba(6,182,212,0.12)",  chip: "bg-cyan-500/20 text-cyan-200 border-l-[2px] border-cyan-400"          },
  finished:    { dot: "bg-white/20",               badge: "bg-white/[0.06] text-white/30 border-white/[0.07]",        label: "Завершён", accent: "rgba(255,255,255,0.04)", chip: "bg-white/[0.07] text-white/30 border-l-[2px] border-white/20"         },
} as const;

// ── Avatar gradient ───────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#3b82f6","#6366f1"], ["#06b6d4","#3b82f6"], ["#8b5cf6","#ec4899"],
  ["#10b981","#06b6d4"], ["#f59e0b","#ef4444"], ["#22c55e","#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

// ── Create Tournament Form ────────────────────────────────────────────────────
const INPUT = "w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder:text-white/25 focus:outline-none transition-all [color-scheme:dark]";

function CreateForm({
  clubs, onCreated, onCancel,
}: { clubs: Club[]; onCreated: (t: Tournament) => void; onCancel: () => void }) {
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [clubId, setClubId]     = useState(clubs[0]?.id ?? "");
  const [format, setFormat]     = useState<"single_elimination" | "group_playoff">("single_elimination");
  const [groupSize, setGroupSize] = useState(4);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError(null);
    try {
      const t = await api.createTournament({
        name: name.trim(),
        description: desc.trim() || undefined,
        starts_at: startsAt || undefined,
        club_id: clubId || undefined,
        format,
        group_size: format === "group_playoff" ? groupSize : undefined,
      });
      onCreated(t);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setError(e?.detail ?? e?.name ?? "Ошибка создания.");
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-white/[0.10] overflow-hidden shrink-0"
         style={{ background: "var(--elevated)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <p className="text-[15px] font-bold text-white">Новый турнир</p>
        <button onClick={onCancel}
          className="w-7 h-7 rounded-full bg-white/[0.07] hover:bg-white/[0.13]
                     flex items-center justify-center text-white/40 hover:text-white transition-all">
          <X size={14} />
        </button>
      </div>
      <form onSubmit={submit} className="px-5 py-5 space-y-3">
        {clubs.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 flex items-center gap-1.5">
              <Building2 size={10} />Клуб
            </label>
            <select value={clubId} onChange={(e) => setClubId(e.target.value)}
              className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60 [color-scheme:dark]"}>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Название турнира *" required autoFocus
          className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60"} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Описание (необязательно)" rows={2}
          className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60 resize-none"} />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 flex items-center gap-1.5">
            <Calendar size={10} />Дата начала
          </label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
            className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60"} />
        </div>
        {/* Format selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Формат</label>
          <div className="flex gap-2">
            {([
              { value: "single_elimination", label: "Олимпийская система" },
              { value: "group_playoff",      label: "Групповой + плей-офф" },
            ] as const).map(({ value, label }) => (
              <button key={value} type="button"
                onClick={() => setFormat(value)}
                className={`flex-1 py-2 px-3 rounded-xl text-[13px] font-semibold border transition-all ${
                  format === value
                    ? "bg-blue-600/30 border-blue-500/60 text-blue-200"
                    : "bg-white/[0.05] border-white/[0.10] text-white/40 hover:text-white/70"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {format === "group_playoff" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Игроков в группе</label>
            <input type="number" min={3} max={8} value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className={INPUT + " bg-white/[0.07] border border-white/[0.10] focus:border-blue-500/60"} />
          </div>
        )}
        {error && (
          <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20
                        rounded-xl px-4 py-2.5">{error}</p>
        )}
        <button type="submit" disabled={loading || !name.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.98]
                     disabled:opacity-35 text-white font-bold text-[15px] transition-all"
          style={{ boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}>
          {loading ? "Создание..." : "Создать турнир"}
        </button>
      </form>
    </div>
  );
}

// ── Tournament card (list view) ───────────────────────────────────────────────
function TournamentCard({ t }: { t: Tournament }) {
  const cfg = S[t.status];
  const [g1, g2] = avatarGrad(t.name);
  const date = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <Link href={`/dashboard/tournaments/${t.id}`}
      className="group flex flex-col rounded-2xl border border-white/[0.08]
                 hover:border-white/[0.16] transition-all duration-200 overflow-hidden"
      style={{ background: cfg.accent }}
    >
      <div className="h-[3px] w-full" style={{
        background: t.status === "in_progress"
          ? "linear-gradient(90deg, #06b6d4, #3b82f6)"
          : t.status === "open"
          ? "linear-gradient(90deg, #22c55e, #06b6d4)"
          : "rgba(255,255,255,0.08)"
      }} />
      <div className="flex-1 px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px]
                            font-black text-white shrink-0"
                 style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 4px 12px ${g1}40` }}>
              {t.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-white/95 truncate group-hover:text-white transition-colors">
                {t.name}
              </p>
              {t.club_name && (
                <p className="text-[11px] text-white/25 truncate">{t.club_name}</p>
              )}
            </div>
          </div>
          <span className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full border
                            whitespace-nowrap ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-white/35">
          <span className="flex items-center gap-1">
            <Users size={11} className="shrink-0" />{t.participant_count}
          </span>
          {date && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0" />{date}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
        <span className="text-[12px] text-white/25 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
        <span className="text-[12px] text-white/35 group-hover:text-white/70 flex items-center gap-0.5 transition-colors">
          Открыть <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function Stat({ value, label, icon, color }: {
  value: number; label: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="flex-1 min-w-[80px] rounded-2xl border border-white/[0.07] px-4 py-4"
         style={{ background: "var(--card)" }}>
      <div className={`mb-2.5 ${color}`}>{icon}</div>
      <p className="text-[32px] font-black tabular-nums leading-none text-white">{value}</p>
      <p className="text-[12px] text-white/35 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

// ── View toggle ───────────────────────────────────────────────────────────────
function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-xl border border-white/[0.10]"
         style={{ background: "var(--elevated)" }}>
      {([
        { id: "list",     Icon: LayoutList,  label: "Список"    },
        { id: "calendar", Icon: CalendarDays, label: "Календарь" },
      ] as const).map(({ id, Icon, label }) => (
        <button key={id} onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px]
                      font-semibold transition-all ${
            mode === id
              ? "bg-white/[0.10] text-white"
              : "text-white/30 hover:text-white/60"
          }`}>
          <Icon size={14} />
          <span className="hidden sm:block">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// nav=52px, layout py-8=32px top+32px bottom → content height = 100vh - 116px
const CAL_H = "calc(100vh - 116px)";

export default function ClubAdminDashboardClient({ user: _user, clubs, tournaments: initialTournaments }: Props) {
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [showForm, setShowForm]       = useState(false);
  const [viewMode, setViewMode]       = useState<ViewMode>("list");

  function handleCreated(t: Tournament) {
    setTournaments((prev) => [t, ...prev]);
    setShowForm(false);
  }

  const live     = tournaments.filter((t) => t.status === "in_progress");
  const open     = tournaments.filter((t) => t.status === "open");
  const finished = tournaments.filter((t) => t.status === "finished");
  const active   = [...live, ...open];
  const clubLabel = clubs.length === 1 ? clubs[0].name : "Мои клубы";

  const stats = {
    total:   tournaments.length,
    live:    live.length,
    open:    open.length,
    players: tournaments.reduce((s, t) => s + t.participant_count, 0),
  };

  const isCalendar = viewMode === "calendar" && tournaments.length > 0;

  return (
    <div
      className={isCalendar ? "flex flex-col gap-3" : "space-y-6 max-w-5xl mx-auto"}
      style={isCalendar ? { height: CAL_H } : undefined}
    >
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">
            Турниры
          </h1>
          <p className="text-[13px] text-white/35 mt-0.5 flex items-center gap-1.5">
            <Building2 size={11} />{clubLabel}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {tournaments.length > 0 && (
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          )}
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
            {showForm ? "Отмена" : "Новый турнир"}
          </button>
        </div>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <CreateForm clubs={clubs} onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      {/* ── Stats (list mode only) ── */}
      {!isCalendar && tournaments.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          <Stat value={stats.total}   label="Всего турниров" icon={<Trophy size={18} />} color="text-white/40" />
          <Stat value={stats.live}    label="Идут сейчас"    icon={<Zap size={18} />}   color="text-cyan-400" />
          <Stat value={stats.open}    label="Регистрация"    icon={<Clock size={18} />} color="text-emerald-400" />
          <Stat value={stats.players} label="Участников"     icon={<Users size={18} />} color="text-blue-400" />
        </div>
      )}

      {/* ── Empty state ── */}
      {tournaments.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/[0.08] py-24 text-center"
             style={{ background: "var(--card)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))" }}>
            <Trophy size={28} className="text-blue-400" />
          </div>
          <p className="text-[18px] font-bold text-white">Турниров нет</p>
          <p className="text-[14px] text-white/35 mt-1">Создайте первый турнир для {clubLabel}</p>
          <button onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] transition-all">
            <Plus size={15} />Создать
          </button>
        </div>
      )}

      {/* ── Calendar view ── */}
      {isCalendar && (
        <TournamentCalendar
          clubs={clubs}
          tournaments={tournaments}
          onTournamentCreated={(t) => setTournaments((p) => [t, ...p])}
          onTournamentUpdated={(t) => setTournaments((p) => p.map((x) => x.id === t.id ? t : x))}
        />
      )}

      {/* ── List view ── */}
      {viewMode === "list" && (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 px-1">
                Активные · {active.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {active.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {finished.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 px-1">
                Завершённые · {finished.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {finished.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
