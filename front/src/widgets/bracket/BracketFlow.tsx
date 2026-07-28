'use client';

import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ViewportPortal,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  layoutSingleElimination,
  type Bracket,
  type Match,
  type Side,
} from '@/entities/bracket/model';
import s from './BracketFlow.module.css';

const NODE_W = 214;
const NODE_H = 78;

function Row({ side, win, score }: { side: Side | null; win: boolean; score?: number | null }) {
  return (
    <div className={s.row}>
      <span className={side ? s.avatar : `${s.avatar} ${s.avatarEmpty}`}>
        {side?.avatarUrl ? <img src={side.avatarUrl} alt="" /> : null}
      </span>
      <span className={[s.name, win ? s.win : '', side ? '' : s.tbd].join(' ')} title={side?.name}>
        {side ? side.name : '—'}
      </span>
      {score != null && (
        <span className={win ? `${s.score} ${s.scoreWin}` : s.score}>{score}</span>
      )}
    </div>
  );
}

// data приходит как Record<string, unknown> — приводим к нужной форме
function MatchNode({ data }: NodeProps) {
  const m = (data as { match: Match }).match;
  const live = m.status === 'live';
  return (
    <div className={live ? `${s.card} ${s.live}` : s.card}>
      {live && <span className={s.stripe} />}
      <Row side={m.a} win={m.winner === 'a'} score={m.scoreA} />
      <div className={s.divider} />
      <Row side={m.b} win={m.winner === 'b'} score={m.scoreB} />
    </div>
  );
}

const nodeTypes = { match: MatchNode };

export function BracketFlow({ bracket }: { bracket: Bracket }) {
  const { nodes, connectorD } = useMemo(() => {
    const layout = layoutSingleElimination(bracket, {
      nodeW: NODE_W,
      nodeH: NODE_H,
      gapX: 96,
      gapY: 28,
      padding: 0,
    });

    const ns: Node[] = layout.nodes.map((n) => ({
      id: n.match.id,
      type: 'match',
      position: { x: n.x, y: n.y },
      data: { match: n.match },
      width: NODE_W,
      height: NODE_H,
      draggable: false,
      selectable: false,
    }));

    // коннекторы-локти рисуем сами (тот же геометрический расчёт, что и в мобилке).
    // Ребра React Flow в связке Next16/Turbopack + xyflow12 не отрисовывались,
    // поэтому линии кладём своим SVG в координатах холста через ViewportPortal.
    const connectorD = layout.connectors
      .map((c) => c.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' '))
      .join(' ');

    return { nodes: ns, connectorD };
  }, [bracket]);

  return (
    <div className={s.root}>
      <div className={s.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.4}
          maxZoom={2.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <ViewportPortal>
            <svg
              className={s.wires}
              width={1}
              height={1}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
            >
              <path d={connectorD} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
            </svg>
          </ViewportPortal>
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
