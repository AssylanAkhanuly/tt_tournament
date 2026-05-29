"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Check, X, Trash2, UserPlus,
  Zap, Users, Trophy, Clock, Settings, Minus,
  RefreshCw, Calendar, LayoutGrid, Plus, ToggleLeft, ToggleRight, Layers,
  ChevronDown, Moon, Sun, Volume2, VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GroupMatch, Match, Participant, Tournament, TournamentGroup, TournamentTable, User } from "@/lib/types";
import { api, type ElevenLabsVoice } from "@/lib/api";
import ScoreModal from "@/components/ScoreModal";
import AddPlayerModal from "@/components/AddPlayerModal";
import LiveMatchesPanel from "@/components/LiveMatchesPanel";

const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });
const BracketFlow    = dynamic(() => import("@/components/BracketFlow"),    { ssr: false });
const ClassicBracket = dynamic(() => import("@/components/ClassicBracket"), { ssr: false });

// ─── Avatar gradient ──────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#3b82f6","#6366f1"], ["#06b6d4","#3b82f6"], ["#8b5cf6","#ec4899"],
  ["#10b981","#06b6d4"], ["#f59e0b","#ef4444"], ["#22c55e","#3b82f6"],
];
function avatarGrad(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

// ─── Tokens ──────────────────────────────────────────────────────────────────
const INPUT = "w-full px-4 py-3 bg-white/[0.08] border border-white/[0.12] rounded-xl text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/70 focus:bg-white/[0.11] transition-all [color-scheme:dark]";
const LABEL = "text-[10px] font-bold uppercase tracking-[0.14em] text-white/35";
const BTN_P = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.97] text-white font-semibold text-[14px] transition-all";
const BTN_G = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.13] active:scale-[.97] text-white font-medium text-[14px] transition-all border border-white/[0.08]";
const BTN_D = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-[.97] text-red-400 font-semibold text-[14px] transition-all border border-red-500/20";

const S = {
  open:        { dot: "bg-emerald-400",            pill: "bg-emerald-400/15 text-emerald-300", label: "Открыт"   },
  in_progress: { dot: "bg-blue-400 animate-pulse", pill: "bg-blue-500/20 text-blue-300",       label: "Live"     },
  finished:    { dot: "bg-white/20",               pill: "bg-white/[0.07] text-white/35",      label: "Завершён" },
} as const;

type Page = "overview" | "bracket" | "players" | "tables" | "settings";
type ThemeMode = "dark" | "light";

// ─── Toast ───────────────────────────────────────────────────────────────────
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
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl
                      shadow-xl text-[14px] font-semibold animate-toast ${
            t.ok
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/20 border-red-500/30 text-red-300"
          }`}
        >
          <span>{t.ok ? "✓" : "✗"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Bracket score reset guards.
function hasFinishedBracketScore(match: Match | null | undefined): match is Match {
  return !!match && match.status === "finished" && match.score1 != null && match.score2 != null;
}

function canResetBracketScore(match: Match | null | undefined, matches: Match[]): boolean {
  if (!hasFinishedBracketScore(match)) return false;
  const byId = new Map(matches.map((m) => [m.id, m]));
  const nextIds = [match.winner_next_id, match.loser_next_id].filter((id): id is number => id != null);
  return nextIds.every((id) => !hasFinishedBracketScore(byId.get(id)));
}

const MALE_RUSSIAN_VOICE_HINTS = [
  "dmitry", "pavel", "yuri", "yury", "maxim", "maksim", "alexander", "alexandr",
  "nikolai", "oleg", "sergey", "kirill", "igor", "ivan", "константин",
  "дмитрий", "павел", "юрий", "максим", "александр", "николай", "олег",
  "сергей", "кирилл", "игорь", "иван",
];

function isRussianVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  return lang.startsWith("ru") || name.includes("russian") || name.includes("рус");
}

function isLikelyMaleRussianVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return isRussianVoice(voice) && MALE_RUSSIAN_VOICE_HINTS.some((hint) => name.includes(hint));
}

function speakRussian(text: string, voiceURI?: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 0.92;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voiceURI ? voices.find((voice) => voice.voiceURI === voiceURI) : null;
  const russianVoice = selectedVoice
    ?? voices.find(isLikelyMaleRussianVoice)
    ?? voices.find(isRussianVoice);
  if (russianVoice) utterance.voice = russianVoice;

  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
  return true;
}

function speakTableCall(player1: string, player2: string, tableNumber: number, voiceURI?: string): boolean {
  return speakRussian(`${player1} и ${player2}, стол ${tableNumber}`, voiceURI);
}

function isRussianElevenVoice(voice: ElevenLabsVoice): boolean {
  const labels = Object.values(voice.labels ?? {}).join(" ").toLowerCase();
  const languages = (voice.verified_languages ?? [])
    .flatMap((entry) => Object.values(entry))
    .join(" ")
    .toLowerCase();
  return labels.includes("russian") || labels.includes("ru") || languages.includes("ru");
}

function isLikelyMaleElevenVoice(voice: ElevenLabsVoice): boolean {
  const labels = Object.values(voice.labels ?? {}).join(" ").toLowerCase();
  const name = voice.name.toLowerCase();
  return labels.includes("male") || MALE_RUSSIAN_VOICE_HINTS.some((hint) => name.includes(hint));
}

function elevenVoiceLabel(voice: ElevenLabsVoice): string {
  const labels = voice.labels ?? {};
  const parts = [labels.gender, labels.language, labels.accent].filter(Boolean);
  return parts.length > 0 ? `${voice.name} (${parts.join(", ")})` : voice.name;
}

function ElevenVoicePicker({
  disabled,
  onChange,
  selectedVoiceId,
  voices,
}: {
  disabled: boolean;
  onChange: (voiceId: string) => void;
  selectedVoiceId: string;
  voices: ElevenLabsVoice[];
}) {
  const [open, setOpen] = useState(false);
  const selectedVoice = voices.find((voice) => voice.voice_id === selectedVoiceId);

  return (
    <div className="relative sm:flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="w-full h-[44px] px-4 rounded-xl border border-white/[0.12]
                   bg-white/[0.08] hover:bg-white/[0.11] disabled:opacity-40
                   text-left text-[15px] text-white font-semibold transition-all
                   flex items-center gap-3 focus:outline-none focus:border-blue-500/70"
      >
        <span className="flex-1 min-w-0 truncate">
          {selectedVoice ? elevenVoiceLabel(selectedVoice) : "ElevenLabs voice"}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-white/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[280px] overflow-y-auto
                          rounded-xl border border-white/[0.12] bg-[#101928] shadow-2xl">
            {voices.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-white/35">ElevenLabs voice</p>
            ) : (
              voices.map((voice) => {
                const active = voice.voice_id === selectedVoiceId;
                return (
                  <button
                    key={voice.voice_id}
                    type="button"
                    onClick={() => {
                      onChange(voice.voice_id);
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-[14px] font-semibold transition-colors
                                flex items-start gap-3 ${
                      active
                        ? "bg-blue-500/18 text-blue-100"
                        : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{voice.name}</span>
                      {Object.keys(voice.labels ?? {}).length > 0 && (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-white/35">
                          {Object.values(voice.labels ?? {}).filter(Boolean).join(", ")}
                        </span>
                      )}
                    </span>
                    {active && <Check size={15} className="mt-0.5 shrink-0 text-blue-300" />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Audio playback is unavailable."));
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const audio = new Audio(url);
    const cleanup = () => window.URL.revokeObjectURL(url);

    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Audio playback failed."));
    };
    audio.play().catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

function errorDetail(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "detail" in err) {
    const detail = (err as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

// Props
interface Props {
  user: User;
  tournament: Tournament;
  participants: Participant[];
  initialMatches: Match[];
  tournamentTables?: TournamentTable[];
}

export default function TournamentDetailClient({
  user,
  tournament: initTournament,
  participants: initParticipants,
  initialMatches,
  tournamentTables: initTables = [],
}: Props) {
  const router  = useRouter();
  // Club admin OR superuser can manage this tournament
  const isAdmin = user.is_staff ||
    (initTournament.club_id != null && user.club_ids_admin.includes(initTournament.club_id));
  const { toasts, show: toast } = useToast();
  const voiceStorageKey = `tt_voice_calling_${initTournament.id}`;
  const voiceChoiceStorageKey = `tt_voice_uri_${initTournament.id}`;
  const naturalVoiceStorageKey = `tt_elabs_voice_id_${initTournament.id}`;
  const themeStorageKey = "tt_theme_mode";

  const [tournament,   setTournament]   = useState<Tournament>(initTournament);
  const [participants, setParticipants] = useState<Participant[]>(initParticipants);
  const [matches,      setMatches]      = useState<Match[]>(initialMatches);
  const [tables,       setTables]       = useState<TournamentTable[]>(initTables);
  const [groups,       setGroups]       = useState<TournamentGroup[]>([]);
  const [page, setPage] = useState<Page>(
    initTournament.status === "open" ? "bracket" : "overview"
  );
  const [refreshing,   setRefreshing]   = useState(false);
  const [voiceCallingEnabled, setVoiceCallingEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(voiceStorageKey) === "1";
  });
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(voiceChoiceStorageKey) ?? "";
  });
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedElevenVoiceId, setSelectedElevenVoiceId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(naturalVoiceStorageKey) ?? "";
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
  });
  const lastRefresh = useRef(Date.now());
  const audioQueueRef = useRef<Promise<void>>(Promise.resolve());
  const voiceCallingEnabledRef = useRef(voiceCallingEnabled);
  const voiceFallbackNoticeRef = useRef(false);

  // Edit
  const [editing,      setEditing]      = useState(false);
  const [editName,     setEditName]     = useState(tournament.name);
  const [editDesc,     setEditDesc]     = useState(tournament.description);
  const [editStartsAt, setEditStartsAt] = useState(tournament.starts_at?.slice(0, 16) ?? "");
  const [saving,       setSaving]       = useState(false);
  const [editError,    setEditError]    = useState<string | null>(null);

  // Modals
  const [scoreMatch,        setScoreMatch]        = useState<Match | null>(null);
  const [showAddPlayer,     setShowAddPlayer]     = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Start
  const [starting,   setStarting]   = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Remove
  const [removingId, setRemovingId] = useState<number | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const liveCount   = matches.filter((m) => m.status === "in_progress").length;
  const finishedCnt = matches.filter((m) => m.status === "finished").length;
  const pendingCnt  = matches.filter((m) => m.status === "pending" && m.player1 && m.player2).length;
  const s           = S[tournament.status];
  const existingIds = new Set(participants.map((p) => p.user.id));
  const totalMatches = matches.length;
  // Late entries: allowed before start, and during the group stage (groups
  // exist but the playoff bracket isn't generated yet).
  const isGroupStage = tournament.format === "group_playoff"
    && tournament.status === "in_progress" && groups.length > 0 && matches.length === 0;
  const canAddPlayer = tournament.status === "open" || isGroupStage;

  // The champion is the winner of the grand final (places 1–2). In the
  // all-places ladder the consolation runs deeper than the final, so we must
  // NOT use the deepest round; fall back to it only for single-elimination
  // (where place ranges aren't set).
  const finalMatch = matches.length
    ? (matches.find((m) => m.place_lo === 1 && m.place_hi === 2) ??
       matches.find((m) => m.round_number === Math.max(...matches.map((x) => x.round_number))))
    : null;
  const winner = finalMatch?.winner ?? null;

  const startsAtDisplay = tournament.starts_at
    ? new Date(tournament.starts_at).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  // ── Auto-refresh every 30s while live ─────────────────────────────────────
  const refresh = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true);
    try {
      const [fm, ft] = await Promise.all([
        api.getMatches(tournament.id),
        api.getTournament(tournament.id),
      ]);
      setMatches(fm);
      setTournament(ft);
      lastRefresh.current = Date.now();
    } catch { /* silent */ }
    finally { if (!silent) setRefreshing(false); }
  }, [tournament.id]);

  useEffect(() => {
    if (tournament.status !== "in_progress") return;
    const id = setInterval(() => refresh(true), 30_000);
    return () => clearInterval(id);
  }, [tournament.status, refresh]);

  // When the tournament finishes, ratings are applied server-side — pull the
  // updated participants (rating_before/rating_change) so the standings show them.
  useEffect(() => {
    if (tournament.status !== "finished") return;
    api.getParticipants(tournament.id).then(setParticipants).catch(() => {});
  }, [tournament.status, tournament.id]);

  // Load groups for group_playoff format
  useEffect(() => {
    if (tournament.format !== "group_playoff" || tournament.status === "open") return;
    api.getGroups(tournament.id).then(setGroups).catch(() => {});
  }, [tournament.id, tournament.format, tournament.status]);

  // ── Keyboard shortcut: press 1-9/0 in Overview or Live to open score modal ──
  useEffect(() => {
    if (page !== "overview" && page !== "bracket") return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLSelectElement) return;
      const n = e.key === "0" ? 10 : parseInt(e.key);
      if (isNaN(n) || n < 1 || n > 10) return;
      const m = matches.find((x) => x.status === "in_progress" && x.table_number === n);
      if (m) setScoreMatch(m);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, matches]);

  useEffect(() => {
    voiceCallingEnabledRef.current = voiceCallingEnabled;
    window.localStorage.setItem(voiceStorageKey, voiceCallingEnabled ? "1" : "0");
    if (!voiceCallingEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceStorageKey, voiceCallingEnabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      const russianVoices = voices.filter(isRussianVoice);
      setSelectedVoiceURI((current) => {
        if (current && russianVoices.some((voice) => voice.voiceURI === current)) return current;
        const stored = window.localStorage.getItem(voiceChoiceStorageKey);
        if (stored && russianVoices.some((voice) => voice.voiceURI === stored)) return stored;
        return (russianVoices.find(isLikelyMaleRussianVoice) ?? russianVoices[0])?.voiceURI ?? "";
      });
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [voiceChoiceStorageKey]);

  useEffect(() => {
    if (!selectedVoiceURI) return;
    window.localStorage.setItem(voiceChoiceStorageKey, selectedVoiceURI);
  }, [voiceChoiceStorageKey, selectedVoiceURI]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    api.getTtsVoices(tournament.id)
      .then(({ voices, default_voice_id }) => {
        if (cancelled) return;
        setElevenLabsVoices(voices);
        setSelectedElevenVoiceId((current) => {
          if (current && voices.some((voice) => voice.voice_id === current)) return current;
          const stored = window.localStorage.getItem(naturalVoiceStorageKey);
          if (stored && voices.some((voice) => voice.voice_id === stored)) return stored;
          if (default_voice_id && voices.some((voice) => voice.voice_id === default_voice_id)) {
            return default_voice_id;
          }
          return (
            voices.find((voice) => isLikelyMaleElevenVoice(voice) && isRussianElevenVoice(voice))
            ?? voices.find(isLikelyMaleElevenVoice)
            ?? voices.find(isRussianElevenVoice)
            ?? voices[0]
          )?.voice_id ?? "";
        });
      })
      .catch(() => {
        if (!cancelled) setElevenLabsVoices([]);
      });

    return () => { cancelled = true; };
  }, [isAdmin, naturalVoiceStorageKey, tournament.id]);

  useEffect(() => {
    if (!selectedElevenVoiceId) return;
    window.localStorage.setItem(naturalVoiceStorageKey, selectedElevenVoiceId);
  }, [naturalVoiceStorageKey, selectedElevenVoiceId]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(themeStorageKey, themeMode);
  }, [themeMode, themeStorageKey]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const queueTableCall = useCallback((
    player1: string,
    player2: string,
    tableNumber: number,
    force = false
  ) => {
    audioQueueRef.current = audioQueueRef.current.catch(() => undefined).then(async () => {
      if (!force && !voiceCallingEnabledRef.current) return;
      try {
        const audio = await api.tableCallAudio(tournament.id, {
          player1,
          player2,
          table_number: tableNumber,
          voice_id: selectedElevenVoiceId || undefined,
        });
        await playAudioBlob(audio);
        voiceFallbackNoticeRef.current = false;
      } catch (err) {
        const fallbackWorked = speakTableCall(player1, player2, tableNumber, selectedVoiceURI || undefined);
        if (!fallbackWorked || force || !voiceFallbackNoticeRef.current) {
          toast(errorDetail(err, "Не удалось воспроизвести голосовой вызов"), false);
          voiceFallbackNoticeRef.current = true;
        }
      }
    });
  }, [selectedElevenVoiceId, selectedVoiceURI, toast, tournament.id]);

  function toggleVoiceCalling() {
    setVoiceCallingEnabled((enabled) => !enabled);
  }

  function testVoiceCalling() {
    queueTableCall("Игрок один", "Игрок два", 1, true);
  }

  const callPlayersToTable = useCallback((player1: string, player2: string, tableNumber: number) => {
    if (!voiceCallingEnabled) return;
    queueTableCall(player1, player2, tableNumber);
  }, [queueTableCall, voiceCallingEnabled]);

  const callNewlyAssignedMatches = useCallback((previous: Match[], next: Match[]) => {
    if (!voiceCallingEnabled) return;
    const previousCalls = new Set(
      previous
        .filter((m) => m.status === "in_progress" && m.table_number != null)
        .map((m) => `${m.id}:${m.table_number}`)
    );
    next
      .filter((m) => (
        m.status === "in_progress" &&
        m.table_number != null &&
        m.player1 &&
        m.player2 &&
        !previousCalls.has(`${m.id}:${m.table_number}`)
      ))
      .sort((a, b) => (a.table_number ?? 0) - (b.table_number ?? 0))
      .forEach((m) => {
        callPlayersToTable(m.player1!.name, m.player2!.name, m.table_number!);
      });
  }, [callPlayersToTable, voiceCallingEnabled]);

  async function handleSave() {
    setSaving(true); setEditError(null);
    try {
      const updated = await api.updateTournament(tournament.id, {
        name: editName, description: editDesc, starts_at: editStartsAt || null,
      });
      setTournament(updated); setEditing(false);
      toast("Турнир обновлён");
    } catch (err: unknown) {
      setEditError((err as Record<string, string>)?.detail ?? "Не удалось сохранить.");
    } finally { setSaving(false); }
  }

  function cancelEdit() {
    setEditName(tournament.name); setEditDesc(tournament.description);
    setEditStartsAt(tournament.starts_at?.slice(0, 16) ?? "");
    setEditing(false); setEditError(null);
  }

  async function handleDelete() {
    try { await api.deleteTournament(tournament.id); router.push("/dashboard"); }
    catch (err: unknown) { alert((err as Record<string, string>)?.detail ?? "Ошибка."); }
    setShowDeleteConfirm(false);
  }

  async function handleStart() {
    setStarting(true); setStartError(null);
    try {
      const r = await api.startTournament(tournament.id);
      setTournament(r.tournament);
      if (r.groups) {
        setGroups(r.groups);
        toast("Турнир начат! Групповой этап создан.");
      } else {
        setMatches(r.matches ?? []);
        toast("Турнир начат! Матчи сгенерированы.");
      }
      setPage("overview");
    } catch (err: unknown) {
      setStartError((err as Record<string, string>)?.detail ?? "Ошибка.");
    } finally { setStarting(false); }
  }

  async function handleScoreSubmit(s1: number, s2: number) {
    if (!scoreMatch) return;
    const previousMatches = matches;
    await api.submitScore(tournament.id, scoreMatch.id, s1, s2);
    const [fm, ft] = await Promise.all([api.getMatches(tournament.id), api.getTournament(tournament.id)]);
    callNewlyAssignedMatches(previousMatches, fm);
    setMatches(fm); setTournament(ft); setScoreMatch(null);
    const winner = s1 > s2 ? scoreMatch.player1?.name : scoreMatch.player2?.name;
    toast(`${winner ?? "Игрок"} победил ${s1}:${s2}`);
  }

  async function handleScoreReset() {
    if (!scoreMatch) return;
    if (!canResetBracketScore(scoreMatch, matches)) {
      toast("Сначала отмените результат следующего матча", false);
      return;
    }
    await api.resetMatch(tournament.id, scoreMatch.id);
    const [fm, ft] = await Promise.all([api.getMatches(tournament.id), api.getTournament(tournament.id)]);
    setMatches(fm); setTournament(ft); setScoreMatch(null);
    toast("Счёт сброшен — введите заново");
  }

  async function handleRemove(participantId: number) {
    setRemovingId(participantId);
    try {
      await api.removeParticipant(tournament.id, participantId);
      setParticipants((p) => p.filter((x) => x.id !== participantId));
      setTournament((t) => ({ ...t, participant_count: t.participant_count - 1 }));
      toast("Игрок удалён");
    } catch (err: unknown) { toast((err as Record<string, string>)?.detail ?? "Ошибка", false); }
    finally { setRemovingId(null); }
  }

  function handlePlayerAdded(participant: Participant) {
    setParticipants((p) => p.find((x) => x.id === participant.id) ? p : [...p, participant]);
    setTournament((t) => ({ ...t, participant_count: t.participant_count + 1 }));
    toast(`${participant.user.name} добавлен`);
    // A late entry during the group stage gets seated in a group server-side —
    // refresh the groups so the new player and their matches appear.
    if (isGroupStage) api.getGroups(tournament.id).then(setGroups).catch(() => {});
  }

  function handleMatchUpdated(updated: Match) {
    setMatches((m) => m.map((x) => (x.id === updated.id ? updated : x)));
  }

  // Nav items
  const navItems: { id: Page; label: string; Icon: React.ElementType; badge?: number; show: boolean }[] = [
    { id: "overview",  label: "Обзор",     Icon: Zap,        badge: liveCount || undefined, show: tournament.status !== "open" },
    { id: "bracket",   label: "Сетка",     Icon: Trophy,     show: tournament.status === "open" },
    { id: "players",   label: "Игроки",    Icon: Users,      badge: participants.length, show: true },
    { id: "tables",    label: "Столы",     Icon: LayoutGrid, badge: tables.length || undefined, show: isAdmin },
    { id: "settings",  label: "Настройки", Icon: Settings,   show: isAdmin },
  ];

  // Progress bar for live tournaments
  const progress = totalMatches > 0 ? Math.round((finishedCnt / totalMatches) * 100) : 0;

  return (
    <div className={`tt-tournament-theme ${themeMode === "light" ? "tt-theme-light" : "tt-theme-dark"} fixed inset-x-0 bottom-0 top-[52px] flex overflow-hidden`}>

      {/* ════════════════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════════════════ */}
      <aside className="flex-none w-[60px] sm:w-[220px] flex flex-col
                        bg-[#070f1d] border-r border-white/[0.07] shrink-0
                        overflow-hidden">

        {/* Back — goes to club page if club exists, else dashboard */}
        <Link href={tournament.club_id ? `/dashboard/clubs/${tournament.club_id}` : "/dashboard"}
          className="flex items-center gap-3 px-4 py-4
                     text-white/40 hover:text-white hover:bg-white/[0.04]
                     transition-all border-b border-white/[0.06] shrink-0 group">
          <ArrowLeft size={17} className="shrink-0 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:block text-[13px] font-medium">
            {tournament.club_name ?? "Назад"}
          </span>
        </Link>

        {/* Tournament info */}
        <div className="hidden sm:block px-4 py-4 border-b border-white/[0.06] shrink-0">
          {/* Mini card with gradient avatar */}
          <div className="flex items-center gap-2.5 mb-3">
            {(() => {
              const [g1, g2] = avatarGrad(tournament.name);
              return (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center
                                text-[13px] font-black text-white shrink-0"
                     style={{
                       background: `linear-gradient(135deg, ${g1}, ${g2})`,
                       boxShadow: `0 3px 8px ${g1}50`,
                     }}>
                  {tournament.name.charAt(0).toUpperCase()}
                </div>
              );
            })()}
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white leading-snug truncate">
                {tournament.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                <span className="text-[11px] text-white/35">{s.label}</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[11px] text-white/30 mb-2.5">
            <span className="flex items-center gap-1">
              <Users size={10} />{participants.length} уч.
            </span>
            {totalMatches > 0 && (
              <span className="flex items-center gap-1">
                <Trophy size={10} />{totalMatches} матчей
              </span>
            )}
          </div>

          {/* Progress bar */}
          {tournament.status === "in_progress" && totalMatches > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/25">Прогресс</span>
                <span className="text-[10px] font-bold text-white/40">{finishedCnt}/{totalMatches}</span>
              </div>
              <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.filter((n) => n.show).map(({ id, label, Icon, badge }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => setPage(id)}
                className={`w-full flex items-center gap-3 px-4 py-3
                            text-left transition-all relative group ${
                  active
                    ? "bg-blue-600/[0.14] text-white"
                    : "text-white/35 hover:text-white/75 hover:bg-white/[0.04]"
                }`}>
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7
                                   bg-blue-500 rounded-r-full" />
                )}
                <Icon size={18} className={`shrink-0 transition-colors ${
                  active ? "text-blue-400" : "group-hover:text-white/60"
                }`} />
                <span className="hidden sm:block text-[14px] font-semibold flex-1">
                  {label}
                </span>
                {badge !== undefined && badge > 0 && (
                  <span className={`hidden sm:flex h-5 min-w-[20px] px-1.5 rounded-full text-[11px]
                                    font-bold items-center justify-center ${
                    id === "overview"
                      ? "bg-blue-500/30 text-blue-200"
                      : "bg-white/[0.10] text-white/45"
                  }`}>
                    {badge}
                  </span>
                )}
                {badge !== undefined && badge > 0 && (
                  <span className={`sm:hidden absolute top-2 right-2.5 w-2 h-2 rounded-full ${
                    id === "overview" ? "bg-blue-400 animate-pulse" : "bg-white/25"
                  }`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Refresh button (live only) */}
        {tournament.status === "in_progress" && (
          <button onClick={() => refresh(false)} disabled={refreshing}
            className="hidden sm:flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]
                       text-white/25 hover:text-white/60 hover:bg-white/[0.03]
                       transition-all shrink-0 text-[12px]">
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Обновить
          </button>
        )}

        {/* Winner */}
        {tournament.status === "finished" && winner && (
          <div className="hidden sm:block px-4 py-4 border-t border-white/[0.06] shrink-0">
            <p className="text-[10px] font-bold text-amber-400/50 uppercase tracking-wider mb-1">
              Победитель
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <p className="text-[13px] font-bold text-amber-300 truncate">{winner.name}</p>
            </div>
          </div>
        )}
      </aside>

      {/* ════════════════════════════════════════════════════════════════
          MAIN
      ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 relative overflow-hidden bg-[#050c18]">

        {/* ── OVERVIEW (bracket + groups + live combined) ─────────── */}
        {page === "overview" && tournament.status !== "open" && (
          <OverviewPanel
            tournament={tournament}
            matches={matches}
            participants={participants}
            tables={tables}
            groups={groups}
            user={user}
            isAdmin={isAdmin}
            refreshing={refreshing}
            onRefresh={() => refresh(false)}
            onEnterScore={setScoreMatch}
            onMatchUpdated={handleMatchUpdated}
            onGroupsChange={setGroups}
            onMatchesChange={setMatches}
            onTournamentChange={setTournament}
            voiceCallingEnabled={voiceCallingEnabled}
            onCallTable={callPlayersToTable}
          />
        )}

        {/* ── BRACKET ─────────────────────────────────────────────── */}
        {page === "bracket" && (
          <div className="absolute inset-0 overflow-auto bg-[#050c18]">
            {matches.length > 0 ? (
              tournament.format === "group_playoff" ? (
                <ClassicBracket
                  key={matches.length}
                  matches={matches}
                  currentUser={user}
                  isAdmin={isAdmin}
                  onEnterScore={setScoreMatch}
                />
              ) : (
                <BracketFlow
                  matches={matches}
                  currentUser={user}
                  isAdmin={isAdmin}
                  onEnterScore={setScoreMatch}
                  className="w-full h-full bg-[#050c18]"
                />
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Trophy size={56} className="text-white/[0.06]" />
                <p className="text-[15px] text-white/20">
                  {tournament.status === "open" ? "Турнир не начат" : "Нет матчей"}
                </p>
              </div>
            )}

            {/* Start prompt */}
            {isAdmin && tournament.status === "open" && (
              <div className="absolute bottom-6 inset-x-0 flex justify-center px-4">
                <div className="bg-[#0a1a30]/95 backdrop-blur-xl border border-amber-400/25
                                rounded-2xl px-5 py-4 flex items-center gap-4
                                w-full max-w-md shadow-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white">
                      {participants.length < 2
                        ? `Добавьте ещё ${2 - participants.length} участн.`
                        : `${participants.length} участников — готово к старту`}
                    </p>
                    {startError && <p className="text-[12px] text-red-400 mt-0.5">{startError}</p>}
                  </div>
                  <button onClick={handleStart} disabled={starting || participants.length < 2}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
                               active:scale-[.97] disabled:opacity-40 text-white font-bold
                               text-[14px] transition-all whitespace-nowrap">
                    {starting ? "..." : "🏆 Начать"}
                  </button>
                </div>
              </div>
            )}

            {/* Winner banner */}
            {tournament.status === "finished" && winner && (
              <div className="absolute top-4 inset-x-0 flex justify-center px-4 pointer-events-none">
                <div className="bg-[#0a1a30]/90 backdrop-blur-xl border border-amber-400/30
                                rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider">
                      Победитель турнира
                    </p>
                    <p className="text-[18px] font-black text-amber-300">{winner.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PLAYERS ─────────────────────────────────────────────── */}
        {page === "players" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-white/[0.07] shrink-0 bg-[#070f1d]/60">
              <div>
                <h2 className="text-[17px] font-bold text-white">Участники</h2>
                <p className="text-[12px] text-white/30 mt-0.5">
                  {participants.length} зарегистрировано
                </p>
              </div>
              {isAdmin && canAddPlayer && (
                <button onClick={() => setShowAddPlayer(true)} className={BTN_P}>
                  <UserPlus size={15} />Добавить{isGroupStage ? " в группу" : ""}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Users size={44} className="text-white/[0.07]" />
                  <div className="text-center">
                    <p className="text-[16px] font-semibold text-white/20">Нет участников</p>
                    <p className="text-[13px] text-white/15 mt-1">
                      Добавьте игроков вручную или через QR‑код
                    </p>
                  </div>
                  {isAdmin && canAddPlayer && (
                    <button onClick={() => setShowAddPlayer(true)} className={BTN_P}>
                      <UserPlus size={15} />Добавить первого игрока
                    </button>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl mx-auto px-5 py-5">
                  <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
                       style={{ background: "var(--card)" }}>
                    {participants.map((p, idx) => {
                      const [g1, g2] = avatarGrad(p.user.name);
                      const isWinner = tournament.status === "finished" && winner?.id === p.user.id;
                      return (
                        <div key={p.id}>
                          <div className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                            isWinner ? "bg-amber-400/[0.04]" : "hover:bg-white/[0.02]"
                          }`}>
                            {/* Rank */}
                            <div className="w-7 h-7 rounded-full bg-white/[0.05]
                                            flex items-center justify-center text-[12px] font-bold
                                            text-white/20 shrink-0 select-none tabular-nums">
                              {idx + 1}
                            </div>
                            {/* Gradient avatar */}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center
                                            text-[14px] font-black text-white shrink-0"
                                 style={{
                                   background: `linear-gradient(135deg, ${g1}, ${g2})`,
                                   boxShadow: `0 4px 10px ${g1}55`,
                                 }}>
                              {p.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-semibold text-white truncate">
                                  {p.user.name}
                                </p>
                                {isWinner && (
                                  <span className="text-[11px] font-bold text-amber-300
                                                   bg-amber-400/15 px-2 py-0.5 rounded-full
                                                   border border-amber-400/20 shrink-0">
                                    🏆 Победитель
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[12px] text-white/25">{p.user.phone}</p>
                                <span className="text-[11px] text-blue-300/60 font-medium">
                                  Рейтинг: {p.user.rating}
                                </span>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5
                                            text-[11px] text-white/15 shrink-0">
                              <Calendar size={10} />
                              {new Date(p.joined_at).toLocaleDateString("ru-RU")}
                            </div>
                            {isAdmin && tournament.status === "open" && (
                              <button onClick={() => handleRemove(p.id)} disabled={removingId === p.id}
                                className="w-7 h-7 rounded-full hover:bg-red-500/15 flex items-center
                                           justify-center text-white/15 hover:text-red-400
                                           disabled:opacity-40 transition-all shrink-0">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          {idx < participants.length - 1 && (
                            <div className="h-px bg-white/[0.04] ml-[88px]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TABLES ──────────────────────────────────────────────── */}
        {page === "tables" && isAdmin && (
          <TablesTab
            tournamentId={tournament.id}
            tables={tables}
            onTablesChange={setTables}
          />
        )}

        {/* ── SETTINGS ────────────────────────────────────────────── */}
        {page === "settings" && isAdmin && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-white/[0.07] shrink-0 bg-[#070f1d]/60">
              <h2 className="text-[17px] font-bold text-white">Настройки</h2>
              <p className="text-[12px] text-white/30 mt-0.5">{tournament.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-5 py-6 space-y-7">

                {/* Tournament info card */}
                <section>
                  <p className={LABEL + " mb-3"}>Информация о турнире</p>
                  {editing ? (
                    <div className="space-y-3 bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        placeholder="Название" autoFocus className={INPUT} />
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Описание" rows={2} className={INPUT + " resize-none"} />
                      <div className="space-y-1.5">
                        <label className={LABEL}>Дата начала</label>
                        <input type="datetime-local" value={editStartsAt}
                          onChange={(e) => setEditStartsAt(e.target.value)} className={INPUT} />
                      </div>
                      {editError && (
                        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20
                                      rounded-xl px-4 py-2.5">{editError}</p>
                      )}
                      <div className="flex gap-2.5">
                        <button onClick={handleSave} disabled={saving || !editName.trim()} className={BTN_P}>
                          <Check size={15} />{saving ? "Сохранение..." : "Сохранить"}
                        </button>
                        <button onClick={cancelEdit} className={BTN_G}><X size={15} />Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setEditing(true)}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl
                                 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]
                                 transition-all text-left group">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-white">{tournament.name}</p>
                        {tournament.description && (
                          <p className="text-[13px] text-white/40 mt-0.5 truncate">
                            {tournament.description}
                          </p>
                        )}
                        {startsAtDisplay && (
                          <p className="text-[12px] text-white/25 mt-2 flex items-center gap-1.5">
                            <Clock size={11} />{startsAtDisplay}
                          </p>
                        )}
                      </div>
                      <Pencil size={15} className="text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                    </button>
                  )}
                </section>

                {/* Appearance */}
                <section>
                  <p className={LABEL + " mb-3"}>Внешний вид</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { mode: "dark" as const, label: "Темная", Icon: Moon },
                      { mode: "light" as const, label: "Светлая", Icon: Sun },
                    ]).map(({ mode, label, Icon }) => {
                      const active = themeMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setThemeMode(mode)}
                          aria-pressed={active}
                          className={`flex items-center justify-center gap-2.5 h-[44px] rounded-xl border
                                      text-[14px] font-bold transition-all ${
                            active
                              ? "border-blue-500/35 bg-blue-500/[0.14] text-blue-100"
                              : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Voice calls */}
                <section>
                  <p className={LABEL + " mb-3"}>Вызовы к столам</p>
                  <button
                    type="button"
                    onClick={toggleVoiceCalling}
                    aria-pressed={voiceCallingEnabled}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl
                                border transition-all text-left ${
                      voiceCallingEnabled
                        ? "border-blue-500/35 bg-blue-500/[0.10]"
                        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      voiceCallingEnabled ? "bg-blue-500/20 text-blue-300" : "bg-white/[0.07] text-white/35"
                    }`}>
                      {voiceCallingEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-white">Голосовые вызовы</p>
                      <p className="text-[12px] text-white/35 mt-0.5">
                        {voiceCallingEnabled ? "Включены" : "Выключены"}
                      </p>
                    </div>
                    {voiceCallingEnabled
                      ? <ToggleRight size={24} className="text-blue-300 shrink-0" />
                      : <ToggleLeft size={24} className="text-white/30 shrink-0" />
                    }
                  </button>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
                    <ElevenVoicePicker
                      disabled={elevenLabsVoices.length === 0}
                      onChange={setSelectedElevenVoiceId}
                      selectedVoiceId={selectedElevenVoiceId}
                      voices={elevenLabsVoices}
                    />
                    <button
                      type="button"
                      onClick={testVoiceCalling}
                      className="inline-flex items-center justify-center gap-2 px-4 h-[44px] rounded-xl
                                 bg-white/[0.08] hover:bg-white/[0.13] active:scale-[.97]
                                 text-white/70 hover:text-white font-semibold text-[13px]
                                 transition-all border border-white/[0.08]"
                    >
                      <Volume2 size={15} />Проверить
                    </button>
                  </div>
                </section>

                {/* Stats */}
                <section>
                  <p className={LABEL + " mb-3"}>Статистика</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Участников", value: participants.length, color: "text-blue-300",    icon: <Users size={14} /> },
                      { label: "Матчей",     value: totalMatches,        color: "text-white/80",   icon: <Trophy size={14} /> },
                      { label: "Идут",       value: liveCount,            color: "text-cyan-400",  icon: <Zap size={14} /> },
                      { label: "Сыграно",    value: finishedCnt,          color: "text-emerald-400", icon: <Check size={14} /> },
                    ].map(({ label, value, color, icon }) => (
                      <div key={label} className="border border-white/[0.07] rounded-2xl p-4 text-center"
                           style={{ background: "var(--elevated)" }}>
                        <div className={`flex justify-center mb-2 ${color} opacity-50`}>{icon}</div>
                        <p className={`text-[30px] font-black tabular-nums leading-none ${color}`}>
                          {value}
                        </p>
                        <p className="text-[11px] text-white/25 mt-1.5 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* QR Code */}
                <section>
                  <p className={LABEL + " mb-3"}>QR‑код для вступления</p>
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                    <QRCodeDisplay joinToken={tournament.join_token} />
                  </div>
                </section>

                {/* Actions */}
                {tournament.status === "open" && (
                  <section>
                    <p className={LABEL + " mb-3"}>Действия</p>
                    <button onClick={() => setShowDeleteConfirm(true)} className={BTN_D + " w-full"}>
                      <Trash2 size={15} />Удалить турнир
                    </button>
                  </section>
                )}

              </div>
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════
          MODALS + TOASTS
      ════════════════════════════════════════════════════════════════ */}

      <ToastStack toasts={toasts} />

      {scoreMatch && (
        <ScoreModal
          match={scoreMatch}
          onClose={() => setScoreMatch(null)}
          onSubmit={handleScoreSubmit}
          canReset={isAdmin && canResetBracketScore(scoreMatch, matches)}
          onReset={handleScoreReset}
        />
      )}

      {showAddPlayer && (
        <AddPlayerModal
          tournamentId={tournament.id}
          existingUserIds={existingIds}
          onClose={() => setShowAddPlayer(false)}
          onAdded={handlePlayerAdded}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════
          TABLES TAB component (defined outside so it can call hooks)
      ════════════════════════════════════════════════════════════════ */}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                     bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="border border-white/[0.12] rounded-[24px]
                          shadow-2xl w-full max-w-sm overflow-hidden"
               style={{ background: "var(--elevated)" }}>
            <div className="px-6 pt-7 pb-5 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/20
                              flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h2 className="text-[18px] font-bold text-white">Удалить турнир?</h2>
              <p className="text-[14px] text-white/40 mt-2 leading-relaxed">
                «{tournament.name}» и все связанные данные будут удалены навсегда.
              </p>
            </div>
            <div className="border-t border-white/[0.07]">
              <button onClick={handleDelete}
                className="w-full py-4 text-[16px] font-bold text-red-400
                           hover:bg-red-500/[0.05] transition-colors">
                Удалить навсегда
              </button>
              <div className="h-px bg-white/[0.06]" />
              <button onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 text-[16px] font-medium text-blue-400
                           hover:bg-white/[0.03] transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Groups Tab ────────────────────────────────────────────────────────────────

const GINPUT = "w-16 px-2 py-1.5 bg-white/[0.08] border border-white/[0.12] rounded-lg text-[14px] text-white text-center focus:outline-none focus:border-blue-500/60 transition-all [color-scheme:dark]";

function GroupsTab({
  tournamentId,
  groups,
  isAdmin,
  onGroupsChange,
  onPlayoffStarted,
}: {
  tournamentId: string;
  groups: TournamentGroup[];
  isAdmin: boolean;
  onGroupsChange: (g: TournamentGroup[]) => void;
  onPlayoffStarted: (matches: Match[], tournament: Tournament) => void;
}) {
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [startingPlayoff, setStartingPlayoff] = useState(false);

  // Check if all group matches are finished
  const allFinished = groups.length > 0 && groups.every((g) =>
    g.matches.every((m) => m.status === "finished")
  );

  function setMatchScore(matchId: number, field: "s1" | "s2", val: string) {
    setScores((prev) => {
      const existing = prev[matchId] ?? { s1: "", s2: "" };
      return { ...prev, [matchId]: { ...existing, [field]: val } };
    });
  }

  async function submitScore(groupId: number, match: GroupMatch) {
    const sc = scores[match.id];
    if (!sc) return;
    const s1 = parseInt(sc.s1 ?? "");
    const s2 = parseInt(sc.s2 ?? "");
    if (isNaN(s1) || isNaN(s2)) return;
    setSubmitting(match.id);
    try {
      const updated = await api.submitGroupScore(tournamentId, groupId, match.id, s1, s2);
      onGroupsChange(
        groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                matches: g.matches.map((m) => (m.id === match.id ? updated : m)),
                participants: g.participants.map((p) => {
                  // Refresh participants by re-fetching groups
                  return p;
                }),
              }
            : g
        )
      );
      // Refresh groups to get updated standings
      const fresh = await api.getGroups(tournamentId);
      onGroupsChange(fresh);
      setScores((prev) => { const n = { ...prev }; delete n[match.id]; return n; });
    } catch { /* silent */ }
    finally { setSubmitting(null); }
  }

  async function handleStartPlayoff() {
    setStartingPlayoff(true);
    try {
      const r = await api.startPlayoff(tournamentId);
      onPlayoffStarted(r.matches, r.tournament);
    } catch { /* silent */ }
    finally { setStartingPlayoff(false); }
  }

  if (groups.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/25 text-[15px]">Группы не созданы</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_38%)]">
      <div className="px-6 py-4 border-b border-white/[0.07] shrink-0 bg-[#070f1d]/60 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold text-white">Группы</h2>
          <p className="text-[12px] text-white/30 mt-0.5">{groups.length} групп</p>
        </div>
        {isAdmin && allFinished && (
          <button
            onClick={handleStartPlayoff}
            disabled={startingPlayoff}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[.97]
                       disabled:opacity-40 text-white font-bold text-[14px] transition-all"
          >
            {startingPlayoff ? "..." : "Начать плей-офф"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-5 space-y-8">
          {groups.map((group) => (
            <div key={group.id} className="space-y-4">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/40">
                Группа {group.name}
              </h3>

              {/* Standings table */}
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
                   style={{ background: "var(--card)" }}>
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 text-[11px] font-bold uppercase tracking-wider text-white/30 px-5 py-2.5 border-b border-white/[0.06]">
                  <span>Игрок</span>
                  <span className="w-10 text-center">Рейт.</span>
                  <span className="w-8 text-center">В</span>
                  <span className="w-8 text-center">П</span>
                  <span className="w-8 text-center">О</span>
                  <span className="w-12 text-center">Разн.</span>
                </div>
                {group.participants.map((gp, idx) => (
                  <div key={gp.id}
                    className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-0 px-5 py-3 ${
                      idx < group.participants.length - 1 ? "border-b border-white/[0.04]" : ""
                    }`}
                  >
                    <span className="text-[14px] font-semibold text-white truncate pr-3">{gp.user.name}</span>
                    <span className="w-10 text-center text-[12px] text-blue-300/60">{gp.user.rating}</span>
                    <span className="w-8 text-center text-[13px] text-emerald-400">{gp.wins}</span>
                    <span className="w-8 text-center text-[13px] text-red-400/70">{gp.losses}</span>
                    <span className="w-8 text-center text-[13px] font-bold text-white">{gp.points}</span>
                    <span className={`w-12 text-center text-[12px] ${gp.diff >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
                      {gp.diff >= 0 ? "+" : ""}{gp.diff}
                    </span>
                  </div>
                ))}
              </div>

              {/* Matches */}
              <div className="space-y-2">
                {group.matches.map((m) => {
                  const sc = scores[m.id] ?? { s1: "", s2: "" };
                  const done = m.status === "finished";
                  return (
                    <div key={m.id}
                      className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                        done
                          ? "border-white/[0.06] bg-white/[0.02]"
                          : "border-white/[0.10] bg-white/[0.04]"
                      }`}
                    >
                      <span className={`text-[13px] font-semibold flex-1 truncate ${done && m.winner?.id === m.player1.id ? "text-emerald-300" : "text-white/70"}`}>
                        {m.player1.name}
                      </span>
                      {done ? (
                        <span className="text-[15px] font-black text-white tabular-nums">
                          {m.score1} : {m.score2}
                        </span>
                      ) : isAdmin ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min={0}
                            value={sc.s1}
                            onChange={(e) => setMatchScore(m.id, "s1", e.target.value)}
                            className={GINPUT}
                            placeholder="0"
                          />
                          <span className="text-white/30 text-[13px]">:</span>
                          <input
                            type="number"
                            min={0}
                            value={sc.s2}
                            onChange={(e) => setMatchScore(m.id, "s2", e.target.value)}
                            className={GINPUT}
                            placeholder="0"
                          />
                          <button
                            onClick={() => submitScore(group.id, m)}
                            disabled={submitting === m.id || !sc.s1 || !sc.s2}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500
                                       disabled:opacity-40 text-white font-semibold text-[12px]
                                       transition-all whitespace-nowrap"
                          >
                            {submitting === m.id ? "..." : "OK"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[13px] text-white/25">vs</span>
                      )}
                      <span className={`text-[13px] font-semibold flex-1 truncate text-right ${done && m.winner?.id === m.player2.id ? "text-emerald-300" : "text-white/70"}`}>
                        {m.player2.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Overview Panel ────────────────────────────────────────────────────────────

interface OverviewProps {
  tournament: Tournament;
  matches: Match[];
  participants: Participant[];
  tables: TournamentTable[];
  groups: TournamentGroup[];
  user: User;
  isAdmin: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onEnterScore: (m: Match) => void;
  onMatchUpdated: (m: Match) => void;
  onGroupsChange: (g: TournamentGroup[]) => void;
  onMatchesChange: (m: Match[]) => void;
  onTournamentChange: (t: Tournament) => void;
  voiceCallingEnabled: boolean;
  onCallTable: (player1: string, player2: string, tableNumber: number) => void;
}

function OverviewPanel({
  tournament, matches, participants, tables, groups, user, isAdmin,
  refreshing, onRefresh, onEnterScore, onMatchUpdated,
  onGroupsChange, onMatchesChange, onTournamentChange,
  voiceCallingEnabled, onCallTable,
}: OverviewProps) {
  const activeTables = tables.filter((t) => t.is_active);
  const live         = matches.filter((m) => m.status === "in_progress");
  const pendingAll   = matches.filter((m) => m.status === "pending");
  const pendingReady = pendingAll.filter((m) => m.player1 && m.player2);
  // usedNums must include BOTH bracket match tables AND group match tables
  // so a table occupied by a group match doesn't appear free for another
  const usedNums = new Set<number>([
    ...live.flatMap((m) => m.table_number ? [m.table_number] : []),
    // group matches resolved later (after groupMatchesLive is derived)
  ]);
  const tableNameMap = Object.fromEntries(tables.map((t) => [t.number, t.display_name]));
  // freeTables will be recalculated after groupMatchesLive is known (see below)
  const [assigning,      setAssigning]      = useState<number | null>(null);
  const [groupAssigning, setGroupAssigning] = useState<number | null>(null);
  const [groupScoreMatch, setGroupScoreMatch] = useState<(GroupMatch & { groupId: number; groupName: string }) | null>(null);

  async function assignGroupTable(groupId: number, matchId: number, tableNum: number | null) {
    setGroupAssigning(matchId);
    try {
      const updated = await api.assignGroupMatchTable(tournament.id, groupId, matchId, tableNum);
      onGroupsChange(groups.map((g) => g.id === groupId
        ? { ...g, matches: g.matches.map((m) => m.id === matchId ? updated : m) }
        : g
      ));
      if (voiceCallingEnabled && updated.table_number != null) {
        onCallTable(updated.player1.name, updated.player2.name, updated.table_number);
      }
    } catch { /* silent */ }
    finally { setGroupAssigning(null); }
  }

  const isGroupPhase = tournament.format === "group_playoff" && groups.length > 0 && matches.length === 0;
  const playoffStarted = tournament.format === "group_playoff" && matches.length > 0;

  // Group phase: live = in_progress group matches; callable = pending matches
  // where NEITHER player is currently at a table (non-conflicting schedule)
  const allGroupMatches     = isGroupPhase ? groups.flatMap((g) => g.matches.map((m) => ({ ...m, groupId: g.id, groupName: g.name }))) : [];
  const groupMatchesLive = allGroupMatches.filter((m) => m.status === "in_progress");

  // Now that we know groupMatchesLive, include their table numbers so group
  // matches don't appear "free" when assigning another group match
  groupMatchesLive.forEach((m) => { if (m.table_number) usedNums.add(m.table_number); });
  const freeTables = activeTables.filter((t) => !usedNums.has(t.number));

  // Players currently at a table (bracket or group match in_progress)
  const atTableIds = new Set<string>([
    ...groupMatchesLive.flatMap((m) => [m.player1.id, m.player2.id]),
    ...live.flatMap((m) => [m.player1?.id, m.player2?.id].filter(Boolean) as string[]),
  ]);

  // Greedy non-conflicting pass: each player appears at most once in the queue.
  // Walk through all pending matches in order; once a player is picked for a
  // callable match, skip any later match involving that player.
  const allPending = allGroupMatches.filter((m) => m.status === "pending");
  const scheduledIds = new Set<string>(atTableIds); // starts with already-busy players
  const groupMatchesPending: typeof allGroupMatches = [];
  const groupMatchesBlocked: typeof allGroupMatches = [];

  for (const m of allPending) {
    if (!scheduledIds.has(m.player1.id) && !scheduledIds.has(m.player2.id)) {
      groupMatchesPending.push(m);
      scheduledIds.add(m.player1.id);
      scheduledIds.add(m.player2.id);
    } else {
      groupMatchesBlocked.push(m);
    }
  }
  const hasGroups    = groups.length > 0;
  const hasBracket   = matches.length > 0;

  // Toggle between groups view and bracket view in center
  // Use format + matches.length (server data, available immediately) so the
  // correct tab is shown on landing before the async groups fetch completes.
  const [centerView, setCenterView] = useState<"bracket" | "groups" | "results">(
    tournament.status === "finished" && matches.length > 0
      ? "results"
      : tournament.format === "group_playoff" && matches.length === 0
      ? "groups"
      : "bracket"
  );
  const [autoScoring, setAutoScoring] = useState(false);
  const [autoFinishing, setAutoFinishing] = useState(false);

  async function handleAutoRandomScores() {
    setAutoScoring(true);
    try {
      const pending = allGroupMatches.filter((m) => m.status !== "finished");
      for (const m of pending) {
        const winnerFirst = Math.random() > 0.5;
        const loserScore  = Math.floor(Math.random() * 3); // 0-2
        await api.submitGroupScore(
          tournament.id, m.groupId, m.id,
          winnerFirst ? 3 : loserScore,
          winnerFirst ? loserScore : 3,
        );
      }
      const fresh = await api.getGroups(tournament.id);
      onGroupsChange(fresh);
    } catch { /* silent */ }
    finally { setAutoScoring(false); }
  }

  // Dev shortcut: play out the whole playoff bracket with random scores.
  async function handleAutoFinishBracket() {
    setAutoFinishing(true);
    try {
      for (let guard = 0; guard < 300; guard++) {
        const fresh = await api.getMatches(tournament.id);
        const liveNow = fresh.filter((m) => m.status === "in_progress");
        if (liveNow.length === 0) break;
        for (const m of liveNow) {
          const winnerFirst = Math.random() > 0.5;
          const loserScore  = Math.floor(Math.random() * 3); // 0-2
          await api.submitScore(
            tournament.id, m.id,
            winnerFirst ? 3 : loserScore,
            winnerFirst ? loserScore : 3,
          );
        }
      }
      const [fm, ft] = await Promise.all([api.getMatches(tournament.id), api.getTournament(tournament.id)]);
      onMatchesChange(fm); onTournamentChange(ft);
    } catch { /* silent */ }
    finally { setAutoFinishing(false); }
  }

  async function assignTable(match: Match, tableNum: number | null) {
    setAssigning(match.id);
    try {
      const updated = await api.assignTable(tournament.id, match.id, tableNum);
      onMatchUpdated(updated);
      if (voiceCallingEnabled && updated.table_number != null && updated.player1 && updated.player2) {
        onCallTable(updated.player1.name, updated.player2.name, updated.table_number);
      }
    } catch { /* silent */ }
    finally { setAssigning(null); }
  }

  return (
    <>
    <div className="h-full flex flex-col">

      {/* ── Top bar: stats + table pills ── */}
      <div className="shrink-0 border-b border-white/[0.07] bg-[#070f1d]/90 px-4 py-3 flex items-center gap-2.5 flex-wrap backdrop-blur-xl">
        {[
          { label: "Идут",   value: live.length + groupMatchesLive.length, color: "bg-blue-500/20 text-blue-300 border-blue-500/25" },
          { label: "Ждут",   value: isGroupPhase ? allGroupMatches.filter(m => m.status === "pending").length : pendingReady.length, color: "bg-white/[0.07] text-white/40 border-white/[0.07]" },
          { label: "Готово", value: isGroupPhase ? allGroupMatches.filter(m => m.status === "finished").length : matches.filter(m => m.status === "finished").length,
            color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
        ].map(({ label, value, color }) => (
          <span key={label} className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border shrink-0 ${color}`}>
            {value} {label}
          </span>
        ))}

        <div className="w-px h-4 bg-white/[0.08] mx-0.5 shrink-0" />

        {activeTables.map((t) => {
          const bracketM = live.find((x) => x.table_number === t.number);
          const groupM   = groupMatchesLive.find((x) => x.table_number === t.number);
          const isActive = !!(bracketM || groupM);
          const title    = bracketM
            ? `${bracketM.player1?.name} vs ${bracketM.player2?.name} — ввести счёт`
            : groupM
            ? `${groupM.player1.name} vs ${groupM.player2.name} — ввести счёт`
            : `${t.display_name} свободен`;
          return (
            <button key={t.id} disabled={!isActive}
              onClick={() => {
                if (bracketM) onEnterScore(bracketM);
                else if (groupM) setGroupScoreMatch(groupM);
              }}
              title={title}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold
                          transition-all shrink-0 ${
                isActive ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                         : "bg-white/[0.04] text-white/15 cursor-default"
              }`}>
              {t.display_name}
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />}
            </button>
          );
        })}

        <button onClick={onRefresh} disabled={refreshing}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/35 hover:text-white/75 hover:bg-white/[0.05] transition-colors shrink-0">
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── 3-column body ── */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden">


        {/* ── Center: bracket OR group matches (toggle) ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#050c18]">
          {/* Toggle between the available views */}
          {(hasGroups || hasBracket) && (
            <div className="shrink-0 flex items-center gap-1 px-4 py-3 border-b border-white/[0.06]
                            bg-[#070f1d]/60">
              {([
                ...(hasGroups ? [{ v: "groups" as const, label: "Группы" }] : []),
                ...(hasBracket ? [{ v: "bracket" as const, label: "Сетка" }] : []),
                ...(hasBracket && tournament.status === "finished"
                  ? [{ v: "results" as const, label: "Результаты" }] : []),
              ]).map(({ v, label }) => (
                <button key={v} onClick={() => setCenterView(v)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                    centerView === v
                      ? "bg-blue-600/25 text-blue-300 border border-blue-500/30"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                  }`}>
                  {label}
                </button>
              ))}
              {isGroupPhase && isAdmin && (
                <div className="ml-auto flex items-center gap-2">
                  {allGroupMatches.some((m) => m.status !== "finished") && (
                    <button
                      onClick={handleAutoRandomScores}
                      disabled={autoScoring}
                      title="Завершить все матчи случайными счётами"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                                 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300
                                 disabled:opacity-40 transition-all"
                    >
                      <Zap size={12} />
                      {autoScoring ? "..." : "Авто-счёт"}
                    </button>
                  )}
                  {groups.every((g) => g.matches.every((m) => m.status === "finished")) && (
                    <StartPlayoffButton
                      tournamentId={tournament.id}
                      onStarted={(ms, t) => { onMatchesChange(ms); onTournamentChange(t); setCenterView("bracket"); }}
                    />
                  )}
                </div>
              )}
              {!isGroupPhase && isAdmin && hasBracket && tournament.status === "in_progress" && (
                <button
                  onClick={handleAutoFinishBracket}
                  disabled={autoFinishing}
                  title="Доиграть плей-офф случайными счётами"
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                             bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300
                             disabled:opacity-40 transition-all"
                >
                  <Zap size={12} />
                  {autoFinishing ? "Идёт..." : "Доиграть плей-офф"}
                </button>
              )}
            </div>
          )}

          <div className={`flex-1 min-h-0 overflow-hidden relative ${centerView !== "bracket" ? "p-3 sm:p-4" : ""}`}>
            {/* ── Bracket view — full-bleed map, no chrome ── */}
            {centerView === "bracket" && (
              <div className="h-full overflow-hidden">
                {hasBracket ? (
                  tournament.format === "group_playoff" ? (
                    <ClassicBracket key={matches.length} matches={matches} currentUser={user} isAdmin={isAdmin}
                      onEnterScore={onEnterScore} className="w-full h-full bg-transparent" />
                  ) : (
                    <BracketFlow matches={matches} currentUser={user} isAdmin={isAdmin}
                      onEnterScore={onEnterScore} className="w-full h-full bg-transparent" />
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <Trophy size={40} className="text-white/[0.06]" />
                    <p className="text-[13px] text-white/20">
                      {isGroupPhase ? "Плей-офф ещё не начат" : "Нет матчей"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Groups round-robin table view ── */}
            {centerView === "groups" && (
              <div className="h-full overflow-y-auto rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,21,38,0.94),rgba(5,12,24,0.98))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.28)]">
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <p className="text-[13px] text-white/20">Группы не созданы</p>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${groups.length >= 2 ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1"}`}>
                    {groups.map((g, idx) => (
                      <GroupRoundRobinTable key={g.id} group={g} colorIdx={idx} isAdmin={isAdmin}
                        canEditScores={!playoffStarted}
                        onEditMatch={(m) => setGroupScoreMatch({ ...m, groupId: g.id, groupName: g.name })} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Final standings (places + rating change) ── */}
            {centerView === "results" && (
              <div className="h-full overflow-y-auto rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(11,21,38,0.94),rgba(5,12,24,0.98))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.28)]">
                <StandingsTable matches={matches} participants={participants} />
              </div>
            )}

          </div>
        </div>

        {/* ── Right column: live (top 50%) + pending queue (bottom 50%) ── */}
        <div className="xl:w-[360px] xl:min-w-[360px] shrink-0 border-t xl:border-t-0 xl:border-l border-white/[0.07] flex flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(17,18,40,0.98),rgba(12,14,31,0.98))]">

          {/* ── Live — exactly half, independently scrollable ── */}
          <div className="min-h-[260px] xl:h-1/2 flex flex-col border-b border-white/[0.07] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Идут сейчас</span>
              {(isGroupPhase ? groupMatchesLive : live).length > 0 && (
                <span className="ml-auto text-[11px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                  {(isGroupPhase ? groupMatchesLive : live).length}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5">
              {isGroupPhase ? (
                groupMatchesLive.length === 0 ? (
                  <p className="text-[12px] text-white/20 text-center py-8">Нет активных матчей</p>
                ) : (
                  groupMatchesLive.map((m) => (
                    <GroupMatchRow key={m.id} match={m} label="live"
                      isAdmin={isAdmin} freeTables={freeTables} tableNameMap={tableNameMap}
                      assigning={groupAssigning === m.id}
                      onClear={() => assignGroupTable(m.groupId, m.id, null)}
                      onScore={() => setGroupScoreMatch(m)}
                    />
                  ))
                )
              ) : (
                live.length === 0 ? (
                  <p className="text-[12px] text-white/20 text-center py-8">Нет активных матчей</p>
                ) : (
                  live.map((m) => (
                    <CompactMatchCard key={m.id} match={m} isAdmin={isAdmin}
                      assigning={assigning === m.id} freeTables={freeTables} tableNameMap={tableNameMap}
                      onAssign={(t) => assignTable(m, t)}
                      onClear={() => assignTable(m, null)}
                      onScore={() => onEnterScore(m)}
                    />
                  ))
                )
              )}
            </div>
          </div>

          {/* ── Pending queue — exactly half, independently scrollable ── */}
          <div className="min-h-[280px] xl:h-1/2 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.05] shrink-0 flex items-center gap-2">
              <Clock size={11} className="text-white/25 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                {isGroupPhase ? "Матчи групп" : "Ожидают стола"}
              </span>
              {(() => {
                const total = isGroupPhase
                  ? groupMatchesPending.length + groupMatchesBlocked.length
                  : pendingReady.length;
                const ready = isGroupPhase ? groupMatchesPending.length : total;
                return total > 0 && (
                  <span className="ml-auto text-[11px] text-white/30">
                    {ready}/{total}
                  </span>
                );
              })()}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
              {isGroupPhase ? (
                groupMatchesPending.length === 0 && groupMatchesBlocked.length === 0 ? (
                  <p className="text-[11px] text-white/15 text-center py-3">Все матчи сыграны</p>
                ) : (
                  <>
                    {/* Callable (both players free) */}
                    {groupMatchesPending.map((m) => (
                      <GroupMatchRow key={m.id} match={m} label="pending"
                        isAdmin={isAdmin} freeTables={freeTables} tableNameMap={tableNameMap}
                        assigning={groupAssigning === m.id}
                        onAssign={(t) => assignGroupTable(m.groupId, m.id, t)}
                      />
                    ))}
                    {/* Blocked (a player is currently playing) — shown dimmed */}
                    {groupMatchesBlocked.map((m) => (
                      <div key={m.id} className="opacity-40 pointer-events-none">
                        <GroupMatchRow match={m} label="pending"
                          isAdmin={false} freeTables={[]} tableNameMap={tableNameMap}
                        />
                      </div>
                    ))}
                  </>
                )
              ) : (
                pendingReady.length === 0 ? (
                  <p className="text-[11px] text-white/15 text-center py-3">Нет ожидающих</p>
                ) : (
                  pendingReady.map((m) => (
                    <PendingBracketRow key={m.id} match={m} isAdmin={isAdmin}
                      freeTables={freeTables} assigning={assigning === m.id}
                      onAssign={(t) => assignTable(m, t)} />
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Group score modal ── */}
    {groupScoreMatch && (
      <GroupScoreModal
        match={groupScoreMatch}
        onClose={() => setGroupScoreMatch(null)}
        onSubmit={async (s1, s2) => {
          if (playoffStarted) {
            throw { detail: "Плей-офф уже начат — групповые результаты заблокированы." };
          }
          await api.submitGroupScore(tournament.id, groupScoreMatch.groupId, groupScoreMatch.id, s1, s2);
          const updated = await api.getGroups(tournament.id);
          onGroupsChange(updated);
          setGroupScoreMatch(null);
        }}
        onClear={groupScoreMatch.table_number != null && !playoffStarted ? async () => {
          await assignGroupTable(groupScoreMatch.groupId, groupScoreMatch.id, null);
          setGroupScoreMatch(null);
        } : undefined}
        canReset={isAdmin && !playoffStarted}
        onReset={async () => {
          if (playoffStarted) {
            throw { detail: "Плей-офф уже начат — групповые результаты заблокированы." };
          }
          await api.resetGroupMatch(tournament.id, groupScoreMatch.groupId, groupScoreMatch.id);
          const updated = await api.getGroups(tournament.id);
          onGroupsChange(updated);
          setGroupScoreMatch(null);
        }}
      />
    )}
    </>
  );
}

// ── Group colors ──────────────────────────────────────────────────────────────
const GROUP_COLORS = [
  { header: "from-blue-700/80 to-blue-600/70",   accent: "rgba(59,130,246,0.18)", border: "rgba(59,130,246,0.30)",  num: "rgba(59,130,246,0.25)"  },
  { header: "from-purple-700/80 to-purple-600/70", accent: "rgba(139,92,246,0.18)", border: "rgba(139,92,246,0.30)", num: "rgba(139,92,246,0.25)"  },
  { header: "from-teal-700/80 to-cyan-600/70",   accent: "rgba(20,184,166,0.18)", border: "rgba(20,184,166,0.30)", num: "rgba(20,184,166,0.25)"  },
  { header: "from-orange-700/80 to-amber-600/70", accent: "rgba(249,115,22,0.18)", border: "rgba(249,115,22,0.30)", num: "rgba(249,115,22,0.25)"  },
  { header: "from-rose-700/80 to-pink-600/70",   accent: "rgba(244,63,94,0.18)",  border: "rgba(244,63,94,0.30)",  num: "rgba(244,63,94,0.25)"   },
  { header: "from-emerald-700/80 to-green-600/70", accent: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.30)", num: "rgba(16,185,129,0.25)" },
];

// ── Group score modal (same UX as ScoreModal) ─────────────────────────────────
const GROUP_QUICK: [number, number][] = [
  [3, 0], [3, 1], [3, 2],
  [0, 3], [1, 3], [2, 3],
];

function GroupScoreModal({
  match, onClose, onSubmit, onClear, canReset, onReset,
}: {
  match: GroupMatch & { groupId?: number; groupName?: string };
  onClose: () => void;
  onSubmit: (s1: number, s2: number) => Promise<void>;
  onClear?: () => void;
  canReset?: boolean;
  onReset?: () => Promise<void>;
}) {
  const isFinished = match.status === "finished";
  const [s1, setS1]       = useState(match.score1 ?? 0);
  const [s2, setS2]       = useState(match.score2 ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p1wins = s1 > s2, p2wins = s2 > s1;

  function pick(a: number, b: number) { setS1(a); setS2(b); setError(null); }

  async function save() {
    if (s1 === s2) { setError("Ничья недопустима."); return; }
    setLoading(true); setError(null);
    try { await onSubmit(s1, s2); }
    catch (err: unknown) { setError((err as Record<string, string>)?.detail ?? "Не удалось сохранить."); }
    finally { setLoading(false); }
  }

  async function reset() {
    if (!onReset) return;
    setLoading(true); setError(null);
    try { await onReset(); }
    catch (err: unknown) { setError((err as Record<string, string>)?.detail ?? "Не удалось отменить."); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    bg-black/75 backdrop-blur-md p-4"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="border border-white/[0.12] rounded-[24px] shadow-[0_32px_80px_rgba(0,0,0,0.7)]
                      w-full max-w-[360px] overflow-hidden"
           style={{ background: "var(--elevated)" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
              {match.groupName ? `Группа ${match.groupName} · ` : ""}М{match.match_number}
              {match.table_number ? ` · Стол ${match.table_number}` : ""}
            </p>
            <h2 className="text-[20px] font-bold text-white mt-0.5 leading-tight">Счёт матча</h2>
          </div>
          <button onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.13]
                       flex items-center justify-center text-white/35 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Player rows with steppers */}
          <div className="space-y-2.5">
            {([
              { name: match.player1.name, score: s1, setScore: setS1, wins: p1wins },
              { name: match.player2.name, score: s2, setScore: setS2, wins: p2wins },
            ] as const).map(({ name, score, setScore, wins }, i) => (
              <div key={i}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 border transition-all ${
                  wins ? "border-emerald-500/35 bg-emerald-500/[0.08]" : "border-white/[0.08] bg-white/[0.04]"
                }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px]
                                 font-black shrink-0 ${wins ? "bg-emerald-500/25 text-emerald-300" : "bg-white/[0.07] text-white/35"}`}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className={`flex-1 text-[14px] font-semibold truncate ${wins ? "text-white" : "text-white/55"}`}>
                  {name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setScore(Math.max(0, score - 1)); setError(null); }}
                    className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center
                               justify-center text-white/50 hover:text-white transition-all active:scale-[.90]">
                    <Minus size={13} />
                  </button>
                  <span className={`w-10 text-center text-[28px] font-black tabular-nums leading-none ${
                    wins ? "text-emerald-300" : "text-white/80"
                  }`}>{score}</span>
                  <button onClick={() => { setScore(score + 1); setError(null); }}
                    className="w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center
                               justify-center text-white/50 hover:text-white transition-all active:scale-[.90]">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">Быстрый результат</p>
            <div className="grid grid-cols-3 gap-1.5">
              {GROUP_QUICK.map(([a, b]) => {
                const active = s1 === a && s2 === b;
                return (
                  <button key={`${a}:${b}`} onClick={() => pick(a, b)}
                    className={`py-2 rounded-xl text-[13px] font-bold transition-all active:scale-[.95] ${
                      active
                        ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                        : a > b
                        ? "bg-white/[0.06] hover:bg-white/[0.11] text-white/55 hover:text-white"
                        : "bg-white/[0.04] hover:bg-white/[0.09] text-white/40 hover:text-white/70"
                    }`}>
                    {a} : {b}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/20 text-center mt-2">
              Победа {match.player1.name} · Победа {match.player2.name}
            </p>
          </div>

          {error && (
            <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20
                          rounded-xl px-4 py-2.5 text-center">{error}</p>
          )}

          {/* Three action buttons */}
          <div className="flex gap-2">
            {onClear && (
              <button onClick={() => { onClear(); onClose(); }}
                className="flex-1 py-3 rounded-xl font-semibold text-[14px] transition-all
                           bg-white/[0.07] hover:bg-red-500/15 border border-white/[0.09]
                           hover:border-red-500/30 text-white/50 hover:text-red-400 active:scale-[.97]">
                Освободить
              </button>
            )}
            {isFinished && canReset && onReset ? (
              <button onClick={reset} disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-[15px] transition-all active:scale-[.98]
                           disabled:opacity-40 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300">
                {loading ? "..." : "↺ Сбросить счёт"}
              </button>
            ) : (
              <button onClick={save} disabled={loading || s1 === s2 || isFinished}
                className="flex-1 py-3 rounded-xl font-bold text-[15px] transition-all active:scale-[.98]
                           disabled:opacity-35 bg-blue-600 hover:bg-blue-500 text-white
                           shadow-[0_4px_16px_rgba(59,130,246,0.35)]">
                {loading ? "..." : `${s1}:${s2} Сохранить`}
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-[14px] transition-all
                         bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.09]
                         text-white/50 hover:text-white/80 active:scale-[.97]">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Group match row — clickable, opens assignment modal ───────────────────────
interface GroupMatchRowProps {
  match: GroupMatch & { groupId?: number; groupName?: string };
  label: "live" | "pending";
  isAdmin?: boolean;
  freeTables?: TournamentTable[];
  tableNameMap?: Record<number, string>;
  assigning?: boolean;
  onAssign?: (t: number) => void;
  onClear?: () => void;
  onScore?: () => void;
}
function GroupMatchRow({ match, label, isAdmin, freeTables = [], tableNameMap = {}, assigning, onAssign, onClear, onScore }: GroupMatchRowProps) {
  const [showModal, setShowModal] = useState(false);
  const isLive = label === "live";
  const currentTableName = match.table_number ? (tableNameMap[match.table_number] ?? `Стол ${match.table_number}`) : null;
  const canAssign = isAdmin && !isLive && freeTables.length > 0;
  const canClear  = isAdmin && isLive && !!currentTableName;

  // For live matches: skip the intermediate modal, open score directly
  function handleClick() {
    if (!isAdmin) return;
    if (isLive && onScore) { onScore(); return; }
    setShowModal(true);
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`rounded-xl border overflow-hidden transition-all ${
          isAdmin ? "cursor-pointer" : ""
        } ${
          isLive
            ? "border-blue-500/25 bg-blue-500/[0.05] hover:border-blue-500/40"
            : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
        }`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-2.5 py-1.5 ${
          isLive ? "bg-blue-500/[0.08] border-b border-blue-500/15" : "border-b border-white/[0.05]"
        }`}>
          <div className="flex items-center gap-1.5">
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />}
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wide">
              {match.groupName ? `Гр.${match.groupName} · ` : ""}М{match.match_number}
            </span>
          </div>
          {currentTableName
            ? <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">{currentTableName}</span>
            : canAssign && <span className="text-[10px] text-white/20">нажмите для назначения</span>
          }
        </div>

        {/* Players */}
        <div className="px-2.5 py-2">
          <p className="text-[12px] font-semibold text-white/80 truncate">
            {match.player1.name}
            <span className="text-white/20 mx-1.5 font-normal text-[11px]">vs</span>
            {match.player2.name}
          </p>
          {match.score1 !== null && match.score2 !== null && (
            <p className="text-[13px] font-black text-white/60 tabular-nums mt-0.5">
              {match.score1}:{match.score2}
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden"
               style={{ background: "var(--elevated)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div>
                <p className="text-[15px] font-bold text-white">Назначить стол</p>
                <p className="text-[12px] text-white/35 mt-0.5">
                  {match.groupName ? `Группа ${match.groupName} · ` : ""}Матч {match.match_number}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.14]
                           flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            {/* Players */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center
                                  text-[12px] font-bold text-white/50 shrink-0">
                    {match.player1.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-semibold text-white truncate">{match.player1.name}</span>
                </div>
                <span className="text-[11px] font-bold text-white/20 shrink-0">vs</span>
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="text-[14px] font-semibold text-white truncate text-right">{match.player2.name}</span>
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center
                                  text-[12px] font-bold text-white/50 shrink-0">
                    {match.player2.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Table grid or clear button */}
            <div className="px-5 py-4">
              {canClear ? (
                <button
                  onClick={() => { onScore?.(); setShowModal(false); }}
                  className="w-full py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30
                             border border-emerald-500/30 text-emerald-300 hover:text-emerald-200
                             font-semibold text-[14px] transition-all">
                  Ввести счёт и результат
                </button>
              ) : freeTables.length === 0 ? (
                <p className="text-[13px] text-white/30 text-center py-2">Нет свободных столов</p>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30 mb-3">
                    Выберите стол
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {freeTables.map((t) => (
                      <button key={t.id}
                        onClick={() => { onAssign?.(t.number); setShowModal(false); }}
                        disabled={assigning}
                        className="py-3 rounded-xl bg-white/[0.07] hover:bg-blue-600 border border-white/[0.10]
                                   hover:border-blue-500/60 text-[13px] font-bold text-white/60 hover:text-white
                                   transition-all active:scale-[.95] disabled:opacity-40">
                        {t.display_name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Pending bracket match row (right panel) ───────────────────────────────────
function PendingBracketRow({
  match, isAdmin, freeTables, assigning, onAssign,
}: { match: Match; isAdmin: boolean; freeTables: TournamentTable[]; assigning: boolean; onAssign: (t: number) => void }) {
  const [tableInput, setTableInput] = useState("");
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
      <p className="text-[13px] font-semibold truncate">
        <span className="text-white/85">{match.player1?.name ?? "—"}</span>
        <span className="text-white/20 mx-1.5 font-normal">vs</span>
        <span className="text-white/85">{match.player2?.name ?? "—"}</span>
      </p>
      {isAdmin && match.player1 && match.player2 && freeTables.length > 0 && (
        <div className="flex items-center gap-2 mt-2.5">
          <select value={tableInput} onChange={(e) => setTableInput(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="flex-1 text-[11px] px-3 py-2 bg-white/[0.07] border border-white/[0.10]
                       rounded-xl text-white focus:outline-none min-w-0">
            <option value="">Стол</option>
            {freeTables.map((t) => <option key={t.id} value={t.number}>{t.display_name}</option>)}
          </select>
          <button
            onClick={() => { const n = parseInt(tableInput); if (!isNaN(n)) onAssign(n); }}
            disabled={!tableInput || assigning}
            className="text-[11px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500
                       text-white disabled:opacity-40 transition-all shrink-0">
            {assigning ? "…" : "→"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Final standings (places + RTTF rating change) ───────────────────────────────
function StandingsTable({ matches, participants }: { matches: Match[]; participants: Participant[] }) {
  const finished = matches.filter((m) => m.status === "finished" && m.winner);

  // Place: the winner of a no-winner_next match takes place_lo; the loser of a
  // no-loser_next match takes place_hi. That assigns every real player a place.
  const byPlace = new Map<number, User>();
  for (const m of finished) {
    if (m.winner_next_id == null && m.winner && m.place_lo != null) byPlace.set(m.place_lo, m.winner);
    if (m.loser_next_id == null && m.place_hi != null) {
      const loser = m.winner?.id === m.player1?.id ? m.player2 : m.player1;
      if (loser) byPlace.set(m.place_hi, loser);
    }
  }

  // Persisted RTTF rating change (computed server-side when the tournament ended).
  const partByUser = new Map(participants.map((p) => [p.user.id, p]));

  const rows = [...byPlace.entries()].sort((a, b) => a[0] - b[0]).map(([place, u]) => {
    const p = partByUser.get(u.id);
    const before = p?.rating_before ?? u.rating;
    const change = p?.rating_change ?? 0;
    return { place, u, before, change };
  });

  if (rows.length === 0) {
    return <p className="text-[13px] text-white/20 text-center py-10">Турнир ещё не завершён</p>;
  }

  const medal = (p: number) => (p === 1 ? "🥇" : p === 2 ? "🥈" : p === 3 ? "🥉" : null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/40">Итоговые места</h3>
        <span className="text-[11px] text-white/25">Δ рейтинг · RTTF</span>
      </div>
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.05]"
           style={{ background: "var(--card)" }}>
        {rows.map(({ place, u, before, change }) => (
          <div key={place} className={`grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-3 px-4 py-2.5 ${
            place <= 3 ? "bg-amber-400/[0.04]" : ""
          }`}>
            <span className="text-center text-[15px] font-black tabular-nums text-white/55">
              {medal(place) ?? place}
            </span>
            <span className="truncate text-[14px] font-semibold text-white">{u.name}</span>
            <span className="text-right text-[12px] text-white/35 tabular-nums w-16">
              {before} → {before + change}
            </span>
            <span className={`text-right text-[13px] font-bold tabular-nums w-12 ${
              change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400/80" : "text-white/30"
            }`}>
              {change > 0 ? `+${change}` : change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Group Round-Robin Table ────────────────────────────────────────────────────
function GroupRoundRobinTable({ group, colorIdx = 0, isAdmin = false, canEditScores = true, onEditMatch }: {
  group: TournamentGroup; colorIdx?: number; isAdmin?: boolean; canEditScores?: boolean;
  onEditMatch?: (m: GroupMatch) => void;
}) {
  const players = group.participants;
  const color   = GROUP_COLORS[colorIdx % GROUP_COLORS.length];

  // Build matrix + a lookup of the match for a given (rowId, colId) pair.
  type Cell = { s1: number | null; s2: number | null; won: boolean | null };
  const matrix: Record<string, Record<string, Cell>> = {};
  const matchByPair: Record<string, GroupMatch> = {};
  players.forEach((p) => { matrix[p.user.id] = {}; });

  group.matches.forEach((m: GroupMatch) => {
    matrix[m.player1.id] ??= {};
    matrix[m.player2.id] ??= {};
    const won1 = m.winner ? m.winner.id === m.player1.id : null;
    matrix[m.player1.id][m.player2.id] = { s1: m.score1, s2: m.score2, won: won1 };
    matrix[m.player2.id][m.player1.id] = { s1: m.score2, s2: m.score1, won: won1 === null ? null : !won1 };
    matchByPair[`${m.player1.id}|${m.player2.id}`] = m;
    matchByPair[`${m.player2.id}|${m.player1.id}`] = m;
  });

  const HATCH = `repeating-linear-gradient(-45deg,${color.num},${color.num} 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 9px)`;

  return (
    <div className="rounded-2xl overflow-hidden border"
         style={{ background: "var(--card)", borderColor: color.border }}>

      {/* Colored header */}
      <div className={`bg-gradient-to-r ${color.header} px-4 py-2.5 flex items-center justify-between`}>
        <span className="text-[14px] font-black text-white/90 tracking-wide">Группа {group.name}</span>
        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
          <span>О = очки</span><span>М = место</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          {/* Column headers */}
          <thead>
            <tr style={{ background: color.accent }}>
              <th className="text-left px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40 w-5">#</th>
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Участник</th>
              {players.map((_, i) => (
                <th key={i} className="py-2 text-center text-[11px] font-black text-white/60 w-12"
                    style={{ borderLeft: `1px solid ${color.border}` }}>
                  {i + 1}
                </th>
              ))}
              <th className="py-2 text-center text-[12px] font-black text-white w-10"
                  style={{ borderLeft: `1px solid ${color.border}` }}>О</th>
              <th className="py-2 text-center text-[12px] font-black text-white/60 w-10"
                  style={{ borderLeft: `1px solid ${color.border}` }}>М</th>
            </tr>
          </thead>

          <tbody>
            {players.map((p, rowIdx) => (
              <tr key={p.user.id}
                  className="hover:bg-white/[0.02] transition-colors"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Row number */}
                <td className="px-2.5 py-2.5 text-center text-[11px] text-white/30 font-semibold">
                  {rowIdx + 1}
                </td>
                {/* Player + rating */}
                <td className="px-3 py-2.5 max-w-[140px]">
                  <span className="text-[12px] font-semibold text-white/85 truncate block">{p.user.name}</span>
                  <span className="text-[10px] text-red-400/60 font-bold">R:{p.user.rating}</span>
                </td>
                {/* Head-to-head cells */}
                {players.map((opp, colIdx) => {
                  if (rowIdx === colIdx) {
                    return (
                      <td key={opp.user.id}
                          style={{ background: HATCH, borderLeft: `1px solid ${color.border}`, width: 48 }} />
                    );
                  }
                  const cell = matrix[p.user.id]?.[opp.user.id];
                  const scored = cell?.s1 !== null && cell?.s1 !== undefined;
                  const m = matchByPair[`${p.user.id}|${opp.user.id}`];
                  const editable = isAdmin && canEditScores && scored && !!m && !!onEditMatch;
                  return (
                    <td key={opp.user.id}
                        onClick={editable ? () => onEditMatch!(m) : undefined}
                        title={editable ? "Изменить / сбросить счёт" : undefined}
                        className={`text-center py-2.5 text-[12px] font-black tabular-nums ${
                          editable ? "cursor-pointer hover:brightness-150" : ""
                        } ${
                          !scored           ? "text-white/15" :
                          cell.won === true  ? "text-emerald-200" :
                          cell.won === false ? "text-red-300" :
                          "text-white/40"
                        }`}
                        style={{
                          borderLeft: `1px solid rgba(255,255,255,0.05)`,
                          background: scored
                            ? cell.won === true
                              ? "rgba(16,185,129,0.22)"
                              : cell.won === false
                              ? "rgba(239,68,68,0.18)"
                              : undefined
                            : undefined,
                        }}>
                      {scored ? `${cell.s1}:${cell.s2}` : "·"}
                    </td>
                  );
                })}
                {/* Points */}
                <td className="text-center py-2.5 text-[14px] font-black text-white tabular-nums"
                    style={{ borderLeft: `1px solid ${color.border}`, background: color.accent }}>
                  {p.points}
                </td>
                {/* Place */}
                <td className="text-center py-2.5 text-[13px] font-bold text-white/50 tabular-nums"
                    style={{ borderLeft: `1px solid rgba(255,255,255,0.07)` }}>
                  {rowIdx + 1}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Start Playoff Button ───────────────────────────────────────────────────────
function StartPlayoffButton({
  tournamentId, onStarted,
}: { tournamentId: string; onStarted: (matches: Match[], tournament: Tournament) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function start() {
    setLoading(true); setError(null);
    try {
      const r = await api.startPlayoff(tournamentId);
      onStarted(r.matches, r.tournament);
    } catch (err: unknown) {
      setError((err as Record<string, string>)?.detail ?? "Ошибка.");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <button onClick={start} disabled={loading}
        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white
                   font-bold text-[13px] transition-all active:scale-[.97] disabled:opacity-50">
        {loading ? "..." : "🏆 Начать плей-офф"}
      </button>
      {error && <p className="text-[11px] text-red-400 mt-1 text-center">{error}</p>}
    </div>
  );
}

// ── Consolation Bracket View ──────────────────────────────────────────────────
function ConsolationBracketView({
  matches,
  user,
  isAdmin,
  onEnterScore,
}: {
  matches: Match[];
  user: User;
  isAdmin: boolean;
  onEnterScore: (m: Match) => void;
}) {
  const winnersMatches    = matches.filter((m) => !m.is_consolation);
  const consolationMatches = matches.filter((m) => m.is_consolation);

  // Group by round
  const maxRound = matches.length ? Math.max(...matches.map((m) => m.round_number)) : 0;

  // Label a consolation match based on its match_number within consolation matches of that round
  function consolationLabel(match: Match): string {
    const roundConsolation = consolationMatches
      .filter((m) => m.round_number === match.round_number)
      .sort((a, b) => a.match_number - b.match_number);
    const idx = roundConsolation.findIndex((m) => m.id === match.id);
    // idx 0 in last round → 3rd place, idx 1 → 5th, idx 2 → 7th, etc.
    if (match.round_number === maxRound) {
      const place = 3 + idx * 2;
      return `За ${place}-${place + 1} место`;
    }
    return `Утешительный матч`;
  }

  function MatchCard({ match, label }: { match: Match; label?: string }) {
    const isLive     = match.status === "in_progress";
    const isFinished = match.status === "finished";
    const canScore   = isAdmin && isLive;

    return (
      <div
        className={`rounded-xl border px-3 py-2.5 transition-all ${
          isLive
            ? "border-blue-500/30 bg-blue-500/[0.06] cursor-pointer hover:border-blue-500/50"
            : isFinished
            ? "border-white/[0.06] bg-white/[0.02]"
            : "border-white/[0.09] bg-white/[0.03]"
        }`}
        onClick={() => { if (canScore) onEnterScore(match); }}
      >
        {label && (
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400/60 mb-1.5">
            {label}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {/* Player 1 */}
          <span className={`text-[13px] font-semibold flex-1 truncate ${
            isFinished && match.winner?.id === match.player1?.id
              ? "text-emerald-300"
              : match.player1
              ? "text-white/80"
              : "text-white/20 italic"
          }`}>
            {match.player1?.name ?? "???"}
          </span>

          {/* Score / status */}
          <div className="shrink-0 text-center min-w-[48px]">
            {isFinished ? (
              <span className="text-[14px] font-black text-white tabular-nums">
                {match.score1}:{match.score2}
              </span>
            ) : isLive ? (
              <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="text-[11px] text-white/20">vs</span>
            )}
          </div>

          {/* Player 2 */}
          <span className={`text-[13px] font-semibold flex-1 truncate text-right ${
            isFinished && match.winner?.id === match.player2?.id
              ? "text-emerald-300"
              : match.player2
              ? "text-white/80"
              : "text-white/20 italic"
          }`}>
            {match.player2?.name ?? "???"}
          </span>
        </div>
        {match.table_number && (
          <p className="text-[10px] text-blue-300/50 mt-1">Стол {match.table_number}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050c18] px-5 py-6 space-y-8">

      {/* Winners bracket */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-amber-400/70" />
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-amber-400/70">
            Основная сетка
          </h2>
        </div>
        {Array.from({ length: maxRound }, (_, i) => i + 1).map((r) => {
          const rMatches = winnersMatches
            .filter((m) => m.round_number === r)
            .sort((a, b) => a.match_number - b.match_number);
          if (rMatches.length === 0) return null;
          const isLastRound = r === maxRound;
          return (
            <div key={r} className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-white/25 mb-2 ml-1">
                {isLastRound ? "Финал" : `Раунд ${r}`}
              </p>
              <div className="grid gap-2" style={{
                gridTemplateColumns: `repeat(${Math.min(rMatches.length, 4)}, minmax(0, 1fr))`,
              }}>
                {rMatches.map((m) => (
                  <MatchCard key={m.id} match={m}
                    label={isLastRound ? "Финал — 1-2 место" : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Consolation bracket */}
      {consolationMatches.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-purple-400/70" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-purple-400/70">
              Утешительная сетка
            </h2>
          </div>
          {Array.from({ length: maxRound }, (_, i) => i + 1).map((r) => {
            const rMatches = consolationMatches
              .filter((m) => m.round_number === r)
              .sort((a, b) => a.match_number - b.match_number);
            if (rMatches.length === 0) return null;
            return (
              <div key={r} className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-white/25 mb-2 ml-1">
                  Раунд {r}
                </p>
                <div className="grid gap-2" style={{
                  gridTemplateColumns: `repeat(${Math.min(rMatches.length, 4)}, minmax(0, 1fr))`,
                }}>
                  {rMatches.map((m) => (
                    <MatchCard key={m.id} match={m} label={consolationLabel(m)} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

// ── Compact match card — click row to open score/table modal ─────────────────
interface CCardProps {
  match: Match; isAdmin: boolean; assigning: boolean;
  freeTables: TournamentTable[]; tableNameMap: Record<number, string>;
  onAssign: (t: number) => void; onClear: () => void; onScore: () => void;
}
function CompactMatchCard({ match, isAdmin, freeTables, tableNameMap, onAssign, onClear, onScore }: CCardProps) {
  const [showModal, setShowModal] = useState(false);
  const currentName = match.table_number ? (tableNameMap[match.table_number] ?? `Стол ${match.table_number}`) : null;
  const isLive = match.status === "in_progress";

  return (
    <>
      <div
        onClick={() => isAdmin && setShowModal(true)}
        className={`rounded-xl border overflow-hidden transition-all ${
          isAdmin ? "cursor-pointer" : ""
        } border-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_10px_30px_rgba(37,99,235,0.16)]`}
        style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.10), rgba(59,130,246,0.04))" }}>
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/88">
                {match.player1?.name ?? "—"}
              </p>
              {match.score1 !== null && <span className="text-[15px] font-black tabular-nums text-white/85">{match.score1}</span>}
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/72">
                {match.player2?.name ?? "—"}
              </p>
              {match.score2 !== null && <span className="text-[15px] font-black tabular-nums text-white/70">{match.score2}</span>}
            </div>
          </div>
          {isLive && (
            <span className="shrink-0 text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
              {currentName ?? "live"}
            </span>
          )}
        </div>
      </div>

      {showModal && isAdmin && (
        <BracketMatchModal
          match={match}
          freeTables={freeTables}
          tableNameMap={tableNameMap}
          onClose={() => setShowModal(false)}
          onScore={() => { onScore(); setShowModal(false); }}
          onAssign={onAssign}
          onClear={onClear}
        />
      )}
    </>
  );
}

// ── Bracket match modal (assign table or enter score) ─────────────────────────
function BracketMatchModal({
  match, freeTables, tableNameMap, onClose, onScore, onAssign, onClear,
}: {
  match: Match; freeTables: TournamentTable[]; tableNameMap: Record<number, string>;
  onClose: () => void; onScore: () => void;
  onAssign: (t: number) => void; onClear: () => void;
}) {
  const currentName = match.table_number ? (tableNameMap[match.table_number] ?? `Стол ${match.table_number}`) : null;
  const isLive = match.status === "in_progress";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden"
           style={{ background: "var(--elevated)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <p className="text-[15px] font-bold text-white">
              {isLive ? "Счёт матча" : "Назначить стол"}
            </p>
            <p className="text-[12px] text-white/35 mt-0.5">
              Раунд {match.round_number} · Матч {match.match_number}
              {currentName ? ` · ${currentName}` : ""}
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.14]
                       flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[12px] font-bold text-white/50 shrink-0">
                {(match.player1?.name ?? "?").charAt(0).toUpperCase()}
              </div>
              <span className="text-[14px] font-semibold text-white truncate">{match.player1?.name ?? "TBD"}</span>
            </div>
            <span className="text-[11px] font-bold text-white/20 shrink-0">vs</span>
            <div className="flex-1 flex items-center gap-2 justify-end">
              <span className="text-[14px] font-semibold text-white truncate text-right">{match.player2?.name ?? "TBD"}</span>
              <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[12px] font-bold text-white/50 shrink-0">
                {(match.player2?.name ?? "?").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {isLive ? (
            <div className="space-y-2.5">
              <button onClick={onScore}
                className="w-full py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30
                           border border-emerald-500/30 text-emerald-300 font-semibold text-[14px] transition-all">
                Ввести счёт
              </button>
              {currentName && (
                <button onClick={() => { onClear(); onClose(); }}
                  className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10]
                             border border-white/[0.09] text-white/45 hover:text-white/70
                             font-medium text-[13px] transition-all">
                  Освободить {currentName}
                </button>
              )}
            </div>
          ) : freeTables.length === 0 ? (
            <p className="text-[13px] text-white/30 text-center py-2">Нет свободных столов</p>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30 mb-3">Выберите стол</p>
              <div className="grid grid-cols-4 gap-2">
                {freeTables.map((t) => (
                  <button key={t.id}
                    onClick={() => { onAssign(t.number); onClose(); }}
                    className="py-3 rounded-xl bg-white/[0.07] hover:bg-blue-600 border border-white/[0.10]
                               hover:border-blue-500/60 text-[13px] font-bold text-white/60 hover:text-white
                               transition-all active:scale-[.95]">
                    {t.display_name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactPendingRow({
  match, isAdmin, freeTables, assigning, onAssign,
}: { match: Match; isAdmin: boolean; freeTables: TournamentTable[]; assigning: boolean; onAssign: (t: number) => void }) {
  const [tableInput, setTableInput] = useState("");
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex-1 min-w-0 text-[11px] text-white/50 truncate">
        {match.player1?.name} <span className="text-white/20">vs</span> {match.player2?.name}
      </div>
      {isAdmin && freeTables.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <select value={tableInput} onChange={(e) => setTableInput(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="text-[11px] px-1.5 py-1 bg-white/[0.07] border border-white/[0.08]
                       rounded-lg text-white focus:outline-none w-16">
            <option value="">—</option>
            {freeTables.map((t) => <option key={t.id} value={t.number}>{t.display_name}</option>)}
          </select>
          <button onClick={() => { const n = parseInt(tableInput); if (!isNaN(n)) onAssign(n); }}
            disabled={!tableInput || assigning}
            className="text-[11px] px-1.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14]
                       text-white/60 disabled:opacity-40 transition-all">
            {assigning ? "…" : "→"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tables Tab ────────────────────────────────────────────────────────────────

const TINPUT = "px-3 py-2 bg-white/[0.08] border border-white/[0.12] rounded-xl text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 transition-all [color-scheme:dark]";

function TablesTab({
  tournamentId,
  tables,
  onTablesChange,
}: {
  tournamentId: string;
  tables: TournamentTable[];
  onTablesChange: (t: TournamentTable[]) => void;
}) {
  const [addName,  setAddName]  = useState("");
  const [adding,   setAdding]   = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Per-row edit state
  const [editId,   setEditId]   = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving,   setSaving]   = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const nextNumber = Math.max(0, ...tables.map((t) => t.number)) + 1;
    setAdding(true); setAddError(null);
    try {
      const created = await api.createTournamentTable(tournamentId, { number: nextNumber, name: addName.trim() || undefined });
      onTablesChange([...tables, created].sort((a, b) => a.number - b.number));
      setAddName("");
    } catch (err: unknown) {
      setAddError((err as Record<string, string>)?.detail ?? "Ошибка.");
    } finally { setAdding(false); }
  }

  async function handleSaveName(table: TournamentTable) {
    setSaving(table.id);
    try {
      const updated = await api.updateTournamentTable(tournamentId, table.id, { name: editName.trim() });
      onTablesChange(tables.map((t) => t.id === updated.id ? updated : t));
      setEditId(null);
    } catch { /* silent */ }
    finally { setSaving(null); }
  }

  async function handleToggle(table: TournamentTable) {
    setSaving(table.id);
    try {
      const updated = await api.updateTournamentTable(tournamentId, table.id, { is_active: !table.is_active });
      onTablesChange(tables.map((t) => t.id === updated.id ? updated : t));
    } catch { /* silent */ }
    finally { setSaving(null); }
  }

  async function handleDelete(table: TournamentTable) {
    setDeleting(table.id);
    try {
      await api.deleteTournamentTable(tournamentId, table.id);
      onTablesChange(tables.filter((t) => t.id !== table.id));
    } catch { /* silent */ }
    finally { setDeleting(null); }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.07] shrink-0 bg-[#070f1d]/60">
        <h2 className="text-[17px] font-bold text-white">Столы</h2>
        <p className="text-[12px] text-white/30 mt-0.5">
          {tables.length} столов · {tables.filter((t) => t.is_active).length} активных
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-5 space-y-6">

          {/* ── Add form ── */}
          <form onSubmit={handleAdd}
                className="flex items-center gap-2 rounded-2xl border border-white/[0.09] px-4 py-3"
                style={{ background: "var(--card)" }}>
            <input
              type="text" value={addName} autoFocus
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Название стола (необязательно)"
              className={TINPUT + " flex-1"}
            />
            <button type="submit" disabled={adding}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[.97]
                         disabled:opacity-40 text-white font-semibold text-[13px] transition-all
                         whitespace-nowrap h-[42px] flex items-center gap-1.5">
              <Plus size={14} />{adding ? "..." : "Добавить"}
            </button>
          </form>
          {addError && (
            <p className="text-[12px] text-red-400 px-1">{addError}</p>
          )}

          {/* ── Table list ── */}
          {tables.length === 0 ? (
            <div className="py-16 text-center">
              <LayoutGrid size={36} className="mx-auto text-white/[0.07] mb-3" />
              <p className="text-[15px] text-white/20">Нет столов</p>
              <p className="text-[13px] text-white/12 mt-1">Добавьте столы выше</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
                 style={{ background: "var(--card)" }}>
              {tables.map((table, idx) => (
                <div key={table.id}>
                  <div className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                    !table.is_active ? "opacity-45" : "hover:bg-white/[0.02]"
                  }`}>
                    {/* Number badge */}
                    <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center
                                    text-[14px] font-black text-white/50 shrink-0">
                      {table.number}
                    </div>

                    {/* Name — inline edit */}
                    {editId === table.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName(table);
                          if (e.key === "Escape") setEditId(null);
                        }}
                        className={TINPUT + " flex-1 h-8 py-1.5"}
                        placeholder="Название стола"
                      />
                    ) : (
                      <button
                        onClick={() => { setEditId(table.id); setEditName(table.name); }}
                        className="flex-1 text-left group"
                      >
                        <p className="text-[14px] font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                          {table.display_name}
                        </p>
                        {table.name && (
                          <p className="text-[11px] text-white/25">Стол {table.number}</p>
                        )}
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {editId === table.id ? (
                        <>
                          <button onClick={() => handleSaveName(table)} disabled={saving === table.id}
                            className="w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30
                                       flex items-center justify-center text-emerald-400 transition-all
                                       disabled:opacity-40">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12]
                                       flex items-center justify-center text-white/40 transition-all">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Active toggle */}
                          <button
                            onClick={() => handleToggle(table)}
                            disabled={saving === table.id}
                            title={table.is_active ? "Деактивировать" : "Активировать"}
                            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.10]
                                       flex items-center justify-center transition-all disabled:opacity-40"
                          >
                            {table.is_active
                              ? <ToggleRight size={16} className="text-emerald-400" />
                              : <ToggleLeft size={16} className="text-white/30" />
                            }
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(table)}
                            disabled={deleting === table.id}
                            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-red-500/15
                                       flex items-center justify-center text-white/20 hover:text-red-400
                                       transition-all disabled:opacity-40">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {idx < tables.length - 1 && <div className="h-px bg-white/[0.04] ml-[72px]" />}
                </div>
              ))}
            </div>
          )}

          {/* Info note */}
          <p className="text-[12px] text-white/20 text-center">
            Неактивные столы не участвуют в авто-назначении матчей
          </p>
        </div>
      </div>
    </div>
  );
}
