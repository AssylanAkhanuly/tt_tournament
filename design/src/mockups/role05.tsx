/* Роль 5 · Председатель ГСК — макеты по флоу.
   Экраны Э5.1–Э5.7 (см. `flows/05-predsedatel-gsk.md` и схему роли).

   Две мысли, которые макеты обязаны передать:
   1. роль утверждает, а не подменяет — сетку и расписание строит главный судья
      (TZ §4.6), председатель назначает судью и утверждает протокол;
   2. рейтинг судей считается по Положению (TZ §7.2): R = S1 + S2 + S3 + S4,
      коэффициент 1,5 за роль и за выезд, окно апелляций — 10 дней. */

import { useState, type ReactNode } from 'react';
import { ArrowUpDown, BadgeCheck, Ban, Check, Megaphone, Paperclip, Undo2, X } from 'lucide-react';
import {
  A, AW, ActionBar, Alert, Arrow, Attention, Board, Chips, Empty, Field, Filter, Form, Ghost, Hint, Input,
  Modal, Off, Panel, RoleScreen, Row, Rows, Screen, Search, Shot, States,
} from './shell';
import type { AttnItem } from './shell';
import type { DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { R05 } from './roles';
import { Login0_1 } from './role00';

/* ── мелочи, общие для экранов роли ─────────────────────────────── */

/** Второстепенное действие с переходом: та же тихая кнопка, что в каркасе. */
const GhostPick = ({ to, children }: { to?: string; children: ReactNode }) => (
  <button
    className="dpickbtn"
    data-to={to}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--c-panel-2)',
      color: 'var(--c-ink)',
      boxShadow: 'inset 0 1px 0 var(--c-glass-hi)',
    }}
  >
    {children}
  </button>
);

type Cls = 'live' | 'wait' | 'bad' | 'reg';
const P = ({ t, cls }: { t: string; cls: Cls }) => (
  <span className={'pill ' + cls} style={{ margin: 0 }}>{t}</span>
);

/* ── Э5.1 · Мои соревнования: очередь решений ──────────────────── */

/** Очередь председателя ГСК. Тот же компонент, что у администратора федерации:
    вопрос один — «что от меня ждут», — и двумя реализациями он бы разъехался.

    Разница в колонке решения: у администратора федерации половина очереди
    решается не им, и там написано, кого ждать. Здесь ждут **его самого**,
    поэтому в колонке — что именно решить. */
const ATTENTION5: AttnItem[] = [
  {
    n: '3',
    t: 'ждут назначения судьи',
    rows: [
      {
        nm: 'Открытый турнир «Тараз Опен»',
        mt: 'Тараз · 16–17.08',
        why: 'до старта 4 дня · подано 3 заявки судей',
        who: 'назначить главного судью',
        to: 'Э5.2',
        cls: 'bad',
      },
      {
        nm: 'Первенство РК до 19 лет',
        mt: 'Шымкент · 24–27.08',
        why: 'до старта 12 дней · подано 6 заявок судей',
        who: 'назначить главного судью',
        to: 'Э5.2',
      },
      {
        nm: 'Кубок Республики Казахстан 2026',
        mt: 'Караганда · 12–15.09',
        why: 'до старта 31 день · подано 9 заявок судей',
        who: 'назначить главного судью',
        to: 'Э5.2',
      },
    ],
  },
  {
    n: '2',
    t: 'ждут утверждения протокола',
    rows: [
      {
        nm: 'Первенство РК до 15 лет',
        mt: 'сыгран 02.08 · главный судья Токаев М.',
        why: 'ждёт 10 дней · до пересчёта рейтинга протокол должен быть закрыт',
        who: 'утвердить или вернуть с причиной',
        to: 'Э5.4',
        cls: 'bad',
      },
      {
        nm: '«Алатау Опен» 2026',
        mt: 'сыгран 09.08 · главный судья Оспанов Т.',
        why: 'ждёт 3 дня',
        who: 'утвердить или вернуть с причиной',
        to: 'Э5.4',
      },
    ],
  },
];

/** Остальные старты сезона — не очередь, а обзор: здесь ничего не ждёт решения,
    но отсюда открывают приём заявок судей и переносят турниры. */
export function Queues5_1({ variant }: { variant?: DeskVariant }) {
  /* «Открыть приём заявок судей» переводит турнир из черновика в приём: пока
     приём не открыт, судьи не подадут заявки, а без заявок некого назначать. */
  const [openIntake, setOpenIntake] = useState(false);
  return (
    <RoleScreen variant={variant} role={R05} nav="Мои соревнования" title="Мои соревнования">
      <Chips
        items={[
          { v: '8', k: 'Официальных стартов' },
          { v: '41', k: 'Заявок судей подано', tone: 'g' },
          { v: '12', k: 'Протоколов утверждено', tone: 'b' },
          { v: '86', k: 'Судей в рейтинге' },
        ]}
      />
      {/* Очередь заменила две панели, которые показывали те же списки: счётчик и
          панель под ним были одними и теми же делами дважды. */}
      <Attention items={ATTENTION5} />

      <Panel title="Остальные старты сезона">
        <Rows>
          <Row
            nm="Чемпионат Казахстана 2026"
            sub="Астана · 18–20.05 · протокол утверждён 24.05"
            pill={{ t: 'ЗАВЕРШЁН', cls: 'live' }}
          />
          <Row
            nm="Кубок вызова, 1-й тур"
            sub={openIntake ? 'Актобе · 03–05.10 · приём заявок судей открыт' : 'Актобе · 03–05.10 · приём заявок судей ещё не открыт'}
            pill={openIntake ? { t: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' } : { t: 'ЧЕРНОВИК', cls: 'done' }}
            action={openIntake ? 'Закрыть приём' : 'Открыть приём заявок судей'}
            onAction={() => setOpenIntake(!openIntake)}
          />
        </Rows>
      </Panel>
    </RoleScreen>
  );
}

/* ── Э5.2 · Судьи на турнир: заявки и наряд одним экраном ────────── */

/** Заявки и наряд были двумя экранами, а вопрос у председателя один: **кто
    судит этот турнир**. Заявки — вход, наряд — результат, и разводить их по
    разным пунктам меню значило заставлять ходить туда-сюда: посмотреть, кого не
    хватает, вернуться, назначить, снова посмотреть.

    Хуже того, состав наряда лежал отдельным списком и мог разойтись с тем, кого
    назначили в заявках, — та же беда, что мы уже ловили в календаре и реестрах.
    Теперь наряд **считается из решений** на этом же экране: разойтись нечему.

    Тем же приёмом собран наряд у администратора федерации (Э1.3): роль в строке
    заявки, а не отдельный экран. */

/** Турниры, где приём заявок судей открыт. Их несколько одновременно — сезон
    идёт параллельно, — поэтому экран начинается с выбора турнира, а не привязан
    к одному: иначе к каждому пришлось бы возвращаться через очередь.

    `crew` — сколько судей нужно в бригаду по числу столов: по нему видно, что
    заявок не хватает и придётся добирать из реестра. */
const OPEN_TOURS = [
  { nm: 'Открытый турнир «Тараз Опен»', d: '16–17.08', till: '25.07', left: 'до старта 4 дня', n: 3, crew: 4, cls: 'bad' as Cls },
  { nm: 'Первенство РК до 19 лет', d: '24–27.08', till: '10.08', left: 'до старта 12 дней', n: 6, crew: 6, cls: 'wait' as Cls },
  { nm: 'Кубок Республики Казахстан 2026', d: '12–15.09', till: '25.08', left: 'до старта 31 день', n: 9, crew: 10, cls: 'reg' as Cls },
];

type Cand = {
  av: string;
  nm: string;
  cat: string;
  reg: string;
  /** Рейтинг судьи R (§7.2) — по нему и сортируют по умолчанию. */
  r: number;
  place: number;
  season: number;
  last: string;
};

const CANDS: Cand[] = [
  { av: A(76), nm: 'Оспанов Тимур', cat: 'Национальная', reg: 'Астана', r: 27.5, place: 1, season: 6, last: 'Чемпионат РК, гл. судья' },
  { av: A(51), nm: 'Токаев Марат', cat: 'Национальная', reg: 'Шымкент', r: 22.5, place: 2, season: 5, last: 'Первенство до 19, гл. судья' },
  { av: A(13), nm: 'Пак Сергей', cat: 'Первая', reg: 'Павлодар', r: 18, place: 3, season: 5, last: '«Алатау Опен», судья' },
  { av: AW(31), nm: 'Ким Лариса', cat: 'Первая', reg: 'Караганда', r: 14, place: 4, season: 4, last: 'Кубок Караганды, секретарь' },
  { av: AW(65), nm: 'Абдрахманова Сауле', cat: 'Первая', reg: 'Караганда', r: 12.5, place: 5, season: 4, last: 'Первенство до 15, секретарь' },
  { av: A(19), nm: 'Цой Виктор', cat: 'Первая', reg: 'Караганда', r: 9.5, place: 6, season: 3, last: 'Кубок Караганды, судья' },
  { av: A(22), nm: 'Жумабеков Расул', cat: 'Судья по спорту', reg: 'Караганда', r: 7, place: 19, season: 2, last: 'Кубок Караганды, судья' },
  { av: AW(32), nm: 'Абдрахманова Айгерим', cat: 'Вторая', reg: 'Астана', r: 4, place: 61, season: 1, last: 'Кубок Алатау, судья' },
  { av: A(45), nm: 'Досжан Марат', cat: 'Вторая', reg: 'Алматы', r: 3.5, place: 68, season: 1, last: 'Клубная лига, судья' },
];

/** Колонки: по каким сортируют. Список судей ищут по фамилии и сравнивают по
    рейтингу — как состав участников у спортсмена (Э14.5), тем же приёмом. */
const COLS5: { k: 'nm' | 'cat' | 'reg' | 'r'; t: string; num?: boolean }[] = [
  { k: 'nm', t: 'Судья' },
  { k: 'cat', t: 'Категория' },
  { k: 'reg', t: 'Регион' },
  { k: 'r', t: 'Рейтинг R', num: true },
];

/** Места в наряде. Главный судья, секретарь и заместитель — по одному на
    турнир; судей столько, сколько столов. Распределение по столам делает
    главный судья на этапе системы проведения (Э6.5) — здесь только состав. */
const POSTS = [
  { k: 'chief' as const, t: 'Главный', full: 'Главный судья' },
  { k: 'sec' as const, t: 'Секретарь', full: 'Главный секретарь' },
  { k: 'dep' as const, t: 'Зам', full: 'Заместитель' },
  { k: 'judge' as const, t: 'Судья', full: 'Судьи' },
];

type Post = (typeof POSTS)[number]['k'];
/** Наряд одного турнира: три места по одному человеку, судей — сколько нужно.
    `out` — отклонённые заявки: они остаются на экране, но в наряд не входят. */
type Crew = { chief: string; sec: string; dep: string; judges: string[]; out: string[] };
const EMPTY: Crew = { chief: '', sec: '', dep: '', judges: [], out: [] };

export function Applications5_2() {
  const [tour, setTour] = useState(OPEN_TOURS[0].nm);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS5)[number]['k']; up: boolean }>({ k: 'r', up: false });
  /* Наряд хранится по турниру: турниров на экране несколько, состав у каждого
     свой, а люди в заявках повторяются — общим состоянием назначение на один
     турнир проступало бы и в остальных. */
  const [crews, setCrews] = useState<Record<string, Crew>>({});
  const cur = OPEN_TOURS.find((t) => t.nm === tour)!;
  const crew = crews[tour] ?? EMPTY;
  const put = (c: Crew) => setCrews({ ...crews, [tour]: c });

  /* Место в наряде у человека одно: главный судья не ведёт протокол за
     секретаря и не стоит на столе. Поэтому назначение снимает предыдущее место
     — и у того, кто его занимал, и у самого назначенного. Отклонённая заявка
     при назначении перестаёт быть отклонённой: решение поменяли. */
  const pick = (nm: string, post: Post) => {
    const free = {
      chief: crew.chief === nm ? '' : crew.chief,
      sec: crew.sec === nm ? '' : crew.sec,
      dep: crew.dep === nm ? '' : crew.dep,
      judges: crew.judges.filter((x) => x !== nm),
      out: crew.out.filter((x) => x !== nm),
    };
    if (post === 'judge') {
      return put(crew.judges.includes(nm) ? { ...free, out: crew.out } : { ...free, judges: [...free.judges, nm] });
    }
    put(crew[post] === nm ? { ...free, out: crew.out } : { ...free, [post]: nm });
  };
  const reject = (nm: string) =>
    put(
      crew.out.includes(nm)
        ? { ...crew, out: crew.out.filter((x) => x !== nm) }
        : {
          chief: crew.chief === nm ? '' : crew.chief,
          sec: crew.sec === nm ? '' : crew.sec,
          dep: crew.dep === nm ? '' : crew.dep,
          judges: crew.judges.filter((x) => x !== nm),
          out: [...crew.out, nm],
        },
    );
  const postOf = (nm: string): Post | '' =>
    crew.chief === nm ? 'chief' : crew.sec === nm ? 'sec' : crew.dep === nm ? 'dep' : crew.judges.includes(nm) ? 'judge' : '';

  const pool = CANDS.slice(0, cur.n);
  const found = pool.filter((c) => {
    const t = q.trim().toLowerCase();
    return !t || c.nm.toLowerCase().includes(t) || c.reg.toLowerCase().includes(t) || c.cat.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const x = k === 'r' ? a[k] - b[k] : String(a[k]).localeCompare(String(b[k]), 'ru');
    return sort.up ? x : -x;
  });

  return (
    <RoleScreen
      role={R05}
      nav="Судьи"
      title="Судьи на турнир"
      back={{ label: 'Мои соревнования', to: 'Э5.1' }}
    >
      {/* Турниров с открытым приёмом несколько сразу: выбор здесь, а не возврат
          в очередь за каждым. Срочный — первым, у него меньше всего времени. */}
      <div className="dstages big">
        {OPEN_TOURS.map((t) => (
          <button
            key={t.nm}
            type="button"
            className={'dstage' + (t.nm === tour ? ' now' : '')}
            onClick={() => setTour(t.nm)}
          >
            {t.nm} · {t.n}
          </button>
        ))}
      </div>

      {/* Наряд: не отдельный экран и не второй список, а итог решений внизу.
          Главный вопрос председателя — какие места ещё пустые, — читается
          отсюда, не открывая ничего. Пустое место так и написано «не назначен»:
          прочерк пришлось бы расшифровывать. */}
      <div className="mkduty">
        {POSTS.map((p) => {
          /* У судей место не одно, поэтому там не фамилия, а сколько набрано из
             скольких нужно по числу столов: «не назначен» о четырёх местах
             сразу ничего не говорит. */
          const many = p.k === 'judge';
          const who = many ? `${crew.judges.length} из ${cur.crew}` : crew[p.k];
          const free = many ? crew.judges.length === 0 : !who;
          return (
            <div className={'mkduty-i' + (free ? ' free' : '')} key={p.k}>
              <div className="k">{p.full}</div>
              <div className="v">{who || 'не назначен'}</div>
            </div>
          );
        })}
      </div>

      {/* Плиток над таблицей нет: заявок в них было столько же, сколько строк
          ниже, а «решений принято» повторяло пометки в самих строках. Даты,
          срок приёма и наряд ужаты в одну строку рядом с поиском — факты те же,
          блок в четверть экрана под них не нужен. Срочность турнира при этом
          остаётся цветной: за четыре дня до старта это главное на экране.

          «Журнала начислений судьи» здесь тоже нет: журнал относится к **одному
          судье**, а кнопка над таблицей не знает, к какому. Он живёт в рейтинге
          судей (Э5.5) — в карточке судьи, куда по флоу ведёт раскрытие строки
          (⚠ карточка по строке пока не нарисована). */}
      <div className="dactionbar">
        <Search value={q} placeholder="Фамилия, регион или категория" onChange={setQ} wide />
        {/* Только даты и срок приёма: сколько до старта видно из самих дат, а
            наряд стоит полосой выше — считать его ещё и здесь незачем. */}
        <span className="dcount">
          {cur.d} · приём до <b>{cur.till}</b>
        </span>
      </div>

      <div className="mktable mkcands mkcrew">
        <div className="mktable-h">
          {COLS5.map((c) => (
            <button
              key={c.k}
              type="button"
              className={(c.num ? 'num' : '') + (sort.k === c.k ? ' on' : '')}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : c.k === 'nm' })}
            >
              {c.t}
              {sort.k === c.k && <ArrowUpDown size={11} />}
            </button>
          ))}
          <span>Место в наряде</span>
        </div>
        <div className="mktable-b">
          {rows.map((c) => {
            const post = postOf(c.nm);
            const out = crew.out.includes(c.nm);
            return (
              <div className={'mktable-r' + (post ? ' yes' : out ? ' no' : '')} key={c.nm}>
                <span className="nm">
                  <img src={c.av} alt="" />
                  {/* Пока решения нет, под фамилией стоит последний турнир с
                      ролью — по нему и решают. Как только место дано, важнее
                      само решение, и строка говорит о нём. */}
                  <i>
                    {c.nm}
                    {post ? (
                      <em className="on">{POSTS.find((p) => p.k === post)!.full}</em>
                    ) : out ? (
                      <em className="off">Заявка отклонена</em>
                    ) : (
                      <em>{c.last}</em>
                    )}
                  </i>
                </span>
                <span>{c.cat}</span>
                <span>{c.reg}</span>
                <span className="num">{String(c.r).replace('.', ',')}</span>
                {/* Места кнопками в ряд, а не селектором: колонка читается
                    сверху вниз, и видно, кто на что поставлен, без вчитывания.
                    Селектор в каждой строке заставил бы открыть девять списков,
                    чтобы собрать один наряд. */}
                <span className="vset">
                  <span className="rchips">
                    {POSTS.map((p) => (
                      <button
                        key={p.k}
                        type="button"
                        className={'rchip' + (post === p.k ? ' on' : '')}
                        onClick={() => pick(c.nm, p.k)}
                      >
                        {p.t}
                      </button>
                    ))}
                  </span>
                  <button
                    type="button"
                    className={'vbtn no' + (out ? ' on' : '')}
                    title="Отклонить заявку с причиной"
                    data-to="Э5.9"
                    onClick={() => reject(c.nm)}
                  >
                    <X size={15} />
                  </button>
                </span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="dcount" style={{ padding: '14px 12px' }}>
              По запросу «{q}» никого нет — проверьте написание фамилии.
            </div>
          )}
        </div>
      </div>
    </RoleScreen>
  );
}

/* ── Э5.4 · Протокол на утверждении: зона сверки решает всё ──────── */

type Res = { pl: number; av: string; nm: string; club: string; sc: string; pill?: { t: string; cls: Cls } };

const RESULTS: Res[] = [
  { pl: 1, av: A(32), nm: 'Смагулов Алан', club: 'Алатау · Алматы', sc: 'финал 4:2' },
  { pl: 2, av: A(44), nm: 'Ким Георгий', club: 'СКА · Астана', sc: 'финал 2:4' },
  { pl: 3, av: A(13), nm: 'Пак Сергей', club: 'Иртыш · Павлодар', sc: '1/2 · 3:4' },
  { pl: 4, av: A(51), nm: 'Токаев Марат', club: 'Шымкент', sc: '1/2 · 1:4', pill: { t: 'ТЕХПОБЕДА В 1/4', cls: 'wait' } },
  { pl: 5, av: A(56), nm: 'Гладун Игорь', club: 'Тараз', sc: '1/4 · снят', pill: { t: 'НЕЯВКА', cls: 'bad' } },
];

/** Результаты — той же таблицей, что судьи на Э5.2: строки волосяной линией, а
    не каждая в своей рамке. Рамка вокруг каждой строки давала между фамилиями
    просвет в полтора интервала, и пять мест занимали пол-экрана — при том что
    протокол читают сверху вниз одним взглядом. */
const ResTable = ({ rows }: { rows: Res[] }) => (
  <div className="mktable mkcands mkres">
    <div className="mktable-h">
      <span>Место</span>
      <span>Спортсмен</span>
      <span className="num">Результат</span>
      <span />
    </div>
    <div className="mktable-b">
      {rows.map((r) => (
        <div className="mktable-r" key={r.pl}>
          <span className="rank">{r.pl}</span>
          <span className="nm">
            <img src={r.av} alt="" />
            <i>{r.nm}<em>{r.club}</em></i>
          </span>
          <span className="num">{r.sc}</span>
          <span className="mark">{r.pill && <P t={r.pill.t} cls={r.pill.cls} />}</span>
        </div>
      ))}
    </div>
  </div>
);

const Fix = ({ m, who }: { m: string; who: string }) => (
  <div className="qitem">
    <div className="q">
      <div className="n">{m}</div>
      <div className="r">{who}</div>
    </div>
  </div>
);

/** Решение по протоколу: `''` — ещё ждёт, `ok` — утверждён, `back` — возвращён
    на исправление. Решение видно в шапке протокола, а не только по кнопке: с
    этого места экран отвечает на другой вопрос. */
type PVerdict = '' | 'ok' | 'back';

export function Protocol5_4() {
  const [v, setV] = useState<PVerdict>('');
  /* Возврат идёт через тот же диалог отказа с причиной, что и отклонение заявки
     (Э5.9): причина обязательна, она уходит главному судье и в журнал. */
  const [ask, setAsk] = useState(false);
  const head: Record<PVerdict, { t: string; cls: Cls }> = {
    '': { t: 'ЖДЁТ 3 ДНЯ', cls: 'wait' },
    ok: { t: 'УТВЕРЖДЁН', cls: 'live' },
    back: { t: 'ВОЗВРАЩЁН НА ИСПРАВЛЕНИЕ', cls: 'bad' },
  };
  return (
    <RoleScreen
      role={R05}
      nav="Протоколы"
      title="Протокол на утверждении"
      back={{ label: 'Мои соревнования', to: 'Э5.1' }}
    >
      <div className="mkcols">
        <Panel title="Итоговый протокол" extra={<P t={head[v].t} cls={head[v].cls} />}>
          {/* Турнир, город и дата ушли из подписи под заголовком в шапку самого
              протокола: там они стоят рядом с тем, кто его сформировал и когда,
              — одной строкой вместо двух этажей над экраном. */}
          <ActionBar count="«Алатау Опен» 2026 · Алматы · сыгран 09.08 · сформировал Оспанов Т. 10.08 в 19:40" />
          <div style={{ height: 10 }} />
          <ResTable rows={RESULTS} />
        </Panel>

        <Panel title="Зона сверки" extra={<P t="3 ПРАВКИ СЧЁТА" cls="bad" />}>
          <div className="stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat b"><div className="v">63 / 64</div><div className="k">Матчей сыграно</div></div>
            <div className="stat"><div className="v">2</div><div className="k">Технические победы</div></div>
            <div className="stat r"><div className="v">3</div><div className="k">Правки счёта</div></div>
            <div className="stat"><div className="v">1</div><div className="k">Неявки</div></div>
          </div>

          <div className="qsec">Правки счёта — из журнала</div>
          <Fix m="1/8 · Ким Г. — Пак С. · 3:1 → 3:2" who="внёс Оспанов Т. · 09.08, 16:12" />
          <Fix m="1/4 · Токаев М. — Гладун И. · 4:0 → техпобеда" who="внёс Оспанов Т. · 09.08, 17:40" />
          <Fix m="1/16 · Цой В. — Сериков Н. · 3:0 → 3:1" who="внесла Ким Л. · 09.08, 11:05" />

          {/* Решение принято — кнопок больше нет, а не «серые»: утверждённый
              протокол завершает турнир и запускает пересчёт рейтинга, возвращать
              его уже некуда. Вместо кнопок — что именно произошло. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {v === '' && (
              <>
                <button type="button" className="dsubmit ok" onClick={() => setV('ok')}>
                  <Check size={15} />Утвердить протокол
                </button>
                <Ghost onClick={() => setAsk(true)}>
                  <Undo2 size={15} />Вернуть с причиной
                </Ghost>
              </>
            )}
            {v === 'ok' && (
              <Alert tone="success">
                Протокол утверждён: турнир → «Завершён», запущен пересчёт рейтинга, главному судье
                ушло уведомление. Отменить можно, пока пересчитанный рейтинг не опубликован
                (Э5.7): после публикации счёт правят апелляцией, а не отменой утверждения.
              </Alert>
            )}
            {v === 'back' && (
              <Alert tone="warning">
                Протокол возвращён: ввод результатов открыт снова, главный судья исправляет и
                отправляет повторно. В «Моих соревнованиях» строка помечена «на исправлении».
                Отменить возврат можно, пока судья не отправил протокол заново.
              </Alert>
            )}
            {/* Возврат решения ✳. Обе кнопки решают необратимо на вид — и это
                неправда: председатель ошибается тем же способом, что и все, а
                до публикации рейтинга откатить ещё можно. Кнопка тихая, не
                вровень с «Утвердить»: отмена решения — редкий шаг, и она не
                должна выглядеть как равный ему выбор. Каждая отмена идёт в
                журнал с автором и временем (§12). */}
            {v !== '' && (
              <Ghost onClick={() => setV('')}>
                <Undo2 size={15} />
                {v === 'ok' ? 'Отменить утверждение' : 'Отменить возврат'}
              </Ghost>
            )}
          </div>
        </Panel>
      </div>

      {ask && (
        <Modal
          title="Вернуть протокол с причиной"
          sub="«Алатау Опен» 2026 · главному судье Оспанову Т."
          onClose={() => setAsk(false)}
          to="Э5.4"
          foot={
            <>
              <div className="dcount">Причина уйдёт главному судье и останется в журнале</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Ghost onClick={() => setAsk(false)}>Закрыть</Ghost>
                <button
                  type="button"
                  className="dsubmit"
                  style={{ padding: '11px 16px' }}
                  onClick={() => { setV('back'); setAsk(false); }}
                >
                  Вернуть
                </button>
              </div>
            </>
          }
        >
          <Form>
            <Field label="Что возвращается" value="Итоговый протокол · «Алатау Опен» 2026" wide />
            <Input label="Причина" value="в 1/4 техпобеда без основания в журнале матча" wide />
          </Form>
          <Alert>Ввод результатов откроется снова — это сказано в уведомлении главному судье.</Alert>
        </Modal>
      )}
    </RoleScreen>
  );
}

/* ── Э5.5 · Рейтинг судей: S1–S4, итог R и признак зачёта ────────── */

/** Судья в рейтинге. S1–S4 — слагаемые по Положению (§7.2), R — их сумма;
    `ok` — признак зачёта: баллы не меньше чем в трёх категориях из четырёх и
    обязательно S1 и S2. */
type JR = {
  pl: number;
  av: string;
  nm: string;
  cat: string;
  s1: number; s2: number; s3: number; s4: number; r: number;
  ok: boolean;
};

const RANK: JR[] = [
  { pl: 1, av: A(76), nm: 'Оспанов Тимур', cat: 'Национальная категория', s1: 16.5, s2: 4, s3: 5, s4: 2, r: 27.5, ok: true },
  { pl: 2, av: A(51), nm: 'Токаев Марат', cat: 'Национальная категория', s1: 13.5, s2: 4, s3: 3, s4: 2, r: 22.5, ok: true },
  { pl: 3, av: A(13), nm: 'Пак Сергей', cat: 'Первая категория', s1: 12, s2: 2, s3: 3, s4: 1, r: 18, ok: true },
  { pl: 4, av: AW(31), nm: 'Ким Лариса', cat: 'Первая категория', s1: 9, s2: 2, s3: 3, s4: 0, r: 14, ok: true },
  { pl: 5, av: AW(65), nm: 'Абдрахманова Сауле', cat: 'Первая категория', s1: 7.5, s2: 2, s3: 3, s4: 0, r: 12.5, ok: true },
  { pl: 6, av: A(19), nm: 'Цой Виктор', cat: 'Первая категория', s1: 7.5, s2: 2, s3: 0, s4: 0, r: 9.5, ok: false },
  { pl: 7, av: A(22), nm: 'Жумабеков Расул', cat: 'Судья по спорту', s1: 5, s2: 2, s3: 0, s4: 0, r: 7, ok: false },
  { pl: 8, av: AW(32), nm: 'Абдрахманова Айгерим', cat: 'Вторая категория', s1: 4, s2: 0, s3: 0, s4: 0, r: 4, ok: false },
];

/** Колонки рейтинга: фамилия и итог R. Слагаемых S1–S4 в таблице нет — сюда
    приходят за местом в рейтинге, а из чего оно сложилось, разбирают в журнале
    по судье. Таблица отвечает «сколько», журнал — «почему». */
const COLS55: { k: 'nm' | 'r'; t: string; num?: boolean }[] = [
  { k: 'nm', t: 'Судья' },
  { k: 'r', t: 'Итог R', num: true },
];

/** Фильтр один — по зачёту. Он и есть рабочий вопрос председателя: кому рейтинг
    зачтётся, а у кого дыра в слагаемых. Категорию и регион ищут поиском. */
const F55 = ['Все судьи', 'В зачёте', 'Без зачёта'];

const num = (n: number) => String(n).replace('.', ',');

const LogRow = ({ what, when, pts }: { what: string; when: string; pts: string }) => (
  <div className="qitem">
    <div className="q">
      <div className="n">{what}</div>
      <div className="r">{when}</div>
    </div>
    <span style={{ fontSize: 13.5, fontWeight: 800 }}>{pts}</span>
  </div>
);

/** Журнал начислений одного судьи. Раньше он стоял второй колонкой и всегда
    показывал одного и того же человека — рядом с таблицей на восемьдесят шесть
    строк это читалось как «журнал вообще», а не «журнал Оспанова». Теперь он
    открывается по строке: чей журнал, видно из того, на кого нажали.

    В первой строке — сам турнир или документ: читают журнал, чтобы вспомнить
    «за что», а не «в какую графу». Слагаемое (S1…S4) стоит второй строкой, где
    и остальные подробности: дата, коэффициент, кто внёс. */
const JOURNAL = [
  { what: 'Чемпионат РК, главный судья', when: 'S1 · 18.05.2026 · 3 × 1,5 · автоначисление', pts: '+4,5' },
  { what: 'Кубок Караганды, выезд', when: 'S1 · 12.04.2026 · 3 × 1,5 · автоначисление', pts: '+4,5' },
  { what: 'Национальная категория', when: 'S2 · 01.01.2026 · опорный балл · автоначисление', pts: '+4' },
  { what: 'Офлайн-семинар Федерации', when: 'S3 · 22.03.2026 · Алматы · принял Мукашев Б.', pts: '+3' },
  { what: 'Работа в ГСК РК, 6 месяцев', when: 'S4 · 01.07.2026 · принял Мукашев Б.', pts: '+2' },
];

export function Rating5_5() {
  const [f, setF] = useState(F55[0]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS55)[number]['k']; up: boolean }>({ k: 'r', up: false });
  /* Чей журнал открыт. `null` — диалога нет. */
  const [open, setOpen] = useState<string | null>(null);
  const cur = RANK.find((j) => j.nm === open);

  const found = RANK.filter((j) => {
    const t = q.trim().toLowerCase();
    const byF = f === F55[0] || (f === F55[1]) === j.ok;
    return byF && (!t || j.nm.toLowerCase().includes(t) || j.cat.toLowerCase().includes(t));
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const x = k === 'nm' ? a.nm.localeCompare(b.nm, 'ru') : a.r - b.r;
    return sort.up ? x : -x;
  });

  return (
    <RoleScreen role={R05} nav="Рейтинг судей" title="Рейтинг судей · сезон 2026">
      {/* Фильтр сверху, поиск под ним: это два разных приёма — сначала сужают
          круг, потом ищут внутри, — и в одной строке они мешали друг другу.
          Счётчиков рядом нет: «сколько в рейтинге» и «сколько без зачёта»
          пересчитываются глазами по той же таблице, что стоит ниже. */}
      <Filter items={F55} active={f} onPick={setF} />
      <Search value={q} placeholder="Фамилия или категория" onChange={setQ} wide />

      <div className="mktable mkcands mkrank">
        <div className="mktable-h">
          {COLS55.map((c) => (
            <button
              key={c.k}
              type="button"
              className={(c.num ? 'num' : '') + (sort.k === c.k ? ' on' : '')}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : c.k === 'nm' })}
            >
              {c.t}
              {sort.k === c.k && <ArrowUpDown size={11} />}
            </button>
          ))}
          <span>Зачёт</span>
        </div>
        <div className="mktable-b">
          {rows.map((j) => (
            /* Строка открывает журнал начислений этого судьи: разбираться, из
               чего сложился рейтинг, ходят именно от фамилии. */
            <div
              className={'mktable-r' + (open === j.nm ? ' on' : '')}
              key={j.nm}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(j.nm)}
            >
              <span className="nm">
                <img src={j.av} alt="" />
                <i>{j.nm}<em>{j.cat} · №{j.pl}</em></i>
              </span>
              <span className="num tot">{num(j.r)}</span>
              <span className="mark">
                <P t={j.ok ? 'В ЗАЧЁТЕ' : 'БЕЗ ЗАЧЁТА'} cls={j.ok ? 'live' : 'bad'} />
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="dcount" style={{ padding: '14px 12px' }}>
              По запросу «{q}» никого нет — проверьте написание фамилии.
            </div>
          )}
        </div>
      </div>

      {cur && (
        <Modal
          title={`Журнал начислений · ${cur.nm}`}
          sub={`${cur.cat} · R ${num(cur.r)} · №${cur.pl} · сезон 2026`}
          onClose={() => setOpen(null)}
          to="Э5.5"
          foot={<Ghost onClick={() => setOpen(null)}>Закрыть</Ghost>}
        >
          {JOURNAL.map((l) => <LogRow key={l.what} {...l} />)}
          {!cur.ok && (
            <Alert>
              Без зачёта: баллы есть не менее чем в трёх категориях из четырёх — здесь пусто в S3 и
              S4, а они обязательны наравне с S1 и S2 (§7.2).
            </Alert>
          )}
        </Modal>
      )}
    </RoleScreen>
  );
}

/* ── Э5.6 · Документы на проверке: баллы подсказаны Положением ───── */

type Doc = { av: string; nm: string; what: string; pts: string; tag: string; cls: Cls; sel?: boolean };

const DOCS: Doc[] = [
  { av: A(13), nm: 'Пак Сергей', what: 'Офлайн-семинар Федерации, Алматы · подан 08.08.2026', pts: '+4,5', tag: 'S3', cls: 'reg', sel: true },
  { av: AW(31), nm: 'Ким Лариса', what: 'Онлайн-семинар ITTF · подан 07.08.2026', pts: '+1', tag: 'S3', cls: 'reg' },
  { av: A(51), nm: 'Токаев Марат', what: 'Работа в ГСК РК, 6 месяцев · подан 05.08.2026', pts: '+2', tag: 'S4', cls: 'reg' },
  { av: A(19), nm: 'Цой Виктор', what: 'Смена категории: первая → национальная · подан 02.08.2026', pts: 'S2 → 4', tag: 'КАТЕГОРИЯ', cls: 'live' },
  { av: A(22), nm: 'Жумабеков Расул', what: 'Благодарственное письмо · подан 27.06.2026', pts: '+1', tag: 'ПОЗЖЕ 10 ДНЕЙ', cls: 'wait' },
];

const DocRow = ({ d }: { d: Doc }) => (
  <div className={'drow' + (d.sel ? ' pick' : '')} style={{ padding: '9px 11px' }}>
    <img src={d.av} alt="" style={{ width: 30, height: 30 }} />
    <div className="who">
      <div className="nm" style={{ fontSize: 13 }}>{d.nm}</div>
      <div className="rl">{d.what}</div>
    </div>
    <div className="amt">{d.pts}</div>
    <P t={d.tag} cls={d.cls} />
  </div>
);

export function Docs5_6() {
  return (
    <RoleScreen
      role={R05}
      nav="Рейтинг судей"
      title="Документы на проверке · S3 и S4"
      back={{ label: 'Рейтинг судей', to: 'Э5.5' }}
    >
      <Chips
        items={[
          { v: '7', k: 'В очереди', tone: 'a' },
          { v: '3', k: 'Семинары и курсы (S3)' },
          { v: '2', k: 'Награды и коллегия (S4)' },
          { v: '2', k: 'Смена категории', tone: 'b' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Очередь документов" extra={<P t="7 ЖДУТ РЕШЕНИЯ" cls="wait" />}>
          <Rows>
            {DOCS.map((d) => <DocRow key={d.nm} d={d} />)}
          </Rows>
        </Panel>

        <Panel title="Документ · Пак Сергей" extra={<P t="S3 · СЕМИНАР" cls="reg" />}>
          <Form>
            <Field label="Тип" value="S3 · повышение квалификации" />
            <Field label="Дата подачи" value="08.08.2026 · в срок 10 дней" />
            <Field label="Мероприятие" value="Офлайн-семинар Федерации, Алматы" wide />
            <Field label="Балл по таблице 3" value="3" />
            <Field label="Коэффициент" value="1,5 — вне региона учёта" />
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={13} /> сертификат-семинар-05-08.pdf
            </div>
            <div className="dval">К начислению: 4,5 балла</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button className="dsubmit ok"><BadgeCheck size={15} />Принять с баллами</button>
            <Ghost><Ban size={15} />Отклонить с причиной</Ghost>
          </div>
          <div style={{ height: 12 }} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э5.7 · Публикация рейтинга и окно апелляций на 10 дней ──────── */

type App = { av: string; nm: string; what: string; when: string; pill?: { t: string; cls: Cls }; act?: boolean };

const APPEALS: App[] = [
  { av: A(13), nm: 'Пак Сергей', what: 'Коэффициент 1,5 за выезд · S1, Кубок Караганды', when: 'подана 06.08 · срок до 20.08', act: true },
  { av: A(22), nm: 'Жумабеков Расул', what: 'Отклонён документ S4 · благодарственное письмо', when: 'подана 07.08 · срок до 21.08', act: true },
  { av: A(19), nm: 'Цой Виктор', what: 'Начисление S1 за «Алатау Опен»', when: 'решение 09.08 · пересчёт внесён в журнал', pill: { t: 'УДОВЛЕТВОРЕНА', cls: 'live' } },
  { av: AW(31), nm: 'Ким Лариса', what: 'Место в рейтинге при равенстве баллов', when: 'решение 08.08 · решение окончательное', pill: { t: 'ОТКЛОНЕНА', cls: 'bad' } },
];

const AppRow = ({ a }: { a: App }) => (
  <div className="drow">
    <img src={a.av} alt="" />
    <div className="who">
      <div className="nm">{a.nm}</div>
      <div className="rl">{a.what} · {a.when}</div>
    </div>
    {a.pill && <P t={a.pill.t} cls={a.pill.cls} />}
    {a.act && <button className="dpickbtn">Удовлетворить</button>}
    {a.act && <GhostPick>Отклонить</GhostPick>}
  </div>
);

export function Publish5_7() {
  return (
    <RoleScreen
      role={R05}
      nav="Рейтинг судей"
      title="Публикация рейтинга и апелляции"
      sub="Опубликован 05.08.2026 · апелляции до 15.08"
    >
      <Chips
        items={[
          { v: '05.08', k: 'Рейтинг опубликован', tone: 'g' },
          { v: '15.08', k: 'Окно апелляций до', tone: 'a' },
          { v: '4', k: 'Апелляции' },
          { v: '2', k: 'Ждут решения', tone: 'b' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Апелляции" extra={<P t="2 ЖДУТ РЕШЕНИЯ" cls="wait" />}>
          <Rows>
            {APPEALS.map((a) => <AppRow key={a.nm} a={a} />)}
          </Rows>
        </Panel>

        <Panel title="Публикация рейтинга" extra={<P t="ОКНО ОТКРЫТО" cls="live" />}>
          <Form>
            <Field label="Последняя публикация" value="05.08.2026" />
            <Field label="Окно апелляций" value="10 дней · до 15.08.2026" />
            <Field label="Осталось" value="3 дня" />
            <Field label="Срок рассмотрения" value="10 рабочих дней" />
          </Form>
          <div style={{ marginTop: 14 }}>
            <button className="dsubmit" style={{ width: '100%' }}><Megaphone size={15} />Опубликовать рейтинг</button>
          </div>
          <div style={{ height: 12 }} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Борд роли: семь экранов маршрута подряд ─────────────────────── */

const Queues5_1States = () => (
  <States>
    <Shot tone="info" title="Обе очереди пустые" text="«Решений не ждёт ничего»." wide>
      <Empty title="Решений не ждёт ничего" text="Ни одного турнира без судьи и ни одного протокола на утверждении." />
    </Shot>
  </States>
);

const Applications5_2States = () => (
  <States>
    <Shot
      tone="warning"
      title="Заявок нет"
      text="⚠ Что делать в этом случае — не определено (QUESTIONS 3). Показываем пустую очередь и срок."
      wide
    >
      <Empty title="Заявок на судейство нет" text="Приём открыт до 18.04. Что делать, если заявок не будет вовсе, — вопрос к федерации." />
    </Shot>
  </States>
);

const Protocol5_4States = () => (
  <States>
    <Shot
      tone="warning"
      title="Протокол возвращён и ещё не переотправлен"
      text="Строка в Э5.1 с пометкой «на исправлении»."
      wide
    >
      <Rows>
        <Row nm="«Алатау Опен» 2026" sub="возвращён 12.08 · «нет второго номера пары»" pill={{ t: 'НА ИСПРАВЛЕНИИ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

const Docs5_6States = () => (
  <States>
    <Shot
      tone="warning"
      title="Документ подан позже 10 дней"
      text="⚠ Последствие пропуска срока в Положении не указано, уточняется у федерации."
      wide
    >
      <Rows>
        <Row nm="Оспанов Т. · семинар S3" sub="подан на 14-й день · срок подачи — 10 дней" pill={{ t: 'ПОЗЖЕ СРОКА', cls: 'bad' }} />
      </Rows>
      <Alert>Засчитывать или нет — решения нет: балл не проставляем, документ остаётся в очереди.</Alert>
    </Shot>
  </States>
);

const Publish5_7States = () => (
  <States>
    <Shot
      tone="info"
      title="Окно апелляций закрыто"
      text="Форма подачи у судей исчезает, поздние обращения не принимаются."
    >
      <Rows>
        <Row nm="Апелляции сезона 2026" sub="окно было открыто до 15.08" pill={{ t: 'ЗАКРЫТО', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot
      tone="success"
      title="Итоги года"
      text="Номинации Gold / Silver / Bronze (топ-10) на публичной странице рейтинга."
    >
      <Rows>
        <Row nm="Оспанов Тимур" sub="R 27,5 · 1 место" pill={{ t: 'GOLD', cls: 'live' }} />
        <Row nm="Токаев Марат" sub="R 24,1 · 2 место" pill={{ t: 'SILVER', cls: 'reg' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э5.8 · Выбор судьи в наряд ────────────────────────────────── */

/** Судья в списке выбора: по чему председатель решает — категория, рейтинг,
    занятость на эти же даты. */
const PICK = [
  { av: A(76), nm: 'Оспанов Тимур', sub: 'национальная категория · 42 турнира', r: 'R 27,5 · №1', busy: false },
  { av: A(51), nm: 'Токаев Марат', sub: 'национальная категория · 31 турнир', r: 'R 24,1 · №2', busy: false },
  { av: A(13), nm: 'Пак Сергей', sub: 'первая категория · 28 турниров', r: 'R 21,8 · №4', busy: true },
  { av: A(64), nm: 'Сериков Нурлан', sub: 'вторая категория · 12 турниров', r: 'R 14,2 · №9', busy: false },
];

export function PickJudge5_8() {
  return (
    <RoleScreen
      role={R05}
      nav="Судьи"
      title="Судьи на турнир"
      back={{ label: 'Мои соревнования', to: 'Э5.1' }}
    >
      {/* Позади диалога — тот же экран Э5.2: добор из реестра нужен ровно там,
          где видно, что место в наряде пустое. */}
      <div className="mkduty">
        <div className="mkduty-i"><div className="k">Главный судья</div><div className="v">Оспанов Тимур</div></div>
        <div className="mkduty-i"><div className="k">Главный секретарь</div><div className="v">Ким Лариса</div></div>
        <div className="mkduty-i free"><div className="k">Заместитель</div><div className="v">не назначен</div></div>
        <div className="mkduty-i"><div className="k">Судья</div><div className="v">7 из 10</div></div>
      </div>

      <Modal
        title="Добавить судью в наряд"
        sub="Кубок Республики Казахстан 2026 · 18–20 мая · Астана"
        foot={
          <>
            <div className="dcount">Вместе с добавлением выдаётся роль «судья» на этот турнир</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>Добавить</button>
            </div>
          </>
        }
      >
        <ActionBar count="214 судей в реестре · категория: любая · регион: все" />
        <Rows>
          {PICK.map((j) => (
            <Row
              key={j.nm}
              av={j.av}
              nm={j.nm}
              sub={j.busy ? j.sub + ' · занят 18–20 мая на «Кубке Иртыша»' : j.sub}
              val={j.r}
              pill={j.busy ? { t: 'ЗАНЯТ', cls: 'wait' } : undefined}
              action="Выбрать"
            />
          ))}
        </Rows>
      </Modal>
    </RoleScreen>
  );
}

const PickJudge5_8States = () => (
  <States>
    <Shot
      tone="warning"
      title="Судья занят на эти даты ✳"
      text="Строка помечена; добавить можно, но с предупреждением."
    >
      <Rows>
        <Row av={A(13)} nm="Пак Сергей" sub="в наряде «Кубка Иртыша», 18–20 мая" pill={{ t: 'ЗАНЯТ', cls: 'wait' }} action="Выбрать" />
      </Rows>
      <Alert>Два наряда на одни даты — решение председателя, система только показывает пересечение.</Alert>
    </Shot>

    <Shot tone="info" title="По фильтру никого нет" text="Пустой список с подсказкой снять фильтр.">
      <Empty title="Судей не нашлось" text="Фильтр: национальная категория · регион Актобе. Снимите один из фильтров." />
    </Shot>
  </States>
);

/* ── Э5.9 · Отказ с причиной ───────────────────────────────────── */

/** Позади диалога — очередь заявок **без решения**. Разобранная заявка из неё
    уходит: очередь отвечает на вопрос «что ещё не решено», и решённому делу в
    ней места нет. На самом экране судей (Э5.2) отклонённый, наоборот, остаётся
    со своей пометкой — там список другой, полный состав заявившихся. */
const WAITING = [
  { av: A(76), nm: 'Оспанов Тимур', sub: 'национальная категория · R 27,5' },
  { av: A(64), nm: 'Сериков Нурлан', sub: 'вторая категория · R 14,2' },
];

export function Reject5_9() {
  const [left, setLeft] = useState(WAITING);
  /* Кого отклоняем. `null` — диалог закрыт: тем же состоянием работают и
     крестик в шапке диалога, и «Закрыть» внизу. */
  const [who, setWho] = useState<string | null>('Сериков Нурлан');
  const cur = left.find((j) => j.nm === who);
  return (
    <RoleScreen
      role={R05}
      nav="Судьи"
      title="Заявки без решения"
      sub="Кубок Республики Казахстан 2026"
    >
      <Rows>
        {left.map((j) => (
          <Row
            key={j.nm}
            av={j.av}
            nm={j.nm}
            sub={j.sub}
            pill={{ t: 'ЗАЯВКА', cls: 'reg' }}
            action="Отклонить"
            onAction={() => setWho(j.nm)}
          />
        ))}
      </Rows>
      {left.length === 0 && (
        <Empty title="Решений не ждёт ничего" text="Все заявки на судейство этого турнира разобраны." />
      )}

      {cur && (
        <Modal
          title="Отклонить заявку с причиной"
          sub={`${cur.nm} · заявка на судейство Кубка РК`}
          onClose={() => setWho(null)}
          to="Э5.2"
          foot={
            <>
              <div className="dcount">Причина уйдёт судье в уведомление и останется в журнале</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Ghost onClick={() => setWho(null)}>Закрыть</Ghost>
                <button
                  type="button"
                  className="dsubmit"
                  style={{ padding: '11px 16px' }}
                  onClick={() => { setLeft(left.filter((j) => j.nm !== cur.nm)); setWho(null); }}
                >
                  Отклонить
                </button>
              </div>
            </>
          }
        >
          <Form>
            <Field label="Что отклоняется" value={`Заявка на судейство · ${cur.nm}`} wide />
            <Input label="Причина" value="на главный старт нужна первая или национальная категория" wide />
          </Form>
          <Alert>Приём заявок открыт до 18.04 — судья может подать снова, и это сказано в уведомлении.</Alert>
        </Modal>
      )}
    </RoleScreen>
  );
}

const Reject5_9States = () => (
  <States>
    <Shot tone="danger" title="Причина не заполнена" text="Кнопка неактивна, с пояснением.">
      <div className="dfield">
        <div className="k">Причина</div>
        <div className="dval" style={{ color: 'var(--c-danger)' }}>— не заполнена</div>
      </div>
      <Off>Отклонить</Off>
    </Shot>

    <Shot
      tone="warning"
      title="Приём заявок уже закрыт ✳"
      text="В тексте уведомления не обещаем «подайте снова»."
    >
      <Rows>
        <Row nm="Приём заявок судей" sub="закрыт 18.04.2026" pill={{ t: 'ЗАКРЫТ', cls: 'done' }} />
      </Rows>
      <Alert>Уведомление уходит без строки «можно подать снова»: приём уже не открыт.</Alert>
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
  'Э5.1': {
    cap: 'Мои соревнования',
    view: () => (
      <>
        <Queues5_1 />
        <Queues5_1States />
      </>
    ),
    next: 'очередь «ждут назначения»',
  },
  'Э5.2': {
    cap: 'Судьи на турнир',
    view: () => (
      <>
        <Applications5_2 />
        <Applications5_2States />
      </>
    ),
    next: '«Добавить из реестра»',
  },
  'Э5.8': {
    cap: 'Выбор судьи в наряд',
    view: () => (
      <>
        <PickJudge5_8 />
        <PickJudge5_8States />
      </>
    ),
    next: 'турнир сыгран · вторая очередь',
  },
  'Э5.4': {
    cap: 'Протокол на утверждении',
    view: () => (
      <>
        <Protocol5_4 />
        <Protocol5_4States />
      </>
    ),
    next: 'меню «Рейтинг судей»',
  },
  'Э5.5': {
    cap: 'Рейтинг судей',
    view: () => <Rating5_5 />,
    next: 'счётчик документов',
  },
  'Э5.6': {
    cap: 'Документы на проверке',
    view: () => (
      <>
        <Docs5_6 />
        <Docs5_6States />
      </>
    ),
    next: 'публикация рейтинга',
  },
  'Э5.7': {
    cap: 'Публикация и апелляции',
    view: () => (
      <>
        <Publish5_7 />
        <Publish5_7States />
      </>
    ),
  },
  'Э5.9': {
    cap: 'Отказ с причиной',
    view: () => (
      <>
        <Reject5_9 />
        <Reject5_9States />
      </>
    ),
  },
};

export function Role05Board() {
  return <Board role={R05} screens={SCREENS} />;
}
