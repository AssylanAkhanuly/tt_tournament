/* Роль 9 · Судья — макеты по флоу.
   Экраны Э9.1–Э9.5 (см. `flows/09-sudya.md` и схему роли).

   Макеты — десктопом, как у всех остальных ролей ✳ (18.08.2026). Работает
   судья за столом с планшета (TZ §6), и экран ввода счёта под палец и остаётся:
   крупный счёт, две половины по игроку, кнопка очка размером в ладонь. Но
   макеты по флоу мы держим в одной оболочке — иначе борд роли читается как из
   другой системы, и сравнить его с соседними ролями нельзя. Так же поступили со
   спортсменом: веб-десктоп сейчас, приложение отдельно (`role14app.tsx`).

   Планшетная раскладка — не другой экран, а тот же в узкой ширине: она живёт
   отдельной историей адаптива, а не отдельным набором макетов. Цвет — только
   токенами. */

import { useState } from 'react';
import {
  Check, Clock, History, Pause, Radio, RefreshCw, Trophy, Undo2, Upload, UserX,
} from 'lucide-react';
import {
  A, ActionBar, Alert, Arrow, Board, Chips, Empty, Hint, P, Panel, RoleScreen, Row, Rows, Screen,
  Shot, States, Tabs,
} from './shell';
import type { ScreenMap } from './shell';
/* История судейства и её формат — общие со всеми судейскими ролями: рейтинг
   ведётся по одному Положению (TZ §7.2). Планшет судьи рисует те же данные
   списком, а не таблицей: пять колонок в 1024 пикселя не читаются. */
import { tourPoints, type JudgeTour } from './judge';
import { R09 } from './roles';
/* Маршрут судейской роли начинается раньше входа: судья заводит себя сам
   (Э0.7), а роль в наряде ему выдают уже потом. Без этой колонки борд и карта
   начинались с «Вход», и откуда взялся человек, из них было не видно. */
import { Login0_1, SignUpJudge0_7, SignUpJudge0_7States } from './role00';

/* ── данные экранов ──────────────────────────────────────────────── */

type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';

type Assign = { t: string; sub: string; st: string; cls: Cls };

const ASSIGN: Assign[] = [
  { t: 'Чемпионат Казахстана 2026', sub: 'г. Астана · 12–16 марта · судья стола 4', st: 'ИДЁТ', cls: 'live' },
  { t: 'Спартакиада школьников', sub: 'г. Шымкент · 9–12 апреля · секретарь', st: 'НАРЯД СОБРАН', cls: 'reg' },
  { t: 'Кубок акима Павлодарской области', sub: 'г. Павлодар · 24–25 апреля · судья стола 1', st: 'НАРЯД СОБРАН', cls: 'reg' },
  { t: 'Кубок Казахстана 2026', sub: 'г. Алматы · 18–22 февраля · заместитель главного судьи', st: 'ЗАВЕРШЁН', cls: 'done' },
  { t: 'Первенство РК до 19 лет', sub: 'г. Караганда · 27–30 января · судья стола 2', st: 'ЗАВЕРШЁН', cls: 'done' },
];

/* лента событий матча: розыгрыши, партии, служебные события */
type Ev = { at: string; t: string; s: string; tone: 'win' | 'loss' | 'flat' };

const EVENTS: Ev[] = [
  { at: '15:47', t: 'Очко — Смагулов Алан', s: 'счёт в партии 4: 8 : 6', tone: 'win' },
  { at: '15:46', t: 'Пауза 1 минута', s: 'запрошена Токаевым М. · отмечена судьёй стола', tone: 'flat' },
  { at: '15:45', t: 'Отмена последнего очка', s: 'вернули 6 : 6 — очко записано не той стороне', tone: 'loss' },
  { at: '15:44', t: 'Очко — Токаев Марат', s: 'счёт в партии 4: 6 : 6', tone: 'loss' },
  { at: '15:41', t: 'Смена подачи', s: 'подача перешла к Токаеву М. · автоматически по счёту', tone: 'flat' },
  { at: '15:39', t: 'Партия 3 закрыта — 11 : 7', s: 'счёт по партиям стал 2 : 1 в пользу Смагулова А.', tone: 'win' },
  { at: '15:22', t: 'Смена сторон', s: 'по регламенту, после второй партии', tone: 'flat' },
  { at: '14:58', t: 'Матч начат', s: 'стол 4 · первая подача — Смагулов А.', tone: 'flat' },
];

const LEDGER: [string, string, string, string, string][] = [
  ['16.03', 'S1', 'Чемпионат Казахстана 2026 · судейство', 'республиканские · коэффициент 1,5 — командирован из другого региона', '+4,5'],
  ['22.02', 'S1', 'Кубок Казахстана 2026 · судейство', 'республиканские · без коэффициента', '+3,0'],
  ['09.02', 'S3', 'Офлайн-семинар ФНТ РК, г. Астана', 'коэффициент 1,5 — семинар за пределами региона учёта', '+4,5'],
  ['12.01', 'S4', 'Работа в коллегии региона, 6 месяцев', 'подтверждено справкой судейской коллегии', '+2,0'],
  ['05.01', 'S2', 'Судья национальной категории', 'опорный балл, пока категория действует', '+4,0'],
];

const DOCS: { t: string; sub: string; st: string; cls: Cls }[] = [
  { t: 'Сертификат офлайн-семинара ФНТ РК', sub: 'S3 · подан 09.02.2026 · проверил Мукашев Б.', st: 'ПРИНЯТ +4,5', cls: 'live' },
  { t: 'Благодарственное письмо акимата', sub: 'S4 · подан 03.04.2026 · у рейтинговой комиссии', st: 'НА ПРОВЕРКЕ', cls: 'wait' },
  { t: 'Протокол теста аттестации', sub: 'S3 · подан 27.02.2026 · причина: скан не читается', st: 'ОТКЛОНЁН', cls: 'bad' },
];

/** История судейства судьи стола. Тип общий с остальными судейскими ролями
    (`judge.tsx`): рейтинг у них один, и разъезжаться формату строки нельзя.

    Видно и главное отличие роли: коэффициент 1,5 судье стола даётся не за место
    в бригаде, а только за выезд — командировку на республиканские соревнования
    из своего региона (TZ §7.2). */
const JUDGE_TOURS9: JudgeTour[] = [
  { nm: 'Чемпионат Казахстана 2026', when: '12–16.03', city: 'Астана', kind: 'Республиканские', post: 'Судья стола', base: 3, k: 1.5 },
  { nm: 'Кубок Казахстана 2026', when: '18–22.02', city: 'Павлодар', kind: 'Республиканские', post: 'Судья стола', base: 3, k: 1 },
  { nm: 'Первенство Павлодара', when: '25.01', city: 'Павлодар', kind: 'Региональные', post: 'Судья стола', base: 1, k: 1 },
  { nm: 'Кубок Иртыша', when: '02–03.06', city: 'Павлодар', kind: 'Региональные', post: 'Судья стола', base: 1, k: 1, miss: true },
];

/* ── Э9.1 · Мои турниры ──────────────────────────────────────────── */

export function Tours9_1() {
  return (
    <RoleScreen
      role={R09}
      nav="Мои турниры"
      title="Мои турниры"
      sub="Оралбай Ержан · судья · сезон 2026"
    >
      {/* Назначения — таблицей, как списки у председателя: одна рамка на
          список, строки волосяной линией, подсветка под курсором. Карточками
          с просветом пять назначений занимали весь экран. */}
      <div className="sect">Мои назначения</div>
      <div className="mktable mkcands mkassign">
        <div className="mktable-h">
          <span>Турнир</span>
          <span>Состояние</span>
        </div>
        <div className="mktable-b">
          {ASSIGN.map((a) => (
            <div className="mktable-r" key={a.t} data-to="Э9.2" role="button" tabIndex={0}>
              <span className="nm">
                <i>{a.t}<em>{a.sub}</em></i>
              </span>
              <span className="mark"><P t={a.st} cls={a.cls} /></span>
            </div>
          ))}
        </div>
      </div>

      {/* Открытых приёмов и подачи заявок здесь больше нет ✳ (18.08.2026): они
          уехали в кабинет судьи (Э0.9, Э0.10). Подача жила у роли судьи стола —
          то есть у человека, который уже назначен: попасть на турнир мог только
          тот, кто на турнире уже есть. Экран роли — про работу на турнире, а не
          про то, как на него попасть. */}
      <div className="sect">Куда подавать заявки</div>
      <div className="item" style={{ marginTop: 0 }} data-to="Э0.9">
        <div className="ic"><Clock size={17} /></div>
        <div className="tx">
          <div className="tt">Турниры и заявки на судейство</div>
          <div className="ss">Открытые приёмы, мои заявки и решения — в кабинете судьи</div>
        </div>
        <span className="pill reg" style={{ margin: 0 }}>3 ПРИЁМА</span>
      </div>
    </RoleScreen>
  );
}

/* ── Э9.2 · Мой стол ─────────────────────────────────────────────── */

export function Table9_2() {
  return (
    <RoleScreen
      role={R09}
      nav="Мой стол"
      title="Мой стол 4"
      sub="Чемпионат Казахстана 2026 · день 2 · 13 марта"
    >
      {/* Очереди стола на экране нет ✳ (18.08.2026): расписание строит главный
          судья, и оно живёт в его руках — у судьи стола оно ничего не решало, а
          место занимало больше, чем сам матч. Судья за столом отвечает на один
          вопрос: эта пара пришла — начинаем? */}
      {/* Подписи «вызвана пара» нет: на экране одна карточка и одна кнопка —
          пересказывать это строкой сверху незачем. */}
      <div className="card">
        <div className="jvs">
          <div className="jvp">
            <img className="avatar" src={A(32)} alt="" />
            <span>Смагулов Алан</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-muted)' }}>Алматы · клуб «Алатау»</span>
          </div>
          <span className="jvsx">VS</span>
          <div className="jvp">
            <img className="avatar" src={A(51)} alt="" />
            <span>Токаев Марат</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-muted)' }}>Астана · клуб «Барыс»</span>
          </div>
        </div>
        <div className="jhint" style={{ marginTop: 12 }}>
          1/8 финала · до 4 побед в партиях · режим ввода — по очкам
        </div>
      </div>

      {/* Одна кнопка ✳: за столом решение одно — начинать. Неявка бывает реже
          и не должна стоять рядом с главным действием: её место в состояниях
          экрана, когда игрок не пришёл. */}
      <div className="jstart" data-to="Э9.3">
        <Radio size={16} />Старт матча
      </div>
    </RoleScreen>
  );
}

/* ── Э9.3 · Ввод счёта — главный экран роли ──────────────────────── */

/** Половина экрана — один игрок: имя, огромный счёт и кнопка очка.

    Указателя подачи здесь нет: судья за столом и так знает, кто подаёт, а на
    экране это была строка мелким шрифтом под именем — прочитать её с
    расстояния всё равно нельзя. Половины равны и цветом ничего не выделяется:
    единственное, что должно бросаться в глаза, — сами числа. */
function Half({ av, nm, city, pts, onPoint, off }: {
  av: string;
  nm: string;
  city: string;
  pts: number;
  onPoint: () => void;
  /** Матч закрыт, пауза или партия ждёт подтверждения — очки не начисляются. */
  off?: boolean;
}) {
  return (
    <div
      className="card"
      style={{ padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}
    >
      <img className="avatar sm" src={av} alt="" />
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.2px' }}>{nm}</div>
      <div style={{ fontSize: 11.5, color: 'var(--c-muted)' }}>{city}</div>
      <div
        style={{
          fontSize: 122,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: '-6px',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--c-ink-bright)',
        }}
      >
        {pts}
      </div>
      {off ? (
        <div className="jbtn ghost" style={{ padding: 13, fontSize: 13.5, width: '100%' }}>+1 очко</div>
      ) : (
        <button
          type="button"
          className="jstart"
          style={{ padding: 13, fontSize: 13.5, width: '100%' }}
          onClick={onPoint}
        >
          +1 очко
        </button>
      )}
    </div>
  );
}

type Pl = { av: string; nm: string; city: string };
const PL: [Pl, Pl] = [
  { av: A(32), nm: 'Смагулов Алан', city: 'Алматы · «Алатау»' },
  { av: A(51), nm: 'Токаев Марат', city: 'Астана · «Барыс»' },
];

/** Ввод по очкам (TZ §6.2): каждое очко отдельной кнопкой, счёт видно с
    расстояния, последнее действие отменяется. */
function ByPoints9_3({ pts, sets, swap, paused, off, done, ready, onPoint, onUndo, onSwap, onPause, onKeep }: {
  pts: [number, number];
  sets: [number, number][];
  swap: boolean;
  paused: boolean;
  off: boolean;
  done: boolean;
  /** Партия доиграна и ждёт подтверждения. */
  ready: boolean;
  onPoint: (i: 0 | 1) => void;
  onUndo: () => void;
  onSwap: () => void;
  onPause: () => void;
  onKeep: () => void;
}) {
  /* Смена сторон меняет местами половины экрана, а не игроков: после смены
     сторон человек, сидевший слева, оказывается справа, и судья ищет его там,
     где видит. Счёт при этом остаётся своим. */
  const order: (0 | 1)[] = swap ? [1, 0] : [0, 1];
  const won = (i: 0 | 1) => sets.filter(([a, b]) => (i === 0 ? a > b : b > a)).length;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 'none' }}>
        {order.map((i) => (
          <Half key={PL[i].nm} {...PL[i]} pts={pts[i]} off={off || ready} onPoint={() => onPoint(i)} />
        ))}
      </div>

      {/* Счёт по партиям — один раз и по центру. Раньше он стоял ещё и под
          каждым числом, и два места говорили одно и то же. */}
      <div className="lvs" style={{ flex: 'none' }}>
        <span className="setscore">{won(order[0])}</span>
        <span className="vs">СЧЁТ ПО ПАРТИЯМ</span>
        <span className="setscore">{won(order[1])}</span>
      </div>

      {/* Сыгранные партии — счётом, без номера: номер читается по месту в ряду,
          а идущая партия видна по крупным числам выше. */}
      <div className="sets" style={{ flex: 'none' }}>
        {sets.map(([a, b], n) => (
          <span className="setchip" key={n}>
            {a > b ? <b>{a}</b> : a}–{b > a ? <b>{b}</b> : b}
          </span>
        ))}
        {sets.length === 0 && <span className="setchip">партий ещё нет</span>}
      </div>

      {/* Полоса управления живёт внутри ввода по очкам: отмена очка, смена
          сторон и пауза — про сам розыгрыш. На вкладке «Партии» их нет, а после
          подтверждения матча нет вовсе: счёт стал итогом. */}
      {!done && (
        <div style={{ display: 'flex', gap: 9, flex: 'none' }}>
          <button type="button" className="jbtn ghost" style={{ padding: 12 }} onClick={onUndo}>
            <Undo2 size={15} />Отменить последнее
          </button>
          <button type="button" className="jbtn ghost" style={{ padding: 12 }} onClick={onSwap}>
            <RefreshCw size={15} />Смена сторон
          </button>
          <button
            type="button"
            className={'jbtn ghost' + (paused ? ' on' : '')}
            style={{ padding: 12 }}
            onClick={onPause}
          >
            <Pause size={15} />{paused ? 'Продолжить' : 'Пауза'}
          </button>
        </div>
      )}

      {/* Партия доиграна: счёт держится на экране, пока судья его не
          подтвердит. Кнопка появляется только в этот момент. */}
      {ready && !done && (
        <button type="button" className="jbtn pri" style={{ padding: 13, flex: 'none' }} onClick={onKeep}>
          <Check size={15} />Подтвердить партию {sets.length + 1} · {pts[0]} : {pts[1]}
        </button>
      )}
    </>
  );
}

/** Партии берутся из того же состояния, что и ввод по очкам: закрытые — из
    `sets`, идущая — из текущего счёта. Отдельного списка тут нет намеренно: он
    разошёлся бы со счётом на соседней вкладке при первом же розыгрыше.

    ⚠ По Положению (TZ §6.1) «по партиям» — второй режим ввода, а не вид: в нём
    судья вводит итог партии и тоже подтверждает результат. Сейчас вкладка на
    просмотр — уточнить у федерации, остаётся ли режим. */
const BySets9_3 = ({ sets, pts }: { sets: [number, number][]; pts: [number, number] }) => (
  <div className="mktable mkcands mksets">
    <div className="mktable-h">
      <span>Партия</span>
      <span className="num">{PL[0].nm.split(' ')[0]}</span>
      <span className="num">{PL[1].nm.split(' ')[0]}</span>
      <span>Состояние</span>
    </div>
    <div className="mktable-b">
      {sets.map(([a, bb], i) => (
        <div className="mktable-r" key={i}>
          <span className="nm"><i>Партия {i + 1}</i></span>
          {/* Победитель партии выделен: по колонке сразу видно, кто как шёл. */}
          <span className={'num' + (a > bb ? ' tot' : '')}>{a}</span>
          <span className={'num' + (bb > a ? ' tot' : '')}>{bb}</span>
          <span className="mark"><P t="СЫГРАНА" cls="live" /></span>
        </div>
      ))}
      <div className="mktable-r">
        <span className="nm"><i>Партия {sets.length + 1}</i></span>
        <span className="num">{pts[0]}</span>
        <span className="num">{pts[1]}</span>
        <span className="mark"><P t="ИДЁТ" cls="wait" /></span>
      </div>
    </div>
  </div>
);

export function Score9_3({ tab }: { tab?: string }) {
  /* Счёт в идущей партии и закрытые партии. */
  const [pts, setPts] = useState<[number, number]>([8, 6]);
  const [sets, setSets] = useState<[number, number][]>([[11, 9], [9, 11]]);
  /* Что нажимали — для отмены последнего: отменяется именно последнее
     действие, а не «минус очко», ошибиться можно и стороной. */
  const [log, setLog] = useState<{ i: 0 | 1; closed?: [number, number] }[]>([]);
  const [swap, setSwap] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const off = paused || done;

  /* Партия сыграна на 11 очках с разрывом в два — но сама собой не
     закрывается: счёт остаётся на экране, пока судья его не подтвердит.
     Обнулять числа в момент одиннадцатого очка нельзя — за столом в этот
     момент как раз смотрят на счёт, спорят и сверяются, а он уже пропал. */
  const ready = (pts[0] >= 11 || pts[1] >= 11) && Math.abs(pts[0] - pts[1]) >= 2;

  const point = (i: 0 | 1) => {
    const next: [number, number] = [pts[0], pts[1]];
    next[i] += 1;
    setPts(next);
    setLog([...log, { i }]);
  };
  const keep = () => {
    setSets([...sets, pts]);
    setLog([...log, { i: 0, closed: pts }]);
    setPts([0, 0]);
  };
  const undo = () => {
    const last = log[log.length - 1];
    if (!last) return;
    if (last.closed) {
      setSets(sets.slice(0, -1));
      setPts(last.closed);
    } else {
      const back: [number, number] = [pts[0], pts[1]];
      back[last.i] -= 1;
      setPts(back);
    }
    setLog(log.slice(0, -1));
  };

  return (
    <RoleScreen role={R09} nav="Мой стол" title="Ввод счёта" sub="Стол 4 · Смагулов А. — Токаев М. · 1/8 финала">
      {/* Решения по матчу — над вкладками: подтверждение нужно ровно один раз,
          в конце матча, и внизу экрана оно уезжало за край.

          Состояния связи здесь нет: пока связь есть, сообщать нечего — работа
          без сети (TZ §6) показана отдельным кадром в полке состояний.

          Пока партия ждёт подтверждения, кнопки матча нет: зелёная в этот
          момент одна, и это подтверждение партии. Два одинаково главных
          «подтвердить» рядом судья за столом выбирает не глядя, а подтвердить
          матч с незакрытой партией нельзя. */}
      <ActionBar count="">
        <button type="button" className="dpickbtn" data-to="Э9.4">
          <History size={14} /> История матча
        </button>
        {!ready && (
          <button type="button" className="dsubmit" style={{ padding: '10px 14px' }} data-to="Э9.5" onClick={() => setDone(true)}>
            <Check size={15} /> Подтвердить результат
          </button>
        )}
      </ActionBar>

      {/* Два способа вести счёт — это два разных экрана под одной шапкой, а не
          украшение: по очкам режим включает главный судья соревнований. */}
      <Tabs
        active={tab}
        items={[
          {
            t: 'По очкам',
            view: (
              <ByPoints9_3
                pts={pts}
                sets={sets}
                swap={swap}
                paused={paused}
                off={off}
                done={done}
                ready={ready}
                onPoint={point}
                onUndo={undo}
                onSwap={() => setSwap(!swap)}
                onPause={() => setPaused(!paused)}
                onKeep={keep}
              />
            ),
          },
          { t: 'Партии', view: <BySets9_3 sets={sets} pts={pts} /> },
        ]}
      />

    </RoleScreen>
  );
}

/* ── Э9.4 · История матча ────────────────────────────────────────── */

export function Log9_4() {
  return (
    <RoleScreen
      role={R09}
      nav="Мой стол"
      title="История матча"
      sub="Стол 4 · Смагулов А. — Токаев М. · каждое действие с автором и временем"
      back={{ label: 'Ввод счёта', to: 'Э9.3' }}
    >
      {/* Подписи «Лента событий по времени» нет: экран так и называется
          историей матча, а лента — единственное, что на нём есть. Строка
          отзывается под курсором: её читают сверху вниз, и подсветка держит
          место. */}
      <div className="card" style={{ padding: '4px 15px' }}>
        <div className="list">
          {EVENTS.map((e) => (
            <div className="match hoverable" key={e.at + e.t}>
              <span
                className={e.tone === 'flat' ? 'badge' : 'badge ' + (e.tone === 'win' ? 'win' : 'loss')}
                style={
                  e.tone === 'flat'
                    ? { background: 'var(--c-panel-quiet)', color: 'var(--c-dim)' }
                    : undefined
                }
              >
                {e.tone === 'win' ? '+1' : e.tone === 'loss' ? '−1' : '·'}
              </span>
              {/* Второй строки под названием нет: событие названо целиком в
                  первой, а счёт после каждого розыгрыша пересказывал то, что и
                  так видно на экране ввода. */}
              <div className="who">
                <div className="nm">{e.t}</div>
              </div>
              <div className="dt">{e.at}</div>
            </div>
          ))}
        </div>
      </div>
    </RoleScreen>
  );
}

/* ── борд роли ───────────────────────────────────────────────────── */

const Tours9_1States = () => (
  <States>
    <Shot tone="info" title="Назначений нет" text="Пустое состояние со списком открытых приёмов.">
      <Empty title="Назначений нет" text="Открыт приём заявок на два турнира — можно подать заявку на судейство." />
    </Shot>

    <Shot
      tone="warning"
      title="Заявки на судейство или прямое назначение — не решено"
      text="⚠ 12.6: сохраняется ли конкурс заявок. От ответа зависит, есть ли на экране кнопка «Подать заявку»."
    >
      <Rows>
        <Row nm="Конкурс заявок" sub="наше допущение — судья подаёт заявку сам" pill={{ t: 'СЕЙЧАС ТАК', cls: 'reg' }} />
        <Row nm="Прямое назначение" sub="если так — кнопки подачи не будет" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

const Table9_2States = () => (
  <States>
    <Shot tone="info" title="Матча нет — «стол свободен»" text="Вызов придёт от главного судьи: расписание в его руках, судья стола его не ведёт.">
      <Empty title="Стол свободен" text="Пары на столе сейчас нет. Когда главный судья вызовет следующую, она появится здесь вместе с кнопкой старта." />
    </Shot>

    {/* Неявка ушла с главного экрана ✳: она бывает реже старта и не должна
        стоять рядом с ним — судья за столом жмёт «Старт» десятки раз за день, а
        неявку пару раз за турнир. */}
    <Shot
      tone="warning"
      title="Игрок не пришёл — вместо старта неявка ✳"
      text="Кнопка появляется, когда пару вызвали, а игрока нет: решение о технической победе принимает главный судья (Э6.6)."
    >
      <Rows>
        <Row nm="Токаев Марат" sub="вызван 14:20 · на столе не появился" pill={{ t: 'НЕ ЯВИЛСЯ', cls: 'bad' }} action="Отметить неявку" />
      </Rows>
      <Alert>
        Неявка судьи по поданной заявке — минус балл в его рейтинге (TZ §7.2); неявка игрока —
        решение главного судьи о технической победе, судья стола только отмечает факт.
      </Alert>
    </Shot>

    <Shot
      tone="info"
      title="На турнире включён режим по очкам"
      text="Об этом сказано в карточке матча заранее."
    >
      <Rows>
        <Row nm="Матч до 3 побед в партиях" sub="партия до 11 очков, разница 2" pill={{ t: 'ПО ОЧКАМ', cls: 'reg' }} />
      </Rows>
    </Shot>
  </States>
);

const Score9_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="Обрыв связи"
      text="Ввод продолжается локально, счётчик очереди растёт; после восстановления всё уходит на сервер."
    >
      <Rows>
        <Row nm="Связи нет" sub="ввод продолжается на планшете" val="7 событий в очереди" pill={{ t: 'ЛОКАЛЬНО', cls: 'wait' }} />
      </Rows>
      <Alert>Счёт вести можно: судья стола — источник правды по матчу.</Alert>
    </Shot>

    <Shot
      tone="info"
      title="Расхождение после синхронизации"
      text="Приоритет у судьи стола — он видит игру."
    >
      <Rows>
        <Row nm="На планшете" sub="11:9 · третья партия" pill={{ t: 'ПРИНЯТО', cls: 'live' }} />
        <Row nm="На сервере" sub="11:8 · пришло с другого устройства" pill={{ t: 'ОТКЛОНЕНО', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="warning" title="Подтверждение при обрыве" text="Результат уйдёт после синхронизации ✳.">
      <Rows>
        <Row nm="Результат матча подтверждён" sub="уйдёт на сервер, когда появится связь" pill={{ t: 'В ОЧЕРЕДИ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э9.5 · Результат отправлен ──────────────────────────────────── */

/** Что судья видит сразу после «Подтвердить результат».

    Отдельный экран, а не всплывающая полоска ✳: подтверждение результата —
    единственное необратимое действие судьи за столом (дальше правит только
    главный судья, TZ §6). Человеку нужно увидеть, что именно ушло и куда, — и
    увидеть это не полсекунды. Заодно экран отвечает на следующий вопрос: что
    теперь делать со столом.

    Код Э9.5 освободился: на нём стоял «мой рейтинг судьи», уехавший в кабинет
    (Э0.11). */
export function Sent9_5() {
  return (
    <RoleScreen
      role={R09}
      nav="Мой стол"
      title="Результат отправлен"
      sub="Стол 4 · Смагулов А. — Токаев М. · 1/8 финала"
    >
      <div className="card" style={{ padding: '26px 22px', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
        <span className="pill live" style={{ margin: 0 }}>
          <Check size={13} /> РЕЗУЛЬТАТ ПРИНЯТ
        </span>
        <div className="lvs" style={{ margin: 0 }}>
          <span className="setscore">4</span>
          <span className="vs">СМАГУЛОВ А. — ТОКАЕВ М.</span>
          <span className="setscore">2</span>
        </div>
        <div className="sets" style={{ justifyContent: 'center' }}>
          <span className="setchip"><b>11</b>–9</span>
          <span className="setchip">9–<b>11</b></span>
          <span className="setchip"><b>11</b>–7</span>
          <span className="setchip">8–<b>11</b></span>
          <span className="setchip"><b>11</b>–6</span>
          <span className="setchip"><b>11</b>–4</span>
        </div>
        <div className="dcount">
          Ушло главному судье и в базу · сетка продвинулась · 15:58, отправил Оралбай Е.
        </div>
      </div>

      {/* Что дальше — прямо здесь: судья за столом не должен искать, куда
          вернуться, между двумя матчами у него минуты. */}
      <ActionBar count="Следующая пара по расписанию — 16:20, вызов придёт от главного судьи">
        <button className="dpickbtn" data-to="Э9.4">
          <History size={14} /> История матча
        </button>
        <button className="dsubmit" style={{ padding: '10px 14px' }} data-to="Э9.2">
          <Radio size={15} /> К моему столу
        </button>
      </ActionBar>

      <Hint>
        Исправить счёт после подтверждения судья стола уже не может: правка идёт через главного
        судью, с лимитом времени и записью в журнал (TZ §6). Поэтому экран и показывает партии
        целиком — увидеть ошибку надо сейчас, а не после.
      </Hint>
    </RoleScreen>
  );
}

const Sent9_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Связи нет — результат в очереди ✳"
      text="Экран тот же, но сказано честно: результат уйдёт, когда появится сеть. Судья не ждёт у стола и не жмёт второй раз."
    >
      <Rows>
        <Row
          nm="Результат матча подтверждён"
          sub="4 : 2 · уйдёт на сервер, когда появится связь"
          pill={{ t: 'В ОЧЕРЕДИ', cls: 'wait' }}
        />
      </Rows>
    </Shot>

    <Shot
      tone="info"
      title="Стол свободен до следующего вызова"
      text="После отправки судья возвращается к столу: пары нет, пока главный судья не вызвал новую."
    >
      <Empty title="Стол свободен" text="Следующая пара по расписанию — 16:20. Вызов придёт от главного судьи." />
    </Shot>

    <Shot
      tone="danger"
      title="Ошиблись в счёте — правит главный судья"
      text="Подтверждение необратимо для судьи стола (TZ §6): дальше только через главного, с записью в журнал."
    >
      <Rows>
        <Row nm="Запросить правку" sub="уходит главному судье с указанием, что именно исправить" action="Запросить" />
      </Rows>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.7': {
    cap: 'Регистрация судьи',
    view: () => (
      <>
        <SignUpJudge0_7 />
        <SignUpJudge0_7States />
      </>
    ),
    next: 'вход под своей ролью',
  },
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э9.1': {
    cap: 'Мои турниры',
    view: () => (
      <>
        <Tours9_1 />
        <Tours9_1States />
      </>
    ),
    next: 'строка назначения',
  },
  'Э9.2': {
    cap: 'Мой стол',
    view: () => (
      <>
        <Table9_2 />
        <Table9_2States />
      </>
    ),
    next: 'принять вызов пары',
  },
  'Э9.3': {
    cap: 'Ввод счёта',
    view: () => (
      <>
        <Score9_3 />
        <Score9_3States />
      </>
    ),
    next: 'кнопка «история»',
  },
  'Э9.5': {
    cap: 'Результат отправлен',
    view: () => (
      <>
        <Sent9_5 />
        <Sent9_5States />
      </>
    ),
    next: 'лента событий матча',
  },
  'Э9.4': {
    cap: 'История матча',
    view: () => <Log9_4 />,
    next: 'кабинет судьи — заявки и рейтинг',
  },
};

export function Role09Board() {
  return <Board role={R09} screens={SCREENS} />;
}
