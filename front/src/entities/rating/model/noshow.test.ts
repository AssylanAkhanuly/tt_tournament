/* Неявка без уважительной причины — §15.4–15.6, нижняя граница §15.15. */

import { describe, expect, it } from 'vitest';
import { applyNoShow, noShowPenalty } from './noshow';

describe('Рейтинговое последствие неявки', () => {
  it('за первую неявку снимает 0,20 (§15.4)', () => {
    expect(noShowPenalty(1)).toBe(0.2);
  });

  it('за повторную — 0,30 (§15.5)', () => {
    expect(noShowPenalty(2)).toBe(0.3);
  });

  it('за каждую последующую — 0,50 (§15.6)', () => {
    expect(noShowPenalty(3)).toBe(0.5);
    expect(noShowPenalty(7)).toBe(0.5);
  });

  it('снимает баллы с рейтинга', () => {
    expect(applyNoShow(20, 1)).toBe(19.8);
    expect(applyNoShow(20, 3)).toBe(19.5);
  });

  it('рейтинг не уходит в минус — нижняя граница 0,00 (§15.15)', () => {
    expect(applyNoShow(0.1, 1)).toBe(0);
    expect(applyNoShow(0, 3)).toBe(0);
  });
});
