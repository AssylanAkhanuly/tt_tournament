'use client';

import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  layoutSingleElimination,
  roundTitle,
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
      <Handle type="target" position={Position.Left} className={s.handle} isConnectable={false} />
      {live && <span className={s.stripe} />}
      <Row side={m.a} win={m.winner === 'a'} score={m.scoreA} />
      <div className={s.divider} />
      <Row side={m.b} win={m.winner === 'b'} score={m.scoreB} />
      <Handle type="source" position={Position.Right} className={s.handle} isConnectable={false} />
    </div>
  );
}

function RoundLabel({ data }: NodeProps) {
  return <div className={s.round}>{(data as { text: string }).text}</div>;
}

const nodeTypes = { match: MatchNode, round: RoundLabel };

export function BracketFlow({ bracket }: { bracket: Bracket }) {
  const { nodes, edges } = useMemo(() => {
    const layout = layoutSingleElimination(bracket, {
      nodeW: NODE_W,
      nodeH: NODE_H,
      gapX: 96,
      gapY: 28,
      padding: 0,
    });
    const roundCount = Math.max(...bracket.matches.map((m) => m.round)) + 1;
    const minY = Math.min(...layout.nodes.map((n) => n.y));

    const matchNodes: Node[] = layout.nodes.map((n) => ({
      id: n.match.id,
      type: 'match',
      position: { x: n.x, y: n.y },
      data: { match: n.match },
      width: NODE_W,
      height: NODE_H,
      draggable: false,
      selectable: false,
    }));

    // подписи кругов — в одну линию сверху (как в мобилке)
    const seen = new Set<number>();
    const labelNodes: Node[] = [];
    for (const n of layout.nodes) {
      const r = n.match.round;
      if (seen.has(r)) continue;
      seen.add(r);
      labelNodes.push({
        id: `round-${r}`,
        type: 'round',
        position: { x: n.x, y: minY - 40 },
        data: { text: roundTitle(r, roundCount).toUpperCase() },
        draggable: false,
        selectable: false,
      });
    }

    // рёбра-локти рисует сам React Flow (smoothstep) между хендлами
    const es: Edge[] = layout.connectors.map((c) => ({
      id: `${c.fromId}-${c.toId}`,
      source: c.fromId,
      target: c.toId,
      type: 'smoothstep',
      style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5 },
    }));

    return { nodes: [...matchNodes, ...labelNodes], edges: es };
  }, [bracket]);

  return (
    <div className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>{bracket.title}</h1>
        <p className={s.sub}>Сетка · колесо или кнопки — зум, тяните — панорама</p>
      </header>
      <div className={s.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.4}
          maxZoom={2.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
