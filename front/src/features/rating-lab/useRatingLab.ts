'use client';

/* Состояние экрана калибровки: спортсмены, соревнования, матчи, коэффициенты.

   Считает не он ✳ (10.09.2026): расчёт живёт на бэкенде, экран шлёт набор в
   ручку предпросчёта и показывает ответ. Прежняя TypeScript-копия движка
   удалена — две реализации одной методики неизбежно разъезжаются, а спорить с
   федерацией о числе, которое посчитано «не тем» движком, нечем.

   Цена решения видна прямо здесь: каждое изменение коэффициента — запрос, и
   поэтому он с задержкой (`usePreview`). */

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useRatingParams,
  usePreview,
  type PreviewMatch,
  type PreviewPlayer,
  type PreviewTournament,
  type RatingParams,
} from '@/entities/rating';
import type { LabMatchInput, LabPlayerInput, LabTournamentInput, ParamOverrides } from './types';

/* Идентификаторы новых записей. Счётчик крутится ТОЛЬКО в обработчиках — то
   есть уже на клиенте. Случайное значение в инициализаторе useState недопустимо:
   сервер отрисует одни идентификаторы, клиент при гидратации — другие, и место в
   турнире привяжется к «другому» игроку. Именно так и было: коэффициент
   призового места молча не применялся. */
let seq = 100;
const nextId = (prefix: string) => prefix + '-' + ++seq;

/* Стартовый набор — пример из Приложения 2 Положения (спортсмены А и Б, 16,00 и
   19,00) плюс те случаи, ради которых калибровка и нужна: действующие МС и КМС
   с перенесённым рейтингом (п. 6.3), новичок со старта 1,00 (п. 6.1) и
   легионер, чей старт считается из позиции ITTF (п. 17.4). */
const ДЕМО_ИГРОКИ: LabPlayerInput[] = [
  { id: 'p1', name: 'Спортсмен А', origin: 'legacy', legacy: 16, ittfPosition: 100, played: 40 },
  { id: 'p2', name: 'Спортсмен Б', origin: 'legacy', legacy: 19, ittfPosition: 100, played: 40 },
  { id: 'p3', name: 'Мастер спорта', origin: 'legacy', legacy: 50, ittfPosition: 100, played: 120 },
  { id: 'p4', name: 'Кандидат в мастера', origin: 'legacy', legacy: 40, ittfPosition: 100, played: 90 },
  { id: 'p5', name: 'Новичок', origin: 'new', legacy: 1, ittfPosition: 100, played: 0 },
  { id: 'p6', name: 'Легионер (ITTF 100)', origin: 'ittf', legacy: 1, ittfPosition: 100, played: 60 },
];

const ДЕМО_ТУРНИР: LabTournamentInput = {
  id: 't1',
  name: 'Чемпионат Республики Казахстан',
  level: 'top',
  places: {},
  noThirdPlaceMatch: false,
};

/** Действующий набор с сервера → перебиваемые значения экрана. */
const toOverrides = (p: RatingParams): ParamOverrides => ({
  d: p.d,
  k_standard: p.kStandard,
  k_transition: p.kTransition,
  transition_matches: p.transitionMatches,
  max_delta: p.maxDelta,
  cap_in_transition: p.capInTransition,
  prize_mode: p.prizeMode,
  baseline: p.baseline,
  ittf_r_max: p.ittfRMax,
  ittf_k: p.ittfK,
  level_c: { top: p.cTop, republic: p.cRepublic, region: p.cRegion, amateur: p.cAmateur },
  prize_p: { 1: p.pFirst, 2: p.pSecond, 3: p.pThird },
});

export function useRatingLab() {
  const [players, setPlayers] = useState<LabPlayerInput[]>(ДЕМО_ИГРОКИ);
  const [tournaments, setTournaments] = useState<LabTournamentInput[]>([ДЕМО_ТУРНИР]);
  const [matches, setMatches] = useState<LabMatchInput[]>([]);
  const [overrides, setOverrides] = useState<ParamOverrides | null>(null);

  const server = useRatingParams();

  // Экран стартует с действующих коэффициентов: калибровка это «а что если
  // подвинуть вот от этого», а не подбор с нуля каждый раз.
  useEffect(() => {
    if (server.data && !overrides) setOverrides(toOverrides(server.data));
  }, [server.data, overrides]);

  const setParams = useCallback((patch: Partial<ParamOverrides>) => {
    setOverrides((p) => (p ? { ...p, ...patch } : p));
  }, []);

  const resetParams = useCallback(() => {
    if (server.data) setOverrides(toOverrides(server.data));
  }, [server.data]);

  /** Сохранить подобранное как действующее — только федерация (сервер проверит). */
  const publishParams = useCallback(async () => {
    if (!overrides) return;
    await server.save({
      d: overrides.d,
      k_standard: overrides.k_standard,
      k_transition: overrides.k_transition,
      transition_matches: overrides.transition_matches,
      max_delta: overrides.max_delta,
      cap_in_transition: overrides.cap_in_transition,
      prize_mode: overrides.prize_mode,
      baseline: overrides.baseline,
      ittf_r_max: overrides.ittf_r_max,
      ittf_k: overrides.ittf_k,
      c_top: overrides.level_c.top,
      c_republic: overrides.level_c.republic,
      c_region: overrides.level_c.region,
      c_amateur: overrides.level_c.amateur,
      p_first: overrides.prize_p['1'],
      p_second: overrides.prize_p['2'],
      p_third: overrides.prize_p['3'],
    });
  }, [overrides, server]);

  /* ── Спортсмены ─────────────────────────────────────────────── */

  const addPlayer = useCallback(() => {
    setPlayers((list) => [
      ...list,
      {
        id: nextId('p'),
        name: 'Спортсмен ' + (list.length + 1),
        origin: 'new',
        legacy: 1,
        ittfPosition: 100,
        played: 0,
      },
    ]);
  }, []);

  const updatePlayer = useCallback((id: string, patch: Partial<LabPlayerInput>) => {
    setPlayers((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers((list) => list.filter((p) => p.id !== id));
    setMatches((list) => list.filter((m) => m.a !== id && m.b !== id));
    setTournaments((list) =>
      list.map((t) => {
        if (!t.places[id]) return t;
        const places = { ...t.places };
        delete places[id];
        return { ...t, places };
      }),
    );
  }, []);

  /* ── Соревнования ───────────────────────────────────────────── */

  const addTournament = useCallback(() => {
    setTournaments((list) => [
      ...list,
      {
        id: nextId('t'),
        name: 'Соревнование ' + (list.length + 1),
        level: 'republic',
        places: {},
        noThirdPlaceMatch: false,
      },
    ]);
  }, []);

  const updateTournament = useCallback((id: string, patch: Partial<LabTournamentInput>) => {
    setTournaments((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeTournament = useCallback((id: string) => {
    setTournaments((list) => list.filter((t) => t.id !== id));
    setMatches((list) => list.filter((m) => m.tournament !== id));
  }, []);

  /** Место в турнире: пустое значение снимает его с того, кто занимал (п. 10.5). */
  const setPlace = useCallback((tournamentId: string, playerId: string, place: number | null) => {
    setTournaments((list) =>
      list.map((t) => {
        if (t.id !== tournamentId) return t;
        const places = { ...t.places };
        if (place) for (const key of Object.keys(places)) if (places[key] === place) delete places[key];
        if (place) places[playerId] = place;
        else delete places[playerId];
        return { ...t, places };
      }),
    );
  }, []);

  /* ── Матчи ──────────────────────────────────────────────────── */

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

  /** Круговая всех со всеми: побеждает более сильный по стартовому рейтингу —
      на таком раскладе видно поведение шкалы при ожидаемых результатах. */
  const fillRoundRobin = useCallback(() => {
    const t = tournaments[0];
    if (!t || players.length < 2) return;
    const вес = (p: LabPlayerInput) =>
      p.origin === 'new' ? 1 : p.origin === 'ittf' ? 1000 - p.ittfPosition : p.legacy;
    const list: LabMatchInput[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const [сильный, слабый] =
          вес(players[i]) >= вес(players[j]) ? [players[i], players[j]] : [players[j], players[i]];
        list.push({
          id: nextId('m'),
          tournament: t.id,
          a: сильный.id,
          b: слабый.id,
          games: [3, 1],
        });
      }
    }
    setMatches(list);
  }, [players, tournaments]);

  /* ── Расчёт: считает сервер ─────────────────────────────────── */

  const previewInput = useMemo(
    () => ({
      players: players.map<PreviewPlayer>((p) => ({
        id: p.id,
        name: p.name,
        origin: p.origin,
        start: p.legacy,
        played: p.played,
        ittf_position: p.origin === 'ittf' ? p.ittfPosition : null,
      })),
      tournaments: tournaments.map<PreviewTournament>((t) => ({
        id: t.id,
        name: t.name,
        level: t.level,
        places: t.places,
        no_third_place_match: t.noThirdPlaceMatch,
      })),
      matches: matches.map<PreviewMatch>((m) => ({
        id: m.id,
        tournament: m.tournament,
        a: m.a,
        b: m.b,
        games: m.games,
      })),
      params: overrides ? (overrides as unknown as Record<string, unknown>) : undefined,
    }),
    [players, tournaments, matches, overrides],
  );

  const preview = usePreview(previewInput);

  /** Стартовое значение спортсмена считает сервер (п. 6.1, 6.3, 17.4) — здесь
      оно только достаётся из ответа, чтобы формула не появилась на фронте. */
  const startOf = useCallback(
    (id: string): number | null => preview.data?.table.find((r) => r.id === id)?.start ?? null,
    [preview.data],
  );

  return {
    players,
    tournaments,
    matches,
    params: overrides,
    sources: server.data?.sources ?? {},
    serverParams: server.data,
    paramsLoading: server.loading,
    paramsError: server.error,
    saving: server.saving,
    saveError: server.saveError,
    result: preview.data,
    calculating: preview.loading,
    error: preview.error,
    startOf,
    setParams,
    resetParams,
    publishParams,
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

export type LabState = ReturnType<typeof useRatingLab>;
