import type { ReactNode } from 'react';
import {
  LayoutDashboard, Network, Users, Grid2x2, Settings, Bell, Search,
} from 'lucide-react';
import { Brand } from './ui';
import { DeskFrame, type DeskVariant } from './deskShell';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { bigBracket } from './bigBracket';
import '../gen/frame.css';
import '../gen/desktop.css';
import { PanelSeg } from './segs';

/* Десктопная панель ГЛАВНОГО СУДЬИ (живое ведение турнира) — Storybook.
   Та же дизайн-система, что у приложения: стекло, Lucide, логотип ФНТ, фото-аватары. */

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const P = {
  smag: A(32), kim: A(44), zhu: A(22), gla: A(56), osp: A(67), pak: A(13),
  erl: A(75), aba: A(45), tok: A(51), ser: A(64), bai: A(85), mur: A(93), ref: A(76),
};

type PP = { av: string; n: string; s?: string; w?: boolean };

// столы зала: реалистично много (20). Компактные чипы — номер, статус, счёт.
const TABLES = Array.from({ length: 20 }, (_, i) => {
  const busy = i < 12;
  const scores = ['2 : 1', '1 : 1', '0 : 2', '3 : 2', '1 : 0', '2 : 2', '0 : 1', '1 : 3', '2 : 0', '1 : 2', '3 : 1', '0 : 0'];
  return { n: i + 1, busy, score: busy ? scores[i % scores.length] : null };
});

function LiveM({ tbl, a, b }: { tbl: string; a: PP; b: PP }) {
  return <div className="livem">
    <div className="top"><span className="tbl">{tbl}</span><span className="liv"><span className="d" />LIVE</span></div>
    <div className="pr"><img src={a.av} alt="" /><span className="n">{a.n}</span><span className="s">{a.s}</span></div>
    <div className="pr"><img src={b.av} alt="" /><span className="n">{b.n}</span><span className="s">{b.s}</span></div>
  </div>;
}

function QItem({ a, b, r }: { a: string; b: string; r: string }) {
  return <div className="qitem">
    <span className="qav"><img src={a} alt="" /><img src={b} alt="" /></span>
    <div className="q"><div className="n">{r}</div><div className="r">ожидает стола</div></div>
    <button className="callbtn">Вызвать</button>
  </div>;
}

const NAV: [ReactNode, string, boolean][] = [
  [<LayoutDashboard size={18} />, 'Обзор', true],
  [<Network size={18} />, 'Сетка', false],
  [<Users size={18} />, 'Игроки', false],
  [<Grid2x2 size={18} />, 'Столы', false],
  [<Settings size={18} />, 'Настройки', false],
];

export function RefereeDesktop({ variant = 'desktop', onNavigate }: { variant?: DeskVariant; onNavigate?: (item: string) => void }) {
  return <DeskFrame variant={variant}>

    <div className="dtop">
      <Brand />
      <div style={{ width: 1, height: 26, background: 'var(--c-glass-line)' }} />
      <div><div className="bname" style={{ fontSize: 14 }}>Чемпионат Казахстана 2026</div><div className="tname">Одиночный · олимпийская · г. Астана</div></div>
      <span className="live"><span className="d" />ИДЁТ</span>
      <div className="sp" />
      <button className="iconbtn"><Search size={16} /></button>
      <button className="iconbtn dot"><Bell size={16} /></button>
      <div className="me"><img src={P.ref} alt="" /><div><div className="nm">Оспанов Т.</div><div className="rl">Главный судья</div></div></div>
    </div>

    <div className="dgrid">
      <aside className="dside">
        {NAV.map(([ic, t, on]) => (
          <button key={t} type="button" className={'dni' + (on ? ' on' : '')} onClick={onNavigate ? () => onNavigate(t) : undefined}>
            {ic}{t}
          </button>
        ))}
        <div className="grow" />
        <div className="hint">Матч не начнётся, пока на стол не назначен судья.</div>
      </aside>

      <main className="dmain">
        <div className="dtitle"><h2>Обзор турнира</h2><p>Живая сводка · сетка обновляется после каждого результата</p></div>

        <div className="dchips">
          <div className="dchip"><div className="v">128</div><div className="k">Участников</div></div>
          <div className="dchip b"><div className="v">12</div><div className="k">Идут сейчас</div></div>
          <div className="dchip a"><div className="v">8</div><div className="k">Ждут стола</div></div>
          <div className="dchip g"><div className="v">60</div><div className="k">Завершено</div></div>
        </div>

        {/* столы зала — реалистично много (20), компактная сетка чипов */}
        <div className="dtables">
          {TABLES.map((t) => (
            <div key={t.n} className={'dtable ' + (t.busy ? 'busy' : 'free')}>
              <div className="tn">Стол {t.n}<span className="st" /></div>
              {t.busy ? <div className="sc">{t.score}</div> : <div className="pl">—</div>}
            </div>
          ))}
        </div>

        <div className="dcols">
          <section className="panel">
            <div className="phead"><span className="t">Сетка</span><PanelSeg items={['Сетка', 'Группы']} /></div>
            <div className="pbody dbracketWrap">
              {/* настоящий React Flow, большой посев (128) — реалистичный масштаб */}
              <BracketFlow bracket={bigBracket} minZoom={0.05} fitPadding={0.1} />
            </div>
          </section>

          <aside className="panel">
            <div className="phead"><span className="t">Идут и очередь</span></div>
            <div className="pbody">
              <div className="qsec">Идут сейчас</div>
              <LiveM tbl="СТОЛ 3 · ЭФИР" a={{ av: P.smag, n: 'Смагулов А.', s: '2' }} b={{ av: P.tok, n: 'Токаев М.', s: '1' }} />
              <LiveM tbl="СТОЛ 1" a={{ av: P.pak, n: 'Пак С.', s: '1' }} b={{ av: P.erl, n: 'Ерлан Б.', s: '1' }} />
              <div className="qsec">Ожидают вызова</div>
              <QItem a={P.zhu} b={P.bai} r="Жумабеков Р. — Байжанов А." />
              <QItem a={P.osp} b={P.mur} r="Оспанов Д. — Мұрат Е." />
              <QItem a={P.kim} b={P.gla} r="Ким Г. — Гладун И." />
            </div>
          </aside>
        </div>
      </main>
    </div>

  </DeskFrame>;
}
