import type { ReactNode } from 'react';
import { CalendarDays, Trophy, Scale, Users, Wallet, Plus, CheckCircle2, CornerUpLeft } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import '../gen/frame.css';
import '../gen/desktop.css';
import './tournament.css';

/* Веб → Федерация (десктоп): календарь/создать турнир → выбрать судью из заявок
   → утвердить организацию и принять результаты (пересчёт рейтинга). */

const NAV: [ReactNode, string][] = [
  [<CalendarDays size={18} />, 'Календарь'],
  [<Trophy size={18} />, 'Турниры'],
  [<Scale size={18} />, 'Судьи'],
  [<Users size={18} />, 'Игроки'],
  [<Wallet size={18} />, 'Взносы'],
];
const FED = { nm: 'Абаева Д.', rl: 'Федерация · исполком', av: 'https://randomuser.me/api/portraits/women/44.jpg' };
const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;

const TRow = ({ status, cls, nm, mt }: { status: string; cls: string; nm: string; mt: string }) => (
  <div className="drow">
    <div className="who"><div className="nm">{nm}</div><div className="rl">{mt}</div></div>
    <span className={'pill ' + cls} style={{ margin: 0 }}>{status}</span>
  </div>
);

// 1. календарь + создать турнир
function Calendar({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} brandName="Календарь сезона 2026" brandSub="Республика Казахстан" title="Календарь турниров"
      sub="Заводит турнир федерация — название, уровень, город, окно дат" nav={NAV} activeNav="Календарь" role={FED}
      hint="Формат и расписание задаёт назначенный судья, не федерация.">
      <div className="dactionbar"><div className="dcount">14 турниров в сезоне</div><button className="dsubmit" style={{ padding: '11px 16px' }}><Plus size={16} />Создать турнир</button></div>
      <div className="drows">
        <TRow status="ИДЁТ" cls="live" nm="Чемпионат Казахстана 2026" mt="Республиканский · г. Астана · 18–20 мая" />
        <TRow status="ПРИЁМ СУДЕЙ" cls="reg" nm="Первенство Алматы" mt="Городской · г. Алматы · 20 фев" />
        <TRow status="ОРГ. НА УТВ." cls="wait" nm="Кубок Караганды" mt="Городской · г. Караганда · 5 мар" />
        <TRow status="ЧЕРНОВИК" cls="done" nm="Кубок КазНУ" mt="Городской · г. Алматы · 12 мар" />
        <TRow status="ЗАВЕРШЁН" cls="done" nm="Открытие сезона" mt="Республиканский · г. Астана · 10 янв" />
      </div>
    </Desk>
  );
}

// 2. выбрать судью из заявок
function PickJudge({ variant }: { variant?: DeskVariant }) {
  const J = ({ n, nm, cat, r, t, pick }: { n: number; nm: string; cat: string; r: number; t: number; pick?: boolean }) => (
    <div className={'drow' + (pick ? ' pick' : '')}>
      <img src={A(n)} alt="" />
      <div className="who"><div className="nm">{nm}</div><div className="rl">{cat}</div></div>
      <div className="rt">
        <div><div className="v">{r}</div><div className="k">Рейтинг</div></div>
        <div><div className="v">{t}</div><div className="k">Турниров</div></div>
      </div>
      <button className="dpickbtn">{pick ? 'Выбран' : 'Выбрать'}</button>
    </div>
  );
  return (
    <Desk variant={variant} title="Заявки на судейство" sub="Чемпионат Казахстана 2026 · выберите одного главного судью" nav={NAV} activeNav="Судьи" role={FED}
      hint="Остальные получат отказ с причиной и смогут подать снова, пока приём открыт.">
      <div className="dactionbar"><div className="dcount">4 заявки · приём открыт</div></div>
      <div className="drows">
        <J n={76} nm="Оспанов Тимур" cat="Национальная категория" r={84} t={42} pick />
        <J n={13} nm="Пак Сергей" cat="Первая категория" r={71} t={28} />
        <J n={51} nm="Токаев Марат" cat="Национальная категория" r={68} t={31} />
        <J n={64} nm="Сериков Нурлан" cat="Вторая категория" r={55} t={12} />
      </div>
    </Desk>
  );
}

// 3. приёмка результатов
function Accept({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} title="Приёмка результатов" sub="Чемпионат Казахстана 2026 · сверка перед пересчётом рейтинга" nav={NAV} activeNav="Турниры" role={FED}>
      <div className="dform" style={{ gridTemplateColumns: '1fr' }}>
        <section className="panel" style={{ maxHeight: 260 }}>
          <div className="phead"><span className="t">Сводка</span><span className="live" style={{ background: 'rgba(52,211,153,.16)' }}><CheckCircle2 size={13} />все матчи сыграны</span></div>
          <div className="pbody dfg">
            <div className="dfield"><label>Матчей сыграно</label><div className="dval">127 из 127 · протесты: нет</div></div>
            <div className="dfield"><label>Победитель</label><div className="dval">Смагулов Алан · финал 4:2</div></div>
            <div className="dhintbox">Утверждение фиксирует итог и решает, попадёт ли турнир в рейтинг. Не публикация — результаты видны по ходу турнира.</div>
          </div>
        </section>
        <div className="dactionbar" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button className="dsubmit" style={{ flex: 'none', padding: '13px 16px', background: 'var(--glass)', color: 'var(--ink)', border: '1px solid var(--glass-line)', boxShadow: 'none' }}><CornerUpLeft size={16} />Вернуть с причиной</button>
          <button className="dsubmit ok" style={{ flex: 'none', padding: '13px 18px' }}><CheckCircle2 size={16} />Утвердить · пересчитать рейтинг</button>
        </div>
      </div>
    </Desk>
  );
}

const Arrow = ({ lbl }: { lbl: string }) => <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>;
const Col = ({ cap, children }: { cap: string; children: ReactNode }) => <div className="col"><div className="cap">{cap}</div>{children}</div>;

export function FederationFlowBoard({ frame = 'desktop' }: { frame?: DeskVariant }) {
  const land = frame === 'land';
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">{land ? 'ФЕДЕРАЦИЯ · ПЛАНШЕТ (АЛЬБОМ)' : 'ФЕДЕРАЦИЯ · ФЛОУ'}</div>
        <div className="board-tag">{land ? 'веб · планшет · альбом · от календаря до рейтинга' : 'десктоп · веб · ведёт турнир от календаря до рейтинга'}</div>
      </div>
      <div className="row">
        <Col cap="Календарь · создать"><Calendar variant={frame} /></Col>
        <Arrow lbl="выбрать судью" />
        <Col cap="Выбор судьи"><PickJudge variant={frame} /></Col>
        <Arrow lbl="после игры" />
        <Col cap="Приёмка результатов"><Accept variant={frame} /></Col>
      </div>
    </div>
  );
}
