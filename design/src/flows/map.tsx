/* Карта флоу роли: граф маршрута слева, живой макет выбранного экрана справа.

   Зачем она вместо картинки: схема-PNG показывала маршрут, но по ней нельзя
   было посмотреть экран — приходилось искать колонку в борде. Здесь клик по
   узлу открывает сам макет во второй половине экрана, вместе с требованием к
   нему. Один клик вместо «найти нужную колонку среди пятнадцати».

   Ничего нового про содержание карта не заводит: узлы и связи считаются из
   данных роли (`data/roleNN.ts`), а макеты берутся из карты экранов роли
   (`SCREENS` в `mockups/roleNN.tsx`) — той же, из которой собирается борд. */

import { useMemo, useState } from 'react';
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
import { role00 } from './data/role00';
import { ScreenPane } from './screenPane';
import { SCREENS as COMMON_SCREENS } from '../mockups/role00';
/* У судьи два контура — кабинет вне турнира (0С) и работа за столом (9), —
   но человек и навигация у него одни ✳ (31.08.2026). Разделы сайдбара ведут
   через границу контуров, поэтому карта каждого из них знает экраны соседа:
   иначе половина пунктов меню в карте молча переставала нажиматься. */
import { SCREENS as JUDGE_TABLE } from '../mockups/role09';
import { SCREENS as JUDGE_CABINET } from '../mockups/role00j';
import './map.css';

/* Экраны из шапки: они есть на каждом экране системы и потому у каждой роли.
   В борд роли их не ставим (это не шаг маршрута), а на карте они нужны — иначе
   клик по колокольчику или по имени в шапке упирается в пустоту.

   `own` — по какому слову в подписи видно, что у роли есть свой такой экран: у
   спортсмена профиль объединён со взносом (Э14.7), и сквозной подставлять не
   нужно — получилось бы два «моих профиля» в одном маршруте. */
const FROM_HEADER: { code: string; own?: string }[] = [
  { code: 'Э0.3' },
  { code: 'Э0.2', own: 'профиль' },
];

/** Какие экраны из шапки подставить этой роли: только те, которых у неё нет
    своих. */
const fromHeader = (screens: ScreenMap) =>
  FROM_HEADER.filter(
    (h) =>
      !screens[h.code] &&
      COMMON_SCREENS[h.code] &&
      !(h.own && Object.values(screens).some((s) => s.cap.toLowerCase().includes(h.own!))),
  );

/* Дерево растёт слева направо: слой — колонка, соседи по слою стоят друг под
   другом. Сверху вниз оно расползалось по ширине (у первого экрана роли до
   восьми веток сразу), и в половине экрана граф ужимался до нечитаемого. */
const COL = 250;
/** Просвет между соседними узлами по вертикали. */
const GAP = 22;

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
      {/* Условие «есть, когда…» на узле не пишем: строкой под названием оно
          растило узел и повторяло то, что и так стоит в спеке экрана. Что
          вкладка необязательная, видно по пунктирной рамке. */}
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
    2. раздел, который открывают **пунктом меню**, — тоже из входа, а не из
       первого экрана: сайдбар стоит на каждом экране роли и доступен сразу
       после входа. Пока такие разделы висели на первом экране, карта говорила,
       что в «Заявки судей» ходят через «Мои соревнования», — а это не так;
    3. то же и с экранами из шапки (уведомления, свой профиль): колокольчик и
       имя есть везде, значит и они растут из входа;
    4. остальное — из того экрана маршрута, который в него ведёт (`to:`).

    Возвраты и переходы через ветку не потеряны, но линиями на карте не рисуются
    вовсе: кривая от выбранного узла шла назад через соседние ветки, пересекала
    чужие стрелки и подписи, и дерево маршрута перестало читаться. Их читают
    списком — под макетом стоит полоса «Переходы с этого экрана» с адресом
    каждого, и в самом макете они подсвечены. */
function build(flow: RoleFlow, screens: ScreenMap, selected: string) {
  const known = new Set(flow.screens.map((s) => s.id));
  const commons = new Map(role00.screens.map((s) => [s.id, s]));
  const codes = [...Object.keys(screens), ...fromHeader(screens).map((h) => h.code)];
  const byId = new Map<string, Screen>(
    codes
      .map((c) => [c, flow.screens.find((s) => s.id === c) ?? commons.get(c)!])
      .filter(([, s]) => !!s) as [string, Screen][],
  );

  const first = flow.screens[0].id;
  /* Корень маршрута — вход. Он общий у всех ролей: «флоу каждой роли начинается
     отсюда — Э0.1 Вход → первый экран роли» (flows/00). Раньше корнем брался
     первый чужой код в борде, и стоило поставить перед входом регистрацию, как
     дерево начинало расти из неё: вход, уведомления и профиль оказывались её
     ветками. Регистрация — путь до входа, а не после. */
  const entry = codes.includes('Э0.1') ? 'Э0.1' : codes.find((c) => !known.has(c));
  const root = entry ?? first;
  const short = (t: string) => t.replace(/^«|»$/g, '').slice(0, 28);

  const parent = new Map<string, string>();
  /** Связь только для раскладки: экран стоит в ветке, но стрелки к нему нет. */
  const weak = new Set<string>();
  codes.forEach((code, i) => {
    if (code === root) return;
    const sc = byId.get(code);
    if (!sc) return;
    if (code === first) {
      parent.set(code, root);
      return;
    }
    const header = FROM_HEADER.find((h) => h.code === code);
    if (header) {
      parent.set(code, root);
      return;
    }
    /* Раздел роли растёт из входа. Это не только пункт сайдбара: у планшетных
       ролей сайдбара нет вовсе, и разделы переключает полоса под шапкой — она
       так же стоит на каждом верхнеуровневом экране и так же доступна сразу
       после входа. Оба входа описаны в «как попадает», по ним и узнаём. */
    const nav = sc.entry.find((e) => /меню|переключател[а-яё]* разделов/i.test(e));
    if (nav) {
      parent.set(code, root);
      return;
    }
    /* Ведёт сюда не один экран: в отказ с причиной приходят и из заявок, и из
       протокола, и из документов. Родителем берём **первый по маршруту** — это
       и есть главный путь, тот, ради которого экран нарисован. Раньше брали
       ближайший сверху, и ветка цеплялась за случайного соседа: отказ по заявке
       судьи висел на документах на проверке. */
    for (let j = 0; j < i; j += 1) {
      const act = byId.get(codes[j])?.actions.find((a) => a.to === code);
      if (act) {
        parent.set(code, codes[j]);
        return;
      }
    }
    /* Перехода в этот экран в данных нет: ставим его в дерево к предыдущему,
       но стрелку не рисуем — она сказала бы о переходе, которого нет. Экраны
       так и должны выглядеть: стоят в маршруте, а входят в них по-другому
       (уведомлением, из состояния, из чужой роли). */
    parent.set(code, codes[i - 1] ?? first);
    weak.add(code);
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
     высоты (у одних название длиннее), и на фиксированном шаге они
     наезжали друг на друга. */
  const hOf = (id: string) => {
    const t = tabOf.get(id);
    /* Высота считается по содержимому: узел экрана — код, название (длинное
       переносится) и строка-счётчик; узел вкладки — название и пояснение.
       Ширина узлов задана в `map.css` (200 и 178 px), отсюда и число знаков
       в строке. */
    if (!t) return 62 + Math.ceil((byId.get(id)?.title.length ?? 10) / 24) * 18;
    return 40 + Math.ceil(t.tab.t.length / 22) * 16 + Math.ceil(t.tab.what.length / 28) * 15;
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

  /* Подписей на линиях нет ✳. Они дублировали то, что и так написано в панели
     под макетом («как попадает» — списком, полностью), а на карте лезли под
     соседние ветки и превращали дерево в текст. Линия отвечает на «отсюда
     сюда»; чем именно — читают у экрана. */
  const edgeBase = {};

  const edges: Edge[] = codes
    .filter((c) => parent.has(c) && !weak.has(c))
    .map((c) => ({
      ...edgeBase,
      id: `${parent.get(c)}->${c}`,
      source: parent.get(c)!,
      target: c,
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

  /* Переходов выбранного экрана, которых нет в дереве (возвраты и связи веток),
     на карте нет намеренно.

     Они рисовались пунктиром по кривой прямо через соседние ветки: линия шла
     из выбранного узла назад и вверх, пересекала чужие стрелки и подписи, и
     дерево маршрута перестало читаться — а именно за ним на карту и смотрят.
     Читать их всё равно удобнее списком: справа под макетом стоят все переходы
     выбранного экрана с адресом каждого, и в самом макете они подсвечены. */

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

export function FlowMap({ flow, screens: own }: { flow: RoleFlow; screens: ScreenMap }) {
  /* Экраны роли плюс те, что открываются из шапки на любом экране: макеты у
     них общие (раздел 00), и карта показывает их так же, как свои. */
  const screens = useMemo<ScreenMap>(() => {
    const extra = Object.fromEntries(fromHeader(own).map((h) => [h.code, COMMON_SCREENS[h.code]]));
    return { ...own, ...extra };
  }, [own]);

  /* Экраны, до которых можно ДОЙТИ, — шире тех, что стоят на графе. У судьи
     навигация одна на два контура ✳ (31.08.2026): из турнирных экранов пункт
     «Аттестация» ведёт в кабинет, из кабинета «Мой стол» — на турнир. Граф при
     этом остаётся своим: чужие экраны узлами не встают и в счётчик не идут —
     иначе карта роли показывала бы чужой маршрут. */
  const reachable = useMemo<ScreenMap>(() => {
    const other =
      flow.num === '9' ? JUDGE_CABINET : flow.num === '0С' ? JUDGE_TABLE : undefined;
    return other ? { ...other, ...screens } : screens;
  }, [screens, flow.num]);

  const codes = Object.keys(screens);
  const ownCount = Object.keys(own).length;
  const headCount = codes.length - ownCount;
  const [selected, setSelected] = useState(codes[0]);
  /* Какая вкладка выбранного экрана открыта: карта нажимает переключатель в
     самом макете — он рабочий, и второго источника правды заводить не нужно. */
  const [tab, setTab] = useState<string | null>(null);
  const [fit, setFit] = useState(true);
  const { nodes, edges, byId, tabOf } = useMemo(
    () => build(flow, screens, selected),
    [flow, screens, selected],
  );

  const spec = byId.get(selected);

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
          {/* Экраны роли и экраны из шапки считаем врозь. Одним числом легенда
              расходилась с подписью истории в сайдбаре: там экраны роли (карта
              SCREENS), а здесь были ещё и профиль с уведомлениями — «9 экранов»
              в сайдбаре против «11 экранов» на той же карте. */}
          <span>
            {ownCount} экранов{headCount ? ` + ${headCount} из шапки` : ''} · клик по узлу
            открывает макет справа
          </span>
          <span>источник: <code>{flow.source}</code></span>
        </div>
      </div>

      <ScreenPane
        screens={reachable}
        selected={selected}
        onSelect={setSelected}
        tab={tab}
        spec={spec}
        byId={byId}
      />
    </div>
  );
}
