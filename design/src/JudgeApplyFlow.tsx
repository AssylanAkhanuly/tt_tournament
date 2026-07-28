import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Clock3, CheckCircle2, Send, Trophy } from 'lucide-react';
import { Frame, TabBar } from './PlayerApp';
import '../gen/frame.css';
import './tournament.css';

/* Флоу ЗАЯВОК СУДЬИ на судейство (заявку игрока на турнир закрывает Signup —
   «Заявка на турнир»): турниры для судейства → подать → на рассмотрении →
   назначен главным судьёй (→ дальше организация турнира). */

const ME = 'https://randomuser.me/api/portraits/men/76.jpg';

const TCard = ({ nm, mt }: { nm: string; mt: ReactNode }) => (
  <div className="card japp">
    <div className="nm2">{nm}</div>
    <div className="mt2">{mt}</div>
    <div className="jappBtn">Подать заявку <ChevronRight size={14} /></div>
  </div>
);

// 1. турниры, где открыт приём заявок судей
function JudgeTournaments() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Судейство</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body">
        <div className="title">Открыт приём заявок</div>
        <div className="sect">Можно судить</div>
        <TCard nm="Чемпионат Казахстана 2026" mt="Республиканский · г. Астана · 18–20 мая · нужна нац. категория" />
        <TCard nm="Первенство Алматы" mt="Городской · г. Алматы · 20 фев" />
        <TCard nm="Кубок КазНУ" mt="Городской · г. Алматы · 5 мар" />
      </div>
      <TabBar active="tournaments" />
    </Frame>
  );
}

// 2. подать заявку — что увидит федерация
function JudgeApply() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Заявка на судейство</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body">
        <div className="card">
          <div className="nm2">Чемпионат Казахстана 2026</div>
          <div className="mt2">Республиканский · г. Астана · 18–20 мая</div>
        </div>
        <div className="sect">Что увидит федерация</div>
        <div className="card pcard">
          <img className="avatar" src={ME} alt="" />
          <div className="who"><div className="nm">Оспанов Тимур</div><div className="mt">Претендуете: главный судья</div></div>
        </div>
        <div className="stats">
          <div className="stat b"><div className="v">84</div><div className="k">Рейтинг</div></div>
          <div className="stat"><div className="v">Нац.</div><div className="k">Категория</div></div>
          <div className="stat"><div className="v">42</div><div className="k">Турниров</div></div>
        </div>
        <div className="jstart"><Send size={15} />Подать заявку</div>
        <div className="jnote" style={{ alignSelf: 'center' }}>Федерация выберет одного судью из всех заявок.</div>
      </div>
    </Frame>
  );
}

// 3. на рассмотрении
function JudgeStatus() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Моя заявка</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body" style={{ justifyContent: 'center' }}>
        <div className="jdone">
          <div className="jwaitIc"><Clock3 size={28} /></div>
          <div className="jbig">Заявка на рассмотрении</div>
          <div className="jsub">Чемпионат Казахстана 2026</div>
          <span className="pill wait" style={{ margin: 0 }}>НА РАССМОТРЕНИИ</span>
          <div className="jnote">Федерация выбирает одного судью из заявившихся. Придёт уведомление о решении.</div>
        </div>
      </div>
      <TabBar active="home" />
    </Frame>
  );
}

// 4. назначен → к организации
function JudgeAccepted() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Решение</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body" style={{ justifyContent: 'center' }}>
        <div className="jdone">
          <div className="jdoneIc"><CheckCircle2 size={30} /></div>
          <div className="jbig">Вас назначили главным судьёй</div>
          <div className="jsub">Чемпионат Казахстана 2026</div>
          <div className="jstart"><Trophy size={16} />Организовать турнир</div>
          <div className="jnote">Задайте формат сетки, расписание и назначьте судей столов.</div>
        </div>
      </div>
      <TabBar active="home" />
    </Frame>
  );
}

const Arrow = ({ lbl }: { lbl: string }) => <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>;
const Col = ({ cap, children }: { cap: string; children: ReactNode }) => <div className="col"><div className="cap">{cap}</div>{children}</div>;

export function JudgeApplyFlowBoard() {
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">ЗАЯВКА СУДЬИ · ФЛОУ</div>
        <div className="board-tag">судья подаёт на судейство · тёмная тема</div>
      </div>
      <div className="row">
        <Col cap="Турниры для судейства"><JudgeTournaments /></Col>
        <Arrow lbl="подать заявку" />
        <Col cap="Заявка"><JudgeApply /></Col>
        <Arrow lbl="отправлено" />
        <Col cap="На рассмотрении"><JudgeStatus /></Col>
        <Arrow lbl="решение федерации" />
        <Col cap="Назначен"><JudgeAccepted /></Col>
      </div>
    </div>
  );
}
