"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone, Trophy, TrendingUp, TrendingDown,
  Award, Activity, Swords, Crown, Camera, Sun, Moon, Settings as SettingsIcon,
} from "lucide-react";
import { User, Tournament, Participant } from "@/lib/types";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useThemeMode } from "@/lib/useThemeMode";
import { usePushState } from "@/lib/usePushState";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";

const AVATAR_GRADIENTS = [
  ["#3b82f6", "#6366f1"], ["#06b6d4", "#3b82f6"], ["#8b5cf6", "#ec4899"],
  ["#10b981", "#06b6d4"], ["#f59e0b", "#ef4444"], ["#22c55e", "#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function tDate(t: Tournament): number {
  return new Date(t.starts_at ?? t.created_at).getTime();
}

interface RatingPoint { t: number; rating: number; label: string; }
interface H2H { id: string; name: string; wins: number; losses: number; }
interface Data {
  tournaments: number; active: number; completed: number;
  wins: number; losses: number; peak: number;
  ratingSeries: RatingPoint[]; head2head: H2H[];
}

// ── Rating chart (inline SVG, no deps) ───────────────────────────────────────
function RatingChart({ points, emptyLabel }: { points: RatingPoint[]; emptyLabel: string }) {
  if (points.length < 2) return (
    <div className="h-[160px] flex items-center justify-center text-[13px] text-white/30">
      {emptyLabel}
    </div>
  );
  const W = 640, H = 180;
  const pad = { l: 34, r: 14, t: 14, b: 22 };
  const vals = points.map((p) => p.rating);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (i * innerW) / (points.length - 1);
  const y = (v: number) => pad.t + innerH - ((v - min) / span) * innerH;
  const line = vals.map((v, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(points.length-1).toFixed(1)} ${(pad.t+innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(pad.t+innerH).toFixed(1)} Z`;
  const gridVals = [max, Math.round((max+min)/2), min];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
      <defs>
        <linearGradient id="rFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W-pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
          <text x={pad.l-6} y={y(v)+3} textAnchor="end" fontSize="10" fill="var(--text-3)">{v}</text>
        </g>
      ))}
      <path d={area} fill="url(#rFill)" />
      <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.rating)} r={i===points.length-1?4:2.5}
          fill={i===points.length-1?"#3b82f6":"var(--card)"} stroke="#3b82f6" strokeWidth="2">
          <title>{`${p.label}: ${p.rating}`}</title>
        </circle>
      ))}
      <text x={x(0)} y={H-5} textAnchor="start" fontSize="10" fill="var(--text-3)">{points[0].label}</text>
      <text x={x(points.length-1)} y={H-5} textAnchor="end" fontSize="10" fill="var(--text-3)">{points[points.length-1].label}</text>
    </svg>
  );
}

export default function ProfileClient({ user: initialUser }: { user: User }) {
  const { t } = useLang();
  const { theme, setTheme } = useThemeMode();
  const push = usePushState();
  const [user, setUser]       = useState<User>(initialUser);
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [g1, g2] = avatarGrad(user.name);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const tournaments: Tournament[] = await api.getMyTournaments();
        const active    = tournaments.filter((t) => t.status === "in_progress").length;
        const completed = tournaments.filter((t) => t.status === "finished").length;
        const finished  = tournaments.filter((t) => t.status === "finished").sort((a, b) => tDate(a) - tDate(b));

        const ratingRaw: { t: number; before: number; after: number; name: string }[] = [];
        await Promise.all(finished.map(async (t) => {
          const parts: Participant[] = await api.getParticipants(t.id).catch(() => []);
          const me = parts.find((p) => p.user.id === user.id);
          if (me && me.rating_before != null && me.rating_change != null)
            ratingRaw.push({ t: tDate(t), before: me.rating_before, after: me.rating_before + me.rating_change, name: t.name });
        }));
        ratingRaw.sort((a, b) => a.t - b.t);
        const fmt = (ms: number) => new Date(ms).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        const ratingSeries: RatingPoint[] = [];
        if (ratingRaw.length) {
          ratingSeries.push({ t: ratingRaw[0].t, rating: ratingRaw[0].before, label: "старт" });
          for (const r of ratingRaw) ratingSeries.push({ t: r.t, rating: r.after, label: fmt(r.t) });
        }
        const peak = ratingSeries.length ? Math.max(...ratingSeries.map((p) => p.rating), user.rating) : user.rating;

        const h2h = new Map<string, H2H>();
        let wins = 0, losses = 0;
        await Promise.all(tournaments.map(async (t) => {
          const [matches, groups] = await Promise.all([
            api.getMatches(t.id).catch(() => []),
            api.getGroups(t.id).catch(() => []),
          ]);
          const all = [...matches, ...groups.flatMap((grp) => grp.matches)];
          for (const m of all) {
            if (m.status !== "finished" || !m.winner) continue;
            const isP1 = m.player1?.id === user.id, isP2 = m.player2?.id === user.id;
            if (!isP1 && !isP2) continue;
            const opp = isP1 ? m.player2 : m.player1;
            if (!opp) continue;
            const won = m.winner.id === user.id;
            if (won) wins++; else losses++;
            const e = h2h.get(opp.id) ?? { id: opp.id, name: opp.name, wins: 0, losses: 0 };
            if (won) e.wins++; else e.losses++;
            h2h.set(opp.id, e);
          }
        }));
        if (!cancelled) setData({
          tournaments: tournaments.length, active, completed, wins, losses, peak,
          ratingSeries, head2head: [...h2h.values()].sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses)),
        });
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [user.id, user.rating]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await api.uploadAvatar(file);
      setUser(updated);
    } catch { /* silent */ }
    finally { setUploading(false); }
  }

  const totalMatches = data ? data.wins + data.losses : 0;
  const winRate = totalMatches > 0 ? Math.round((data!.wins / totalMatches) * 100) : 0;
  const startRating = data?.ratingSeries[0]?.rating ?? user.rating;
  const ratingDelta = user.rating - startRating;

  const statCards = [
    { label: t.stat_tournaments_pl, value: data?.tournaments ?? 0,    Icon: Trophy,     color: "text-blue-400" },
    { label: t.stat_matches,        value: totalMatches,              Icon: Swords,     color: "text-violet-400" },
    { label: t.stat_wins,           value: data?.wins ?? 0,           Icon: Award,      color: "text-emerald-400" },
    { label: t.stat_losses,         value: data?.losses ?? 0,         Icon: Activity,   color: "text-red-400" },
    { label: t.stat_winrate,        value: `${winRate}%`,             Icon: TrendingUp, color: "text-amber-400" },
    { label: t.stat_peak,           value: data?.peak ?? user.rating, Icon: Crown,      color: "text-cyan-400" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Header card ── */}
      <div className="rounded-3xl border border-white/[0.08] overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="h-20 w-full" style={{ background: `linear-gradient(120deg, ${g1}, ${g2})` }} />
        <div className="px-6 pb-6 -mt-10">
          {/* Clickable avatar */}
          <div className="relative w-20 h-20 group">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-[var(--card)]" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-[34px]
                              font-black text-white border-4 border-[var(--card)]"
                   style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, boxShadow: `0 8px 24px ${g1}55` }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute inset-0 rounded-full flex items-center justify-center
                         bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera size={18} className="text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <h1 className="text-[24px] font-black text-white mt-3 leading-tight">{user.name}</h1>
          <p className="text-[13px] text-white/45 mt-1 flex items-center gap-1.5">
            <Phone size={13} /> {user.phone}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/[0.12] border border-blue-500/25">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-[13px] text-white/55 font-medium">{t.rating}</span>
            <span className="text-[18px] font-black text-white tabular-nums">{user.rating}</span>
            {!loading && ratingDelta !== 0 && (
              <span className={`text-[12px] font-bold flex items-center gap-0.5 ${ratingDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {ratingDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {ratingDelta > 0 ? "+" : ""}{ratingDelta}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Rating chart ── */}
      <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: "var(--card)" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-blue-400" />
          <p className="text-[13px] font-bold text-white">{t.rating_dynamics}</p>
        </div>
        {loading
          ? <div className="h-[160px] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
            </div>
          : <RatingChart points={data?.ratingSeries ?? []} emptyLabel={t.not_enough_data} />}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/[0.08] p-4 flex flex-col gap-2"
               style={{ background: "var(--card)" }}>
            <Icon size={18} className={color} />
            <div>
              <p className={`text-[22px] font-black tabular-nums leading-none ${loading ? "text-white/25" : "text-white"}`}>
                {loading ? "—" : value}
              </p>
              <p className="text-[11px] text-white/40 mt-1 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Head-to-head ── */}
      <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: "var(--card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Swords size={15} className="text-violet-400" />
          <p className="text-[13px] font-bold text-white">{t.head_to_head}</p>
          {!loading && data && data.head2head.length > 0 && (
            <span className="ml-auto text-[11px] text-white/35">{data.head2head.length} {t.opponents_count}</span>
          )}
        </div>
        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !data || data.head2head.length === 0 ? (
          <p className="text-[13px] text-white/30 text-center py-4">{t.no_matches_yet}</p>
        ) : (
          <div className="space-y-2.5">
            {data.head2head.map((h) => {
              const total = h.wins + h.losses;
              const winPct = total > 0 ? (h.wins / total) * 100 : 0;
              const lead = h.wins > h.losses ? "text-emerald-400" : h.wins < h.losses ? "text-red-400" : "text-white/50";
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center
                                  text-[13px] font-bold text-white/55 shrink-0">
                    {h.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-white/85 truncate">{h.name}</p>
                      <p className={`text-[13px] font-black tabular-nums shrink-0 ${lead}`}>{h.wins}–{h.losses}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full overflow-hidden flex bg-red-500/25">
                      <div className="h-full bg-emerald-500/80" style={{ width: `${winPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Settings (theme + language) ── */}
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <SettingsIcon size={15} className="text-white/40" />
          <p className="text-[13px] font-bold text-white">{t.settings}</p>
        </div>

        {/* Notifications */}
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.06]">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white/75">{t.notifications}</p>
            <p className="text-[12px] text-white/35 mt-0.5">{t.notifications_desc}</p>
          </div>
          {push.blocked ? (
            <span className="text-[12px] font-semibold text-amber-300/80 shrink-0 text-right">{t.notif_blocked}</span>
          ) : !push.supported ? (
            <span className="text-[12px] text-white/30 shrink-0">{t.notif_unsupported}</span>
          ) : (
            <button
              onClick={() => (push.enabled ? push.disable() : push.enable())}
              disabled={push.busy}
              aria-label={t.notifications}
              className={`relative w-12 h-7 rounded-full shrink-0 transition-colors disabled:opacity-60 ${
                push.enabled ? "bg-emerald-500" : "bg-white/[0.15]"
              }`}>
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                push.enabled ? "left-6" : "left-1"
              }`} />
            </button>
          )}
        </div>

        {/* Theme */}
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.06]">
          <span className="text-[13px] font-medium text-white/75">{t.theme}</span>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.08]"
               style={{ background: "var(--elevated)" }}>
            {([
              { mode: "dark"  as const, label: t.theme_dark_opt,  Icon: Moon },
              { mode: "light" as const, label: t.theme_light_opt, Icon: Sun  },
            ]).map(({ mode, label, Icon }) => (
              <button key={mode} onClick={() => setTheme(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                  theme === mode
                    ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)]"
                    : "text-white/45 hover:text-white/75"
                }`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-white/75">{t.language}</span>
          <LanguageSwitcher variant="pills" />
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="rounded-2xl border border-white/[0.08] px-5 py-4 flex items-center justify-between"
           style={{ background: "var(--card)" }}>
        <p className="text-[13px] text-white/45">{t.logout_btn}</p>
        <LogoutButton />
      </div>
    </div>
  );
}
