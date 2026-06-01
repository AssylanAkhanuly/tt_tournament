"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Trophy, LayoutGrid, Zap, Users, RefreshCw,
  Minus, Plus, X, Clock, UserPlus, Check,
} from "lucide-react";
import {
  Match, GroupMatch, Tournament, TournamentGroup, TournamentTable, Participant, User,
} from "@/lib/types";
import { api } from "@/lib/api";

const BracketFlow    = dynamic(() => import("@/components/BracketFlow"),    { ssr: false });
const ClassicBracket = dynamic(() => import("@/components/ClassicBracket"), { ssr: false });

type Section = "bracket" | "groups" | "live" | "players";
type GMatch = GroupMatch & { groupId: number; groupName: string };

interface Props {
  tournament: Tournament;
  user: User;
  isAdmin: boolean;
  tables: TournamentTable[];
  initialMatches: Match[];
  initialGroups: TournamentGroup[];
  initialParticipants: Participant[];
}

const QUICK: [number, number][] = [[3, 0], [3, 1], [3, 2], [0, 3], [1, 3], [2, 3]];

// ── Bottom-sheet score editor (works for bracket + group matches) ──────────────
function ScoreSheet({
  p1, p2, init1, init2, onClose, onSubmit,
}: {
  p1: string; p2: string; init1: number; init2: number;
  onClose: () => void; onSubmit: (s1: number, s2: number) => Promise<void>;
}) {
  const [s1, setS1] = useState(init1);
  const [s2, setS2] = useState(init2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (s1 === s2) { setErr("Ничья недопустима."); return; }
    setBusy(true); setErr(null);
    try { await onSubmit(s1, s2); }
    catch (e: unknown) { setErr((e as Record<string, string>)?.detail ?? "Не удалось сохранить."); setBusy(false); }
  }

  const rows: [string, number, (n: number) => void, boolean][] = [
    [p1, s1, setS1, s1 > s2],
    [p2, s2, setS2, s2 > s1],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 backdrop-blur-md"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full rounded-t-[28px] border-t border-white/[0.12] p-5 pb-8 space-y-4"
           style={{ background: "var(--elevated)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-white">Счёт матча</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white/40">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2.5">
          {rows.map(([name, score, set, win], i) => (
            <div key={i} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
              win ? "border-emerald-500/35 bg-emerald-500/[0.08]" : "border-white/[0.08] bg-white/[0.04]"}`}>
              <span className={`flex-1 text-[15px] font-semibold truncate ${win ? "text-white" : "text-white/60"}`}>{name}</span>
              <button onClick={() => set(Math.max(0, score - 1))}
                className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center text-white/60 active:scale-90">
                <Minus size={15} />
              </button>
              <span className={`w-8 text-center text-[26px] font-black tabular-nums ${win ? "text-emerald-300" : "text-white/80"}`}>{score}</span>
              <button onClick={() => set(score + 1)}
                className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center text-white/60 active:scale-90">
                <Plus size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {QUICK.map(([a, b]) => (
            <button key={`${a}:${b}`} onClick={() => { setS1(a); setS2(b); setErr(null); }}
              className={`py-2 rounded-xl text-[13px] font-bold transition-all ${
                s1 === a && s2 === b ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/55"}`}>
              {a} : {b}
            </button>
          ))}
        </div>

        {err && <p className="text-[13px] text-red-400 text-center">{err}</p>}

        <button onClick={save} disabled={busy || s1 === s2}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-[16px] disabled:opacity-40 active:scale-[.98]">
          {busy ? "Сохранение..." : `${s1} : ${s2} — Сохранить`}
        </button>
      </div>
    </div>
  );
}

// Bottom sheet shown to the player who must confirm a score the opponent entered.
function ConfirmSheet({
  p1, p2, s1, s2, proposerName, onClose, onConfirm, onReject,
}: {
  p1: string; p2: string; s1: number; s2: number; proposerName: string;
  onClose: () => void; onConfirm: () => Promise<void>; onReject: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<null | "confirm" | "reject">(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(which: "confirm" | "reject", fn: () => Promise<void>) {
    setBusy(which); setErr(null);
    try { await fn(); }
    catch (e: unknown) { setErr((e as Record<string, string>)?.detail ?? "Ошибка."); setBusy(null); }
  }

  const rows: [string, number, boolean][] = [[p1, s1, s1 > s2], [p2, s2, s2 > s1]];

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 backdrop-blur-md"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full rounded-t-[28px] border-t border-white/[0.12] p-5 pb-8 space-y-4"
           style={{ background: "var(--elevated)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-white">Подтвердите счёт</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white/40">
            <X size={15} />
          </button>
        </div>

        <p className="text-[13px] text-white/55">
          {proposerName} ввёл счёт. Подтвердите, если он верный, или отклоните и введите свой.
        </p>

        <div className="space-y-2.5">
          {rows.map(([name, score, win], i) => (
            <div key={i} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
              win ? "border-emerald-500/35 bg-emerald-500/[0.08]" : "border-white/[0.08] bg-white/[0.04]"}`}>
              <span className={`flex-1 text-[15px] font-semibold truncate ${win ? "text-white" : "text-white/60"}`}>{name}</span>
              <span className={`text-[26px] font-black tabular-nums ${win ? "text-emerald-300" : "text-white/80"}`}>{score}</span>
            </div>
          ))}
        </div>

        {err && <p className="text-[13px] text-red-400 text-center">{err}</p>}

        <button onClick={() => run("confirm", onConfirm)} disabled={!!busy}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-[16px] disabled:opacity-40 active:scale-[.98]">
          {busy === "confirm" ? "Подтверждение..." : "✓ Подтвердить счёт"}
        </button>
        <button onClick={() => run("reject", onReject)} disabled={!!busy}
          className="w-full py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 font-bold text-[15px] disabled:opacity-40 active:scale-[.98]">
          {busy === "reject" ? "..." : "✗ Отклонить и ввести свой счёт"}
        </button>
      </div>
    </div>
  );
}

export default function MobilePlayerView({
  tournament, user, isAdmin, tables, initialMatches, initialGroups, initialParticipants,
}: Props) {
  const router = useRouter();
  // useLayoutEffect fires synchronously before the browser paints, so the mobile
  // portal is in place on the very first paint — no flash of the desktop view.
  const [isMobile, setIsMobile] = useState(false);

  const [matches, setMatches]           = useState<Match[]>(initialMatches);
  const [groups, setGroups]             = useState<TournamentGroup[]>(initialGroups);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [refreshing, setRefreshing]     = useState(false);

  const [section, setSection] = useState<Section>("bracket");
  const [bracketScore, setBracketScore] = useState<Match | null>(null);
  const [groupScore, setGroupScore]     = useState<GMatch | null>(null);
  // A proposed score the player is reviewing (confirm / reject).
  const [confirm, setConfirm] = useState<{ kind: "bracket"; m: Match } | { kind: "group"; m: GMatch } | null>(null);
  // Transient bottom toast (e.g. "score sent, awaiting confirmation").
  const [flash, setFlash] = useState<string | null>(null);
  const [sectionPicked, setSectionPicked] = useState(false);

  // The parent (TournamentDetailClient) polls the live-state endpoint and passes
  // fresh data down as props. Mirror it into local state so phone players get a
  // live roster and scores without running their own polling loop. Local
  // mutations (score entry, manual refresh) still apply instantly; the next
  // parent poll reconciles.
  useEffect(() => { setMatches(initialMatches); }, [initialMatches]);
  // The parent loads groups lazily, so its prop starts empty — only mirror
  // non-empty updates, otherwise an empty parent prop wipes groups we already
  // fetched (which hid the "Группы" tab until the bracket tab was opened).
  useEffect(() => { if (initialGroups.length) setGroups(initialGroups); }, [initialGroups]);
  useEffect(() => { setParticipants(initialParticipants); }, [initialParticipants]);

  // Self-registration straight from the tournament view (open tournaments only).
  const [joining, setJoining] = useState(false);
  const [joinedLocal, setJoinedLocal] = useState(false);

  // Detect mobile synchronously before first paint (useLayoutEffect, not useEffect).
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const active = isMobile && !isAdmin;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [m, p] = await Promise.all([
        api.getMatches(tournament.id).catch(() => null),
        api.getParticipants(tournament.id).catch(() => null),
      ]);
      if (m) setMatches(m);
      if (p) setParticipants(p);
      if (tournament.format === "group_playoff") {
        const g = await api.getGroups(tournament.id).catch(() => null);
        if (g) setGroups(g);
      }
    } finally { setRefreshing(false); }
  }, [tournament.id, tournament.format]);

  useEffect(() => { if (active) refresh(); }, [active, refresh]);

  // Eagerly load groups the moment a group tournament is opened, so the
  // "Группы" tab is present right away (not only after visiting the bracket tab).
  useEffect(() => {
    if (active && tournament.format === "group_playoff") {
      api.getGroups(tournament.id).then((g) => { if (g?.length) setGroups(g); }).catch(() => {});
    }
  }, [active, tournament.id, tournament.format]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      const p = await api.joinTournamentSelf(tournament.id);
      setParticipants((prev) => (prev.find((x) => x.id === p.id) ? prev : [...prev, p]));
      setJoinedLocal(true); // instant feedback; parent poll confirms is_registered
    } catch {
      /* keep the CTA so the player can retry */
    } finally {
      setJoining(false);
    }
  }, [tournament.id]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasBracket   = matches.length > 0;
  const isGroupPhase = tournament.format === "group_playoff" && groups.length > 0 && matches.length === 0;
  const hasGroups    = groups.length > 0;

  const groupMatches: GMatch[] = useMemo(
    () => groups.flatMap((g) => g.matches.map((m) => ({ ...m, groupId: g.id, groupName: g.name }))),
    [groups]
  );

  // A match awaiting score confirmation is still "live" (players are at the table).
  const isLiveStatus = (s: string) => s === "in_progress" || s === "score_proposed";
  const liveBracket  = matches.filter((m) => isLiveStatus(m.status));
  const liveGroup    = groupMatches.filter((m) => isLiveStatus(m.status));
  const live         = isGroupPhase ? liveGroup : liveBracket;

  // Matches where the OPPONENT proposed a score and I must confirm/reject it.
  // Surfaced as a pinned priority card (any tab) + an amber CTA in the live list.
  const myPendingConfirm = useMemo(() => {
    const out: ({ kind: "bracket"; m: Match } | { kind: "group"; m: GMatch })[] = [];
    for (const m of matches)
      if (m.status === "score_proposed" && (m.player1?.id === user.id || m.player2?.id === user.id) && m.proposed_by?.id !== user.id)
        out.push({ kind: "bracket", m });
    for (const m of groupMatches)
      if (m.status === "score_proposed" && (m.player1?.id === user.id || m.player2?.id === user.id) && m.proposed_by?.id !== user.id)
        out.push({ kind: "group", m });
    return out;
  }, [matches, groupMatches, user.id]);
  const pendingBracket = matches.filter((m) => m.status === "pending" && m.player1 && m.player2);
  const pendingGroup   = groupMatches.filter((m) => m.status === "pending");
  const pending      = isGroupPhase ? pendingGroup : pendingBracket;

  const tableName = (n: number | null) =>
    n ? (tables.find((t) => t.number === n)?.display_name ?? `Стол ${n}`) : null;
  const mine = (m: { player1: User | null; player2: User | null }) =>
    m.player1?.id === user.id || m.player2?.id === user.id;

  // Default section once data is known.
  useEffect(() => {
    if (sectionPicked) return;
    if (isGroupPhase) setSection("groups");
    else if (hasBracket) setSection("bracket");
    else setSection("players");
  }, [isGroupPhase, hasBracket, sectionPicked]);

  // Auto-dismiss the transient toast.
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 2800);
    return () => clearTimeout(id);
  }, [flash]);

  // Confirm the opponent's proposed score → records the result.
  async function confirmAccept() {
    if (!confirm) return;
    const c = confirm;
    if (c.kind === "bracket") await api.confirmScore(tournament.id, c.m.id, true);
    else await api.confirmGroupScore(tournament.id, c.m.groupId, c.m.id, true);
    setConfirm(null);
    setFlash("Счёт подтверждён");
    await refresh();
  }

  // Reject the opponent's proposed score → reopen the match and enter my own
  // score (pre-filled with their proposal so I can correct it), which then needs
  // THEIR confirmation.
  async function confirmReject() {
    if (!confirm) return;
    const c = confirm;
    const p1 = c.m.proposed_score1 ?? 0;
    const p2 = c.m.proposed_score2 ?? 0;
    if (c.kind === "bracket") await api.confirmScore(tournament.id, c.m.id, false);
    else await api.confirmGroupScore(tournament.id, c.m.groupId, c.m.id, false);
    setConfirm(null);
    if (c.kind === "bracket") setBracketScore({ ...c.m, score1: p1, score2: p2, status: "in_progress" });
    else setGroupScore({ ...c.m, score1: p1, score2: p2, status: "in_progress" });
    await refresh();
  }

  if (!active) return null;

  const allTabs: { id: Section; label: string; Icon: React.ElementType; show: boolean; badge?: number }[] = [
    { id: "bracket", label: "Сетка",  Icon: Trophy,     show: true },
    { id: "groups",  label: "Группы", Icon: LayoutGrid, show: hasGroups },
    { id: "live",    label: "Эфир",   Icon: Zap,        show: tournament.status === "in_progress", badge: live.length || undefined },
    { id: "players", label: "Игроки", Icon: Users,      show: true, badge: participants.length || undefined },
  ];
  const tabs = allTabs.filter((t) => t.show);

  const isRegistered = tournament.is_registered || joinedLocal;

  // Players cannot access the club page — always go to dashboard.
  // Admins also go to dashboard (they get auto-redirected to their club from there).
  const back = () => router.push("/dashboard");

  return createPortal(
    <div className="tt-tournament-theme fixed inset-0 z-[100] flex flex-col overflow-hidden"
         style={{ background: "var(--bg)" }}>

      {/* ── Floating back button ── */}
      <button onClick={back}
        className="fixed top-4 left-4 z-[70] w-11 h-11 rounded-full flex items-center justify-center
                   border border-white/[0.12] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:scale-90"
        style={{ background: "var(--elevated)" }}>
        <ArrowLeft size={19} />
      </button>

      {/* ── Refresh (top-right) ── */}
      <button onClick={refresh}
        className="fixed top-4 right-4 z-[70] w-11 h-11 rounded-full flex items-center justify-center
                   border border-white/[0.12] text-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:scale-90"
        style={{ background: "var(--elevated)" }}>
        <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
      </button>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 relative">

        {/* Сетка — full-screen pan/zoom bracket */}
        {section === "bracket" && (
          <div className="absolute inset-0">
            {hasBracket ? (
              tournament.format === "group_playoff"
                ? <ClassicBracket key={matches.length} matches={matches} currentUser={user} isAdmin={false}
                    onEnterScore={setBracketScore} className="w-full h-full" />
                : <BracketFlow matches={matches} currentUser={user} isAdmin={false}
                    onEnterScore={setBracketScore} className="w-full h-full" />
            ) : (
              <Empty icon={<Trophy size={42} />} text={isGroupPhase ? "Плей-офф ещё не начат" : "Сетка ещё не готова"} />
            )}
          </div>
        )}

        {/* Группы — vertical scroll of standings */}
        {section === "groups" && (
          <div className="absolute inset-0 overflow-y-auto px-3 pt-20 pb-32 space-y-4">
            {!hasGroups ? <Empty icon={<LayoutGrid size={42} />} text="Групп нет" /> :
              groups.map((g, idx) => <GroupCard key={g.id} group={g} idx={idx} userId={user.id}
                tableName={tableName}
                onScore={(m) => mine(m) && m.status === "in_progress" && setGroupScore({ ...m, groupId: g.id, groupName: g.name })} />)}
          </div>
        )}

        {/* Эфир — live + queue */}
        {section === "live" && (
          <div className="absolute inset-0 overflow-y-auto px-3 pt-20 pb-32 space-y-5">
            <Block title="Идут сейчас" count={live.length} dot>
              {live.length === 0
                ? <p className="text-[13px] text-white/25 text-center py-6">Нет активных матчей</p>
                : live.map((m) => <MatchRow key={m.id} m={m} table={tableName(m.table_number)} live
                    you={mine(m)} userId={user.id}
                    onScore={() => mine(m) && (isGroupPhase
                      ? setGroupScore(m as GMatch)
                      : setBracketScore(m as Match))}
                    onConfirm={() => mine(m) && setConfirm(isGroupPhase
                      ? { kind: "group", m: m as GMatch }
                      : { kind: "bracket", m: m as Match })} />)}
            </Block>
            <Block title="Ожидают стола" count={pending.length} icon={<Clock size={12} />}>
              {pending.length === 0
                ? <p className="text-[13px] text-white/25 text-center py-6">Очередь пуста</p>
                : pending.map((m) => <MatchRow key={m.id} m={m} table={tableName(m.table_number)} you={mine(m)} />)}
            </Block>
          </div>
        )}

        {/* Игроки */}
        {section === "players" && (
          <div className="absolute inset-0 overflow-y-auto px-3 pt-20 pb-44">
            <PlayersList participants={participants} youId={user.id} />
          </div>
        )}
      </div>

      {/* ── Sticky register button (open tournaments) — sits above the nav pill ── */}
      {tournament.status === "open" && (
        isRegistered ? (
          <div className="fixed bottom-[86px] left-1/2 -translate-x-1/2 z-[78] flex items-center gap-2
                          px-5 py-3 rounded-2xl text-[14px] font-bold text-emerald-300
                          bg-emerald-500/15 border border-emerald-500/35 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            <Check size={16} />Вы зарегистрированы
          </div>
        ) : (
          <button onClick={handleJoin} disabled={joining}
            className="fixed bottom-[86px] left-1/2 -translate-x-1/2 z-[78] flex items-center gap-2
                       px-6 py-3 rounded-2xl text-[15px] font-bold text-white bg-blue-600 active:scale-[.97]
                       disabled:opacity-60 shadow-[0_8px_24px_rgba(37,99,235,0.5)]">
            <UserPlus size={18} />{joining ? "Запись…" : "Записаться"}
          </button>
        )
      )}

      {/* ── Floating bottom pill nav (liquid glass) ── */}
      <BottomPill tabs={tabs} section={section}
        onPick={(s) => { setSection(s); setSectionPicked(true); }} />

      {/* ── Pinned priority card: a score awaits my confirmation (any tab) ── */}
      {myPendingConfirm.length > 0 && !confirm && !bracketScore && !groupScore && (() => {
        const first = myPendingConfirm[0];
        const m = first.m;
        const a = m.proposed_score1 ?? 0, b = m.proposed_score2 ?? 0;
        const extra = myPendingConfirm.length - 1;
        return (
          <button onClick={() => setConfirm(first)}
            className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[79] w-[92vw] max-w-[440px]
                       flex items-center gap-3 px-4 py-3 rounded-2xl text-left backdrop-blur-md
                       bg-amber-500/[0.16] border border-amber-500/45 shadow-[0_12px_34px_rgba(0,0,0,0.55)]
                       active:scale-[.99]">
            <span className="text-[22px] shrink-0">🏓</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-amber-200">
                Подтвердите счёт{extra > 0 ? ` (+${extra})` : ""}
              </p>
              <p className="text-[12px] text-white/75 truncate">
                {m.player1?.name ?? "?"} {a} : {b} {m.player2?.name ?? "?"}
              </p>
            </div>
            <span className="text-[12px] font-bold text-amber-300 shrink-0">Ответить →</span>
          </button>
        );
      })()}

      {/* ── Score sheets ── */}
      {bracketScore && (
        <ScoreSheet p1={bracketScore.player1?.name ?? "Игрок 1"} p2={bracketScore.player2?.name ?? "Игрок 2"}
          init1={bracketScore.score1 ?? 0} init2={bracketScore.score2 ?? 0}
          onClose={() => setBracketScore(null)}
          onSubmit={async (s1, s2) => {
            const r = await api.submitScore(tournament.id, bracketScore.id, s1, s2);
            setBracketScore(null);
            setFlash(r.status === "score_proposed" ? "Счёт отправлен — ждём подтверждения соперника" : "Счёт записан");
            await refresh();
          }} />
      )}
      {groupScore && (
        <ScoreSheet p1={groupScore.player1?.name ?? "Игрок 1"} p2={groupScore.player2?.name ?? "Игрок 2"}
          init1={groupScore.score1 ?? 0} init2={groupScore.score2 ?? 0}
          onClose={() => setGroupScore(null)}
          onSubmit={async (s1, s2) => {
            const r = await api.submitGroupScore(tournament.id, groupScore.groupId, groupScore.id, s1, s2);
            setGroupScore(null);
            setFlash(r.status === "score_proposed" ? "Счёт отправлен — ждём подтверждения соперника" : "Счёт записан");
            await refresh();
          }} />
      )}

      {/* ── Confirm sheet (accept / reject opponent's proposed score) ── */}
      {confirm && (
        <ConfirmSheet
          p1={confirm.m.player1?.name ?? "Игрок 1"}
          p2={confirm.m.player2?.name ?? "Игрок 2"}
          s1={confirm.m.proposed_score1 ?? 0}
          s2={confirm.m.proposed_score2 ?? 0}
          proposerName={confirm.m.proposed_by?.name ?? "Соперник"}
          onClose={() => setConfirm(null)}
          onConfirm={confirmAccept}
          onReject={confirmReject}
        />
      )}

      {/* ── Transient toast ── */}
      {flash && (
        <div className="fixed bottom-[96px] left-1/2 -translate-x-1/2 z-[85] px-5 py-3 rounded-2xl text-center
                        bg-[#0b1524] border border-white/[0.14] text-white text-[14px] font-semibold
                        shadow-[0_10px_30px_rgba(0,0,0,0.6)] max-w-[92vw]">
          {flash}
        </div>
      )}
    </div>,
    document.body,
  );
}

// ── Small presentational helpers ───────────────────────────────────────────────
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-white/15">
      {icon}
      <p className="text-[14px] text-white/25">{text}</p>
    </div>
  );
}

function Block({ title, count, dot, icon, children }: {
  title: string; count: number; dot?: boolean; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2.5 px-1">
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">{title}</span>
        {count > 0 && <span className="ml-auto text-[12px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function MatchRow({ m, table, live, you, userId, onScore, onConfirm }: {
  m: Pick<Match, "player1" | "player2" | "score1" | "score2" | "status" | "proposed_score1" | "proposed_score2" | "proposed_by">;
  table: string | null; live?: boolean; you?: boolean; userId?: string;
  onScore?: () => void; onConfirm?: () => void;
}) {
  const proposed  = m.status === "score_proposed";
  const iProposed = proposed && !!userId && m.proposed_by?.id === userId;   // I'm waiting on the opponent
  const iConfirm  = proposed && !!you && !iProposed && !!onConfirm;          // opponent waits on me
  const canScore  = !!(live && you && onScore && m.status === "in_progress");
  const s1 = proposed ? m.proposed_score1 : m.score1;
  const s2 = proposed ? m.proposed_score2 : m.score2;
  const onClick = iConfirm ? onConfirm : canScore ? onScore : undefined;
  return (
    <div onClick={onClick}
      className={`rounded-2xl border px-4 py-3.5 ${onClick ? "cursor-pointer active:scale-[.99]" : ""} ${
        iConfirm ? "border-amber-500/55 bg-amber-500/[0.10]"
          : you ? "border-blue-500/40 bg-blue-500/[0.08]" : "border-white/[0.08] bg-white/[0.03]"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-white truncate">{m.player1?.name ?? "—"}</p>
        {s1 != null && <span className="text-[16px] font-black tabular-nums text-white/80">{s1}</span>}
      </div>
      <div className="h-px bg-white/[0.06] my-1.5" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-white/75 truncate">{m.player2?.name ?? "—"}</p>
        {s2 != null && <span className="text-[16px] font-black tabular-nums text-white/70">{s2}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {you && <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">Вы</span>}
        {table && <span className="text-[10px] font-bold text-white/45 bg-white/[0.06] px-2 py-0.5 rounded-full">{table}</span>}
        {iConfirm  && <span className="ml-auto text-[12px] font-bold text-amber-300">Подтвердите счёт →</span>}
        {iProposed && <span className="ml-auto text-[11px] font-semibold text-white/45">Ожидание подтверждения…</span>}
        {canScore  && <span className="ml-auto text-[12px] font-bold text-emerald-300">Ввести счёт →</span>}
      </div>
    </div>
  );
}

const GROUP_HUES = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#22c55e"];

function GroupCard({ group, idx, userId, tableName, onScore }: {
  group: TournamentGroup; idx: number; userId: string;
  tableName: (n: number | null) => string | null;
  onScore: (m: GroupMatch) => void;
}) {
  const hue = GROUP_HUES[idx % GROUP_HUES.length];
  return (
    <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: "var(--card)" }}>
      <div className="px-4 py-2.5 font-bold text-white text-[14px]" style={{ background: `${hue}26` }}>
        Группа {group.name}
      </div>
      {/* standings */}
      <div className="px-2 py-2">
        {group.participants.map((p, i) => {
          const you = p.user.id === userId;
          return (
            <div key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${you ? "bg-blue-500/10" : ""}`}>
              <span className="w-5 text-center text-[12px] font-bold text-white/35 tabular-nums">{i + 1}</span>
              <span className={`flex-1 text-[13px] truncate ${you ? "font-bold text-white" : "text-white/75"}`}>{p.user.name}</span>
              <span className="text-[12px] text-white/40 tabular-nums">{p.wins}-{p.losses}</span>
              <span className="w-7 text-right text-[13px] font-black text-white tabular-nums">{p.points}</span>
            </div>
          );
        })}
      </div>
      {/* live matches in this group that belong to the player */}
      {group.matches.filter((m) => m.status === "in_progress").map((m) => {
        const you = m.player1?.id === userId || m.player2?.id === userId;
        return (
          <button key={m.id} disabled={!you} onClick={() => onScore(m)}
            className={`w-full text-left px-4 py-2 border-t border-white/[0.05] flex items-center justify-between gap-2 ${
              you ? "active:scale-[.99]" : ""}`}>
            <span className="text-[12px] text-white/70 truncate">
              {m.player1?.name} <span className="text-white/25">vs</span> {m.player2?.name}
            </span>
            {you
              ? <span className="text-[11px] font-bold text-emerald-300 shrink-0">счёт →</span>
              : <span className="text-[10px] text-blue-300 shrink-0">{tableName(m.table_number) ?? "live"}</span>}
          </button>
        );
      })}
    </div>
  );
}

function PlayersList({ participants, youId }: { participants: Participant[]; youId: string }) {
  const sorted = [...participants].sort((a, b) => (b.user.rating ?? 0) - (a.user.rating ?? 0));
  return (
    <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.05]"
         style={{ background: "var(--card)" }}>
      {sorted.map((p, i) => {
        const you = p.user.id === youId;
        return (
          <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${you ? "bg-blue-500/10" : ""}`}>
            <span className="w-6 text-center text-[13px] font-bold text-white/35 tabular-nums">{i + 1}</span>
            <div className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center text-[13px] font-bold text-white/55">
              {p.user.name.charAt(0).toUpperCase()}
            </div>
            <span className={`flex-1 text-[14px] truncate ${you ? "font-bold text-white" : "font-semibold text-white/80"}`}>
              {p.user.name}{you && <span className="text-[11px] text-blue-300 ml-2">Вы</span>}
            </span>
            <span className="text-[12px] font-medium text-red-300/70 tabular-nums">{p.user.rating}</span>
          </div>
        );
      })}
    </div>
  );
}

function BottomPill({ tabs, section, onPick }: {
  tabs: { id: Section; label: string; Icon: React.ElementType; badge?: number }[];
  section: Section; onPick: (s: Section) => void;
}) {
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-1 p-1.5
                    rounded-[24px] border border-white/[0.12] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
         style={{ background: "var(--elevated)" }}>
      {tabs.map(({ id, label, Icon, badge }) => {
        const on = section === id;
        return (
          <button key={id} onClick={() => onPick(id)} aria-label={label}
            className={`relative flex flex-col items-center justify-center gap-1 w-[72px] py-2 rounded-2xl transition-all active:scale-90 ${
              on ? "bg-blue-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.4)]" : "text-white/45"}`}>
            <Icon size={19} strokeWidth={on ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{label}</span>
            {badge != null && badge > 0 && !on && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
