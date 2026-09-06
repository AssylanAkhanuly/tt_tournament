/* Модель Национального рейтинга спортсменов РК.

   Источник правды — Положение о формировании и ведении Национального рейтинга
   спортсменов Республики Казахстан по настольному теннису, проект от
   28.08.2026. Оригинал: docs/refs/polozhenie-reyting-igrokov-2026-08-28.docx,
   разбор с открытыми местами — рядом, в .md.

   Слой чистый: ни React, ни сети. Экран зовёт эти функции, а не наоборот. */

/** Уровень соревнования — таблица §13 Положения. */
export type Level = 'высшие' | 'республика' | 'область' | 'любители';

/** Откуда у спортсмена стартовое значение. От этого зависит переходный период:
    §11.2 даёт его только тому, кто начинает с 1,00. */
export type Origin = 'новый' | 'перенос' | 'ittf';

export type LabPlayer = {
  id: string;
  name: string;
  origin: Origin;
  /** Стартовый рейтинг: 1,00 для нового (§6.1), перенесённое значение (§6.3)
      либо пересчёт из позиции ITTF (§17.4). */
  start: number;
  /** Рейтинговых матчей до начала прогона — переходный период (§11.3) считает
      их наравне с сыгранными в прогоне. */
  played?: number;
  /** Позиция в ITTF World Ranking — только для origin = 'ittf'. */
  ittfPosition?: number;
  /** Подтверждённых неявок без уважительной причины до прогона (§15.4–15.6). */
  noShows?: number;
};

export type LabTournament = {
  id: string;
  name: string;
  level: Level;
  date?: string;
  /** Итоговые места: id спортсмена → место. Нужны для коэффициента P (§10). */
  places?: Record<string, number>;
  /** Матча за 3-е место не было — оба полуфиналиста бронзовые (§10.4). */
  noThirdPlaceMatch?: boolean;
};

export type LabMatch = {
  id: string;
  tournament: string;
  a: string;
  b: string;
  /** Счёт по партиям, победитель — у кого больше. §14.3: счёт обязателен. */
  games: [number, number];
  date?: string;
};

/** Строка рейтинговой истории — колонки таблицы §20 Положения плюс то, из чего
    сложилось изменение: без этого «прозрачность» §4.6 остаётся словом. */
export type HistoryRow = {
  matchId: string;
  tournament: string;
  tournamentName: string;
  date?: string;
  player: string;
  playerName: string;
  opponent: string;
  opponentName: string;
  score: string;
  won: boolean;
  before: number;
  delta: number;
  after: number;
  /** Ожидаемый результат E (§9.3) — почему изменение именно такое. */
  expected: number;
  K: number;
  C: number;
  P: number;
  /** Изменение упёрлось в потолок §12.1. */
  capped: boolean;
  /** Матч попал в переходный период новичка (§11.2). */
  transition: boolean;
};

export type Standing = {
  id: string;
  name: string;
  origin: Origin;
  start: number;
  rating: number;
  delta: number;
  matches: number;
  wins: number;
  losses: number;
  /** Осталось матчей переходного периода (§11.3); 0 — период пройден. */
  transitionLeft: number;
  /** Надбавка за призовое место в режиме «P за турнир» (§10.6): она не
      привязана к конкретному матчу, поэтому и стоит отдельной величиной. */
  prizeBonus: number;
};

export type SkippedMatch = { matchId: string; reason: string };

export type RunResult = {
  history: HistoryRow[];
  table: Standing[];
  /** Сколько баллов система создала из ниоткуда: сумма всех изменений. У
      строгой модели Эло она равна нулю; здесь — нет, потому что K у сторон
      бывает разный, а P > 1 добавляет призёрам. Показатель инфляции шкалы. */
  injected: number;
  skipped: SkippedMatch[];
};
