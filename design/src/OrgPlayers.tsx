import { Shuffle } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { A, JUDGE, ORG_NAV, OrgPhone } from './orgCommon';

/* Веб → Главный судья · Игроки: участники турнира (заявка, взнос, посев). Одна
   панель в четырёх раскладках. */

type P = { n: number; seed: number; nm: string; club: string; r: number; st: string; cls: string };
const PLAYERS: P[] = [
  { n: 32, seed: 1, nm: 'Смагулов Алан', club: 'Алатау · Алматы', r: 2456, st: 'ПОСЕЯН', cls: 'reg' },
  { n: 44, seed: 2, nm: 'Ким Георгий', club: 'СКА · Астана', r: 2401, st: 'ПОСЕЯН', cls: 'reg' },
  { n: 51, seed: 0, nm: 'Токаев Марат', club: 'Шымкент', r: 2350, st: 'ПОДТВЕРЖДЁН', cls: 'live' },
  { n: 13, seed: 0, nm: 'Пак Сергей', club: 'Иртыш · Павлодар', r: 2312, st: 'ПОДТВЕРЖДЁН', cls: 'live' },
  { n: 22, seed: 0, nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', r: 2290, st: 'ВЗНОС НЕ ОПЛ.', cls: 'wait' },
  { n: 56, seed: 0, nm: 'Гладун Игорь', club: 'Тараз', r: 2265, st: 'ОЖИДАЕТ', cls: 'wait' },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip b"><div className="v">128</div><div className="k">Заявлено</div></div>
    <div className="dchip g"><div className="v">112</div><div className="k">Подтверждено</div></div>
    <div className="dchip"><div className="v">16</div><div className="k">Посеяно</div></div>
    <div className="dchip a"><div className="v">4</div><div className="k">Ждут взнос</div></div>
  </div>
);

const PRow = ({ p }: { p: P }) => (
  <div className="drow">
    <span className="rank">{p.seed || '—'}</span>
    <img src={A(p.n)} alt="" />
    <div className="who"><div className="nm">{p.nm}</div><div className="rl">{p.club}</div></div>
    <div className="amt">{p.r}</div>
    <span className={'pill ' + p.cls} style={{ margin: 0 }}>{p.st}</span>
  </div>
);

export function PlayersScreen({ variant, onNavigate }: { variant?: DeskVariant; onNavigate?: (item: string) => void }) {
  return (
    <Desk onNavigate={onNavigate} variant={variant} title="Участники турнира" sub="Чемпионат Казахстана 2026 · заявки, взносы, посев"
      nav={ORG_NAV} activeNav="Игроки" role={JUDGE} hint="Посев — по рейтингу; в жеребьёвку попадают только с оплаченным взносом.">
      <Chips />
      <div className="dactionbar"><div className="dcount">Столбец «№» — номер посева</div>
        <button className="dsubmit" style={{ padding: '10px 14px' }}><Shuffle size={15} />Провести посев</button></div>
      <div className="drows">{PLAYERS.map((p) => <PRow key={p.n} p={p} />)}</div>
    </Desk>
  );
}

export function PlayersTablet() {
  return (
    <Tab title="Участники турнира" sub="Заявки · взносы · посев">
      <Chips />
      <div className="sect">Участники · № = посев</div>
      <div className="drows" style={{ overflow: 'visible' }}>{PLAYERS.map((p) => <PRow key={p.n} p={p} />)}</div>
    </Tab>
  );
}

export function PlayersMobile({ onNavigate }: { onNavigate?: (item: string) => void } = {}) {
  return (
    <OrgPhone onNavigate={onNavigate} title="Участники" active="Игроки">
      <div className="stats">
        <div className="stat b"><div className="v">128</div><div className="k">Заявок</div></div>
        <div className="stat g"><div className="v">112</div><div className="k">Подтв.</div></div>
        <div className="stat"><div className="v">16</div><div className="k">Посев</div></div>
        <div className="stat r"><div className="v">4</div><div className="k">Взнос</div></div>
      </div>
      <div className="sect">Участники</div>
      {PLAYERS.map((p) => (
        <div className="card pcard" key={p.n} style={{ padding: '12px 14px' }}>
          <span className="rank" style={{ width: 20, fontSize: 13 }}>{p.seed || '—'}</span>
          <img className="avatar sm" src={A(p.n)} alt="" />
          <div className="who"><div className="nm" style={{ fontSize: 13 }}>{p.nm}</div><div className="mt">рейтинг {p.r}</div></div>
          <span className={'pill ' + p.cls} style={{ margin: 0 }}>{p.st}</span>
        </div>
      ))}
    </OrgPhone>
  );
}
