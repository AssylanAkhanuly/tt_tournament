/* Евразийская лига — транспорт и модель ✳ (19.11.2026, LEAGUE.md).
   Единственное место, где фронт ходит в `/api/league/`. */

import { useCallback, useEffect, useState } from 'react';

export type LeagueGender = 'm' | 'f';
export const GENDER_LABEL: Record<LeagueGender, string> = { m: 'Мужчины', f: 'Женщины' };

export type LeagueRules = {
  order: string;
  players: number;
  winsNeeded: number;
  gamesToWin: number;
  pointsWin: number;
  pointsLoss: number;
  pointsNoShow: number;
  promote: number;
  relegate: number;
  squadMax: number;
};

export type Division = { id: string; season: number; gender: LeagueGender; name: string; level: number; teamsCount?: number };

export type LeagueTeam = { id: string; name: string; clubId: string; clubName: string; membersCount: number };

export type StandingRow = {
  place: number;
  teamId: string;
  team: string;
  played: number;
  won: number;
  lost: number;
  noShows: number;
  points: number;
  rubbersFor: number;
  rubbersAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
};

export type TourSummary = { id: string; number: number; city: string; startsOn: string | null; matches: number; finished: number };

export type DivisionDetail = Division & { teams: LeagueTeam[]; tours: TourSummary[]; table: StandingRow[] };

export type LeaguePerson = { id: string; name: string; region: string; rating: string | null };

export type TeamDetail = LeagueTeam & { division: Division; members: LeaguePerson[] };

export type TeamMatch = {
  id: number;
  tourId: string;
  status: 'pending' | 'finished';
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  rubbersA: number;
  rubbersB: number;
  winner: '' | 'a' | 'b';
  noShow: '' | 'a' | 'b';
  rubbers: [number, number][];
  lineupA: string[];
  lineupB: string[];
};

export type TeamMatchDetail = TeamMatch & {
  squadA: LeaguePerson[];
  squadB: LeaguePerson[];
  /** Пары индексов расстановки: [0, 0] — A против X (порядок из правил). */
  order: [number, number][];
  rules: LeagueRules;
};

export type TourDetail = { id: string; number: number; city: string; startsOn: string | null; division: Division; matches: TeamMatch[] };

// ── Разбор ответа ───────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

const division = (d: Raw): Division => ({
  id: String(d.id),
  season: Number(d.season),
  gender: d.gender as LeagueGender,
  name: String(d.name),
  level: Number(d.level),
  teamsCount: typeof d.teams === 'number' ? (d.teams as number) : undefined,
});

const team = (t: Raw): LeagueTeam => ({
  id: String(t.id),
  name: String(t.name),
  clubId: String(t.club_id),
  clubName: String(t.club_name),
  membersCount: Number(t.members_count ?? 0),
});

const person = (p: Raw): LeaguePerson => ({
  id: String(p.id),
  name: String(p.name),
  region: String(p.region ?? ''),
  rating: (p.rating as string | null) ?? null,
});

const rules = (r: Raw): LeagueRules => ({
  order: String(r.order),
  players: Number(r.players),
  winsNeeded: Number(r.wins_needed),
  gamesToWin: Number(r.games_to_win),
  pointsWin: Number(r.points_win),
  pointsLoss: Number(r.points_loss),
  pointsNoShow: Number(r.points_no_show),
  promote: Number(r.promote),
  relegate: Number(r.relegate),
  squadMax: Number(r.squad_max),
});

const match = (m: Raw): TeamMatch => ({
  id: Number(m.id),
  tourId: String(m.tour_id),
  status: m.status as TeamMatch['status'],
  teamA: m.team_a as TeamMatch['teamA'],
  teamB: m.team_b as TeamMatch['teamB'],
  rubbersA: Number(m.rubbers_a),
  rubbersB: Number(m.rubbers_b),
  winner: (m.winner as TeamMatch['winner']) ?? '',
  noShow: (m.no_show as TeamMatch['noShow']) ?? '',
  rubbers: (m.rubbers as [number, number][]) ?? [],
  lineupA: ((m.lineup_a as string[]) ?? []).map(String),
  lineupB: ((m.lineup_b as string[]) ?? []).map(String),
});

// ── Запросы ─────────────────────────────────────────────────────────────────

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as Raw;
  if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Ошибка (' + res.status + ')');
  return body as T;
}

const post = <T>(url: string, data: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(data) });

export const fetchRules = async () => rules(await request<Raw>('/api/league/rules/'));
export const updateRules = async (patch: Partial<Record<string, number | string>>) =>
  rules(await request<Raw>('/api/league/rules/', { method: 'PATCH', body: JSON.stringify(patch) }));

export const fetchDivisions = async (season: number) =>
  (await request<Raw[]>(`/api/league/divisions/?season=${season}`)).map(division);

export const createDivision = async (d: { season: number; gender: LeagueGender; name: string; level: number }) =>
  division(await post<Raw>('/api/league/divisions/', d));

export async function fetchDivision(id: string): Promise<DivisionDetail> {
  const d = await request<Raw>(`/api/league/divisions/${id}/`);
  return {
    ...division(d),
    teams: (d.teams as Raw[]).map(team),
    tours: (d.tours as Raw[]).map((t) => ({
      id: String(t.id),
      number: Number(t.number),
      city: String(t.city ?? ''),
      startsOn: (t.starts_on as string | null) ?? null,
      matches: Number(t.matches),
      finished: Number(t.finished),
    })),
    table: (d.table as Raw[]).map((r) => ({
      place: Number(r.place),
      teamId: String(r.team_id),
      team: String(r.team),
      played: Number(r.played),
      won: Number(r.won),
      lost: Number(r.lost),
      noShows: Number(r.no_shows),
      points: Number(r.points),
      rubbersFor: Number(r.rubbers_for),
      rubbersAgainst: Number(r.rubbers_against),
      gamesFor: Number(r.games_for),
      gamesAgainst: Number(r.games_against),
    })),
  };
}

export const registerTeam = async (divisionId: string, clubId: string, name: string) =>
  team(await post<Raw>(`/api/league/divisions/${divisionId}/teams/`, { club_id: clubId, name }));

export const createTour = (divisionId: string, t: { number: number; city: string; startsOn: string | null }) =>
  post<Raw>(`/api/league/divisions/${divisionId}/tours/`, { number: t.number, city: t.city, starts_on: t.startsOn });

export async function fetchTeam(id: string): Promise<TeamDetail> {
  const t = await request<Raw>(`/api/league/teams/${id}/`);
  return { ...team(t), division: division(t.division as Raw), members: (t.members as Raw[]).map(person) };
}

export const addMember = (teamId: string, userId: string) => post(`/api/league/teams/${teamId}/members/`, { user_id: userId });
export const removeMember = (teamId: string, userId: string) =>
  request(`/api/league/teams/${teamId}/members/${userId}/`, { method: 'DELETE' });
export const fetchCandidates = async (teamId: string, q: string) =>
  (await request<Raw[]>(`/api/league/teams/${teamId}/candidates/?q=${encodeURIComponent(q)}`)).map(person);

export async function fetchTour(id: string): Promise<TourDetail> {
  const t = await request<Raw>(`/api/league/tours/${id}/`);
  return {
    id: String(t.id),
    number: Number(t.number),
    city: String(t.city ?? ''),
    startsOn: (t.starts_on as string | null) ?? null,
    division: division(t.division as Raw),
    matches: (t.matches as Raw[]).map(match),
  };
}

export async function fetchTeamMatch(id: number): Promise<TeamMatchDetail> {
  const m = await request<Raw>(`/api/league/team-matches/${id}/`);
  return {
    ...match(m),
    squadA: (m.squad_a as Raw[]).map(person),
    squadB: (m.squad_b as Raw[]).map(person),
    order: m.order as [number, number][],
    rules: rules(m.rules as Raw),
  };
}

export const saveResult = async (id: number, lineupA: string[], lineupB: string[], rubbers: [number, number][]) =>
  match(await post<Raw>(`/api/league/team-matches/${id}/result/`, { lineup_a: lineupA, lineup_b: lineupB, rubbers }));

export const saveNoShow = async (id: number, absent: 'a' | 'b') =>
  match(await post<Raw>(`/api/league/team-matches/${id}/no-show/`, { absent }));

export type Club = { id: string; name: string };
export const fetchClubs = async () => (await request<Raw[]>('/api/clubs/')).map((c) => ({ id: String(c.id), name: String(c.name) }));

// ── Хук запроса ─────────────────────────────────────────────────────────────

/** Запрос с состоянием «грузится / данные / ошибка» и перечитыванием. */
export function useLoad<T>(run: () => Promise<T>, key: string) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let live = true;
    run()
      .then((data) => live && setState({ data, error: null }))
      .catch((e: Error) => live && setState({ data: null, error: e.message }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);
  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) };
}

/** Новый клуб (`POST /api/clubs/`, только `is_staff` — администратор федерации). */
export const createClub = async (name: string) => {
  const c = await post<Raw>('/api/clubs/', { name });
  return { id: String(c.id), name: String(c.name) } as Club;
};
