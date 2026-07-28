import { Shuffle, Network } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { bigBracket } from './bigBracket';
import { A, JUDGE, ORG_NAV, OrgPhone } from './orgCommon';

/* Веб → Главный судья · Сетка: посев и жеребьёвка. Десктоп/альбом показывают
   настоящую сетку (React Flow), планшет/телефон — посев и параметры жеребьёвки. */

type Seed = { s: number; n: number; nm: string };
const SEEDS: Seed[] = [
  { s: 1, n: 32, nm: 'Смагулов Алан' },
  { s: 2, n: 44, nm: 'Ким Георгий' },
  { s: 3, n: 51, nm: 'Токаев Марат' },
  { s: 4, n: 13, nm: 'Пак Сергей' },
  { s: 5, n: 22, nm: 'Жумабеков Расул' },
  { s: 6, n: 56, nm: 'Гладун Игорь' },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip b"><div className="v">128</div><div className="k">Участников</div></div>
    <div className="dchip"><div className="v">16</div><div className="k">Сеяных</div></div>
    <div className="dchip"><div className="v">1/64</div><div className="k">Текущий раунд</div></div>
    <div className="dchip g"><div className="v">✓</div><div className="k">Жеребьёвка</div></div>
  </div>
);

const SeedRow = ({ s }: { s: Seed }) => (
  <div className="drow" style={{ padding: '8px 10px', marginBottom: 6 }}>
    <span className="rank" style={{ width: 22 }}>{s.s}</span>
    <img className="avatar sm" src={A(s.n)} alt="" style={{ width: 28, height: 28 }} />
    <div className="who"><div className="nm" style={{ fontSize: 12.5 }}>{s.nm}</div></div>
  </div>
);

const DrawSetting = () => (
  <div className="dfield"><label>Посев</label><div className="dseg2"><span className="on">По рейтингу</span><span>Вручную</span></div></div>
);

export function BracketScreen({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} title="Сетка и посев" sub="Чемпионат Казахстана 2026 · олимпийская · 128 участников"
      nav={ORG_NAV} activeNav="Сетка" role={JUDGE} hint="Жеребьёвка разводит сеяных по разным частям сетки.">
      <Chips />
      <div className="dcols">
        <section className="panel">
          <div className="phead"><span className="t">Сетка</span><span className="seg"><span className="on">Дерево</span><span>Список</span></span></div>
          <div className="pbody dbracketWrap"><BracketFlow bracket={bigBracket} minZoom={0.05} fitPadding={0.1} /></div>
        </section>
        <aside className="panel">
          <div className="phead"><span className="t">Посев и жеребьёвка</span></div>
          <div className="pbody">
            <div style={{ marginBottom: 12 }}><DrawSetting /></div>
            <div className="qsec">Сеяные · топ-16</div>
            {SEEDS.map((s) => <SeedRow key={s.s} s={s} />)}
            <div className="dsubmit" style={{ marginTop: 12, background: 'var(--glass)', color: 'var(--ink)', border: '1px solid var(--glass-line)', boxShadow: 'none' }}><Shuffle size={15} />Пережеребить</div>
          </div>
        </aside>
      </div>
    </Desk>
  );
}

export function BracketTablet() {
  return (
    <Tab title="Сетка и посев" sub="Олимпийская · 128 участников">
      <Chips />
      <div className="sect">Параметры жеребьёвки</div>
      <div className="card dfg"><DrawSetting /><div className="dhintbox">Жеребьёвка разводит сеяных по разным частям сетки.</div></div>
      <div className="sect">Сеяные · топ-6</div>
      {SEEDS.map((s) => <SeedRow key={s.s} s={s} />)}
      <div className="jstart"><Network size={16} />Открыть сетку</div>
    </Tab>
  );
}

export function BracketMobile() {
  return (
    <OrgPhone title="Сетка и посев" active="Сетка">
      <div className="stats">
        <div className="stat b"><div className="v">128</div><div className="k">Участ.</div></div>
        <div className="stat"><div className="v">16</div><div className="k">Сеяных</div></div>
        <div className="stat"><div className="v">1/64</div><div className="k">Раунд</div></div>
        <div className="stat g"><div className="v">✓</div><div className="k">Жеребьёвка</div></div>
      </div>
      <div className="sect">Параметры</div>
      <div className="card dfg"><DrawSetting /></div>
      <div className="sect">Сеяные · топ-6</div>
      {SEEDS.map((s) => <SeedRow key={s.s} s={s} />)}
      <div className="jstart"><Network size={16} />Открыть сетку</div>
    </OrgPhone>
  );
}
