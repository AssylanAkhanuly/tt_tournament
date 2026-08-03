import { UserPlus } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { A, FED, FED_NAV, FedPhone } from './fedCommon';

/* Веб → Федерация · Судьи: реестр судей (категория, рейтинг, допуск). Одна панель
   в четырёх раскладках. */

type J = { n: number; nm: string; cat: string; r: number; t: number; st: string; cls: string };
const JUDGES: J[] = [
  { n: 76, nm: 'Оспанов Тимур', cat: 'Национальная категория', r: 84, t: 42, st: 'НА ТУРНИРЕ', cls: 'live' },
  { n: 51, nm: 'Токаев Марат', cat: 'Национальная категория', r: 68, t: 31, st: 'АКТИВЕН', cls: 'reg' },
  { n: 13, nm: 'Пак Сергей', cat: 'Первая категория', r: 71, t: 28, st: 'АКТИВЕН', cls: 'reg' },
  { n: 64, nm: 'Сериков Нурлан', cat: 'Вторая категория', r: 55, t: 12, st: 'АКТИВЕН', cls: 'reg' },
  { n: 44, nm: 'Ким Георгий', cat: 'Первая категория', r: 60, t: 19, st: 'ПРИОСТАНОВЛЕН', cls: 'wait' },
  { n: 22, nm: 'Жумабеков Расул', cat: 'Вторая категория', r: 48, t: 8, st: 'АКТИВЕН', cls: 'reg' },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip b"><div className="v">86</div><div className="k">Всего судей</div></div>
    <div className="dchip"><div className="v">12</div><div className="k">Нац. категория</div></div>
    <div className="dchip g"><div className="v">74</div><div className="k">Активных</div></div>
    <div className="dchip a"><div className="v">1</div><div className="k">На турнире</div></div>
  </div>
);

const JRow = ({ j }: { j: J }) => (
  <div className="drow">
    <img src={A(j.n)} alt="" />
    <div className="who"><div className="nm">{j.nm}</div><div className="rl">{j.cat}</div></div>
    <div className="rt">
      <div><div className="v">{j.r}</div><div className="k">Рейтинг</div></div>
      <div><div className="v">{j.t}</div><div className="k">Турниров</div></div>
    </div>
    <span className={'pill ' + j.cls} style={{ margin: 0 }}>{j.st}</span>
  </div>
);

export function JudgesScreen({ variant, onNavigate }: { variant?: DeskVariant; onNavigate?: (item: string) => void }) {
  return (
    <Desk onNavigate={onNavigate} variant={variant} title="Реестр судей" sub="Республика Казахстан · категории и допуски"
      nav={FED_NAV} activeNav="Судьи" role={FED} hint="Категорию присваивает федерация; на турнир судья попадает через заявку.">
      <Chips />
      <div className="dactionbar"><div className="dcount">86 судей в реестре</div>
        <button className="dsubmit" style={{ padding: '10px 14px' }}><UserPlus size={15} />Добавить судью</button></div>
      <div className="drows">{JUDGES.map((j) => <JRow key={j.n} j={j} />)}</div>
    </Desk>
  );
}

export function JudgesTablet() {
  return (
    <Tab title="Реестр судей" sub="Республика Казахстан · допуски">
      <Chips />
      <div className="sect">Судьи</div>
      <div className="drows" style={{ overflow: 'visible' }}>{JUDGES.map((j) => <JRow key={j.n} j={j} />)}</div>
    </Tab>
  );
}

export function JudgesMobile() {
  return (
    <FedPhone title="Судьи" active="Судьи">
      <div className="sect">86 судей · допуски</div>
      {JUDGES.map((j) => (
        <div className="card pcard" key={j.n} style={{ padding: '12px 14px' }}>
          <img className="avatar sm" src={A(j.n)} alt="" />
          <div className="who"><div className="nm" style={{ fontSize: 13.5 }}>{j.nm}</div><div className="mt">{j.cat} · рейтинг {j.r}</div></div>
          <span className={'pill ' + j.cls} style={{ margin: 0 }}>{j.st}</span>
        </div>
      ))}
    </FedPhone>
  );
}
