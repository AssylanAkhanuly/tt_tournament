import type { ReactNode } from 'react';
import { LayoutDashboard, Network, Grid2x2, Settings, Send, Clock3, Bell } from 'lucide-react';
import { Frame } from './PlayerApp';
import { Board, Col, Arrow, Tab, MiniTabBar } from './respShell';
import fntLogo from './assets/fnt-emblem.png';
import { FormSeg } from './segs';

/* Веб → Судья · Организация турнира, планшет + телефон (десктоп — в JudgeOrganizeFlow).
   Настройка формата/расписания/судей столов → отправка на утверждение федерации. */

const JTABS: [ReactNode, string][] = [
  [<LayoutDashboard size={20} />, 'Обзор'],
  [<Network size={20} />, 'Сетка'],
  [<Grid2x2 size={20} />, 'Столы'],
  [<Settings size={20} />, 'Настройки'],
];

const Seg = ({ opts, on }: { opts: string[]; on: number }) => (
  <FormSeg items={opts} active={opts[on]} />
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="dfield"><label>{label}</label>{children}</div>
);

// ── содержимое: настройка ──
const OrganizeForm = () => {
  const judges: [string, string][] = [
    ['Стол 1', 'Пак С.'], ['Стол 2', 'Ким Г.'], ['Стол 3', 'Ли А.'], ['Стол 4', '—'],
    ['Стол 5', '—'], ['Стол 6', 'Цой В.'],
  ];
  return (
    <>
      <div className="sect">Формат</div>
      <div className="card dfg">
        <Field label="Система проведения"><Seg opts={['Олимпийская', 'Группы + плей-офф', 'Круговая']} on={0} /></Field>
        <Field label="Дисциплина"><Seg opts={['Одиночная', 'Парная']} on={0} /></Field>
        <Field label="Партий в матче до"><Seg opts={['3', '4', '5']} on={1} /></Field>
      </div>
      <div className="sect">Расписание</div>
      <div className="card dfg">
        <Field label="Дни"><div className="dval">18–20 мая · 3 дня</div></Field>
        <Field label="Столы"><div className="dval">20 столов · 8 часов в день</div></Field>
        <div className="dhintbox">На 200 участников олимпийка укладывается в 2 дня при 20 столах.</div>
      </div>
      <div className="sect">Судьи столов · 6 / 20</div>
      <div className="djudges" style={{ overflow: 'visible' }}>
        {judges.map(([t, j]) => (
          <div key={t} className="djudge"><span className="tn">{t}</span><span className={'jn' + (j === '—' ? ' empty' : '')}>{j}</span></div>
        ))}
      </div>
      <div className="jstart"><Send size={16} />Отправить на утверждение</div>
    </>
  );
};

// ── содержимое: на утверждении ──
const Submitted = () => (
  <>
    <div className="jwaitIc"><Clock3 size={30} /></div>
    <div className="jbig">На утверждении у федерации</div>
    <div className="jsub" style={{ marginTop: -4 }}>Чемпионат Казахстана 2026 · олимпийская · 20 столов</div>
    <span className="pill wait" style={{ margin: 0 }}>НА УТВЕРЖДЕНИИ</span>
    <div className="jnote" style={{ maxWidth: 360 }}>Без утверждения турнир не публикуется и не стартует. Придёт уведомление; при отказе организация вернётся с причиной.</div>
  </>
);

// ── планшет ──
export function OrganizeTabletBoard() {
  return (
    <Board title="СУДЬЯ · ОРГАНИЗАЦИЯ ТУРНИРА · ПЛАНШЕТ" tag="веб · планшет">
      <Col cap="Настройка"><Tab title="Организация турнира" sub="Формат · расписание · судьи столов"><OrganizeForm /></Tab></Col>
      <Arrow lbl="отправить" />
      <Col cap="На утверждении"><Tab title="Организация отправлена" sub="Федерация проверяет" center><Submitted /></Tab></Col>
    </Board>
  );
}

// ── телефон (веб) ──
const JudgePhone = ({ title, active, center, children }: { title: string; active: string; center?: boolean; children: ReactNode }) => (
  <Frame>
    <div className="nav">
      <div className="brand"><img src={fntLogo} alt="ФНТ РК" /> Судья</div>
      <button className="iconbtn dot"><Bell size={17} /></button>
    </div>
    <div className="body" style={center ? { justifyContent: 'center' } : undefined}>
      {!center && <div className="title">{title}</div>}
      {children}
    </div>
    <MiniTabBar items={JTABS} active={active} />
  </Frame>
);

export function OrganizeMobileBoard() {
  return (
    <Board title="СУДЬЯ · ОРГАНИЗАЦИЯ ТУРНИРА · ТЕЛЕФОН (ВЕБ)" tag="веб · телефон">
      <Col cap="Настройка"><JudgePhone title="Организация" active="Настройки"><OrganizeForm /></JudgePhone></Col>
      <Arrow lbl="отправить" />
      <Col cap="На утверждении">
        <JudgePhone title="" active="Обзор" center>
          <div className="jdone"><Submitted /></div>
        </JudgePhone>
      </Col>
    </Board>
  );
}
