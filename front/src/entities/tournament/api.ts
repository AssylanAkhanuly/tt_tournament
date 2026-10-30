/* Турниры — транспорт и модель. Единственное место, где фронт ходит в
   `/api/tournaments/` ✳ (28.10.2026). Запрос идёт на относительный путь — его
   проксирует next.config.ts в Django. */

import { useCallback, useEffect, useState } from 'react';

export type TournamentStatus = 'open' | 'in_progress' | 'finished';
export type TournamentFormat = 'single_elimination' | 'group_playoff' | 'manual';

export type TournamentSummary = {
  id: string;
  name: string;
  /** Дата начала; у турнира без даты — null. */
  startsAt: Date | null;
  status: TournamentStatus;
  clubName: string | null;
  participants: number;
  format: TournamentFormat;
  description: string;
  /** Приём заявок судей ✳ (29.10.2026): переключатель, срок «до» (день
   *  `ГГГГ-ММ-ДД` включительно, без срока — null) и идёт ли он сегодня — это
   *  решает сервер. */
  refereeRecruitment: Recruitment;
  /** Приём заявок игроков ✳ (29.10.2026): то же, но игрок записывается сам. */
  playerRecruitment: Recruitment;
  /** Сведения ✳ (29.10.2026): окончание (`ГГГГ-ММ-ДД`), где, возраст участников
   *  (лет; null — без границы) и общие настройки формата. */
  endsAt: string | null;
  city: string;
  venue: string;
  ageMin: number | null;
  ageMax: number | null;
  level: TournamentLevel;
  gamesToWin: number;
  isRating: boolean;
  groupSize: number;
};

/** Уровень соревнования — коэффициент C рейтинга (таблица п. 13 Положения). */
export type TournamentLevel = 'top' | 'republic' | 'region' | 'amateur';
export const LEVEL_LABEL: Record<TournamentLevel, string> = {
  top: 'Чемпионат и кубок РК, ТОП-12',
  republic: 'Республиканские',
  region: 'Областные и городские',
  amateur: 'Любительские',
};

export type Recruitment = { open: boolean; until: string | null; active: boolean };

/** Подпись состояния приёма: «Приём до 01.12.2026», «Приём открыт», «Приём
 *  закрыт». Срок — день `ГГГГ-ММ-ДД`, без сдвига часового пояса. */
export const recruitmentLabel = (r: Recruitment) =>
  r.active ? (r.until ? 'Приём до ' + r.until.split('-').reverse().join('.') : 'Приём открыт') : 'Приём закрыт';

export type TournamentParticipant = {
  id: number;
  /** Учётка спортсмена — для «Профиля». */
  userId: string;
  name: string;
  /** Фото; нет — на экране заглушка-силуэт. */
  avatar: string | null;
  absent: boolean;
  /** Рейтинг до турнира и изменение за него; у неучтённого турнира — null. */
  ratingBefore: number | null;
  ratingChange: number | null;
};

/** Судейские должности турнира ✳ (28.10.2026, ТЗ §2, роли 6–9): главный судья,
 *  заместитель и главный секретарь — по одному, судей стола — сколько угодно.
 *  Порядок — старшинство. */
export const REFEREE_POSITIONS = [
  { id: 'chief_referee', label: 'Главный судья соревнований', single: true },
  { id: 'deputy_chief_referee', label: 'Заместитель главного судьи', single: true },
  { id: 'chief_secretary', label: 'Главный секретарь соревнований', single: true },
  { id: 'referee', label: 'Судья стола', single: false },
] as const;
export type RefereePosition = (typeof REFEREE_POSITIONS)[number]['id'];

/** Судья турнира — судейская должность в области этого турнира. */
export type TournamentReferee = { id: string; name: string; email: string | null; position: RefereePosition };

export const FORMAT_LABEL: Record<TournamentFormat, string> = {
  single_elimination: 'Олимпийская система',
  group_playoff: 'Группы и плей-офф',
  manual: 'Протокол вручную',
};

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  open: 'Открыт',
  in_progress: 'Идёт',
  finished: 'Завершён',
};

type Raw = {
  id: string;
  name: string;
  starts_at: string | null;
  status: TournamentStatus;
  club_name: string | null;
  participant_count: number;
  format: TournamentFormat;
  description: string;
  referee_recruitment_open: boolean;
  referee_recruitment_until: string | null;
  referee_recruitment_active: boolean;
  player_recruitment_open: boolean;
  player_recruitment_until: string | null;
  player_recruitment_active: boolean;
  ends_at: string | null;
  city: string;
  venue: string;
  age_min: number | null;
  age_max: number | null;
  level: TournamentLevel;
  games_to_win: number;
  is_rating: boolean;
  group_size: number;
};

type RawParticipant = {
  id: number;
  user: { id: string; name: string; avatar: string | null };
  is_absent: boolean;
  rating_before: string | null;
  rating_change: string | null;
};

const toSummary = (t: Raw): TournamentSummary => ({
  id: t.id,
  name: t.name,
  startsAt: t.starts_at ? new Date(t.starts_at) : null,
  status: t.status,
  clubName: t.club_name,
  participants: t.participant_count,
  format: t.format,
  description: t.description,
  refereeRecruitment: {
    open: t.referee_recruitment_open,
    until: t.referee_recruitment_until,
    active: t.referee_recruitment_active,
  },
  playerRecruitment: {
    open: t.player_recruitment_open,
    until: t.player_recruitment_until,
    active: t.player_recruitment_active,
  },
  endsAt: t.ends_at,
  city: t.city,
  venue: t.venue,
  ageMin: t.age_min,
  ageMax: t.age_max,
  level: t.level,
  gamesToWin: t.games_to_win,
  isRating: t.is_rating,
  groupSize: t.group_size,
});

/** Правка сведений турнира (`PATCH /api/tournaments/<id>/update/`). Дата начала —
 *  день `ГГГГ-ММ-ДД`, на сервер уходит полднем местного дня, как при заведении. */
export type TournamentInfo = {
  name: string;
  description: string;
  startsOn: string | null;
  endsAt: string | null;
  city: string;
  venue: string;
  ageMin: number | null;
  ageMax: number | null;
  format: TournamentFormat;
  groupSize: number;
  gamesToWin: number;
  level: TournamentLevel;
  isRating: boolean;
};

const noon = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
};

export async function updateTournament(id: string, info: TournamentInfo): Promise<TournamentSummary> {
  const res = await fetch(`/api/tournaments/${id}/update/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: info.name,
      description: info.description,
      starts_at: info.startsOn ? noon(info.startsOn) : null,
      ends_at: info.endsAt,
      city: info.city,
      venue: info.venue,
      age_min: info.ageMin,
      age_max: info.ageMax,
      format: info.format,
      group_size: info.groupSize,
      games_to_win: info.gamesToWin,
      level: info.level,
      is_rating: info.isRating,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Ошибка поля приходит списком под его именем — показываем первую.
    const first = Object.values(body as Record<string, unknown>).flat()[0];
    throw new Error(typeof first === 'string' ? first : 'Не сохранено (' + res.status + ')');
  }
  return toSummary(body as Raw);
}

// Числа рейтинга сервер отдаёт строками (DecimalField) — разбираем на границе.
const num = (v: string | null) => (v === null ? null : Number(v));

async function getJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(what + ' не загрузились (' + res.status + ')');
  return (await res.json()) as T;
}

export async function fetchTournaments(): Promise<TournamentSummary[]> {
  return (await getJson<Raw[]>('/api/tournaments/', 'Турниры')).map(toSummary);
}

export async function fetchTournament(id: string): Promise<TournamentSummary> {
  return toSummary(await getJson<Raw>(`/api/tournaments/${id}/`, 'Данные турнира'));
}

export async function fetchParticipants(id: string): Promise<TournamentParticipant[]> {
  const raw = await getJson<RawParticipant[]>(`/api/tournaments/${id}/participants/`, 'Участники');
  return raw.map((p) => ({
    id: p.id,
    userId: p.user.id,
    name: p.user.name,
    avatar: p.user.avatar,
    absent: p.is_absent,
    ratingBefore: num(p.rating_before),
    ratingChange: num(p.rating_change),
  }));
}

export type NewTournament = {
  name: string;
  /** День начала, `ГГГГ-ММ-ДД`. */
  date: string;
  format: Exclude<TournamentFormat, 'manual'>;
  groupSize: number;
  description: string;
};

/** Завести турнир (`POST /api/tournaments/`, право — `is_staff` или админ клуба).
 *  Время начала — полдень местного дня: так турнир не уезжает на соседнюю дату
 *  ни в одном поясе республики. Час начала форма не спрашивает — полдень
 *  наш, подлежит утверждению. */
export async function createTournament(input: NewTournament): Promise<TournamentSummary> {
  const [y, m, d] = input.date.split('-').map(Number);
  const res = await fetch('/api/tournaments/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      starts_at: new Date(y, m - 1, d, 12).toISOString(),
      format: input.format,
      group_size: input.groupSize,
      description: input.description.trim(),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = Object.values(body as Record<string, unknown>)[0];
    const reason = (Array.isArray(first) ? first[0] : first) as string | undefined;
    throw new Error(reason || 'Турнир не заведён (' + res.status + ')');
  }
  return toSummary(body as Raw);
}

export async function fetchReferees(id: string): Promise<TournamentReferee[]> {
  const raw = await getJson<TournamentReferee[]>(`/api/tournaments/${id}/referees/`, 'Судьи');
  return raw.map(({ id: userId, name, email, position }) => ({ id: userId, name, email, position }));
}

/** Список турнира, в который добавляют: спортсмены или судьи. */
export type RosterRole = 'player' | 'referee';

/** Учётка, которую можно добавить в турнир. */
export type RosterCandidate = { id: string; name: string; email: string | null };

/** Кого можно добавить: учётки, которых в этом списке турнира ещё нет. */
export async function fetchCandidates(id: string, role: RosterRole, q: string): Promise<RosterCandidate[]> {
  const params = new URLSearchParams({ role, q: q.trim() });
  return getJson<RosterCandidate[]>(`/api/tournaments/${id}/candidates/?${params}`, 'Учётки');
}

/** Добавить учётку в турнир: спортсменом или судьёй (с должностью). */
export async function addToRoster(
  id: string,
  role: RosterRole,
  userId: string,
  position?: RefereePosition,
): Promise<void> {
  const res = await fetch(`/api/tournaments/${id}/${role === 'referee' ? 'referees' : 'participants'}/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(role === 'referee' ? { user_id: userId, position } : { user_id: userId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || 'Не добавлено (' + res.status + ')');
  }
}

/** Запрос с состоянием «грузится / данные / ошибка». Ответ на устаревший
 *  запрос не перетирает свежий. С `cache` последний ответ по ключу показывается
 *  сразу, пока идёт свежий запрос: так страница, открытая заново (разделы
 *  турнира — разные страницы), не мигает пустотой и не сдвигает раскладку. */
function useAsync<T>(run: () => Promise<T>, key: string, cache?: Map<string, T>) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ data: T | null; error: string | null; at: string } | null>(() =>
    cache?.has(key) ? { data: cache.get(key)!, error: null, at: '' } : null,
  );
  const at = key + '#' + tick;

  useEffect(() => {
    let live = true;
    run()
      .then((data) => {
        cache?.set(key, data);
        if (live) setState({ data, error: null, at });
      })
      .catch((e: Error) => live && setState({ data: null, error: e.message, at }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  return {
    data: state?.data ?? null,
    error: state?.error ?? null,
    loading: state?.at !== at,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}

export const useTournaments = () => useAsync(fetchTournaments, 'all');
/** Турниры по id — последний ответ: шапка сайдбара турнира не пропадает при смене раздела. */
const tournamentCache = new Map<string, TournamentSummary>();
export const useTournament = (id: string) => useAsync(() => fetchTournament(id), id, tournamentCache);
export const useParticipants = (id: string) => useAsync(() => fetchParticipants(id), id);
export const useReferees = (id: string) => useAsync(() => fetchReferees(id), id);
export const useRefereeCard = (tournamentId: string, userId: string) =>
  useAsync(() => fetchRefereeCard(tournamentId, userId), tournamentId + '/' + userId);

/** Карточка судьи турнира ✳ (28.10.2026): кто он, должность здесь и другие
 *  турниры, где он судит. */
export type RefereeCard = TournamentReferee & {
  tournaments: { id: string; name: string; startsAt: Date | null; position: RefereePosition }[];
};

type RawRefereeCard = TournamentReferee & {
  tournaments: { id: string; name: string; starts_at: string | null; position: RefereePosition }[];
};

const toCard = (raw: RawRefereeCard): RefereeCard => ({
  id: raw.id,
  name: raw.name,
  email: raw.email,
  position: raw.position,
  tournaments: raw.tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    startsAt: t.starts_at ? new Date(t.starts_at) : null,
    position: t.position,
  })),
});

export async function fetchRefereeCard(tournamentId: string, userId: string): Promise<RefereeCard> {
  return toCard(await getJson<RawRefereeCard>(`/api/tournaments/${tournamentId}/referees/${userId}/`, 'Карточка судьи'));
}

/** Сменить должность судьи в турнире. Занятую единственную сервер не даст. */
export async function changeRefereePosition(
  tournamentId: string,
  userId: string,
  position: RefereePosition,
): Promise<RefereeCard> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referees/${userId}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { detail?: string }).detail || 'Не сохранено (' + res.status + ')');
  return toCard(body as RawRefereeCard);
}

/** Убрать судью из коллегии турнира; в других турнирах он остаётся. */
export async function removeReferee(tournamentId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referees/${userId}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || 'Не убрано (' + res.status + ')');
  }
}

// ─── Приём заявок судей ✳ (29.10.2026) ───────────────────────────────────────

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

/** Заявка судьи на турнир: отмеченные должности по старшинству и решение;
 *  назначенная должность — у принятой. */
export type RefereeApplication = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  positions: RefereePosition[];
  status: ApplicationStatus;
  position: RefereePosition | null;
  createdAt: Date;
};

type RawApplication = Omit<RefereeApplication, 'userId' | 'createdAt'> & { user_id: string; created_at: string };

const toApplication = (a: RawApplication): RefereeApplication => ({
  id: a.id,
  userId: a.user_id,
  name: a.name,
  email: a.email,
  positions: a.positions,
  status: a.status,
  position: a.position,
  createdAt: new Date(a.created_at),
});

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string })?.detail || 'Не выполнено (' + res.status + ')');
  return data as T;
}

/** Чей приём заявок: судей или игроков. */
export type RecruitmentOf = 'referees' | 'players';

/** Открыть или закрыть приём заявок, задать срок (`until: null` — без срока).
 *  Председатель ГСК и администратор. */
export async function setRecruitment(
  id: string,
  of: RecruitmentOf,
  change: { open?: boolean; until?: string | null },
): Promise<TournamentSummary> {
  const path = of === 'referees' ? 'referee-recruitment' : 'player-recruitment';
  return toSummary(await send<Raw>(`/api/tournaments/${id}/${path}/`, 'PATCH', change));
}

/** Убрать спортсмена из турнира (пока турнир не начат). */
export async function removeParticipant(id: string, participantId: number): Promise<void> {
  await send(`/api/tournaments/${id}/participants/${participantId}/remove/`, 'DELETE');
}

export async function fetchRefereeApplications(id: string): Promise<RefereeApplication[]> {
  return (await getJson<RawApplication[]>(`/api/tournaments/${id}/referee-applications/`, 'Заявки судей')).map(
    toApplication,
  );
}

/** Своя заявка судьи на турнир; не подавал — null. */
export async function fetchMyRefereeApplication(id: string): Promise<RefereeApplication | null> {
  const raw = await getJson<{ application: RawApplication | null }>(
    `/api/tournaments/${id}/referee-applications/my/`,
    'Заявка',
  );
  return raw.application ? toApplication(raw.application) : null;
}

export async function applyAsReferee(id: string, positions: RefereePosition[]): Promise<RefereeApplication> {
  return toApplication(await send<RawApplication>(`/api/tournaments/${id}/referee-applications/my/`, 'POST', { positions }));
}

export async function withdrawRefereeApplication(id: string): Promise<void> {
  await send(`/api/tournaments/${id}/referee-applications/my/`, 'DELETE');
}

/** Решение председателя: назначить на должность из заявки или отклонить. */
export async function decideRefereeApplication(
  id: string,
  applicationId: string,
  decision: { accept: RefereePosition } | 'reject',
): Promise<RefereeApplication> {
  const url = `/api/tournaments/${id}/referee-applications/${applicationId}/`;
  const raw =
    decision === 'reject'
      ? await send<RawApplication>(url + 'reject/', 'POST')
      : await send<RawApplication>(url + 'accept/', 'POST', { position: decision.accept });
  notifyApplications();
  return toApplication(raw);
}

// Решили заявку — пересчитывают все, кто показывает число ждущих (значок у
// «Заявок» в сайдбаре живёт отдельно от таблицы заявок).
const applicationListeners = new Set<() => void>();
const notifyApplications = () => applicationListeners.forEach((l) => l());

/** Сколько заявок судей ждут решения; `enabled = false` — не спрашивать (у
 *  главного судьи «Судей» нет, сервер ему заявки не отдаёт). */
export function usePendingRefereeApplications(id: string, enabled: boolean): number {
  const r = useAsync(
    () => (enabled ? fetchRefereeApplications(id) : Promise.resolve([] as RefereeApplication[])),
    id + ':' + enabled,
  );
  const { reload } = r;
  useEffect(() => {
    applicationListeners.add(reload);
    return () => void applicationListeners.delete(reload);
  }, [reload]);
  return (r.data ?? []).filter((a) => a.status === 'pending').length;
}

export const useRefereeApplications = (id: string) => useAsync(() => fetchRefereeApplications(id), id);
export const useMyRefereeApplication = (id: string) => useAsync(() => fetchMyRefereeApplication(id), id);

// ─── Расписание ✳ (30.10.2026) ──────────────────────────────────────────────
// Строит и правит главный судья турнира (черновик → отправка), остальные видят.

/** Человек расписания; фото — у игроков матча рядом с фамилией. */
export type SchedulePerson = { id: string; name: string; avatar?: string | null };
/** Игровой день ✳ (30.10.2026): дата `ГГГГ-ММ-ДД` и часы `ЧЧ:ММ` — у каждого свои. */
export type PlayDay = { date: string; start: string; end: string };
export type ScheduleSettings = { tables: number; matchMinutes: number; days: PlayDay[] };
export type ScheduledMatch = {
  id: number;
  group: number;
  groupName: string;
  round: number | null;
  number: number;
  player1: SchedulePerson;
  player2: SchedulePerson;
  referee: SchedulePerson | null;
  table: number | null;
  /** Начало; у матча без времени — null. */
  scheduledAt: Date | null;
  status: string;
  /** Партии со стороны игрока 1; у несыгранного — null. */
  score1: number | null;
  score2: number | null;
  /** Победитель (id); у неявки он есть, счёт условный. */
  winner: string | null;
  isWalkover: boolean;
};

/** Итог игрока в группе: место, очки (победа 2, поражение 1, неявка 0), победы,
 *  поражения, разница партий. */
export type GroupStanding = { place: number; points: number; wins: number; losses: number; diff: number };
/** Позиция карты плей-офф: метка «A1»; игрок — когда его группа сыграна. */
export type PlayoffSide = { label: string; player: SchedulePerson | null };
/** Карта плей-офф по итогам групп ✳ (30.10.2026): первый круг по посеву, дальше
 *  пустые матчи до финала; пропуск круга (`null`) проводит игрока дальше. */
export type PlayoffMap = {
  /** Выходят из группы — наше значение (QUESTIONS 10.2). */
  advance: number;
  rounds: number;
  matches: { round: number; slot: number; a: PlayoffSide | null; b: PlayoffSide | null }[];
};
export type Schedule = {
  status: 'none' | 'draft' | 'final';
  playoff: PlayoffMap;
  /** Править может только главный судья, пока не отправлено. */
  canEdit: boolean;
  settings: ScheduleSettings;
  /** Игроки группы — по посеву, с итогом. */
  groups: { id: number; name: string; players: (SchedulePerson & { standing: GroupStanding })[] }[];
  matches: ScheduledMatch[];
  /** Судьи стола — кого можно поставить на матч. */
  referees: SchedulePerson[];
};

type RawSchedule = Omit<Schedule, 'canEdit' | 'settings' | 'matches'> & {
  can_edit: boolean;
  settings: { tables: number; match_minutes: number; days: PlayDay[] };
  matches: (Omit<ScheduledMatch, 'groupName' | 'scheduledAt' | 'isWalkover'> & {
    group_name: string;
    scheduled_at: string | null;
    is_walkover: boolean;
  })[];
};

const toSchedule = (r: RawSchedule): Schedule => ({
  status: r.status,
  playoff: r.playoff,
  canEdit: r.can_edit,
  settings: {
    tables: r.settings.tables,
    matchMinutes: r.settings.match_minutes,
    days: r.settings.days,
  },
  groups: r.groups,
  matches: r.matches.map((m) => ({
    id: m.id,
    group: m.group,
    groupName: m.group_name,
    round: m.round,
    number: m.number,
    player1: m.player1,
    player2: m.player2,
    referee: m.referee,
    table: m.table,
    scheduledAt: m.scheduled_at ? new Date(m.scheduled_at) : null,
    status: m.status,
    score1: m.score1,
    score2: m.score2,
    winner: m.winner,
    isWalkover: m.is_walkover,
  })),
  referees: r.referees,
});

const scheduleUrl = (id: string, tail = '') => `/api/tournaments/${id}/schedule/${tail}`;

export async function fetchSchedule(id: string): Promise<Schedule> {
  return toSchedule(await getJson<RawSchedule>(scheduleUrl(id), 'Расписание'));
}

/** Сформировать черновик заново по параметрам. */
export async function buildSchedule(id: string, s: ScheduleSettings): Promise<Schedule> {
  return toSchedule(
    await send<RawSchedule>(scheduleUrl(id, 'build/'), 'POST', {
      tables: s.tables,
      match_minutes: s.matchMinutes,
      days: s.days,
    }),
  );
}

/** Перенести игрока в другую группу — пары и время пересчитываются. */
export async function moveScheduledPlayer(id: string, userId: string, groupId: number): Promise<Schedule> {
  return toSchedule(await send<RawSchedule>(scheduleUrl(id, 'move/'), 'POST', { user_id: userId, group_id: groupId }));
}

/** Время, стол, судья матча; занятых в то же время сервер не даст. */
export async function editScheduledMatch(
  id: string,
  matchId: number,
  change: { refereeId?: string; table?: number; scheduledAt?: Date },
): Promise<Schedule> {
  return toSchedule(
    await send<RawSchedule>(scheduleUrl(id, `matches/${matchId}/`), 'PATCH', {
      referee_id: change.refereeId,
      table: change.table,
      scheduled_at: change.scheduledAt?.toISOString(),
    }),
  );
}

/** Отправить: расписание и состав запираются, турнир начинается. */
export async function finalizeSchedule(id: string): Promise<Schedule> {
  return toSchedule(await send<RawSchedule>(scheduleUrl(id, 'finalize/'), 'POST'));
}

export const useSchedule = (id: string) => useAsync(() => fetchSchedule(id), id);
