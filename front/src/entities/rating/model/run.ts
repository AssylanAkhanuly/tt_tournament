/* Прогон серии турниров: превращает список игроков и матчей в рейтинговую
   историю и итоговую таблицу. Правила — Положение о Национальном рейтинге
   (проект 28.08.2026), разделы 6, 9–13, 15.

   Здесь только арифметика Положения: ни ввода, ни хранения, ни экрана. Экран
   (features/rating-lab) собирает вход и показывает выход, а замена методики —
   это замена этого файла, а не правка интерфейса. */

import { matchDelta, expectedScore } from './elo';
import type { RatingParams } from './params';
import { prizeFactor } from './prize';
import { round2 } from './round';
import type { HistoryRow, LabMatch, LabPlayer, LabTournament, RunResult, Standing } from './types';

export type RunInput = {
  players: LabPlayer[];
  tournaments: LabTournament[];
  matches: LabMatch[];
  params: RatingParams;
};

type State = {
  player: LabPlayer;
  rating: number;
  played: number;
  wins: number;
  losses: number;
  matches: number;
  /** Накоплено за текущий турнир — нужно режиму «P за турнир» (§10.6). */
  inTournament: number;
};

export const runSeries = ({ players, tournaments, matches, params }: RunInput): RunResult => {
  const state = new Map<string, State>();
  for (const p of players) {
    state.set(p.id, {
      player: p,
      rating: round2(p.start),
      played: p.played ?? 0,
      wins: 0,
      losses: 0,
      matches: 0,
      inTournament: 0,
    });
  }

  const history: HistoryRow[] = [];
  const skipped: RunResult['skipped'] = [];
  const bonus = new Map<string, number>();

  const byTournament = new Map<string, LabMatch[]>();
  for (const m of matches) {
    const t = tournaments.find((x) => x.id === m.tournament);
    if (!t) {
      skipped.push({ matchId: m.id, reason: 'соревнование не найдено' });
      continue;
    }
    if (!state.has(m.a) || !state.has(m.b)) {
      skipped.push({ matchId: m.id, reason: 'участника нет в списке спортсменов' });
      continue;
    }
    if (m.a === m.b) {
      skipped.push({ matchId: m.id, reason: 'соперник совпадает со спортсменом' });
      continue;
    }
    if (m.games[0] === m.games[1]) {
      skipped.push({ matchId: m.id, reason: 'ничейный счёт — победитель не определён' });
      continue;
    }
    const list = byTournament.get(m.tournament);
    if (list) list.push(m);
    else byTournament.set(m.tournament, [m]);
  }

  for (const t of tournaments) {
    const list = byTournament.get(t.id);
    if (!list?.length) continue;

    const C = params.levelC[t.level] ?? 1;
    /** Рейтинги на начало турнира — база для режима «от рейтинга до турнира». */
    const opening = new Map<string, number>();
    for (const [id, s] of state) {
      opening.set(id, s.rating);
      s.inTournament = 0;
    }

    /** С какого значения считается матч: живое или на начало турнира (§8.1). */
    const base = (id: string) =>
      params.baseline === 'дотурнира' ? (opening.get(id) as number) : (state.get(id) as State).rating;

    for (const m of list) {
      const aWon = m.games[0] > m.games[1];
      const score = m.games[0] + ':' + m.games[1];

      const side = (id: string, otherId: string, won: boolean): HistoryRow => {
        const s = state.get(id) as State;
        const before = base(id);
        const opponent = base(otherId);

        // §11.2: переходный период — только у того, кто вошёл со стартом 1,00.
        const transition = s.player.origin === 'новый' && s.played < params.transitionMatches;
        const K = transition ? params.kTransition : params.kStandard;
        const P =
          params.prizeMode === 'заматч'
            ? prizeFactor(t.places?.[id], { noThirdPlaceMatch: t.noThirdPlaceMatch })
            : 1;
        // §12.1 действует на матч; переходный период режем только по настройке.
        const cap = !params.maxDelta || (transition && !params.capInTransition) ? 0 : params.maxDelta;

        const raw = matchDelta({ rating: before, opponent, won, D: params.D, K, C, P, maxDelta: 0 });
        const capped = cap > 0 && Math.abs(raw) > cap;
        let delta = round2(capped ? Math.sign(raw) * cap : raw);
        let after = round2(before + delta);
        if (after < params.minRating) {
          after = params.minRating;
          delta = round2(after - before);
        }

        return {
          matchId: m.id,
          tournament: t.id,
          tournamentName: t.name,
          date: m.date ?? t.date,
          player: id,
          playerName: s.player.name,
          opponent: otherId,
          opponentName: (state.get(otherId) as State).player.name,
          score: id === m.a ? score : m.games[1] + ':' + m.games[0],
          won,
          before,
          delta,
          after,
          expected: expectedScore(before, opponent, params.D),
          K,
          C,
          P,
          capped,
          transition,
        };
      };

      // Обе строки считаются от одного среза состояния: иначе второй игрок
      // увидел бы соперника уже изменившимся этим же матчем.
      const rowA = side(m.a, m.b, aWon);
      const rowB = side(m.b, m.a, !aWon);

      for (const row of [rowA, rowB]) {
        const s = state.get(row.player) as State;
        s.rating = params.baseline === 'дотурнира' ? round2(s.rating + row.delta) : row.after;
        s.inTournament = round2(s.inTournament + row.delta);
        s.played += 1;
        s.matches += 1;
        if (row.won) s.wins += 1;
        else s.losses += 1;
        history.push(row);
      }
    }

    // §10.6 во втором прочтении: P множит итог турнира, а не каждый матч.
    if (params.prizeMode === 'затурнир') {
      for (const [id, s] of state) {
        const P = prizeFactor(t.places?.[id], { noThirdPlaceMatch: t.noThirdPlaceMatch });
        if (P === 1 || !s.inTournament) continue;
        const add = round2(s.inTournament * (P - 1));
        s.rating = Math.max(params.minRating, round2(s.rating + add));
        bonus.set(id, round2((bonus.get(id) ?? 0) + add));
      }
    }

    for (const s of state.values()) s.rating = Math.max(params.minRating, round2(s.rating));
  }

  const table: Standing[] = players.map((p) => {
    const s = state.get(p.id) as State;
    return {
      id: p.id,
      name: p.name,
      origin: p.origin,
      start: round2(p.start),
      rating: s.rating,
      delta: round2(s.rating - round2(p.start)),
      matches: s.matches,
      wins: s.wins,
      losses: s.losses,
      transitionLeft: p.origin === 'новый' ? Math.max(0, params.transitionMatches - s.played) : 0,
      prizeBonus: bonus.get(p.id) ?? 0,
    };
  });

  const injected = round2(table.reduce((acc, r) => acc + r.delta, 0));

  return { history, table, injected, skipped };
};
