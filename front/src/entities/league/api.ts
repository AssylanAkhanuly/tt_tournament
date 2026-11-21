/* Евразийская лига — транспорт и модель ✳ (19.11.2026, LEAGUE.md).
   Единственное место, где фронт ходит в `/api/league/`. */

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

export type Division = {
  id: string;
  /** Год сезона, его id и название; завершён ли сезон — правка закрыта. */
  season: number;
  seasonId: string;
  seasonName: string;
  seasonClosed: boolean;
  gender: LeagueGender;
  name: string;
  level: number;
};

/** Сводка для календаря соревнований ✳ (19.11.2026: Лига стоит в «Месяце» и
 *  «Таблице» рядом с турнирами). Дата — первый тур, окончание — последний (без
 *  туров — null), города — по порядку туров, ход — сыграно встреч из всех.
 *  Считает сервер. */
export type CalendarSummary = {
  toursCount: number;
  startsOn: string | null;
  endsOn: string | null;
  cities: string[];
  matches: number;
  finished: number;
};

/** Строка списка лиг (дивизионов). */
/** Состояние тура для обзора сезона — решает сервер (`tour_state`, LEAGUE.md «Обзор сезона»). */
export type TourState = 'done' | 'live' | 'ready' | 'draft' | 'planned' | 'issue';
export type SeasonTour = { id: string; number: number; city: string; startsOn: string | null; state: TourState; problem: string };
/** `tours` — только в ответе сезона (`tour_list`). */
export type DivisionListItem = Division & CalendarSummary & { teamsCount: number; tours?: SeasonTour[] };

/** Окно регистрации команд: переключатель, срок «до» (`ГГГГ-ММ-ДД`, включительно)
 *  и идёт ли она сегодня — это решает сервер. */
export type SeasonRegistration = { open: boolean; until: string | null; active: boolean };

/** Сезон ✳ (19.11.2026, LEAGUE.md «Сезон») — верхний уровень Лиги. */
export type Season = CalendarSummary & {
  id: string;
  year: number;
  name: string;
  closed: boolean;
  registration: SeasonRegistration;
  leagues: number;
  /** Принятых команд. */
  teamsCount: number;
  /** Заявок клубов ждёт решения. */
  pending: number;
};

/** Команда сезона — строка раздела «Команды» страницы сезона. */
export type SeasonTeam = {
  id: string;
  name: string;
  clubName: string;
  divisionId: string;
  divisionName: string;
  gender: LeagueGender;
  members: number;
  status: TeamStatus;
  decisionComment: string;
  /** Кто подал заявку. */
  submittedBy: string;
};

export type SeasonDetail = Season & { divisions: DivisionListItem[]; teams: SeasonTeam[] };

/** «Регистрация до 01.12.2026», «Регистрация идёт», «Регистрация закрыта»,
 *  «Сезон завершён». */
export const registrationLabel = (s: Pick<Season, 'closed' | 'registration'>) =>
  s.closed
    ? 'Сезон завершён'
    : s.registration.active
      ? s.registration.until
        ? 'Регистрация до ' + s.registration.until.split('-').reverse().join('.')
        : 'Регистрация идёт'
      : 'Регистрация закрыта';

/** Заявка команды ✳ (19.11.2026, LEAGUE.md «Заявка клуба»): клуб подал — ждёт
 *  решения федерации; в туры и таблицу идут только принятые. */
export type TeamStatus = 'submitted' | 'accepted' | 'rejected';
export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  submitted: 'Ждёт решения',
  accepted: 'Принята',
  rejected: 'Отклонена',
};

export type LeagueTeam = {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  membersCount: number;
  status: TeamStatus;
  /** Комментарий решения федерации; у отклонённой — причина. */
  decisionComment: string;
};

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

/** `canEdit` — может ли смотрящий менять состав; решает сервер. */
export type TeamDetail = LeagueTeam & { division: Division; members: LeaguePerson[]; canEdit: boolean };

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
  /** Расписание тура: круг, стол и время встречи; не сформировано — null. */
  roundNumber: number | null;
  table: number | null;
  scheduledAt: Date | null;
  /** Судья стола встречи ✳ (19.11.2026). */
  referee: { id: string; name: string } | null;
};

export type TeamMatchDetail = TeamMatch & {
  squadA: LeaguePerson[];
  squadB: LeaguePerson[];
  /** Пары индексов расстановки: [0, 0] — A против X (порядок из правил). */
  order: [number, number][];
  rules: LeagueRules;
};

/** Игровой день расписания: дата `ГГГГ-ММ-ДД`, часы `ЧЧ:ММ` — как у турнира. */
export type TourPlayDay = { date: string; start: string; end: string };

/** Расписание тура ✳ (19.11.2026, LEAGUE.md «Расписание тура»): нет →
 *  черновик → отправлено; столов, минут на встречу, игровые дни (по умолчанию
 *  — день тура); `canEdit` — может ли смотрящий его вести, решает сервер. */
export type TourSchedule = {
  status: 'none' | 'draft' | 'final';
  tables: number;
  matchMinutes: number;
  days: TourPlayDay[];
  /** Судьи стола тура — из них раскладка сажает судью на встречу. */
  referees: { id: string; name: string }[];
  canEdit: boolean;
};

export type TourDetail = {
  id: string;
  number: number;
  city: string;
  startsOn: string | null;
  division: Division;
  matches: TeamMatch[];
  schedule: TourSchedule;
};

// ── Разбор ответа ───────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

const division = (d: Raw): Division => ({
  id: String(d.id),
  season: Number(d.season),
  seasonId: String(d.season_id),
  seasonName: String(d.season_name ?? ''),
  seasonClosed: Boolean(d.season_closed),
  gender: d.gender as LeagueGender,
  name: String(d.name),
  level: Number(d.level),
});

const calendar = (d: Raw): CalendarSummary => ({
  toursCount: Number(d.tours),
  startsOn: (d.starts_on as string | null) ?? null,
  endsOn: (d.ends_on as string | null) ?? null,
  cities: ((d.cities as string[]) ?? []).map(String),
  matches: Number(d.matches),
  finished: Number(d.finished),
});

const seasonTour = (t: Raw): SeasonTour => ({
  id: String(t.id),
  number: Number(t.number),
  city: String(t.city ?? ''),
  startsOn: (t.starts_on as string | null) ?? null,
  state: t.state as TourState,
  problem: String(t.problem ?? ''),
});

const divisionItem = (d: Raw): DivisionListItem => ({
  ...division(d),
  ...calendar(d),
  teamsCount: Number(d.teams),
  ...(Array.isArray(d.tour_list) ? { tours: (d.tour_list as Raw[]).map(seasonTour) } : {}),
});

const season = (s: Raw): Season => {
  const r = (s.registration as Raw) ?? {};
  return {
    ...calendar(s),
    id: String(s.id),
    year: Number(s.year),
    name: String(s.name),
    closed: Boolean(s.closed),
    registration: { open: Boolean(r.open), until: (r.until as string | null) ?? null, active: Boolean(r.active) },
    leagues: Number(s.leagues),
    teamsCount: Number(s.teams),
    pending: Number(s.pending ?? 0),
  };
};

const team = (t: Raw): LeagueTeam => ({
  id: String(t.id),
  name: String(t.name),
  clubId: String(t.club_id),
  clubName: String(t.club_name),
  membersCount: Number(t.members_count ?? 0),
  status: ((t.status as TeamStatus) ?? 'accepted'),
  decisionComment: String(t.decision_comment ?? ''),
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
  roundNumber: (m.round_number as number | null) ?? null,
  table: (m.table as number | null) ?? null,
  scheduledAt: m.scheduled_at ? new Date(String(m.scheduled_at)) : null,
  referee: (m.referee as { id: string; name: string } | null) ?? null,
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

/** Дивизионы — все сезоны (календарь) или один. */
export const fetchDivisions = async (season?: number) =>
  (await request<Raw[]>('/api/league/divisions/' + (season ? `?season=${season}` : ''))).map(divisionItem);

export const createDivision = async (d: { seasonId: string; gender: LeagueGender; name: string; level: number }) =>
  division(await post<Raw>('/api/league/divisions/', { season_id: d.seasonId, gender: d.gender, name: d.name, level: d.level }));

// ── Сезоны ✳ (19.11.2026) ──

export const fetchSeasons = async () => (await request<Raw[]>('/api/league/seasons/')).map(season);

export async function fetchSeason(id: string): Promise<SeasonDetail> {
  const s = await request<Raw>(`/api/league/seasons/${id}/`);
  return {
    ...season(s),
    divisions: (s.divisions as Raw[]).map(divisionItem),
    teams: ((s.team_list as Raw[]) ?? []).map((t) => ({
      id: String(t.id),
      name: String(t.name),
      clubName: String(t.club_name),
      divisionId: String(t.division_id),
      divisionName: String(t.division_name),
      gender: t.gender as LeagueGender,
      members: Number(t.members),
      status: t.status as TeamStatus,
      decisionComment: String(t.decision_comment ?? ''),
      submittedBy: String(t.submitted_by ?? ''),
    })),
  };
}

export const createSeason = async (s: { year: number; name: string; registrationUntil: string | null }) =>
  season(await post<Raw>('/api/league/seasons/', { year: s.year, name: s.name, registration_until: s.registrationUntil }));

export const updateSeason = async (
  id: string,
  patch: Partial<{ name: string; registrationOpen: boolean; registrationUntil: string | null; closed: boolean }>,
) => {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.registrationOpen !== undefined) body.registration_open = patch.registrationOpen;
  if (patch.registrationUntil !== undefined) body.registration_until = patch.registrationUntil;
  if (patch.closed !== undefined) body.closed = patch.closed;
  return season(await request<Raw>(`/api/league/seasons/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }));
};

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

// ── Заявка клуба ✳ (19.11.2026) ──

export const decideTeam = async (teamId: string, decision: 'accept' | 'reject', comment = '') =>
  team(await post<Raw>(`/api/league/teams/${teamId}/decide/`, { decision, comment }));

export const resubmitTeam = async (teamId: string) => team(await post<Raw>(`/api/league/teams/${teamId}/resubmit/`, {}));

/** Команда клуба в кабинете администратора клуба: сезон, лига и что можно. */
export type ClubTeam = LeagueTeam & {
  seasonId: string;
  seasonName: string;
  divisionId: string;
  divisionName: string;
  gender: LeagueGender;
  registrationActive: boolean;
  canEdit: boolean;
  canResubmit: boolean;
};

/** Сезон, в который сейчас открыта регистрация, и его лиги. */
export type OpenSeason = {
  id: string;
  name: string;
  registrationUntil: string | null;
  divisions: { id: string; name: string; gender: LeagueGender; level: number }[];
};

/** `matches` — встречи команд клуба, `judging` — встречи, которые человек
 *  судит; только из отправленных расписаний. */
export type MyLeague = {
  clubs: { id: string; name: string }[];
  teams: ClubTeam[];
  seasons: OpenSeason[];
  matches: ParticipantMatch[];
  judging: ParticipantMatch[];
};

export async function fetchMyLeague(): Promise<MyLeague> {
  const d = await request<Raw>('/api/league/my/');
  return {
    clubs: (d.clubs as Raw[]).map((c) => ({ id: String(c.id), name: String(c.name) })),
    teams: (d.teams as Raw[]).map((t) => ({
      ...team(t),
      membersCount: Number(t.members),
      seasonId: String(t.season_id),
      seasonName: String(t.season_name),
      divisionId: String(t.division_id),
      divisionName: String(t.division_name),
      gender: t.gender as LeagueGender,
      registrationActive: Boolean(t.registration_active),
      canEdit: Boolean(t.can_edit),
      canResubmit: Boolean(t.can_resubmit),
    })),
    matches: ((d.matches as Raw[]) ?? []).map(participantMatch),
    judging: ((d.judging as Raw[]) ?? []).map(participantMatch),
    seasons: (d.seasons as Raw[]).map((s) => ({
      id: String(s.id),
      name: String(s.name),
      registrationUntil: (s.registration_until as string | null) ?? null,
      divisions: (s.divisions as Raw[]).map((v) => ({
        id: String(v.id),
        name: String(v.name),
        gender: v.gender as LeagueGender,
        level: Number(v.level),
      })),
    })),
  };
}

export const createTour = (divisionId: string, t: { number: number; city: string; startsOn: string | null }) =>
  post<Raw>(`/api/league/divisions/${divisionId}/tours/`, { number: t.number, city: t.city, starts_on: t.startsOn });

export async function fetchTeam(id: string): Promise<TeamDetail> {
  const t = await request<Raw>(`/api/league/teams/${id}/`);
  return {
    ...team(t),
    division: division(t.division as Raw),
    members: (t.members as Raw[]).map(person),
    canEdit: Boolean(t.can_edit),
  };
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
    schedule: schedule(t.schedule as Raw),
  };
}

const schedule = (s: Raw): TourSchedule => ({
  status: s.status as TourSchedule['status'],
  tables: Number(s.tables),
  matchMinutes: Number(s.match_minutes),
  days: (s.days as TourPlayDay[]) ?? [],
  referees: (s.referees as { id: string; name: string }[]) ?? [],
  canEdit: Boolean(s.can_edit),
});

// ── Судьи стола тура ✳ (19.11.2026) ──

export const fetchTourRefereeCandidates = async (tourId: string, q: string) =>
  request<{ id: string; name: string }[]>(`/api/league/tours/${tourId}/referees/candidates/?q=${encodeURIComponent(q)}`);
export const addTourReferee = (tourId: string, userId: string) => post(`/api/league/tours/${tourId}/referees/`, { user_id: userId });
export const removeTourReferee = (tourId: string, userId: string) =>
  request(`/api/league/tours/${tourId}/referees/${userId}/`, { method: 'DELETE' });

/** Встреча в расписании участника (клуба или судьи): тур, лига, сезон рядом. */
export type ParticipantMatch = TeamMatch & {
  tour: { id: string; number: number; city: string };
  divisionName: string;
  seasonName: string;
};

const participantMatch = (m: Raw): ParticipantMatch => ({
  ...match(m),
  tour: m.tour as ParticipantMatch['tour'],
  divisionName: String((m.division as Raw)?.name ?? ''),
  seasonName: String(m.season_name ?? ''),
});

export const buildTourSchedule = async (tourId: string, p: { tables: number; matchMinutes: number; days: TourPlayDay[] }) =>
  schedule(await post<Raw>(`/api/league/tours/${tourId}/schedule/build/`, { tables: p.tables, match_minutes: p.matchMinutes, days: p.days }));

export const finalizeTourSchedule = async (tourId: string) =>
  schedule(await post<Raw>(`/api/league/tours/${tourId}/schedule/finalize/`, {}));

/** Стол, время и судья встречи; время — местное `ГГГГ-ММ-ДДTЧЧ:ММ` (сервер привяжет к своему поясу). */
export const editMatchSchedule = async (matchId: number, p: { table: number; scheduledAt: string; refereeId: string | null }) =>
  match(
    await request<Raw>(`/api/league/team-matches/${matchId}/schedule/`, {
      method: 'PATCH',
      body: JSON.stringify({ table: p.table, scheduled_at: p.scheduledAt, referee_id: p.refereeId ?? undefined }),
    }),
  );

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

export { useLoad } from '@/shared/lib/useLoad';

/** Новый клуб (`POST /api/clubs/`, только `is_staff` — администратор федерации). */
export const createClub = async (name: string) => {
  const c = await post<Raw>('/api/clubs/', { name });
  return { id: String(c.id), name: String(c.name) } as Club;
};
