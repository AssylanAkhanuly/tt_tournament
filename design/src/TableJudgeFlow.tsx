import type { ReactNode } from 'react';
import { ChevronLeft, Radio, CheckCircle2, Send, Swords } from 'lucide-react';
import { Frame } from './PlayerApp';
import { JudgeTable } from './TournamentFlow';
import '../gen/frame.css';
import './tournament.css';

/* Флоу СУДЬИ СТОЛА (адаптивный веб — телефон/планшет): назначен стол → ведение
   матча (ввод счёта) → матч завершён и результат уходит главному судье. */

const AV = {
  smag: 'https://randomuser.me/api/portraits/men/32.jpg',
  tok: 'https://randomuser.me/api/portraits/men/51.jpg',
};

// 1. назначен стол — судья подтверждает готовность
function TableAssigned() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Судья · Стол 3</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body" style={{ paddingBottom: 16, justifyContent: 'center' }}>
        <div className="jassign">
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
      </div>
    </Frame>
  );
}

// 3. матч завершён — отправка результата главному судье
function MatchDone() {
  return (
    <Frame>
      <div className="nav">
        <span className="back"><ChevronLeft size={22} /></span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Стол 3 · итог</span>
        <span style={{ width: 34 }} />
      </div>
      <div className="body" style={{ paddingBottom: 16, justifyContent: 'center' }}>
        <div className="jdone">
          <div className="jdoneIc"><CheckCircle2 size={30} /></div>
          <div className="jbig">Матч завершён</div>
          <div className="card jwin">
            <img className="avatar" src={AV.smag} alt="" />
            <div className="who"><div className="nm">Смагулов А.</div><div className="mt">победитель</div></div>
            <div className="jwsc">3 : 1</div>
          </div>
          <div className="sets" style={{ marginTop: 2 }}>
            <span className="setchip"><b>11</b>–9</span>
            <span className="setchip">9–<b>11</b></span>
            <span className="setchip"><b>11</b>–7</span>
            <span className="setchip"><b>11</b>–6</span>
          </div>
          <div className="jstart ok"><Send size={15} />Отправить результат</div>
          <div className="jnote">Результат уйдёт главному судье на сверку и в протокол.</div>
        </div>
      </div>
    </Frame>
  );
}

const Arrow = ({ lbl }: { lbl: string }) => <div className="arrow"><div className="lbl">{lbl}</div><div className="ln" /></div>;
const Col = ({ cap, children }: { cap: string; children: ReactNode }) => <div className="col"><div className="cap">{cap}</div>{children}</div>;

export function TableJudgeFlowBoard() {
  return (
    <div className="board">
      <div className="board-h">
        <div className="board-title">СУДЬЯ СТОЛА · ФЛОУ</div>
        <div className="board-tag">адаптивный веб (телефон/планшет) · тёмная тема</div>
      </div>
      <div className="row">
        <Col cap="Назначен стол"><TableAssigned /></Col>
        <Arrow lbl="начать матч" />
        <Col cap="Ведение · ввод счёта"><JudgeTable /></Col>
        <Arrow lbl="матч-болл" />
        <Col cap="Матч завершён"><MatchDone /></Col>
      </div>
    </div>
  );
}
