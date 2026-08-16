/* Карта флоу роли: граф маршрута слева, живой макет выбранного экрана справа.

   Зачем она вместо картинки: схема-PNG показывала маршрут, но по ней нельзя
   было посмотреть экран — приходилось искать колонку в борде. Здесь клик по
   узлу открывает сам макет во второй половине экрана, вместе с требованием к
   нему. Один клик вместо «найти нужную колонку среди пятнадцати».

   Ничего нового про содержание карта не заводит: узлы и связи считаются из
   данных роли (`data/roleNN.ts`), а макеты берутся из карты экранов роли
   (`SCREENS` в `mockups/roleNN.tsx`) — той же, из которой собирается борд. */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { RoleFlow, Screen, ScreenTab } from './types';
import type { ScreenMap } from '../mockups/shell';
import { NodeSpec } from './nodeSpec';
import { role00 } from './data/role00';
import './map.css';

/* Дерево растёт слева направо: слой — колонка, соседи по слою стоят друг под
   другом. Сверху вниз оно расползалось по ширине (у первого экрана роли до
   восьми веток сразу), и в половине экрана граф ужимался до нечитаемого. */
const COL = 250;
/** Просвет между соседними узлами по вертикали. */
const GAP = 22;

/** Подпись действия и подпись кнопки к общему виду: ««Выдать роль»» → «выдать роль». */
const norm = (s: string) =>
  s.toLowerCase().replace(/[«»"'`]/g, '').replace(/[·—–]/g, ' ').replace(/\s+/g, ' ').trim();

type NodeData = {
  code: string;
  screen: Screen;
  selected: boolean;
  /** Экран сквозной (Э0.x) — описан не у роли, а в разделе 00. */
  common: boolean;
};

/* ── Узел ───────────────────────────────────────────────────────── */

function ScreenNode({ data }: NodeProps) {
  const { code, screen, selected, common } = data as unknown as NodeData;
  const mark = screen.mark === 'ours' ? '✳' : screen.mark === 'open' ? '⚠' : '';
  return (
    <div className={'fmn' + (selected ? ' on' : '') + (common ? ' common' : '')}>
      <Handle type="target" position={Position.Left} />
      <div className="fmn-code">{code}{mark && <sup>{mark}</sup>}</div>
      <div className="fmn-title">{screen.title}</div>
      <div className="fmn-meta">
        {screen.zones.length} зон · {screen.actions.length} действий
        {screen.states.length > 0 && ` · ${screen.states.length} сост.`}
        {screen.tabs && ` · ${screen.tabs.length} вкл.`}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

/** Узел вкладки: экран с вкладками — это несколько экранов под одной шапкой,
    и на карте каждый из них стоит отдельно. Клик открывает макет на этой
    вкладке (переключатель в макете рабочий — карта его и нажимает). */
function TabNode({ data }: NodeProps) {
  const { tab, selected } = data as unknown as { tab: ScreenTab; selected: boolean };
  return (
    <div className={'fmt' + (selected ? ' on' : '') + (tab.when ? ' opt' : '')}>
      <Handle type="target" position={Position.Left} />
      <div className="fmt-title">
        {tab.t}
        {tab.mark === 'ours' && <sup>✳</sup>}
        {tab.mark === 'open' && <sup>⚠</sup>}
      </div>
      <div className="fmt-what">{tab.what}</div>
      {tab.when && <div className="fmt-when">есть, когда: {tab.when}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { screen: ScreenNode, tab: TabNode };

/* ── Раскладка ──────────────────────────────────────────────────── */

/** Дерево маршрута: у каждого экрана ровно один родитель.

    Раньше рисовались все переходы сразу, и картинка превращалась в клубок:
    из диалога отмены линия возвращалась в карточку турнира, из выдачи роли —
    в список пользователей, и всё это шло поверх соседних веток. Читать такой
    граф нельзя.

    Теперь ветка — это линия: календарь и турниры, пользователи и роли,
    реестры, журнал, контент. Родитель выбирается по данным роли:

    1. первый экран роли растёт из входа;
    2. раздел, который открывают пунктом меню, — из первого экрана;
    3. остальное — из того экрана маршрута, который в него ведёт (`to:`).

    Возвраты и переходы через ветку не потеряны: они показываются пунктиром у
    того экрана, который выбран, — то есть тогда, когда про них спрашивают. */
function build(flow: RoleFlow, screens: ScreenMap, selected: string) {
  const known = new Set(flow.screens.map((s) => s.id));
  const commons = new Map(role00.screens.map((s) => [s.id, s]));
  const codes = Object.keys(screens);
  const byId = new Map<string, Screen>(
    codes
      .map((c) => [c, flow.screens.find((s) => s.id === c) ?? commons.get(c)!])
      .filter(([, s]) => !!s) as [string, Screen][],
  );

  const first = flow.screens[0].id;
  const entry = codes.find((c) => !known.has(c));
  const root = entry ?? first;
  const short = (t: string) => t.replace(/^«|»$/g, '').slice(0, 28);

  const parent = new Map<string, string>();
  const via = new Map<string, string>();
  codes.forEach((code, i) => {
    if (code === root) return;
    const sc = byId.get(code);
    if (!sc) return;
    if (code === first) {
      parent.set(code, root);
      via.set(code, 'вход под своей ролью');
      return;
    }
    if (/меню/i.test(sc.entry.join(' '))) {
      parent.set(code, first);
      via.set(code, short((sc.entry[0] ?? '').replace(/^Пункт меню /, '')));
      return;
    }
    for (let j = i - 1; j >= 0; j -= 1) {
      const act = byId.get(codes[j])?.actions.find((a) => a.to === code);
      if (act) {
        parent.set(code, codes[j]);
        via.set(code, short(act.el));
        return;
      }
    }
    parent.set(code, codes[i - 1] ?? first);
    via.set(code, short(sc.entry[0] ?? ''));
  });

  const kids = new Map<string, string[]>();
  codes.forEach((c) => {
    const p = parent.get(c);
    if (p) kids.set(p, [...(kids.get(p) ?? []), c]);
  });

  /* Вкладки — такие же узлы дерева, только листья: экран с вкладками это
     несколько экранов под одной шапкой, и на карте их должно быть видно
     по отдельности. Идентификатор — «Э14.5#Сетка». */
  const tabOf = new Map<string, { code: string; tab: ScreenTab }>();
  codes.forEach((code) => {
    const tabs = byId.get(code)?.tabs;
    if (!tabs?.length) return;
    const ids = tabs.map((tab) => {
      const id = `${code}#${tab.t}`;
      tabOf.set(id, { code, tab });
      return id;
    });
    kids.set(code, [...ids, ...(kids.get(code) ?? [])]);
  });

  /* Раскладка «в строку на ветку»: глубина даёт колонку, а строку получает
     каждый лист; родитель встаёт по центру своих детей.

     Высоту считаем по узлу, а не по общей сетке строк: узлы вкладок разной
     высоты (у одних есть условие «есть, когда…»), и на фиксированном шаге они
     наезжали друг на друга. */
  const hOf = (id: string) => {
    const t = tabOf.get(id);
    /* Высота считается по содержимому: узел экрана — код, название (длинное
       переносится) и строка-счётчик; узел вкладки — название и пояснение.
       Ширина узлов задана в `map.css` (200 и 178 px), отсюда и число знаков
       в строке. */
    if (!t) return 62 + Math.ceil((byId.get(id)?.title.length ?? 10) / 24) * 18;
    return 40 + Math.ceil(t.tab.t.length / 22) * 16 + Math.ceil(t.tab.what.length / 28) * 15 +
      (t.tab.when ? Math.ceil(t.tab.when.length / 26) * 14 : 0);
  };
  const depth = new Map<string, number>([[root, 0]]);
  const top = new Map<string, number>();
  let cursor = 0;
  const walk = (n: string) => {
    const ch = kids.get(n) ?? [];
    ch.forEach((c) => {
      depth.set(c, (depth.get(n) ?? 0) + 1);
      walk(c);
    });
    if (ch.length === 0) {
      top.set(n, cursor);
      cursor += hOf(n) + GAP;
      return;
    }
    const mid =
      ch.reduce((sum, c) => sum + (top.get(c) ?? 0) + hOf(c) / 2, 0) / ch.length;
    top.set(n, mid - hOf(n) / 2);
  };
  walk(root);

  /* Родитель встаёт по центру своих детей, и в одной колонке два таких центра
     иногда сходились в одну точку — узлы наезжали друг на друга. Разводим их
     по колонкам: соседа сверху не двигаем, нижний опускается на просвет. */
  const byDepth = new Map<number, string[]>();
  [...top.keys()].forEach((id) => {
    const d = depth.get(id) ?? 0;
    byDepth.set(d, [...(byDepth.get(d) ?? []), id]);
  });
  byDepth.forEach((ids) => {
    ids
      .sort((a, b) => (top.get(a) ?? 0) - (top.get(b) ?? 0))
      .forEach((id, i) => {
        if (i === 0) return;
        const prev = ids[i - 1];
        const min = (top.get(prev) ?? 0) + hOf(prev) + GAP;
        if ((top.get(id) ?? 0) < min) top.set(id, min);
      });
  });

  const edgeBase = {
    labelStyle: { fill: 'var(--c-board-muted)', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: 'var(--c-board-bg)' },
    labelBgPadding: [4, 2] as [number, number],
  };

  const edges: Edge[] = codes
    .filter((c) => parent.has(c))
    .map((c) => ({
      ...edgeBase,
      id: `${parent.get(c)}->${c}`,
      source: parent.get(c)!,
      target: c,
      label: via.get(c),
      type: 'smoothstep',
      style: { stroke: 'var(--c-board-line)' },
    }));

  /* Экран → его вкладка: связь без подписи, вкладка не переход, а часть того
     же экрана. Необязательная вкладка (есть не у каждого турнира) — пунктиром. */
  tabOf.forEach(({ code, tab }, id) => {
    edges.push({
      ...edgeBase,
      id: `${code}->${id}`,
      source: code,
      target: id,
      type: 'smoothstep',
      style: {
        stroke: 'var(--c-board-line)',
        ...(tab.when ? { strokeDasharray: '4 4' } : null),
      },
    });
  });

  /* Переходы выбранного экрана, которых нет в дереве: возвраты и связи веток.
     Номер действия в ключе обязателен: с одного экрана в другой ведут два
     разных действия («Перенести» и «Закрыть» — оба в карточку турнира). */
  (byId.get(selected)?.actions ?? []).forEach((a, i) => {
    if (!a.to || a.to === selected || parent.get(a.to) === selected || !byId.has(a.to)) return;
    edges.push({
      ...edgeBase,
      id: `x-${selected}-${i}-${a.to}`,
      source: selected,
      target: a.to,
      label: short(a.el),
      type: 'default',
      style: { stroke: 'var(--c-board-accent)', strokeDasharray: '5 4' },
    });
  });

  const nodes: Node[] = codes.map((code) => ({
    id: code,
    type: 'screen',
    position: { x: (depth.get(code) ?? 1) * COL, y: top.get(code) ?? 0 },
    data: { code, screen: byId.get(code)!, selected: code === selected, common: !known.has(code) },
    draggable: false,
  }));

  tabOf.forEach(({ code, tab }, id) => {
    nodes.push({
      id,
      type: 'tab',
      position: { x: (depth.get(id) ?? 1) * COL, y: top.get(id) ?? 0 },
      data: { code, tab, selected: code === selected },
      draggable: false,
    });
  });

  return { nodes, edges, byId, tabOf };
}

/* ── Карта ──────────────────────────────────────────────────────── */

export function FlowMap({ flow, screens }: { flow: RoleFlow; screens: ScreenMap }) {
  const codes = Object.keys(screens);
  const [selected, setSelected] = useState(codes[0]);
  /* Какая вкладка выбранного экрана открыта: карта нажимает переключатель в
     самом макете — он рабочий, и второго источника правды заводить не нужно. */
  const [tab, setTab] = useState<string | null>(null);
  const [fit, setFit] = useState(true);
  const { nodes, edges, byId, tabOf } = useMemo(
    () => build(flow, screens, selected),
    [flow, screens, selected],
  );

  /* Макет нарисован в натуральную величину (ноутбук — 1200 px), а панель у́же:
     ужимаем его целиком, иначе видно левую треть экрана. Масштаб считаем от
     реальной ширины содержимого — у планшета и телефона она другая. */
  const pane = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const box = pane.current;
    const content = inner.current;
    if (!box || !content) return;
    const measure = () => {
      const w = content.scrollWidth || 1;
      const k = fit ? Math.min(1, (box.clientWidth - 36) / w) : 1;
      setScale(k);
      setHeight(content.scrollHeight * k);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(content);
    return () => ro.disconnect();
  }, [selected, fit]);

  const spec = byId.get(selected);

  /* Переходы прямо в макете: кнопка на экране ведёт туда же, куда написано в
     данных. Ищем её по подписи действия — так проверяется и сам макет: у
     действия с переходом нашлась кнопка или нарисовать её забыли. Элемент, у
     которого переход задан руками (строка списка, плитка), помечается
     атрибутом `data-to` — по нему совпадение точное. */
  const [links, setLinks] = useState<
    { el: string; to: string; when?: string; found: boolean; common: boolean }[]
  >([]);

  /* Открыть нужную вкладку — значит нажать её в макете: переключатель рабочий,
     и карта пользуется им так же, как человек. */
  useEffect(() => {
    const root = inner.current;
    if (!root || !tab) return;
    const want = norm(tab);
    const hit = [...root.querySelectorAll<HTMLElement>('.dseg2 button, .seg button')].find((b) => {
      const label = norm(b.textContent ?? '');
      return label === want || label.startsWith(want);
    });
    if (hit && !hit.classList.contains('on')) hit.click();
  }, [tab, selected, scale]);

  useEffect(() => {
    const root = inner.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-goto]').forEach((el) => {
      el.removeAttribute('data-goto');
      el.classList.remove('fmap-hot');
    });
    /* Пункты сайдбара тоже ведут по разделам: какой пункт открывает экран,
       написано в самих данных («Пункт меню «Календарь»»). Не нашли по меню —
       пробуем по названию экрана: в макете пункт называется «Новости», а экран
       — «Новости и страницы». */
    const menu = (code: string, screen: Screen) => {
      const byMenu = screen.entry.join(' ').match(/Пункт меню «(.+?)»/)?.[1];
      return { code, byMenu: byMenu ? norm(byMenu) : null, title: norm(screen.title) };
    };
    const sections = [...byId.entries()].map(([code, sc]) => menu(code, sc));
    root.querySelectorAll<HTMLElement>('.dni, .tabbar .tab').forEach((nav) => {
      const label = norm(nav.textContent ?? '');
      if (!label) return;
      const hit =
        sections.find((x) => x.byMenu === label) ??
        sections.find((x) => x.title === label) ??
        sections.find((x) => label.length > 3 && x.title.startsWith(label));
      if (hit && hit.code !== selected) {
        nav.dataset.goto = hit.code;
        nav.classList.add('fmap-hot');
      }
    });

    const targets = (spec?.actions ?? []).filter((a) => a.to);
    const cands = [
      ...root.querySelectorAll<HTMLElement>(
        'button, .drow, .item, .ttab, .dchip, .dseg2 span, .jstart, .jbtn, [data-to]',
      ),
    ];
    setLinks(
      targets.map((a) => {
        const want = norm(a.el);
        /* Три способа узнать элемент, по порядку надёжности: переход задан
           руками; строка списка сама называет код экрана («Э6.2 · приём открыт
           до 12.03» — так подписаны строки «что сейчас требуется»); подпись
           кнопки совпадает с подписью действия. */
        const hit =
          cands.find((c) => c.dataset.to === a.to) ??
          cands.find(
            (c) =>
              (c.classList.contains('drow') || c.classList.contains('item')) &&
              (c.textContent ?? '').includes(a.to!),
          ) ??
          cands.find((c) => want.length > 2 && norm(c.textContent ?? '').includes(want));
        if (hit) {
          hit.dataset.goto = a.to!;
          hit.classList.add('fmap-hot');
        }
        return {
          el: a.el,
          to: a.to!,
          when: a.when,
          found: !!hit,
          // Сквозной экран может жить в разделе 00, а не в борде этой роли.
          common: !screens[a.to!] && role00.screens.some((sc) => sc.id === a.to),
        };
      }),
    );
  }, [selected, spec, scale, byId]);

  const go = (e: React.MouseEvent) => {
    const hit = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
    const to = hit?.dataset.goto;
    if (to && screens[to]) {
      e.preventDefault();
      setSelected(to);
      pane.current?.scrollTo({ top: 0 });
    }
  };

  return (
    <div className="fmap">
      <div className="fmap-graph">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => {
            const t = tabOf.get(n.id);
            setSelected(t ? t.code : n.id);
            setTab(t ? t.tab.t : null);
          }}
          fitView
          /* Не ужимаем до нечитаемого: ветка календаря уходит на пять шагов
             вправо, и «вписать целиком» в половину окна делает подписи узлов
             кашей. Ниже 0.55 не опускаемся — дальше человек листает сам. */
          fitViewOptions={{ padding: 0.12, minZoom: 0.55, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--c-board-line)" />
          <Controls showInteractive={false} />
        </ReactFlow>
        <div className="fmap-legend">
          <b>{flow.num} · {flow.title}</b>
          <span>{codes.length} экранов · клик по узлу открывает макет справа</span>
          <span>источник: <code>{flow.source}</code></span>
        </div>
      </div>

      <div className="fmap-view" ref={pane}>
        <div className="fmap-bar">
          <div>
            <span className="mkcode">{selected}</span> {screens[selected]?.cap}
          </div>
          <div className="fmap-zoom">
            <button type="button" className={fit ? 'on' : undefined} onClick={() => setFit(true)}>
              Вписать
            </button>
            <button type="button" className={fit ? undefined : 'on'} onClick={() => setFit(false)}>
              100%
            </button>
          </div>
        </div>

        <div className="fmap-shot" style={{ height: height || undefined }} onClickCapture={go}>
          <div
            ref={inner}
            className="fmap-scale"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            {screens[selected]?.view()}
          </div>
        </div>

        {links.length > 0 && (
          <div className="fmap-links">
            <h4>Переходы с этого экрана — подсвечены прямо в макете</h4>
            {links.map((l) => (
              <button
                key={l.el + l.to}
                type="button"
                className={
                  'fmap-link' + (l.found ? '' : l.common ? ' cond' : l.when ? ' cond' : ' miss')
                }
                onClick={() => screens[l.to] && setSelected(l.to)}
              >
                <b>{l.el}</b>
                <span>
                  → {l.to} ·{' '}
                  {screens[l.to]?.cap ?? (l.common ? 'сквозной экран — раздел 00' : 'экрана нет в макетах')}
                </span>
                {!l.found && (
                  <em>
                    {l.common
                      ? 'экран описан в сквозных (раздел 00) — в борде этой роли его нет'
                      : l.when
                      ? `кнопки на этом кадре нет — она доступна: ${l.when}`
                      : 'кнопки на макете не нашлось — действие не нарисовано'}
                  </em>
                )}
              </button>
            ))}
          </div>
        )}

        {spec && (
          <div className="fmap-spec">
            <NodeSpec screen={spec} />
          </div>
        )}
      </div>
    </div>
  );
}
