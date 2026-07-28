import { Download } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { A, FED, FED_NAV, FedPhone } from './fedCommon';

/* Веб → Федерация · Игроки/Рейтинг: республиканский рейтинг игроков (пересчёт после
   каждого утверждённого турнира). Одна панель-таблица в четырёх раскладках. */

type P = { r: number; n: number; nm: string; club: string; pts: number; d: string; up: boolean };
const RANK: P[] = [
  { r: 1, n: 32, nm: 'Смагулов Алан', club: 'Алатау · Алматы', pts: 2456, d: '+24', up: true },
  { r: 2, n: 44, nm: 'Ким Георгий', club: 'СКА · Астана', pts: 2401, d: '+12', up: true },
  { r: 3, n: 76, nm: 'Оспанов Тимур', club: 'Актобе', pts: 2388, d: '−8', up: false },
  { r: 4, n: 51, nm: 'Токаев Марат', club: 'Шымкент', pts: 2350, d: '+31', up: true },
  { r: 5, n: 13, nm: 'Пак Сергей', club: 'Иртыш · Павлодар', pts: 2312, d: '0', up: true },
  { r: 6, n: 22, nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', pts: 2290, d: '−4', up: false },
  { r: 7, n: 56, nm: 'Гладун Игорь', club: 'Тараз', pts: 2265, d: '+9', up: true },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip b"><div className="v">1 284</div><div className="k">Игроков</div></div>
    <div className="dchip"><div className="v">860</div><div className="k">Активных</div></div>
    <div className="dchip"><div className="v">14</div><div className="k">Турниров</div></div>
    <div className="dchip g"><div className="v">2456</div><div className="k">Топ-рейтинг</div></div>
  </div>
);

const RankRow = ({ p }: { p: P }) => (
  <div className="drow">
    <span className="rank">{p.r}</span>
    <img src={A(p.n)} alt="" />
    <div className="who"><div className="nm">{p.nm}</div><div className="rl">{p.club}</div></div>
    <div className="amt">{p.pts}</div>
    <span className={'delta ' + (p.up ? 'up' : 'down')} style={{ width: 46, textAlign: 'right' }}>{p.d}</span>
  </div>
);

export function RatingScreen({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} title="Рейтинг игроков" sub="Республика Казахстан · сезон 2026 · обновлён 18 мая"
      nav={FED_NAV} activeNav="Игроки" role={FED} hint="Рейтинг пересчитывается после того, как федерация утвердит результаты турнира.">
      <Chips />
      <div className="dactionbar"><div className="dcount">Показаны топ-7 из 1 284</div>
        <button className="dsubmit" style={{ padding: '10px 14px' }}><Download size={15} />Экспорт CSV</button></div>
      <div className="drows">{RANK.map((p) => <RankRow key={p.r} p={p} />)}</div>
    </Desk>
  );
}

export function RatingTablet() {
  return (
    <Tab title="Рейтинг игроков" sub="Сезон 2026 · обновлён 18 мая">
      <Chips />
      <div className="sect">Топ игроков</div>
      <div className="drows" style={{ overflow: 'visible' }}>{RANK.map((p) => <RankRow key={p.r} p={p} />)}</div>
    </Tab>
  );
}

export function RatingMobile() {
  return (
    <FedPhone title="Рейтинг" active="Игроки">
      <div className="sect">Сезон 2026 · топ-7 из 1 284</div>
      {RANK.map((p) => (
        <div className="drow" style={{ padding: '9px 11px' }} key={p.r}>
          <span className="rank" style={{ width: 20, fontSize: 13 }}>{p.r}</span>
          <img className="avatar sm" src={A(p.n)} alt="" style={{ width: 30, height: 30 }} />
          <div className="who"><div className="nm" style={{ fontSize: 13 }}>{p.nm}</div></div>
          <div className="amt" style={{ fontSize: 13 }}>{p.pts}</div>
          <span className={'delta ' + (p.up ? 'up' : 'down')}>{p.d}</span>
        </div>
      ))}
    </FedPhone>
  );
}
