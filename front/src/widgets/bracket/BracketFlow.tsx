'use client';

import { useEffect, useMemo } from 'react';
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
  const d = data as { match: Match; mine?: boolean; dim?: boolean };
  const m = d.match;
  const live = m.status === 'live';
  /* «Мой матч» подсвечивается отдельно от «идёт сейчас»: на сетке из шестидесяти
     четырёх пар человек ищет свою пару, а не любую живую. */
  const cls = [s.card, live ? s.live : '', d.mine ? s.mine : '', d.dim ? s.dim : '']
    .filter(Boolean)
    .join(' ');
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

/* Открыть сетку сразу на своём матче. Кнопок на телефоне нет — щипок и
   перетаскивание и так привычны, а лишние органы управления закрывают собой
   ту самую сетку, ради которой экран открыли. Компонент без разметки, живёт
   ВНУТРИ <ReactFlow>: иначе `useReactFlow` не видит холста. */
function FocusMine({ matchId }: { matchId?: string }) {
  const flow = useReactFlow();

  useEffect(() => {
    if (!matchId) return;
    const t = setTimeout(() => {
      const n = flow.getNode(matchId);
      if (!n) return;
      const w = n.width ?? NODE_W;
      const h = n.height ?? NODE_H;
      /* Не просто центрируем, но и приближаем до читаемого: на общем плане
         фамилии не читаются, а именно за ними сюда и заходят. */
      flow.setCenter(n.position.x + w / 2, n.position.y + h / 2, { zoom: 1.1, duration: 0 });
    }, 60);
    return () => clearTimeout(t);
  }, [flow, matchId]);

  return null;
}

export function BracketFlow({
  bracket,
  minZoom = 0.4,
  maxZoom = 2.5,
  fitPadding = 0.3,
  minePlayerId,
  controls = true,
  focusMine = false,
  tone = 'dark',
}: {
  bracket: Bracket;
  minZoom?: number; // ниже — чтобы уместить всю сетку в узком контейнере (напр. телефон)
  maxZoom?: number;
  fitPadding?: number;
  /** Игрок, чей путь подсвечивается: помечаются ВСЕ его матчи в сетке —
      сыгранные, идущий и будущие, — а не только текущий. */
  minePlayerId?: string;
  /** Стандартные Controls React Flow. На телефоне выключаем: они закрывают
      сетку, а щипок и перетаскивание работают и без кнопок. */
  controls?: boolean;
  /** Открыть сразу на своём матче, а не на общем плане. */
  focusMine?: boolean;
  /** Тон холста. По умолчанию тёмный — так сетка живёт в кабинете судьи и на
      табло. Роль спортсмена рисуется на светлой теме, и чёрный холст посреди
      светлых экранов выпадал из системы, поэтому там `light`. */
  tone?: 'dark' | 'light';
}) {
  const { nodes, connectorD, mineConnectorD, extent, mineMatchId } = useMemo(() => {
    const layout = layoutSingleElimination(bracket, {
      nodeW: NODE_W,
      nodeH: NODE_H,
      gapX: 96,
      gapY: 28,
      padding: 0,
    });

    /* Мои матчи — все, где я участник: пройденные, идущий и те, куда я уже
       попал по сетке. Так виден путь целиком, а не одна точка на нём. */
    const isMine = (m: Match) =>
      minePlayerId != null && (m.a?.id === minePlayerId || m.b?.id === minePlayerId);
    const mineMatches = layout.nodes.map((n) => n.match).filter(isMine);
    /* Куда смотреть при открытии: идущий матч, иначе последний из моих. */
    const mineMatchId =
      mineMatches.find((m) => m.status === 'live')?.id ?? mineMatches.at(-1)?.id;

    const ns: Node[] = layout.nodes.map((n) => ({
      id: n.match.id,
      type: 'match',
      position: { x: n.x, y: n.y },
      data: { match: n.match, mine: isMine(n.match), dim: minePlayerId != null && !isMine(n.match) },
      width: NODE_W,
      height: NODE_H,
      draggable: false,
      selectable: false,
    }));

    // коннекторы-локти рисуем сами (тот же геометрический расчёт, что и в мобилке).
    // Ребра React Flow в связке Next16/Turbopack + xyflow12 не отрисовывались,
    // поэтому линии кладём своим SVG в координатах холста через ViewportPortal.
    const d = (c: (typeof layout.connectors)[number]) =>
      c.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

    /* Линии пути игрока рисуются отдельно и поверх: путь по сетке — это не
       только карточки, но и связи между ними, иначе «до кого дошёл» приходится
       прослеживать глазами. */
    const mineIds = new Set(mineMatches.map((m) => m.id));
    const connectorD = layout.connectors
      .filter((c) => !(mineIds.has(c.fromId) && mineIds.has(c.toId)))
      .map(d)
      .join(' ');
    const mineConnectorD = layout.connectors
      .filter((c) => mineIds.has(c.fromId) && mineIds.has(c.toId))
      .map(d)
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

    return { nodes: ns, connectorD, mineConnectorD, extent, mineMatchId };
  }, [bracket, minePlayerId]);

  return (
    <div className={tone === 'light' ? [s.root, s.light].join(' ') : s.root}>
      <div className={s.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          colorMode={tone}
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
              {/* Цвет линий задаётся в CSS свойством `color` — так он зависит
                  от тона холста и от темы, а не зашит числом. */}
              <path d={connectorD} fill="none" stroke="currentColor" strokeWidth={2} />
              {mineConnectorD && (
                <path d={mineConnectorD} className={s.wireMine} fill="none" strokeWidth={4} />
              )}
            </svg>
          </ViewportPortal>
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="currentColor" />
          {focusMine && <FocusMine matchId={mineMatchId} />}
          {controls && <Controls showInteractive={false} />}
        </ReactFlow>
      </div>
    </div>
  );
}
