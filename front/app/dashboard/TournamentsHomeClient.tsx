"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Users, Calendar, Trophy, Clock, Building2, ChevronDown } from "lucide-react";
import { Club, Tournament } from "@/lib/types";
import { api } from "@/lib/api";

const AVATAR_GRADIENTS = [
  ["#3b82f6","#6366f1"], ["#06b6d4","#3b82f6"], ["#8b5cf6","#ec4899"],
  ["#10b981","#06b6d4"], ["#f59e0b","#ef4444"], ["#22c55e","#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

const STATUS = {
  open:        { pill: "bg-emerald-400/15 text-emerald-300 border-emerald-500/20", label: "Открыт"   },
  in_progress: { pill: "bg-blue-500/20 text-blue-300 border-blue-500/30",          label: "Live"     },
  finished:    { pill: "bg-white/[0.07] text-white/40 border-white/[0.08]",         label: "Завершён" },
} as const;

type SortMode = "time" | "club";

function TournamentCard({ t, onJoin }: { t: Tournament; onJoin?: (tournamentId: string) => void }) {
  const [g1, g2] = avatarGrad(t.name);
  const s = STATUS[t.status];
  const date = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const [registering, setRegistering] = useState(false);

  const handleRegister = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRegistering(true);
    try {
      await api.joinTournamentSelf(t.id);
      onJoin?.(t.id);
    } catch (err) {
      console.error("Failed to join tournament:", err);
    } finally {
      setRegistering(false);
    }
  }, [t.id, onJoin]);

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.07]
                    hover:border-white/[0.14] transition-all"
         style={{ background: "var(--card)" }}>
      <Link href={`/dashboard/tournaments/${t.id}`} prefetch={false}
        className="flex-1 flex items-center gap-3 px-4 py-3.5 active:scale-[.99]">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px]
                        font-black text-white shrink-0"
             style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 4px 12px ${g1}40` }}>
          {t.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[15px] font-bold text-white truncate">{t.name}</p>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.pill}`}>
              {s.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-white/40">
            <span className="flex items-center gap-1"><Users size={11} />{t.participant_count}</span>
            {date && <span className="flex items-center gap-1"><Calendar size={11} />{date}</span>}
            {t.club_name && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <Building2 size={11} className="shrink-0" />{t.club_name}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-white/25 group-hover:text-white/60 shrink-0 transition-colors" />
      </Link>
      {t.status === "open" && (
        <button onClick={handleRegister} disabled={registering}
          className="px-3 py-1.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700
                     disabled:bg-blue-600/50 rounded-lg transition-colors shrink-0 mr-2">
          {registering ? "..." : "Записаться"}
        </button>
      )}
    </div>
  );
}

// ── Sort helper ───────────────────────────────────────────────────────────────
function byDate(a: Tournament, b: Tournament) {
  return new Date(b.starts_at ?? b.created_at).getTime() -
         new Date(a.starts_at ?? a.created_at).getTime();
}

function sortByTime(ts: Tournament[]) {
  const live = ts.filter((t) => t.status === "in_progress").sort(byDate);
  const open = ts.filter((t) => t.status === "open").sort(byDate);
  return [...live, ...open];
}

function groupByClub(ts: Tournament[]): { title: string; items: Tournament[] }[] {
  const map = new Map<string, Tournament[]>();
  for (const t of [...ts].sort((a, b) => (a.club_name ?? "").localeCompare(b.club_name ?? "", "ru"))) {
    const key = t.club_name ?? "Без клуба";
    (map.get(key) ?? map.set(key, []).get(key)!).push(t);
  }
  return [...map.entries()].map(([title, items]) => ({ title, items: items.sort(byDate) }));
}

interface Props { tournaments: Tournament[]; clubs: Club[] }

export default function TournamentsHomeClient({ tournaments: initialTournaments, clubs }: Props) {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [sort, setSort]             = useState<SortMode>("time");
  const [archiveSort, setArchiveSort] = useState<SortMode>("time");
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const handleTournamentUpdated = useCallback((tournamentId: string) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === tournamentId ? { ...t, participant_count: t.participant_count + 1 } : t))
    );
  }, []);

  // Apply club filter (used for both active and archive)
  const filterByClub = (ts: Tournament[]) =>
    clubFilter === "all" ? ts : ts.filter((t) => t.club_id === clubFilter);

  const active   = useMemo(() => filterByClub(tournaments.filter((t) => t.status !== "finished")), [tournaments, clubFilter]);
  const finished = useMemo(() => filterByClub(tournaments.filter((t) => t.status === "finished")), [tournaments, clubFilter]);

  // ── Active sections ────────────────────────────────────────────────────────
  const activeSections = useMemo(() => {
    if (sort === "time") {
      const live = active.filter((t) => t.status === "in_progress").sort(byDate);
      const open = active.filter((t) => t.status === "open").sort(byDate);
      return [
        { title: "Идут сейчас", items: live },
        { title: "Предстоящие", items: open },
      ].filter((s) => s.items.length > 0);
    }
    return groupByClub(active);
  }, [active, sort]);

  // ── Archive sections ───────────────────────────────────────────────────────
  const archiveSections = useMemo(() => {
    if (archiveSort === "time") {
      return [{ title: "По дате", items: [...finished].sort(byDate) }];
    }
    return groupByClub(finished);
  }, [finished, archiveSort]);

  const liveCount = tournaments.filter((t) => t.status === "in_progress").length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">Турниры</h1>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-blue-300
                             bg-blue-500/20 border border-blue-500/25 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />{liveCount} live
            </span>
          )}
        </div>
        <p className="text-[13px] text-white/40 mt-1">{active.length} активных · {finished.length} завершённых</p>
      </div>

      {/* Sort + club filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.08]"
             style={{ background: "var(--card)" }}>
          {([
            { id: "time" as SortMode, label: "По времени", Icon: Clock },
            { id: "club" as SortMode, label: "По клубу",   Icon: Building2 },
          ]).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setSort(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                sort === id
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)]"
                  : "text-white/45 hover:text-white/75"
              }`}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {clubs.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {[{ id: "all", name: "Все" }, ...clubs.map((c) => ({ id: c.id, name: c.name }))].map((c) => (
              <button key={c.id} onClick={() => setClubFilter(c.id)}
                className={`text-[12px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  clubFilter === c.id
                    ? "bg-white/[0.12] text-white border-white/[0.20]"
                    : "text-white/40 border-white/[0.08] hover:text-white/70 hover:border-white/[0.14]"
                }`}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active tournaments */}
      {active.length === 0 && finished.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] py-20 text-center"
             style={{ background: "var(--card)" }}>
          <Trophy size={32} className="text-white/[0.12] mx-auto mb-3" />
          <p className="text-[15px] font-bold text-white">Турниров пока нет</p>
          <p className="text-[13px] text-white/40 mt-1">Здесь появятся доступные турниры</p>
        </div>
      ) : active.length === 0 ? (
        <p className="text-[13px] text-white/30 text-center py-6">Нет активных турниров</p>
      ) : (
        <div className="space-y-6">
          {activeSections.map((section) => (
            <section key={section.title} className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 px-1">
                {section.title} · {section.items.length}
              </p>
              <div className="space-y-2">
                {section.items.map((t) => <TournamentCard key={t.id} t={t} onJoin={handleTournamentUpdated} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Archive — collapsible, own sort */}
      {finished.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden"
             style={{ background: "var(--card)" }}>
          {/* Header row */}
          <button onClick={() => setArchiveOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40">
              Архив
            </span>
            <span className="text-[11px] font-bold text-white/25 bg-white/[0.06] px-2 py-0.5 rounded-full">
              {finished.length}
            </span>

            {/* Archive sort — only visible when open */}
            {archiveOpen && (
              <div className="ml-2 flex items-center gap-1 p-0.5 rounded-lg border border-white/[0.08]"
                   style={{ background: "var(--elevated)" }}
                   onClick={(e) => e.stopPropagation()}>
                {([
                  { id: "time" as SortMode, Icon: Clock },
                  { id: "club" as SortMode, Icon: Building2 },
                ]).map(({ id, Icon }) => (
                  <button key={id} onClick={() => setArchiveSort(id)}
                    className={`p-1.5 rounded-md transition-all ${
                      archiveSort === id ? "bg-white/[0.10] text-white" : "text-white/30 hover:text-white/60"
                    }`}>
                    <Icon size={12} />
                  </button>
                ))}
              </div>
            )}

            <ChevronDown size={15}
              className={`ml-auto text-white/30 transition-transform ${archiveOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Archive list */}
          {archiveOpen && (
            <div className="border-t border-white/[0.06] px-4 py-4 space-y-5">
              {archiveSections.map((section) => (
                <section key={section.title} className="space-y-2">
                  {archiveSections.length > 1 && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 px-1">
                      {section.title} · {section.items.length}
                    </p>
                  )}
                  <div className="space-y-2">
                    {section.items.map((t) => <TournamentCard key={t.id} t={t} onJoin={handleTournamentUpdated} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
