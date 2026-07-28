import { describe, expect, it } from 'vitest';

import { layoutSingleElimination, roundTitle, type Bracket } from './model';

// «Раскладку сетки» TESTING.md прямо называет юнит-целью — покрываем геометрию.
const bracket: Bracket = {
  format: 'single_elimination',
  matches: [
    { id: 'qf1', round: 0, slot: 0, a: null, b: null },
    { id: 'qf2', round: 0, slot: 1, a: null, b: null },
    { id: 'qf3', round: 0, slot: 2, a: null, b: null },
    { id: 'qf4', round: 0, slot: 3, a: null, b: null },
    { id: 'sf1', round: 1, slot: 0, a: null, b: null },
    { id: 'sf2', round: 1, slot: 1, a: null, b: null },
    { id: 'f', round: 2, slot: 0, a: null, b: null },
  ],
};

describe('layoutSingleElimination', () => {
  const L = layoutSingleElimination(bracket, {
    nodeW: 200,
    nodeH: 80,
    gapX: 100,
    gapY: 20,
    padding: 0,
  });
  const node = (id: string) => L.nodes.find((n) => n.match.id === id)!;
  const cy = (id: string) => node(id).y + node(id).h / 2;

  it('раскладывает все матчи в узлы', () => {
    expect(L.nodes).toHaveLength(7);
  });

  it('круги — колонки: x растёт с номером круга (шаг = nodeW + gapX)', () => {
    expect(node('qf1').x).toBe(0);
    expect(node('sf1').x).toBe(300);
    expect(node('f').x).toBe(600);
  });

  it('родитель центрируется по вертикали между двумя фидерами', () => {
    expect(cy('sf1')).toBeCloseTo((cy('qf1') + cy('qf2')) / 2, 5);
    expect(cy('sf2')).toBeCloseTo((cy('qf3') + cy('qf4')) / 2, 5);
    expect(cy('f')).toBeCloseTo((cy('sf1') + cy('sf2')) / 2, 5);
  });

  it('коннекторы: 6 рёбер фидер→цель (4 в 1/2 + 2 в финал)', () => {
    expect(L.connectors).toHaveLength(6);
    const pairs = L.connectors.map((c) => `${c.fromId}->${c.toId}`);
    expect(pairs).toContain('qf1->sf1');
    expect(pairs).toContain('qf2->sf1');
    expect(pairs).toContain('sf1->f');
    expect(pairs).toContain('sf2->f');
  });

  it('коннектор — ортогональный локоть: 4 точки, старт у правого края фидера, финиш у левого края цели', () => {
    for (const c of L.connectors) {
      expect(c.points).toHaveLength(4);
      expect(c.points[0].x).toBe(node(c.fromId).x + node(c.fromId).w);
      expect(c.points[3].x).toBe(node(c.toId).x);
    }
  });

  it('габариты холста охватывают все узлы', () => {
    const maxRight = Math.max(...L.nodes.map((n) => n.x + n.w));
    expect(L.width).toBeGreaterThanOrEqual(maxRight);
  });
});

describe('roundTitle', () => {
  it('называет круги, считая от финала', () => {
    expect(roundTitle(2, 3)).toBe('Финал');
    expect(roundTitle(1, 3)).toBe('1/2 финала');
    expect(roundTitle(0, 3)).toBe('1/4 финала');
    expect(roundTitle(0, 4)).toBe('1/8 финала');
  });
});
