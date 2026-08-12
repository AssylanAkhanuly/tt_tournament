import type { ReactNode } from 'react';
import { Bell, LayoutDashboard, Grid2x2, Network, Users } from 'lucide-react';
import { Frame } from './PlayerApp';
import { MiniTabBar } from './respShell';
import { ORG_TABS } from './orgCommon';
import { Brand } from './ui';
import '../gen/frame.css';
import '../gen/desktop.css';
import './tournament.css';

/* Мобильная (и планшетная) версия панели главного судьи — тот же сценарий, что и
   десктоп, но раскладка под узкий экран (правило «веб = десктоп/таблет/мобилка»). */

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;

function RLive({ tbl, a, sa, b, sb }: { tbl: string; a: { av: string; n: string }; sa: string; b: { av: string; n: string }; sb: string }) {
  return (
    <div className="card rlive">
      <div className="rlTop"><span className="rlTbl">{tbl}</span><span className="livebadge" style={{ padding: '3px 9px', fontSize: 9.5 }}><span className="d" />LIVE</span></div>
      <div className="rlp"><img className="avatar sm" src={a.av} alt="" /><span className="nm">{a.n}</span><span className="sc">{sa}</span></div>
      <div className="rlp"><img className="avatar sm" src={b.av} alt="" /><span className="nm">{b.n}</span><span className="sc">{sb}</span></div>
    </div>
  );
}

function RQ({ a, b, r }: { a: string; b: string; r: string }) {
  return (
    <div className="item rq">
      <span className="qav2"><img src={a} alt="" /><img src={b} alt="" /></span>
      <div className="tx"><div className="tt">{r}</div><div className="ss">ожидает стола</div></div>
      <button className="btnp" style={{ padding: '8px 12px' }}>Вызвать</button>
    </div>
  );
}


const STATS = (
  <div className="stats">
    <div className="stat"><div className="v">128</div><div className="k">Участ.</div></div>
    <div className="stat b"><div className="v">12</div><div className="k">Идут</div></div>
    <div className="stat"><div className="v">8</div><div className="k">Ждут</div></div>
    <div className="stat g"><div className="v">60</div><div className="k">Готово</div></div>
  </div>
);

// планшет — тот же дашборд в две колонки (шире телефона, компактнее десктопа)
function TTable({ n, sc }: { n: number; sc?: string }) {
  return (
    <div className={'dtable ' + (sc ? 'busy' : 'free')}>
      <div className="tn">Стол {n}<span className="st" /></div>
      {sc ? <div className="sc">{sc}</div> : <div className="pl">—</div>}
    </div>
  );
}

export function RefereeTablet() {
  return (
    <div className="tabframe"><div className="tabscreen">
      <div className="ttop">
        <Brand />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Чемпионат Казахстана 2026</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>Одиночный · олимпийская · г. Астана</div>
        </div>
        <span className="livebadge"><span className="d" />ИДЁТ</span>
      </div>
      {STATS}
      <div className="tgrid">
        <div className="tcol">
          <div className="sect">Идут сейчас</div>
          <RLive tbl="Стол 3 · эфир" a={{ av: A(32), n: 'Смагулов А.' }} sa="2" b={{ av: A(51), n: 'Токаев М.' }} sb="1" />
          <RLive tbl="Стол 1" a={{ av: A(13), n: 'Пак С.' }} sa="1" b={{ av: A(75), n: 'Ерлан Б.' }} sb="1" />
          <div className="sect">Столы</div>
          <div className="ttables">
            {Array.from({ length: 12 }, (_, i) => (
              <TTable key={i} n={i + 1} sc={i < 7 ? ['2:1', '1:1', '0:2', '3:2', '1:0', '2:2', '0:1'][i] : undefined} />
            ))}
          </div>
        </div>
        <div className="tcol">
          <div className="sect">Ожидают вызова</div>
          <RQ a={A(22)} b={A(85)} r="Жумабеков Р. — Байжанов А." />
          <RQ a={A(67)} b={A(93)} r="Оспанов Д. — Мұрат Е." />
          <RQ a={A(44)} b={A(56)} r="Ким Г. — Гладун И." />
        </div>
      </div>
    </div></div>
  );
}

export function RefereeMobile({ onNavigate }: { onNavigate?: (item: string) => void } = {}) {
  return (
    <Frame>
      <div className="nav">
        <Brand size="sm" sub="Судья" />
        <button className="iconbtn dot"><Bell size={17} /></button>
      </div>
      <div className="body">
        <div className="title">Чемпионат Казахстана</div>
        <div className="sect">Сводка</div>
        {STATS}
        <div className="sect">Идут сейчас</div>
        <RLive tbl="Стол 3 · эфир" a={{ av: A(32), n: 'Смагулов А.' }} sa="2" b={{ av: A(51), n: 'Токаев М.' }} sb="1" />
        <RLive tbl="Стол 1" a={{ av: A(13), n: 'Пак С.' }} sa="1" b={{ av: A(75), n: 'Ерлан Б.' }} sb="1" />
        <div className="sect">Ожидают вызова</div>
        <RQ a={A(22)} b={A(85)} r="Жумабеков Р. — Байжанов А." />
        <RQ a={A(67)} b={A(93)} r="Оспанов Д. — Мұрат Е." />
      </div>
      <MiniTabBar items={ORG_TABS} active="Обзор" onSelect={onNavigate} />
    </Frame>
  );
}
