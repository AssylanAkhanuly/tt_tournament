'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useReactFlow,
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
  const d = data as { match: Match; mine?: boolean };
  const m = d.match;
  const live = m.status === 'live';
  /* «Мой матч» подсвечивается отдельно от «идёт сейчас»: на сетке из шестидесяти
     четырёх пар человек ищет свою пару, а не любую живую. */
  const cls = [s.card, live ? s.live : '', d.mine ? s.mine : ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {live && <span className={s.stripe} />}
      <Row side={m.a} win={m.winner === 'a'} score={m.scoreA} />
      <div className={s.divider} />
      <Row side={m.b} win={m.winner === 'b'} score={m.scoreB} />
    </div>
  );
}

const nodeTypes = { match: MatchNode };

/* Управление под палец. Стандартные Controls React Flow — кнопки в 26 px: на
   телефоне в них не попасть, и стоят они в углу, куда большой палец не
   дотягивается. Для `touch` рисуем свои: масштаб, «вся сетка» и главное —
   возврат к своему матчу. Компонент живёт ВНУТРИ <ReactFlow>, иначе
   `useReactFlow` не видит холста. */
function TouchPad({ mineId, focusMine }: { mineId?: string; focusMine?: boolean }) {
  const flow = useReactFlow();

  const toMine = useCallback(() => {
    if (!mineId) return flow.fitView({ padding: 0.2, duration: 400 });
    const n = flow.getNode(mineId);
    if (!n) return;
    const w = n.width ?? NODE_W;
    const h = n.height ?? NODE_H;
    /* Не просто центрируем, но и приближаем до читаемого: на общем плане
       фамилии не читаются, а именно за ними сюда и заходят. */
    return flow.setCenter(n.position.x + w / 2, n.position.y + h / 2, {
      zoom: 1.1,
      duration: 450,
    });
  }, [flow, mineId]);

  /* На телефоне сетка открывается сразу на своей паре, а не на общем плане:
     общий план на 393 px нечитаем, и первое, что человек делает, — ищет себя.
     Кнопка «вся сетка» рядом, если нужен обзор. */
  useEffect(() => {
    if (!focusMine) return;
    const t = setTimeout(toMine, 60);
    return () => clearTimeout(t);
  }, [focusMine, toMine]);

  return (
    <div className={s.pad}>
      <button type="button" className={s.padMain} onClick={toMine}>
        Мой матч
      </button>
      <div className={s.padZoom}>
        <button type="button" onClick={() => flow.zoomIn({ duration: 200 })} aria-label="Приблизить">
          +
        </button>
        <button type="button" onClick={() => flow.zoomOut({ duration: 200 })} aria-label="Отдалить">
          −
        </button>
        <button
          type="button"
          onClick={() => flow.fitView({ padding: 0.16, duration: 400 })}
          aria-label="Показать всю сетку"
        >
          ⤢
        </button>
      </div>
    </div>
  );
}

export function BracketFlow({
  bracket,
  minZoom = 0.4,
  maxZoom = 2.5,
  fitPadding = 0.3,
  mineId,
  touch = false,
  focusMine = false,
}: {
  bracket: Bracket;
  minZoom?: number; // ниже — чтобы уместить всю сетку в узком контейнере (напр. телефон)
  maxZoom?: number;
  fitPadding?: number;
  /** Мой матч: подсвечивается на холсте, к нему ведёт кнопка управления. */
  mineId?: string;
  /** Телефон: крупные кнопки под палец вместо стандартных Controls. */
  touch?: boolean;
  /** Открыть сразу на своей паре, а не на общем плане. */
  focusMine?: boolean;
}) {
  const { nodes, connectorD, extent } = useMemo(() => {
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
      data: { match: n.match, mine: n.match.id === mineId },
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

    // границы «карты» — нельзя утащить сетку в бесконечную пустоту (translateExtent)
    const left = Math.min(...layout.nodes.map((n) => n.x));
    const top = Math.min(...layout.nodes.map((n) => n.y));
    const right = Math.max(...layout.nodes.map((n) => n.x + NODE_W));
    const bottom = Math.max(...layout.nodes.map((n) => n.y + NODE_H));
    const m = 240; // небольшой отступ вокруг сетки
    const extent: [[number, number], [number, number]] = [
      [left - m, top - m],
      [right + m, bottom + m],
    ];

    return { nodes: ns, connectorD, extent };
  }, [bracket, mineId]);

  return (
    <div className={s.root}>
      <div className={s.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: fitPadding }}
          minZoom={minZoom}
          maxZoom={maxZoom}
          translateExtent={extent}
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
          {touch ? <TouchPad mineId={mineId} focusMine={focusMine} /> : <Controls showInteractive={false} />}
        </ReactFlow>
      </div>
    </div>
  );
}
