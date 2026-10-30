import { describe, expect, it } from 'vitest';

import { dayKey, monthGrid } from './grid';

describe('monthGrid', () => {
  it('октябрь 2026 начинается с понедельника 28 сентября', () => {
    const grid = monthGrid(2026, 9); // 1 октября 2026 — четверг
    expect(grid).toHaveLength(42);
    expect(dayKey(grid[0].date)).toBe('2026-09-28');
    expect(grid[0].inMonth).toBe(false);
    expect(dayKey(grid[3].date)).toBe('2026-10-01');
    expect(grid[3].inMonth).toBe(true);
  });

  it('месяц, начинающийся в воскресенье, не теряет первое число', () => {
    const grid = monthGrid(2026, 10); // 1 ноября 2026 — воскресенье
    expect(dayKey(grid[6].date)).toBe('2026-11-01');
    expect(grid.filter((d) => d.inMonth)).toHaveLength(30);
  });
});
