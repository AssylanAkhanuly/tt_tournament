import { Download } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Tab } from './respShell';
import { A, FED, FED_NAV, FedPhone } from './fedCommon';

/* Веб → Федерация · Взносы: кто оплатил стартовый взнос турнира. Одна панель-реестр
   в четырёх раскладках (десктоп / планшет-портрет / планшет-альбом / мобилка). */

type Fee = { n: number; nm: string; club: string; sum: string; st: string; cls: string };
const FEES: Fee[] = [
  { n: 32, nm: 'Смагулов Алан', club: 'Алатау · Алматы', sum: '10 000', st: 'ОПЛАЧЕНО', cls: 'live' },
  { n: 44, nm: 'Ким Георгий', club: 'СКА · Астана', sum: '10 000', st: 'ОПЛАЧЕНО', cls: 'live' },
  { n: 22, nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', sum: '10 000', st: 'ЖДЁТ', cls: 'wait' },
  { n: 56, nm: 'Гладун Игорь', club: 'Тараз', sum: '10 000', st: 'ПРОСРОЧЕНО', cls: 'bad' },
  { n: 67, nm: 'Оспанов Дамир', club: 'Актобе', sum: '10 000', st: 'ОПЛАЧЕНО', cls: 'live' },
  { n: 13, nm: 'Пак Сергей', club: 'Иртыш · Павлодар', sum: '10 000', st: 'ЖДЁТ', cls: 'wait' },
  { n: 75, nm: 'Ерлан Бекзат', club: 'Астана', sum: '10 000', st: 'ОПЛАЧЕНО', cls: 'live' },
];

const Chips = () => (
  <div className="dchips">
    <div className="dchip g"><div className="v">₸ 1,12M</div><div className="k">Собрано</div></div>
    <div className="dchip a"><div className="v">₸ 160K</div><div className="k">Ожидается</div></div>
    <div className="dchip b"><div className="v">112</div><div className="k">Оплатили</div></div>
    <div className="dchip"><div className="v">4</div><div className="k">Просрочено</div></div>
  </div>
);

const FeeRow = ({ f }: { f: Fee }) => (
  <div className="drow">
    <img src={A(f.n)} alt="" />
    <div className="who"><div className="nm">{f.nm}</div><div className="rl">{f.club}</div></div>
    <div className="amt">₸ {f.sum}</div>
    <span className={'pill ' + f.cls} style={{ margin: 0 }}>{f.st}</span>
    {f.cls !== 'live' && <button className="dpickbtn">Отметить</button>}
  </div>
);

export function FeesScreen({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} title="Взносы турнира" sub="Чемпионат Казахстана 2026 · стартовый взнос ₸ 10 000"
      nav={FED_NAV} activeNav="Взносы" role={FED} hint="Без подтверждённого взноса участник не попадает в жеребьёвку.">
      <Chips />
      <div className="dactionbar"><div className="dcount">128 участников · 16 не оплатили</div>
        <button className="dsubmit" style={{ padding: '10px 14px' }}><Download size={15} />Выгрузить список</button></div>
      <div className="drows">{FEES.map((f) => <FeeRow key={f.n} f={f} />)}</div>
    </Desk>
  );
}

export function FeesTablet() {
  return (
    <Tab title="Взносы турнира" sub="Чемпионат Казахстана 2026 · ₸ 10 000">
      <div className="stats">
        <div className="stat g"><div className="v">112</div><div className="k">Оплатили</div></div>
        <div className="stat"><div className="v">16</div><div className="k">Ждут</div></div>
        <div className="stat b"><div className="v">₸1,12M</div><div className="k">Собрано</div></div>
        <div className="stat r"><div className="v">4</div><div className="k">Просроч.</div></div>
      </div>
      <div className="sect">Участники</div>
      <div className="drows" style={{ overflow: 'visible' }}>{FEES.map((f) => <FeeRow key={f.n} f={f} />)}</div>
    </Tab>
  );
}

export function FeesMobile() {
  return (
    <FedPhone title="Взносы" active="Взносы">
      <div className="stats">
        <div className="stat g"><div className="v">112</div><div className="k">Оплат.</div></div>
        <div className="stat"><div className="v">16</div><div className="k">Ждут</div></div>
        <div className="stat b"><div className="v">1,12M</div><div className="k">Собрано</div></div>
        <div className="stat r"><div className="v">4</div><div className="k">Просроч.</div></div>
      </div>
      <div className="sect">Участники</div>
      {FEES.map((f) => (
        <div className="card pcard" key={f.n} style={{ padding: '12px 14px' }}>
          <img className="avatar sm" src={A(f.n)} alt="" />
          <div className="who"><div className="nm" style={{ fontSize: 13.5 }}>{f.nm}</div><div className="mt">{f.club} · ₸ {f.sum}</div></div>
          <span className={'pill ' + f.cls} style={{ margin: 0 }}>{f.st}</span>
        </div>
      ))}
    </FedPhone>
  );
}
