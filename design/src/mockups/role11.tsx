/* Роль 11 · Главный тренер национальной команды — макеты по флоу.
   Экраны Э11.1–Э11.3 (см. `flows/11-glavnyy-trener-sbornoy.md` и схему роли).

   ⚠ Вся роль — рабочая гипотеза: функционал в документе федерации не заполнен
   (вопрос 12.1), международных стартов в календаре нет. Рисуем минимальный
   наблюдательный кабинет: смотреть, сравнивать, выгружать. Данных роль не
   меняет — единственная «запись» на экране — личная звёздочка кандидата, она
   живёт в списке тренера и на реестр не влияет. */

import { Fragment } from 'react';
import { Download, Eye, Star } from 'lucide-react';
import {
  A, ActionBar, Arrow, Board, Chips, Form, Hint, Panel, Rows, RoleScreen, Screen,
} from './shell';
import type { ScreenMap } from './shell';
import { R11 } from './roles';
import { Login0_1 } from './role00';

/* ── данные экранов ──────────────────────────────────────────────── */

type Cand = {
  pl: string;
  av: string;
  nm: string;
  sub: string;
  res: [string, string][];
  r: string;
  d: string;
  up: boolean;
  star?: boolean;
};

const CANDS: Cand[] = [
  {
    pl: '1', av: A(44), nm: 'Ким Георгий', sub: '2003 г.р. · Астана · клуб «СКА» · мастер спорта РК',
    res: [['ЧК', '1'], ['Кубок', '2'], ['Спарт.', '1']], r: '2456', d: '+38', up: true, star: true,
  },
  {
    pl: '2', av: A(32), nm: 'Смагулов Алан', sub: '2004 г.р. · Алматы · клуб «Алатау» · мастер спорта РК',
    res: [['ЧК', '2'], ['Кубок', '1'], ['Спарт.', '4']], r: '2411', d: '+52', up: true, star: true,
  },
  {
    pl: '3', av: A(51), nm: 'Токаев Марат', sub: '2002 г.р. · Астана · клуб «Барыс» · мастер спорта РК',
    res: [['ЧК', '4'], ['Кубок', '3'], ['Спарт.', '2']], r: '2388', d: '−14', up: false,
  },
  {
    pl: '4', av: A(22), nm: 'Жумабеков Расул', sub: '2007 г.р. · Караганда · клуб «Шахтёр» · КМС',
    res: [['ЧК', '8'], ['Кубок', '4'], ['Спарт.', '3']], r: '2295', d: '+96', up: true, star: true,
  },
  {
    pl: '5', av: A(85), nm: 'Байжанов Арман', sub: '2005 г.р. · Актобе · клуб «Актобе» · КМС',
    res: [['ЧК', '8'], ['Кубок', '8'], ['Спарт.', '5']], r: '2270', d: '+11', up: true,
  },
  {
    pl: '6', av: A(93), nm: 'Мұрат Ерасыл', sub: '2008 г.р. · Шымкент · клуб «Достык» · КМС',
    res: [['ЧК', '8'], ['Кубок', '4'], ['Спарт.', '3']], r: '2244', d: '+130', up: true, star: true,
  },
  {
    pl: '7', av: A(56), nm: 'Гладун Игорь', sub: '2001 г.р. · Тараз · без клуба · мастер спорта РК',
    res: [['ЧК', '16'], ['Кубок', '8'], ['Спарт.', '6']], r: '2210', d: '−27', up: false,
  },
];

/* история рейтинга Кима Г. по месяцам сезона: 2372 → 2456 */
const CURVE = '0,49 42,53 85,40 128,36 171,43 214,29 257,20 300,11';

const MATCHES: { st: 'win' | 'loss'; nm: string; sub: string; sc: string; dt: string }[] = [
  { st: 'win', nm: 'Ким Г. — Токаев М.', sub: 'Чемпионат Казахстана 2026 · 1/4 финала', sc: '4:2', dt: '14.03' },
  { st: 'win', nm: 'Ким Г. — Байжанов А.', sub: 'Чемпионат Казахстана 2026 · 1/8 финала', sc: '4:0', dt: '13.03' },
  { st: 'loss', nm: 'Ким Г. — Смагулов А.', sub: 'Кубок Казахстана 2026 · финал', sc: '2:4', dt: '22.02' },
  { st: 'win', nm: 'Ким Г. — Жумабеков Р.', sub: 'Кубок Казахстана 2026 · 1/2 финала', sc: '4:3', dt: '21.02' },
  { st: 'win', nm: 'Ким Г. — Гладун И.', sub: 'Спартакиада РК 2026 · финал', sc: '4:1', dt: '26.01' },
  { st: 'win', nm: 'Ким Г. — Мұрат Е.', sub: 'Спартакиада РК 2026 · 1/2 финала', sc: '4:2', dt: '25.01' },
];

const H2H: [string, string, string][] = [
  ['Смагулов Алан', '5 : 4', 'последняя 22.02.2026 · 2:4'],
  ['Токаев Марат', '7 : 2', 'последняя 14.03.2026 · 4:2'],
  ['Жумабеков Расул', '3 : 1', 'последняя 21.02.2026 · 4:3'],
  ['Мұрат Ерасыл', '2 : 0', 'последняя 25.01.2026 · 4:2'],
];

/* три отмеченных кандидата — колонки сравнения Э11.3 */
const THREE = [CANDS[0], CANDS[1], CANDS[5]];

const CMP: [string, string, string, string][] = [
  ['Регион и клуб', 'Астана · «СКА»', 'Алматы · «Алатау»', 'Шымкент · «Достык»'],
  ['Возраст', '22 года (2003 г.р.)', '21 год (2004 г.р.)', '17 лет (2008 г.р.)'],
  ['Место в рейтинге', '1', '2', '6'],
  ['Рейтинг на 14.03.2026', '2456', '2411', '2244'],
  ['Чемпионат РК 2026', '1 место', '2 место', '1/8 финала'],
  ['Кубок РК 2026', '2 место', '1 место', '1/4 финала'],
  ['Спартакиада РК 2026', '1 место', '4 место', '3 место'],
  ['Матчей за сезон', '46 · побед 38', '44 · побед 35', '39 · побед 30'],
];

const CMP_H2H: [string, string, string] = [
  'со Смагуловым 5 : 4\nс Мұратом 2 : 0',
  'с Кимом 4 : 5\nс Мұратом 1 : 1',
  'с Кимом 0 : 2\nсо Смагуловым 1 : 1',
];

/* ── общие мелочи макета ─────────────────────────────────────────── */

const ReadOnly = () => (
  <span className="pill done" style={{ margin: 0 }}>
    <Eye size={11} /> ТОЛЬКО ЧТЕНИЕ
  </span>
);

const cellK = {
  padding: '9px 12px',
  borderTop: '1px solid var(--c-glass-line)',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--c-muted)',
};
const cellV = {
  padding: '9px 12px',
  borderTop: '1px solid var(--c-glass-line)',
  fontSize: 13,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums' as const,
};

/* ── Э11.1 · Кандидаты в сборную ─────────────────────────────────── */

export function Cands11_1() {
  return (
    <RoleScreen
      role={R11}
      nav="Кандидаты"
      title="Кандидаты в сборную"
      sub="Реестр спортсменов · рейтинг и динамика за сезон 2026"
    >
      <Chips
        items={[
          { v: '214', k: 'Спортсменов в отборе', tone: 'b' },
          { v: '7', k: 'В моём списке', tone: 'g' },
          { v: '3', k: 'Отмечено для сравнения', tone: 'a' },
          { v: '8', k: 'Главных стартов сезона' },
        ]}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div className="dseg2">
          <span className="on">Мужчины</span>
          <span>Женщины</span>
        </div>
        <div className="dseg2">
          <span className="on">Взрослые</span>
          <span>До 19 лет</span>
          <span>До 15 лет</span>
        </div>
        <div className="dseg2">
          <span className="on">Все регионы</span>
          <span>Астана</span>
          <span>Алматы</span>
        </div>
        <div className="dseg2">
          <span className="on">Сезон 2026</span>
          <span>Год</span>
        </div>
      </div>

      <ActionBar count="214 спортсменов · мужчины, взрослые, все регионы · период: сезон 2026">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="dpickbtn">Сравнить отмеченных (3)</button>
          <button className="dpickbtn">
            <Download size={14} /> Выгрузить список
          </button>
        </div>
      </ActionBar>

      <Rows>
        {CANDS.map((c) => (
          <div className="drow" key={c.nm} data-to="Э11.2">
            <div className="rank">{c.pl}</div>
            <img src={c.av} alt="" />
            <div className="who">
              <div className="nm">{c.nm}</div>
              <div className="rl">{c.sub}</div>
            </div>
            <div className="sets" style={{ gap: 5, flex: 'none' }}>
              {c.res.map(([k, v]) => (
                <span className="setchip" key={k}>{k} <b>{v}</b></span>
              ))}
            </div>
            <div className="amt" style={{ minWidth: 44, textAlign: 'right' }}>{c.r}</div>
            <div className={'delta' + (c.up ? ' up' : ' down')} style={{ minWidth: 42, textAlign: 'right' }}>
              {c.d}
            </div>
            <Star
              size={16}
              fill={c.star ? 'currentColor' : 'none'}
              style={{ color: c.star ? 'var(--c-warning)' : 'var(--c-dim)', flex: 'none' }}
            />
          </div>
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* ── Э11.2 · Карточка спортсмена — чтение ────────────────────────── */

export function Card11_2() {
  return (
    <RoleScreen
      role={R11}
      nav="Карточка"
      title="Ким Георгий — карточка спортсмена"
      sub="2003 г.р. · Астана · клуб «СКА» · 1 место в рейтинге"
    >
      <div className="mkcols">
        <Panel title="Профиль и рейтинг" extra={<ReadOnly />}>
          <div className="card pcard">
            <img className="avatar" src={A(44)} alt="" />
            <div className="who">
              <div className="nm">Ким Георгий</div>
              <div className="mt">Астана · клуб «СКА» · тренер Ахметов Дамир · мастер спорта РК</div>
            </div>
            <div className="rt">
              <div className="k">Рейтинг</div>
              <div className="v">2456</div>
            </div>
          </div>

          <Form>
            <div className="dfield">
              <div className="k">Год рождения</div>
              <div className="dval">2003 · 22 года</div>
            </div>
            <div className="dfield">
              <div className="k">Разряд</div>
              <div className="dval">Мастер спорта РК</div>
            </div>
            <div className="dfield">
              <div className="k">Матчей за сезон</div>
              <div className="dval">46 · побед 38 (83%)</div>
            </div>
            <div className="dfield">
              <div className="k">Динамика за сезон</div>
              <div className="dval" style={{ color: 'var(--c-success)' }}>+38 (было 2418)</div>
            </div>
            <div className="dfield wide">
              <div className="k">Главные старты по сезонам</div>
              <div className="dval" style={{ fontWeight: 500 }}>
                2026 — ЧК 1 место, Кубок РК 2 место, Спартакиада 1 место · 2025 — ЧК 3 место,
                Кубок РК 1 место · 2024 — ЧК 6 место
              </div>
            </div>
          </Form>

          <div className="chart-h" style={{ marginTop: 16 }}>
            <div className="t">История рейтинга · август 2025 — март 2026</div>
            <span className="tagnew">+38</span>
          </div>
          <svg className="chart" viewBox="0 0 300 68" preserveAspectRatio="none">
            <polyline points={CURVE} fill="none" stroke="var(--c-accent)" strokeWidth="2" />
          </svg>
        </Panel>

        <Panel title="Последние матчи" extra={<ReadOnly />}>
          <div className="list">
            {MATCHES.map((m) => (
              <div className="match" key={m.nm + m.dt}>
                <span className={'badge ' + m.st}>{m.st === 'win' ? 'П' : 'О'}</span>
                <div className="who">
                  <div className="nm">{m.nm}</div>
                  <div className="mt">{m.sub}</div>
                </div>
                <div className="sc">{m.sc}</div>
                <div className="dt">{m.dt}</div>
              </div>
            ))}
          </div>

          <div className="qsec">Личные встречи с соперниками</div>
          <Rows>
            {H2H.map(([nm, sc, sub]) => (
              <div className="drow" key={nm} style={{ cursor: 'default', padding: '9px 13px' }}>
                <div className="who">
                  <div className="nm">{nm}</div>
                  <div className="rl">{sub}</div>
                </div>
                <div className="amt">{sc}</div>
              </div>
            ))}
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э11.3 · Сравнение кандидатов ────────────────────────────────── */

export function Compare11_3() {
  return (
    <RoleScreen
      role={R11}
      nav="Сравнение"
      title="Сравнение кандидатов"
      sub="Трое отмеченных из списка · сезон 2026 · только просмотр"
    >
      <Panel
        title="Ким Георгий · Смагулов Алан · Мұрат Ерасыл"
        extra={
          <button className="dpickbtn">
            <Download size={14} /> Выгрузить сравнение
          </button>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '210px repeat(3, 1fr)' }}>
          <div />
          {THREE.map((c) => (
            <div key={c.nm} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px 12px' }}>
              <img
                src={c.av}
                alt=""
                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{c.nm}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{c.pl} место в рейтинге</div>
              </div>
            </div>
          ))}

          {CMP.map(([k, a, b, c]) => (
            <Fragment key={k}>
              <div style={cellK}>{k}</div>
              <div style={cellV}>{a}</div>
              <div style={cellV}>{b}</div>
              <div style={cellV}>{c}</div>
            </Fragment>
          ))}

          <div style={cellK}>Динамика за сезон</div>
          <div style={{ ...cellV, color: 'var(--c-success)' }}>+38</div>
          <div style={{ ...cellV, color: 'var(--c-success)' }}>+52</div>
          <div style={{ ...cellV, color: 'var(--c-success)' }}>+130</div>

          <div style={cellK}>Личные встречи между собой</div>
          {CMP_H2H.map((v, i) => (
            <div key={i} style={{ ...cellV, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{v}</div>
          ))}
        </div>
      </Panel>
    </RoleScreen>
  );
}

/* ── борд роли ───────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э11.1': {
    cap: 'Кандидаты в сборную',
    view: () => <Cands11_1 />,
    next: 'строка спортсмена',
  },
  'Э11.2': {
    cap: 'Карточка спортсмена — чтение',
    view: () => <Card11_2 />,
    next: 'отмечены трое · сравнить',
  },
  'Э11.3': {
    cap: 'Сравнение кандидатов',
    view: () => <Compare11_3 />,
  },
};

export function Role11Board() {
  return <Board role={R11} screens={SCREENS} />;
}
