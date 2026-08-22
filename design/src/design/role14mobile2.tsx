/* Э14.1 · мобильный экран — вторая пачка обликов (Д–М).

   Первые четыре (А тёмное табло, Б цветной блок, В типографика, Г знак) живут
   в `role14mobile.tsx`. Здесь ещё восемь, чтобы выбирать было из чего.

   Содержание везде одно и задано флоу: матчи дня, показатели, что дальше.
   Оболочка — та же (хром браузера с натуры, шапка сайта, навигация роли),
   чтобы сравнивать облик, а не оболочку. Фотографий нет ни в одном: решение
   «фона-картинки нет» от 22.08.2026 держится.

   Разные здесь не цвета, а ПРЕДМЕТ, на который похож экран:

     Д · Билет      — посадочный талон: корешок с номером стола, перфорация.
     Е · Стол       — само полотно стола сверху, номер лежит на нём.
     Ж · Сетка      — мой путь по сетке, текущий матч подсвечен.
     З · Часы       — обратный отсчёт кольцом: сколько осталось до вызова.
     И · Разговор   — обращения федерации репликами, действие внутри реплики.
     К · Плитки     — приборная панель: каждый факт своей плиткой.
     Л · Ведомость  — порядок игры строками, как в протоколе на стене зала.
     М · Стори      — полноэкранная история с полосками прогресса сверху. */

import { ArrowRight, ChevronRight, Play } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { RESULTS } from './role14home';
import { DAY, type Match } from './role14heroswiper';
import { Chrome, Deck, NAV, ThemeBox } from './role14mobile';
import './role14mobile2.css';

const M0 = DAY[0];
const NEXT = DAY.slice(1);

/* Хвост экрана, общий для тех вариантов, где он одинаковый: показатели и что
   дальше сегодня. Отличается облик героя, а не список под ним. */
function Tail({ cls = '' }: { cls?: string }) {
  return (
    <div className={'m2tail ' + cls}>
      <div className="m2rail">
        <div>
          <b className="o14-disp">2456</b>
          <span>рейтинг</span>
        </div>
        <div>
          <b className="o14-disp">7</b>
          <span>место в РК</span>
        </div>
        <div>
          <b className="o14-disp up">+24</b>
          <span>за турнир</span>
        </div>
      </div>
      <div className="m2sec">Дальше сегодня</div>
      {NEXT.map((m) => (
        <div className="m2row" key={m.round} data-to="Э14.5">
          <span className="t o14-disp">{m.table}</span>
          <span className="tx">
            <span className="nm">{m.foe ?? 'соперник после жеребьёвки'}</span>
            <span className="ss">{m.round}</span>
          </span>
          <span className="tm o14-disp">{m.time}</span>
        </div>
      ))}
    </div>
  );
}

function Screen({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <div className={'mb-wrap ' + cls}>
      <Frame>
        <Chrome>
          <div className="mb-body">{children}</div>
        </Chrome>
        <MiniTabBar items={NAV} active="Главная" />
      </Frame>
    </div>
  );
}

/* ═══ Д · Билет ════════════════════════════════════════════════════
   Посадочный талон: сверху рейс, снизу корешок с номером. Предмет, который
   человек уже умеет читать, и который сам объясняет, что его куда-то зовут. */
function CardTicket(m: Match) {
  const quiet = m.state === 'later';
  return (
    <div className={'m2t-card' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="m2t-head">
        <span className="m2t-state">{m.pill}</span>
        <span className="m2t-time o14-disp">{m.time}</span>
      </div>
      <div className="m2t-main">
        <div className="m2t-num o14-disp">{m.table}</div>
        <div className="m2t-k">
          стол
          <span>{m.round}</span>
        </div>
      </div>
      {/* Перфорация: две выемки по краям и пунктир между ними. */}
      <div className="m2t-perf">
        <i className="l" />
        <i className="r" />
      </div>
      <div className="m2t-stub">
        <div>
          <span className="k">соперник</span>
          <span className="v o14-disp">{m.foe ?? 'после жеребьёвки'}</span>
        </div>
        <div className="m2t-code" aria-hidden />
      </div>
    </div>
  );
}

export function MobileTicket() {
  return (
    <Screen cls="m2t">
      <div className="mb-eyebrow">Сегодня · 3 матча</div>
      <Deck id="m2t-dots" card={CardTicket} />
      <button type="button" className="m2go" data-to="Э14.5">
        Открыть матч <ArrowRight size={16} />
      </button>
      <Tail />
    </Screen>
  );
}

/* ═══ Е · Стол ═════════════════════════════════════════════════════
   Само полотно стола сверху: синее поле, белая линия и сетка поперёк, номер
   лежит на нём. Домен нарисован по-своему, а не подписан словом. */
function CardTable(m: Match) {
  const quiet = m.state === 'later';
  return (
    <div className={'m2s-card' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="m2s-plane">
        <div className="m2s-mid" />
        <div className="m2s-net" />
        <span className="m2s-num o14-disp">{m.table}</span>
      </div>
      <div className="m2s-in">
        <span className="m2s-state">{m.pill}</span>
        <div className="m2s-foe o14-disp">{m.foe ?? 'соперник после жеребьёвки'}</div>
        <div className="m2s-meta">
          {m.round} · начало {m.time}
        </div>
      </div>
    </div>
  );
}

export function MobileTable() {
  return (
    <Screen cls="m2s">
      <div className="mb-eyebrow">Сегодня · 3 матча</div>
      <Deck id="m2s-dots" card={CardTable} />
      <button type="button" className="m2go" data-to="Э14.5">
        Открыть матч <ArrowRight size={16} />
      </button>
      <Tail />
    </Screen>
  );
}

/* ═══ Ж · Сетка ════════════════════════════════════════════════════
   Спортсмен думает «до кого я дошёл». Экран строится вокруг моего пути по
   сетке: пройденные круги, текущий подсвечен, дальше — пусто. */
const PATH = [
  { r: '1/32', foe: 'Ахметов Т.', sc: '3:0', done: true },
  { r: '1/16', foe: 'Оралбек Д.', sc: '3:1', done: true },
  { r: '1/8', foe: 'Жумабеков Р.', sc: 'стол 5 · 14:20', now: true },
  { r: '1/4', foe: 'победитель Смагулов — Тлеуберди', sc: '16:40' },
];

export function MobileBracket() {
  return (
    <Screen cls="m2b">
      <div className="mb-eyebrow">Кубок Алматы · мой путь</div>
      <div className="m2b-path">
        {PATH.map((p) => (
          <div className={'m2b-row' + (p.now ? ' now' : '') + (p.done ? ' done' : '')} key={p.r}>
            <span className="r o14-disp">{p.r}</span>
            <span className="ln" />
            <span className="tx">
              <span className="nm">{p.foe}</span>
              <span className="ss">{p.sc}</span>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="m2go" data-to="Э14.5">
        Открыть матч <ArrowRight size={16} />
      </button>
      <Tail />
    </Screen>
  );
}

/* ═══ З · Часы ═════════════════════════════════════════════════════
   Отвечает не «где», а «когда»: кольцо обратного отсчёта до начала. Номер
   стола внутри кольца, всё остальное — под ним. */
export function MobileClock() {
  return (
    <Screen cls="m2c">
      <div className="mb-eyebrow">До вызова</div>
      {/* Кольцо и число — два слоя: маска, которая делает из круга кольцо,
          съела бы текст, если бы он лежал внутри неё. */}
      <div className="m2c-clock">
        <div className="m2c-ring" />
        <div className="m2c-in">
          <span className="v o14-disp">12</span>
          <span className="k">минут до вызова</span>
        </div>
      </div>
      <div className="m2c-txt">
        <div className="t o14-disp">Стол {M0.table} · {M0.time}</div>
        <div className="f o14-disp">{M0.foe}</div>
        <div className="s">{M0.round}</div>
      </div>
      <button type="button" className="m2go" data-to="Э14.5">
        Открыть матч <ArrowRight size={16} />
      </button>
      <Tail />
    </Screen>
  );
}

/* ═══ И · Разговор ═════════════════════════════════════════════════
   Всё, что на главной происходит, и так приходит уведомлением. Здесь это не
   пересказ, а сами обращения: у каждого отправитель и своё действие. */
const TALK = [
  { from: 'Главный судья', t: `Вас вызвали на стол ${M0.table}. Соперник — ${M0.foe}, ${M0.round}.`, at: '14:08', act: 'Открыть матч', now: true },
  { from: 'Судейская коллегия', t: 'Парный разряд: ваша пара играет на столе 3 около 16:40.', at: '12:30' },
  { from: 'Пресс-служба ФНТ', t: 'Опубликован календарь сезона 2026.', at: 'вчера' },
];

export function MobileTalk() {
  return (
    <Screen cls="m2m">
      <div className="mb-eyebrow">Сегодня</div>
      {TALK.map((x) => (
        <div className={'m2m-msg' + (x.now ? ' now' : '')} key={x.at}>
          <div className="m2m-from">
            {x.from}
            <span>{x.at}</span>
          </div>
          <div className="m2m-t">{x.t}</div>
          {x.act && (
            <button type="button" className="m2m-go" data-to="Э14.5">
              <Play size={13} /> {x.act}
            </button>
          )}
        </div>
      ))}
      <Tail cls="flat" />
    </Screen>
  );
}

/* ═══ К · Плитки ═══════════════════════════════════════════════════
   Приборная панель: каждый факт — своя плитка, вызов занимает две колонки.
   Порядок плиток — вопрос настройки, а не вёрстки. */
export function MobileTiles() {
  return (
    <Screen cls="m2k">
      <div className="m2k-grid">
        <div className="m2k-tile call" data-to="Э14.5">
          <span className="st">{M0.pill}</span>
          <span className="num o14-disp">{M0.table}</span>
          <span className="k">стол · {M0.time}</span>
          <span className="foe o14-disp">{M0.foe}</span>
        </div>
        <div className="m2k-tile">
          <span className="v o14-disp">2456</span>
          <span className="k">рейтинг</span>
        </div>
        <div className="m2k-tile">
          <span className="v o14-disp">7</span>
          <span className="k">место в РК</span>
        </div>
        <div className="m2k-tile">
          <span className="v o14-disp up">+24</span>
          <span className="k">за турнир</span>
        </div>
        <div className="m2k-tile">
          <span className="v o14-disp">64 %</span>
          <span className="k">побед</span>
        </div>
        <div className="m2k-tile wide" data-to="Э14.5">
          <span className="k">дальше сегодня</span>
          <span className="foe o14-disp">{NEXT[0].foe}</span>
          <span className="k">стол {NEXT[0].table} · {NEXT[0].time}</span>
        </div>
      </div>
    </Screen>
  );
}

/* ═══ Л · Ведомость ════════════════════════════════════════════════
   Порядок игры, как его вешают на стену зала: время, стол, круг, соперник.
   Ни цвета, ни заливок — только линейки и выключка. */
export function MobileSheet() {
  return (
    <Screen cls="m2l">
      <div className="m2l-h">
        Порядок игры · 22 августа
        <span>Кубок Алматы 2026</span>
      </div>
      <div className="m2l-tab">
        <div className="m2l-th">
          <span>время</span>
          <span>стол</span>
          <span>круг</span>
          <span>соперник</span>
        </div>
        {DAY.map((m) => (
          <div className={'m2l-tr' + (m.state === 'called' ? ' now' : '')} key={m.round} data-to="Э14.5">
            <span className="o14-disp">{m.time}</span>
            <span className="o14-disp">{m.table}</span>
            <span>{m.round.split(' · ')[0]}</span>
            <span className="nm">{m.foe ?? '—'}</span>
          </div>
        ))}
      </div>
      <button type="button" className="m2l-go" data-to="Э14.5">
        Открыть матч на столе {M0.table} <ChevronRight size={15} />
      </button>
      <div className="m2l-h">Последние результаты</div>
      <div className="m2l-tab">
        {RESULTS.map((r) => (
          <div className="m2l-tr res" key={r.nm} data-to="Э14.6">
            <span className="nm wide">{r.nm}</span>
            <span className={'o14-disp ' + (r.win ? 'w' : 'l')}>{r.sc}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ═══ М · Стори ════════════════════════════════════════════════════
   Полноэкранная история: полоски прогресса сверху, один матч — один экран,
   листается пальцем. Самый «потребительский» язык из всех. */
function CardStory(m: Match) {
  const quiet = m.state === 'later';
  return (
    <div className={'m2r-card' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="m2r-bars">
        {DAY.map((x) => (
          <i className={x.round === m.round ? 'on' : ''} key={x.round} />
        ))}
      </div>
      <div className="m2r-top">{m.pill}</div>
      <div className="m2r-mid">
        <div className="m2r-num o14-disp">{m.table}</div>
        <div className="m2r-k">стол</div>
        <div className="m2r-foe o14-disp">{m.foe ?? 'соперник после жеребьёвки'}</div>
        <div className="m2r-meta">
          {m.round} · {m.time}
        </div>
      </div>
      <button type="button" className="m2r-go" data-to="Э14.5">
        {m.action} <ArrowRight size={16} />
      </button>
    </div>
  );
}

export function MobileStory() {
  return (
    <ThemeBox theme="fnt">
      <Screen cls="m2r">
        <Deck id="m2r-dots" card={CardStory} />
      </Screen>
    </ThemeBox>
  );
}
