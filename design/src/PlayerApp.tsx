import type { ReactNode } from 'react';
import '../gen/frame.css';

/* Перенос мокапа (gen/out/mockups) в настоящий код Storybook.
   Компоненты общие → одинаковые на всех экранах, как и должно быть. */

type Tab = 'home' | 'tournaments' | 'matches' | 'profile';

function Frame({ children }: { children: ReactNode }) {
  return <div className="frame"><div className="screen">
    <div className="island" />
    <div className="sys"><span>9:41</span><span>▲ ▼ 100%</span></div>
    {children}
  </div></div>;
}

const Brand = () => <div className="brand"><span className="mk">🏓</span> ФНТ РК</div>;
const Bell = () => <div className="bell dot">🔔</div>;

function TabBar({ active }: { active: Tab }) {
  const tabs: [Tab, string, string][] = [
    ['home', '⌂', 'Главная'], ['tournaments', '🏆', 'Турниры'],
    ['matches', '🏓', 'Матчи'], ['profile', '☰', 'Профиль'],
  ];
  return <div className="tabbar">{tabs.map(([id, i, t]) =>
    <div key={id} className={'tab' + (id === active ? ' on' : '')}><span className="i">{i}</span>{t}</div>)}
  </div>;
}

function Chart({ pts }: { pts: string }) {
  const last = pts.trim().split(' ').pop()!.split(',');
  return <svg className="chart" viewBox="0 0 260 66" preserveAspectRatio="none">
    <polyline fill="none" stroke="#3b7bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    <circle cx={last[0]} cy={last[1]} r="3.5" fill="#3b7bff" />
  </svg>;
}

function Stat({ v, k, tone }: { v: string; k: string; tone?: 'g' | 'r' | 'b' }) {
  return <div className={'stat' + (tone ? ' ' + tone : '')}><div className="v">{v}</div><div className="k">{k}</div></div>;
}

function Match({ win, ini, nm, mt, sc, dt }: { win: boolean; ini: string; nm: string; mt?: string; sc: string; dt: string }) {
  return <div className="match">
    <div className={'badge ' + (win ? 'win' : 'loss')}>{win ? 'W' : 'L'}</div>
    <div className="avatar sm">{ini}</div>
    <div className="who"><div className="nm">{nm}</div>{mt && <div className="mt">{mt}</div>}</div>
    <div className="sc">{sc}</div><div className="dt">{dt}</div>
  </div>;
}

const STATS = <div className="stats">
  <Stat v="128" k="Матчи" /><Stat v="98" k="Победы" tone="g" />
  <Stat v="30" k="Поражения" tone="r" /><Stat v="76%" k="Winrate" tone="b" />
</div>;

// ── экраны ───────────────────────────────────────────────────────────────
export function PlayerHome() {
  return <Frame>
    <div className="nav"><Brand /><Bell /></div>
    <div className="body">
      <div className="card pcard">
        <div className="avatar">СА</div>
        <div className="who"><div className="nm">Смагулов Алан</div><div className="mt">г. Алматы<br />Клуб: Алатау</div></div>
        <div className="rt"><div className="k">Рейтинг</div><div className="v">2456</div></div>
      </div>
      <div className="card">
        <div className="chart-h"><span className="t">Динамика рейтинга</span><span className="tagnew">NEW</span></div>
        <Chart pts="4,52 40,46 76,50 112,34 148,38 184,22 220,26 256,10" />
      </div>
      {STATS}
      <div className="rowh"><span className="sect">Последние матчи</span><span className="a">Смотреть все</span></div>
      <div className="card list">
        <Match win ini="КГ" nm="Ким Георгий" mt="г. Астана" sc="3:1" dt="12 мая" />
        <Match win ini="ЖР" nm="Жумабеков Р." mt="г. Караганда" sc="3:2" dt="11 мая" />
        <Match win={false} ini="ГИ" nm="Гладун Игорь" mt="г. Шымкент" sc="1:3" dt="10 мая" />
      </div>
    </div>
    <TabBar active="home" />
  </Frame>;
}

export function PlayerNotifications() {
  const Item = ({ ic, tt, ss, rt, live }: { ic: string; tt: string; ss: string; rt: string; live?: boolean }) =>
    <div className={'item' + (live ? ' live' : '')}><div className="ic">{ic}</div>
      <div className="tx"><div className="tt">{tt}</div><div className="ss">{ss}</div></div><div className="rt">{rt}</div></div>;
  return <Frame>
    <div className="nav"><span className="back">‹</span><span className="link">Прочитать все</span></div>
    <div className="body">
      <div className="title">Уведомления</div>
      <div className="sect">Новые</div>
      <Item ic="📢" tt="Вас вызвали к столу 3" ss="Матч 1/8 финала · Стол 3" rt="2 мин" live />
      <Item ic="✅" tt="Заявка принята" ss="Чемпионат Казахстана 2026" rt="1 ч" />
      <div className="sect">Ранее</div>
      <Item ic="📈" tt="Рейтинг обновлён: 2456" ss="+24 за матч с Ким Георгий" rt="вчера" />
      <Item ic="📅" tt="Расписание опубликовано" ss="Первенство города · 20 фев" rt="2 дня" />
      <Item ic="🏓" tt="Матч завершён" ss="Поражение 1:3 · Гладун Игорь" rt="3 дня" />
    </div>
    <TabBar active="home" />
  </Frame>;
}

export function PlayerStats() {
  return <Frame>
    <div className="nav"><Brand /><Bell /></div>
    <div className="body">
      <div className="card">
        <div className="chart-h"><span className="t">Рейтинг · сезон</span></div>
        <Chart pts="4,48 40,50 76,40 112,44 148,28 184,32 220,18 256,12" />
      </div>
      {STATS}
      <div className="rowh"><span className="sect">Последние матчи</span><span className="a">Смотреть все</span></div>
      <div className="card list">
        <Match win ini="КГ" nm="Ким Георгий" sc="3:1" dt="12 мая" />
        <Match win ini="ЖР" nm="Жумабеков Р." sc="3:2" dt="11 мая" />
        <Match win={false} ini="ГИ" nm="Гладун Игорь" sc="1:3" dt="10 мая" />
        <Match win ini="ОТ" nm="Оспанов Т." sc="3:0" dt="6 мая" />
        <Match win={false} ini="ПС" nm="Пак Сергей" sc="2:3" dt="4 мая" />
        <Match win ini="ЕБ" nm="Ерлан Б." sc="3:1" dt="1 мая" />
      </div>
    </div>
    <TabBar active="home" />
  </Frame>;
}

export function PlayerTournaments() {
  const T = ({ pill, cls, nm, mt, live }: { pill: string; cls: string; nm: string; mt: ReactNode; live?: boolean }) =>
    <div className={'card' + (live ? ' live' : '')} style={live ? { borderColor: 'rgba(16,185,129,.4)' } : undefined}>
      <span className={'pill ' + cls}>{pill}</span>
      <div className="nm" style={{ fontSize: 15, fontWeight: 700 }}>{nm}</div>
      <div className="mt" style={{ fontSize: 11.5, color: 'var(--mut)', marginTop: 5 }}>{mt}</div>
    </div>;
  return <Frame>
    <div className="nav"><Brand /><Bell /></div>
    <div className="body">
      <div className="title">Турниры</div>
      <div className="sect">Текущие</div>
      <T pill="● ИДЁТ" cls="live" nm="Чемпионат Казахстана 2026" live mt={<>г. Астана · 18–20 мая<br />Ваш матч: финал · стол 3</>} />
      <T pill="РЕГИСТРАЦИЯ" cls="reg" nm="Первенство города" mt="г. Алматы · 20 фев · Заявка открыта" />
      <div className="sect">Прошедшие</div>
      <T pill="ЗАВЕРШЁН" cls="done" nm="Кубок Алматы 2025" mt="12–14 фев · Ваше место 8 из 32" />
      <T pill="ЗАВЕРШЁН" cls="done" nm="Кубок КазНУ" mt="27 мая · Ваше место 8 из 24" />
    </div>
    <TabBar active="tournaments" />
  </Frame>;
}

const Arrow = ({ lbl }: { lbl: string }) => <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>;
const Col = ({ cap, children }: { cap: string; children: ReactNode }) => <div className="col"><div className="cap">{cap}</div>{children}</div>;

// Флоу-борд: те же экраны, связанные переходами (как в референсе).
export function PlayerFlowBoard() {
  return <div className="board">
    <div className="board-h">
      <div className="board-title">ИГРОК · МОБИЛЬНОЕ ПРИЛОЖЕНИЕ</div>
      <div className="board-tag">iOS · тёмная тема · плавающий таб-бар</div>
    </div>
    <div className="row">
      <Col cap="7 — Главная"><PlayerHome /></Col>
      <Arrow lbl="клик по колокольчику" />
      <Col cap="8 — Уведомления"><PlayerNotifications /></Col>
      <Arrow lbl="скролл вниз" />
      <Col cap="9 — Статистика"><PlayerStats /></Col>
      <Arrow lbl="вкладка «Турниры»" />
      <Col cap="12 — Турниры"><PlayerTournaments /></Col>
    </div>
  </div>;
}
