import type { ReactNode } from 'react';
import { CalendarDays, Scale, Trophy, Wallet, Bell, Plus, CheckCircle2, CornerUpLeft } from 'lucide-react';
import { Frame } from './PlayerApp';
import { Board, Col, Arrow, Tab, MiniTabBar } from './respShell';
import fntLogo from './assets/fnt-emblem.png';

/* Веб → Федерация, планшет + телефон (десктоп — в FederationFlow).
   Календарь/создать → выбор судьи → приёмка результатов. */

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const FTABS: [ReactNode, string][] = [
  [<CalendarDays size={20} />, 'Календарь'],
  [<Scale size={20} />, 'Судьи'],
  [<Trophy size={20} />, 'Турниры'],
  [<Wallet size={20} />, 'Взносы'],
];

// ── карточки-содержимое (общие для планшета и телефона) ──
const TCard = ({ st, cls, nm, mt }: { st: string; cls: string; nm: string; mt: string }) => (
  <div className="card" style={{ padding: '13px 15px' }}>
    <span className={'pill ' + cls}>{st}</span>
    <div className="nm2">{nm}</div>
    <div className="mt2">{mt}</div>
  </div>
);

const JCard = ({ n, nm, cat, r, t, pick }: { n: number; nm: string; cat: string; r: number; t: number; pick?: boolean }) => (
  <div className="card pcard" style={pick ? { borderColor: 'var(--c-accent-line-3)' } : undefined}>
    <img className="avatar sm" src={A(n)} alt="" />
    <div className="who"><div className="nm">{nm}</div><div className="mt">{cat} · рейтинг {r} · {t} турн.</div></div>
    <button className="btnp" style={pick ? {} : { background: 'var(--c-panel-2)', color: 'var(--c-ink)', boxShadow: 'inset 0 1px 0 var(--c-glass-hi)' }}>{pick ? 'Выбран' : 'Выбрать'}</button>
  </div>
);

const CreateBtn = () => (
  <div className="jstart"><Plus size={16} />Создать турнир</div>
);

const TournamentList = () => (
  <>
    <TCard st="ИДЁТ" cls="live" nm="Чемпионат Казахстана 2026" mt="Республиканский · г. Астана · 18–20 мая" />
    <TCard st="ПРИЁМ СУДЕЙ" cls="reg" nm="Первенство Алматы" mt="Городской · г. Алматы · 20 фев" />
    <TCard st="ОРГ. НА УТВ." cls="wait" nm="Кубок Караганды" mt="Городской · г. Караганда · 5 мар" />
    <TCard st="ЗАВЕРШЁН" cls="done" nm="Открытие сезона" mt="Республиканский · г. Астана · 10 янв" />
  </>
);

const JudgeList = () => (
  <>
    <JCard n={76} nm="Оспанов Тимур" cat="Нац. категория" r={84} t={42} pick />
    <JCard n={13} nm="Пак Сергей" cat="Первая категория" r={71} t={28} />
    <JCard n={51} nm="Токаев Марат" cat="Нац. категория" r={68} t={31} />
    <JCard n={64} nm="Сериков Нурлан" cat="Вторая категория" r={55} t={12} />
  </>
);

const AcceptCard = () => (
  <>
    <div className="card">
      <div className="nm2">Приёмка результатов</div>
      <div className="mt2">Матчей сыграно: 127 из 127 · протестов нет<br />Победитель: Смагулов Алан · финал 4:2</div>
    </div>
    <div className="jnote" style={{ maxWidth: 'none' }}>Утверждение фиксирует итог и решает, попадёт ли турнир в рейтинг — это не публикация, результаты видны по ходу.</div>
    <div className="jstart ok"><CheckCircle2 size={15} />Утвердить · пересчитать рейтинг</div>
    <div className="jbtn ghost" style={{ flex: 'none' }}><CornerUpLeft size={15} />Вернуть с причиной</div>
  </>
);

// ── планшет ──
export function FederationTabletBoard() {
  return (
    <Board title="ФЕДЕРАЦИЯ · ПЛАНШЕТ" tag="веб · планшет">
      <Col cap="Календарь · создать">
        <Tab title="Календарь сезона 2026" sub="Республика Казахстан">
          <div className="dactionbar"><div className="dcount">14 турниров в сезоне</div></div>
          <CreateBtn />
          <div className="sect">Турниры</div>
          <TournamentList />
        </Tab>
      </Col>
      <Arrow lbl="выбрать судью" />
      <Col cap="Выбор судьи">
        <Tab title="Заявки на судейство" sub="Чемпионат Казахстана 2026 · выберите одного">
          <div className="dcount" style={{ marginBottom: 2 }}>4 заявки · приём открыт</div>
          <JudgeList />
        </Tab>
      </Col>
      <Arrow lbl="после игры" />
      <Col cap="Приёмка результатов">
        <Tab title="Приёмка результатов" sub="Сверка перед пересчётом рейтинга"><AcceptCard /></Tab>
      </Col>
    </Board>
  );
}

// ── телефон (веб) ──
const FedPhone = ({ title, active, children }: { title: string; active: string; children: ReactNode }) => (
  <Frame>
    <div className="nav">
      <div className="brand"><img src={fntLogo} alt="ФНТ РК" /> Федерация</div>
      <button className="iconbtn dot"><Bell size={17} /></button>
    </div>
    <div className="body">
      <div className="title">{title}</div>
      {children}
    </div>
    <MiniTabBar items={FTABS} active={active} />
  </Frame>
);

export function FederationMobileBoard() {
  return (
    <Board title="ФЕДЕРАЦИЯ · ТЕЛЕФОН (ВЕБ)" tag="веб · телефон">
      <Col cap="Календарь · создать">
        <FedPhone title="Календарь 2026" active="Календарь">
          <CreateBtn />
          <div className="sect">Турниры сезона</div>
          <TournamentList />
        </FedPhone>
      </Col>
      <Arrow lbl="выбрать судью" />
      <Col cap="Выбор судьи">
        <FedPhone title="Заявки судей" active="Судьи">
          <div className="sect">Чемпионат Казахстана · 4 заявки</div>
          <JudgeList />
        </FedPhone>
      </Col>
      <Arrow lbl="после игры" />
      <Col cap="Приёмка результатов">
        <FedPhone title="Приёмка" active="Турниры"><AcceptCard /></FedPhone>
      </Col>
    </Board>
  );
}
