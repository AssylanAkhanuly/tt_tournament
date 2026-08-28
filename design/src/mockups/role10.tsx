/* Роль 10 · Инспектор / супервайзер — макеты по флоу.
   Экраны Э10.1–Э10.4 (см. `flows/10-inspektor.md` и схему роли).

   Роль турниром НЕ управляет — смотрит со стороны, поэтому на макетах нет ни
   одной кнопки, меняющей турнир: нет «Вызвать пару», «Ввести счёт», «Исправить
   счёт», «Назначить судью». Там, где у главного судьи стоит кнопка вызова, у
   инспектора — серая подпись «вызывает главный судья», а панели хода турнира и
   журнала помечены пилюлей «ТОЛЬКО ПРОСМОТР». Единственные кнопки на экранах —
   про собственные материалы инспектора: отметить эпизод, выгрузить, отправить
   заключение. */

import { useState } from 'react';
import { Bookmark, Download, Eye, FileText, History, Paperclip, Send } from 'lucide-react';
import {
  ActionBar, Alert, Arrow, Board, Chips, Filter, Form, Hint, Panel, RoleScreen, Row, Rows, Screen, Shot, States,
} from './shell';
import { FormSeg } from '../segs';
import type { DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { R10 } from './roles';
import { Login0_1 } from './role00';

/* ── данные экранов ──────────────────────────────────────────────── */

type Cls = 'live' | 'wait' | 'bad' | 'reg';

const TOURS: { nm: string; sub: string; val: string; st: string; cls: Cls }[] = [
  {
    nm: 'Чемпионат Казахстана 2026',
    sub: 'г. Астана · 12–16 марта · турнир идёт · главный судья Оспанов Т.',
    val: 'заключения нет',
    st: 'НА КОНТРОЛЕ',
    cls: 'reg',
  },
  {
    nm: 'Кубок Казахстана 2026',
    sub: 'г. Алматы · 18–22 февраля · завершён · главный судья Мукашев Б.',
    val: 'черновик от 24.02',
    st: 'ЧЕРНОВИК',
    cls: 'wait',
  },
  {
    nm: 'Первенство РК до 19 лет',
    sub: 'г. Караганда · 27–30 января · завершён · главный судья Ким Л.',
    val: 'отправлено 03.02',
    st: 'ОТПРАВЛЕНО',
    cls: 'live',
  },
  {
    nm: 'Спартакиада школьников РК',
    sub: 'г. Шымкент · 9–12 апреля · приём заявок · главный судья не назначен',
    val: 'заключения нет',
    st: 'НА КОНТРОЛЕ',
    cls: 'reg',
  },
  {
    nm: 'Кубок Президента ФНТ РК',
    sub: 'г. Павлодар · 15–17 декабря 2025 · завершён · главный судья Оспанов Т.',
    val: 'отправлено 22.12',
    st: 'ОТПРАВЛЕНО',
    cls: 'live',
  },
];

type Note = { at: string; nm: string; sub: string; st: string; cls: Cls };

/* то, что нужно контролю: правки счёта с авторами, задержки, неявки, техпобеды */
const NOTES: Note[] = [
  {
    at: '14:52',
    nm: 'Стол 4 · 1/8 · Смагулов А. — Токаев М.',
    sub: 'партия 3: было 11 : 7 → стало 7 : 11 · исправил Оспанов Т. (главный судья)',
    st: 'ПРАВКА СЧЁТА',
    cls: 'bad',
  },
  {
    at: '14:31',
    nm: 'Стол 7 · 1/8 · Жумабеков Р. — Байжанов А.',
    sub: 'задержка 26 минут — пара вызвана, стол не освободился',
    st: 'ЗАДЕРЖКА',
    cls: 'wait',
  },
  {
    at: '13:58',
    nm: 'Стол 2 · 1/16 · Гладун И. — Мұрат Е.',
    sub: 'неявка Гладуна И. · присуждена техническая победа',
    st: 'НЕЯВКА',
    cls: 'bad',
  },
  {
    at: '13:20',
    nm: 'Стол 9 · 1/16 · Ким Г. — Оспанов Д.',
    sub: 'итог матча: было 3 : 1 → стало 3 : 2 · исправил Оспанов Т. (главный судья)',
    st: 'ПРАВКА СЧЁТА',
    cls: 'bad',
  },
];


/* полный журнал правок и спорных ситуаций по турниру */
const JOURNAL: Note[] = [
  ...NOTES,
  {
    at: '12:44',
    nm: 'Стол 4 · 1/16 · Ким Г. — Досжан М.',
    sub: 'судья стола заменён: Пак С. → Ким Л. · причина: смена судейской бригады',
    st: 'ЗАМЕНА СУДЬИ',
    cls: 'reg',
  },
  {
    at: '11:37',
    nm: 'Стол 11 · 1/16 · Тлеуова А. — Абаева Д.',
    sub: 'снятие Тлеуовой А. по травме · подтверждено врачом соревнований',
    st: 'СНЯТИЕ',
    cls: 'wait',
  },
  {
    at: '10:05',
    nm: 'Стол 6 · 1/32 · Досжан М. — Сериков Н.',
    sub: 'партия 2: было 9 : 11 → стало 11 : 9 · исправил Оспанов Т. · причина: обрыв связи планшета',
    st: 'ПРАВКА СЧЁТА',
    cls: 'bad',
  },
];

/* отмеченные инспектором эпизоды — материалы будущего заключения */
const EPISODES: { nm: string; sub: string }[] = [
  { nm: 'Стол 4, 14:52 — правка счёта после подтверждения', sub: 'отмечено 13.03, 15:04 · причина в журнале указана коротко' },
  { nm: 'Стол 7, 14:31 — задержка 26 минут', sub: 'отмечено 13.03, 14:58 · пара ждала свободного стола' },
  { nm: 'Стол 2, 13:58 — техническая победа без протокола неявки', sub: 'отмечено 13.03, 14:10 · проверить документ' },
  { nm: 'Стол 9, 13:20 — вторая правка итога матча за день', sub: 'отмечено 13.03, 13:35 · тот же автор правки' },
];

const FILES: { nm: string; sub: string }[] = [
  { nm: 'Протокол главной судейской коллегии.pdf', sub: '1,8 МБ · приложен 14.03.2026' },
  { nm: 'Снимок экрана спорного матча, стол 4.png', sub: '640 КБ · приложен 14.03.2026' },
  { nm: 'Наряд судей на 13 марта.pdf', sub: '320 КБ · приложен 14.03.2026' },
];

/* вместо кнопки действия — серая подпись: так видно, что это не инспектор */

/** Пилюля «только просмотр» в шапке панели — главный признак роли. */
const ReadOnly = () => (
  <span className="pill done" style={{ margin: 0 }}>
    <Eye size={11} /> ТОЛЬКО ПРОСМОТР
  </span>
);

/** Строка журнала: время, стол и матч, было → стало, кто исправил, причина. */
/** Строка события. Рабочая там, где по ней отмечают эпизод ✳: «Отметить
    эпизод» — единственное, что инспектор на этих экранах делает руками, и
    кнопка без выбранной строки не знает, что отмечать. Поэтому сначала строка,
    потом кнопка — тем же приёмом, что заявки у главного судьи (Э6.2). */
function NoteRow({ n, w, on, marked, onSelect }: {
  n: Note;
  w: number;
  on?: boolean;
  /** Уже отмечена эпизодом — попадёт в основания заключения. */
  marked?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div
      className={'drow' + (on ? ' pick' : '')}
      style={onSelect ? undefined : { cursor: 'default' }}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="rank" style={{ width: w }}>{n.at}</div>
      <div className="who">
        <div className="nm">{n.nm}</div>
        <div className="rl">{n.sub}</div>
      </div>
      {marked && (
        <span className="pill reg" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Bookmark size={12} /> ЭПИЗОД
        </span>
      )}
      <span className={'pill ' + n.cls} style={{ margin: 0 }}>{n.st}</span>
    </div>
  );
}

/** Тихая кнопка рядом с главной: та же, что `Ghost` в оболочке. Здесь своя,
    потому что этим кнопкам нужен ещё и переход (`data-to`). */
const QUIET = {
  background: 'var(--c-panel-2)',
  color: 'var(--c-ink)',
  boxShadow: 'inset 0 1px 0 var(--c-glass-hi)',
} as const;

/* ── Э10.1 · Соревнования на контроле ────────────────────────────── */

export function Tours10_1({ variant }: { variant?: DeskVariant }) {
  /* Выгрузка в макете не отдаёт файл, но и молчать ей нельзя: кнопка без
     ответа читается как сломанная. */
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <RoleScreen
      variant={variant}
      role={R10}
      nav="На контроле"
      title="Соревнования на контроле"
      sub="Сезон 2026 · назначения от председателя ГСК"
    >
      <Chips
        items={[
          { v: '5', k: 'На контроле', tone: 'b' },
          { v: '1', k: 'Черновик заключения', tone: 'a' },
          { v: '3', k: 'Отправлено', tone: 'g' },
          { v: '9', k: 'Отмечено эпизодов' },
        ]}
      />
      <ActionBar count={saved ?? '5 соревнований · сезон 2026 · всё только просмотр'}>
        <button
          type="button"
          className="dpickbtn"
          onClick={() => setSaved(`Выгружено ${TOURS.length} соревнований · сезон 2026 · CSV`)}
        >
          <Download size={14} /> Выгрузить список
        </button>
      </ActionBar>
      {/* Строка открывает турнир и приземляет на «Работу судей» — оттуда
          инспектор и начинает. Кнопка ведёт сразу в заключение: к нему
          возвращаются много раз, и каждый раз проходить через ход турнира
          незачем. */}
      <Rows>
        {TOURS.map((t) => (
          <Row to="Э10.2"
            key={t.nm}
            nm={t.nm}
            sub={t.sub}
            val={t.val}
            pill={{ t: t.st, cls: t.cls }}
            action="Заключение"
            actionTo="Э10.4"
          />
        ))}
      </Rows>
      <div style={{ marginTop: 12 }}>
        <Hint>
          Строка открывает старт: дальше он живёт разделами в меню слева — работа судей, журнал
          правок и заключение. «На контроле» возвращает к этому списку.
        </Hint>
      </div>
    </RoleScreen>
  );
}

/* Карта столов у инспектора — по судьям ✳ (замечание федерации, 09.2026).

   Раньше в клетке стоял счёт матча: экран был копией панели главного судьи.
   Инспектору счёт не решает ничего — он оценивает работу судьи, и в клетке
   должно стоять то, по чему эту работу видно: кто судит и что у него за день.
   Пустой стол и стол без судьи разведены: «судья не на месте» — это уже
   критерий 1 (TZ §7.3), а не свободный стол. */
type Duty = {
  /** Фамилия судьи; `null` — стол без судьи. */
  j: string | null;
  /** Правок счёта после подтверждения за день. */
  fix: number;
  /** Задержек «вызов → старт» дольше нормы. */
  late: number;
  /** Карточек, вынесенных на этом столе. */
  cards: number;
  /** Стол в игре. */
  busy: boolean;
};

const DUTY: Duty[] = [
  { j: 'Пак С.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Ерлан Б.', fix: 0, late: 1, cards: 1, busy: true },
  { j: 'Ахметов К.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Оралбай Е.', fix: 2, late: 0, cards: 0, busy: true },
  { j: 'Сейтқали А.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Абдрахманов Е.', fix: 0, late: 0, cards: 2, busy: true },
  { j: null, fix: 0, late: 1, cards: 0, busy: true },
  { j: 'Тұрсынов М.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Бектұров Р.', fix: 1, late: 0, cards: 0, busy: true },
  { j: 'Қалиев С.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Аманжол Н.', fix: 0, late: 0, cards: 0, busy: true },
  { j: 'Дәулет Ж.', fix: 0, late: 2, cards: 0, busy: true },
  { j: 'Жақсылық Б.', fix: 0, late: 0, cards: 1, busy: true },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
  { j: null, fix: 0, late: 0, cards: 0, busy: false },
];

/** Судья за день по тем критериям, которые система измеряет сама (TZ §7.3).
    Эти же цифры лягут в заключение рядом с оценкой — инспектор ставит ступень,
    глядя на число, а не вспоминая его. */
type JudgeDay = {
  nm: string;
  tables: string;
  /** Матчей отсужено за день. */
  m: number;
  /** Средняя задержка «вызов → старт», минут. */
  wait: number;
  /** Правок счёта после подтверждения. */
  fix: number;
  /** Расхождений при синхронизации. */
  sync: number;
  cards: number;
  /** Среднее время подтверждения результата, минут. */
  sign: number;
  /** Есть отмеченные инспектором эпизоды. */
  flag?: number;
};

const JUDGES: JudgeDay[] = [
  { nm: 'Оралбай Ержан', tables: 'столы 4, 9', m: 11, wait: 2, fix: 2, sync: 1, cards: 0, sign: 1, flag: 2 },
  { nm: 'Дәулет Жасұлан', tables: 'стол 13', m: 8, wait: 14, fix: 0, sync: 0, cards: 0, sign: 2, flag: 1 },
  { nm: 'Абдрахманов Ерлан', tables: 'стол 6', m: 9, wait: 3, fix: 0, sync: 0, cards: 2, sign: 1 },
  { nm: 'Пак Сергей', tables: 'стол 1', m: 10, wait: 2, fix: 0, sync: 0, cards: 0, sign: 1 },
  { nm: 'Бектұров Руслан', tables: 'стол 9', m: 7, wait: 4, fix: 1, sync: 0, cards: 0, sign: 3 },
];

/* ── Э10.2 · Работа судей на столах ──────────────────────────────── */

export function Live10_2() {
  /* Что выбрано для эпизода: строка судьи или замечание по технической части.
     Одна и та же кнопка отмечает и то, и другое — эпизод это «судья, стол,
     время», а не отдельный вид записи. */
  const [pick, setPick] = useState<{ k: string; label: string } | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  const key = (n: Note) => n.at + n.nm;
  const mark = () => {
    if (!pick || marked.includes(pick.k)) return;
    setMarked([...marked, pick.k]);
  };
  return (
    <RoleScreen
      role={R10}
      nav="Работа судей"
      title="Работа судей на столах"
      sub="Чемпионат Казахстана 2026 · г. Астана · день 2, 13 марта"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      {/* Счётчики про судейство, а не про игру ✳: сколько столов без судьи,
          сколько правок и задержек — это и есть предмет инспекции. */}
      {/* Куда отсюда идти, сказано на самом экране ✳: отметил эпизод — он лёг в
          основания, дальше либо разбирать журнал, либо ставить оценки. Раньше
          выхода с экрана не было вовсе: сайдбар из одного пункта подсвечивал
          «На контроле» и на ходе турнира, и в журнале, и в заключении. */}
      <ActionBar
        count={
          pick
            ? marked.includes(pick.k)
              ? `Отмечено эпизодом: ${pick.label}`
              : `Выбрано: ${pick.label} — «Отметить эпизод» положит это в основания заключения`
            : `13 судей · 1 стол без судьи · 4 правки · 4 задержки · отмечено эпизодов: ${marked.length}`
        }
      >
        <button className="dpickbtn" style={QUIET} data-to="Э10.3">
          <History size={14} /> Журнал правок
        </button>
        <button className="dpickbtn" style={QUIET} data-to="Э10.4">
          <FileText size={14} /> К заключению
        </button>
        {/* Акцент — на работе инспектора, а не на переходах: отметить эпизод он
            будет весь турнир, а перейти в раздел можно и меню слева. Без
            выбранной строки кнопка гаснет: отмечать нечего. */}
        {pick && !marked.includes(pick.k) ? (
          <button type="button" className="dsubmit" style={{ padding: '10px 14px' }} onClick={mark}>
            <Bookmark size={15} /> Отметить эпизод
          </button>
        ) : (
          <span className="dpickbtn" style={{ ...QUIET, opacity: .5 }}>
            <Bookmark size={15} /> Отметить эпизод
          </span>
        )}
      </ActionBar>

      <div className="dtables mkduty10">
        {DUTY.map((d, i) => (
          <div
            key={i}
            className={'dtable ' + (!d.busy ? 'free' : d.j ? 'busy' : 'nojudge')}
            style={{ cursor: 'default' }}
          >
            <div className="tn">Стол {i + 1}<span className="st" /></div>
            {/* В клетке судья, а не счёт: инспектор смотрит, кто судит. */}
            {d.j ? <div className="jn">{d.j}</div> : <div className="pl">{d.busy ? 'судьи нет' : 'свободен'}</div>}
            {d.j && (d.fix || d.late || d.cards) ? (
              <div className="jm">
                {d.fix > 0 && <span className="bad">правок {d.fix}</span>}
                {d.late > 0 && <span className="wait">задержек {d.late}</span>}
                {d.cards > 0 && <span className="crd">карточек {d.cards}</span>}
              </div>
            ) : (
              d.j && <div className="jm"><span>без замечаний</span></div>
            )}
          </div>
        ))}
      </div>

      <Panel
        title="Судьи на столах · день 2"
        extra={<span className="dcount">цифры, которые система измерила сама — критерии 1–5 и 7 (TZ §7.3)</span>}
      >
        <div className="mktable mkjday">
          <div className="mktable-h">
            <span>Судья</span>
            <span className="num">Матчей</span>
            <span className="num">Вызов → старт</span>
            <span className="num">Правок</span>
            <span className="num">Расхождений</span>
            <span className="num">Карточек</span>
            <span className="num">Подтверждение</span>
            <span>Эпизоды</span>
          </div>
          <div className="mktable-b">
            {JUDGES.map((j) => (
              <div
                className={'mktable-r' + (pick?.k === j.nm ? ' on' : '')}
                key={j.nm}
                role="button"
                tabIndex={0}
                onClick={() => setPick(pick?.k === j.nm ? null : { k: j.nm, label: `${j.nm} · ${j.tables}` })}
              >
                <span className="nm">
                  {j.nm}
                  <em>{j.tables}</em>
                </span>
                <span className="num">{j.m}</span>
                {/* Цифра красится сама, когда вышла за норму ✳: инспектор идёт
                    по таблице глазами, и «14 мин» среди двоек должно
                    останавливать взгляд без чтения. */}
                <span className={'num' + (j.wait >= 10 ? ' nope' : '')}>{j.wait} мин</span>
                <span className={'num' + (j.fix > 0 ? ' nope' : '')}>{j.fix}</span>
                <span className={'num' + (j.sync > 0 ? ' nope' : '')}>{j.sync}</span>
                <span className="num">{j.cards}</span>
                <span className={'num' + (j.sign >= 3 ? ' nope' : '')}>{j.sign} мин</span>
                <span className="mark">
                  {j.flag || marked.includes(j.nm) ? (
                    <span className="pill wait" style={{ margin: 0 }}>
                      {(j.flag ?? 0) + (marked.includes(j.nm) ? 1 : 0)} ОТМЕЧЕНО
                    </span>
                  ) : (
                    <span className="dcount">нет</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="dcount" style={{ marginTop: 10 }}>
          Работа с игроками, поведение в бригаде и внешний вид (критерии 6 и 8) система не измеряет —
          их инспектор проверяет глазами и ставит оценку в заключении
        </div>
      </Panel>

      {/* Счёт матча — только там, где к технической части есть вопрос ✳.
          Вне замечаний его на экране нет: кто как сыграл, инспектору не
          решает ничего. */}
      <Panel
        title="Замечания по технической части"
        extra={<span className="dcount">здесь счёт нужен — и показан</span>}
      >
        <Rows>
          {NOTES.map((n) => (
            <NoteRow
              key={key(n)}
              n={n}
              w={42}
              on={pick?.k === key(n)}
              marked={marked.includes(key(n))}
              onSelect={() => setPick(pick?.k === key(n) ? null : { k: key(n), label: n.nm })}
            />
          ))}
        </Rows>
      </Panel>
    </RoleScreen>
  );
}

/* ── Э10.3 · Журнал правок и спорных ситуаций ────────────────────── */

const KINDS10_3 = ['Все события', 'Правки счёта', 'Неявки', 'Задержки'];
const KIND_ST: Record<string, string> = {
  'Правки счёта': 'ПРАВКА СЧЁТА',
  Неявки: 'НЕЯВКА',
  Задержки: 'ЗАДЕРЖКА',
};

export function Journal10_3() {
  const [kind, setKind] = useState(KINDS10_3[0]);
  const rows = kind === KINDS10_3[0] ? JOURNAL : JOURNAL.filter((n) => n.st === KIND_ST[kind]);
  /* Что выбрано и что уже отмечено эпизодом. Ключ строки — время и матч:
     событие в журнале ими и опознаётся. */
  const [pick, setPick] = useState<string | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  /* Выгрузка в макете не отдаёт файл, но и молчать ей нельзя ✳: кнопка без
     ответа читается как сломанная. Отвечает строкой в полосе — сколько записей
     ушло и в каком срезе. */
  const [saved, setSaved] = useState<string | null>(null);
  const key = (n: Note) => n.at + n.nm;
  const mark = () => {
    if (!pick || marked.includes(pick)) return;
    setMarked([...marked, pick]);
  };
  return (
    <RoleScreen
      role={R10}
      nav="Журнал правок"
      title="Журнал правок и спорных ситуаций"
      sub="Чемпионат Казахстана 2026 · день 2, 13 марта · было → стало, кто исправил, причина"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      <ActionBar
        count={
          saved
            ? saved
            : pick
              ? marked.includes(pick)
                ? 'Строка уже отмечена эпизодом — она в основаниях заключения'
                : 'Строка выбрана — «Отметить эпизод» положит её в основания заключения'
              : `${rows.length} записей на экране · фильтр: ${kind.toLowerCase()} · отмечено эпизодов: ${marked.length}`
        }
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Фильтр рабочий: инспектор смотрит журнал по типу события — правки
              счёта и неявки разбираются по-разному. */}
          <Filter items={KINDS10_3} active={kind} onPick={setKind} />
          <button
            type="button"
            className="dpickbtn"
            style={QUIET}
            onClick={() => setSaved(`Выгружено ${rows.length} записей · срез «${kind.toLowerCase()}» · CSV`)}
          >
            <Download size={14} /> Выгрузить
          </button>
          <button className="dpickbtn" style={QUIET} data-to="Э10.4">
            <FileText size={14} /> К заключению
          </button>
          {/* Без выбранной строки кнопке нечего отмечать: она гаснет и говорит
              об этом в полосе, а не молчит в ответ на нажатие. */}
          {pick && !marked.includes(pick) ? (
            <button type="button" className="dsubmit" style={{ padding: '10px 14px' }} onClick={mark}>
              <Bookmark size={15} /> Отметить эпизод
            </button>
          ) : (
            <span className="dpickbtn" style={{ ...QUIET, opacity: .5 }}>
              <Bookmark size={15} /> Отметить эпизод
            </span>
          )}
        </div>
      </ActionBar>

      <Rows>
        {rows.map((n) => (
          <NoteRow
            key={key(n)}
            n={n}
            w={46}
            on={pick === key(n)}
            marked={marked.includes(key(n))}
            onSelect={() => { setPick(pick === key(n) ? null : key(n)); setSaved(null); }}
          />
        ))}
      </Rows>

      <div style={{ marginTop: 12 }}>
        <Hint>
          Отмеченный эпизод уходит в основания заключения (Э10.4): оценка ниже «соответствует»
          без основания не отправляется — TZ §7.3.
        </Hint>
      </div>
    </RoleScreen>
  );
}

/* Критерии оценки судьи — TZ §7.3 ✳ (замечание федерации, 09.2026: «нужно
   определить критерии и внести их»). Восемь пунктов; часть из них система
   измеряет сама и подставляет цифру, часть проверяется только глазами — и у
   них честно написано «только наблюдение», а не пустая клетка. */
const CRITERIA: { n: number; t: string; what: string; fact: string | null }[] = [
  { n: 1, t: 'Явка и работа по наряду', what: 'на своём столе по наряду, подмены согласованы', fact: 'столов без судьи: 1 · опозданий по вызову: 0' },
  { n: 2, t: 'Готовность стола к матчу', what: 'стол принят до вызова: инвентарь, сетка, счётчик', fact: 'вызов → старт: в среднем 2 мин' },
  { n: 3, t: 'Ведение счёта', what: 'счёт идёт вовремя, без расхождений и задним числом', fact: 'правок после подтверждения: 2 · расхождений: 1' },
  { n: 4, t: 'Соблюдение регламента матча', what: 'тайм-ауты, смена сторон, перерывы, время партий', fact: 'партий дольше регламента: 0' },
  { n: 5, t: 'Дисциплинарные решения', what: 'карточки вовремя и одинаково к обоим игрокам', fact: 'карточек: 0' },
  { n: 6, t: 'Работа с игроками и тренерами', what: 'корректность, разрешение споров, поведение при протесте', fact: null },
  { n: 7, t: 'Оформление результата', what: 'подтверждён вовремя, без запросов правки', fact: 'подтверждение: в среднем 1 мин · запросов правки: 1' },
  { n: 8, t: 'Внешний вид и субординация', what: 'форма, поведение в бригаде, работа с главным судьёй', fact: null },
];

type Grade = 'ok' | 'note' | 'bad';
const GRADES: { k: Grade; t: string }[] = [
  { k: 'ok', t: 'соответствует' },
  { k: 'note', t: 'замечание' },
  { k: 'bad', t: 'нарушение' },
];

/* ── Э10.4 · Заключение ──────────────────────────────────────────── */

export function Report10_4() {
  /* Оценки по критериям и основания под ними. Замечание без основания
     отправить нельзя (§7.3) — макет показывает оба случая сразу: у критерия 3
     основание есть, у седьмого его ещё нет. */
  const [grade, setGrade] = useState<Record<number, Grade>>({
    1: 'ok', 2: 'ok', 3: 'note', 4: 'ok', 5: 'ok', 6: 'ok', 7: 'note', 8: 'ok',
  });
  const basis: Record<number, string> = {
    3: 'эпизод: стол 4, 14:52 — правка счёта после подтверждения',
  };
  /* Итог считается из худшей оценки и руками не задаётся: иначе он разъедется
     с критериями, по которым и собран. */
  const worst: Grade = Object.values(grade).includes('bad')
    ? 'bad'
    : Object.values(grade).includes('note')
      ? 'note'
      : 'ok';
  const TOTAL: Record<Grade, { t: string; cls: 'live' | 'wait' | 'bad' }> = {
    ok: { t: 'БЕЗ ЗАМЕЧАНИЙ', cls: 'live' },
    note: { t: 'С ЗАМЕЧАНИЯМИ', cls: 'wait' },
    bad: { t: 'НАРУШЕНИЯ', cls: 'bad' },
  };
  /* Чего не хватает для отправки: замечание без основания. */
  const unbased = CRITERIA.filter((c) => grade[c.n] !== 'ok' && !basis[c.n]);

  return (
    <RoleScreen
      role={R10}
      nav="Заключение"
      title="Заключение по судье"
      sub="Чемпионат Казахстана 2026 · Оралбай Ержан · черновик от 14.03.2026"
      back={{ label: 'На контроле', to: 'Э10.1' }}
    >
      <div className="mkcols">
        <Panel title="Заключение" extra={<span className="pill wait" style={{ margin: 0 }}>ЧЕРНОВИК</span>}>
          {/* Заключение бывает двух видов: по соревнованию целиком и по
              конкретному судье — они уходят разным адресатам. */}
          <div style={{ marginBottom: 14 }}>
            <FormSeg items={['По соревнованию', 'По конкретному судье']} active="По конкретному судье" />
          </div>
          <Form>
            <div className="dfield">
              <div className="k">Соревнование</div>
              <div className="dval">Чемпионат Казахстана 2026</div>
            </div>
            <div className="dfield">
              <div className="k">Период проверки</div>
              <div className="dval">12–16 марта 2026</div>
            </div>
            <div className="dfield">
              <div className="k">Судья</div>
              <div className="dval">Оралбай Ержан · первая категория</div>
            </div>
            <div className="dfield">
              <div className="k">Столы</div>
              <div className="dval">4, 9 · 11 матчей</div>
            </div>
          </Form>
          <div style={{ marginTop: 12 }}>
            <Hint>
              Итог считается из худшей оценки и руками не задаётся: «с замечаниями» стоит потому,
              что замечание есть по критерию 3. На рейтинг судьи (TZ §7.2) заключение
              автоматически не влияет — что оно меняет, федерация не определила ⚠ 12.7.
            </Hint>
          </div>
        </Panel>

        <Panel title="Материалы" extra={<span className="pill reg" style={{ margin: 0 }}>4 ЭПИЗОДА · 3 ФАЙЛА</span>}>
          <div className="qsec">Отмеченные эпизоды из хода турнира</div>
          <Rows>
            {EPISODES.slice(0, 2).map((e) => (
              <div className="drow" key={e.nm} style={{ cursor: 'default' }}>
                <Bookmark size={16} />
                <div className="who">
                  <div className="nm">{e.nm}</div>
                  <div className="rl">{e.sub}</div>
                </div>
              </div>
            ))}
          </Rows>
          <div className="qsec">Приложенные файлы</div>
          <Rows>
            {FILES.slice(0, 2).map((f) => (
              <div className="drow" key={f.nm} style={{ cursor: 'default' }}>
                <FileText size={16} />
                <div className="who">
                  <div className="nm">{f.nm}</div>
                  <div className="rl">{f.sub}</div>
                </div>
                <Paperclip size={15} />
              </div>
            ))}
          </Rows>
        </Panel>
      </div>

      {/* Форма — сами критерии, а не свободный текст ✳. Рядом с каждым стоит
          то, что система измерила сама: инспектор ставит ступень, глядя на
          цифру, а не вспоминая её. */}
      <Panel
        title="Оценка по критериям · TZ §7.3"
        extra={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="dcount">итог из худшей оценки</span>
            <span className={'pill ' + TOTAL[worst].cls} style={{ margin: 0 }}>{TOTAL[worst].t}</span>
          </span>
        }
      >
        <div className="mktable mkcrit">
          <div className="mktable-h">
            <span>Критерий</span>
            <span>Что измерила система</span>
            <span>Оценка</span>
            <span>Основание</span>
          </div>
          <div className="mktable-b">
            {CRITERIA.map((c) => (
              <div className={'mktable-r' + (grade[c.n] !== 'ok' ? ' no' : '')} key={c.n}>
                <span className="nm">
                  {c.n}. {c.t}
                  <em>{c.what}</em>
                </span>
                {/* Четыре критерия система не измеряет — так и написано, а не
                    пустая клетка: пустота читается как «не посчиталось». */}
                <span className={c.fact ? 'fact' : 'fact off'}>{c.fact ?? 'только наблюдение'}</span>
                <span className="grade">
                  {GRADES.map((g) => (
                    <button
                      type="button"
                      key={g.k}
                      className={'gbtn ' + g.k + (grade[c.n] === g.k ? ' on' : '')}
                      onClick={() => setGrade({ ...grade, [c.n]: g.k })}
                    >
                      {g.t}
                    </button>
                  ))}
                </span>
                {/* Замечание и нарушение требуют основания: эпизод или
                    комментарий. Оценка без причины в споре не стоит ничего. */}
                <span className="basis">
                  {grade[c.n] === 'ok' ? (
                    <span className="dcount">—</span>
                  ) : basis[c.n] ? (
                    <span className="ok"><Bookmark size={13} />{basis[c.n]}</span>
                  ) : (
                    <span className="need">нужно основание — эпизод или комментарий</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dactionbar" style={{ marginTop: 12 }}>
          <div className="dcount">
            {unbased.length
              ? `Отправить нельзя: у ${unbased.length} ${unbased.length === 1 ? 'замечания' : 'замечаний'} нет основания (критерий ${unbased.map((c) => c.n).join(', ')})`
              : 'Все замечания обоснованы — заключение можно отправлять'}
          </div>
          {unbased.length ? (
            <span className="dpickbtn" style={{ opacity: .5 }}>
              <Send size={15} /> Отправить заключение
            </span>
          ) : (
            <button className="dsubmit">
              <Send size={15} /> Отправить заключение
            </button>
          )}
        </div>
      </Panel>
    </RoleScreen>
  );
}

/* ── борд роли ───────────────────────────────────────────────────── */

const Live10_2States = () => (
  <States>
    <Shot
      tone="danger"
      title="Только просмотр"
      text="Кнопок вызова пары и ввода счёта нет — инспектор турниром не управляет."
      wide
    >
      <Rows>
        <Row nm="Стол 4 · Смагулов — Ким" sub="2 : 1 · идёт" pill={{ t: 'ИДЁТ', cls: 'live' }} />
      </Rows>
      <Alert tone="danger">
        У главного судьи в этой строке «Вызвать» и «Править счёт». У инспектора их нет вовсе —
        он наблюдает и пишет заключение.
      </Alert>
    </Shot>
  </States>
);

const Report10_4States = () => (
  <States>
    <Shot tone="success" title="Отправленное заключение" text="Только чтение.">
      <Rows>
        <Row nm="Заключение по Кубку РК" sub="отправлено 21.05.2026, 18:40" pill={{ t: 'ОТПРАВЛЕНО', cls: 'live' }} />
      </Rows>
    </Shot>

    {/* Замечание без основания ✳ — состояние, в которое инспектор попадает
        чаще всего: оценку поставил, эпизод приложить забыл. */}
    <Shot
      tone="danger"
      title="Замечание без основания — отправить нельзя ✳"
      text="Оценка ниже «соответствует» требует эпизода или комментария (TZ §7.3): без причины она в споре не стоит ничего."
      wide
    >
      <Rows>
        <Row nm="Критерий 3 · ведение счёта" sub="замечание · эпизод: стол 4, 14:52 — правка после подтверждения" pill={{ t: 'ОБОСНОВАНО', cls: 'live' }} />
        <Row nm="Критерий 7 · оформление результата" sub="замечание · основания нет" pill={{ t: 'НУЖНО ОСНОВАНИЕ', cls: 'bad' }} />
      </Rows>
      <Alert tone="warning">
        Итог считается из худшей оценки и руками не задаётся: одно замечание делает заключение
        «с замечаниями», одно нарушение — «нарушения».
      </Alert>
    </Shot>

    {/* Перечень критериев — наш проект: в документах федерации его нет. */}
    <Shot
      tone="warning"
      title="Критерии ждут утверждения ✳"
      text="Восемь пунктов и три ступени внесены нами (TZ §7.3) — федерация их не присылала."
    >
      <Rows>
        <Row nm="Перечень и шкала" sub="утвердить или поправить · нужна ли балльная шкала вместо трёх ступеней" pill={{ t: 'ВОПРОС 15.2', cls: 'bad' }} />
        <Row nm="Вес критериев" sub="все равны или есть грубые нарушения, которые сами делают итог «нарушения»" pill={{ t: 'ВОПРОС 15.2', cls: 'bad' }} />
      </Rows>
    </Shot>

    <Shot
      tone="warning"
      title="Что меняет заключение — не определено"
      text="⚠ 12.7: кому уходит заключение и что оно меняет — рейтинг судьи, допуск, результат."
    >
      <Rows>
        <Row nm="Рейтинг судьи" sub="влияет ли заключение" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        <Row nm="Допуск к следующим турнирам" sub="влияет ли заключение" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э10.1': {
    cap: 'Соревнования на контроле',
    view: () => <Tours10_1 />,
    next: 'строка турнира',
  },
  'Э10.2': {
    cap: 'Ход турнира глазами инспектора',
    view: () => (
      <>
        <Live10_2 />
        <Live10_2States />
      </>
    ),
    next: 'вкладка «журнал правок»',
  },
  'Э10.3': {
    cap: 'Журнал правок и спорных ситуаций',
    view: () => <Journal10_3 />,
    next: 'эпизоды в заключение',
  },
  'Э10.4': {
    cap: 'Заключение',
    view: () => (
      <>
        <Report10_4 />
        <Report10_4States />
      </>
    ),
  },
};

export function Role10Board() {
  return <Board role={R10} screens={SCREENS} />;
}
