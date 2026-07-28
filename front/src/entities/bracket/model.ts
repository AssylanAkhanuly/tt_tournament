// Платформо-независимая модель турнирной сетки + раскладка.
// Это «общая модель данных сетки» из ARCHITECTURE.md — веб (React Flow) и
// мобилка (react-native-skia) считают позиции по одному алгоритму, различается
// только отрисовка. Чистый TS, без зависимостей от React → тестируемо и
// переиспользуемо. Копия mobile/src/entities/bracket/model.ts (позже — общий пакет).

export type Side = {
  id: string;
  name: string;
  seed?: number;
  avatarUrl?: string;
};

export type MatchStatus = 'pending' | 'live' | 'done';

export type Match = {
  id: string;
  round: number; // 0 = первый круг; растёт к финалу
  slot: number; // позиция в круге, 0-based (сверху вниз)
  a: Side | null; // null = ещё не определён / bye
  b: Side | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winner?: 'a' | 'b' | null;
  status?: MatchStatus;
};

export type Bracket = {
  format: 'single_elimination';
  title?: string;
  matches: Match[];
};

// ── результат раскладки ──────────────────────────────────────────────────
export type NodeBox = {
  match: Match;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Connector = {
  fromId: string;
  toId: string;
  points: { x: number; y: number }[]; // ортогональная ломаная (локоть)
};

export type BracketLayout = {
  nodes: NodeBox[];
  connectors: Connector[];
  width: number;
  height: number;
};

export type LayoutOpts = {
  nodeW?: number;
  nodeH?: number;
  gapX?: number; // горизонтальный зазор между кругами
  gapY?: number; // вертикальный зазор между матчами первого круга
  padding?: number;
};

/** Раскладка «олимпийки» (single elimination): круги — колонки, каждый матч
 *  следующего круга центрируется между двумя своими фидерами. */
export function layoutSingleElimination(
  bracket: Bracket,
  opts: LayoutOpts = {},
): BracketLayout {
  const nodeW = opts.nodeW ?? 180;
  const nodeH = opts.nodeH ?? 60;
  const gapX = opts.gapX ?? 56;
  const gapY = opts.gapY ?? 18;
  const pad = opts.padding ?? 16;
  const stepY = nodeH + gapY;

  // группируем матчи по кругам и сортируем по слоту
  const rounds: Match[][] = [];
  for (const m of bracket.matches) (rounds[m.round] ??= []).push(m);
  for (const r of rounds) r.sort((x, y) => x.slot - y.slot);

  const cyOf = new Map<string, number>(); // центр Y по id матча
  const box = new Map<string, NodeBox>();

  rounds.forEach((round, r) => {
    round.forEach((m) => {
      const x = pad + r * (nodeW + gapX);
      let cy: number;
      if (r === 0) {
        cy = pad + m.slot * stepY + nodeH / 2;
      } else {
        const prev = rounds[r - 1] ?? [];
        const f1 = prev[2 * m.slot];
        const f2 = prev[2 * m.slot + 1];
        const y1 = f1 ? cyOf.get(f1.id)! : pad + nodeH / 2;
        const y2 = f2 ? cyOf.get(f2.id)! : y1;
        cy = (y1 + y2) / 2;
      }
      cyOf.set(m.id, cy);
      box.set(m.id, { match: m, x, y: cy - nodeH / 2, w: nodeW, h: nodeH });
    });
  });

  // коннекторы: каждый фидер (круг r-1) → цель (круг r)
  const connectors: Connector[] = [];
  rounds.forEach((round, r) => {
    if (r === 0) return;
    const prev = rounds[r - 1] ?? [];
    round.forEach((m) => {
      const target = box.get(m.id)!;
      for (const f of [prev[2 * m.slot], prev[2 * m.slot + 1]]) {
        if (!f) continue;
        const from = box.get(f.id)!;
        const x1 = from.x + from.w;
        const y1 = from.y + from.h / 2;
        const x2 = target.x;
        const y2 = target.y + target.h / 2;
        const midX = (x1 + x2) / 2;
        connectors.push({
          fromId: f.id,
          toId: m.id,
          points: [
            { x: x1, y: y1 },
            { x: midX, y: y1 },
            { x: midX, y: y2 },
            { x: x2, y: y2 },
          ],
        });
      }
    });
  });

  let width = pad;
  let height = pad;
  for (const b of box.values()) {
    width = Math.max(width, b.x + b.w + pad);
    height = Math.max(height, b.y + b.h + pad);
  }
  return { nodes: [...box.values()], connectors, width, height };
}

/** Подпись круга по индексу и общему числу кругов (Финал, 1/2, 1/4, 1/8…). */
export function roundTitle(roundIndex: number, roundCount: number): string {
  const fromEnd = roundCount - 1 - roundIndex;
  if (fromEnd === 0) return 'Финал';
  // знаменатель = 2^(кругов до финала): 1/2, 1/4, 1/8, 1/16 …
  return `1/${2 ** fromEnd} финала`;
}
