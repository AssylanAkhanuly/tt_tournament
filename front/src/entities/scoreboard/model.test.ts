// Логику счёта проверяем юнитами: тот же редьюсер крутится и на сервере, и на
// пульте, ошибка тут сразу уходит в эфир.

import { describe, expect, it } from 'vitest';

import {
  computeStatus,
  currentServer,
  DEFAULT_STATE,
  isDoubles,
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


describe('подача', () => {
  const at = (a: number, b: number, patch: Partial<ScoreboardState> = {}) =>
    state({
      ...patch,
      left: { ...DEFAULT_STATE.left, ...patch.left, points: a },
      right: { ...DEFAULT_STATE.right, ...patch.right, points: b },
    });

  const pair = (patch: Partial<ScoreboardState> = {}) => ({
    left: { ...DEFAULT_STATE.left, name: 'A', name2: 'A2', ...patch.left },
    right: { ...DEFAULT_STATE.right, name: 'B', name2: 'B2', ...patch.right },
  });

  it('без отметки подающего не показываем', () => {
    expect(currentServer(at(4, 3))).toBe('');
  });

  it('в одиночке подача переходит через два очка', () => {
    const s = (a: number, b: number) => currentServer(at(a, b, { first_server: 'left1' }));
    expect(s(0, 0)).toBe('left1');
    expect(s(1, 0)).toBe('left1');
    expect(s(2, 0)).toBe('right1');
    expect(s(2, 1)).toBe('right1');
    expect(s(2, 2)).toBe('left1');
  });

  it('от 10:10 подача переходит каждое очко', () => {
    const s = (a: number, b: number) => currentServer(at(a, b, { first_server: 'left1' }));
    expect(s(9, 9)).toBe('right1'); // 18 очков — ещё по два
    expect(s(10, 10)).toBe('left1');
    expect(s(11, 10)).toBe('right1');
    expect(s(11, 11)).toBe('left1');
  });

  it('в паре подающие идут по кругу из четырёх', () => {
    const s = (a: number, b: number) => currentServer(at(a, b, { first_server: 'left1', ...pair() }));
    expect(s(0, 0)).toBe('left1');
    expect(s(2, 0)).toBe('right1');
    expect(s(4, 0)).toBe('left2');
    expect(s(6, 0)).toBe('right2');
    expect(s(8, 0)).toBe('left1'); // круг замкнулся
  });

  it('пара определяется вторым именем, а не переключателем', () => {
    expect(isDoubles(state())).toBe(false);
    expect(isDoubles(state(pair()))).toBe(true);
  });

  it('отметка подающего пересчитывает, кто начинал партию', () => {
    // На 3:2 подача сменилась дважды; отмечаем правого — начинал тоже правый.
    const after = reduce(at(3, 2), { type: 'serve', slot: 'right1' });
    expect(after.first_server).toBe('right1');
    expect(currentServer(after)).toBe('right1');
  });

  it('слот пары в одиночном разряде игнорируется', () => {
    const before = at(0, 0, { first_server: 'left1' });
    expect(reduce(before, { type: 'serve', slot: 'left2' })).toBe(before);
  });

  it('новую партию начинает тот, кто принимал', () => {
    const after = reduce(at(11, 5, { first_server: 'left1' }), { type: 'finishGame' });
    expect(after.first_server).toBe('right1');
    expect(currentServer(after)).toBe('right1'); // очки обнулились
  });

  it('смена сторон переносит подачу вместе с игроком', () => {
    const after = reduce(at(0, 0, { first_server: 'left1' }), { type: 'swap' });
    expect(after.first_server).toBe('right1');
  });
});

describe('карточки и тайм-аут', () => {
  it('карточка идёт по кругу: нет → жёлтая → красная → нет', () => {
    let s = state();
    s = reduce(s, { type: 'card', side: 'left' });
    expect(s.left.card).toBe('yellow');
    s = reduce(s, { type: 'card', side: 'left' });
    expect(s.left.card).toBe('red');
    s = reduce(s, { type: 'card', side: 'left' });
    expect(s.left.card).toBe('');
    expect(s.right.card).toBe(''); // соседа не трогали
  });

  it('тайм-аут переключается', () => {
    const after = reduce(state(), { type: 'timeout', side: 'right' });
    expect(after.right.timeout).toBe(true);
    expect(reduce(after, { type: 'timeout', side: 'right' }).right.timeout).toBe(false);
  });

  it('новый матч снимает карточки, тайм-ауты и подачу', () => {
    const before = state({
      first_server: 'left1',
      left: { ...DEFAULT_STATE.left, card: 'red', timeout: true, points: 7 },
    });
    const after = reduce(before, { type: 'resetMatch' });
    expect(after.first_server).toBe('');
    expect(after.left.card).toBe('');
    expect(after.left.timeout).toBe(false);
  });
});
