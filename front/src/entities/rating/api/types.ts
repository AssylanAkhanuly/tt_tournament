/* Что отдаёт бэкенд по рейтингу.

   Числа приходят с сервера строками («20.36») — так `DecimalField` не теряет
   второй знак в плавающей точке. Клиент (`client.ts`) приводит их к числам
   один раз, на границе; дальше по коду ходят числа, а не строки, и экраны не
   занимаются разбором формата.

   Устройство рейтинга целиком — RATING.md в корне. */

export type RatingOrigin = 'new' | 'legacy' | 'ittf';
export type RatingStatus = 'no_matches' | 'active' | 'inactive' | 'void';
export type CompetitionLevel = 'top' | 'republic' | 'region' | 'amateur';
export type AgeCategory = 'U11' | 'U13' | 'U15' | 'U17' | 'U19' | 'U21';

/** Строка рейтинг-листа и шапка карточки — поля таблицы п. 19 Положения. */
export type RatingProfile = {
  userId: string;
  name: string;
  value: number;
  origin: RatingOrigin;
  originLabel: string;
  startValue: number;
  ittfPosition: number | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  noShows: number;
  lastMatchAt: string | null;
  status: RatingStatus;
  statusLabel: string;
  sex: string;
  birthYear: number | null;
  ageCategory: AgeCategory | null;
  region: string;
  updatedAt: string;
};

export type RatingEntryKind = 'start' | 'match' | 'prize' | 'no_show' | 'correction' | 'void' | 'merge';

/** Строка истории — колонки таблицы п. 20 плюс слагаемые изменения. */
export type RatingEntry = {
  id: number;
  kind: RatingEntryKind;
  kindLabel: string;
  occurredAt: string;
  tournament: string | null;
  tournamentName: string | null;
  opponent: string | null;
  opponentName: string | null;
  score: string;
  won: boolean | null;
  before: number;
  delta: number;
  after: number;
  expected: number | null;
  d: number | null;
  k: number | null;
  c: number | null;
  p: number | null;
  capped: boolean;
  transition: boolean;
  reason: string;
  isReverted: boolean;
  createdAt: string;
};

/** Рейтинг-лист. Значение живое: посчитали — сразу действует. */
export type RatingList = {
  count: number;
  page: number;
  pageSize: number;
  results: RatingProfile[];
  /** Дата последнего пересчёта. */
  updatedAt: string | null;
};

export type RatingCard = {
  profile: RatingProfile;
  history: RatingEntry[];
  place: number;
  of: number;
};

/* ── Протоколы турниров (п. 10, 13) ─────────────────────────────── */

/** Участник в списке протоколов: место даёт коэффициент P (п. 10). */
export type ProtocolParticipant = {
  userId: string;
  name: string;
  place: number | null;
  ratingChange: number | null;
};

/** Строка списка протоколов: уровень (C, п. 13) и учтён ли турнир в рейтинге. */
export type RatingProtocol = {
  id: string;
  name: string;
  date: string | null;
  level: CompetitionLevel;
  levelLabel: string;
  noThirdPlaceMatch: boolean;
  applied: boolean;
  /** Турнир заведён протоколом вручную ✳ (11.09.2026). */
  manual: boolean;
  /** Участников и матчи можно править: вручную и ещё не учтён. */
  editable: boolean;
  participants: ProtocolParticipant[];
};

/** Одна сторона матча в протоколе: что матч дал этому игроку и из чего. */
export type ProtocolMatchSide = {
  delta: number;
  before: number;
  after: number;
  expected: number | null;
  k: number | null;
  c: number | null;
  p: number | null;
  capped: boolean;
  transition: boolean;
};

/** Матч протокола. `counted` — учтён ли в рейтинге (неявки и матчи без
    счёта не учитываются, п. 16.3). */
export type ProtocolMatch = {
  id: string;
  aId: string;
  aName: string;
  bId: string;
  bName: string;
  score: string;
  winnerId: string | null;
  counted: boolean;
  a: ProtocolMatchSide | null;
  b: ProtocolMatchSide | null;
};

export type ProtocolDetailParticipant = {
  userId: string;
  name: string;
  place: number | null;
  before: number | null;
  change: number | null;
  after: number | null;
};

/** Страница протокола: уровень, места, участники с изменением рейтинга, матчи.
    `blocked` — почему утвердить нельзя (после турнира были другие изменения). */
export type ProtocolDetail = {
  id: string;
  name: string;
  date: string | null;
  level: CompetitionLevel;
  levelLabel: string;
  noThirdPlaceMatch: boolean;
  applied: boolean;
  manual: boolean;
  editable: boolean;
  blocked: string | null;
  participants: ProtocolDetailParticipant[];
  matches: ProtocolMatch[];
};

export type ProtocolInput = {
  level: string;
  places: Record<string, number>;
  noThirdPlaceMatch: boolean;
};

/* ── Заведение председателем ГСК ✳ (11.09.2026) ─────────────────── */

/** Новый спортсмен. Стартовое значение считает сервер по происхождению:
    новый — 1,00 (п. 6.1), перенос — прежний рейтинг (п. 6.3), ITTF — из
    позиции (п. 17.4). */
export type NewAthlete = {
  name: string;
  region: string;
  sex: '' | 'm' | 'f';
  birthYear: number | null;
  origin: RatingOrigin;
  legacy: number | null;
  ittfPosition: number | null;
};

/** Турнир протоколом вручную: название, дата, уровень (C, п. 13). */
export type NewTournament = {
  name: string;
  date: string;
  level: CompetitionLevel;
};

/** Матч протокола вручную: кто с кем и счёт по партиям. */
export type NewMatch = {
  a: string;
  b: string;
  scoreA: number;
  scoreB: number;
};
