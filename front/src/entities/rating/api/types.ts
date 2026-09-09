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

export type RatingEntryKind = 'start' | 'match' | 'prize' | 'no_show' | 'correction' | 'void';

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

export type RatingList = {
  count: number;
  page: number;
  pageSize: number;
  results: RatingProfile[];
  /** Дата последнего пересчёта. Публикации снимками нет — значение живое. */
  updatedAt: string | null;
};

export type RatingCard = {
  profile: RatingProfile;
  history: RatingEntry[];
  place: number;
  of: number;
};

/** Откуда взято значение коэффициента: из Положения или наше допущение. */
export type ParamSource = { fixed: boolean; clause: string };

export type RatingParams = {
  id: number;
  name: string;
  d: number;
  kStandard: number;
  kTransition: number;
  transitionMatches: number;
  maxDelta: number;
  capInTransition: boolean;
  cTop: number;
  cRepublic: number;
  cRegion: number;
  cAmateur: number;
  pFirst: number;
  pSecond: number;
  pThird: number;
  prizeMode: 'match' | 'tournament' | 'none';
  baseline: 'sequential' | 'pre_tournament';
  minRating: number;
  ittfRMax: number;
  ittfK: number;
  updatedAt: string;
  sources: Record<string, ParamSource>;
};

/* ── Предпросчёт: вход и выход ручки калибровки ─────────────────── */

export type PreviewPlayer = {
  id: string;
  name: string;
  origin: RatingOrigin;
  start: number;
  played: number;
  ittf_position?: number | null;
};

export type PreviewTournament = {
  id: string;
  name: string;
  level: CompetitionLevel;
  places?: Record<string, number>;
  no_third_place_match?: boolean;
};

export type PreviewMatch = {
  id: string;
  tournament: string;
  a: string;
  b: string;
  games: [number, number];
};

export type PreviewHistoryRow = {
  match_id: string;
  tournament: string;
  tournament_name: string;
  player: string;
  player_name: string;
  opponent: string;
  opponent_name: string;
  score: string;
  won: boolean;
  before: number;
  delta: number;
  after: number;
  expected: number;
  k: number;
  c: number;
  p: number;
  capped: boolean;
  transition: boolean;
};

export type PreviewStanding = {
  id: string;
  name: string;
  origin: RatingOrigin;
  start: number;
  rating: number;
  delta: number;
  matches: number;
  wins: number;
  losses: number;
  transition_left: number;
  prize_bonus: number;
};

/** Что выбранные коэффициенты значат на практике. Считает сервер: это та же
    формула п. 9.3, и копия на фронте разошлась бы с боевой. */
export type PreviewInsights = {
  /** Доля ожидаемых побед МС (50,00) над КМС (40,00) при текущем D. */
  win_share_ms_over_kms: number;
  win_share_gap_5: number;
  win_share_gap_20: number;
  /** Побед подряд, чтобы дойти со старта 1,00 до уровня КМС. null — никогда. */
  matches_new_to_kms: number | null;
};

export type PreviewResult = {
  history: PreviewHistoryRow[];
  table: PreviewStanding[];
  /** Сколько баллов шкала создала из ниоткуда — показатель инфляции. */
  injected: number;
  skipped: { match_id: string; reason: string }[];
  insights: PreviewInsights;
};
