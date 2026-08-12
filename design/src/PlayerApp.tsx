import type { ReactNode } from 'react';
import {
  Bell, Home, Trophy, Swords, User, ChevronRight, ChevronLeft,
  Megaphone, CheckCircle2, TrendingUp, CalendarDays,
} from 'lucide-react';
import { Brand as FntBrand } from './ui';
import '../gen/frame.css';

/* Экраны игрока (тёмная тема, Liquid Glass). Lucide-иконки, логотип ФНТ РК,
   фото-аватары. Компоненты общие → одинаковые на всех экранах. */

const AV = {
  me:  'https://randomuser.me/api/portraits/men/32.jpg',
  kim: 'https://randomuser.me/api/portraits/men/44.jpg',
  zhu: 'https://randomuser.me/api/portraits/men/22.jpg',
  gla: 'https://randomuser.me/api/portraits/men/56.jpg',
  osp: 'https://randomuser.me/api/portraits/men/67.jpg',
  pak: 'https://randomuser.me/api/portraits/men/13.jpg',
  erl: 'https://randomuser.me/api/portraits/men/75.jpg',
};

type Tab = 'home' | 'tournaments' | 'matches' | 'profile';

// точные иконки статус-бара iOS (сотовая — 4 полоски, wifi-веер, батарея с носиком)
const IosCellular = () => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
    <rect x="0" y="8" width="3.1" height="4" rx="1" />
    <rect x="4.9" y="5.5" width="3.1" height="6.5" rx="1" />
    <rect x="9.8" y="3" width="3.1" height="9" rx="1" />
    <rect x="14.7" y="0.5" width="3.1" height="11.5" rx="1" />
  </svg>
);
const IosWifi = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
    <path d="M8.5 2.05c2.55 0 4.88.98 6.62 2.58a.62.62 0 0 0 .85-.02l.62-.64a.62.62 0 0 0-.02-.9A12.06 12.06 0 0 0 8.5 0 12.06 12.06 0 0 0 .43 3.05a.62.62 0 0 0-.02.9l.62.64c.23.24.6.25.85.02A9.68 9.68 0 0 1 8.5 2.05Z" />
    <path d="M8.5 5.55c1.55 0 2.97.58 4.05 1.53a.62.62 0 0 0 .85-.04l.66-.68a.62.62 0 0 0-.03-.9A8.4 8.4 0 0 0 8.5 3.3a8.4 8.4 0 0 0-5.53 2.16.62.62 0 0 0-.03.9l.66.68c.22.23.58.25.83.04A6.14 6.14 0 0 1 8.5 5.55Z" />
    <path d="M8.5 9.05c.62 0 1.19.22 1.64.58a.62.62 0 0 0 .83-.05l.72-.75a.62.62 0 0 0-.06-.92A5.06 5.06 0 0 0 8.5 6.7a5.06 5.06 0 0 0-3.13 1.19.62.62 0 0 0-.06.92l.72.75c.21.22.55.25.8.05.46-.36 1.03-.58 1.67-.58Z" />
    <circle cx="8.5" cy="10.75" r="1.15" />
  </svg>
);
const IosBattery = () => (
  <svg width="28" height="13" viewBox="0 0 28 13" fill="none" aria-hidden>
    <rect x="0.6" y="0.8" width="22.8" height="11.4" rx="3" stroke="currentColor" strokeOpacity="0.45" />
    <rect x="2.1" y="2.3" width="19.8" height="8.4" rx="1.7" fill="currentColor" />
    <path d="M25.1 4.5c1 .3 1.6 1.15 1.6 2.5s-.6 2.2-1.6 2.5V4.5Z" fill="currentColor" fillOpacity="0.45" />
  </svg>
);

export function Frame({ children }: { children: ReactNode }) {
  return <div className="frame"><div className="screen">
    <div className="island" />
    <div className="sys">
      <span className="time">9:41</span>
      <span className="r"><IosCellular /><IosWifi /><IosBattery /></span>
    </div>
    {children}
  </div></div>;
}

const Brand = () => <FntBrand size="sm" />;
const BellBtn = () => <button className="iconbtn dot"><Bell size={17} /></button>;
const SeeAll = () => <span className="a">Смотреть все <ChevronRight size={13} /></span>;

export function TabBar({ active }: { active: Tab }) {
  const tabs: [Tab, ReactNode, string][] = [
    ['home', <Home size={20} />, 'Главная'],
    ['tournaments', <Trophy size={20} />, 'Турниры'],
    ['matches', <Swords size={20} />, 'Матчи'],
    ['profile', <User size={20} />, 'Профиль'],
  ];
  return <div className="tabbar">{tabs.map(([id, icon, t]) =>
    <div key={id} className={'tab' + (id === active ? ' on' : '')}>{icon}{t}</div>)}
  </div>;
}

function Chart({ pts }: { pts: string }) {
  const last = pts.trim().split(' ').pop()!.split(',');
  return <svg className="chart" viewBox="0 0 260 68" preserveAspectRatio="none">
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--c-accent)" stopOpacity="0.32" />
        <stop offset="1" stopColor="var(--c-accent)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polyline fill="url(#cg)" stroke="none" points={`0,68 ${pts} 260,68`} />
    <polyline fill="none" stroke="var(--c-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--c-accent)" />
  </svg>;
}

function Stat({ v, k, tone }: { v: string; k: string; tone?: 'g' | 'r' | 'b' }) {
  return <div className={'stat' + (tone ? ' ' + tone : '')}><div className="v">{v}</div><div className="k">{k}</div></div>;
}

function Match({ win, av, nm, mt, sc, dt }: { win: boolean; av: string; nm: string; mt?: string; sc: string; dt: string }) {
  return <div className="match">
    <div className={'badge ' + (win ? 'win' : 'loss')}>{win ? 'W' : 'L'}</div>
    <img className="avatar sm" src={av} alt="" />
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
    <div className="nav"><Brand /><BellBtn /></div>
    <div className="body">
      <div className="card pcard">
        <img className="avatar" src={AV.me} alt="" />
        <div className="who"><div className="nm">Смагулов Алан</div><div className="mt">г. Алматы · Клуб Алатау</div></div>
        <div className="rt"><div className="k">Рейтинг</div><div className="v">2456</div></div>
      </div>
      <div className="card">
        <div className="chart-h"><span className="t">Динамика рейтинга</span><span className="tagnew">NEW</span></div>
        <Chart pts="4,54 40,48 76,52 112,36 148,40 184,24 220,28 256,11" />
      </div>
      {STATS}
      <div className="rowh"><span className="sect">Последние матчи</span><SeeAll /></div>
      <div className="card list">
        <Match win av={AV.kim} nm="Ким Георгий" mt="г. Астана" sc="3:1" dt="12 мая" />
        <Match win av={AV.zhu} nm="Жумабеков Р." mt="г. Караганда" sc="3:2" dt="11 мая" />
        <Match win={false} av={AV.gla} nm="Гладун Игорь" mt="г. Шымкент" sc="1:3" dt="10 мая" />
      </div>
    </div>
    <TabBar active="home" />
  </Frame>;
}

export function PlayerNotifications() {
  const Item = ({ icon, tt, ss, rt, live }: { icon: ReactNode; tt: string; ss: string; rt: string; live?: boolean }) =>
    <div className={'item' + (live ? ' live' : '')}><div className="ic">{icon}</div>
      <div className="tx"><div className="tt">{tt}</div><div className="ss">{ss}</div></div><div className="rt">{rt}</div></div>;
  return <Frame>
    <div className="nav"><span className="back"><ChevronLeft size={22} /></span><span className="link">Прочитать все</span></div>
    <div className="body">
      <div className="title">Уведомления</div>
      <div className="sect">Новые</div>
      <Item icon={<Megaphone size={18} />} tt="Вас вызвали к столу 3" ss="Матч 1/8 финала · Стол 3" rt="2 мин" live />
      <Item icon={<CheckCircle2 size={18} />} tt="Заявка принята" ss="Чемпионат Казахстана 2026" rt="1 ч" />
      <div className="sect">Ранее</div>
      <Item icon={<TrendingUp size={18} />} tt="Рейтинг обновлён: 2456" ss="+24 за матч с Ким Георгий" rt="вчера" />
      <Item icon={<CalendarDays size={18} />} tt="Расписание опубликовано" ss="Первенство города · 20 фев" rt="2 дня" />
      <Item icon={<Swords size={18} />} tt="Матч завершён" ss="Поражение 1:3 · Гладун Игорь" rt="3 дня" />
    </div>
    <TabBar active="home" />
  </Frame>;
}

export function PlayerStats() {
  return <Frame>
    <div className="nav"><Brand /><BellBtn /></div>
    <div className="body">
      <div className="card">
        <div className="chart-h"><span className="t">Рейтинг · сезон</span></div>
        <Chart pts="4,50 40,52 76,42 112,46 148,30 184,34 220,18 256,12" />
      </div>
      {STATS}
      <div className="rowh"><span className="sect">Последние матчи</span><SeeAll /></div>
      <div className="card list">
        <Match win av={AV.kim} nm="Ким Георгий" sc="3:1" dt="12 мая" />
        <Match win av={AV.zhu} nm="Жумабеков Р." sc="3:2" dt="11 мая" />
        <Match win={false} av={AV.gla} nm="Гладун Игорь" sc="1:3" dt="10 мая" />
        <Match win av={AV.osp} nm="Оспанов Т." sc="3:0" dt="6 мая" />
        <Match win={false} av={AV.pak} nm="Пак Сергей" sc="2:3" dt="4 мая" />
        <Match win av={AV.erl} nm="Ерлан Б." sc="3:1" dt="1 мая" />
      </div>
    </div>
    <TabBar active="home" />
  </Frame>;
}

export function PlayerTournaments() {
  const T = ({ pill, cls, live, nm, mt }: { pill: ReactNode; cls: string; live?: boolean; nm: string; mt: ReactNode }) =>
    <div className={'card' + (live ? ' live' : '')} style={live ? { borderColor: 'var(--c-success-line-2)' } : undefined}>
      <span className={'pill ' + cls}>{pill}</span>
      <div className="nm" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.1px' }}>{nm}</div>
      <div className="mt" style={{ fontSize: 11.5, color: 'var(--c-muted)', marginTop: 5, lineHeight: 1.5 }}>{mt}</div>
    </div>;
  return <Frame>
    <div className="nav"><Brand /><BellBtn /></div>
    <div className="body">
      <div className="title">Турниры</div>
      <div className="sect">Текущие</div>
      <T pill={<><span className="d" />ИДЁТ</>} cls="live" live nm="Чемпионат Казахстана 2026" mt={<>г. Астана · 18–20 мая<br />Ваш матч: финал · стол 3</>} />
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

export function PlayerFlowBoard() {
  return <div className="board">
    <div className="board-h">
      <div className="board-title">ИГРОК · МОБИЛЬНОЕ ПРИЛОЖЕНИЕ</div>
      <div className="board-tag">iOS · тёмная тема · Lucide</div>
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
