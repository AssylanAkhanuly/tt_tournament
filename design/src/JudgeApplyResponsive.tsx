import type { ReactNode } from 'react';
import { Scale, FileText, User, ChevronRight, Clock3, CheckCircle2, Send, Trophy } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Board, Col, Arrow, Tab } from './respShell';

/* Веб → Судья · Заявка на судейство, десктоп + планшет (телефон — в JudgeApplyFlow).
   Турниры для судейства → заявка → на рассмотрении → назначен главным судьёй. */

const NAV: [ReactNode, string][] = [
  [<Scale size={18} />, 'Судейство'],
  [<FileText size={18} />, 'Мои заявки'],
  [<User size={18} />, 'Профиль'],
];
const ME = { nm: 'Оспанов Т.', rl: 'Судья · нац. категория', av: 'https://randomuser.me/api/portraits/men/76.jpg' };

// ── содержимое шагов ──
const TRow = ({ nm, mt }: { nm: string; mt: string }) => (
  <div className="drow">
    <div className="who"><div className="nm">{nm}</div><div className="rl">{mt}</div></div>
    <button className="dpickbtn">Подать заявку <ChevronRight size={13} style={{ verticalAlign: '-2px' }} /></button>
  </div>
);

const Tournaments = () => (
  <>
    <div className="dactionbar"><div className="dcount">3 турнира · приём заявок судей открыт</div></div>
    <div className="drows">
      <TRow nm="Чемпионат Казахстана 2026" mt="Республиканский · г. Астана · 18–20 мая · нужна нац. категория" />
      <TRow nm="Первенство Алматы" mt="Городской · г. Алматы · 20 фев" />
      <TRow nm="Кубок КазНУ" mt="Городской · г. Алматы · 5 мар" />
    </div>
  </>
);

const ApplyForm = () => (
  <div className="dform" style={{ gridTemplateColumns: '1fr', flex: 'none' }}>
    <section className="panel">
      <div className="phead"><span className="t">Что увидит федерация</span></div>
      <div className="pbody dfg">
        <div className="drow" style={{ background: 'transparent', border: 0, padding: 0 }}>
          <img src={ME.av} alt="" />
          <div className="who"><div className="nm">Оспанов Тимур</div><div className="rl">Претендует: главный судья</div></div>
        </div>
        <div className="dchips" style={{ marginTop: 2 }}>
          <div className="dchip b"><div className="v">84</div><div className="k">Рейтинг</div></div>
          <div className="dchip"><div className="v">Нац.</div><div className="k">Категория</div></div>
          <div className="dchip"><div className="v">42</div><div className="k">Турниров</div></div>
        </div>
        <div className="dhintbox">Федерация выберет одного судью из всех заявок. Остальным придёт отказ с причиной.</div>
      </div>
    </section>
    <div className="dsubmit"><Send size={16} />Подать заявку</div>
  </div>
);

const Status = () => (
  <div className="dcenter">
    <div className="jwaitIc"><Clock3 size={30} /></div>
    <div className="jbig">Заявка на рассмотрении</div>
    <div className="jsub" style={{ marginTop: -4 }}>Чемпионат Казахстана 2026</div>
    <span className="pill wait" style={{ margin: 0 }}>НА РАССМОТРЕНИИ</span>
    <div className="jnote" style={{ maxWidth: 360 }}>Федерация выбирает одного судью из заявившихся. Придёт уведомление о решении.</div>
  </div>
);

const Accepted = () => (
  <div className="dcenter">
    <div className="jdoneIc"><CheckCircle2 size={30} /></div>
    <div className="jbig">Вас назначили главным судьёй</div>
    <div className="jsub" style={{ marginTop: -4 }}>Чемпионат Казахстана 2026</div>
    <div className="dsubmit" style={{ flex: 'none', padding: '13px 20px' }}><Trophy size={16} />Организовать турнир</div>
    <div className="jnote" style={{ maxWidth: 360 }}>Задайте формат сетки, расписание и назначьте судей столов.</div>
  </div>
);

export function JudgeApplyDesktopBoard({ frame = 'desktop' }: { frame?: DeskVariant }) {
  const land = frame === 'land';
  return (
    <Board title={land ? 'СУДЬЯ · ЗАЯВКА НА СУДЕЙСТВО · ПЛАНШЕТ (АЛЬБОМ)' : 'СУДЬЯ · ЗАЯВКА НА СУДЕЙСТВО · ДЕСКТОП'} tag={land ? 'веб · планшет · альбом' : 'веб · большой экран'}>
      <Col cap="Турниры для судейства">
        <Desk variant={frame} title="Открыт приём заявок" sub="Турниры, где можно подать на судейство" nav={NAV} activeNav="Судейство" role={ME}>
          <Tournaments />
        </Desk>
      </Col>
      <Arrow lbl="подать заявку" />
      <Col cap="Заявка">
        <Desk variant={frame} title="Заявка на судейство" sub="Чемпионат Казахстана 2026 · главный судья" nav={NAV} activeNav="Судейство" role={ME}
          hint="Заявку можно подать снова, пока приём открыт."><ApplyForm /></Desk>
      </Col>
      <Arrow lbl="отправлено" />
      <Col cap="На рассмотрении">
        <Desk variant={frame} title="Моя заявка" sub="Ожидает решения федерации" nav={NAV} activeNav="Мои заявки" role={ME}><Status /></Desk>
      </Col>
      <Arrow lbl="решение" />
      <Col cap="Назначен">
        <Desk variant={frame} title="Решение федерации" sub="Заявка одобрена" nav={NAV} activeNav="Мои заявки" role={ME}><Accepted /></Desk>
      </Col>
    </Board>
  );
}

export function JudgeApplyTabletBoard() {
  return (
    <Board title="СУДЬЯ · ЗАЯВКА НА СУДЕЙСТВО · ПЛАНШЕТ" tag="веб · планшет">
      <Col cap="Турниры для судейства"><Tab title="Открыт приём заявок" sub="Можно судить"><Tournaments /></Tab></Col>
      <Arrow lbl="подать заявку" />
      <Col cap="Заявка"><Tab title="Заявка на судейство" sub="Чемпионат Казахстана 2026"><ApplyForm /></Tab></Col>
      <Arrow lbl="отправлено" />
      <Col cap="На рассмотрении"><Tab title="Моя заявка" sub="Ожидает решения" center><Status /></Tab></Col>
      <Arrow lbl="решение" />
      <Col cap="Назначен"><Tab title="Решение федерации" sub="Заявка одобрена" center><Accepted /></Tab></Col>
    </Board>
  );
}
