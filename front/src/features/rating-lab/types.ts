/* Что вводят на экране калибровки.

   Это типы ЭКРАНА, а не системы: спортсмены и матчи здесь выдуманные, ничего
   не сохраняется. Боевые сущности живут на бэкенде и приходят через
   `entities/rating`. */

import type { CompetitionLevel, RatingOrigin } from '@/entities/rating';

export type LabPlayerInput = {
  id: string;
  name: string;
  origin: RatingOrigin;
  /** Прежний рейтинг для origin = 'legacy' (п. 6.3). */
  legacy: number;
  /** Позиция в ITTF World Ranking для origin = 'ittf' (п. 17.3). */
  ittfPosition: number;
  /** Рейтинговых матчей до прогона — переходный период (п. 11.3). */
  played: number;
};

export type LabTournamentInput = {
  id: string;
  name: string;
  level: CompetitionLevel;
  places: Record<string, number>;
  noThirdPlaceMatch: boolean;
};

export type LabMatchInput = {
  id: string;
  tournament: string;
  a: string;
  b: string;
  games: [number, number];
};

/** Коэффициенты, которыми экран перебивает действующий набор для «а что если».
    Имена полей — как у ручки предпросчёта, то есть как в движке. */
export type ParamOverrides = {
  d: number;
  k_standard: number;
  k_transition: number;
  transition_matches: number;
  max_delta: number;
  cap_in_transition: boolean;
  prize_mode: 'match' | 'tournament' | 'none';
  baseline: 'sequential' | 'pre_tournament';
  ittf_r_max: number;
  ittf_k: number;
  level_c: Record<CompetitionLevel, number>;
  prize_p: Record<string, number>;
};

export const LEVEL_LABEL: Record<CompetitionLevel, string> = {
  top: 'Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12',
  republic: 'Чемпионаты РК по возрастам, ЕЛНТ, республиканские',
  region: 'Областные и городские',
  amateur: 'Любительские турниры',
};

/** Подпись поля настроек → ключ происхождения в ответе сервера (`sources`). */
export const SOURCE_KEY: Record<string, string> = {
  d: 'd',
  k_standard: 'k_standard',
  k_transition: 'k_transition',
  transition_matches: 'transition_matches',
  max_delta: 'max_delta',
  cap_in_transition: 'cap_in_transition',
  prize_mode: 'prize_mode',
  baseline: 'baseline',
  ittf_r_max: 'ittf_r_max',
  ittf_k: 'ittf_k',
  level_c: 'c_top',
  prize_p: 'p_first',
};
