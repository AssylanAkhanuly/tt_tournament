// Логику счёта проверяем юнитами: тот же редьюсер крутится и на сервере, и на
// пульте, ошибка тут сразу уходит в эфир.

import { describe, expect, it } from 'vitest';

import {
  computeStatus,
  DEFAULT_STATE,
  isGameOver,
  isMatchOver,
  gamesToWin,
  reduce,
  statusText,
  type ScoreboardState,
} from './model';

const state = (patch: Partial<ScoreboardState> = {}): ScoreboardState => ({
  ...DEFAULT_STATE,
  ...patch,
  left: { ...DEFAULT_STATE.left, ...patch.left },
  right: { ...DEFAULT_STATE.right, ...patch.right },
  team: { ...DEFAULT_STATE.team, ...patch.team },
});

describe('очки и партии', () => {
  it('плюс и минус меняют счёт своей стороны', () => {
    const after = reduce(reduce(DEFAULT_STATE, { type: 'point', side: 'left', delta: 1 }), {
      type: 'point',
      side: 'right',
      delta: 1,
    });
    expect(after.left.points).toBe(1);
    expect(after.right.points).toBe(1);
  });

  it('в минус счёт не уходит', () => {
    const after = reduce(DEFAULT_STATE, { type: 'point', side: 'left', delta: -1 });
    expect(after.left.points).toBe(0);
  });

  it('партия уходит лидеру, очки обнуляются', () => {
    const after = reduce(state({ left: { ...DEFAULT_STATE.left, points: 11 } }), {
      type: 'finishGame',
    });
    expect(after.left.games).toBe(1);
    expect(after.right.games).toBe(0);
    expect(after.left.points).toBe(0);
    expect(after.right.points).toBe(0);
  });

  it('при равном счёте партию не закрываем', () => {
    const before = state({
      left: { ...DEFAULT_STATE.left, points: 10 },
      right: { ...DEFAULT_STATE.right, points: 10 },
    });
    expect(reduce(before, { type: 'finishGame' })).toBe(before);
  });

  it('смена сторон меняет игроков и командный счёт местами', () => {
    const before = state({ team: { enabled: true, left: 1, right: 2 } });
    const after = reduce(before, { type: 'swap' });
    expect(after.left.name).toBe(before.right.name);
    expect(after.right.name).toBe(before.left.name);
    expect(after.team.left).toBe(2);
    expect(after.team.right).toBe(1);
  });

  it('новый матч обнуляет счёт, но оставляет имена', () => {
    const before = state({ left: { ...DEFAULT_STATE.left, points: 7, games: 2 } });
    const after = reduce(before, { type: 'resetMatch' });
    expect(after.left).toMatchObject({ name: before.left.name, points: 0, games: 0 });
  });
});

describe('автоподпись по счёту', () => {
  const withPoints = (a: number, b: number, patch: Partial<ScoreboardState> = {}) =>
    state({
      ...patch,
      // очки задаём последними: в patch.left может прилететь копия DEFAULT_STATE
      left: { ...DEFAULT_STATE.left, ...patch.left, points: a },
      right: { ...DEFAULT_STATE.right, ...patch.right, points: b },
    });

  it('до 10 очков подписи нет', () => {
    expect(computeStatus(withPoints(9, 5))).toBe('none');
  });

  it('10 очков у лидера — сетбол', () => {
    expect(computeStatus(withPoints(10, 9))).toBe('game');
    expect(statusText(withPoints(10, 9))).toBe('GAME POINT');
  });

  it('равный счёт от 10 — «ровно»', () => {
    expect(computeStatus(withPoints(10, 10))).toBe('deuce');
    expect(computeStatus(withPoints(13, 13))).toBe('deuce');
  });

  it('на решающей партии — матчбол', () => {
    const s = withPoints(10, 4, { left: { ...DEFAULT_STATE.left, games: 2 } });
    expect(computeStatus(s)).toBe('match');
    expect(statusText({ ...s, status_lang: 'ru' })).toBe('МАТЧБОЛ');
  });

  it('доигранная партия подпись снимает', () => {
    expect(computeStatus(withPoints(11, 5))).toBe('none');
  });

  it('ручная подпись перебивает автоматическую', () => {
    expect(statusText(withPoints(10, 9, { status_override: 'TIME OUT' }))).toBe('TIME OUT');
    expect(statusText(withPoints(10, 9, { status_override: '' }))).toBe('');
  });

  it('матч до 5 и до 7 партий требует разного числа побед', () => {
    expect(gamesToWin(5)).toBe(3);
    expect(gamesToWin(7)).toBe(4);
    expect(isMatchOver(state({ left: { ...DEFAULT_STATE.left, games: 3 } }))).toBe(true);
    expect(isMatchOver(state({ best_of: 7, left: { ...DEFAULT_STATE.left, games: 3 } }))).toBe(false);
  });

  it('партия считается доигранной по 11 очкам с разрывом в два', () => {
    expect(isGameOver(withPoints(11, 9))).toBe(true);
    expect(isGameOver(withPoints(11, 10))).toBe(false);
  });
});

describe('patch', () => {
  it('меняет имя и приводит код страны к верхнему регистру', () => {
    const after = reduce(DEFAULT_STATE, {
      type: 'patch',
      patch: { left: { name: 'Иванов И.', country: 'kaz' } },
    });
    expect(after.left.name).toBe('Иванов И.');
    expect(after.left.country).toBe('KAZ');
    expect(after.right).toEqual(DEFAULT_STATE.right);
  });

  it('пустое имя разрешено (плашка без фамилии)', () => {
    expect(reduce(DEFAULT_STATE, { type: 'patch', patch: { left: { name: '' } } }).left.name).toBe(
      '',
    );
  });

  it('игнорирует недопустимые значения', () => {
    const after = reduce(DEFAULT_STATE, {
      type: 'patch',
      // @ts-expect-error — проверяем защиту от мусора из тела запроса
      patch: { best_of: 3, visible: 'да', match_label: 42 },
    });
    expect(after.best_of).toBe(DEFAULT_STATE.best_of);
    expect(after.visible).toBe(DEFAULT_STATE.visible);
    expect(after.match_label).toBe(DEFAULT_STATE.match_label);
  });
});

