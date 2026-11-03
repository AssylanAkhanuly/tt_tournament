/* Общая часть транспорта рейтинга: запрос, ошибка и разбор чисел и строк.

   Вынесено из `client.ts` ✳ (03.11.2026), когда вернулись журнал и
   калибровка: у каждой своя часть транспорта (`journal.ts`, `calibration.ts`),
   а запрос и разбор — одни.
   Наружу (`index.ts`) этот файл не выходит, кроме `RatingApiError`. */

import type { RatingEntry, RatingProfile } from './types';

export const BASE = '/api/rating';

/** Строка сервера → число. `null` остаётся `null`: «нет значения» это не ноль. */
export const n = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
export const nOrNull = (v: unknown): number | null =>
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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export type RawProfile = Record<string, unknown>;

export const toProfile = (raw: RawProfile): RatingProfile => ({
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
  birthDate: (raw.birth_date as string) ?? null,
  ageCategory: (raw.age_category as RatingProfile['ageCategory']) ?? null,
  region: String(raw.region ?? ''),
  updatedAt: String(raw.updated_at ?? ''),
});

export const toEntry = (raw: Record<string, unknown>): RatingEntry => ({
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

