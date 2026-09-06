/* Наблюдения за шкалой: то, ради чего федерация просила пилот — «посмотреть
   показатели». Считаем не по Положению, а по его следствиям. */

import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from './params';
import { matchesToLevel, winShare } from './analysis';

describe('Что означает выбранное D', () => {
  it('доля побед сильного растёт при узкой шкале и падает при широкой', () => {
    expect(winShare(50, 40, 10)).toBeGreaterThan(winShare(50, 40, 30));
  });

  it('при равных рейтингах — половина', () => {
    expect(winShare(40, 40, 15)).toBeCloseTo(0.5, 10);
  });
});

describe('Сколько матчей новичку до уровня', () => {
  it('без потолка новичок доходит до 40 за десятки матчей, а не за сотни', () => {
    const n = matchesToLevel({ from: 1, level: 40, params: { ...DEFAULT_PARAMS, maxDelta: 0 } });
    expect(n).not.toBeNull();
    expect(n!).toBeLessThan(60);
  });

  it('потолок 1,00 в переходном периоде растягивает путь в разы', () => {
    const свободно = matchesToLevel({ from: 1, level: 40, params: { ...DEFAULT_PARAMS, maxDelta: 0 } })!;
    const сПотолком = matchesToLevel({
      from: 1,
      level: 40,
      params: { ...DEFAULT_PARAMS, maxDelta: 1, capInTransition: true },
    })!;
    expect(сПотолком).toBeGreaterThan(свободно);
  });

  it('возвращает null, если при таких параметрах уровень недостижим', () => {
    expect(matchesToLevel({ from: 1, level: 40, params: { ...DEFAULT_PARAMS, kStandard: 0, kTransition: 0 } })).toBeNull();
  });

  it('нулевой путь, если игрок уже на уровне', () => {
    expect(matchesToLevel({ from: 40, level: 40, params: DEFAULT_PARAMS })).toBe(0);
  });
});
