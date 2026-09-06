'use client';

/* Состояние пилотного калькулятора рейтинга: спортсмены, соревнования, матчи,
   параметры. Считает не он — счёт живёт в `entities/rating`; здесь только сбор
   ввода и его передача в расчёт. Поменяется методика — поменяется entities,
   а этот файл и экраны останутся. */

import { useCallback, useMemo, useState } from 'react';
import {
  DEFAULT_PARAMS,
  fromIttfPosition,
  runSeries,
  type LabMatch,
  type LabPlayer,
  type LabTournament,
  type Level,
  type Origin,
  type RatingParams,
  type RunResult,
} from '@/entities/rating';

/** Спортсмен, как его вводят на экране: происхождение плюс то, что нужно
    именно ему — перенесённое значение либо позиция в ITTF. */
export type LabPlayerInput = {
  id: string;
  name: string;
  origin: Origin;
  /** Прежний рейтинг для origin = 'перенос' (§6.3). */
  legacy: number;
  /** Позиция в ITTF World Ranking для origin = 'ittf' (§17.3). */
  ittfPosition: number;
  /** Рейтинговых матчей до прогона — переходный период (§11.3). */
  played: number;
};

export type LabMatchInput = LabMatch;

/* Идентификаторы новых записей. Счётчик крутится ТОЛЬКО в обработчиках — то
   есть уже на клиенте. Случайное значение в инициализаторе useState недопустимо:
   сервер отрисует одни идентификаторы, клиент при гидратации — другие, и место в
   турнире привяжется к «другому» игроку. Именно так и было: демо-игроки жили с
   разными id на сервере и на клиенте, коэффициент места молча не применялся.
   Поэтому стартовые данные имеют постоянные id, а `nextId` начинает после них. */
let seq = 100;
const nextId = (prefix: string) => prefix + '-' + ++seq;

/** Стартовое значение по происхождению: §6.1, §6.3, §17.4. */
export const startRating = (p: LabPlayerInput, params: RatingParams): number => {
  if (p.origin === 'новый') return 1;
  if (p.origin === 'ittf') return fromIttfPosition(p.ittfPosition, params.ittf);
  return p.legacy;
};

/* Стартовый набор — пример из Приложения 2 Положения (спортсмены А и Б, 16,00 и
   19,00) плюс те случаи, ради которых пилот и нужен: действующие МС и КМС, чей
   рейтинг перенесён (§6.3), новичок со старта 1,00 (§6.1) и легионер, чей старт
   считается из позиции ITTF (§17.4). */
const ДЕМО_ИГРОКИ: LabPlayerInput[] = [
  { id: 'p1', name: 'Спортсмен А', origin: 'перенос', legacy: 16, ittfPosition: 100, played: 40 },
  { id: 'p2', name: 'Спортсмен Б', origin: 'перенос', legacy: 19, ittfPosition: 100, played: 40 },
  { id: 'p3', name: 'Мастер спорта', origin: 'перенос', legacy: 50, ittfPosition: 100, played: 120 },
  { id: 'p4', name: 'Кандидат в мастера', origin: 'перенос', legacy: 40, ittfPosition: 100, played: 90 },
  { id: 'p5', name: 'Новичок', origin: 'новый', legacy: 1, ittfPosition: 100, played: 0 },
  { id: 'p6', name: 'Легионер (ITTF 100)', origin: 'ittf', legacy: 1, ittfPosition: 100, played: 60 },
];

export type LabState = ReturnType<typeof useRatingLab>;

export function useRatingLab() {
  const [players, setPlayers] = useState<LabPlayerInput[]>(ДЕМО_ИГРОКИ);
  const [tournaments, setTournaments] = useState<LabTournament[]>(() => [
    { id: 't1', name: 'Чемпионат Республики Казахстан', level: 'высшие', date: '2026-10-01' },
  ]);
  const [matches, setMatches] = useState<LabMatchInput[]>([]);
  const [params, setParamsState] = useState<RatingParams>(DEFAULT_PARAMS);

  const setParams = useCallback(
    (patch: Partial<RatingParams>) => setParamsState((p) => ({ ...p, ...patch })),
    [],
  );

  const addPlayer = useCallback((name = '') => {
    const id = nextId('p');
    setPlayers((list) => [
      ...list,
      { id, name: name || 'Спортсмен ' + (list.length + 1), origin: 'новый', legacy: 1, ittfPosition: 100, played: 0 },
    ]);
    return id;
  }, []);

  const updatePlayer = useCallback((id: string, patch: Partial<LabPlayerInput>) => {
    setPlayers((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((list) => list.filter((p) => p.id !== id));
    setMatches((list) => list.filter((m) => m.a !== id && m.b !== id));
    setTournaments((list) =>
      list.map((t) => {
        if (!t.places?.[id]) return t;
        const places = { ...t.places };
        delete places[id];
        return { ...t, places };
      }),
    );
  }, []);

  const addTournament = useCallback(() => {
    setTournaments((list) => [
      ...list,
      { id: nextId('t'), name: 'Соревнование ' + (list.length + 1), level: 'республика' as Level },
    ]);
  }, []);

  const updateTournament = useCallback((id: string, patch: Partial<LabTournament>) => {
    setTournaments((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeTournament = useCallback((id: string) => {
    setTournaments((list) => list.filter((t) => t.id !== id));
    setMatches((list) => list.filter((m) => m.tournament !== id));
  }, []);

  /** Место в турнире: пустое значение убирает игрока из призёров (§10.5). */
  const setPlace = useCallback((tournamentId: string, playerId: string, place: number | null) => {
    setTournaments((list) =>
      list.map((t) => {
        if (t.id !== tournamentId) return t;
        const places = { ...(t.places ?? {}) };
        // Место занято одним человеком: тот, у кого оно было, его теряет.
        if (place) for (const key of Object.keys(places)) if (places[key] === place) delete places[key];
        if (place) places[playerId] = place;
        else delete places[playerId];
        return { ...t, places };
      }),
    );
  }, []);

  const addMatch = useCallback(() => {
    setMatches((list) => {
      const t = tournaments[0];
      const a = players[0];
      const b = players[1] ?? players[0];
      if (!t || !a || !b) return list;
      return [...list, { id: nextId('m'), tournament: t.id, a: a.id, b: b.id, games: [3, 1] }];
    });
  }, [players, tournaments]);

  const updateMatch = useCallback((id: string, patch: Partial<LabMatchInput>) => {
    setMatches((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const removeMatch = useCallback((id: string) => {
    setMatches((list) => list.filter((m) => m.id !== id));
  }, []);

  const clearMatches = useCallback(() => setMatches([]), []);

  /** Круговая всех со всеми. Побеждает более сильный по стартовому рейтингу:
      на таком раскладе видно поведение шкалы при ожидаемых результатах — а
      серию сенсаций всегда можно набрать, поменяв счёт в строках. */
  const fillRoundRobin = useCallback(() => {
    const t = tournaments[0];
    if (!t || players.length < 2) return;
    const list: LabMatchInput[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const [сильный, слабый] =
          startRating(players[i], params) >= startRating(players[j], params)
            ? [players[i], players[j]]
            : [players[j], players[i]];
        list.push({ id: nextId('m'), tournament: t.id, a: сильный.id, b: слабый.id, games: [3, 1] });
      }
    }
    setMatches(list);
  }, [players, tournaments, params]);

  const labPlayers = useMemo<LabPlayer[]>(
    () =>
      players.map((p) => ({
        id: p.id,
        name: p.name,
        origin: p.origin,
        start: startRating(p, params),
        played: p.played,
        ittfPosition: p.ittfPosition,
      })),
    [players, params],
  );

  const result = useMemo<RunResult>(
    () => runSeries({ players: labPlayers, tournaments, matches, params }),
    [labPlayers, tournaments, matches, params],
  );

  return {
    players,
    labPlayers,
    tournaments,
    matches,
    params,
    result,
    setParams,
    addPlayer,
    updatePlayer,
    removePlayer,
    addTournament,
    updateTournament,
    removeTournament,
    setPlace,
    addMatch,
    updateMatch,
    removeMatch,
    clearMatches,
    fillRoundRobin,
  };
}
