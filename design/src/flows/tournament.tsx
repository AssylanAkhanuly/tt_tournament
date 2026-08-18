/* Карта сквозного хода турнира: слева ход по состояниям, справа — экран, на
   котором идёт выбранный шаг.

   Карты маршрутов (`map.tsx`) отвечают на вопрос «куда ходит эта роль». Здесь
   вопрос другой: **не выпал ли шаг между ролями**. Поэтому слева не дерево
   экранов, а сам турнир: состояния из ТЗ §4.3 сверху вниз, под каждым его шаги,
   и у каждого шага написано, кто его делает.

   Карт три — по числу категорий календаря (ТЗ §4.1): главный старт, Евразийская
   лига, открытый турнир. Компонент один и тот же, разные у них только данные:
   что общего, написано в `data/tournament.ts` один раз.

   Ничего нового про систему карта не заводит: шаги ссылаются на существующие
   экраны, макеты берутся из тех же `SCREENS`, из которых собираются борды
   ролей, а требование справа — из данных роли. Шаг без экрана рисуется отдельно
   и красным: это дырка в пути, а не оформление. */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Screen } from './types';
import type { ScreenMap } from '../mockups/shell';
import { ScreenPane } from './screenPane';
import { TOURS, type Stage, type Step, type Tour } from './data/tournament';
import { ROLES } from './data/all';
import { SCREENS as S00 } from '../mockups/role00';
import { SCREENS as S00J } from '../mockups/role00j';
import { SCREENS as S01 } from '../mockups/role01';
import { SCREENS as S02 } from '../mockups/role02';
import { SCREENS as S05 } from '../mockups/role05';
import { SCREENS as S06 } from '../mockups/role06';
import { SCREENS as S07 } from '../mockups/role07';
import { SCREENS as S08 } from '../mockups/role08';
import { SCREENS as S09 } from '../mockups/role09';
import { SCREENS as S10 } from '../mockups/role10';
import { SCREENS as S12 } from '../mockups/role12';
import { SCREENS as S13 } from '../mockups/role13';
import { SCREENS as S14 } from '../mockups/role14';
import './map.css';
import './tournament.css';

/* Макеты всех ролей одной картой: путь идёт через роли, и экран берётся у той
   роли, которая делает шаг. Коды сквозные (Э5.2, Э9.3), поэтому объединение
   безопасно — двух экранов с одним кодом в системе нет. */
const ALL_SCREENS: ScreenMap = {
  ...S00, ...S00J, ...S01, ...S02, ...S05, ...S06, ...S07, ...S08, ...S09, ...S10, ...S12, ...S13, ...S14,
};

/** Требования ко всем экранам по кодам: карта показывает справа то же, что и
    маршрут роли, — узел флоу этого экрана. */
const ALL_SPECS = new Map<string, Screen>(
  ROLES.flatMap((r) => r.screens.map((s) => [s.id, s] as [string, Screen])),
);

/* ── Узлы ───────────────────────────────────────────────────────── */

/** Заголовок колонки: состояние турнира. Он не экран и не кликается — это
    подпись к тому, что под ним. */
function StageNode({ data }: NodeProps) {
  const { stage, n } = data as unknown as { stage: Stage; n: number };
  return (
    <div className="ftst">
      <Handle type="target" position={Position.Top} id="in" />
      <div className="ftst-h">
        <span className="ftst-n">{n}</span>
        <span className="ftst-t">{stage.st}</span>
      </div>
      <div className="ftst-w">{stage.what} · {stage.who}</div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}

/** Шаг: кто, что делает и на каком экране. */
function StepNode({ data }: NodeProps) {
  const { step, selected, has } = data as unknown as {
    step: Step;
    selected: boolean;
    has: boolean;
  };
  return (
    <div
      className={
        'ftn' + (selected ? ' on' : '') + (step.side ? ' side' : '') + (has ? '' : ' gap')
      }
    >
      {/* Путь идёт сверху вниз, ветка отходит вбок: у узла поэтому два входа
          и два выхода, и линия ветки не мешается с линией пути. */}
      <Handle type="target" position={Position.Top} id="in" />
      <Handle type="target" position={Position.Left} id="from" />
      <div className="ftn-who">{step.who}</div>
      <div className="ftn-t">{step.t}</div>
      <div className="ftn-code">
        {step.code ?? 'экрана нет'}
        {step.mark === 'ours' && <sup>✳</sup>}
        {step.mark === 'open' && <sup>⚠</sup>}
      </div>
      <Handle type="source" position={Position.Bottom} id="out" />
      <Handle type="source" position={Position.Right} id="branch" />
    </div>
  );
}

const nodeTypes = { stage: StageNode, step: StepNode };

/* ── Раскладка ──────────────────────────────────────────────────── */

/* Путь читают сверху вниз — как сам турнир. Восемь состояний колонками не
   помещались в половину окна: восемь колонок по двести шестьдесят пикселей
   ужимались до трети масштаба, и подписи шагов превращались в серые полоски.
   В одну колонку путь длинный, зато читаемый: состояние — заголовок полосы,
   шаги под ним, ветки отходят вправо. */
/** Отступ ветки вправо от главного пути. */
const SIDE = 336;
/** Просвет между узлами и высота заголовка состояния. */
const GAP = 16;
const HEAD = 84;

/** Высота узла шага: длинная фраза переносится на вторую и третью строку. */
const stepH = (s: Step) => 62 + Math.ceil(s.t.length / 40) * 17;

function build(stages: Stage[], selected: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  /* Главный путь — сплошная линия сверху вниз: состояние, его шаги, следующее
     состояние. Ветки (отказ, возврат, оплата, наблюдатели) отходят вправо
     пунктиром от того шага, из которого растут: путь турнира они не двигают. */
  let prev: string | null = null;
  let y = 0;

  const line = (from: string, to: string, side: boolean) =>
    edges.push({
      id: `${from}->${to}`,
      source: from,
      target: to,
      sourceHandle: side ? 'branch' : 'out',
      targetHandle: side ? 'from' : 'in',
      type: 'smoothstep',
      style: side
        ? { stroke: 'var(--c-board-line)', strokeDasharray: '4 4' }
        : { stroke: 'var(--c-board-accent)' },
    });

  stages.forEach((stage, si) => {
    const head = `st${si}`;
    nodes.push({
      id: head,
      type: 'stage',
      position: { x: 0, y },
      data: { stage, n: si + 1 },
      draggable: false,
      selectable: false,
    });
    if (prev) line(prev, head, false);
    prev = head;
    y += HEAD + GAP;

    stage.steps.forEach((step, i) => {
      const id = `${si}.${i}`;
      const h = stepH(step);
      nodes.push({
        id,
        type: 'step',
        position: { x: step.side ? SIDE : 0, y },
        data: { step, selected: id === selected, has: Boolean(step.code) },
        draggable: false,
      });
      if (prev) line(prev, id, Boolean(step.side));
      if (!step.side) prev = id;
      y += h + GAP;
    });
  });

  return { nodes, edges };
}

/** Первый шаг с экраном — с него карта открывается. */
const firstWithScreen = (stages: Stage[]) => {
  for (let si = 0; si < stages.length; si += 1) {
    const i = stages[si].steps.findIndex((s) => s.code);
    if (i >= 0) return `${si}.${i}`;
  }
  return '0.0';
};

/* ── Карта ──────────────────────────────────────────────────────── */

/** Карта одной категории календаря. `tour` — её ключ (`main`, `league`,
    `ort`): пути отличаются тем, кто заявляет, а всё остальное у них общее и
    берётся из одних данных.

    `ReactFlowProvider` нужен, чтобы подвести граф к шагу, на который ушли
    переходом внутри макета: иначе выбранный шаг оказывается за краем и
    непонятно, где мы в турнире. */
export function TournamentMap({ tour }: { tour: string }) {
  const t = TOURS.find((x) => x.key === tour) ?? TOURS[0];
  return (
    <ReactFlowProvider key={t.key}>
      <Inner tour={t} />
    </ReactFlowProvider>
  );
}

function Inner({ tour }: { tour: Tour }) {
  const [selected, setSelected] = useState(firstWithScreen(tour.stages));
  const { nodes, edges } = useMemo(() => build(tour.stages, selected), [tour, selected]);

  const step = useMemo(() => {
    const [si, i] = selected.split('.').map(Number);
    return tour.stages[si]?.steps[i];
  }, [tour, selected]);

  /* Экраны, доступные правой половине: только те, что стоят на пути. Переход
     внутри макета на экран вне пути карта не делает — иначе выбранный узел
     пропадал бы с графа, и было бы непонятно, где мы. */
  const screens = useMemo<ScreenMap>(() => {
    const used = new Set(tour.stages.flatMap((s) => s.steps.map((x) => x.code).filter(Boolean)));
    return Object.fromEntries(
      Object.entries(ALL_SCREENS).filter(([code]) => used.has(code)),
    ) as ScreenMap;
  }, [tour]);

  /* Правая половина работает кодами экранов, левая — номерами шагов: один и тот
     же экран стоит в пути несколько раз (Э1.3 и в черновике, и при публикации,
     и на заявках). Поэтому переход из макета выбирает **первый шаг с этим
     кодом**, а не подменяет выбранный. */
  const flow = useReactFlow();
  /* Подводим граф только к тому шагу, на который ушли из макета: по клику в
     самом графе узел и так перед глазами, и пересчёт вида дёргал бы картинку
     под курсором. */
  const nudge = useRef<string | null>(null);
  const pickByCode = (code: string) => {
    for (let si = 0; si < tour.stages.length; si += 1) {
      const i = tour.stages[si].steps.findIndex((s) => s.code === code);
      if (i >= 0) {
        nudge.current = `${si}.${i}`;
        return setSelected(`${si}.${i}`);
      }
    }
  };

  useEffect(() => {
    if (nudge.current !== selected) return;
    nudge.current = null;
    const n = nodes.find((x) => x.id === selected);
    if (!n) return;
    flow.setCenter(n.position.x + 150, n.position.y + 40, {
      zoom: flow.getZoom(),
      duration: 320,
    });
  }, [selected, nodes, flow]);

  const total = tour.stages.reduce((n, s) => n + s.steps.length, 0);
  const gaps = tour.stages
    .flatMap((s) => s.steps)
    .filter((s) => !s.code || s.mark === 'open').length;

  return (
    <div className="fmap">
      <div className="fmap-graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => n.type === 'step' && setSelected(n.id)}
          /* Не вписываем путь целиком: он длинный, и «вписать» делает из
             пятидесяти шагов серые полоски, а показывает при этом середину
             турнира. Карта открывается на его начале — дальше листают; отступ
             сверху оставлен под легенду, иначе она накрывала первое состояние. */
          defaultViewport={{ x: 36, y: 152, zoom: 0.8 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--c-board-line)" />
          <Controls showInteractive={false} />
        </ReactFlow>
        <div className="fmap-legend">
          <b>{tour.title} — сквозной ход, через все роли</b>
          <span>{tour.sub}</span>
          <span>
            {tour.stages.length} состояний · {total} шагов · {gaps} с пометкой · клик по шагу
            открывает экран справа
          </span>
          <span>источник: <code>TZ.md §4.1, §4.3</code> и <code>flows/</code></span>
        </div>
      </div>

      <div className="ftw">
        <div className="ftw-lead">{tour.lead}</div>

        {step && (
          <div className={'ftw-step' + (step.code ? '' : ' gap')}>
            <div className="ftw-who">{step.who}</div>
            <div className="ftw-t">{step.t}</div>
            {step.out && <div className="ftw-out">→ {step.out}</div>}
            {step.gap && (
              <div className="ftw-gap">
                {step.code ? '⚠ ' : '⚠ Экрана нет. '}
                {step.gap}
              </div>
            )}
          </div>
        )}

        {step?.code && screens[step.code] ? (
          <ScreenPane
            screens={screens}
            selected={step.code}
            onSelect={pickByCode}
            tab={null}
            spec={ALL_SPECS.get(step.code)}
            byId={ALL_SPECS}
          />
        ) : (
          <div className="ftw-empty">
            Этот шаг в макетах не нарисован — показывать нечего. Он и есть то, ради чего
            собран сквозной путь: место, где ход турнира держится на договорённости, а не на
            экране.
          </div>
        )}

        <div className="ftw-gaps">
          <h4>Что видно только поперёк ролей</h4>
          <ul>
            {tour.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
