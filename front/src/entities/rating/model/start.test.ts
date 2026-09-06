/* Стартовый рейтинг: новый игрок (§6.1), перенос прежнего (§6.3),
   пересчёт из позиции ITTF (§17). Положение, проект 28.08.2026. */

import { describe, expect, it } from 'vitest';
import { fromIttfPosition, fromLegacyRating, newPlayerRating } from './start';

describe('Стартовое значение', () => {
  it('новому спортсмену — 1,00 (§6.1)', () => {
    expect(newPlayerRating()).toBe(1);
  });

  it('прежний рейтинг переносится один к одному, без пересчёта (§6.3)', () => {
    expect(fromLegacyRating(40)).toBe(40);
    expect(fromLegacyRating(50)).toBe(50);
    expect(fromLegacyRating(82)).toBe(82);
  });
});

describe('Перевод позиции ITTF в национальную шкалу (§17.4)', () => {
  const п = { rMax: 90, k: 10 };

  it('воспроизводит все три примера Положения (§17.12)', () => {
    expect(fromIttfPosition(100, п)).toBe(43.95);
    expect(fromIttfPosition(50, п)).toBe(50.88);
    expect(fromIttfPosition(500, п)).toBe(27.85);
  });

  it('первое место в мире даёт верхнюю границу шкалы', () => {
    expect(fromIttfPosition(1, п)).toBe(90);
  });

  it('чем ниже позиция, тем ниже стартовый рейтинг', () => {
    expect(fromIttfPosition(50, п)).toBeGreaterThan(fromIttfPosition(100, п));
    expect(fromIttfPosition(100, п)).toBeGreaterThan(fromIttfPosition(500, п));
  });

  it('не опускается ниже 1,00 (§17.6)', () => {
    expect(fromIttfPosition(10000, п)).toBe(1);
  });

  it('округляет до двух знаков (§17.5)', () => {
    const r = fromIttfPosition(37, п);
    expect(r).toBe(Number(r.toFixed(2)));
  });
});
