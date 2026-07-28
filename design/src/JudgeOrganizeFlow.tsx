import type { ReactNode } from 'react';
import { LayoutDashboard, Network, Users, Grid2x2, Settings, Send, Clock3 } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import '../gen/frame.css';
import '../gen/desktop.css';
import './tournament.css';

/* Веб → Судья: главный судья организует турнир (формат/расписание/судьи столов)
   и отправляет на утверждение федерации. */

const NAV: [ReactNode, string][] = [
  [<LayoutDashboard size={18} />, 'Обзор'],
  [<Network size={18} />, 'Сетка'],
  [<Users size={18} />, 'Игроки'],
  [<Grid2x2 size={18} />, 'Столы'],
  [<Settings size={18} />, 'Настройки'],
];
const JUDGE = { nm: 'Оспанов Т.', rl: 'Главный судья', av: 'https://randomuser.me/api/portraits/men/76.jpg' };

const Seg = ({ opts, on }: { opts: string[]; on: number }) => (
  <div className="dseg2">{opts.map((o, i) => <span key={o} className={i === on ? 'on' : ''}>{o}</span>)}</div>
);

function Organize({ variant }: { variant?: DeskVariant }) {
  const judges: [string, string][] = [
    ['Стол 1', 'Пак С.'], ['Стол 2', 'Ким Г.'], ['Стол 3', 'Ли А.'], ['Стол 4', '—'],
    ['Стол 5', '—'], ['Стол 6', 'Цой В.'], ['Стол 7', 'Нур А.'], ['Стол 8', '—'],
  ];
  return (
    <Desk
      variant={variant}
      title="Организация турнира"
      sub="Формат, расписание и судьи столов — перед отправкой на утверждение"
      nav={NAV} activeNav="Настройки" role={JUDGE}
      hint="После отправки федерация утверждает организацию или возвращает с причиной."
    >
      <div className="dform">
        <div className="dformCol">
          <section className="panel">
            <div className="phead"><span className="t">Формат</span></div>
            <div className="pbody dfg">
              <div className="dfield"><label>Система проведения</label><Seg opts={['Олимпийская', 'Группы + плей-офф', 'Круговая']} on={0} /></div>
              <div className="dfield"><label>Дисциплина</label><Seg opts={['Одиночная', 'Парная']} on={0} /></div>
              <div className="dfield"><label>Партий в матче до</label><Seg opts={['3', '4', '5']} on={1} /></div>
            </div>
          </section>
          <section className="panel">
            <div className="phead"><span className="t">Расписание</span></div>
            <div className="pbody dfg">
              <div className="dfield"><label>Дни</label><div className="dval">18–20 мая · 3 дня</div></div>
              <div className="dfield"><label>Столы</label><div className="dval">20 столов · 8 часов в день</div></div>
              <div className="dhintbox">Подсказка системы: на 200 участников олимпийка укладывается в 2 дня при 20 столах.</div>
            </div>
          </section>
        </div>
        <div className="dformCol">
          <section className="panel" style={{ flex: 1 }}>
            <div className="phead"><span className="t">Судьи столов</span><span className="seg"><span className="on">6 / 20 назначено</span></span></div>
            <div className="pbody djudges">
              {judges.map(([t, j]) => (
                <div key={t} className="djudge"><span className="tn">{t}</span><span className={'jn' + (j === '—' ? ' empty' : '')}>{j}</span></div>
              ))}
            </div>
          </section>
          <div className="dsubmit"><Send size={16} />Отправить на утверждение</div>
        </div>
      </div>
    </Desk>
  );
}

function Submitted({ variant }: { variant?: DeskVariant }) {
  return (
    <Desk variant={variant} title="Организация отправлена" sub="Федерация проверяет и утверждает" nav={NAV} activeNav="Настройки" role={JUDGE}>
      <div className="dcenter">
        <div className="jwaitIc"><Clock3 size={30} /></div>
        <div className="jbig">На утверждении у федерации</div>
        <div className="jsub" style={{ marginTop: -4 }}>Чемпионат Казахстана 2026 · олимпийская · 20 столов</div>
        <span className="pill wait" style={{ margin: 0 }}>НА УТВЕРЖДЕНИИ</span>
        <div className="jnote" style={{ maxWidth: 360 }}>
          Без утверждения турнир не публикуется и не стартует. Придёт уведомление о решении;
          при отказе организация вернётся с причиной на доработку.
        </div>
      </div>
    </Desk>
  );
}

const Arrow = ({ lbl }: { lbl: string }) => <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>;
const Col = ({ cap, children }: { cap: string; children: ReactNode }) => <div className="col"><div className="cap">{cap}</div>{children}</div>;

export function JudgeOrganizeFlowBoard({ frame = 'desktop' }: { frame?: DeskVariant }) {
  const land = frame === 'land';
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">{land ? 'СУДЬЯ · ОРГАНИЗАЦИЯ ТУРНИРА · ПЛАНШЕТ (АЛЬБОМ)' : 'СУДЬЯ · ОРГАНИЗАЦИЯ ТУРНИРА'}</div>
        <div className="board-tag">{land ? 'веб · планшет · альбом' : 'десктоп · веб'}</div>
      </div>
      <div className="row">
        <Col cap="Настройка"><Organize variant={frame} /></Col>
        <Arrow lbl="отправить" />
        <Col cap="На утверждении"><Submitted variant={frame} /></Col>
      </div>
    </div>
  );
}
