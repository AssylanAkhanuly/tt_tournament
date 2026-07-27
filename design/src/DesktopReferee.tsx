import type { ReactNode } from 'react';
import {
  LayoutDashboard, Network, Users, Grid2x2, Settings, Bell, Search,
} from 'lucide-react';
import fntLogo from './assets/fnt-emblem.png';
import '../gen/frame.css';
import '../gen/desktop.css';

/* Десктопная панель ГЛАВНОГО СУДЬИ (живое ведение турнира) — Storybook.
   Та же дизайн-система, что у приложения: стекло, Lucide, логотип ФНТ, фото-аватары. */

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const P = {
  smag: A(32), kim: A(44), zhu: A(22), gla: A(56), osp: A(67), pak: A(13),
  erl: A(75), aba: A(45), tok: A(51), ser: A(64), bai: A(85), mur: A(93), ref: A(76),
};

type PP = { av: string; n: string; s?: string; w?: boolean };
const Bp = ({ p }: { p: PP | null }) => p
  ? <div className={'bp' + (p.w ? ' w' : '')}><img src={p.av} alt="" /><span className="n">{p.n}</span><span className="s">{p.s ?? '–'}</span></div>
  : <div className="bp"><span className="n" style={{ color: 'var(--dim)' }}>—</span></div>;
const BMatch = ({ p1, p2, now }: { p1: PP | null; p2: PP | null; now?: boolean }) =>
  <div className={'bmatch' + (now ? ' now' : '')}><Bp p={p1} /><Bp p={p2} /></div>;

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

export function RefereeDesktop() {
  return <div className="dwrap"><div className="laptop">

    <div className="dtop">
      <img className="logo" src={fntLogo} alt="ФНТ РК" />
      <div><div className="bname">ФНТ РК</div></div>
      <div style={{ width: 1, height: 26, background: 'var(--glass-line)' }} />
      <div><div className="bname" style={{ fontSize: 14 }}>Чемпионат Казахстана 2026</div><div className="tname">Одиночный · олимпийская · г. Астана</div></div>
      <span className="live"><span className="d" />ИДЁТ</span>
      <div className="sp" />
      <button className="iconbtn"><Search size={16} /></button>
      <button className="iconbtn dot"><Bell size={16} /></button>
      <div className="me"><img src={P.ref} alt="" /><div><div className="nm">Оспанов Т.</div><div className="rl">Главный судья</div></div></div>
    </div>

    <div className="dgrid">
      <aside className="dside">
        {NAV.map(([ic, t, on]) => <div key={t} className={'dni' + (on ? ' on' : '')}>{ic}{t}</div>)}
        <div className="grow" />
        <div className="hint">Матч не начнётся, пока на стол не назначен судья.</div>
      </aside>

      <main className="dmain">
        <div className="dtitle"><h2>Обзор турнира</h2><p>Живая сводка · сетка обновляется после каждого результата</p></div>

        <div className="dchips">
          <div className="dchip"><div className="v">32</div><div className="k">Участников</div></div>
          <div className="dchip b"><div className="v">4</div><div className="k">Идут сейчас</div></div>
          <div className="dchip a"><div className="v">6</div><div className="k">Ждут стола</div></div>
          <div className="dchip g"><div className="v">18</div><div className="k">Завершено</div></div>
        </div>

        <div className="dtables">
          <div className="dtable busy"><div className="tn">Стол 1<span className="st" /></div><div className="pl">Пак С. — Ерлан Б.</div><div className="sc">1 : 1</div></div>
          <div className="dtable busy"><div className="tn">Стол 3 · эфир<span className="st" /></div><div className="pl">Смагулов — Токаев</div><div className="sc">2 : 1</div></div>
          <div className="dtable busy"><div className="tn">Стол 4<span className="st" /></div><div className="pl">Абаев — Сериков</div><div className="sc">0 : 2</div></div>
          <div className="dtable free"><div className="tn">Стол 2<span className="st" /></div><div className="pl">свободен</div></div>
          <div className="dtable free"><div className="tn">Стол 5<span className="st" /></div><div className="pl">свободен</div></div>
          <div className="dtable free"><div className="tn">Стол 6<span className="st" /></div><div className="pl">свободен</div></div>
        </div>

        <div className="dcols">
          <section className="panel">
            <div className="phead"><span className="t">Сетка</span><span className="seg"><span className="on">Сетка</span><span>Группы</span></span></div>
            <div className="pbody">
              <div className="bracket">
                <div className="bround">
                  <div><div className="brt">1/4 финала</div><BMatch p1={{ av: P.smag, n: 'Смагулов А.', s: '3', w: true }} p2={{ av: P.aba, n: 'Абаев Д.', s: '1' }} /></div>
                  <BMatch p1={{ av: P.kim, n: 'Ким Г.', s: '2' }} p2={{ av: P.tok, n: 'Токаев М.', s: '3', w: true }} />
                  <BMatch p1={{ av: P.zhu, n: 'Жумабеков Р.', s: '3', w: true }} p2={{ av: P.ser, n: 'Сериков Н.', s: '0' }} />
                  <BMatch p1={{ av: P.gla, n: 'Гладун И.', s: '1' }} p2={{ av: P.bai, n: 'Байжанов А.', s: '3', w: true }} />
                </div>
                <div className="bround">
                  <div><div className="brt">1/2 финала</div><BMatch now p1={{ av: P.smag, n: 'Смагулов А.', s: '2' }} p2={{ av: P.tok, n: 'Токаев М.', s: '1' }} /></div>
                  <BMatch p1={{ av: P.zhu, n: 'Жумабеков Р.' }} p2={{ av: P.bai, n: 'Байжанов А.' }} />
                </div>
                <div className="bround">
                  <div><div className="brt">Финал</div><BMatch p1={null} p2={null} /></div>
                </div>
              </div>
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

  </div></div>;
}
