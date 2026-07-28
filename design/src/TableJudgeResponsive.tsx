import type { ReactNode } from 'react';
import { Swords, ClipboardList, Grid2x2, Radio, CheckCircle2, Send, Minus, Plus } from 'lucide-react';
import { Desk, type DeskVariant } from './deskShell';
import { Board, Col, Arrow, Tab } from './respShell';

/* Веб → Судья стола, десктоп + планшет (телефон — в TableJudgeFlow).
   Тот же сценарий: назначен стол → ввод счёта → матч завершён. */

const NAV: [ReactNode, string][] = [
  [<Swords size={18} />, 'Мой стол'],
  [<ClipboardList size={18} />, 'Протокол'],
  [<Grid2x2 size={18} />, 'Все столы'],
];
const JUDGE = { nm: 'Пак С.', rl: 'Судья стола · Стол 3', av: 'https://randomuser.me/api/portraits/men/13.jpg' };
const AV = { smag: 'https://randomuser.me/api/portraits/men/32.jpg', tok: 'https://randomuser.me/api/portraits/men/51.jpg' };

// ── содержимое шагов (без оболочки — вставляется и в десктоп, и в планшет) ──
const Assigned = () => (
  <div className="jassign" style={{ maxWidth: 440 }}>
    <div className="jassignIc"><Swords size={26} /></div>
    <div className="jbig">Вам назначен стол 3</div>
    <div className="jsub">1/2 финала · до 4 партий</div>
    <div className="card jvs">
      <div className="jvp"><img className="avatar" src={AV.smag} alt="" /><span>Смагулов А.</span></div>
      <span className="jvsx">VS</span>
      <div className="jvp"><img className="avatar" src={AV.tok} alt="" /><span>Токаев М.</span></div>
    </div>
    <div className="jstart"><Radio size={16} />Начать матч</div>
    <div className="jnote">Матч не начнётся, пока вы не подтвердите готовность стола.</div>
  </div>
);

const ScoreP = ({ av, nm, note, pts }: { av: string; nm: string; note: string; pts: number }) => (
  <div className="jp" style={{ padding: '12px 0' }}>
    <img className="avatar sm" src={av} alt="" />
    <div className="who"><div className="nm">{nm}</div><div className="mt">{note}</div></div>
    <div className="stepper">
      <button className="stepbtn"><Minus size={16} /></button>
      <span className="pt">{pts}</span>
      <button className="stepbtn plus"><Plus size={16} /></button>
    </div>
  </div>
);

const ScoreCard = () => (
  <div className="card" style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
    <div className="phead" style={{ padding: '0 0 12px', marginBottom: 4, borderBottom: '1px solid var(--glass-line)' }}>
      <span className="t" style={{ fontSize: 13 }}>Стол 3 · 1/2 финала · партия 4</span>
      <span className="livebadge" style={{ padding: '3px 9px', fontSize: 9.5 }}><span className="d" />LIVE</span>
    </div>
    <ScoreP av={AV.smag} nm="Смагулов А." note="подача" pts={9} />
    <ScoreP av={AV.tok} nm="Токаев М." note="приём" pts={7} />
    <div className="sets" style={{ margin: '10px 0 4px' }}>
      <span className="setchip"><b>11</b>–9</span>
      <span className="setchip">9–<b>11</b></span>
      <span className="setchip"><b>11</b>–7</span>
    </div>
    <div className="jactions" style={{ marginTop: 6 }}>
      <div className="jbtn ghost">Отменить очко</div>
      <div className="jbtn pri">Партия сыграна</div>
    </div>
  </div>
);

const Done = () => (
  <div className="jdone" style={{ maxWidth: 440 }}>
    <div className="jdoneIc"><CheckCircle2 size={30} /></div>
    <div className="jbig">Матч завершён</div>
    <div className="card jwin">
      <img className="avatar" src={AV.smag} alt="" />
      <div className="who"><div className="nm">Смагулов А.</div><div className="mt">победитель</div></div>
      <div className="jwsc">3 : 1</div>
    </div>
    <div className="sets">
      <span className="setchip"><b>11</b>–9</span>
      <span className="setchip">9–<b>11</b></span>
      <span className="setchip"><b>11</b>–7</span>
      <span className="setchip"><b>11</b>–6</span>
    </div>
    <div className="jstart ok"><Send size={15} />Отправить результат</div>
    <div className="jnote">Результат уйдёт главному судье на сверку и в протокол.</div>
  </div>
);

const HINT = 'Матч ведёт судья стола; главный судья видит счёт по ходу игры.';

export function TableJudgeDesktopBoard({ frame = 'desktop' }: { frame?: DeskVariant }) {
  const land = frame === 'land';
  return (
    <Board title={land ? 'СУДЬЯ СТОЛА · ПЛАНШЕТ (АЛЬБОМ)' : 'СУДЬЯ СТОЛА · ДЕСКТОП'} tag={land ? 'веб · планшет · альбом' : 'веб · большой экран · тёмная тема'}>
      <Col cap="Назначен стол">
        <Desk variant={frame} title="Мой стол" sub="Стол 3 · назначен матч, подтвердите готовность" nav={NAV} activeNav="Мой стол" role={JUDGE} hint={HINT}>
          <div className="dcenter"><Assigned /></div>
        </Desk>
      </Col>
      <Arrow lbl="начать матч" />
      <Col cap="Ведение · ввод счёта">
        <Desk variant={frame} title="Ведение матча" sub="Стол 3 · счёт по партиям, подача" nav={NAV} activeNav="Мой стол" role={JUDGE} hint={HINT}>
          <div className="dcenter"><ScoreCard /></div>
        </Desk>
      </Col>
      <Arrow lbl="матч-болл" />
      <Col cap="Матч завершён">
        <Desk variant={frame} title="Итог матча" sub="Стол 3 · отправка результата главному судье" nav={NAV} activeNav="Протокол" role={JUDGE} hint={HINT}>
          <div className="dcenter"><Done /></div>
        </Desk>
      </Col>
    </Board>
  );
}

export function TableJudgeTabletBoard() {
  return (
    <Board title="СУДЬЯ СТОЛА · ПЛАНШЕТ" tag="веб · планшет · тёмная тема">
      <Col cap="Назначен стол"><Tab title="Мой стол · Стол 3" sub="Судья стола" center><Assigned /></Tab></Col>
      <Arrow lbl="начать матч" />
      <Col cap="Ведение · ввод счёта"><Tab title="Ведение матча" sub="Стол 3 · партия 4" center><ScoreCard /></Tab></Col>
      <Arrow lbl="матч-болл" />
      <Col cap="Матч завершён"><Tab title="Итог матча" sub="Стол 3" center><Done /></Tab></Col>
    </Board>
  );
}
