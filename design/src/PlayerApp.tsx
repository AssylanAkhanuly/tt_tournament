import type { ReactNode } from 'react';
import {
  Bell, Home, Trophy, Swords, User, ChevronRight, ChevronLeft,
  Megaphone, CheckCircle2, TrendingUp, CalendarDays,
  Signal, Wifi, BatteryFull,
} from 'lucide-react';
import fntLogo from './assets/fnt-emblem.png';
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

function Frame({ children }: { children: ReactNode }) {
  return <div className="frame"><div className="screen">
    <div className="island" />
    <div className="sys">
      <span>9:41</span>
      <span className="r"><Signal size={14} /><Wifi size={14} /><BatteryFull size={17} /></span>
    </div>
    {children}
  </div></div>;
}

const Brand = () => <div className="brand"><img src={fntLogo} alt="ФНТ РК" /> ФНТ РК</div>;
const BellBtn = () => <button className="iconbtn dot"><Bell size={17} /></button>;
const SeeAll = () => <span className="a">Смотреть все <ChevronRight size={13} /></span>;

function TabBar({ active }: { active: Tab }) {
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
        <stop offset="0" stopColor="#6f9bff" stopOpacity="0.32" />
        <stop offset="1" stopColor="#6f9bff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polyline fill="url(#cg)" stroke="none" points={`0,68 ${pts} 260,68`} />
    <polyline fill="none" stroke="#6f9bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    <circle cx={last[0]} cy={last[1]} r="3.5" fill="#6f9bff" />
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
    <div className={'card' + (live ? ' live' : '')} style={live ? { borderColor: 'rgba(52,211,153,.4)' } : undefined}>
      <span className={'pill ' + cls}>{pill}</span>
      <div className="nm" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.1px' }}>{nm}</div>
      <div className="mt" style={{ fontSize: 11.5, color: 'var(--mut)', marginTop: 5, lineHeight: 1.5 }}>{mt}</div>
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
      <div className="board-tag">iOS · тёмная тема · Liquid Glass · Lucide</div>
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
