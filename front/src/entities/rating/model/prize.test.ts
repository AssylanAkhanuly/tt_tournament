/* Коэффициент за призовое место — §10 Положения (проект 28.08.2026). */

import { describe, expect, it } from 'vitest';
import { prizeFactor } from './prize';

describe('P — коэффициент за призовое место (§10.3)', () => {
  it('берёт значения прямо из таблицы Положения', () => {
    expect(prizeFactor(1)).toBe(1.2);
    expect(prizeFactor(2)).toBe(1.15);
    expect(prizeFactor(3)).toBe(1.1);
  });

  it('за 4-е место и ниже не применяется (§10.5)', () => {
    expect(prizeFactor(4)).toBe(1);
    expect(prizeFactor(17)).toBe(1);
  });

  it('без места (игрок не в протоколе мест) не применяется', () => {
    expect(prizeFactor(undefined)).toBe(1);
  });

  it('без матча за 3-е место оба проигравших полуфиналиста — бронза (§10.4)', () => {
    // место 3 и место 4 при noThirdPlaceMatch — оба получают 1,10
    expect(prizeFactor(3, { noThirdPlaceMatch: true })).toBe(1.1);
    expect(prizeFactor(4, { noThirdPlaceMatch: true })).toBe(1.1);
    // пятое место бронзой не становится
    expect(prizeFactor(5, { noThirdPlaceMatch: true })).toBe(1);
  });
});
