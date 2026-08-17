/* Роль 5 · Председатель ГСК — макеты по флоу.
   Экраны Э5.1–Э5.7 (см. `flows/05-predsedatel-gsk.md` и схему роли).

   Две мысли, которые макеты обязаны передать:
   1. роль утверждает, а не подменяет — сетку и расписание строит главный судья
      (TZ §4.6), председатель назначает судью и утверждает протокол;
   2. рейтинг судей считается по Положению (TZ §7.2): R = S1 + S2 + S3 + S4,
      коэффициент 1,5 за роль и за выезд, окно апелляций — 10 дней. */

import { useState, type ReactNode } from 'react';
import { ArrowUpDown, BadgeCheck, Ban, Check, Megaphone, Paperclip, Undo2, UserPlus, X } from 'lucide-react';
import {
  A, AW, ActionBar, Alert, Arrow, Attention, Board, Chips, Empty, Field, Form, Ghost, Hint, Input,
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

/* ── Э5.2 · Заявки судей на турнир ───────────────────────────────── */

/** Турниры, где приём заявок судей открыт. Их несколько одновременно — сезон
    идёт параллельно, — поэтому экран начинается с выбора турнира, а не привязан
    к одному: иначе к каждому пришлось бы возвращаться через очередь. */
const OPEN_TOURS = [
  { nm: 'Открытый турнир «Тараз Опен»', d: '16–17.08', till: '25.07', left: 'до старта 4 дня', n: 3, cls: 'bad' as Cls },
  { nm: 'Первенство РК до 19 лет', d: '24–27.08', till: '10.08', left: 'до старта 12 дней', n: 6, cls: 'wait' as Cls },
  { nm: 'Кубок Республики Казахстан 2026', d: '12–15.09', till: '25.08', left: 'до старта 31 день', n: 9, cls: 'reg' as Cls },
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
const COLS5: { k: 'nm' | 'cat' | 'reg' | 'r' | 'season'; t: string; num?: boolean }[] = [
  { k: 'nm', t: 'Судья' },
  { k: 'cat', t: 'Категория' },
  { k: 'reg', t: 'Регион' },
  { k: 'r', t: 'Рейтинг R', num: true },
  { k: 'season', t: 'Турниров', num: true },
];

/** Решение по заявке: 1 — назначен, −1 — отклонён, 0 — решения нет. */
type Verdict = Record<string, number>;

export function Applications5_2() {
  const [tour, setTour] = useState(OPEN_TOURS[0].nm);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS5)[number]['k']; up: boolean }>({ k: 'r', up: false });
  /* Решение хранится по судье: назначенный и отклонённый должны остаться в
     списке с пометкой, а не исчезнуть — иначе не видно, что уже разобрано. */
  const [v, setV] = useState<Verdict>({});
  const cur = OPEN_TOURS.find((t) => t.nm === tour)!;
  const set = (nm: string, n: number) => setV({ ...v, [nm]: v[nm] === n ? 0 : n });

  const pool = CANDS.slice(0, cur.n);
  const found = pool.filter((c) => {
    const t = q.trim().toLowerCase();
    return !t || c.nm.toLowerCase().includes(t) || c.reg.toLowerCase().includes(t) || c.cat.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const x = k === 'r' || k === 'season' ? a[k] - b[k] : String(a[k]).localeCompare(String(b[k]), 'ru');
    return sort.up ? x : -x;
  });
  const named = pool.filter((c) => v[c.nm] === 1).length;

  return (
    <RoleScreen
      role={R05}
      nav="Заявки судей"
      title="Заявки судей на турнир"
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

      {/* Плиток над таблицей нет: заявок в них было столько же, сколько строк
          ниже, а «решений принято» повторяло пометки в самих строках. Даты,
          срок приёма и решения ужаты в одну строку рядом с поиском — факты те
          же, блок в четверть экрана под них не нужен. Срочность турнира при
          этом остаётся цветной: за четыре дня до старта это главное на экране.

          «Журнала начислений судьи» здесь тоже нет: журнал относится к **одному
          судье**, а кнопка над таблицей не знает, к какому. Он живёт в рейтинге
          судей (Э5.5) — в карточке судьи, куда по флоу ведёт раскрытие строки
          (⚠ карточка по строке пока не нарисована). */}
      <div className="dactionbar">
        <Search value={q} placeholder="Фамилия, регион или категория" onChange={setQ} wide />
        <span className="dcount">
          {cur.d} · приём до {cur.till} ·{' '}
          <b className={cur.cls === 'bad' ? 'hot' : undefined}>{cur.left}</b>
          {' · решений '}<b>{named} из {cur.n}</b>
        </span>
      </div>

      <div className="mktable mkcands">
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
          <span />
        </div>
        <div className="mktable-b">
          {rows.map((c) => (
            <div
              className={'mktable-r' + (v[c.nm] === 1 ? ' yes' : v[c.nm] === -1 ? ' no' : '')}
              key={c.nm}
            >
              <span className="nm">
                <img src={c.av} alt="" />
                <i>{c.nm}<em>{c.last}</em></i>
              </span>
              <span>{c.cat}</span>
              <span>{c.reg}</span>
              <span className="num">{String(c.r).replace('.', ',')}</span>
              <span className="num">{c.season}</span>
              {/* Решение остаётся видимым: назначенный и отклонённый не исчезают
                  из списка, иначе не понять, что уже разобрано. */}
              <span className="vset">
                {v[c.nm] === 1 && <P t="НАЗНАЧЕН" cls="live" />}
                {v[c.nm] === -1 && <P t="ОТКЛОНЁН" cls="bad" />}
                <button
                  type="button"
                  className={'vbtn yes' + (v[c.nm] === 1 ? ' on' : '')}
                  title="Назначить главным судьёй"
                  onClick={() => set(c.nm, 1)}
                >
                  <Check size={15} />
                </button>
                <button
                  type="button"
                  className={'vbtn no' + (v[c.nm] === -1 ? ' on' : '')}
                  title="Отклонить заявку с причиной"
                  data-to="Э5.9"
                  onClick={() => set(c.nm, -1)}
                >
                  <X size={15} />
                </button>
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
    </RoleScreen>
  );
}

/* ── Э5.3 · Наряд судей: состав бригады, без столов ──────────────── */

type Duty = { av: string; role: string; who: string; pill: { t: string; cls: Cls } };

const DUTY: Duty[] = [
  { av: A(76), role: 'Главный судья', who: 'Оспанов Тимур · национальная категория · R 27,5 · Астана', pill: { t: 'НАЗНАЧЕН ПО ЗАЯВКЕ', cls: 'live' } },
  { av: AW(31), role: 'Главный секретарь', who: 'Ким Лариса · первая категория · R 14 · Караганда', pill: { t: 'В НАРЯДЕ', cls: 'live' } },
  { av: A(22), role: 'Заместитель главного судьи', who: 'Жумабеков Расул · судья по спорту · R 7 · Караганда', pill: { t: 'ПРАВА РОЛИ УТОЧНЯЮТСЯ', cls: 'wait' } },
  { av: A(13), role: 'Судья', who: 'Пак Сергей · первая категория · R 18 · Павлодар', pill: { t: 'ВЫЕЗД · К 1,5', cls: 'reg' } },
  { av: A(51), role: 'Судья', who: 'Токаев Марат · национальная категория · R 22,5 · Шымкент', pill: { t: 'ВЫЕЗД · К 1,5', cls: 'reg' } },
  { av: A(19), role: 'Судья', who: 'Цой Виктор · первая категория · R 9,5 · Караганда', pill: { t: 'СВОЙ РЕГИОН', cls: 'wait' } },
];

const DutyRow = ({ d }: { d: Duty }) => (
  <div className="drow">
    <img src={d.av} alt="" />
    <div className="who">
      <div className="nm">{d.role}</div>
      <div className="rl">{d.who}</div>
    </div>
    <P t={d.pill.t} cls={d.pill.cls} />
    <GhostPick>Убрать</GhostPick>
  </div>
);

export function Brigade5_3() {
  return (
    <RoleScreen
      role={R05}
      nav="Наряд"
      title="Наряд судей на турнир"
      sub="Кубок Республики Казахстан 2026 · Караганда · бригада 14 человек"
      back={{ label: 'Заявки судей', to: 'Э5.2' }}
    >
      <Chips
        items={[
          { v: '14', k: 'В наряде', tone: 'b' },
          { v: '4', k: 'Национальная категория' },
          { v: '1', k: 'Ждёт подтверждения', tone: 'a' },
          { v: '20', k: 'Столов в зале' },
        ]}
      />
      <ActionBar count="Роли наряда · показаны 6 из 14 человек бригады">
        <GhostPick>
          <UserPlus size={13} /> Добавить из реестра судей
        </GhostPick>
      </ActionBar>
      <Rows>
        {DUTY.map((d) => <DutyRow key={d.who} d={d} />)}
      </Rows>
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

const ResRow = ({ r }: { r: Res }) => (
  <div className="drow">
    <span className="rank">{r.pl}</span>
    <img src={r.av} alt="" />
    <div className="who">
      <div className="nm">{r.nm}</div>
      <div className="rl">{r.club}</div>
    </div>
    <div className="amt">{r.sc}</div>
    {r.pill && <P t={r.pill.t} cls={r.pill.cls} />}
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

export function Protocol5_4() {
  return (
    <RoleScreen
      role={R05}
      nav="Протоколы"
      title="Протокол на утверждении"
      sub="«Алатау Опен» 2026 · Алматы · сыгран 09.08.2026"
      back={{ label: 'Мои соревнования', to: 'Э5.1' }}
    >
      <div className="mkcols">
        <Panel title="Итоговый протокол" extra={<P t="ЖДЁТ 3 ДНЯ" cls="wait" />}>
          <ActionBar count="Сформировал Оспанов Т. · 10.08.2026, 19:40" />
          <div style={{ height: 10 }} />
          <Rows>
            {RESULTS.map((r) => <ResRow key={r.pl} r={r} />)}
          </Rows>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <button className="dsubmit ok"><Check size={15} />Утвердить протокол</button>
            <Ghost><Undo2 size={15} />Вернуть с причиной</Ghost>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э5.5 · Рейтинг судей: S1–S4, итог R и признак зачёта ────────── */

type JR = { pl: number; nm: string; cat: string; s1: string; s2: string; s3: string; s4: string; r: string; ok: boolean };

const RANK: JR[] = [
  { pl: 1, nm: 'Оспанов Тимур', cat: 'Национальная категория', s1: '16,5', s2: '4', s3: '5', s4: '2', r: '27,5', ok: true },
  { pl: 2, nm: 'Токаев Марат', cat: 'Национальная категория', s1: '13,5', s2: '4', s3: '3', s4: '2', r: '22,5', ok: true },
  { pl: 3, nm: 'Пак Сергей', cat: 'Первая категория', s1: '12', s2: '2', s3: '3', s4: '1', r: '18', ok: true },
  { pl: 4, nm: 'Ким Лариса', cat: 'Первая категория', s1: '9', s2: '2', s3: '3', s4: '0', r: '14', ok: true },
  { pl: 5, nm: 'Абдрахманова Сауле', cat: 'Первая категория', s1: '7,5', s2: '2', s3: '3', s4: '0', r: '12,5', ok: true },
  { pl: 6, nm: 'Цой Виктор', cat: 'Первая категория', s1: '7,5', s2: '2', s3: '0', s4: '0', r: '9,5', ok: false },
];

const RankRow = ({ j }: { j: JR }) => (
  <div className="drow" style={{ padding: '9px 11px' }}>
    <span className="rank">{j.pl}</span>
    <div className="who">
      <div className="nm" style={{ fontSize: 13 }}>{j.nm}</div>
      <div className="rl">{j.cat}</div>
    </div>
    <div className="rt" style={{ gap: 12 }}>
      <div><div className="v">{j.s1}</div><div className="k">S1</div></div>
      <div><div className="v">{j.s2}</div><div className="k">S2</div></div>
      <div><div className="v">{j.s3}</div><div className="k">S3</div></div>
      <div><div className="v">{j.s4}</div><div className="k">S4</div></div>
      <div><div className="v">{j.r}</div><div className="k">Итог R</div></div>
    </div>
    <P t={j.ok ? 'В ЗАЧЁТЕ' : 'БЕЗ ЗАЧЁТА'} cls={j.ok ? 'live' : 'bad'} />
  </div>
);

const LogRow = ({ what, when, pts }: { what: string; when: string; pts: string }) => (
  <div className="qitem">
    <div className="q">
      <div className="n">{what}</div>
      <div className="r">{when}</div>
    </div>
    <span style={{ fontSize: 13.5, fontWeight: 800 }}>{pts}</span>
  </div>
);

export function Rating5_5() {
  return (
    <RoleScreen
      role={R05}
      nav="Рейтинг судей"
      title="Рейтинг судей · сезон 2026"
    >
      <Chips
        items={[
          { v: '86', k: 'Судей в рейтинге', tone: 'b' },
          { v: '7', k: 'Документов на проверке', tone: 'a', to: 'Э5.6' },
          { v: '05.08', k: 'Последняя публикация', tone: 'g', to: 'Э5.7' },
          { v: '5', k: 'Без зачёта' },
        ]}
      />
      <div className="mkcols" style={{ gridTemplateColumns: '1.7fr 1fr' }}>
        <Panel title="Таблица рейтинга" extra={<GhostPick to="Э5.6">Документы на проверке · 7</GhostPick>}>
          <Rows>
            {RANK.map((j) => <RankRow key={j.pl} j={j} />)}
          </Rows>
        </Panel>

        <Panel title="Журнал начислений · Оспанов Тимур" extra={<P t="R 27,5 · №1" cls="reg" />}>
          <LogRow what="S1 · Чемпионат РК, главный судья" when="18.05.2026 · 3 × 1,5 · автоначисление" pts="+4,5" />
          <LogRow what="S1 · Кубок Караганды, выезд" when="12.04.2026 · 3 × 1,5 · автоначисление" pts="+4,5" />
          <LogRow what="S2 · национальная категория" when="01.01.2026 · опорный балл · автоначисление" pts="+4" />
          <LogRow what="S3 · офлайн-семинар Федерации" when="22.03.2026 · Алматы · принял Мукашев Б." pts="+3" />
          <LogRow what="S4 · работа в ГСК РК, 6 месяцев" when="01.07.2026 · принял Мукашев Б." pts="+2" />
          <div style={{ height: 12 }} />
        </Panel>
      </div>
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
    <RoleScreen role={R05} nav="Наряд" title="Наряд судей" sub="Кубок Республики Казахстан 2026 · 14 из 20">
      <Rows>
        <Row nm="Стол 1 · Мұқанов Талғат" sub="национальная категория" pill={{ t: 'В НАРЯДЕ', cls: 'live' }} />
        <Row nm="Стол 2 · Ибраев Қанат" sub="первая категория" pill={{ t: 'В НАРЯДЕ', cls: 'live' }} />
      </Rows>

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

export function Reject5_9() {
  return (
    <RoleScreen role={R05} nav="Заявки судей" title="Заявки судей на турнир" sub="Кубок Республики Казахстан 2026 · 9 заявок">
      <Rows>
        <Row av={A(76)} nm="Оспанов Тимур" sub="национальная категория · R 27,5" pill={{ t: 'ЗАЯВКА', cls: 'reg' }} />
        <Row av={A(64)} nm="Сериков Нурлан" sub="вторая категория · R 14,2" pill={{ t: 'ЗАЯВКА', cls: 'reg' }} />
      </Rows>

      <Modal
        title="Отклонить заявку с причиной"
        sub="Сериков Нурлан · заявка на судейство Кубка РК"
        foot={
          <>
            <div className="dcount">Причина уйдёт судье в уведомление и останется в журнале</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>Отклонить</button>
            </div>
          </>
        }
      >
        <Form>
          <Field label="Что отклоняется" value="Заявка на судейство · Сериков Н." wide />
          <Input label="Причина" value="на главный старт нужна первая или национальная категория" wide />
        </Form>
        <Alert>Приём заявок открыт до 18.04 — судья может подать снова, и это сказано в уведомлении.</Alert>
      </Modal>
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
    cap: 'Заявки судей',
    view: () => (
      <>
        <Applications5_2 />
        <Applications5_2States />
      </>
    ),
    next: 'назначен главный судья',
  },
  'Э5.3': {
    cap: 'Наряд судей',
    view: () => <Brigade5_3 />,
    next: 'турнир сыгран · вторая очередь',
  },
  'Э5.8': {
    cap: 'Выбор судьи в наряд',
    view: () => (
      <>
        <PickJudge5_8 />
        <PickJudge5_8States />
      </>
    ),
    next: 'протокол на утверждении',
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
