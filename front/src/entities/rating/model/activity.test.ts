/* Неактивность (§18) и возрастная выборка (§7.4). Положение 28.08.2026. */

import { describe, expect, it } from 'vitest';
import { ageCategory, activityStatus } from './activity';

const месяцевНазад = (n: number, от = new Date('2026-09-06')) => {
  const d = new Date(от);
  d.setMonth(d.getMonth() - n);
  return d;
};
const сейчас = new Date('2026-09-06');

describe('Статус активности (§18)', () => {
  it('до 24 месяцев без матчей — активен', () => {
    expect(activityStatus(месяцевНазад(23), сейчас).status).toBe('активен');
  });

  it('с 24 месяцев — неактивен, рейтинг сохраняется (§18.1–18.2)', () => {
    const s = activityStatus(месяцевНазад(24), сейчас);
    expect(s.status).toBe('неактивен');
    expect(s.ratingKept).toBe(true);
  });

  it('вернуться с сохранённым рейтингом можно до 60 месяцев (§18.3)', () => {
    const s = activityStatus(месяцевНазад(59), сейчас);
    expect(s.status).toBe('неактивен');
    expect(s.ratingKept).toBe(true);
  });

  it('после 60 месяцев рейтинг аннулируется (§18.4)', () => {
    const s = activityStatus(месяцевНазад(60), сейчас);
    expect(s.status).toBe('обнулён');
    expect(s.ratingKept).toBe(false);
  });

  it('без единого матча статус не считается активным', () => {
    expect(activityStatus(null, сейчас).status).toBe('нет матчей');
  });
});

describe('Возрастная категория: год соревнования минус год рождения (§7.4)', () => {
  it('раскладывает по ступеням U11…U21', () => {
    expect(ageCategory(2026, 2016)).toBe('U11');
    expect(ageCategory(2026, 2014)).toBe('U13');
    expect(ageCategory(2026, 2012)).toBe('U15');
    expect(ageCategory(2026, 2010)).toBe('U17');
    expect(ageCategory(2026, 2008)).toBe('U19');
    expect(ageCategory(2026, 2006)).toBe('U21');
  });

  it('старше U21 — только общий рейтинг', () => {
    expect(ageCategory(2026, 2000)).toBe(null);
  });

  it('переход из U15 в U17 не меняет рейтинг — меняется только выборка (§7.4)', () => {
    expect(ageCategory(2026, 2012)).toBe('U15');
    expect(ageCategory(2027, 2012)).toBe('U17');
  });

  // ⚠ Порог «Un = разница не больше n−1» взят по правилу ITTF: в Положении
  // задана только сама разность, границы ступеней в нём не написаны.
  it('граница ступени: в год, когда исполняется 15, спортсмен уже не U15', () => {
    expect(ageCategory(2026, 2012)).toBe('U15'); // разница 14
    expect(ageCategory(2026, 2011)).toBe('U17'); // разница 15
  });
});
