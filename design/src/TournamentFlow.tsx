import type { ReactNode } from 'react';
import {
  ChevronLeft, Grid3x3, Users, ListOrdered, Play,
  Radio, Minus, Plus, Check, ChevronRight,
} from 'lucide-react';
import { Frame, TabBar } from './PlayerApp';
// настоящий компонент сетки (React Flow) из front/ — резолвится алиасом `@`
// (см. .storybook/main.ts), а не рисуется мокапом
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { bigBracket } from './bigBracket';
import '../gen/frame.css';
import './tournament.css';

/* Экраны турнира (флоу) — тёмная тема, те же токены и компоненты, что у игрока.
   Игрок/зритель: обзор → сетка → live-счёт; судья стола: ввод счёта. */

const AV = {
  smag: 'https://randomuser.me/api/portraits/men/32.jpg',
  tok: 'https://randomuser.me/api/portraits/men/51.jpg',
  zhu: 'https://randomuser.me/api/portraits/men/22.jpg',
  bai: 'https://randomuser.me/api/portraits/men/85.jpg',
};

const THead = ({ compact }: { compact?: boolean }) => (
  <div className="thead">
    <span className="pill live"><span className="d" />ИДЁТ</span>
    {!compact && <h1>Чемпионат Казахстана 2026</h1>}
    <div className="tm">г. Астана · 18–20 мая · Олимпийка{compact ? ' · 32' : ''}</div>
  </div>
);

const Tabs = ({ on }: { on: 'obzor' | 'setka' | 'uch' }) => (
  <div className="ttabs">
    <span className={'ttab' + (on === 'obzor' ? ' on' : '')}><ListOrdered size={13} />Обзор</span>
    <span className={'ttab' + (on === 'setka' ? ' on' : '')}><Grid3x3 size={13} />Сетка</span>
    <span className={'ttab' + (on === 'uch' ? ' on' : '')}><Users size={13} />Участники</span>
  </div>
);

// ── 1. Обзор турнира ───────────────────────────────────────────────────────
export function TournamentDetail() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
      </div>
      <div className="body">
        <THead />
        <Tabs on="obzor" />
        <div className="card mymatch live" style={{ borderColor: 'rgba(52,211,153,.4)' }}>
          <img className="avatar sm" src={AV.smag} alt="" />
          <div className="who">
            <div className="nm">Ваш матч · финал</div>
            <div className="mt">Смагулов vs Токаев · стол 3</div>
          </div>
          <button className="btnp"><Radio size={13} />Live</button>
        </div>
        <div className="sect">О турнире</div>
        <div className="stats">
          <Stat v="32" k="Участника" /><Stat v="20" k="Столов" />
          <Stat v="5" k="Партий" tone="b" /><Stat v="1/2" k="Стадия" />
        </div>
        <div className="sect">Судьи</div>
        <div className="card list">
          <Person av={AV.zhu} nm="Оспанов Тимур" mt="Главный судья · нац. категория" />
          <Person av={AV.bai} nm="Пак Сергей" mt="Судья стола · стол 3" />
        </div>
      </div>
      <TabBar active="tournaments" />
    </Frame>
  );
}

// ── 2. Сетка ───────────────────────────────────────────────────────────────
export function TournamentBracket() {
  return (
    <Frame>
      {/* сетка на весь экран, как карта — настоящий React Flow, большой посев (128) */}
      <div className="bracketFull">
        <BracketFlow bracket={bigBracket} minZoom={0.03} fitPadding={0.08} />
      </div>
      {/* только назад + заголовок; без таб-бара */}
      <div className="bt">
        <span className="iconbtn"><ChevronLeft size={18} /></span>
        <div className="bt-title">Сетка · Чемпионат Казахстана 2026</div>
      </div>
    </Frame>
  );
}

// ── 3. Live-счёт (зритель/табло) ───────────────────────────────────────────
export function LiveMatch() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mut)' }}>1/2 финала · Стол 3</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body">
        <div className="lwrap">
          <span className="livebadge"><span className="d" />LIVE</span>
          <div className="lp lead">
            <img className="avatar sm" src={AV.smag} alt="" />
            <div className="who"><div className="nm">Смагулов А.</div><div className="mt">г. Алматы</div></div>
            <span className="serve" />
            <div className="gm">8</div>
          </div>
          <div className="lvs"><span className="setscore">2</span><span className="vs">СЧЁТ ПО ПАРТИЯМ</span><span className="setscore">1</span></div>
          <div className="lp">
            <img className="avatar sm" src={AV.tok} alt="" />
            <div className="who"><div className="nm">Токаев М.</div><div className="mt">г. Астана</div></div>
            <div className="gm">6</div>
          </div>
          <div className="sect" style={{ textAlign: 'center' }}>Партии</div>
          <div className="sets">
            <span className="setchip"><b>11</b>–9</span>
            <span className="setchip">9–<b>11</b></span>
            <span className="setchip"><b>11</b>–7</span>
            <span className="setchip">партия 4</span>
          </div>
          <div className="watch"><Play size={15} fill="#fff" />Смотреть трансляцию</div>
        </div>
      </div>
      <TabBar active="matches" />
    </Frame>
  );
}

// ── 4. Судья стола · ввод счёта ────────────────────────────────────────────
export function JudgeTable() {
  const Stepper = ({ pt, plusOn }: { pt: number; plusOn?: boolean }) => (
    <div className="stepper">
      <span className="stepbtn"><Minus size={18} /></span>
      <span className="pt">{pt}</span>
      <span className={'stepbtn' + (plusOn ? ' plus' : '')}><Plus size={18} /></span>
    </div>
  );
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Стол 3 · ввод счёта</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body" style={{ paddingBottom: 16 }}>
        <div className="lwrap">
          <div className="jhint">Партия 4 · до 11 · главный судья следит за ходом</div>
          <div className="card">
            <div className="jp">
              <img className="avatar sm" src={AV.smag} alt="" />
              <div className="who"><div className="nm">Смагулов А.</div><div className="mt">партии: 2</div></div>
              <Stepper pt={8} plusOn />
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 0' }} />
            <div className="jp">
              <img className="avatar sm" src={AV.tok} alt="" />
              <div className="who"><div className="nm">Токаев М.</div><div className="mt">партии: 1</div></div>
              <Stepper pt={6} />
            </div>
          </div>
          <div className="sect" style={{ textAlign: 'center' }}>Сыгранные партии</div>
          <div className="sets">
            <span className="setchip"><b>11</b>–9</span>
            <span className="setchip">9–<b>11</b></span>
            <span className="setchip"><b>11</b>–7</span>
          </div>
          <div className="jactions">
            <span className="jbtn ghost"><ChevronRight size={16} />След. партия</span>
            <span className="jbtn pri"><Check size={16} />Завершить</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// вспомогательные
function Stat({ v, k, tone }: { v: string; k: string; tone?: 'b' }) {
  return <div className={'stat' + (tone ? ' ' + tone : '')}><div className="v">{v}</div><div className="k">{k}</div></div>;
}
function Person({ av, nm, mt }: { av: string; nm: string; mt: string }) {
  return (
    <div className="match">
      <img className="avatar sm" src={av} alt="" />
      <div className="who"><div className="nm">{nm}</div><div className="mt">{mt}</div></div>
    </div>
  );
}

// ── флоу-борд ──────────────────────────────────────────────────────────────
const Arrow = ({ lbl }: { lbl: string }) => <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>;
const Col = ({ cap, children }: { cap: string; children: ReactNode }) => <div className="col"><div className="cap">{cap}</div>{children}</div>;

export function TournamentFlowBoard() {
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">ТУРНИР · ИГРОК/ЗРИТЕЛЬ</div>
        <div className="board-tag">мобильное приложение · тёмная тема</div>
      </div>
      <div className="row">
        <Col cap="Обзор турнира"><TournamentDetail /></Col>
        <Arrow lbl="вкладка «Сетка»" />
        <Col cap="Сетка"><TournamentBracket /></Col>
        <Arrow lbl="открыть матч" />
        <Col cap="Live · зритель"><LiveMatch /></Col>
      </div>
    </div>
  );
}
