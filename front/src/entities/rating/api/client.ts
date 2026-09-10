/* Транспорт рейтинга: единственное место, где фронт ходит в `/api/rating/`.

   Экран зовёт хук, хук зовёт этот файл, а не `fetch` из компонента — иначе
   смена адреса или формата ответа расползается по всем экранам сразу.

   Здесь же граница форматов: сервер отдаёт денежные величины строками, чтобы
   не потерять второй знак, а дальше по фронту ходят числа. Разбор один раз и
   в одном месте. */

import type {
  NewAthlete,
  NewMatch,
  NewTournament,
  ProtocolDetail,
  ProtocolInput,
  ProtocolMatchSide,
  RatingCard,
  RatingEntry,
  RatingList,
  RatingProfile,
  RatingProtocol,
} from './types';

const BASE = '/api/rating';

/** Строка сервера → число. `null` остаётся `null`: «нет значения» это не ноль. */
const n = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
const nOrNull = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

export class RatingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'RatingApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      credentials: 'same-origin',
    });
  } catch {
    // Сеть не ответила вовсе: сервер не поднят или адрес не проксируется.
    // Экран обязан сказать это прямо, а не показать пустую таблицу.
    throw new RatingApiError('Рейтинговый сервис недоступен', 0);
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body) => (typeof body?.detail === 'string' ? body.detail : null))
      .catch(() => null);
    throw new RatingApiError(detail ?? 'Ошибка ' + response.status, response.status);
  }
  return (await response.json()) as T;
}

/* ── Разбор ответов ─────────────────────────────────────────────── */

type RawProfile = Record<string, unknown>;

const toProfile = (raw: RawProfile): RatingProfile => ({
  userId: String(raw.user_id ?? ''),
  name: String(raw.name ?? ''),
  value: n(raw.value),
  origin: raw.origin as RatingProfile['origin'],
  originLabel: String(raw.origin_label ?? ''),
  startValue: n(raw.start_value),
  ittfPosition: nOrNull(raw.ittf_position),
  matchesPlayed: n(raw.matches_played),
  wins: n(raw.wins),
  losses: n(raw.losses),
  noShows: n(raw.no_shows),
  lastMatchAt: (raw.last_match_at as string) ?? null,
  status: raw.status as RatingProfile['status'],
  statusLabel: String(raw.status_label ?? ''),
  sex: String(raw.sex ?? ''),
  birthYear: nOrNull(raw.birth_year),
  ageCategory: (raw.age_category as RatingProfile['ageCategory']) ?? null,
  region: String(raw.region ?? ''),
  updatedAt: String(raw.updated_at ?? ''),
});

const toEntry = (raw: Record<string, unknown>): RatingEntry => ({
  id: n(raw.id),
  kind: raw.kind as RatingEntry['kind'],
  kindLabel: String(raw.kind_label ?? ''),
  occurredAt: String(raw.occurred_at ?? ''),
  tournament: (raw.tournament as string) ?? null,
  tournamentName: (raw.tournament_name as string) ?? null,
  opponent: (raw.opponent as string) ?? null,
  opponentName: (raw.opponent_name as string) ?? null,
  score: String(raw.score ?? ''),
  won: (raw.won as boolean | null) ?? null,
  before: n(raw.before),
  delta: n(raw.delta),
  after: n(raw.after),
  expected: nOrNull(raw.expected),
  d: nOrNull(raw.d),
  k: nOrNull(raw.k),
  c: nOrNull(raw.c),
  p: nOrNull(raw.p),
  capped: Boolean(raw.capped),
  transition: Boolean(raw.transition),
  reason: String(raw.reason ?? ''),
  isReverted: Boolean(raw.is_reverted),
  createdAt: String(raw.created_at ?? ''),
});

/* ── Лист и карточка ────────────────────────────────────────────── */

export type RatingListQuery = {
  sex?: string;
  region?: string;
  status?: string;
  age?: string;
  q?: string;
  all?: boolean;
  page?: number;
  pageSize?: number;
};

/** Рейтинг-лист (Э0.4). По умолчанию активный: неактивные исключены из текущей
    таблицы (п. 18.2), но доступны через `status`. */
export async function fetchRatingList(query: RatingListQuery = {}): Promise<RatingList> {
  const params = new URLSearchParams();
  if (query.sex) params.set('sex', query.sex);
  if (query.region) params.set('region', query.region);
  if (query.status) params.set('status', query.status);
  if (query.age) params.set('age', query.age);
  if (query.q) params.set('q', query.q);
  if (query.all) params.set('all', '1');
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('page_size', String(query.pageSize));

  const raw = await request<Record<string, unknown>>('/?' + params.toString());
  return {
    count: n(raw.count),
    page: n(raw.page),
    pageSize: n(raw.page_size),
    results: (raw.results as RawProfile[]).map(toProfile),
    updatedAt: (raw.updated_at as string) ?? null,
  };
}

/** Карточка спортсмена: профиль, история со слагаемыми, место в листе. */
export async function fetchRatingCard(userId: string): Promise<RatingCard> {
  const raw = await request<Record<string, unknown>>('/' + userId + '/');
  return {
    profile: toProfile(raw.profile as RawProfile),
    history: (raw.history as Record<string, unknown>[]).map(toEntry),
    place: n(raw.place),
    of: n(raw.of),
  };
}

/* ── Правки председателя ГСК ✳ (10.09.2026) ─────────────────────────
   Ручки сервер пускает только председателю ГСК. Отказ приходит текстом
   сервера — его экран и показывает, а не придумывает свой. */

/** Неявка без уважительной причины (п. 15.4–15.6). Основание обязательно. */
export async function registerNoShow(userId: string, reason: string): Promise<RatingEntry> {
  const raw = await request<Record<string, unknown>>('/no-show/', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, reason }),
  });
  return toEntry(raw);
}

/** Исправление технической ошибки (п. 21.5–21.6): разница дописывается строкой. */
export async function correctRating(userId: string, value: number, reason: string): Promise<RatingEntry> {
  const raw = await request<Record<string, unknown>>('/correction/', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, value, reason }),
  });
  return toEntry(raw);
}

/** Объединить дубль с основной карточкой (п. 5.3). Возвращает основную карточку
    после пересчёта. */
export async function mergeProfiles(keepUserId: string, dropUserId: string, reason: string): Promise<RatingProfile> {
  return toProfile(
    await request<Record<string, unknown>>('/merge/', {
      method: 'POST',
      body: JSON.stringify({ keep_user_id: keepUserId, drop_user_id: dropUserId, reason }),
    }),
  );
}

/* ── Протоколы турниров: уровень и места (п. 10, 13) ✳ (11.09.2026) ─── */

const toProtocol = (r: Record<string, unknown>): RatingProtocol => ({
  id: String(r.id ?? ''),
  name: String(r.name ?? ''),
  date: (r.date as string) ?? null,
  level: r.level as RatingProtocol['level'],
  levelLabel: String(r.level_label ?? ''),
  noThirdPlaceMatch: Boolean(r.no_third_place_match),
  applied: Boolean(r.applied),
  manual: Boolean(r.manual),
  editable: Boolean(r.editable),
  participants: ((r.participants as Record<string, unknown>[]) ?? []).map((p) => ({
    userId: String(p.user_id ?? ''),
    name: String(p.name ?? ''),
    place: nOrNull(p.place),
    ratingChange: nOrNull(p.rating_change),
  })),
});

/** Рейтинговые турниры — только председателю ГСК. */
export async function fetchProtocols(): Promise<RatingProtocol[]> {
  return (await request<Record<string, unknown>[]>('/protocols/')).map(toProtocol);
}

const toSide = (s: unknown): ProtocolMatchSide | null => {
  if (!s) return null;
  const r = s as Record<string, unknown>;
  return {
    delta: n(r.delta),
    before: n(r.before),
    after: n(r.after),
    expected: nOrNull(r.expected),
    k: nOrNull(r.k),
    c: nOrNull(r.c),
    p: nOrNull(r.p),
    capped: Boolean(r.capped),
    transition: Boolean(r.transition),
  };
};

const toProtocolDetail = (r: Record<string, unknown>): ProtocolDetail => ({
  id: String(r.id ?? ''),
  name: String(r.name ?? ''),
  date: (r.date as string) ?? null,
  level: r.level as ProtocolDetail['level'],
  levelLabel: String(r.level_label ?? ''),
  noThirdPlaceMatch: Boolean(r.no_third_place_match),
  applied: Boolean(r.applied),
  manual: Boolean(r.manual),
  editable: Boolean(r.editable),
  gamesToWin: n(r.games_to_win) || 3,
  blocked: (r.blocked as string) ?? null,
  participants: ((r.participants as Record<string, unknown>[]) ?? []).map((p) => ({
    userId: String(p.user_id ?? ''),
    name: String(p.name ?? ''),
    place: nOrNull(p.place),
    before: nOrNull(p.before),
    change: nOrNull(p.change),
    after: nOrNull(p.after),
  })),
  matches: ((r.matches as Record<string, unknown>[]) ?? []).map((m) => ({
    id: String(m.id ?? ''),
    aId: String(m.a_id ?? ''),
    aName: String(m.a_name ?? ''),
    bId: String(m.b_id ?? ''),
    bName: String(m.b_name ?? ''),
    score: String(m.score ?? ''),
    winnerId: (m.winner_id as string) ?? null,
    counted: Boolean(m.counted),
    a: toSide(m.a),
    b: toSide(m.b),
  })),
});

const protocolBody = (body: ProtocolInput) =>
  JSON.stringify({ level: body.level, places: body.places, no_third_place_match: body.noThirdPlaceMatch });

/** Страница протокола: участники с изменением рейтинга и матчи. */
export async function fetchProtocol(id: string): Promise<ProtocolDetail> {
  return toProtocolDetail(await request<Record<string, unknown>>('/protocols/' + id + '/'));
}

/** Предпросмотр: сервер считает утверждение по-настоящему и откатывает —
    числа те же, что дало бы сохранение. Ничего не сохраняет. */
export async function previewProtocol(id: string, body: ProtocolInput): Promise<ProtocolDetail> {
  return toProtocolDetail(
    await request<Record<string, unknown>>('/protocols/' + id + '/preview/', { method: 'POST', body: protocolBody(body) }),
  );
}

/** Утвердить протокол: уровень, места, «матча за 3-е место не было» — и пересчёт.
    Турнир вручную при этом завершается и учитывается в рейтинге. */
export async function saveProtocol(id: string, body: ProtocolInput): Promise<ProtocolDetail> {
  return toProtocolDetail(
    await request<Record<string, unknown>>('/protocols/' + id + '/', { method: 'POST', body: protocolBody(body) }),
  );
}

/* ── Заведение председателем ГСК ✳ (11.09.2026) ─────────────────── */

const athleteBody = (a: NewAthlete) => ({
  name: a.name,
  region: a.region,
  sex: a.sex,
  birth_year: a.birthYear,
  origin: a.origin,
  legacy: a.legacy,
  ittf_position: a.ittfPosition,
});

/** Завести спортсмена в рейтинге. Стартовое значение считает сервер. */
export async function createAthlete(a: NewAthlete): Promise<RatingProfile> {
  return toProfile(
    await request<Record<string, unknown>>('/athletes/', { method: 'POST', body: JSON.stringify(athleteBody(a)) }),
  );
}

const protocolCall = async (path: string, method: string, body?: unknown): Promise<ProtocolDetail> =>
  toProtocolDetail(
    await request<Record<string, unknown>>('/protocols/' + path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );

/** Завести турнир протоколом вручную. */
export function createProtocol(t: NewTournament): Promise<ProtocolDetail> {
  return protocolCall('', 'POST', { name: t.name, date: t.date, level: t.level, games_to_win: t.gamesToWin });
}

/** Добавить участника: из рейтинга (`userId`) или нового спортсмена. */
export function addProtocolParticipant(
  id: string,
  who: { userId: string } | { athlete: NewAthlete },
): Promise<ProtocolDetail> {
  return protocolCall(
    id + '/participants/',
    'POST',
    'userId' in who ? { user_id: who.userId } : { new: athleteBody(who.athlete) },
  );
}

/** Убрать участника — сервер откажет, если у него есть матчи. */
export function removeProtocolParticipant(id: string, userId: string): Promise<ProtocolDetail> {
  return protocolCall(id + '/participants/' + userId + '/', 'DELETE');
}

/** Внести матч: кто с кем и счёт. */
export function addProtocolMatch(id: string, m: NewMatch): Promise<ProtocolDetail> {
  return protocolCall(id + '/matches/', 'POST', { a: m.a, b: m.b, score_a: m.scoreA, score_b: m.scoreB });
}

export function removeProtocolMatch(id: string, matchId: string): Promise<ProtocolDetail> {
  return protocolCall(id + '/matches/' + matchId + '/', 'DELETE');
}

/** Вернуть на доработку: учёт турнира снимается, участники и матчи снова правятся. */
export function reworkProtocol(id: string): Promise<ProtocolDetail> {
  return protocolCall(id + '/rework/', 'POST');
}
