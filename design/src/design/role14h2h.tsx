/* «Личные встречи» в языке присланных референсов (29.08.2026).

   Второй референс — карточка матча из спортивного приложения: название
   соревнования сверху, эмблемы соперников по краям, СЧЁТ крупно посередине,
   стадия под ним, акцентная рамка у текущего матча и точки-перелистывание.
   Выше — лента чипов-фильтров и полоса круглых аватаров, ниже — вкладки
   «вчера / сегодня / ближайшие / архив».

   Переведено на нашу предметную область без изобретения сущностей:

     чипы «Basketball / Football»  → сезоны: 2026 · 2025 · 2024
     круглые эмблемы клубов        → соперники: фото и фамилия
     карточка матча GSW 1:3 BOS    → встреча: я слева, соперник справа,
                                     счёт по партиям посередине
     вкладки «Yesterday / Today»   → «Все · Победы · Поражения»

   Содержание — flows/14-sportsmen.md, Э14.6, блок «Личные встречи»: по каждому
   сопернику полоса побед и поражений, а под ней список — клуб, рейтинг
   соперника, партии, кто в перевесе.

   Графики на месте и настоящие (Chart.js), как и требует флоу: кривая рейтинга
   по турнирам и сравнение по соперникам полосами побед и поражений. Карточки
   встреч добавлены к ним, а не вместо них: график отвечает «с кем как»,
   карточки и список — «что именно было».

   Цвет и радиусы — палитра референса `--d-*` и радиусы `--r-d-*`, те же, что
   у варианта Д профиля (`role14prof2.css`). */

import { ChartBox, soft, token } from '@/shared/kit/chart';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
import { A, AW } from '../fedCommon';
import { Chrome, NAV } from './role14mobile';
import './role14h2h.css';

const ME = { nm: 'Ким Г.', club: 'СКА · Астана', av: A(44) };

const SEASONS = ['2026', '2025', '2024', 'Все'];

/** Соперники, с которыми уже играли. Кружки-аватары, как эмблемы в референсе. */
const RIVALS: { nm: string; av: string; w: number; l: number }[] = [
  { nm: 'Оспанов Р.', av: A(12), w: 5, l: 3 },
  { nm: 'Ли С.', av: A(23), w: 2, l: 4 },
  { nm: 'Ахметов Д.', av: A(31), w: 1, l: 3 },
  { nm: 'Тлеу А.', av: A(52), w: 4, l: 0 },
  { nm: 'Ким А.', av: AW(28), w: 2, l: 2 },
];

/** Встречи. `live` — матч идёт сейчас: у него акцентная рамка, как в референсе. */
type Meet = {
  tour: string;
  stage: string;
  when: string;
  rival: { nm: string; av: string; club: string };
  me: number;
  them: number;
  sets: string;
  live?: boolean;
};

const MEETS: Meet[] = [
  {
    tour: 'Кубок Алматы 2026',
    stage: '1/8 финала · идёт',
    when: 'сейчас',
    rival: { nm: 'Оспанов Р.', av: A(12), club: 'Шахтёр · Караганда' },
    me: 1,
    them: 2,
    sets: '11:8 · 9:11 · 6:11',
    live: true,
  },
  {
    tour: 'Чемпионат Республики',
    stage: '1/4 финала',
    when: '18.05.2026',
    rival: { nm: 'Ли С.', av: A(23), club: 'Отан · Шымкент' },
    me: 3,
    them: 1,
    sets: '11:6 · 8:11 · 11:9 · 11:7',
  },
  {
    tour: 'Кубок Астаны 2026',
    stage: 'группа B',
    when: '26.03.2026',
    rival: { nm: 'Ахметов Д.', av: A(31), club: 'Алатау · Алматы' },
    me: 2,
    them: 3,
    sets: '11:9 · 7:11 · 11:8 · 5:11 · 9:11',
  },
];

const TABS = ['Все', 'Победы', 'Поражения'];

/** Рейтинг по сыгранным турнирам: точка = турнир. Настоящий график, а не
    картинка — по нарисованному нельзя прочитать ни дельту, ни где закончил
    (требование flows, Э14.6). */
const SEASON: { t: string; r: number; d: number }[] = [
  { t: 'Кубок Тараза', r: 2394, d: 12 },
  { t: 'Кубок Астаны', r: 2378, d: -16 },
  { t: 'Первенство РК', r: 2415, d: 37 },
  { t: 'Кубок Шымкента', r: 2402, d: -13 },
  { t: 'Чемпионат РК', r: 2448, d: 46 },
  { t: 'Кубок Алматы', r: 2456, d: 8 },
];

/** Кривая рейтинга. Точки покрашены по знаку дельты: зелёная в плюс, красная
    в минус — так видно не только уровень, но и чем кончился каждый турнир. */
const RatingChart = () => (
  <ChartBox
    height={210}
    label="Динамика рейтинга по турнирам сезона"
    make={(el) => ({
      type: 'line',
      data: {
        labels: SEASON.map((p) => p.t),
        datasets: [
          {
            data: SEASON.map((p) => p.r),
            borderColor: token('--c-accent', el),
            backgroundColor: soft('--c-accent', 18, el),
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: SEASON.map((p) =>
              token(p.d >= 0 ? '--c-success' : '--c-danger', el),
            ),
            pointBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (i) => {
                const p = SEASON[i.dataIndex];
                return `рейтинг ${p.r} · ${p.d >= 0 ? '+' : ''}${p.d} за турнир`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: token('--c-dim', el), font: { size: 10 } } },
          y: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), font: { size: 10 } },
          },
        },
      },
    })}
  />
);

/** Сравнение по соперникам: победы и поражения одной полосой. Горизонтально —
    подписи это фамилии, вертикаль их обрезала бы. */
const RivalsChart = () => (
  <ChartBox
    height={200}
    label="Личные встречи: победы и поражения по каждому сопернику"
    make={(el) => ({
      type: 'bar',
      data: {
        labels: RIVALS.map((r) => r.nm),
        datasets: [
          {
            label: 'Победы',
            data: RIVALS.map((r) => r.w),
            backgroundColor: token('--c-success', el),
            borderWidth: 0,
          },
          {
            label: 'Поражения',
            data: RIVALS.map((r) => r.l),
            backgroundColor: soft('--c-danger', 70, el),
            borderWidth: 0,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: token('--c-muted', el), boxWidth: 10, font: { size: 11 } },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), stepSize: 1, font: { size: 10 } },
          },
          y: { stacked: true, grid: { display: false }, ticks: { color: token('--c-ink', el), font: { size: 11 } } },
        },
      },
    })}
  />
);

/** Панель под график: у холста должно быть своё поле, иначе он висит в воздухе. */
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="h2-panel">{children}</div>
);

/* ── Куски, общие для десктопа и телефона ───────────────────────── */

const Chips = () => (
  <div className="h2-chips">
    {SEASONS.map((s, i) => (
      <button type="button" className={'h2-chip' + (i === 0 ? ' on' : '')} key={s}>
        {s}
      </button>
    ))}
  </div>
);

const Rivals = () => (
  <div className="h2-rivals">
    {RIVALS.map((r) => (
      <button type="button" className="h2-rival" key={r.nm}>
        <span className="ring">
          <img src={r.av} alt="" />
        </span>
        <span className="nm">{r.nm}</span>
        <span className="sc">
          {r.w}:{r.l}
        </span>
      </button>
    ))}
  </div>
);

/** Карточка встречи — тот самый приём референса: соперники по краям, счёт
    посередине, соревнование сверху, стадия снизу. */
const Card = ({ m }: { m: Meet }) => (
  <div className={'h2-card' + (m.live ? ' live' : '')}>
    <div className="h2-tour">{m.tour}</div>
    <div className="h2-mid">
      <span className="side">
        <span className="ring">
          <img src={ME.av} alt="" />
        </span>
        <span className="nm">{ME.nm}</span>
        <span className="cl">{ME.club}</span>
      </span>

      <span className="score">
        <b className="o14-disp">
          {m.me}:{m.them}
        </b>
        <span className="sets">{m.sets}</span>
      </span>

      <span className="side">
        <span className="ring">
          <img src={m.rival.av} alt="" />
        </span>
        <span className="nm">{m.rival.nm}</span>
        <span className="cl">{m.rival.club}</span>
      </span>
    </div>
    <div className="h2-stage">{m.stage}</div>
  </div>
);

const Dots = ({ n = 3 }: { n?: number } = {}) => (
  <div className="h2-dots">
    {Array.from({ length: n }, (_, i) => (
      <i className={i === 0 ? 'on' : ''} key={i} />
    ))}
  </div>
);

const Tabs = () => (
  <div className="h2-tabs">
    {TABS.map((t, i) => (
      <button type="button" className={i === 0 ? 'on' : ''} key={t}>
        {t}
      </button>
    ))}
  </div>
);

/** Список встреч под вкладками: строка = одна встреча. */
const List = () => (
  <div className="h2-list">
    {MEETS.map((m) => (
      <div className={'h2-row' + (m.me > m.them ? ' win' : ' loss')} key={m.tour}>
        <img src={m.rival.av} alt="" />
        <span className="tx">
          <span className="nm">{m.rival.nm}</span>
          <span className="ss">
            {m.tour} · {m.stage} · {m.when}
          </span>
        </span>
        <span className="sets">{m.sets}</span>
        <span className="sc o14-disp">
          {m.me}:{m.them}
        </span>
      </div>
    ))}
  </div>
);

/* ═══ Десктоп ══════════════════════════════════════════════════════ */
export function H2H({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Аналитика" title="Аналитика">
      <div className="h2 o14-nohead">
        <div className="h2-top">
          <h1 className="o14-disp">Аналитика</h1>
          <Chips />
        </div>

        <Rivals />

        <div className="h2-sec">Динамика рейтинга</div>
        <Panel>
          <RatingChart />
        </Panel>

        <div className="h2-sec">С кем как</div>
        <Panel>
          <RivalsChart />
        </Panel>

        <div className="h2-sec">Встречи</div>
        <div className="h2-cards">
          {MEETS.map((m) => (
            <Card m={m} key={m.tour} />
          ))}
        </div>

        <Tabs />
        <List />
      </div>
    </RoleScreen>
  );
}

/* ═══ Телефон ══════════════════════════════════════════════════════
   Референс телефонный: чипы лентой, аватары лентой, одна карточка на экран с
   точками под ней, ниже вкладки и список. */
export function H2HPhone() {
  return (
    <div className="mb-wrap m5 h2 h2m">
      <Frame>
        <Chrome bare>
          <div className="mb-body m5-body">
            <div className="h2-top">
              <h1 className="o14-disp">Аналитика</h1>
            </div>
            <Chips />
            <Rivals />

            <div className="h2-sec">Динамика рейтинга</div>
            <Panel>
              <RatingChart />
            </Panel>

            <div className="h2-sec">С кем как</div>
            <Panel>
              <RivalsChart />
            </Panel>

            <div className="h2-sec">Встречи</div>
            <div className="h2-cards">
              <Card m={MEETS[0]} />
            </div>
            <Dots />

            <Tabs />
            <List />
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Профиль" />
      </Frame>
    </div>
  );
}
