import { Club, ClubAdmin, ClubTable, GroupMatch, Match, Participant, Tournament, TournamentGroup, TournamentTable, User } from "./types";

// Empty base → same-origin requests (/api/...). next.config rewrites proxy these
// to the real backend, so the auth cookies are first-party to the frontend domain.
const BASE = "";

export type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  labels?: Record<string, string>;
  preview_url?: string | null;
  verified_languages?: Array<Record<string, string>>;
};

const NETWORK_ERROR = { detail: "Сервер недоступен. Проверьте подключение и попробуйте позже." };

export type ActiveMatch = {
  kind: "bracket" | "group";
  tournament_id: string;
  tournament_name: string;
  match_id: number;
  group_id?: number;
  table_number: number | null;
  opponent_name: string | null;
};

// Snapshot returned by GET /api/tournaments/<id>/state/. `changed` is false
// (and the data fields omitted) when the caller's `rev` is already current.
export type TournamentState = {
  rev: string;
  changed: boolean;
  tournament?: Tournament;
  participants?: Participant[];
  matches?: Match[];
  groups?: TournamentGroup[];
};

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  tournament: string | null;
  match_kind: string;
  match_id: number | null;
  table_number: number | null;
  is_read: boolean;
  created_at: string;
};

function buildHeaders(options: RequestInit): HeadersInit {
  // Don't set Content-Type for FormData — the browser sets it with the boundary.
  if (options.body instanceof FormData) return { ...options.headers };
  return { "Content-Type": "application/json", ...options.headers };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: buildHeaders(options),
    });
  } catch {
    throw NETWORK_ERROR;
  }

  // Try token refresh once on 401
  if (res.status === 401) {
    const refreshed = await fetch(`${BASE}/api/auth/token/refresh/`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      const retry = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: buildHeaders(options),
      });
      if (!retry.ok) throw await retry.json();
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
    const err = await res.json().catch(() => ({ detail: "Не авторизован" }));
    throw err;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function apiBlobFetch(path: string, options: RequestInit = {}): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw NETWORK_ERROR;
  }

  if (res.status === 401) {
    const refreshed = await fetch(`${BASE}/api/auth/token/refresh/`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      const retry = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
      });
      if (!retry.ok) throw await retry.json().catch(() => ({ detail: "Ошибка сервера" }));
      return retry.blob();
    }
    const err = await res.json().catch(() => ({ detail: "Не авторизован" }));
    throw err;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
    throw err;
  }
  return res.blob();
}

export const api = {
  // ─── Auth ──────────────────────────────────────────────────────────────────

  login: (phone: string, password: string) =>
    apiFetch<User>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),

  register: (data: { phone: string; name: string; password: string; confirm_password: string }) =>
    apiFetch<User>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => apiFetch<void>("/api/auth/logout/", { method: "POST" }),

  me: () => apiFetch<User>("/api/auth/me/"),

  checkPhone: (phone: string) =>
    apiFetch<{ exists: boolean }>("/api/auth/check-phone/", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  searchUsers: (q: string) =>
    apiFetch<User[]>(`/api/auth/users/?q=${encodeURIComponent(q)}`),

  // ─── Clubs ─────────────────────────────────────────────────────────────────

  getClubs: () => apiFetch<Club[]>("/api/clubs/"),

  getMyClubs: () => apiFetch<Club[]>("/api/clubs/my/"),

  getClub: (id: string) => apiFetch<Club>(`/api/clubs/${id}/`),

  createClub: (data: { name: string; description?: string }) =>
    apiFetch<Club>("/api/clubs/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateClub: (id: string, data: { name?: string; description?: string }) =>
    apiFetch<Club>(`/api/clubs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteClub: (id: string) =>
    apiFetch<void>(`/api/clubs/${id}/`, { method: "DELETE" }),

  // ─── Club Tables ───────────────────────────────────────────────────────────

  getClubTables: (clubId: string) =>
    apiFetch<ClubTable[]>(`/api/clubs/${clubId}/tables/`),

  createClubTable: (clubId: string, data: { number: number; name?: string }) =>
    apiFetch<ClubTable>(`/api/clubs/${clubId}/tables/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateClubTable: (clubId: string, tableId: number, data: { name?: string; is_active?: boolean }) =>
    apiFetch<ClubTable>(`/api/clubs/${clubId}/tables/${tableId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteClubTable: (clubId: string, tableId: number) =>
    apiFetch<void>(`/api/clubs/${clubId}/tables/${tableId}/`, { method: "DELETE" }),

  // ─── Club Admins ───────────────────────────────────────────────────────────

  getClubAdmins: (clubId: string) =>
    apiFetch<ClubAdmin[]>(`/api/clubs/${clubId}/admins/`),

  addClubAdmin: (clubId: string, phone: string) =>
    apiFetch<ClubAdmin>(`/api/clubs/${clubId}/admins/`, {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  removeClubAdmin: (clubId: string, adminId: number) =>
    apiFetch<void>(`/api/clubs/${clubId}/admins/${adminId}/`, { method: "DELETE" }),

  uploadClubPhoto: (clubId: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return apiFetch<import("./types").Club>(`/api/clubs/${clubId}/photo/`, { method: "POST", body: form });
  },

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiFetch<import("./types").User>(`/api/auth/me/avatar/`, { method: "POST", body: form });
  },

  deleteAvatar: () =>
    apiFetch<import("./types").User>(`/api/auth/me/avatar/`, { method: "DELETE" }),

  // ─── Tournaments ───────────────────────────────────────────────────────────

  getTournaments: (clubId?: string) =>
    apiFetch<Tournament[]>(clubId ? `/api/tournaments/?club_id=${clubId}` : "/api/tournaments/"),

  getMyTournaments: () => apiFetch<Tournament[]>("/api/tournaments/my/"),

  createTournament: (data: { name: string; description?: string; starts_at?: string; club_id?: string; format?: string; group_size?: number }) =>
    apiFetch<Tournament>("/api/tournaments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTournament: (id: string, data: { name?: string; description?: string; starts_at?: string | null }) =>
    apiFetch<Tournament>(`/api/tournaments/${id}/update/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTournament: (id: string) =>
    apiFetch<void>(`/api/tournaments/${id}/update/`, { method: "DELETE" }),

  getTournament: (id: string) => apiFetch<Tournament>(`/api/tournaments/${id}/`),

  getTtsVoices: (id: string) =>
    apiFetch<{ voices: ElevenLabsVoice[]; default_voice_id: string; model_id: string }>(
      `/api/tournaments/${id}/tts/voices/`
    ),

  tableCallAudio: (
    id: string,
    data: { player1: string; player2: string; table_number: number; voice_id?: string }
  ) =>
    apiBlobFetch(`/api/tournaments/${id}/tts/table-call/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTournamentByToken: (token: string) =>
    apiFetch<Tournament>(`/api/tournaments/join/${token}/`),

  getParticipants: (id: string) =>
    apiFetch<Participant[]>(`/api/tournaments/${id}/participants/`),

  addParticipant: (tournamentId: string, phone: string, name?: string, rating?: number) =>
    apiFetch<Participant>(`/api/tournaments/${tournamentId}/participants/add/`, {
      method: "POST",
      body: JSON.stringify({ phone, name, rating }),
    }),

  removeParticipant: (tournamentId: string, participantId: number) =>
    apiFetch<void>(`/api/tournaments/${tournamentId}/participants/${participantId}/remove/`, {
      method: "DELETE",
    }),

  joinTournamentSelf: (tournamentId: string) =>
    apiFetch<Participant>(`/api/tournaments/${tournamentId}/participants/join/`, {
      method: "POST",
    }),

  // Consolidated live snapshot used by useTournamentLive polling. Pass the last
  // seen `rev`; the server returns `{changed:false}` when nothing changed, so
  // the frequent poll stays cheap.
  getTournamentState: (tournamentId: string, rev?: string) =>
    apiFetch<TournamentState>(
      `/api/tournaments/${tournamentId}/state/${rev ? `?rev=${encodeURIComponent(rev)}` : ""}`
    ),

  // ─── Join flows ────────────────────────────────────────────────────────────

  joinByToken: (token: string) =>
    apiFetch<Participant>(`/api/tournaments/join/${token}/`, { method: "POST" }),

  registerAndJoin: (
    token: string,
    data: { phone: string; name: string; password: string; confirm_password: string }
  ) =>
    apiFetch<{ user: User; participant: Participant }>(
      `/api/tournaments/join/${token}/register/`,
      { method: "POST", body: JSON.stringify(data) }
    ),

  // ─── Tournament Tables ─────────────────────────────────────────────────────

  getTournamentTables: (tournamentId: string) =>
    apiFetch<TournamentTable[]>(`/api/tournaments/${tournamentId}/tables/`),

  createTournamentTable: (tournamentId: string, data: { number: number; name?: string }) =>
    apiFetch<TournamentTable>(`/api/tournaments/${tournamentId}/tables/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTournamentTable: (tournamentId: string, tableId: number, data: { name?: string; is_active?: boolean }) =>
    apiFetch<TournamentTable>(`/api/tournaments/${tournamentId}/tables/${tableId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTournamentTable: (tournamentId: string, tableId: number) =>
    apiFetch<void>(`/api/tournaments/${tournamentId}/tables/${tableId}/`, { method: "DELETE" }),

  // ─── Bracket ───────────────────────────────────────────────────────────────

  startTournament: (id: string) =>
    apiFetch<{ tournament: Tournament; matches?: Match[]; groups?: TournamentGroup[] }>(
      `/api/tournaments/${id}/start/`,
      { method: "POST" }
    ),

  getGroups: (tournamentId: string) =>
    apiFetch<TournamentGroup[]>(`/api/tournaments/${tournamentId}/groups/`),

  submitGroupScore: (tournamentId: string, groupId: number, matchId: number, score1: number, score2: number) =>
    apiFetch<GroupMatch>(`/api/tournaments/${tournamentId}/groups/${groupId}/matches/${matchId}/score/`, {
      method: "POST",
      body: JSON.stringify({ score1, score2 }),
    }),

  resetGroupMatch: (tournamentId: string, groupId: number, matchId: number) =>
    apiFetch<GroupMatch>(`/api/tournaments/${tournamentId}/groups/${groupId}/matches/${matchId}/reset/`, {
      method: "POST",
    }),

  assignGroupMatchTable: (tournamentId: string, groupId: number, matchId: number, tableNumber: number | null) =>
    apiFetch<GroupMatch>(`/api/tournaments/${tournamentId}/groups/${groupId}/matches/${matchId}/table/`, {
      method: "PATCH",
      body: JSON.stringify({ table_number: tableNumber }),
    }),

  startPlayoff: (tournamentId: string) =>
    apiFetch<{ tournament: Tournament; matches: Match[] }>(`/api/tournaments/${tournamentId}/playoff/`, {
      method: "POST",
    }),

  getMatches: (id: string) =>
    apiFetch<Match[]>(`/api/tournaments/${id}/matches/`),

  submitScore: (tournamentId: string, matchId: number, score1: number, score2: number) =>
    apiFetch<Match>(`/api/tournaments/${tournamentId}/matches/${matchId}/score/`, {
      method: "POST",
      body: JSON.stringify({ score1, score2 }),
    }),

  resetMatch: (tournamentId: string, matchId: number) =>
    apiFetch<Match>(`/api/tournaments/${tournamentId}/matches/${matchId}/reset/`, {
      method: "POST",
    }),

  assignTable: (tournamentId: string, matchId: number, tableNumber: number | null) =>
    apiFetch<Match>(`/api/tournaments/${tournamentId}/matches/${matchId}/table/`, {
      method: "PATCH",
      body: JSON.stringify({ table_number: tableNumber }),
    }),

  // ─── Active match + notifications ────────────────────────────────────────────

  getMyActiveMatch: () =>
    apiFetch<{ active_match: ActiveMatch | null }>("/api/tournaments/my/active-match/"),

  getNotifications: (unreadOnly = false) =>
    apiFetch<{ notifications: AppNotification[]; unread_count: number }>(
      `/api/notifications/${unreadOnly ? "?unread=1" : ""}`
    ),

  markNotificationsRead: (ids?: number[]) =>
    apiFetch<{ marked: number }>("/api/notifications/read/", {
      method: "POST",
      body: JSON.stringify(ids ? { ids } : { all: true }),
    }),

  getVapidPublicKey: () =>
    apiFetch<{ public_key: string }>("/api/notifications/vapid-public-key/"),

  subscribePush: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    apiFetch<{ detail: string }>("/api/notifications/subscribe/", {
      method: "POST",
      body: JSON.stringify(sub),
    }),

  unsubscribePush: (endpoint: string) =>
    apiFetch<{ detail: string }>("/api/notifications/unsubscribe/", {
      method: "POST",
      body: JSON.stringify({ endpoint }),
    }),
};
