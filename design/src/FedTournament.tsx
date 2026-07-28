import type { ReactNode } from 'react';
import { Network } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { bigBracket } from './bigBracket';
import { A, FED, FED_NAV, FedPhone } from './fedCommon';

/* Веб → Федерация · Турнир: карточка турнира (сводка + сетка). Десктоп/альбом
   показывают настоящую сетку (React Flow), планшет/телефон — сводку и ход. */

const INFO: [string, string][] = [
  ['Главный судья', 'Оспанов Т. · нац. категория'],
  ['Формат', 'Олимпийская · до 4 партий'],
  ['Дисциплина', 'Одиночная'],
  ['Призовой фонд', '₸ 2 000 000'],
  ['Взносы', '112 из 128 оплатили'],
];
type L = { n: number; nm: string; mt: string };
const LEADERS: L[] = [
  { n: 32, nm: 'Смагулов Алан', mt: '1/4 → 3:1' },
  { n: 44, nm: 'Ким Георгий', mt: '1/4 → 3:2' },
  { n: 51, nm: 'Токаев Марат', mt: 'играет · стол 3' },
  { n: 13, nm: 'Пак Сергей', mt: '1/4 → 3:0' },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip b"><div className="v">128</div><div className="k">Участников</div></div>
    <div className="dchip a"><div className="v">68/127</div><div className="k">Сыграно</div></div>
    <div className="dchip"><div className="v">20</div><div className="k">Столов</div></div>
    <div className="dchip g"><div className="v">ИДЁТ</div><div className="k">Статус · 2-й день</div></div>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="dfield"><label>{label}</label>{children}</div>
);
const InfoFields = () => (
  <>{INFO.map(([l, v]) => <Field key={l} label={l}><div className="dval">{v}</div></Field>)}</>
);

const LeaderRow = ({ p }: { p: L }) => (
  <div className="drow" style={{ padding: '9px 11px' }}>
    <img className="avatar sm" src={A(p.n)} alt="" style={{ width: 32, height: 32 }} />
    <div className="who"><div className="nm" style={{ fontSize: 13 }}>{p.nm}</div><div className="rl">{p.mt}</div></div>
  </div>
);

export function TournamentScreen({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} brandName="Чемпионат Казахстана 2026" brandSub="Республиканский · олимпийская"
      title="Чемпионат Казахстана 2026" sub="Республиканский · олимпийская · г. Астана · 18–20 мая"
      nav={FED_NAV} activeNav="Турниры" role={FED}>
      <Chips />
      <div className="dcols">
        <section className="panel">
          <div className="phead"><span className="t">Сетка турнира</span><span className="seg"><span className="on">Сетка</span><span>Участники</span></span></div>
          <div className="pbody dbracketWrap"><BracketFlow bracket={bigBracket} minZoom={0.05} fitPadding={0.1} /></div>
        </section>
        <aside className="panel">
          <div className="phead"><span className="t">О турнире</span></div>
          <div className="pbody dfg">
            <Field label="Статус"><span className="pill live" style={{ margin: 0, alignSelf: 'flex-start' }}>ИДЁТ · 2-й день</span></Field>
            <InfoFields />
          </div>
        </aside>
      </div>
    </Desk>
  );
}

export function TournamentTablet() {
  return (
    <Tab title="Чемпионат Казахстана 2026" sub="Республиканский · олимпийская · 18–20 мая">
      <Chips />
      <div className="sect">О турнире</div>
      <div className="card dfg"><InfoFields /></div>
      <div className="sect">Полуфиналисты</div>
      <div className="drows" style={{ overflow: 'visible' }}>{LEADERS.map((p) => <LeaderRow key={p.n} p={p} />)}</div>
    </Tab>
  );
}

export function TournamentMobile() {
  return (
    <FedPhone title="Турнир" active="Календарь">
      <div className="card"><div className="nm2">Чемпионат Казахстана 2026</div><div className="mt2">Республиканский · г. Астана · 18–20 мая</div></div>
      <div className="stats">
        <div className="stat b"><div className="v">128</div><div className="k">Участ.</div></div>
        <div className="stat a"><div className="v">68</div><div className="k">Сыграно</div></div>
        <div className="stat"><div className="v">20</div><div className="k">Столов</div></div>
        <div className="stat g"><div className="v">2-й</div><div className="k">День</div></div>
      </div>
      <div className="sect">О турнире</div>
      <div className="card dfg"><InfoFields /></div>
      <div className="jstart"><Network size={16} />Открыть сетку</div>
      <div className="sect">Полуфиналисты</div>
      {LEADERS.map((p) => <LeaderRow key={p.n} p={p} />)}
    </FedPhone>
  );
}
