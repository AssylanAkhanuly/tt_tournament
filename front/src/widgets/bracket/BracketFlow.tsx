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

const NODE_W = 214;
const NODE_H = 78;

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

/* ── Тон холста ───────────────────────────────────────────────
   Один и тот же компонент живёт и на тёмной сетке судьи, и на светлых экранах
   спортсмена. Тёмные цвета писались под токены кита (`--c-ink` и соседние).

   Текст на светлом холсте ✳ (01.09.2026): в приложении токенов кита нет, и
   подставлялся запасной цвет тёмной темы — фамилия победителя выходила почти
   белой по белому, то есть исчезала ровно у того, кто выиграл. Поэтому светлый
   тон берёт токены самого приложения (`--text`, `--muted`, `--primary`). */
type Tone = 'dark' | 'light';

function Row({
  side,
  win,
  score,
  light,
}: {
  side: Side | null;
  win: boolean;
  score?: number | null;
  light: boolean;
}) {
  /* Пустое место («—») окрашено как «ещё не определён», даже у победителя. */
  const nameColor = !side
    ? light
      ? 'text-[color:var(--muted,#737373)]'
      : 'text-[color:var(--c-dim,#6b7691)]'
    : win
      ? light
        ? 'text-[color:var(--text,#171717)]'
        : 'text-[color:var(--c-ink,#eef2fb)]'
      : light
        ? 'text-[color:var(--muted,#737373)]'
        : 'text-[color:var(--c-muted,#a6b0c6)]';
  const scoreColor = win
    ? light
      ? 'text-[color:var(--primary,#2563eb)]'
      : 'text-[color:var(--c-accent,#6f9bff)]'
    : light
      ? 'text-[color:var(--muted,#737373)]'
      : 'text-[color:var(--c-dim,#6b7691)]';
  return (
    <div className="flex h-[27px] items-center gap-[10px]">
      <span
        className={cx(
          'h-[22px] w-[22px] flex-none overflow-hidden rounded-[50%]',
          side
            ? 'bg-[color:var(--c-avatar-bg,#141b2b)]'
            : 'bg-[color:var(--c-glass-seg,rgba(255,255,255,0.05))]',
        )}
      >
        {side?.avatarUrl ? <img className="h-full w-full object-cover" src={side.avatarUrl} alt="" /> : null}
      </span>
      <span
        className={cx('min-w-0 flex-1 truncate text-[13px]', nameColor, win && 'font-semibold')}
        title={side?.name}
      >
        {side ? side.name : '—'}
      </span>
      {score != null && (
        <span className={cx('text-[13.5px] font-extrabold tabular-nums', scoreColor)}>{score}</span>
      )}
    </div>
  );
}

// data приходит как Record<string, unknown> — приводим к нужной форме
function MatchNode({ data }: NodeProps) {
  const d = data as { match: Match; mine?: boolean; dim?: boolean; tone: Tone };
  const m = d.match;
  const live = m.status === 'live';
  const light = d.tone === 'light';
  /* «Мой матч» подсвечивается отдельно от «идёт сейчас»: на сетке из шестидесяти
     четырёх пар человек ищет свою пару, а не любую живую.

     Мой путь по сетке: помечены ВСЕ матчи игрока — сыгранные, идущий и
     следующий. Не цветом линии, а кольцом: цветных состояний на сетке и так
     хватает (идёт, победитель), а «моё» должно читаться поверх них. Чужие
     матчи гасим: путь игрока должен читаться с одного взгляда, а не
     выискиваться среди шестидесяти одинаковых карточек.

     На светлом холсте карточка — белая панель с обычной гранью, и ни «идёт»,
     ни «моё» не меняют ей фон и цвет грани: от моего матча там остаются толщина
     грани и кольцо. Так было и в прежнем CSS-модуле — правило светлого тона
     было тяжелее правил состояний. */
  const surface = light
    ? 'bg-[color:var(--c-panel,#fff)] border-[color:var(--c-glass-line,rgba(15,23,42,0.12))]'
    : d.mine
      ? 'bg-[color-mix(in_srgb,var(--c-accent,#0a86cd)_22%,var(--c-screen-1,#0b1120))] border-[color:var(--c-accent,#0a86cd)]'
      : cx(
          'bg-[color-mix(in_srgb,var(--c-screen-1,#0b1120)_95.5%,var(--c-ink,#eef2fb))]',
          live
            ? 'border-[color:var(--c-accent-line-3,rgba(111,155,255,0.5))]'
            : 'border-[color:var(--c-glass-line,rgba(255,255,255,0.11))]',
        );
  const cls = cx(
    'relative box-border flex h-full w-full flex-col justify-center rounded-[14px] border-solid px-3 [font-family:var(--font)]',
    surface,
    d.mine
      ? 'border-2 [box-shadow:0_0_0_4px_color-mix(in_srgb,var(--c-accent,#0a86cd)_45%,transparent)]'
      : 'border',
    d.dim && (light ? 'opacity-50' : 'opacity-[0.42]'),
  );
  return (
    <div className={cls}>
      {live && (
        <span className="absolute top-[13px] bottom-[13px] left-[5px] w-[3.5px] rounded-[2px] bg-[color:var(--c-success,#34d399)]" />
      )}
      <Row side={m.a} win={m.winner === 'a'} score={m.scoreA} light={light} />
      <div
        className={cx(
          'mx-0 my-px h-px',
          light
            ? 'bg-[color:var(--line,#e5e5e5)]'
            : 'bg-[color:var(--c-glass-line-soft,rgba(255,255,255,0.06))]',
        )}
      />
      <Row side={m.b} win={m.winner === 'b'} score={m.scoreB} light={light} />
    </div>
  );
}

const nodeTypes = { match: MatchNode };

/* Холст React Flow: переопределения его собственных классов. Обёртку узла
   (рамка/фон/курсор) сбрасываем — карточку рисуем сами; ярлык атрибуции
   прячем. Цвет точек фона задаётся свойством `color` и наследуется
   (<Background color="currentColor">) — так он зависит от тона, а не зашит.

   Светлый холст: роль спортсмена рисуется на светлой теме, и чёрная плоскость
   посреди белых списков выпадала из системы. Фон — бумага экрана, точки и
   линии — приглушённые чернила.

   Подчёркивания в именах классов React Flow экранированы (`\_`): в
   произвольном варианте Tailwind читает `_` как пробел, и `.react-flow__node`
   превращался в `.react-flow  node`. Строки — `String.raw`, чтобы обратная
   косая черта дошла до атрибута `class` той же, какой её видит сканер Tailwind. */
const CANVAS = cx(
  'relative min-h-0 flex-1',
  String.raw`[&_.react-flow\_\_node]:rounded-none [&_.react-flow\_\_node]:p-0 [&_.react-flow\_\_node]:[border:none]`,
  String.raw`[&_.react-flow\_\_node]:bg-transparent [&_.react-flow\_\_node]:[box-shadow:none]`,
  String.raw`[&_.react-flow\_\_node]:cursor-default [&_.react-flow\_\_node]:[font-family:var(--font)]`,
  String.raw`[&_.react-flow\_\_attribution]:hidden`,
);
const CANVAS_TONE: Record<Tone, string> = {
  dark: cx(
    '[&_.react-flow]:bg-[color:var(--c-screen-1,#0b1120)]',
    String.raw`[&_.react-flow\_\_background]:text-[color:var(--c-glass-line-soft,rgba(255,255,255,0.06))]`,
  ),
  light: cx(
    '[&_.react-flow]:bg-[color:var(--c-screen-1,#f2f5fa)]',
    String.raw`[&_.react-flow\_\_background]:bg-[color:var(--c-screen-1,#f2f5fa)]`,
    String.raw`[&_.react-flow\_\_background]:text-[color:color-mix(in_srgb,var(--c-ink,#0f172a)_14%,transparent)]`,
  ),
};
/* Цвет линий — тоже свойством `color` (у пути stroke="currentColor"). */
const WIRES_TONE: Record<Tone, string> = {
  dark: 'text-[color:var(--c-glass-line,rgba(255,255,255,0.28))]',
  light: 'text-[color:color-mix(in_srgb,var(--c-ink,#0f172a)_22%,transparent)]',
};

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
  tone = 'light',
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
  /** Тон холста. По умолчанию светлый ✳ (01.09.2026): приложение стало
      светлым целиком, и чёрный холст посреди светлых экранов выпадал из
      системы. Тёмный остался как выбор — он уместен на самом табло, где сетку
      показывают залу поверх видео. */
  tone?: Tone;
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
      /* Тон едет в данные узла: карточка рисуется React Flow отдельно и
         пропсов холста не видит. */
      data: {
        match: n.match,
        mine: isMine(n.match),
        dim: minePlayerId != null && !isMine(n.match),
        tone,
      },
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
  }, [bracket, minePlayerId, tone]);

  return (
    <div className="flex h-screen flex-col bg-[color:var(--c-screen-1,#0b1120)] text-[color:var(--text)]">
      <div className={cx(CANVAS, CANVAS_TONE[tone])}>
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
            {/* Коннекторы — свой svg: глобальный reset `svg { max-width: 100% }`
                мог бы его обрезать, поэтому ограничение снято (`max-w-none`). */}
            <svg
              className={cx('max-w-none overflow-visible', WIRES_TONE[tone])}
              width={1}
              height={1}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
            >
              {/* Цвет линий задаётся свойством `color` — так он зависит
                  от тона холста и от темы, а не зашит числом. */}
              <path d={connectorD} fill="none" stroke="currentColor" strokeWidth={2} />
              {/* Линии моего пути — тем же акцентом и толще обычных. */}
              {mineConnectorD && (
                <path
                  d={mineConnectorD}
                  className="[stroke:var(--c-accent,#0a86cd)]"
                  fill="none"
                  strokeWidth={4}
                />
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
