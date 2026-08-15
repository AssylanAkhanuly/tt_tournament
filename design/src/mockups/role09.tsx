/* Роль 9 · Судья — макеты по флоу.
   Экраны Э9.1–Э9.5 (см. `flows/09-sudya.md` и схему роли).

   Устройство роли — не десктоп, а ПЛАНШЕТ за столом (TZ §6), поэтому оболочка
   `RoleTablet`. Приёмы ведения счёта взяты из уже принятых экранов
   `TableJudgeFlow` / `RefereeResponsive`: крупный счёт, две половины по игроку,
   лента розыгрышей. Цвет — только токенами. */

import {
  Check, Clock, History, Pause, Radio, RefreshCw, Trophy, Undo2, Upload, UserX,
} from 'lucide-react';
import {
  A, Alert, Arrow, Board, Empty, Hint, RoleTablet, Row, Rows, Screen, Shot, States,
} from './shell';
import type { ScreenMap } from './shell';
import { R09 } from './roles';
import { Code0_1 } from './role00';

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

type Call = { t: string; sub: string; st: string; cls: Cls; btn?: string };

const CALLS: Call[] = [
  { t: 'Чемпионат РК среди ветеранов', sub: 'г. Тараз · 15–17 мая · приём до 28.04', st: 'НЕ ПОДАНА', cls: 'wait', btn: 'Подать заявку' },
  { t: 'Первенство РК до 15 лет', sub: 'г. Актобе · 21–24 мая · приём до 05.05', st: 'ПОДАНА 02.04', cls: 'reg' },
  { t: 'Кубок Президента ФНТ РК', sub: 'г. Астана · 4–7 июня · отказ: наряд уже собран', st: 'ОТКЛОНЕНА', cls: 'bad', btn: 'Подать снова' },
];

const QUEUE: [string, string, string][] = [
  ['14:20', 'Ким Георгий — Жумабеков Расул', '1/8 финала · до 4 побед в партиях'],
  ['15:00', 'Байжанов Арман — Мұрат Ерасыл', '1/8 финала · до 4 побед в партиях'],
  ['15:40', 'Гладун Игорь — Оспанов Дархан', '1/8 финала · до 4 побед в партиях'],
  ['16:20', 'Победитель стола 4 — победитель стола 7', '1/4 финала · пара определится по итогу'],
  ['17:00', 'Резерв стола', 'если матчи затянутся'],
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

/* ── Э9.1 · Мои турниры ──────────────────────────────────────────── */

export function Tours9_1() {
  return (
    <RoleTablet title="Судья · Оралбай Ержан" sub="Мои назначения и открытые приёмы заявок" badge="СЕЗОН 2026">
      <div className="sect">Мои назначения</div>
      {ASSIGN.map((a) => (
        <div className="item" key={a.t} style={{ marginTop: 0 }} data-to="Э9.2">
          <div className="ic"><Trophy size={17} /></div>
          <div className="tx">
            <div className="tt">{a.t}</div>
            <div className="ss">{a.sub}</div>
          </div>
          <span className={'pill ' + a.cls} style={{ margin: 0 }}>{a.st}</span>
        </div>
      ))}

      <div className="sect">Открыт приём заявок на судейство</div>
      {CALLS.map((c) => (
        <div className="item" key={c.t} style={{ marginTop: 0 }}>
          <div className="ic"><Clock size={17} /></div>
          <div className="tx">
            <div className="tt">{c.t}</div>
            <div className="ss">{c.sub}</div>
          </div>
          <span className={'pill ' + c.cls} style={{ margin: 0 }}>{c.st}</span>
          {c.btn && <button className="dpickbtn">{c.btn}</button>}
        </div>
      ))}
    </RoleTablet>
  );
}

/* ── Э9.2 · Мой стол ─────────────────────────────────────────────── */

export function Table9_2() {
  return (
    <RoleTablet title="Чемпионат Казахстана 2026" sub="Мой стол 4 · день 2 · 13 марта" badge="ИДЁТ">
      <div className="sect">Вызвана пара — главный судья ждёт готовности стола</div>
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

      <div style={{ display: 'flex', gap: 10 }}>
        <div className="jstart" style={{ flex: 2 }}><Radio size={16} />Принять вызов пары</div>
        <div className="jbtn ghost" style={{ flex: 1 }}><UserX size={16} />Отметить неявку</div>
      </div>

      <div className="sect">Очередь моего стола</div>
      <div className="card" style={{ padding: '4px 15px' }}>
        <div className="list">
          {QUEUE.map(([at, pair, round]) => (
            <div className="match" key={at}>
              <div className="who">
                <div className="nm">{pair}</div>
                <div className="mt">{round}</div>
              </div>
              <div className="dt">{at}</div>
            </div>
          ))}
        </div>
      </div>
    </RoleTablet>
  );
}

/* ── Э9.3 · Ввод счёта — главный экран роли ──────────────────────── */

/** Половина экрана = кнопка одного игрока: имя, подача, огромный счёт, партии. */
function Half({ av, nm, city, pts, sets, serve }: {
  av: string;
  nm: string;
  city: string;
  pts: string;
  sets: string;
  serve?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        borderColor: serve ? 'var(--c-accent-line-3)' : undefined,
        boxShadow: serve
          ? 'inset 0 1px 0 var(--c-glass-hi), 0 0 0 1px var(--c-accent-halo)'
          : undefined,
      }}
    >
      <img className="avatar sm" src={av} alt="" />
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.2px' }}>{nm}</div>
      <div style={{ fontSize: 11.5, color: 'var(--c-muted)' }}>{city}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '.08em',
          color: serve ? 'var(--c-success)' : 'var(--c-dim)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: serve ? 'var(--c-success)' : 'var(--c-dim)',
          }}
        />
        {serve ? 'ПОДАЧА' : 'ПРИЁМ'}
      </div>
      <div
        style={{
          fontSize: 122,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: '-6px',
          fontVariantNumeric: 'tabular-nums',
          color: serve ? 'var(--c-accent)' : 'var(--c-ink-bright)',
        }}
      >
        {pts}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--c-muted)', letterSpacing: '.06em' }}>
        ПАРТИИ {sets}
      </div>
      <div className="jstart" style={{ padding: 13, fontSize: 13.5 }}>+1 очко</div>
    </div>
  );
}

export function Score9_3() {
  return (
    <RoleTablet title="Стол 4 · ввод счёта" sub="Смагулов Алан — Токаев Марат · 1/8 финала · партия 4" badge="ИДЁТ">
      <div className="dactionbar">
        <div className="dseg2">
          <span className="on">По очкам</span>
          <span>По партиям</span>
        </div>
        <span className="pill live" style={{ margin: 0 }}>
          <span className="d" />СВЯЗЬ ЕСТЬ · 0 СОБЫТИЙ В ОЧЕРЕДИ
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 'none' }}>
        <Half av={A(32)} nm="Смагулов Алан" city="Алматы · «Алатау»" pts="8" sets="2" serve />
        <Half av={A(51)} nm="Токаев Марат" city="Астана · «Барыс»" pts="6" sets="1" />
      </div>

      <div className="lvs" style={{ flex: 'none' }}>
        <span className="setscore">2</span>
        <span className="vs">СЧЁТ ПО ПАРТИЯМ</span>
        <span className="setscore">1</span>
      </div>

      <div className="sets" style={{ flex: 'none' }}>
        <span className="setchip"><b>11</b>–9</span>
        <span className="setchip">9–<b>11</b></span>
        <span className="setchip"><b>11</b>–7</span>
        <span className="setchip">партия 4 · идёт</span>
      </div>

      <div style={{ display: 'flex', gap: 9, flex: 'none' }}>
        <div className="jbtn ghost" style={{ padding: 12 }}><Undo2 size={15} />Отменить последнее</div>
        <div className="jbtn ghost" style={{ padding: 12 }}><RefreshCw size={15} />Смена сторон</div>
        <div className="jbtn ghost" style={{ padding: 12 }}><Pause size={15} />Пауза</div>
      </div>

      <div style={{ display: 'flex', gap: 9, flex: 'none' }}>
        <div className="jbtn ghost" data-to="Э9.4" style={{ flex: 1, padding: 13 }}><History size={15} />История матча</div>
        <div className="jbtn pri" style={{ flex: 2, padding: 13 }}><Check size={15} />Подтвердить результат</div>
      </div>
    </RoleTablet>
  );
}

/* ── Э9.4 · История матча ────────────────────────────────────────── */

export function Log9_4() {
  return (
    <RoleTablet title="Стол 4 · история матча" sub="Смагулов Алан — Токаев Марат · 1/8 финала" badge="ИДЁТ">
      <div className="sect">Лента событий по времени</div>
      <div className="card" style={{ padding: '4px 15px' }}>
        <div className="list">
          {EVENTS.map((e) => (
            <div className="match" key={e.at + e.t}>
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
              <div className="who">
                <div className="nm">{e.t}</div>
                <div className="mt">{e.s}</div>
              </div>
              <div className="dt">{e.at}</div>
            </div>
          ))}
        </div>
      </div>
    </RoleTablet>
  );
}

/* ── Э9.5 · Мой рейтинг судьи ────────────────────────────────────── */

export function Rating9_5() {
  return (
    <RoleTablet title="Мой рейтинг судьи" sub="Сезон 2026 · R = S1 + S2 + S3 + S4 (§7.2)" badge="ОПУБЛИКОВАН">
      <div className="card pcard">
        <img className="avatar" src={A(39)} alt="" />
        <div className="who">
          <div className="nm">Оралбай Ержан</div>
          <div className="mt">Павлодар · судья национальной категории · рейтинг опубликован 06.04.2026</div>
        </div>
        <div className="rt" style={{ marginRight: 20 }}>
          <div className="k">Место</div>
          <div className="v">12</div>
        </div>
        <div className="rt">
          <div className="k">Рейтинг R</div>
          <div className="v">18,0</div>
        </div>
      </div>

      <div className="stats">
        <div className="stat b"><div className="v">7,5</div><div className="k">S1 · судейство</div></div>
        <div className="stat"><div className="v">4,0</div><div className="k">S2 · категория</div></div>
        <div className="stat"><div className="v">4,5</div><div className="k">S3 · квалификация</div></div>
        <div className="stat g"><div className="v">2,0</div><div className="k">S4 · иная работа</div></div>
      </div>

      <div className="sect">Журнал моих начислений</div>
      <div className="card" style={{ padding: '4px 15px' }}>
        <div className="list">
          {LEDGER.map(([at, s, t, sub, v]) => (
            <div className="match" key={at + s}>
              <span className="badge win">{s}</span>
              <div className="who">
                <div className="nm">{t}</div>
                <div className="mt">{sub}</div>
              </div>
              <div className="sc">{v}</div>
              <div className="dt">{at}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sect">Мои документы</div>
      {DOCS.map((d) => (
        <div className="item" key={d.t} style={{ marginTop: 0, padding: '10px 13px' }}>
          <div className="tx">
            <div className="tt">{d.t}</div>
            <div className="ss">{d.sub}</div>
          </div>
          <span className={'pill ' + d.cls} style={{ margin: 0 }}>{d.st}</span>
        </div>
      ))}

      <div className="sect">Апелляция · окно открыто до 16.04.2026 (10 дней с публикации)</div>
      <div className="card" style={{ padding: '12px 15px' }}>
        <div className="dactionbar">
          <div className="dcount">
            Апелляция от 09.04.2026 на коэффициент 1,5 — на рассмотрении, до 10 рабочих дней.
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="dpickbtn"><Upload size={14} /> Загрузить документ</button>
            <button className="dpickbtn">Подать апелляцию</button>
          </div>
        </div>
      </div>
    </RoleTablet>
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
    <Shot tone="info" title="Матча нет — «стол свободен»" text="Показываем очередь стола.">
      <Empty title="Стол свободен" text="Следующая пара — Ерлан Б. — Пак С., вызов придёт от главного судьи." />
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
      <Alert>Счёт вести можно: судья стола — источник правды по матчу (§12).</Alert>
    </Shot>

    <Shot
      tone="info"
      title="Расхождение после синхронизации"
      text="Приоритет у судьи стола — он видит игру (TZ §12)."
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

const Rating9_5States = () => (
  <States>
    <Shot tone="info" title="Окно апелляции закрыто" text="Формы нет, только история решений." wide>
      <Rows>
        <Row nm="Апелляции по сезону 2026" sub="окно было открыто до 15.08.2026" pill={{ t: 'ЗАКРЫТО', cls: 'done' }} />
      </Rows>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход по короткому коду',
    view: () => <Code0_1 />,
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
  'Э9.4': {
    cap: 'История матча',
    view: () => <Log9_4 />,
    next: 'пункт «Мой рейтинг»',
  },
  'Э9.5': {
    cap: 'Мой рейтинг судьи',
    view: () => (
      <>
        <Rating9_5 />
        <Rating9_5States />
      </>
    ),
  },
};

export function Role09Board() {
  return <Board role={R09} screens={SCREENS} />;
}
