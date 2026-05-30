"use client";

import Link from "next/link";
import { ChevronRight, Users, Calendar, Trophy } from "lucide-react";
import { Tournament } from "@/lib/types";

const AVATAR_GRADIENTS = [
  ["#3b82f6", "#6366f1"], ["#06b6d4", "#3b82f6"], ["#8b5cf6", "#ec4899"],
  ["#10b981", "#06b6d4"], ["#f59e0b", "#ef4444"], ["#22c55e", "#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

const STATUS = {
  open:        { dot: "bg-emerald-400",            pill: "bg-emerald-400/15 text-emerald-300", label: "Открыт"   },
  in_progress: { dot: "bg-blue-400 animate-pulse", pill: "bg-blue-500/20 text-blue-300",       label: "Live"     },
  finished:    { dot: "bg-white/20",               pill: "bg-white/[0.07] text-white/40",      label: "Завершён" },
} as const;

function TournamentRow({ t }: { t: Tournament }) {
  const [g1, g2] = avatarGrad(t.name);
  const s = STATUS[t.status];
  const date = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    : null;

  return (
    <Link href={`/dashboard/tournaments/${t.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.08]
                 hover:border-white/[0.16] px-4 py-3.5 transition-all"
      style={{ background: "var(--card)" }}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[16px]
                      font-black text-white shrink-0"
           style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 4px 12px ${g1}40` }}>
        {t.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-bold text-white truncate group-hover:text-white">{t.name}</p>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.pill}`}>{s.label}</span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-white/40 mt-1">
          <span className="flex items-center gap-1"><Users size={11} />{t.participant_count}</span>
          {date && <span className="flex items-center gap-1"><Calendar size={11} />{date}</span>}
          {t.club_name && <span className="truncate">· {t.club_name}</span>}
        </div>
      </div>

      <ChevronRight size={16} className="text-white/25 group-hover:text-white/60 shrink-0 transition-colors" />
    </Link>
  );
}

export default function MyTournamentsClient({ tournaments }: { tournaments: Tournament[] }) {
  const live     = tournaments.filter((t) => t.status === "in_progress");
  const upcoming = tournaments.filter((t) => t.status === "open");
  const past     = tournaments.filter((t) => t.status === "finished");

  const sections = [
    { title: "Идут сейчас", items: live },
    { title: "Предстоящие", items: upcoming },
    { title: "Завершённые", items: past },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-7">
      <div>
        <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">Мои турниры</h1>
        <p className="text-[13px] text-white/40 mt-1">{tournaments.length} всего</p>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] py-20 text-center"
             style={{ background: "var(--card)" }}>
          <Trophy size={32} className="text-white/[0.12] mx-auto mb-3" />
          <p className="text-[15px] font-bold text-white">Турниров пока нет</p>
          <p className="text-[13px] text-white/40 mt-1">Вы ещё не участвуете ни в одном турнире</p>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 px-1">
              {section.title} · {section.items.length}
            </p>
            <div className="space-y-2.5">
              {section.items.map((t) => <TournamentRow key={t.id} t={t} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
