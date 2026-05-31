"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus, X, Pencil, Check, Trash2,
  Trophy, Building2, Users, Settings, ChevronRight,
  UserPlus, Hash, Clock, Zap, Calendar,
  LayoutList, CalendarDays, Camera, Sun, Moon,
} from "lucide-react";
import { Club, ClubAdmin, ClubTable, Tournament, User } from "@/lib/types";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useThemeMode } from "@/lib/useThemeMode";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const TournamentCalendar = dynamic(
  () => import("@/components/TournamentCalendar"),
  { ssr: false }
);

// ─── Design tokens ────────────────────────────────────────────────────────────
const INPUT = "w-full px-4 py-3 bg-white/[0.07] border border-white/[0.10] rounded-xl text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 transition-all [color-scheme:dark]";
const LABEL = "text-[10px] font-bold uppercase tracking-[0.14em] text-white/35";
const BTN_P = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.97] text-white font-semibold text-[14px] transition-all";
const BTN_G = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.13] active:scale-[.97] text-white font-medium text-[14px] transition-all border border-white/[0.08]";
const BTN_D = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-[.97] text-red-400 font-semibold text-[14px] transition-all border border-red-500/20";

// ─── Tournament status config ─────────────────────────────────────────────────
const S = {
  open:        { dot: "bg-emerald-400",            badge: "bg-emerald-400/12 text-emerald-300 border-emerald-500/20",  label: "Открыт"   },
  in_progress: { dot: "bg-cyan-400 animate-pulse", badge: "bg-cyan-400/12 text-cyan-300 border-cyan-500/20",          label: "Live"     },
  finished:    { dot: "bg-white/20",               badge: "bg-white/[0.06] text-white/30 border-white/[0.07]",        label: "Завершён" },
} as const;

// ─── Avatar gradient ──────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#3b82f6","#6366f1"], ["#06b6d4","#3b82f6"], ["#8b5cf6","#ec4899"],
  ["#10b981","#06b6d4"], ["#f59e0b","#ef4444"], ["#22c55e","#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

type Page = "tournaments" | "tables" | "admins" | "settings";

interface Props {
  user: User;
  club: Club;
  initialTournaments: Tournament[];
  initialTables: ClubTable[];
  initialView?: "list" | "calendar";
  initialTab?:  "tournaments" | "tables" | "admins" | "settings";
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastItem = { id: number; msg: string; ok: boolean };
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((msg: string, ok = true) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);
  return { toasts, show };
}
function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl
                      shadow-xl text-[14px] font-semibold animate-toast ${
            t.ok
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/20 border-red-500/30 text-red-300"
          }`}>
          <span>{t.ok ? "✓" : "✗"}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Tournament mini-card ─────────────────────────────────────────────────────
function TournamentRow({ t }: { t: Tournament }) {
  const cfg = S[t.status];
  const [g1, g2] = avatarGrad(t.name);
  const date = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    : null;
  return (
    <Link href={`/dashboard/tournaments/${t.id}`}
      className="group flex items-center gap-4 px-5 py-3.5
                 hover:bg-white/[0.03] transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px]
                      font-black text-white shrink-0"
           style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 4px 10px ${g1}40` }}>
        {t.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white/90 truncate group-hover:text-white transition-colors">
          {t.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/30">
          <span className="flex items-center gap-1">
            <Users size={10} />{t.participant_count}
          </span>
          {date && <span className="flex items-center gap-1"><Clock size={10} />{date}</span>}
        </div>
      </div>
      <span className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
        {cfg.label}
      </span>
      <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Create Tournament Form ───────────────────────────────────────────────────
function CreateTournamentForm({
  clubId, onCreated, onCancel,
}: { clubId: string; onCreated: (t: Tournament) => void; onCancel: () => void }) {
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [startsAt, setStartsAt] = useState("");
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
        club_id: clubId,
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
    <div className="rounded-2xl border border-white/[0.10] overflow-hidden"
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
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Название турнира *" required autoFocus className={INPUT} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Описание (необязательно)" rows={2} className={INPUT + " resize-none"} />
        <div className="space-y-1.5">
          <label className={LABEL + " flex items-center gap-1.5"}><Calendar size={10} />Дата начала</label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
            className={INPUT} />
        </div>
        {/* Format selector */}
        <div className="space-y-1.5">
          <label className={LABEL}>Формат</label>
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
            <label className={LABEL}>Игроков в группе</label>
            <input type="number" min={3} max={8} value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className={INPUT} />
          </div>
        )}
        {error && <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
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

// ─── Table Row ────────────────────────────────────────────────────────────────
function TableRow({
  table, clubId, isAdmin, onUpdated, onDeleted,
}: { table: ClubTable; clubId: string; isAdmin: boolean; onUpdated: (t: ClubTable) => void; onDeleted: (id: number) => void }) {
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(table.name);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateClubTable(clubId, table.id, { name: name.trim() });
      onUpdated(updated);
      setEditing(false);
    } finally { setSaving(false); }
  }

  async function del() {
    if (!confirm(`Удалить стол №${table.number}?`)) return;
    setDeleting(true);
    try {
      await api.deleteClubTable(clubId, table.id);
      onDeleted(table.id);
    } finally { setDeleting(false); }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
      {/* Number badge */}
      <div className="w-10 h-10 rounded-xl bg-blue-600/[0.15] border border-blue-500/20
                      flex items-center justify-center text-[16px] font-black text-blue-300 shrink-0">
        {table.number}
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input value={name} onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-1.5 bg-white/[0.07] border border-white/[0.12] rounded-xl
                       text-[14px] text-white focus:outline-none focus:border-blue-500/60 transition-all"
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
        ) : (
          <p className="text-[14px] font-semibold text-white">{table.display_name}</p>
        )}
        <p className="text-[11px] text-white/30 mt-0.5">
          {table.is_active ? "Активен" : "Неактивен"}
        </p>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-1.5 shrink-0">
          {editing ? (
            <>
              <button onClick={save} disabled={saving}
                className="w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30
                           flex items-center justify-center text-emerald-400 transition-all disabled:opacity-40">
                <Check size={14} />
              </button>
              <button onClick={() => setEditing(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.12]
                           flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.12]
                           flex items-center justify-center text-white/30 hover:text-white transition-all">
                <Pencil size={13} />
              </button>
              <button onClick={del} disabled={deleting}
                className="w-8 h-8 rounded-xl hover:bg-red-500/15
                           flex items-center justify-center text-white/20 hover:text-red-400 transition-all disabled:opacity-40">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Table Form ───────────────────────────────────────────────────────────
function AddTableForm({
  clubId, existingTables, onAdded,
}: { clubId: string; existingTables: ClubTable[]; onAdded: (t: ClubTable) => void }) {
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextNumber = Math.max(0, ...existingTables.map((t) => t.number)) + 1;
    setLoading(true); setError(null);
    try {
      const t = await api.createClubTable(clubId, { number: nextNumber, name: name.trim() || undefined });
      onAdded(t);
      setName("");
    } catch (err: unknown) {
      setError((err as Record<string, string>)?.detail ?? "Ошибка.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit}
      className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.06] shrink-0">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Название стола (необязательно)" autoFocus
        className="flex-1 px-3 py-2 bg-white/[0.07] border border-white/[0.10] rounded-xl
                   text-[13px] text-white focus:outline-none focus:border-blue-500/60 transition-all" />
      {error && <p className="text-[12px] text-red-400 shrink-0">{error}</p>}
      <button type="submit" disabled={loading}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px]
                   font-semibold disabled:opacity-40 transition-all whitespace-nowrap">
        {loading ? "..." : <Plus size={15} />}
      </button>
    </form>
  );
}

// ─── Admin Row ────────────────────────────────────────────────────────────────
function AdminRow({ admin, clubId, canRemove, onRemoved }: {
  admin: ClubAdmin; clubId: string; canRemove: boolean; onRemoved: (id: number) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [g1, g2] = avatarGrad(admin.user.name);

  async function remove() {
    if (!confirm(`Удалить ${admin.user.name} из администраторов?`)) return;
    setRemoving(true);
    try {
      await api.removeClubAdmin(clubId, admin.id);
      onRemoved(admin.id);
    } finally { setRemoving(false); }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black text-white shrink-0"
           style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 4px 10px ${g1}40` }}>
        {admin.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white truncate">{admin.user.name}</p>
        <p className="text-[12px] text-white/30 mt-0.5">{admin.user.phone}</p>
      </div>
      <span className="text-[11px] text-white/20 hidden sm:block shrink-0">
        {new Date(admin.added_at).toLocaleDateString("ru-RU")}
      </span>
      {canRemove && (
        <button onClick={remove} disabled={removing}
          className="w-7 h-7 rounded-full hover:bg-red-500/15 flex items-center justify-center
                     text-white/15 hover:text-red-400 disabled:opacity-40 transition-all shrink-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClubDetailClient({
  user, club: initClub, initialTournaments, initialTables,
  initialView = "list", initialTab = "tournaments",
}: Props) {
  const isAdmin  = initClub.is_admin;
  const router   = useRouter();
  const pathname = usePathname();
  const { toasts, show: toast } = useToast();
  const { t } = useLang();
  const { theme, setTheme } = useThemeMode();

  const [club,        setClub]        = useState<Club>(initClub);
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [tables,      setTables]      = useState<ClubTable[]>(initialTables);
  const [admins,      setAdmins]      = useState<ClubAdmin[]>([]);
  const [adminsLoaded, setAdminsLoaded] = useState(false);

  const [page, setPage] = useState<Page>(initialTab);
  const [tournamentView, setTournamentViewState] = useState<"list" | "calendar">(initialView);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [quickLoading,      setQuickLoading]      = useState(false);

  function setTournamentView(view: "list" | "calendar") {
    setTournamentViewState(view);
    const url = view === "calendar"
      ? `${pathname}?view=calendar`
      : pathname;
    router.replace(url, { scroll: false });
  }

  function setPageAndUpdateUrl(p: Page) {
    setPage(p);
    // keep current view param when switching to tournaments, clear otherwise
    const url = p === "tournaments" && tournamentView === "calendar"
      ? `${pathname}?tab=${p}&view=calendar`
      : `${pathname}?tab=${p}`;
    router.replace(url, { scroll: false });
  }

  // Edit club
  const [editing,         setEditing]         = useState(false);
  const [editName,        setEditName]        = useState(club.name);
  const [editDesc,        setEditDesc]        = useState(club.description);
  const [saving,          setSaving]          = useState(false);
  const [editError,       setEditError]       = useState<string | null>(null);
  const [photoUploading,  setPhotoUploading]  = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);

  // Add admin
  const [addAdminPhone, setAddAdminPhone] = useState("");
  const [addingAdmin,   setAddingAdmin]   = useState(false);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);

  // Load admins on first visit to admins tab
  useEffect(() => {
    if (page === "admins" && !adminsLoaded && isAdmin) {
      api.getClubAdmins(club.id)
        .then((a) => { setAdmins(a); setAdminsLoaded(true); })
        .catch(() => {});
    }
  }, [page, adminsLoaded, isAdmin, club.id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const updated = await api.uploadClubPhoto(club.id, file);
      setClub(updated);
      toast(t.photo_updated);
    } catch { toast(t.photo_error, false); }
    finally { setPhotoUploading(false); if (photoFileRef.current) photoFileRef.current.value = ""; }
  }

  async function handleSaveClub() {
    setSaving(true); setEditError(null);
    try {
      const updated = await api.updateClub(club.id, { name: editName, description: editDesc });
      setClub(updated); setEditing(false);
      toast(t.club_updated);
    } catch (err: unknown) {
      setEditError((err as Record<string, string>)?.detail ?? "Ошибка.");
    } finally { setSaving(false); }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!addAdminPhone.trim()) return;
    setAddingAdmin(true); setAddAdminError(null);
    try {
      const admin = await api.addClubAdmin(club.id, addAdminPhone.trim());
      setAdmins((p) => [...p, admin]);
      setClub((c) => ({ ...c, admin_count: c.admin_count + 1 }));
      setAddAdminPhone("");
      toast(`${admin.user.name} добавлен как администратор`);
    } catch (err: unknown) {
      const e = err as Record<string, string>;
      setAddAdminError(e?.detail ?? "Ошибка.");
    } finally { setAddingAdmin(false); }
  }

  // ── Quick tournament: create + add all existing users ────────────────────
  async function handleQuickTournament() {
    setQuickLoading(true);
    try {
      const today = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      const t = await api.createTournament({
        name: `Турнир ${today}`,
        club_id: club.id,
        format: "group_playoff",
        group_size: 4,
      });
      const users = await api.searchUsers("");
      let added = 0;
      for (const u of users) {
        try { await api.addParticipant(t.id, u.phone); added++; } catch { /* skip */ }
      }
      setTournaments((p) => [{ ...t, participant_count: added }, ...p]);
      setClub((c) => ({ ...c, tournament_count: c.tournament_count + 1 }));
      toast(`Турнир создан — ${added} игроков добавлено`);
      router.push(`/dashboard/tournaments/${t.id}`);
    } catch (err: unknown) {
      toast((err as Record<string, string>)?.detail ?? "Ошибка", false);
    } finally { setQuickLoading(false); }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const live     = tournaments.filter((t) => t.status === "in_progress");
  const open     = tournaments.filter((t) => t.status === "open");
  const finished = tournaments.filter((t) => t.status === "finished");
  const [g1, g2] = avatarGrad(club.name);

  // Group all tournaments by calendar day for the list view
  const tournamentsByDay = useMemo(() => {
    const all = [...live, ...open, ...finished];
    const withDate = all.filter((t) => t.starts_at);
    const noDate   = all.filter((t) => !t.starts_at);

    const map = new Map<string, { isoDate: string; label: string; list: Tournament[] }>();
    withDate.forEach((t) => {
      const d       = new Date(t.starts_at!);
      const isoDate = d.toISOString().slice(0, 10);
      const today   = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const isTomorrow = d.toDateString() === new Date(today.getTime() + 86400000).toDateString();
      const label   = isToday    ? "Сегодня"
                    : isTomorrow ? "Завтра"
                    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
      if (!map.has(isoDate)) map.set(isoDate, { isoDate, label, list: [] });
      map.get(isoDate)!.list.push(t);
    });

    const groups = [...map.values()].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
    if (noDate.length) groups.push({ isoDate: "", label: "Без даты", list: noDate });
    return groups;
  }, [live, open, finished]);

  const navItems: { id: Page; label: string; Icon: React.ElementType; badge?: number; show: boolean }[] = [
    { id: "tournaments", label: t.tournaments, Icon: Trophy,    badge: live.length || undefined, show: true },
    { id: "tables",      label: t.tables,      Icon: Building2, badge: tables.length,             show: true },
    { id: "admins",      label: t.admins,      Icon: Users,     badge: club.admin_count,          show: isAdmin },
    { id: "settings",    label: t.settings,    Icon: Settings,                                    show: isAdmin },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] flex overflow-hidden">

      {/* ═══════════════════════════════════════ SIDEBAR ═══════════════════════ */}
      <aside className="flex-none w-[60px] sm:w-[220px] flex flex-col
                        border-r border-white/[0.07] shrink-0 overflow-hidden"
             style={{ background: "var(--surface)" }}>

        {/* Club info */}
        <div className="hidden sm:block px-4 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            {club.photo ? (
              <img src={club.photo} alt={club.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px]
                              font-black text-white shrink-0"
                   style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 3px 8px ${g1}50` }}>
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-[13px] font-bold text-white truncate">{club.name}</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/30">
            <span className="flex items-center gap-1"><Trophy size={10} />{club.tournament_count}</span>
            <span className="flex items-center gap-1"><Building2 size={10} />{tables.filter(t=>t.is_active).length}</span>
            <span className="flex items-center gap-1"><Users size={10} />{club.admin_count}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.filter((n) => n.show).map(({ id, label, Icon, badge }) => {
            const active = page === id;
            return (
              <div key={id}>
                <button onClick={() => setPageAndUpdateUrl(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all relative group ${
                    active
                      ? "bg-blue-600/[0.14] text-white"
                      : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
                  }`}>
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-blue-500 rounded-r-full" />
                  )}
                  <Icon size={18} className={`shrink-0 transition-colors ${active ? "text-blue-400" : "text-white/50 group-hover:text-white/80"}`} />
                  <span className="hidden sm:block text-[14px] font-semibold flex-1">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={`hidden sm:flex h-5 min-w-[20px] px-1.5 rounded-full text-[11px]
                                      font-bold items-center justify-center ${
                      id === "tournaments" && live.length > 0
                        ? "bg-cyan-500/30 text-cyan-200"
                        : "bg-white/[0.10] text-white/65"
                    }`}>{badge}</span>
                  )}
                </button>

                {/* Sub-items for Tournaments */}
                {id === "tournaments" && active && (
                  <div className="hidden sm:block border-b border-white/[0.05]">
                    {([
                      { view: "list"     as const, label: t.list_view,     Icon: LayoutList   },
                      { view: "calendar" as const, label: t.calendar_view, Icon: CalendarDays },
                    ]).map(({ view, label: vLabel, Icon: VIcon }) => (
                      <button key={view} onClick={() => setTournamentView(view)}
                        className={`w-full flex items-center gap-2.5 pl-11 pr-4 py-2 text-left
                                    transition-all relative ${
                          tournamentView === view
                            ? "text-blue-300 bg-blue-600/[0.08]"
                            : "text-white/25 hover:text-white/55 hover:bg-white/[0.03]"
                        }`}>
                        {tournamentView === view && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5
                                           bg-blue-400/50 rounded-r-full" />
                        )}
                        <VIcon size={13} className="shrink-0" />
                        <span className="text-[13px] font-medium">{vLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ═══════════════════════════════════════ MAIN ══════════════════════════ */}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ background: "var(--bg)" }}>

        {/* ── TOURNAMENTS ───────────────────────────────────────────────── */}
        {page === "tournaments" && tournamentView === "calendar" && (
          <TournamentCalendar
            clubs={[club]}
            tournaments={tournaments}
            onTournamentCreated={(t) => {
              setTournaments((p) => [t, ...p]);
              setClub((c) => ({ ...c, tournament_count: c.tournament_count + 1 }));
              toast("Турнир создан!");
            }}
            onTournamentUpdated={(t) => {
              setTournaments((p) => p.map((x) => x.id === t.id ? t : x));
            }}
          />
        )}

        {page === "tournaments" && tournamentView === "list" && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-white/[0.07] shrink-0"
                 style={{ background: "var(--surface)" }}>
              <div>
                <h2 className="text-[17px] font-bold text-white">Турниры</h2>
                <p className="text-[12px] text-white/30 mt-0.5">
                  {tournaments.length} в этом клубе
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  {/* Quick tournament: create + add all existing users */}
                  <button
                    onClick={handleQuickTournament}
                    disabled={quickLoading}
                    title="Создать турнир и добавить всех игроков"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[13px]
                               bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300
                               disabled:opacity-40 transition-all active:scale-[.97]"
                  >
                    <Zap size={13} />
                    {quickLoading ? "..." : "Быстрый"}
                  </button>
                  <button onClick={() => setShowTournamentForm((v) => !v)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px]
                                transition-all active:scale-[.97] ${
                      showTournamentForm
                        ? "bg-white/[0.08] text-white/55 border border-white/[0.10]"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                    style={showTournamentForm ? undefined : { boxShadow: "0 4px 16px rgba(59,130,246,0.35)" }}>
                    {showTournamentForm ? <X size={14} /> : <Plus size={14} />}
                    {showTournamentForm ? "Отмена" : "Создать"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* Create form */}
                {showTournamentForm && (
                  <CreateTournamentForm
                    clubId={club.id}
                    onCreated={(t) => { setTournaments((p) => [t, ...p]); setShowTournamentForm(false); toast("Турнир создан!"); }}
                    onCancel={() => setShowTournamentForm(false)}
                  />
                )}

                {/* Status chips */}
                {tournaments.length > 0 && (
                  <div className="flex items-center gap-2">
                    {[
                      { label: `${live.length} Live`,      color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",       show: live.length > 0 },
                      { label: `${open.length} Открыто`,   color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", show: open.length > 0 },
                      { label: `${finished.length} Завер.`, color: "bg-white/[0.07] text-white/35 border-white/[0.07]",      show: finished.length > 0 },
                    ].filter(x => x.show).map(({ label, color }) => (
                      <span key={label}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${color}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Empty */}
                {tournaments.length === 0 && !showTournamentForm && (
                  <div className="rounded-2xl border border-white/[0.08] py-20 text-center"
                       style={{ background: "var(--card)" }}>
                    <Trophy size={36} className="mx-auto text-white/[0.08] mb-3" />
                    <p className="text-[16px] font-bold text-white/30">Турниров нет</p>
                    {isAdmin && (
                      <button onClick={() => setShowTournamentForm(true)}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                   bg-blue-600 hover:bg-blue-500 text-white font-bold text-[13px] transition-all">
                        <Plus size={14} />Создать первый турнир
                      </button>
                    )}
                  </div>
                )}

                {/* Grouped list */}
                {tournamentsByDay.length > 0 && (
                  <div className="space-y-4">
                    {tournamentsByDay.map(({ isoDate, label, list }) => (
                      <div key={isoDate || "no-date"}>
                        {/* Day divider */}
                        <div className="flex items-center gap-2.5 mb-2 px-1">
                          <span className={`text-[11px] font-bold uppercase tracking-[0.10em] ${
                            label === "Сегодня"  ? "text-blue-400" :
                            label === "Завтра"   ? "text-emerald-400" :
                            label === "Без даты" ? "text-white/20" :
                            "text-white/35"
                          }`}>
                            {label}
                          </span>
                          <span className="text-[11px] text-white/15 font-medium">· {list.length}</span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        {/* Cards in this day */}
                        <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.05]"
                             style={{ background: "var(--card)" }}>
                          {list.map((t) => <TournamentRow key={t.id} t={t} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TABLES ─────────────────────────────────────────────────────── */}
        {page === "tables" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-white/[0.07] shrink-0"
                 style={{ background: "var(--surface)" }}>
              <div>
                <h2 className="text-[17px] font-bold text-white">Столы</h2>
                <p className="text-[12px] text-white/30 mt-0.5">
                  {tables.filter(t => t.is_active).length} активных · {tables.length} всего
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-4">
                {tables.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] py-20 text-center"
                       style={{ background: "var(--card)" }}>
                    <Hash size={36} className="mx-auto text-white/[0.08] mb-3" />
                    <p className="text-[16px] font-bold text-white/30">Столы не добавлены</p>
                    {isAdmin && <p className="text-[13px] text-white/20 mt-1">Используйте форму ниже</p>}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.05]"
                       style={{ background: "var(--card)" }}>
                    {tables.map((t) => (
                      <TableRow
                        key={t.id}
                        table={t}
                        clubId={club.id}
                        isAdmin={isAdmin}
                        onUpdated={(updated) => setTables((p) => p.map((x) => x.id === updated.id ? updated : x))}
                        onDeleted={(id) => {
                          setTables((p) => p.filter((x) => x.id !== id));
                          setClub((c) => ({ ...c, table_count: Math.max(0, c.table_count - 1) }));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add table form */}
            {isAdmin && (
              <div className="max-w-2xl mx-auto w-full px-4 border-t border-white/[0.06]"
                   style={{ background: "var(--surface)" }}>
                <AddTableForm
                  clubId={club.id}
                  existingTables={tables}
                  onAdded={(t) => {
                    setTables((p) => [...p, t].sort((a, b) => a.number - b.number));
                    setClub((c) => ({ ...c, table_count: c.table_count + 1 }));
                    toast(`${t.display_name} добавлен`);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── ADMINS ─────────────────────────────────────────────────────── */}
        {page === "admins" && isAdmin && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.07] shrink-0"
                 style={{ background: "var(--surface)" }}>
              <h2 className="text-[17px] font-bold text-white">Администраторы</h2>
              <p className="text-[12px] text-white/30 mt-0.5">{club.admin_count} чел.</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* Add admin */}
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
                     style={{ background: "var(--card)" }}>
                  <div className="px-5 py-3.5 border-b border-white/[0.06]">
                    <p className="text-[12px] font-bold text-white/40 uppercase tracking-wider">
                      Добавить администратора
                    </p>
                  </div>
                  <form onSubmit={handleAddAdmin} className="flex items-center gap-2 px-5 py-3">
                    <input type="tel" value={addAdminPhone} onChange={(e) => setAddAdminPhone(e.target.value)}
                      placeholder="Номер телефона (+7...)"
                      className="flex-1 px-4 py-2.5 bg-white/[0.07] border border-white/[0.10] rounded-xl
                                 text-[14px] text-white placeholder:text-white/25 focus:outline-none
                                 focus:border-blue-500/60 transition-all" />
                    <button type="submit" disabled={addingAdmin || !addAdminPhone.trim()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white
                                 text-[13px] font-bold disabled:opacity-40 transition-all whitespace-nowrap
                                 flex items-center gap-1.5">
                      <UserPlus size={14} />Добавить
                    </button>
                  </form>
                  {addAdminError && (
                    <p className="px-5 pb-3 text-[13px] text-red-400">{addAdminError}</p>
                  )}
                </div>

                {/* Admins list */}
                {admins.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.05]"
                       style={{ background: "var(--card)" }}>
                    {admins.map((a) => (
                      <AdminRow
                        key={a.id}
                        admin={a}
                        clubId={club.id}
                        canRemove={admins.length > 1}
                        onRemoved={(id) => {
                          setAdmins((p) => p.filter((x) => x.id !== id));
                          setClub((c) => ({ ...c, admin_count: Math.max(0, c.admin_count - 1) }));
                          toast("Администратор удалён");
                        }}
                      />
                    ))}
                  </div>
                )}

                {adminsLoaded && admins.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-[14px] text-white/25">Нет администраторов</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ──────────────────────────────────────────────────── */}
        {page === "settings" && isAdmin && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

              {/* Club photo */}
              <section>
                <p className={LABEL + " mb-3"}>{t.club_photo}</p>
                <div className="flex items-center gap-5 p-5 rounded-2xl border border-white/[0.08]"
                     style={{ background: "var(--card)" }}>
                  <div className="relative w-20 h-20 shrink-0 group">
                    {club.photo ? (
                      <img src={club.photo} alt={club.name}
                        className="w-20 h-20 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[28px]
                                      font-black text-white"
                           style={{ background: `linear-gradient(135deg, ${avatarGrad(club.name)[0]}, ${avatarGrad(club.name)[1]})` }}>
                        {club.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button onClick={() => photoFileRef.current?.click()} disabled={photoUploading}
                      className="absolute inset-0 rounded-2xl flex items-center justify-center
                                 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {photoUploading
                        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Camera size={18} className="text-white" />}
                    </button>
                    <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{t.club_logo}</p>
                    <p className="text-[12px] text-white/35 mt-0.5">{t.hover_camera_hint}</p>
                  </div>
                </div>
              </section>

              {/* Club info edit */}
              <section>
                <p className={LABEL + " mb-3"}>{t.club_info}</p>
                {editing ? (
                  <div className="space-y-3 rounded-2xl border border-white/[0.08] p-5"
                       style={{ background: "var(--card)" }}>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      placeholder={t.club_name_placeholder} autoFocus className={INPUT} />
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                      placeholder={t.club_desc_placeholder} rows={3} className={INPUT + " resize-none"} />
                    {editError && (
                      <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{editError}</p>
                    )}
                    <div className="flex gap-2.5">
                      <button onClick={handleSaveClub} disabled={saving || !editName.trim()} className={BTN_P}>
                        <Check size={15} />{saving ? t.saving : t.save}
                      </button>
                      <button onClick={() => { setEditing(false); setEditName(club.name); setEditDesc(club.description); }} className={BTN_G}>
                        <X size={15} />{t.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border
                               border-white/[0.08] hover:bg-white/[0.03] transition-all text-left group"
                    style={{ background: "var(--card)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-white">{club.name}</p>
                      {club.description && (
                        <p className="text-[13px] text-white/40 mt-0.5 line-clamp-2">{club.description}</p>
                      )}
                    </div>
                    <Pencil size={15} className="text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                  </button>
                )}
              </section>

              {/* Stats */}
              <section>
                <p className={LABEL + " mb-3"}>{t.statistics}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: t.stat_tournaments, value: club.tournament_count, color: "text-white/80",    icon: <Trophy size={14} /> },
                    { label: t.stat_tables,       value: club.table_count,      color: "text-blue-300",   icon: <Building2 size={14} /> },
                    { label: t.stat_admins,       value: club.admin_count,      color: "text-violet-400", icon: <Users size={14} /> },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} className="border border-white/[0.07] rounded-2xl p-4 text-center"
                         style={{ background: "var(--elevated)" }}>
                      <div className={`flex justify-center mb-2 ${color} opacity-50`}>{icon}</div>
                      <p className={`text-[30px] font-black tabular-nums leading-none ${color}`}>{value}</p>
                      <p className="text-[11px] text-white/25 mt-1.5 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Theme */}
              <section>
                <p className={LABEL + " mb-3"}>{t.theme}</p>
                <div className="p-5 rounded-2xl border border-white/[0.08]"
                     style={{ background: "var(--card)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-white/50">{t.appearance}</p>
                    <div className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.08]"
                         style={{ background: "var(--elevated)" }}>
                      {([
                        { mode: "dark"  as const, label: t.theme_dark_opt,  Icon: Moon },
                        { mode: "light" as const, label: t.theme_light_opt, Icon: Sun  },
                      ]).map(({ mode, label, Icon }) => (
                        <button key={mode} onClick={() => setTheme(mode)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                            theme === mode ? "bg-blue-600 text-white" : "text-white/45 hover:text-white/75"
                          }`}>
                          <Icon size={13} />{label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Language */}
              <section>
                <p className={LABEL + " mb-3"}>{t.language}</p>
                <div className="p-5 rounded-2xl border border-white/[0.08]"
                     style={{ background: "var(--card)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-white/50">{t.language_desc}</p>
                    <LanguageSwitcher />
                  </div>
                </div>
              </section>

              {/* Logout */}
              <section>
                <p className={LABEL + " mb-3"}>{t.logout}</p>
                <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
                     style={{ background: "var(--card)" }}>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <p className="text-[13px] text-white/50">{t.logout_desc}</p>
                    <button
                      onClick={async () => { try { await api.logout(); } finally { window.location.href = "/login"; } }}
                      className={BTN_D + " shrink-0"}>
                      {t.logout_btn}
                    </button>
                  </div>
                </div>
              </section>

              {/* Danger zone — only for superadmins */}
              {user.is_staff && (
                <section>
                  <p className={LABEL + " mb-3"}>{t.danger_zone}</p>
                  <div className="rounded-2xl border border-red-500/20 overflow-hidden"
                       style={{ background: "var(--card)" }}>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-semibold text-white">{t.delete_club}</p>
                        <p className="text-[12px] text-white/35 mt-0.5">{t.delete_club_desc}</p>
                      </div>
                      <button className={BTN_D + " shrink-0"}>
                        <Trash2 size={14} />{t.delete_btn}
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      <ToastStack toasts={toasts} />
    </div>
  );
}
