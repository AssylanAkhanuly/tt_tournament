/* Транспорт рейтинга: единственное место, где фронт ходит в `/api/rating/`.

   Экран зовёт хук, хук зовёт этот файл, а не `fetch` из компонента — иначе
   смена адреса или формата ответа расползается по всем экранам сразу.

   Здесь же граница форматов: сервер отдаёт денежные величины строками, чтобы
   не потерять второй знак, а дальше по фронту ходят числа. Разбор один раз и
   в одном месте. */

import type {
  EditionDraftRow,
  PreviewMatch,
  PreviewPlayer,
  PreviewResult,
  PreviewTournament,
  RatingCard,
  RatingEdition,
  RatingEntry,
  RatingList,
  RatingParams,
  RatingProfile,
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
  } catch (cause) {
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

const toParams = (raw: Record<string, unknown>): RatingParams => ({
  id: n(raw.id),
  name: String(raw.name ?? ''),
  d: n(raw.d),
  kStandard: n(raw.k_standard),
  kTransition: n(raw.k_transition),
  transitionMatches: n(raw.transition_matches),
  maxDelta: n(raw.max_delta),
  capInTransition: Boolean(raw.cap_in_transition),
  cTop: n(raw.c_top),
  cRepublic: n(raw.c_republic),
  cRegion: n(raw.c_region),
  cAmateur: n(raw.c_amateur),
  pFirst: n(raw.p_first),
  pSecond: n(raw.p_second),
  pThird: n(raw.p_third),
  prizeMode: raw.prize_mode as RatingParams['prizeMode'],
  baseline: raw.baseline as RatingParams['baseline'],
  minRating: n(raw.min_rating),
  ittfRMax: n(raw.ittf_r_max),
  ittfK: n(raw.ittf_k),
  updatedAt: String(raw.updated_at ?? ''),
  sources: (raw.sources ?? {}) as RatingParams['sources'],
});

const toEdition = (raw: Record<string, unknown>): RatingEdition => ({
  id: n(raw.id),
  number: n(raw.number),
  publishedAt: String(raw.published_at ?? ''),
  publishedByName: (raw.published_by_name as string) ?? null,
  appealUntil: String(raw.appeal_until ?? ''),
  rows: n(raw.rows),
});

/* ── Ручки ──────────────────────────────────────────────────────── */

export type RatingListQuery = {
  sex?: string;
  region?: string;
  status?: string;
  age?: string;
  q?: string;
  all?: boolean;
  page?: number;
  pageSize?: number;
  /** Номер записи выпуска или `live` — живые значения. Без него — последний выпуск. */
  edition?: string;
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
  if (query.edition) params.set('edition', query.edition);

  const raw = await request<Record<string, unknown>>('/?' + params.toString());
  return {
    count: n(raw.count),
    page: n(raw.page),
    pageSize: n(raw.page_size),
    results: (raw.results as RawProfile[]).map(toProfile),
    edition: raw.edition ? toEdition(raw.edition as Record<string, unknown>) : null,
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

/** Действующие коэффициенты вместе с происхождением каждого числа. */
export async function fetchRatingParams(): Promise<RatingParams> {
  return toParams(await request<Record<string, unknown>>('/params/'));
}

/** Правка коэффициентов — только федерация (на сервере `IsAdminUser`). */
export async function saveRatingParams(patch: Record<string, unknown>): Promise<RatingParams> {
  return toParams(
    await request<Record<string, unknown>>('/params/', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  );
}

/** Предпросчёт: сервер считает присланный набор и ничего не сохраняет.

    Это и есть боевой движок — по решению владельца продукта (10.09.2026)
    реализация одна, на Python. Отсюда и цена: калибровка ходит по сети. */
export async function previewRating(body: {
  players: PreviewPlayer[];
  tournaments: PreviewTournament[];
  matches: PreviewMatch[];
  params?: Record<string, unknown>;
}): Promise<PreviewResult> {
  return request<PreviewResult>('/preview/', { method: 'POST', body: JSON.stringify(body) });
}

/* ── Правки председателя ГСК ✳ (10.09.2026) ─────────────────────────
   Обе ручки сервер пускает только председателю ГСК. Отказ приходит текстом
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

/* ── Выпуски (п. 8.2) ✳ (11.09.2026) ──────────────────────────────── */

/** Все выпуски, новые первыми. Открыто всем: по ним выбирают таблицу. */
export async function fetchEditions(): Promise<RatingEdition[]> {
  const raw = await request<Record<string, unknown>[]>('/editions/');
  return raw.map(toEdition);
}

/** Опубликовать выпуск — только председатель ГСК. */
export async function publishEdition(): Promise<RatingEdition> {
  return toEdition(await request<Record<string, unknown>>('/editions/', { method: 'POST' }));
}

/** Что уйдёт в следующий выпуск: кто сдвинулся с прошлого и кто новый. */
export async function fetchEditionDraft(): Promise<EditionDraftRow[]> {
  const raw = await request<Record<string, unknown>[]>('/editions/draft/');
  return raw.map((r) => ({
    userId: String(r.user_id ?? ''),
    name: String(r.name ?? ''),
    before: nOrNull(r.before),
    after: n(r.after),
    delta: nOrNull(r.delta),
  }));
}
