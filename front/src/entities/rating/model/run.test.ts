/* Прогон серии матчей: то, что делает пилотный калькулятор. Правила —
   Положение о Национальном рейтинге (проект 28.08.2026), разделы 6, 9–13, 15. */

import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from './params';
import { runSeries } from './run';
import type { LabMatch, LabPlayer, LabTournament } from './types';

const п = (over: Partial<typeof DEFAULT_PARAMS> = {}) => ({ ...DEFAULT_PARAMS, ...over });

const игрок = (id: string, start: number, origin: LabPlayer['origin'] = 'перенос'): LabPlayer => ({
  id,
  name: id,
  origin,
  start,
  played: 0,
});

const матч = (id: string, a: string, b: string, over: Partial<LabMatch> = {}): LabMatch => ({
  id,
  tournament: 't1',
  a,
  b,
  games: [3, 1],
  ...over,
});

const турнир = (over: Partial<LabTournament> = {}): LabTournament => ({
  id: 't1',
  name: 'Чемпионат РК',
  level: 'республика',
  ...over,
});

describe('Прогон серии', () => {
  it('победитель растёт, проигравший падает, при равных K — зеркально', () => {
    const r = runSeries({
      players: [игрок('А', 20), игрок('Б', 20)],
      tournaments: [турнир()],
      matches: [матч('m1', 'А', 'Б')],
      params: п(),
    });
    const а = r.table.find((x) => x.id === 'А')!;
    const б = r.table.find((x) => x.id === 'Б')!;
    expect(а.rating).toBeGreaterThan(20);
    expect(б.rating).toBeLessThan(20);
    expect(а.rating - 20).toBeCloseTo(20 - б.rating, 10);
  });

  it('в истории у каждой строки «рейтинг до + изменение = рейтинг после» (§20)', () => {
    const r = runSeries({
      players: [игрок('А', 20), игрок('Б', 31)],
      tournaments: [турнир()],
      matches: [матч('m1', 'А', 'Б'), матч('m2', 'Б', 'А', { games: [3, 2] })],
      params: п(),
    });
    expect(r.history.length).toBe(4); // две строки на матч — по строке каждому
    for (const h of r.history) {
      expect(h.before + h.delta).toBeCloseTo(h.after, 10);
      expect(h.after).toBe(Number(h.after.toFixed(2)));
    }
  });

  it('счёт по партиям попадает в историю как «3:1» и не влияет на размер изменения', () => {
    const общий = { players: [игрок('А', 20), игрок('Б', 20)], tournaments: [турнир()], params: п() };
    const сухой = runSeries({ ...общий, matches: [матч('m1', 'А', 'Б', { games: [3, 0] })] });
    const впятой = runSeries({ ...общий, matches: [матч('m1', 'А', 'Б', { games: [3, 2] })] });
    expect(сухой.history[0].score).toBe('3:0');
    expect(впятой.history[0].score).toBe('3:2');
    // ⚠ S в формуле §9.2 — только победа/поражение: 3:0 и 3:2 дают одно и то же
    expect(сухой.table[0].rating).toBe(впятой.table[0].rating);
  });

  it('уровень соревнования множит изменение (§13)', () => {
    const прогон = (level: LabTournament['level']) =>
      runSeries({
        players: [игрок('А', 20), игрок('Б', 20)],
        tournaments: [турнир({ level })],
        matches: [матч('m1', 'А', 'Б')],
        params: п(),
      }).history[0].delta;
    expect(прогон('высшие')).toBeCloseTo(прогон('республика') * 1.2, 2);
    expect(прогон('любители')).toBeCloseTo(прогон('республика') * 0.6, 2);
  });
});

describe('Переходный период новичка (§11)', () => {
  const серия = (n: number, params = п()) => {
    const matches: LabMatch[] = [];
    const players: LabPlayer[] = [игрок('Н', 1, 'новый')];
    for (let i = 0; i < n; i++) {
      players.push(игрок('С' + i, 40));
      matches.push(матч('m' + i, 'Н', 'С' + i));
    }
    return runSeries({ players, tournaments: [турнир()], matches, params });
  };

  it('первые 20 матчей идут с переходным K, 21-й — со стандартным (§11.3–11.4)', () => {
    const r = серия(21, п({ kTransition: 3, kStandard: 0.6, maxDelta: 0 }));
    const свои = r.history.filter((h) => h.player === 'Н');
    expect(свои.slice(0, 20).every((h) => h.transition)).toBe(true);
    expect(свои[20].transition).toBe(false);
    expect(свои[19].K).toBe(3);
    expect(свои[20].K).toBe(0.6);
  });

  it('за переходный период новичок со старта 1,00 подтягивается к уровню соперников', () => {
    const r = серия(20, п({ kTransition: 3, kStandard: 0.6, maxDelta: 0 }));
    const н = r.table.find((x) => x.id === 'Н')!;
    expect(н.rating).toBeGreaterThan(30); // из 1,00 к уровню 40 за 20 побед
  });

  it('ограничение изменения за матч не даёт новичку дойти до своего уровня', () => {
    // Тот же прогон, но с потолком §12.1: 20 матчей × не больше 1,00 = максимум +20
    const r = серия(20, п({ kTransition: 3, kStandard: 0.6, maxDelta: 1, capInTransition: true }));
    const н = r.table.find((x) => x.id === 'Н')!;
    expect(н.rating).toBeLessThanOrEqual(21);
  });

  it('на перенесённый рейтинг переходный период не распространяется (§11.2)', () => {
    const r = runSeries({
      players: [игрок('П', 40, 'перенос'), игрок('С', 40)],
      tournaments: [турнир()],
      matches: [матч('m1', 'П', 'С')],
      params: п({ kTransition: 3, kStandard: 0.6 }),
    });
    expect(r.history.find((h) => h.player === 'П')!.K).toBe(0.6);
  });

  it('уже сыгранные матчи засчитываются в переходный период', () => {
    const r = runSeries({
      players: [{ ...игрок('Н', 12, 'новый'), played: 19 }, игрок('С', 40)],
      tournaments: [турнир()],
      matches: [матч('m1', 'Н', 'С'), матч('m2', 'Н', 'С')],
      params: п({ kTransition: 3, kStandard: 0.6 }),
    });
    const свои = r.history.filter((h) => h.player === 'Н');
    expect(свои[0].transition).toBe(true); // 20-й матч
    expect(свои[1].transition).toBe(false); // 21-й
  });
});

describe('Призовое место: два прочтения Положения (§9.2 против §10.6)', () => {
  const вход = {
    players: [игрок('А', 20), игрок('Б', 20), игрок('В', 20)],
    tournaments: [турнир({ places: { А: 1, Б: 2, В: 3 } })],
    matches: [матч('m1', 'А', 'Б'), матч('m2', 'А', 'В'), матч('m3', 'Б', 'В')],
  };

  it('«за матч» — P стоит в формуле каждого матча (§9.2)', () => {
    const r = runSeries({ ...вход, params: п({ prizeMode: 'заматч' }) });
    expect(r.history.find((h) => h.player === 'А')!.P).toBe(1.2);
  });

  it('«за турнир» — P множит итог турнира, в матчах P = 1 (§10.6)', () => {
    const r = runSeries({ ...вход, params: п({ prizeMode: 'затурнир' }) });
    expect(r.history.filter((h) => h.player === 'А').every((h) => h.P === 1)).toBe(true);
    const а = r.table.find((x) => x.id === 'А')!;
    const безP = runSeries({ ...вход, params: п({ prizeMode: 'нет' }) }).table.find((x) => x.id === 'А')!;
    expect(а.rating - 20).toBeCloseTo((безP.rating - 20) * 1.2, 2);
  });

  it('без потолка §12.1 два прочтения дают одно и то же число', () => {
    // P входит в формулу множителем, а умножение линейно: P × Σδ = Σ(P × δ).
    // Значит выбор между §9.2 и §10.6 — это выбор прозрачности (видно ли, за
    // какой матч начислено), а не выбор арифметики.
    const общее = { baseline: 'дотурнира' as const, maxDelta: 0 };
    const заМатч = runSeries({ ...вход, params: п({ ...общее, prizeMode: 'заматч' }) });
    const заТурнир = runSeries({ ...вход, params: п({ ...общее, prizeMode: 'затурнир' }) });
    for (const id of ['А', 'Б', 'В']) {
      const a = заМатч.table.find((x) => x.id === id)!.rating;
      const b = заТурнир.table.find((x) => x.id === id)!.rating;
      expect(a).toBeCloseTo(b, 1);
    }
  });

  it('с потолком §12.1 расходятся: «за матч» P упирается в потолок, «за турнир» — проходит мимо него', () => {
    const общее = { baseline: 'дотурнира' as const, maxDelta: 0.25 };
    const заМатч = runSeries({ ...вход, params: п({ ...общее, prizeMode: 'заматч' }) }).table.find(
      (x) => x.id === 'А',
    )!;
    const заТурнир = runSeries({ ...вход, params: п({ ...общее, prizeMode: 'затурнир' }) }).table.find(
      (x) => x.id === 'А',
    )!;
    expect(заТурнир.rating).toBeGreaterThan(заМатч.rating);
  });
});

describe('База расчёта внутри турнира', () => {
  const вход = {
    players: [игрок('А', 20), игрок('Б', 20), игрок('В', 20)],
    tournaments: [турнир()],
    matches: [матч('m1', 'А', 'Б'), матч('m2', 'А', 'В')],
  };

  it('«поматчево» — второй матч считается от рейтинга после первого', () => {
    const r = runSeries({ ...вход, params: п({ baseline: 'поматчево' }) });
    const свои = r.history.filter((h) => h.player === 'А');
    expect(свои[1].before).toBe(свои[0].after);
  });

  it('«от рейтинга до турнира» — оба матча считаются от значения на начало (§8.1)', () => {
    const r = runSeries({ ...вход, params: п({ baseline: 'дотурнира' }) });
    const свои = r.history.filter((h) => h.player === 'А');
    expect(свои[0].before).toBe(20);
    expect(свои[1].before).toBe(20);
    expect(r.table.find((x) => x.id === 'А')!.rating).toBeCloseTo(20 + свои[0].delta + свои[1].delta, 10);
  });
});

describe('Границы и устойчивость', () => {
  it('рейтинг не опускается ниже 0,00 (§15.15)', () => {
    const players = [игрок('Н', 0.1), игрок('С', 3)];
    const matches = Array.from({ length: 3 }, (_, i) => матч('m' + i, 'С', 'Н'));
    const r = runSeries({ players, tournaments: [турнир()], matches, params: п({ kStandard: 5, maxDelta: 0 }) });
    const н = r.table.find((x) => x.id === 'Н')!;
    expect(н.rating).toBe(0);
    // На нуле изменение обрезается до фактического, иначе история перестала бы
    // сходиться: «рейтинг до + изменение = рейтинг после» (§20).
    for (const h of r.history.filter((x) => x.player === 'Н')) expect(h.before + h.delta).toBeCloseTo(h.after, 10);
  });

  it('через поражения нижняя граница вообще недостижима: безнадёжный аутсайдер перестаёт терять', () => {
    // E при разрыве в 60 баллов и D = 15 — тысячные доли, изменение округляется
    // в ноль. Ноль из §15.15 достижим только штрафами за неявку (§15.4–15.6).
    const players = [игрок('Н', 0.1), игрок('С', 60)];
    const matches = Array.from({ length: 10 }, (_, i) => матч('m' + i, 'С', 'Н'));
    const r = runSeries({ players, tournaments: [турнир()], matches, params: п({ kStandard: 5, maxDelta: 0 }) });
    expect(r.table.find((x) => x.id === 'Н')!.rating).toBe(0.1);
  });

  it('повторный прогон той же серии даёт тот же результат — рейтинг не задваивается', () => {
    const вход = {
      players: [игрок('А', 20), игрок('Б', 25)],
      tournaments: [турнир()],
      matches: [матч('m1', 'А', 'Б'), матч('m2', 'Б', 'А')],
      params: п(),
    };
    expect(runSeries(вход).table).toEqual(runSeries(вход).table);
  });

  it('считает победы и поражения по каждому игроку', () => {
    const r = runSeries({
      players: [игрок('А', 20), игрок('Б', 20)],
      tournaments: [турнир()],
      matches: [матч('m1', 'А', 'Б'), матч('m2', 'А', 'Б'), матч('m3', 'Б', 'А')],
      params: п(),
    });
    const а = r.table.find((x) => x.id === 'А')!;
    expect([а.wins, а.losses, а.matches]).toEqual([2, 1, 3]);
  });

  it('показывает, сколько баллов система впрыснула сверх нуля: при разных K сумма не сохраняется', () => {
    const r = runSeries({
      players: [игрок('Н', 1, 'новый'), игрок('С', 40)],
      tournaments: [турнир()],
      matches: [матч('m1', 'Н', 'С')],
      params: п({ kTransition: 3, kStandard: 0.6, maxDelta: 0 }),
    });
    expect(r.injected).toBeGreaterThan(1); // новичок получил втрое больше, чем потерял соперник
  });

  it('матч игрока, которого нет в списке, не роняет расчёт, а помечается', () => {
    const r = runSeries({
      players: [игрок('А', 20)],
      tournaments: [турнир()],
      matches: [матч('m1', 'А', 'Икс')],
      params: п(),
    });
    expect(r.history).toHaveLength(0);
    expect(r.skipped).toHaveLength(1);
  });
});
