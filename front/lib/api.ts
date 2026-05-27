import { Match, Participant, Tournament, User } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const NETWORK_ERROR = { detail: "Сервер недоступен. Проверьте подключение и попробуйте позже." };

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    // fetch() itself throws (ERR_CONNECTION_REFUSED, offline, CORS preflight blocked, etc.)
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
        headers: { "Content-Type": "application/json", ...options.headers },
      });
      if (!retry.ok) throw await retry.json();
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
    // Refresh also failed — throw so callers can redirect to /login
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

// ─── Auth ────────────────────────────────────────────────────────────────────

export const api = {
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

  logout: () =>
    apiFetch<void>("/api/auth/logout/", { method: "POST" }),

  me: () => apiFetch<User>("/api/auth/me/"),

  checkPhone: (phone: string) =>
    apiFetch<{ exists: boolean }>("/api/auth/check-phone/", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  // ─── Tournaments ───────────────────────────────────────────────────────────

  getTournaments: () => apiFetch<Tournament[]>("/api/tournaments/"),

  getMyTournaments: () => apiFetch<Tournament[]>("/api/tournaments/my/"),

  createTournament: (data: { name: string; description?: string; starts_at?: string }) =>
    apiFetch<Tournament>("/api/tournaments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTournament: (id: string) => apiFetch<Tournament>(`/api/tournaments/${id}/`),

  getTournamentByToken: (token: string) =>
    apiFetch<Tournament>(`/api/tournaments/join/${token}/`),

  getParticipants: (id: string) =>
    apiFetch<Participant[]>(`/api/tournaments/${id}/participants/`),

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

  // ─── Bracket ───────────────────────────────────────────────────────────────

  startTournament: (id: string) =>
    apiFetch<{ tournament: Tournament; matches: Match[] }>(
      `/api/tournaments/${id}/start/`,
      { method: "POST" }
    ),

  getMatches: (id: string) =>
    apiFetch<Match[]>(`/api/tournaments/${id}/matches/`),

  submitScore: (tournamentId: string, matchId: number, score1: number, score2: number) =>
    apiFetch<Match>(`/api/tournaments/${tournamentId}/matches/${matchId}/score/`, {
      method: "POST",
      body: JSON.stringify({ score1, score2 }),
    }),
};
