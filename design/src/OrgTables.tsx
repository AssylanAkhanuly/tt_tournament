import { ArrowRight } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { A, JUDGE, ORG_NAV, OrgPhone } from './orgCommon';

/* Веб → Главный судья · Столы: распределение матчей по столам зала. Одна панель
   в четырёх раскладках. */

const SCORES = ['2:1', '1:1', '0:2', '3:2', '1:0', '2:2', '0:1', '1:3', '2:0', '1:2', '3:1', '0:0'];
const TABLES = Array.from({ length: 20 }, (_, i) => ({ n: i + 1, busy: i < 12, score: i < 12 ? SCORES[i % SCORES.length] : null }));

type W = { a: number; b: number; r: string };
const WAITING: W[] = [
  { a: 22, b: 85, r: 'Жумабеков Р. — Байжанов А.' },
  { a: 67, b: 93, r: 'Оспанов Д. — Мұрат Е.' },
  { a: 44, b: 56, r: 'Ким Г. — Гладун И.' },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip b"><div className="v">20</div><div className="k">Столов</div></div>
    <div className="dchip"><div className="v">12</div><div className="k">Занято</div></div>
    <div className="dchip g"><div className="v">8</div><div className="k">Свободно</div></div>
    <div className="dchip a"><div className="v">8</div><div className="k">В очереди</div></div>
  </div>
);

const TableChip = ({ n, score }: { n: number; score: string | null }) => (
  <div className={'dtable ' + (score ? 'busy' : 'free')}>
    <div className="tn">Стол {n}<span className="st" /></div>
    {score ? <div className="sc">{score}</div> : <div className="pl">—</div>}
  </div>
);

const WaitRow = ({ w }: { w: W }) => (
  <div className="drow">
    <span className="qav2"><img src={A(w.a)} alt="" /><img src={A(w.b)} alt="" /></span>
    <div className="who"><div className="nm">{w.r}</div><div className="rl">ожидает распределения</div></div>
    <button className="dpickbtn">На стол <ArrowRight size={12} style={{ verticalAlign: '-2px' }} /></button>
  </div>
);

export function TablesScreen({ variant, onNavigate }: { variant?: DeskVariant; onNavigate?: (item: string) => void }) {
  return (
    <Desk onNavigate={onNavigate} variant={variant} title="Распределение столов" sub="Чемпионат Казахстана 2026 · 20 столов в зале"
      nav={ORG_NAV} activeNav="Столы" role={JUDGE} hint="Матч не начнётся, пока на стол не назначен судья.">
      <Chips />
      <div className="dtables">{TABLES.map((t) => <TableChip key={t.n} n={t.n} score={t.score} />)}</div>
      <div className="dactionbar" style={{ marginTop: 2 }}><div className="dcount">Не распределены · 8 матчей</div></div>
      <div className="drows">{WAITING.map((w, i) => <WaitRow key={i} w={w} />)}</div>
    </Desk>
  );
}

export function TablesTablet() {
  return (
    <Tab title="Распределение столов" sub="20 столов · 12 заняты">
      <Chips />
      <div className="sect">Столы зала</div>
      <div className="ttables">{TABLES.slice(0, 12).map((t) => <TableChip key={t.n} n={t.n} score={t.score} />)}</div>
      <div className="sect">Не распределены · 8</div>
      <div className="drows" style={{ overflow: 'visible' }}>{WAITING.map((w, i) => <WaitRow key={i} w={w} />)}</div>
    </Tab>
  );
}

export function TablesMobile({ onNavigate }: { onNavigate?: (item: string) => void } = {}) {
  return (
    <OrgPhone onNavigate={onNavigate} title="Столы" active="Столы">
      <div className="stats">
        <div className="stat b"><div className="v">20</div><div className="k">Столов</div></div>
        <div className="stat"><div className="v">12</div><div className="k">Заняты</div></div>
        <div className="stat g"><div className="v">8</div><div className="k">Свободны</div></div>
        <div className="stat a"><div className="v">8</div><div className="k">В очереди</div></div>
      </div>
      <div className="sect">Столы зала</div>
      <div className="ttables">{TABLES.slice(0, 12).map((t) => <TableChip key={t.n} n={t.n} score={t.score} />)}</div>
      <div className="sect">Не распределены</div>
      {WAITING.map((w, i) => (
        <div className="item rq" key={i}>
          <span className="qav2"><img src={A(w.a)} alt="" /><img src={A(w.b)} alt="" /></span>
          <div className="tx"><div className="tt" style={{ fontSize: 12.5 }}>{w.r}</div><div className="ss">ожидает стола</div></div>
          <button className="btnp" style={{ padding: '8px 11px' }}>На стол</button>
        </div>
      ))}
    </OrgPhone>
  );
}
