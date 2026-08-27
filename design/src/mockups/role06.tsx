/* Роль 6 · Главный судья соревнований — макеты по флоу.
   Экраны Э6.1–Э6.7 (см. `flows/06-glavnyy-sudya.md` и схему роли).

   Роль ключевая, и маршрут у неё — это жизненный цикл турнира (§4.3). Поэтому
   значок состояния в шапке меняется от экрана к экрану: «Приём заявок игроков»
   → «Система проведения» → «Идёт» → «Итоговый протокол». Читать борд слева
   направо = смотреть, как турнир проходит свои состояния.

   Блоки, которые заместитель (роль 8) видит один в один, отсюда
   экспортируются: шкала состояний, строка «что требуется», карта столов,
   живые матчи и очередь пар. */

import { Fragment, useState, type ReactNode } from 'react';
import {
  Ban, Check, ChevronRight, ClipboardList, Grid3x3, Lock, Pencil, Printer, Radio, Shield, Shuffle, TriangleAlert, X,
} from 'lucide-react';
import {
  A, AW, ActionBar, Alert, Arrow, Board, Chips, Empty, Field, Filter, Form, Ghost, Hint, Input, Modal, Off, Panel, RoleScreen, Row, Rows, Screen, Shot, States, Submit, TabPanel, Tabs,
} from './shell';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { makeBigBracket } from '../bigBracket';
import type { DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { FormSeg } from '../segs';
import { R06 } from './roles';
/* Маршрут судейской роли начинается раньше входа: судья заводит себя сам
   (Э0.7), а роль в наряде ему выдают уже потом. Без этой колонки борд и карта
   начинались с «Вход», и откуда взялся человек, из них было не видно. */
import { Login0_1, SignUpJudge0_7, SignUpJudge0_7States } from './role00';

/* ── Люди турнира ───────────────────────────────────────────────── */

const P = {
  kim: A(44), tok: A(51), gla: A(56), bai: A(85), mur: A(93),
  dos: A(45), ahm: A(67), sar: A(23), sat: A(64), nur: A(53),
  tle: AW(21), ora: AW(65), osp: A(76),
  pak: A(13), erl: A(75),   // судьи столов
};

/** Значок состояния в шапке: на каждом экране турнир в своём состоянии (§4.3). */
const at = (badge: string) => ({ ...R06, badge });

/* ── Общее с ролью 8 (заместитель видит те же блоки) ────────────── */

/** Восемь состояний турнира: пройденные — галочкой, текущее — заливкой. */
const STAGES = [
  'Черновик', 'Приём заявок судей', 'Судья назначен', 'Приём заявок игроков',
  'Система проведения', 'Идёт', 'Итоговый протокол', 'Завершён',
];

export function Stages({ cur }: { cur: string }) {
  const now = STAGES.indexOf(cur);
  return (
    <div className="dseg2">
      {STAGES.map((s, i) => (
        <span
          key={s}
          className={i === now ? 'on' : undefined}
          style={i < now ? { color: 'var(--c-success)' } : undefined}
        >
          {i < now && <Check size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }} />}
          {s}
        </span>
      ))}
    </div>
  );
}

/** Строка зоны «что сейчас требуется»: ссылка на экран, который закрывает долг. */
export type Need = { ic: ReactNode; t: string; s: string; p: string; cls: 'live' | 'wait' | 'bad' | 'reg' };

export function NeedRow({ n, read }: { n: Need; read?: boolean }) {
  return (
    <div className="drow">
      <span
        style={{
          display: 'flex', width: 34, height: 34, flex: 'none', borderRadius: '50%',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--c-accent-soft)', color: 'var(--c-accent)',
        }}
      >
        {n.ic}
      </span>
      <div className="who"><div className="nm">{n.t}</div><div className="rl">{n.s}</div></div>
      <span className={'pill ' + n.cls} style={{ margin: 0 }}>{n.p}</span>
      {read ? (
        <span className="pill reg" style={{ margin: 0 }}><Lock size={10} /> ЧТЕНИЕ</span>
      ) : (
        <button className="dpickbtn">
          Открыть <ChevronRight size={12} style={{ display: 'inline-block', verticalAlign: '-2px' }} />
        </button>
      )}
    </div>
  );
}

/** Карта столов: счёт в реальном времени, свободные и заблокированные столы. */
const SCORES = ['2 : 1', '1 : 1', '0 : 2', '3 : 2', '1 : 0', '2 : 2', '0 : 1', '1 : 3', '2 : 0', '1 : 2', '3 : 1', '0 : 0'];
const BUSY = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14];

export function TableMap() {
  return (
    <div className="dtables">
      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
        /* стол без судьи матчи не принимает (§4.7); задержка старта — подсветкой */
        if (n === 7) {
          return (
            <div key={n} className="dtable free" style={{ borderColor: 'var(--c-danger-line)' }}>
              <div className="tn">Стол {n}<span className="st" /></div>
              <div className="pl" style={{ color: 'var(--c-danger)' }}>нет судьи</div>
            </div>
          );
        }
        if (n === 11) {
          return (
            <div key={n} className="dtable busy" style={{ borderColor: 'var(--c-warning)' }}>
              <div className="tn">Стол {n}<span className="st" /></div>
              <div className="pl" style={{ color: 'var(--c-warning)' }}>задержка 12 мин</div>
            </div>
          );
        }
        const b = BUSY.indexOf(n);
        return (
          <div key={n} className={'dtable ' + (b >= 0 ? 'busy' : 'free')}>
            <div className="tn">Стол {n}<span className="st" /></div>
            {b >= 0 ? <div className="sc">{SCORES[b]}</div> : <div className="pl">—</div>}
          </div>
        );
      })}
    </div>
  );
}

type Side = { av: string; nm: string; s: string };

function Live({ tbl, a, b }: { tbl: string; a: Side; b: Side }) {
  return (
    <div className="livem">
      <div className="top">
        <span className="tbl">{tbl}</span>
        <span className="liv"><span className="d" />ИДЁТ</span>
      </div>
      <div className="pr"><img src={a.av} alt="" /><span className="n">{a.nm}</span><span className="s">{a.s}</span></div>
      <div className="pr"><img src={b.av} alt="" /><span className="n">{b.nm}</span><span className="s">{b.s}</span></div>
    </div>
  );
}

/** Матчи, которые идут прямо сейчас: счёт по партиям обновляется сам. */
export function LiveCards() {
  return (
    <>
      <Live
        tbl="СТОЛ 3 · ЭФИР"
        a={{ av: P.kim, nm: 'Ким Г.', s: '2' }}
        b={{ av: P.tok, nm: 'Токаев М.', s: '1' }}
      />
      <Live
        tbl="СТОЛ 1 · идёт 24 мин"
        a={{ av: P.gla, nm: 'Гладун И.', s: '1' }}
        b={{ av: P.bai, nm: 'Байжанов А.', s: '1' }}
      />
    </>
  );
}

const QUEUE = [
  { a: P.mur, b: P.ahm, r: 'Мұрат Е. — Ахметов Д.', s: '1/16 · стол 7 · 13:20' },
  { a: P.sat, b: P.nur, r: 'Сәтбаев Е. — Нұрғали А.', s: '1/16 · стол 11 · 13:30' },
  { a: P.tle, b: P.ora, r: 'Тлеуова А. — Оралова М.', s: '1/16 · стол 12 · 13:40' },
];

/** Очередь ожидающих пар: кто играет следующим и куда его вызывать. */
export function QueuePanel() {
  return (
    <Panel title="Очередь пар" extra={<span className="pill wait" style={{ margin: 0 }}>8 ЖДУТ СТОЛА</span>}>
      <div className="qsec">Ожидают вызова</div>
      {QUEUE.map((q) => (
        <div className="qitem" key={q.r}>
          <span className="qav"><img src={q.a} alt="" /><img src={q.b} alt="" /></span>
          <div className="q"><div className="n">{q.r}</div><div className="r">{q.s}</div></div>
          <button className="callbtn">Вызвать</button>
        </div>
      ))}
    </Panel>
  );
}

/** Четыре авто-проверки допуска: у непроходящих — красная пометка. */
const CHECKS = ['возраст', 'ценз', 'взнос', 'документы'];

function Checks({ v }: { v: boolean[] }) {
  return (
    <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
      {CHECKS.map((k, i) => (
        <span
          key={k}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700,
            color: v[i] ? 'var(--c-success)' : 'var(--c-danger)',
          }}
        >
          {v[i] ? <Check size={12} /> : <X size={12} />}{k}
        </span>
      ))}
    </div>
  );
}

/** Игрок в заявке. `v` — четыре авто-проверки; `auto` — заявку отклонила
    система, не дожидаясь судьи, и почему.

    **Заявка разбирается автоматически** ✳ (комментарий федерации, 09.2026):
    взнос, документы и возраст — величины проверяемые, спорить в них не о чем.
    Если игрок по ним не проходит, система отклоняет заявку сама и **сразу
    говорит игроку причину**: «взнос не оплачен», «нет медицинского допуска»,
    «не проходите по возрасту». Раньше он ждал решения судьи, чтобы узнать то,
    что известно в момент подачи, — и часто узнавал уже после закрытия приёма,
    когда исправить было нечего.

    Судье остаётся то, что решается человеком: квота региона, спорный документ,
    заявка не по формату. */
type Ply = {
  av: string;
  nm: string;
  sub: string;
  v: boolean[];
  p: string;
  cls: 'live' | 'bad' | 'wait';
  /** Причина автоматического отказа: она же уходит игроку уведомлением. */
  auto?: string;
};

const SQUAD: Ply[] = [
  { av: P.kim, nm: 'Ким Георгий', sub: '2003 г.р. · «Алатау» · рейтинг 2401', v: [true, true, true, true], p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.tok, nm: 'Токаев Марат', sub: '2005 г.р. · «Алатау» · рейтинг 2350', v: [true, true, true, true], p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.ahm, nm: 'Ахметов Дархан', sub: '2006 г.р. · «Алатау» · рейтинг 2120', v: [true, true, true, true], p: 'ДОПУЩЕН', cls: 'live' },
  {
    av: P.tle, nm: 'Тлеуова Аружан', sub: '2011 г.р. · «Достык» · рейтинг 1720',
    v: [false, false, true, true], p: 'ОТКЛОНЕНА АВТОМАТИЧЕСКИ', cls: 'bad',
    auto: 'не проходите по возрасту: старт от 2008 г.р. и старше',
  },
  {
    av: P.bai, nm: 'Байжанов Асхат', sub: '2004 г.р. · «Алатау» · рейтинг 2180',
    v: [true, true, false, true], p: 'ОТКЛОНЕНА АВТОМАТИЧЕСКИ', cls: 'bad',
    auto: 'годовой взнос федерации не оплачен',
  },
  {
    av: P.mur, nm: 'Мұрат Ерлан', sub: '2006 г.р. · «Алатау» · рейтинг 2040',
    v: [true, true, true, false], p: 'ОТКЛОНЕНА АВТОМАТИЧЕСКИ', cls: 'bad',
    auto: 'нет действующего медицинского допуска',
  },
  {
    av: P.osp, nm: 'Оспанов Тимур', sub: '1979 г.р. · ветеран · рейтинг 2210',
    v: [true, true, true, true], p: 'ДОПУЩЕН · ВЕТЕРАН', cls: 'live',
  },
];

/** Возрастной ценз работает в одну сторону ✳ (комментарий федерации, 09.2026):
    **ветеран вправе играть в категории моложе себя, обратное запрещено**. Тот,
    кто младше нижней границы, не допускается никогда — ни автоматически, ни
    решением судьи.

    ⚠ Как это ложится на юношеские старты («до 19 лет»), где есть верхняя
    граница, федерация не сказала: ветеран под неё очевидно не подходит.
    Уточнить. */
const AGE_RULE =
  'Ветеран играет в категории моложе себя — это разрешено. Младше нижней границы не допускается никто.';

/* ── Э6.1 · Мой турнир ──────────────────────────────────────────── */

const NEEDS: Need[] = [
  {
    ic: <ClipboardList size={16} />, t: '8 заявок ждут решения',
    s: 'Э6.2 · приём открыт до 12.03, 18:00', p: 'СРОЧНО', cls: 'bad',
  },
  {
    ic: <TriangleAlert size={16} />, t: 'В 3 заявках игроки не проходят допуск',
    s: 'Э6.2 · возраст, годовой взнос, документы', p: 'ПРОВЕРИТЬ', cls: 'wait',
  },
  {
    ic: <Shield size={16} />, t: 'На 2 столах нет судьи',
    s: 'Э6.5 · матч не стартует, пока стол без судьи', p: 'ДО СТАРТА', cls: 'wait',
  },
  {
    ic: <Grid3x3 size={16} />, t: 'Сетку соберём после закрытия приёма',
    s: 'Э6.3 · строить сетку раньше состава нельзя', p: 'ПОЗЖЕ', cls: 'reg',
  },
];

export function Tournament6_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen
      variant={variant}
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Мой турнир"
      title="Чемпионат Казахстана 2026"
      sub="Главный республиканский старт · одиночный · г. Астана · 12–14 марта"
    >
      {/* Экран стал списком тех, кто подался ✳ (19.08.2026). До этого он был
          панелью: шкала из восьми состояний, пять плиток, очередь «что сейчас
          требуется» и условия допуска — четыре разных блока, и ни один не
          отвечал на главный вопрос судьи в приёме заявок: **кто подался**.
          Шкалу состояний убрали совсем: состояние написано в шапке турнира и
          повторять его рядом незачем. */}
      {/* Карточка соревнования ✳ (комментарий федерации, 09.2026): те же
          величины, что видит председатель ГСК (Э5.10), — размер старта, от
          которого зависит всё остальное. Раньше здесь стояли заявки, столы,
          судьи и срок приёма: три из пяти, и ни регионов, ни разрядов. */}
      <Chips
        items={[
          { v: '128 / 112', k: 'Заявок подано / принято', tone: 'b' },
          { v: '14', k: 'Регионов' },
          { v: '2', k: 'Разряда · одиночный, парный' },
          { v: '14', k: 'Судей в наряде' },
          { v: '20', k: 'Столов в зале' },
          { v: '12.03', k: 'Приём закрывается', tone: 'a' },
        ]}
      />

      <div className="dactionbar">
        <span className="dcount">
          Кто подался · <b>8</b> заявок ждут решения, в трёх игроки не проходят допуск
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Ghost>Условия допуска</Ghost>
          <button className="dsubmit" style={{ padding: '10px 14px' }} data-to="Э6.2">
            <ClipboardList size={15} /> Разобрать заявки
          </button>
        </div>
      </div>

      {/* Тот же состав и те же авто-проверки, что на экране заявок (Э6.2): один
          список, а не два — второй разъехался бы с первым на первом же решении.
          Здесь он на чтение, решают на Э6.2. */}
      <div className="plist">
        {SQUAD.map((p) => (
          <div className="plist-row" key={p.nm}>
            <img src={p.av} alt="" />
            <div className="who">
              <div className="nm">{p.nm}</div>
              <div className="rl">{p.sub}</div>
            </div>
            <Checks v={p.v} />
            <span className={'pill ' + p.cls} style={{ margin: 0 }}>{p.p}</span>
          </div>
        ))}
      </div>

      <div className="dactionbar" style={{ marginTop: 10 }}>
        <span className="dcount">
          Показаны последние 6 из 128 заявок · весь список с решениями — на «Заявках»
        </span>
      </div>
    </RoleScreen>
  );
}

/* ── Э6.2 · Заявки участников ───────────────────────────────────── */

const BIDS = [
  { nm: 'Сборная Алматы · 6 игроков', sub: 'Смагулов А. · 09.03, 11:20', who: 'РЕГИОН', on: true },
  { nm: 'Сборная Караганды · 7 игроков', sub: 'Ахметов К. · 09.03, 14:05', who: 'РЕГИОН' },
  { nm: 'Сборная Шымкента · 5 игроков', sub: 'Ержанов Д. · 10.03, 09:40', who: 'РЕГИОН' },
  { nm: 'Сборная Павлодара · 4 игрока', sub: 'Сейтқали А. · 10.03, 18:12', who: 'РЕГИОН' },
  { nm: 'Сборная Тараза · 3 игрока', sub: 'Бектұров Р. · 11.03, 08:30', who: 'РЕГИОН' },
];

/* Решённые заявки: вкладки «Приняты», «Отклонены» и «Отозваны» — то же
   соревнование, но заявки, по которым решение уже есть. Судье они нужны, чтобы
   свериться, кого он допустил и по какой причине отказал: причина отказа видна
   заявителю, и спорят потом именно о ней. */
const DECIDED: Record<string, { nm: string; sub: string; p: string; cls: 'live' | 'bad' | 'done' }[]> = {
  Приняты: [
    { nm: 'Сборная Астаны · 8 игроков', sub: 'Мукашев Б. · принята 08.03, 12:40', p: 'ПРИНЯТА', cls: 'live' },
    { nm: 'Сборная Актобе · 5 игроков', sub: 'Ержанов Д. · принята 08.03, 16:05', p: 'ПРИНЯТА', cls: 'live' },
    { nm: 'Сборная Костаная · 6 игроков', sub: 'Сейтқали А. · принята 09.03, 09:15', p: 'ПРИНЯТА', cls: 'live' },
  ],
  /* Отклонённые системой стоят отдельно от отклонённых судьёй ✳: это разные
     вещи, и разбираются они по-разному — по авто-отказу игрок доносит документ
     или платит взнос и подаёт заново, пока приём открыт; решение судьи
     оспаривают через федерацию. */
  'Отклонены системой': [
    { nm: 'Тлеуова Аружан · Достык', sub: 'не проходите по возрасту: старт от 2008 г.р. и старше · уведомлена 07.03, 10:12', p: 'ВОЗРАСТ', cls: 'bad' },
    { nm: 'Байжанов Асхат · Алатау', sub: 'годовой взнос федерации не оплачен · уведомлён 07.03, 10:12', p: 'ВЗНОС', cls: 'bad' },
    { nm: 'Мұрат Ерлан · Алатау', sub: 'нет действующего медицинского допуска · уведомлён 07.03, 10:12', p: 'ДОКУМЕНТЫ', cls: 'bad' },
  ],
  'Отклонены судьёй': [
    { nm: 'Сборная Тараза · 3 игрока', sub: 'причина: «состав подан после закрытия приёма» · 12.03', p: 'ОТКЛОНЕНА', cls: 'bad' },
  ],
  Отозваны: [
    { nm: 'Сборная Уральска · 5 игроков', sub: 'отозвал старший тренер региона · 10.03', p: 'ОТОЗВАНА', cls: 'done' },
  ],
};

const DecidedBids = ({ kind }: { kind: string }) => {
  const auto = kind === 'Отклонены системой';
  return (
    <Panel
      title={`${kind} · ${DECIDED[kind].length}`}
      extra={
        <span className="dcount">
          {auto ? 'игроки уведомлены в момент подачи' : 'решение уже принято, состав не меняется'}
        </span>
      }
    >
      <Rows>
        {DECIDED[kind].map((b) => (
          <Row key={b.nm} nm={b.nm} sub={b.sub} pill={{ t: b.p, cls: b.cls }} />
        ))}
      </Rows>
      {auto && (
        <div style={{ marginTop: 12 }}>
          <Hint>
            Судья этих заявок не разбирал: взнос, документы и возраст проверяются в момент подачи,
            и игрок узнаёт причину сразу, а не после закрытия приёма ✳. Пока приём открыт, он
            может донести документ и подать заново.
          </Hint>
        </div>
      )}
    </Panel>
  );
};

/** Вкладка «Ждут решения»: слева заявка, справа очередь остальных.

    Очередь стала рабочей ✳: строка выбирается, и слева открывается её состав.
    Раньше она была на чтение, а разбирать можно было только ту заявку, что
    открыли по умолчанию, — то есть очередь показывала работу, которую нельзя
    было делать. */
const BIDS_SQUADS: Record<string, Ply[]> = {
  'Сборная Алматы': SQUAD,
  'Сборная Караганды': [SQUAD[0], SQUAD[1], SQUAD[2], SQUAD[6]],
  'Сборная Шымкента': [SQUAD[0], SQUAD[2], SQUAD[4]],
  'Сборная Павлодара': [SQUAD[1], SQUAD[3]],
  'Сборная Тараза': [SQUAD[2], SQUAD[5]],
};

/** Склонение по числу: «1 игрок», «2 игрока», «5 игроков». Строка с числом
    попадается в каждой второй сводке, и «без 1 игроков» выдаёт макет за
    заглушку. */
const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

const Waiting6_2 = () => {
  const [cur, setCur] = useState(BIDS[0].nm);
  /* Решения по заявкам: имя заявки → что с ней. Разобранная не исчезает из
     очереди, а получает пометку — иначе не видно, что уже сделано. */
  const [done, setDone] = useState<Record<string, 'ok' | 'no'>>({});
  /* Кого из состава выбрали. Строка игрока открывает его: по одному человеку и
     решают, кого исключить, — заявка целиком принимается или отклоняется, но
     спорный игрок в ней обычно один. */
  const [pick, setPick] = useState<string | null>(null);
  /* Исключённые из состава: заявку принимают без них. */
  const [out, setOut] = useState<string[]>([]);

  const bid = BIDS.find((b) => b.nm === cur)!;
  const squad = BIDS_SQUADS[bid.nm.split(' · ')[0]] ?? SQUAD;
  const verdict = done[cur];
  const one = squad.find((x) => x.nm === pick);

  return (
    <div className="dcols">
      <Panel
        /* Заголовок короткий ✳: раньше он не помещался в строку и разъезжался
           на два ряда — название заявки слева, «регион · тренер» справа. Кто
           подал, ушло подписью под названием: это уточнение, а не заголовок. */
        title={bid.nm}
        body={`${bid.who.toLowerCase() === 'регион' ? 'Заявка региона' : bid.who} · подал ${bid.sub}`}
        extra={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {/* Исключённые — пометкой в шапке ✳: серой строкой у кнопок это
                терялось, а она меняет то, что произойдёт по «Принять состав». */}
            {out.length > 0 && !verdict && (
              <span className="pill bad" style={{ margin: 0 }}>
                {out.length} {plural(out.length, 'ИСКЛЮЧЁН', 'ИСКЛЮЧЕНО', 'ИСКЛЮЧЕНО')}
              </span>
            )}
            <span
              className={'pill ' + (verdict === 'ok' ? 'live' : verdict === 'no' ? 'bad' : 'wait')}
              style={{ margin: 0 }}
            >
              {verdict === 'ok' ? 'СОСТАВ ПРИНЯТ' : verdict === 'no' ? 'ЗАЯВКА ОТКЛОНЕНА' : 'ЖДЁТ РЕШЕНИЯ'}
            </span>
          </span>
        }
      >
        {/* Список игроков таблицей ✳: игрок, что не прошло, состояние.

            Четыре проверки отдельными колонками не поместились: панель стоит в
            половине экрана, шесть столбцов её не держат — колонка с фамилией
            схлопывалась в ноль, и имя наезжало на подписи «возраст», «ценз».
            Четыре галочки и не нужны: у проходящих они все зелёные и не несут
            ничего, а у непроходящего важно ровно то, ЧТО не прошло. Поэтому
            один столбец, и в нём — названия несданных проверок. */}
        <div className="mktable mkbids">
          <div className="mktable-h">
            <span>Игрок</span>
            <span>Не пройдено</span>
            <span>Состояние</span>
          </div>
          <div className="mktable-b">
            {squad.map((pl) => {
              const failed = CHECKS.filter((_, i) => !pl.v[i]);
              const excluded = out.includes(pl.nm);
              return (
                <div
                  className={'mktable-r' + (pl.auto || excluded ? ' no' : '') + (pl.nm === pick ? ' on' : '')}
                  key={pl.nm}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPick(pl.nm === pick ? null : pl.nm)}
                >
                  <span className="nm">
                    <img src={pl.av} alt="" />
                    <i>
                      {pl.nm}
                      {/* Отклонённому пишем фразу, которая ушла игроку: судья
                          должен видеть ровно то, что человек прочитал у себя. */}
                      <em className={pl.auto ? 'off' : undefined}>{pl.auto ?? pl.sub}</em>
                    </i>
                  </span>
                  <span className={failed.length ? 'fail' : 'okall'}>
                    {failed.length
                      ? <><X size={12} />{failed.join(' · ')}</>
                      : <><Check size={12} />всё пройдено</>}
                  </span>
                  <span className="mark">
                    <span className={'pill ' + (excluded ? 'bad' : pl.cls)} style={{ margin: 0 }}>
                      {excluded ? 'ИСКЛЮЧЁН' : pl.p}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Выбранный игрок — решение по одному человеку: заявка целиком
            принимается или отклоняется, но спорный в ней обычно один, и
            исключить его дешевле, чем возвращать весь состав. */}
        {one && !verdict && (
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">
              {one.nm} · {out.includes(one.nm) ? 'исключён из состава' : one.auto ?? 'проходит допуск'}
            </div>
            <button
              type="button"
              className="dpickbtn"
              onClick={() => setOut(out.includes(one.nm) ? out.filter((x) => x !== one.nm) : [...out, one.nm])}
            >
              {out.includes(one.nm) ? 'Вернуть в состав' : 'Исключить из состава'}
            </button>
          </div>
        )}

        {verdict ? (
          <div style={{ marginTop: 12 }}>
            <Alert tone={verdict === 'ok' ? 'success' : 'warning'}>
              {verdict === 'ok'
                ? `Состав принят${out.length ? ` без ${out.length} ${plural(out.length, 'игрока', 'игроков', 'игроков')}` : ''}. Заявитель уведомлён, участники попадают в состав турнира.`
                : 'Заявка отклонена с причиной. Причина ушла заявителю — он может исправить и подать снова, пока приём открыт.'}
            </Alert>
            <div style={{ marginTop: 10 }}>
              <Ghost
                onClick={() => {
                  const next = { ...done };
                  delete next[cur];
                  setDone(next);
                }}
              >
                Вернуть заявку в очередь
              </Ghost>
            </div>
          </div>
        ) : (
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                type="button"
                className="dpickbtn"
                data-to="Э6.8"
                onClick={() => { setDone({ ...done, [cur]: 'no' }); setPick(null); }}
              >
                Отклонить заявку с причиной
              </button>
              {/* Кнопка говорит, что именно сделает ✳: «принять состав» и
                  «принять состав без двоих» — разные решения, и разница должна
                  стоять на самой кнопке, а не подписью сбоку. */}
              <button
                type="button"
                className="dsubmit"
                style={{ padding: '9px 16px', fontSize: 12.5 }}
                onClick={() => { setDone({ ...done, [cur]: 'ok' }); setPick(null); }}
              >
                <Check size={14} />
                {out.length
                  ? `Принять состав без ${out.length} ${plural(out.length, 'игрока', 'игроков', 'игроков')}`
                  : 'Принять состав'}
              </button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <Hint>{AGE_RULE}</Hint>
        </div>
      </Panel>

      <Panel
        title="Ждут решения"
        extra={<span className="pill wait" style={{ margin: 0 }}>{BIDS.length}</span>}
      >
        <Rows>
          {BIDS.map((b) => (
            <Row
              key={b.nm}
              nm={b.nm}
              sub={b.sub}
              pill={
                done[b.nm] === 'ok'
                  ? { t: 'ПРИНЯТА', cls: 'live' }
                  : done[b.nm] === 'no'
                    ? { t: 'ОТКЛОНЕНА', cls: 'bad' }
                    : { t: b.who, cls: 'reg' }
              }
              on={b.nm === cur}
              onSelect={() => { setCur(b.nm); setPick(null); }}
            />
          ))}
        </Rows>
        <div style={{ marginTop: 12 }}>
          <Hint>Строка открывает состав заявки слева — разбирают их подряд, сверху вниз.</Hint>
        </div>
      </Panel>
    </div>
  );
};

export function Bids6_2({ tab }: { tab?: string }) {
  return (
    <RoleScreen
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Заявки"
      title="Заявки участников"
      sub="Заявка № 14 · 6 игроков"
    >
      <Tabs
        active={tab}
        items={[
          { t: 'Ждут решения · 8', view: <Waiting6_2 /> },
          { t: 'Приняты · 104', view: <DecidedBids kind="Приняты" /> },
          /* Отклонённые системой стоят отдельно от отклонённых судьёй ✳: это
             разные вещи, и разбираются они по-разному — по авто-отказу игрок
             может донести документ и подать заново, по решению судьи спор идёт
             через федерацию. */
          { t: 'Отклонены системой · 9', view: <DecidedBids kind="Отклонены системой" /> },
          { t: 'Отклонены судьёй · 3', view: <DecidedBids kind="Отклонены судьёй" /> },
          { t: 'Отозваны · 4', view: <DecidedBids kind="Отозваны" /> },
        ]}
      />
    </RoleScreen>
  );
}

/* ── Э6.3 · Сетка: формат, посев, сборка ────────────────────────── */

/** Э6.3 · Сетка — утверждение.

    Собирает сетку секретарь (Э7.3): систему проведения, жеребьёвку и саму
    сетку. Главный судья её **утверждает или возвращает с замечанием** — так
    границу задаёт документ федерации: у секретаря «сетки», у главного судьи
    «утверждение сеток» (решение 19.08.2026).

    При этом **доступ к любым параметрам турнира у судьи есть** ✳: он отвечает
    за соревнование целиком и может поправить что угодно — но правка после
    утверждения уходит в журнал с автором (§12). Раньше здесь стояли подсказка
    по системе и кнопка «Собрать сетку» — то есть работа секретаря. */
/** Жеребьёвку проводит главный судья ✳ (комментарий федерации, 09.2026).

    Раньше её проводил секретарь (Э7.2), а судья только утверждал результат: так
    была прочитана формулировка документа. Федерация поправила — бросает судья.
    Секретарь оформляет: он видит слоты и собирает по ним сетку, но не бросает и
    не перебрасывает.

    Здесь же судья задаёт **регламент времени по кругам**: сколько минут даётся
    на матч в каждом круге. Без него расписание не составить — длительность
    круга и есть то, из чего складывается игровой день. */
const DRAW_TABS = ['Жеребьёвка', 'Регламент времени', 'Сетка'];
const DRAW_WAYS = ['Посев по рейтингу', 'Жребий'];

/** Сколько минут на матч в каждом круге. Пример федерации: предварительные
    первые три тура по 25 минут, дальше по 30; в плей-офф до 1/8 по 25, с
    четвертьфинала — по 30, финал — 35. */
type Round6 = { st: string; rd: string; min: number };

const ROUNDS6: Round6[] = [
  { st: 'Групповой этап', rd: 'туры 1–3', min: 25 },
  { st: 'Групповой этап', rd: 'туры 4 и далее', min: 30 },
  { st: 'Плей-офф', rd: '1/32 — 1/8', min: 25 },
  { st: 'Плей-офф', rd: '1/4 и полуфиналы', min: 30 },
  { st: 'Плей-офф', rd: 'финал и матч за 3-е место', min: 35 },
];

export function Bracket6_3() {
  const [tab, setTab] = useState(DRAW_TABS[0]);
  /* Утверждена ли сетка. Возврат идёт с замечанием — секретарь должен знать,
     что переделывать. */
  const [ok, setOk] = useState<'' | 'yes' | 'back'>('');
  const [way, setWay] = useState(DRAW_WAYS[1]);
  const lot = way === DRAW_WAYS[1];
  /* Сколько раз бросали: первый бросок — не переброс. */
  const [n, setN] = useState(0);

  return (
    <RoleScreen
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Сетка"
      title="Жеребьёвка и сетка"
    >
      <Chips
        items={[
          { v: '112', k: 'Участников в составе', tone: 'b' },
          { v: '14', k: 'Регионов' },
          { v: '223', k: 'Матча по сетке' },
          { v: '16', k: 'Сеяных', tone: 'g' },
          { v: String(Math.max(0, n - 1)), k: 'Перебросов', tone: n > 1 ? 'a' : undefined },
        ]}
      />

      <Filter items={DRAW_TABS} active={tab} onPick={setTab} />

      {tab === DRAW_TABS[0] && (
        <div className="mkcols">
          <Panel
            title="Распределение по слотам"
            extra={
              <span
                className={'pill ' + (!lot ? 'live' : n ? 'live' : 'wait')}
                style={{ margin: 0 }}
              >
                {!lot ? 'ПОСЕВ ГОТОВ' : n ? 'ЖРЕБИЙ ПРОВЕДЁН' : 'ЖРЕБИЙ НЕ БРОШЕН'}
              </span>
            }
          >
            <div className="dfield">
              <label>Как разводим участников</label>
              <FormSeg items={DRAW_WAYS} active={way} onPick={(v) => { setWay(v); setN(0); }} />
            </div>
            <div style={{ height: 12 }} />
            <Form>
              <Field label="Основание посева" value="Рейтинг ФНТ РК на 05.03.2026" wide />
              <Field label="Сеяных" value="16 · по разным четвертям" />
              <Field
                label={lot ? 'Последний жребий' : 'Случайность'}
                value={lot ? (n ? `бросок ${n} · Оспанов Т.` : 'не бросали') : 'не участвует'}
              />
            </Form>
            {/* При посеве по рейтингу бросать нечего: расстановка выводится из
                рейтинга целиком. Кнопки появляются только у жребия. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {lot && (
                <button type="button" className="dsubmit" onClick={() => setN(n + 1)}>
                  <Shuffle size={15} />{n ? 'Перебросить жребий' : 'Провести жеребьёвку'}
                </button>
              )}
              <Ghost>
                <Pencil size={14} /> {lot ? 'Изменить состав сеяных' : 'Изменить основание посева'}
              </Ghost>
            </div>
            <div style={{ marginTop: 12 }}>
              <Hint>
                Жеребьёвка лежит на главном судье ✳ (комментарий федерации, 09.2026). Секретарь
                вправе её видеть и с ней работать — бросить, перебросить, пересобрать слоты
                (Э7.3), — но **утверждает только главный судья**. Прежний результат каждого
                броска остаётся в журнале: переигранный жребий участники вправе проверить.
              </Hint>
            </div>
            <div style={{ height: 12 }} />
          </Panel>

          <Panel title="Кто где стоит" extra={<span className="dcount">первые слоты</span>}>
            <Rows>
              <Row av={P.kim} nm="1 · Ким Георгий" sub="«Алатау» · рейтинг 2401" pill={{ t: 'ПОСЕВ №1', cls: 'reg' }} />
              <Row av={P.tok} nm="128 · Токаев Марат" sub="«Алатау» · рейтинг 2350" pill={{ t: 'ПОСЕВ №2', cls: 'reg' }} />
              <Row av={P.ahm} nm="65 · Ахметов Дархан" sub="«Алатау» · рейтинг 2120" pill={{ t: 'ПОСЕВ №3', cls: 'reg' }} />
              <Row
                av={P.bai}
                nm={n || !lot ? '12 · Байжанов Асхат' : '— · Байжанов Асхат'}
                sub="«Алатау» · рейтинг 2180"
                pill={lot ? { t: n ? 'ЖРЕБИЙ' : 'ЖДЁТ ЖРЕБИЯ', cls: n ? 'wait' : 'done' } : { t: 'ПОСЕВ №7', cls: 'reg' }}
              />
            </Rows>
            <div style={{ marginTop: 12 }}>
              <Hint>Весь состав со слотами — у секретаря (Э7.3): он собирает по ним сетку.</Hint>
            </div>
          </Panel>
        </div>
      )}

      {tab === DRAW_TABS[1] && (
        <>
          {/* Регламент времени ✳ (комментарий федерации, 09.2026): судья
              прописывает, сколько минут даётся на матч в каждом круге. Круги
              идут не по одной мерке — предварительные короче финальных, — и
              из этих чисел потом складывается игровой день в расписании. */}
          <div className="dactionbar">
            <span className="dcount">
              Минуты на матч по кругам · из них складывается игровой день в расписании (Э6.4)
            </span>
            <Ghost><Pencil size={14} /> Изменить регламент</Ghost>
          </div>

          <div className="mktable mkrounds">
            <div className="mktable-h">
              <span>Этап</span>
              <span>Круг</span>
              <span className="num">Минут на матч</span>
              <span className="num">Матчей</span>
              <span className="num">Стол-часов</span>
            </div>
            <div className="mktable-b">
              {ROUNDS6.map((r) => {
                const games = r.rd === 'туры 1–3' ? 84 : r.rd === 'туры 4 и далее' ? 28 : r.rd === '1/32 — 1/8' ? 56 : r.rd.startsWith('1/4') ? 6 : 2;
                return (
                  <div className="mktable-r" key={r.st + r.rd}>
                    <span className="nm"><i>{r.st}</i></span>
                    <span>{r.rd}</span>
                    <span className="num tot">{r.min}</span>
                    <span className="num">{games}</span>
                    <span className="num">{Math.round((games * r.min) / 60)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Hint>
            Стол-часы считаются из регламента, а не задаются руками: поменял минуты — сразу видно,
            влезает ли турнир в игровые дни. При 20 столах и 8 часах в день зал даёт 480 стол-часов.
          </Hint>
        </>
      )}

      {tab === DRAW_TABS[2] && (
        <div className="mkcols">
          <Panel
            title="Что собрал секретарь"
            extra={
              <span
                className={'pill ' + (ok === 'yes' ? 'live' : ok === 'back' ? 'bad' : 'wait')}
                style={{ margin: 0 }}
              >
                {ok === 'yes' ? 'УТВЕРЖДЕНА' : ok === 'back' ? 'ВОЗВРАЩЕНА' : 'ЖДЁТ УТВЕРЖДЕНИЯ'}
              </span>
            }
          >
            <Rows>
              <Row
                nm="Система проведения"
                sub="группы по 4 + плей-офф · 223 матча · 130 стол-часов из 480"
                pill={{ t: 'УКЛАДЫВАЕТСЯ', cls: 'live' }}
              />
              <Row nm="Жеребьёвка" sub={`провёл главный судья · ${n ? `бросков ${n}` : 'посев по рейтингу'}`} val="11.03, 15:40" />
              <Row nm="Сетка" sub="128 слотов · 16 bye добраны автоматически" val="11.03, 16:20" />
              <Row nm="Кто собрал" sub="Ким Лариса · главный секретарь" val="Э7.3" to="Э7.3" />
            </Rows>

            <div className="dactionbar" style={{ marginTop: 12 }}>
              <span className="dcount">
                {ok === 'yes'
                  ? 'Сетка зафиксирована. Дальше расписание — его тоже собирает секретарь'
                  : ok === 'back'
                    ? 'Замечание ушло секретарю: он пересоберёт и передаст снова'
                    : 'Утверждение коллегией сетке не требуется (§4.6) — решение за главным судьёй'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Ghost onClick={() => setOk('back')}>Вернуть с замечанием</Ghost>
                <button
                  type="button"
                  className="dsubmit"
                  style={{ padding: '10px 14px' }}
                  onClick={() => setOk('yes')}
                >
                  <Check size={15} /> Утвердить сетку
                </button>
              </div>
            </div>
          </Panel>

          <Panel
            title="Параметры турнира"
            extra={<span className="pill reg" style={{ margin: 0 }}>ПОЛНЫЙ ДОСТУП</span>}
          >
            <Form>
              <Field label="Формат" value="Группы по 4 + плей-офф" />
              <Field label="Партий в матче" value="до 3 из 5" />
              <Field label="Утешительная сетка" value="нет" />
              <Field label="Столов в зале" value="20 · трансляция с 2" />
            </Form>
            <div style={{ marginTop: 12 }}>
              <Hint>
                Главный судья отвечает за соревнование целиком и может поправить любой параметр —
                формат, партии, столы. Правка после утверждения сохраняется с автором и уходит в
                журнал (§12), а секретарь получает уведомление: он пересоберёт по новым вводным.
              </Hint>
            </div>
            <div style={{ marginTop: 12 }}>
              <Ghost><Pencil size={14} /> Изменить параметры</Ghost>
            </div>
          </Panel>
        </div>
      )}
    </RoleScreen>
  );
}

/* ── Э6.4 · Расписание и столы ──────────────────────────────────── */

const HOURS = ['10:00', '11:30', '13:00', '14:30'];
const TABLES8 = [1, 2, 3, 4, 5, 6, 7, 8];
const STREAM = [1, 3];   // столы с трансляцией
const PAIRS = [
  'Ким Г. — Сәтбаев Е.', 'Токаев М. — Нұрғали А.', 'Гладун И. — Ахметов Д.', 'Байжанов А. — Досжан М.',
  'Мұрат Е. — Сарсенов А.', 'Тлеуова А. — Оралова М.', 'Ким Г. — Досжан М.', 'Токаев М. — Гладун И.',
];
const ROUNDS = ['1/32', '1/32', '1/16', '1/16'];
/** Подсвеченные конфликты: участник в двух местах и занятый стол. */
const CONFLICT: Record<string, string> = {
  '2-3': 'участник уже на столе 6',
  '3-6': 'стол занят до 15:10',
};
const EMPTY = new Set(['2-8', '3-7', '3-8']);

/** Три дня игры: в каждом свои круги сетки — на третий день играют финалы, и
    столов в работе остаётся меньше. Конфликты подсвечены только в том дне, где
    они есть: день без конфликтов должен выглядеть спокойным. */
const DAYS6_4 = [
  { t: 'День 1 · 12.03', cap: 'День 1 · 12 марта · столы 1–8 из 20', rounds: ['1/32', '1/32', '1/16', '1/16'], bad: true },
  { t: 'День 2 · 13.03', cap: 'День 2 · 13 марта · столы 1–8 из 20', rounds: ['1/8', '1/8', '1/4', '1/4'], bad: false },
  { t: 'День 3 · 14.03', cap: 'День 3 · 14 марта · столы 1–2 из 20', rounds: ['1/2', '1/2', 'Финал', 'За 3-е место'], bad: false },
];

/** Сетка «дни × столы» одного дня. */
const Grid6_4 = ({ day }: { day: (typeof DAYS6_4)[number] }) => {
  const conflict = day.bad ? CONFLICT : {};
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '54px repeat(8, minmax(0, 1fr))', gap: 8 }}>
          <div />
          {TABLES8.map((n) => (
            <div
              key={n}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, color: 'var(--c-muted)',
              }}
            >
              Стол {n}
              {STREAM.includes(n) && <Radio size={11} style={{ color: 'var(--c-broadcast)' }} />}
            </div>
          ))}

      {HOURS.map((h, r) => (
        <Fragment key={h}>
          <div style={{ alignSelf: 'center', fontSize: 11, fontWeight: 700, color: 'var(--c-dim)' }}>{h}</div>
          {TABLES8.map((c) => {
            const key = `${r}-${c}`;
            const bad = conflict[key];
            if (EMPTY.has(key)) {
              return (
                <div key={key} className="dtable free" style={{ padding: 7 }}>
                  <div className="tn">—<span className="st" /></div>
                  <div className="pl">свободно</div>
                </div>
              );
            }
            return (
              <div
                key={key}
                className="dtable busy"
                style={bad ? { padding: 7, borderColor: 'var(--c-danger)' } : { padding: 7 }}
              >
                <div className="tn">{day.rounds[r]}<span className="st" /></div>
                <div className="pl">{PAIRS[(r * 3 + c) % PAIRS.length]}</div>
                {bad && (
                  <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: 'var(--c-danger)' }}>{bad}</div>
                )}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
};

/** Тот же день списком: когда, где, кто и какой круг — по порядку времени. */
const List6_4 = ({ day }: { day: (typeof DAYS6_4)[number] }) => (
  <Rows>
    {HOURS.map((h, r) =>
      TABLES8.slice(0, 3).map((c) => (
        <Row
          key={`${h}-${c}`}
          nm={PAIRS[(r * 3 + c) % PAIRS.length]}
          sub={`${h} · стол ${c} · ${day.rounds[r]}`}
          pill={
            day.bad && CONFLICT[`${r}-${c}`]
              ? { t: 'КОНФЛИКТ', cls: 'bad' }
              : { t: 'РАССТАВЛЕН', cls: 'reg' }
          }
        />
      )),
    )}
  </Rows>
);

/** День расписания: сетка «дни × столы» или тот же день списком. */
const Day6_4 = ({ day }: { day: (typeof DAYS6_4)[number] }) => (
  <TabPanel
    title={day.cap}
    items={[
      { t: 'Дни × столы', view: <Grid6_4 day={day} /> },
      { t: 'Списком', view: <List6_4 day={day} /> },
    ]}
  />
);

/** Как идут игры: по часам, живой очередью или вперемешку — часть турнира
    так, часть иначе. */
const ORDER6 = ['По расписанию', 'Живая очередь', 'Смешанно'];

/** Живая очередь: очередь пар на освободившиеся столы. Часов нет — есть
    порядок; следующая пара уходит на тот стол, который освободился первым. */
const LiveOrder6_4 = () => (
  <div className="mkcols">
    <Panel title="Очередь пар" extra={<span className="pill live" style={{ margin: 0 }}>ЖИВАЯ ОЧЕРЕДЬ</span>}>
      <Rows>
        <Row nm="1 · Смагулов — Цой" sub="1/8 · вызвана на стол 4" pill={{ t: 'ИГРАЕТ', cls: 'live' }} />
        <Row nm="2 · Ким — Сериков" sub="1/8 · вызвана на стол 2" pill={{ t: 'ИГРАЕТ', cls: 'live' }} />
        <Row nm="3 · Токаев — Гладун" sub="1/8 · следующая на освободившийся" pill={{ t: 'СЛЕДУЮЩАЯ', cls: 'wait' }} />
        <Row nm="4 · Пак — Мұрат" sub="1/8 · ждёт" />
        <Row nm="5 · Байжанов — Досжан" sub="1/8 · ждёт" />
      </Rows>
      <div style={{ marginTop: 12 }}>
        <Hint>
          Очередь ведёт главный судья: он вызывает пару на освободившийся стол (Э6.6). Времени в
          строке нет намеренно ✳ — в живой очереди его нельзя пообещать, а показанное время
          участники читают как обещание.
        </Hint>
      </div>
    </Panel>

    <Panel title="Столы" extra={<span className="dcount">8 из 20 в игре</span>}>
      <Rows>
        <Row nm="Стол 4" sub="Смагулов — Цой · идёт 12 минут" pill={{ t: 'ЗАНЯТ', cls: 'live' }} />
        <Row nm="Стол 2" sub="Ким — Сериков · идёт 4 минуты" pill={{ t: 'ЗАНЯТ', cls: 'live' }} />
        <Row nm="Стол 7" sub="освободился — следующая пара по очереди" pill={{ t: 'СВОБОДЕН', cls: 'wait' }} action="Вызвать пару" />
        <Row nm="Стол 9" sub="освободился" pill={{ t: 'СВОБОДЕН', cls: 'wait' }} action="Вызвать пару" />
      </Rows>
      <div style={{ marginTop: 12 }}>
        <Hint>
          Регламент времени по кругам (Э6.3) в живой очереди тоже работает: он говорит, сколько
          матч должен занять, — по нему судья и понимает, укладывается ли зал в игровой день.
        </Hint>
      </div>
    </Panel>
  </div>
);

export function Schedule6_4({ tab }: { tab?: string }) {
  const [order, setOrder] = useState(ORDER6[0]);
  return (
    <RoleScreen
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Расписание"
      title="Расписание — утверждение"
      sub="Разложил секретарь (Э7.4) · дни × столы · 127 матчей сетки по трём дням игры"
    >
      <Chips
        items={[
          { v: '127', k: 'Матчей в сетке', tone: 'b' },
          { v: '3', k: 'Дня игры' },
          { v: '20', k: 'Столов в зале' },
          { v: '2', k: 'Конфликта', tone: 'a' },
          { v: '2', k: 'Трансляционных стола' },
        ]}
      />
      {/* Порядок игр ✳ (комментарий федерации, 09.2026): турнир можно
          запустить и **без расписания — по живой очерёдности**. Есть старты,
          которые в расписание не укладываются: любительские, где состав
          доигрывается на месте, или день, съехавший из-за затянувшихся матчей.
          Тогда пары вызываются по очереди на освободившийся стол, а не по
          часам.

          Порядок выбирается **на весь турнир или на его часть**: первые дни по
          расписанию, финальный день живой очередью — обычный случай. */}
      <div className="dactionbar" style={{ marginBottom: 10 }}>
        <Filter items={ORDER6} active={order} onPick={setOrder} />
        <span className="dcount">
          {order === ORDER6[0]
            ? '2 конфликта: их видно на дне 2 — сначала их и разбирают'
            : order === ORDER6[1]
              ? 'Пары вызываются на освободившийся стол; часов в расписании нет'
              : 'Дни 1–2 по расписанию, финальный день — живой очередью'}
        </span>
      </div>

      {order !== ORDER6[1] && (
        <div className="dactionbar" style={{ marginBottom: 10 }}>
          <span className="pill wait" style={{ margin: 0 }}>ЖДЁТ УТВЕРЖДЕНИЯ</span>
          <span className="dcount">Собрал секретарь (Э7.4) — судья утверждает или возвращает</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Ghost>Вернуть с замечанием</Ghost>
            <button type="button" className="dsubmit" style={{ padding: '10px 14px' }}>
              <Check size={15} /> Утвердить расписание
            </button>
          </div>
        </div>
      )}

      {order === ORDER6[1] ? (
        <LiveOrder6_4 />
      ) : (
        <Tabs
          active={tab}
          items={
            order === ORDER6[2]
              ? [
                ...DAYS6_4.slice(0, 2).map((d) => ({ t: d.t, view: <Day6_4 day={d} /> })),
                { t: 'День 3 · живая очередь', view: <LiveOrder6_4 /> },
              ]
              : DAYS6_4.map((d) => ({ t: d.t, view: <Day6_4 day={d} /> }))
          }
        />
      )}
    </RoleScreen>
  );
}

/* ── Э6.5 · Судьи на столах ─────────────────────────────────────── */

type Slot = { n: number; j: string | null; cat?: string };

const SLOTS: Slot[] = [
  { n: 1, j: 'Пак Сергей', cat: 'первая' },
  { n: 2, j: 'Ерлан Батыр', cat: 'национальная' },
  { n: 3, j: 'Ахметов Кайрат', cat: 'первая' },
  { n: 4, j: 'Нұрланов Данияр', cat: 'судья по спорту' },
  { n: 5, j: 'Сейтқали Айдос', cat: 'первая' },
  { n: 6, j: 'Абдрахманов Ерлан', cat: 'национальная' },
  { n: 7, j: null },
  { n: 8, j: 'Тұрсынов Мади', cat: 'первая' },
  { n: 9, j: 'Бектұров Руслан', cat: 'судья по спорту' },
  { n: 10, j: 'Қалиев Санжар', cat: 'национальная' },
  { n: 11, j: null },
  { n: 12, j: 'Аманжол Нұрлан', cat: 'первая' },
  { n: 13, j: 'Дәулет Жасұлан', cat: 'судья по спорту' },
  { n: 14, j: 'Жақсылық Бекзат', cat: 'первая' },
];

/** Номер судьи на турнир ✳ (комментарий федерации, 09.2026). На время
    соревнования судья получает номер — им он и стоит в расписании: «С-4», а не
    «Нұрланов Данияр». Фамилии в клетку расписания не влезают, а распечатанную
    таблицу со столами и часами читают с расстояния.

    Номер живёт один турнир: на следующем старте у того же человека будет
    другой. Это не идентификатор судьи, а место в наряде этого соревнования. */
const JNUM: Record<string, number> = {
  'Пак Сергей': 1,
  'Ерлан Батыр': 2,
  'Ахметов Кайрат': 3,
  'Нұрланов Данияр': 4,
  'Сейтқали Айдос': 5,
  'Абдрахманов Ерлан': 6,
  'Тұрсынов Мади': 8,
  'Бектұров Руслан': 9,
  'Қалиев Санжар': 10,
  'Аманжол Нұрлан': 12,
  'Дәулет Жасұлан': 13,
  'Жақсылық Бекзат': 14,
  'Мұқанов Талғат': 15,
  'Ибраев Қанат': 16,
};

const jn = (nm: string) => (JNUM[nm] ? `С-${JNUM[nm]}` : '—');

const JUDGE_VIEWS = ['Столы зала', 'Расписание судей'];

/** Расписание судей — той же таблицей, что расписание игр ✳ (комментарий
    федерации, 09.2026): день, час, стол и кто на нём стоит. Одна таблица на две
    вещи, потому что вопрос один — «кто где и когда», — и печатаются они рядом.

    В клетках стоят номера: так строка влезает в ширину и читается с
    расстояния. */
const JSHIFT: { h: string; t: (string | null)[] }[] = [
  { h: '10:00', t: ['Пак Сергей', 'Ерлан Батыр', 'Ахметов Кайрат', 'Нұрланов Данияр', null, 'Абдрахманов Ерлан'] },
  { h: '11:30', t: ['Пак Сергей', 'Ерлан Батыр', 'Ахметов Кайрат', 'Нұрланов Данияр', 'Сейтқали Айдос', 'Абдрахманов Ерлан'] },
  { h: '13:00', t: ['Тұрсынов Мади', 'Бектұров Руслан', 'Қалиев Санжар', 'Аманжол Нұрлан', 'Сейтқали Айдос', null] },
  { h: '14:30', t: ['Тұрсынов Мади', 'Бектұров Руслан', 'Қалиев Санжар', 'Аманжол Нұрлан', 'Дәулет Жасұлан', 'Жақсылық Бекзат'] },
  { h: '16:00', t: ['Мұқанов Талғат', 'Ибраев Қанат', 'Қалиев Санжар', null, 'Дәулет Жасұлан', 'Жақсылық Бекзат'] },
];

const JudgeShift6_5 = () => (
  <>
    <div className="dactionbar">
      <span className="dcount">
        День 1 · столы 1–6 · в клетках номера судей, полный список — рядом
      </span>
      <Ghost><Printer size={14} /> Печать расписания</Ghost>
    </div>

    <div className="mktable mkjshift">
      <div className="mktable-h">
        <span>Время</span>
        {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className="num">Стол {n}</span>)}
      </div>
      <div className="mktable-b">
        {JSHIFT.map((r) => (
          <div className="mktable-r" key={r.h}>
            <span className="nm"><i>{r.h}</i></span>
            {r.t.map((j, i) => (
              <span key={i} className={'num' + (j ? ' tot' : ' free')}>
                {j ? jn(j) : '—'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>

    <div className="dcols">
      <Panel title="Кто под каким номером" extra={<span className="dcount">номер живёт один турнир</span>}>
        <Rows>
          {Object.entries(JNUM).slice(0, 7).map(([nm, n]) => (
            <Row key={nm} nm={`С-${n} · ${nm}`} sub="наряд Чемпионата Казахстана 2026" />
          ))}
        </Rows>
      </Panel>

      <Panel title="Пустые клетки" extra={<span className="pill bad" style={{ margin: 0 }}>3 ЧАСА БЕЗ СУДЬИ</span>}>
        <Rows>
          <Row nm="10:00 · стол 5" sub="судья не назначен" pill={{ t: 'ПУСТО', cls: 'bad' }} action="Назначить" />
          <Row nm="13:00 · стол 6" sub="судья не назначен" pill={{ t: 'ПУСТО', cls: 'bad' }} action="Назначить" />
          <Row nm="16:00 · стол 4" sub="судья не назначен" pill={{ t: 'ПУСТО', cls: 'bad' }} action="Назначить" />
        </Rows>
        <div style={{ marginTop: 12 }}>
          <Hint>
            Пустая клетка в расписании судей — это стол, который в свой час не примет матч. На
            любительском турнире его можно оставить пустым намеренно (см. полосу выше), на
            официальном — нет.
          </Hint>
        </div>
      </Panel>
    </div>
  </>
);

export function Judges6_5() {
  const [view, setView] = useState(JUDGE_VIEWS[0]);
  /* Игра без судьи ✳ (комментарий федерации, 09.2026): на любительских турнирах
     стол может работать без судьи — счёт ведут сами игроки. На официальном
     старте так нельзя: там судья на столе обязателен, и пустой слот означает,
     что стол в игру не пойдёт. */
  const [noJudge, setNoJudge] = useState(false);

  return (
    <RoleScreen
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Судьи на столах"
      title="Судьи на столах"
      sub="Наряд турнира набирает председатель ГСК (Э5.2) — главный судья расставляет его по столам"
    >
      <Chips
        items={[
          { v: '20', k: 'Столов в зале', tone: 'b' },
          { v: '14', k: 'Столов в игре' },
          { v: '12', k: 'Столов с судьёй', tone: 'g' },
          { v: '2', k: noJudge ? 'Столов без судьи — разрешено' : 'Столов без судьи', tone: noJudge ? 'g' : 'a' },
          { v: '2', k: 'Судьи свободны' },
        ]}
      />

      {/* Игра без судьи — свойство турнира, а не стола ✳: разрешение даётся на
          соревнование целиком, иначе на одном столе счёт ведёт судья, на
          соседнем игроки, и протокол собирается из разного. */}
      <div className="dactionbar">
        <Filter items={JUDGE_VIEWS} active={view} onPick={setView} />
        <span className="dcount">
          {noJudge
            ? 'Любительский турнир: стол может работать без судьи — счёт ведут игроки'
            : 'Официальный старт: судья на столе обязателен, пустой стол в игру не идёт'}
        </span>
        <button
          type="button"
          className="dpickbtn"
          onClick={() => setNoJudge(!noJudge)}
        >
          {noJudge ? 'Требовать судью на каждом столе' : 'Разрешить игру без судьи'}
        </button>
      </div>

      {view === JUDGE_VIEWS[1] ? (
        <JudgeShift6_5 />
      ) : (
      <div className="dcols">
        <Panel title="Столы зала" extra={<span className="pill bad" style={{ margin: 0 }}>2 ПУСТЫХ СЛОТА</span>}>
          <div className="djudges">
            {SLOTS.map((s) => (
              <div
                key={s.n}
                className="djudge"
                style={s.j ? undefined : { borderColor: 'var(--c-danger-line)' }}
              >
                <span className="tn">Стол {s.n}</span>
                {s.j
                  ? <span className="jn">{s.j} · {s.cat}</span>
                  : <span className="pill bad" style={{ margin: 0 }}>СУДЬЯ НЕ НАЗНАЧЕН</span>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Судьи наряда" extra={<span className="pill wait" style={{ margin: 0 }}>2 СВОБОДНЫ</span>}>
          <div className="qsec">Свободны сейчас</div>
          <Rows>
            <Row av={P.erl} nm="Мұқанов Талғат" sub="высшая национальная категория" action="На стол" />
            <Row av={P.pak} nm="Ибраев Қанат" sub="первая категория" action="На стол" />
          </Rows>
          <div className="qsec">Уже на столах</div>
          <Rows>
            <Row nm="Пак Сергей" sub="первая категория" val="стол 1" pill={{ t: 'НА СТОЛЕ', cls: 'live' }} />
            <Row nm="Ерлан Батыр" sub="национальная категория" val="стол 2" pill={{ t: 'НА СТОЛЕ', cls: 'live' }} />
            <Row nm="Ахметов Кайрат" sub="первая категория" val="стол 3" pill={{ t: 'НА СТОЛЕ', cls: 'live' }} />
          </Rows>
        </Panel>
      </div>
      )}
    </RoleScreen>
  );
}

/* ── Э6.6 · Ход турнира ─────────────────────────────────────────── */

export function Live6_6() {
  return (
    <RoleScreen
      role={at('ИДЁТ')}
      nav="Ход турнира"
      title="Ход турнира"
      sub="Карта столов · счёт обновляется в реальном времени · сетка пересобирается после каждого результата"
    >
      <Chips
        items={[
          { v: '12', k: 'Идут сейчас', tone: 'b' },
          { v: '8', k: 'Ждут стола', tone: 'a' },
          { v: '60 / 127', k: 'Матчей сыграно', tone: 'g' },
          { v: '1', k: 'Задержка старта' },
          { v: '1', k: 'Стол без судьи' },
        ]}
      />
      <TableMap />

      <div className="dcols">
        <Panel title="Идут сейчас" extra={<span className="pill live" style={{ margin: 0 }}>12 СТОЛОВ В ИГРЕ</span>}>
          <LiveCards />
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Правка — в пределах лимита, в журнал с автором</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="dpickbtn">
                <Pencil size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
                Исправить счёт
              </button>
              <button className="dpickbtn">
                <Ban size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
                Техническая победа
              </button>
            </div>
          </div>
        </Panel>

        <QueuePanel />
      </div>
    </RoleScreen>
  );
}

/* ── Э6.7 · Итоговый протокол ───────────────────────────────────── */

type Place = { pl: number; av: string; nm: string; club: string; res: string };

const PLACES: Place[] = [
  { pl: 1, av: P.kim, nm: 'Ким Георгий', club: 'СКА · Астана', res: '7 матчей · 21 : 4' },
  { pl: 2, av: P.tok, nm: 'Токаев Марат', club: 'Шымкент', res: '7 матчей · 19 : 9' },
  { pl: 3, av: P.gla, nm: 'Гладун Игорь', club: 'Тараз', res: '7 матчей · 18 : 11' },
  { pl: 4, av: P.ahm, nm: 'Ахметов Дархан', club: 'Алатау · Алматы', res: '6 матчей · 15 : 12' },
  { pl: 5, av: P.dos, nm: 'Досжан Марат', club: 'Шахтёр · Караганда', res: '5 матчей · 12 : 10' },
  { pl: 6, av: P.sar, nm: 'Сарсенов Абай', club: 'Иртыш · Павлодар', res: '5 матчей · 11 : 12' },
];

const PROTO = ['Формируется', 'На утверждении', 'Возвращён', 'Закрыт'];

/** Компактная строка журнала: техпобеда или правка счёта. */
function LogRow({ t, s, p }: { t: string; s: string; p: string }) {
  return (
    <div className="drow" style={{ padding: '8px 11px' }}>
      <div className="who">
        <div className="nm" style={{ fontSize: 12.5 }}>{t}</div>
        <div className="rl">{s}</div>
      </div>
      <span className={'pill ' + (p === 'В ЖУРНАЛЕ' ? 'reg' : 'bad')} style={{ margin: 0 }}>{p}</span>
    </div>
  );
}

const bracket6_7 = { ...makeBigBracket(5), title: 'Чемпионат Казахстана 2026 · плей-офф' };

const GROUPS6_7 = [
  { nm: 'Группа A', rows: 'Ким Г. · Смагулов А. · Оралбек Д. · Цой А.', out: 'Ким Г., Смагулов А.', played: 6, of: 6 },
  { nm: 'Группа B', rows: 'Токаев М. · Абиш Н. · Сериков Н. · Ли В.', out: 'Токаев М., Абиш Н.', played: 6, of: 6 },
  { nm: 'Группа C', rows: 'Байжанов Е. · Пак С. · Мурат К. · Асан Б.', out: 'Байжанов Е., Пак С.', played: 6, of: 6 },
  { nm: 'Группа D', rows: 'Гладун И. · Оспанов Т. · Бекзат Ж. · Кайрат А.', out: 'Гладун И., Оспанов Т.', played: 6, of: 6 },
];

/** Что смотрит судья перед отправкой протокола. */
const PROTO_VIEWS = ['Итоги и решение', 'Сетка', 'Группы'];

export function Protocol6_7() {
  const [view, setView] = useState(PROTO_VIEWS[0]);
  return (
    <RoleScreen
      role={at('ИТОГОВЫЙ ПРОТОКОЛ')}
      nav="Протокол"
      title="Итоговый протокол"
      sub="Все 127 матчей сыграны · ввод результатов заблокирован"
    >
      <Chips
        items={[
          { v: '127 / 127', k: 'Матчей сыграно', tone: 'g' },
          { v: '112', k: 'Участников в протоколе', tone: 'b' },
          { v: '2', k: 'Технические победы', tone: 'a' },
          { v: '5', k: 'Правок счёта' },
        ]}
      />

      {/* Сетка и группы — здесь, до отправки ✳ (комментарий федерации,
          09.2026). Судья подписывается под итоговыми местами, а места берутся
          из сетки: не сверив её, он утверждает список, происхождение которого
          не видел. Раньше сетку приходилось открывать отдельным пунктом меню и
          возвращаться обратно по памяти. */}
      <Filter items={PROTO_VIEWS} active={view} onPick={setView} />

      {view === PROTO_VIEWS[1] && (
        <>
          <div className="mkbracket mkbracket-fill">
            <BracketFlow bracket={bracket6_7} minZoom={0.1} fitPadding={0.04} />
          </div>
          <Hint>
            Та же сетка, что видят игроки и секретарь: одна модель на всю систему. Места в
            протоколе выводятся из неё — сверить их и есть смысл этого взгляда.
          </Hint>
        </>
      )}

      {view === PROTO_VIEWS[2] && (
        <>
          <div className="mktable mkgrp6">
            <div className="mktable-h">
              <span>Группа и состав</span>
              <span className="num">Сыграно</span>
              <span>Вышли в плей-офф</span>
              <span>Состояние</span>
            </div>
            <div className="mktable-b">
              {GROUPS6_7.map((g) => (
                <div className="mktable-r" key={g.nm}>
                  <span className="nm"><i>{g.nm}<em>{g.rows}</em></i></span>
                  <span className="num">{g.played} из {g.of}</span>
                  <span>{g.out}</span>
                  <span className="mark">
                    <span className="pill live" style={{ margin: 0 }}>СЫГРАНА</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Hint>
            Групповой этап смотрят перед отправкой не ради красоты: спор о месте в плей-офф
            решается местом в группе, и после утверждения переиграть его нельзя.
          </Hint>
        </>
      )}

      {view === PROTO_VIEWS[0] && (
      <div className="dcols">
        <Panel
          title="Итоговые места"
          extra={<span className="pill live" style={{ margin: 0 }}>РЕЙТИНГ ПЕРЕСЧИТАЕТСЯ ПОСЛЕ ЗАКРЫТИЯ</span>}
        >
          <Rows>
            {PLACES.map((p) => (
              <div className="drow" key={p.pl} style={{ padding: '9px 12px' }}>
                <span className="rank">{p.pl}</span>
                <img src={p.av} alt="" />
                <div className="who"><div className="nm">{p.nm}</div><div className="rl">{p.club}</div></div>
                <div className="amt">{p.res}</div>
              </div>
            ))}
          </Rows>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Протокол сформирован — правка результатов закрыта</div>
            <button className="dpickbtn">
              <Printer size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
              Печать · после утверждения
            </button>
          </div>
        </Panel>

        <Panel title="Протокол турнира">
          <div className="dseg2" style={{ marginBottom: 12 }}>
            {PROTO.map((s) => <span key={s} className={s === 'Формируется' ? 'on' : undefined}>{s}</span>)}
          </div>

          <div className="qsec">Технические победы и снятия · 2</div>
          <Rows>
            <LogRow t="Байжанов А. — неявка" s="1/16 · стол 4 · 12.03, 11:20" p="ТЕХПОБЕДА" />
            <LogRow t="Мұрат Е. — отказ, травма" s="1/8 · стол 9 · 13.03, 15:40" p="СНЯТИЕ" />
          </Rows>

          <div className="qsec">Правки счёта · 5, последние</div>
          <Rows>
            <LogRow t="Стол 3 · 1/16 · 2 : 1 → 2 : 0" s="Оспанов Т. · 12.03, 12:41" p="В ЖУРНАЛЕ" />
            <LogRow t="Стол 7 · 1/32 · 3 : 0 → 3 : 1" s="Жумабеков Р., заместитель · 12.03, 11:05" p="В ЖУРНАЛЕ" />
          </Rows>

          <div style={{ marginTop: 12 }}>
            <Submit>Отправить председателю ГСК</Submit>
          </div>
        </Panel>
      </div>
      )}
    </RoleScreen>
  );
}

/* ── Борд роли ──────────────────────────────────────────────────── */

const Tournament6_1States = () => (
  <States>
    <Shot tone="info" title="Состояние «Приём заявок игроков»" text="«N заявок ждут решения» со ссылкой на Э6.2.">
      <Rows>
        <Row nm="8 заявок ждут решения" sub="Э6.2 · приём открыт до 12.03, 18:00" pill={{ t: 'СРОЧНО', cls: 'bad' }} />
      </Rows>
    </Shot>

    <Shot tone="info" title="Состояние «Система проведения»" text="«Сетка не собрана», «на 2 столах нет судьи» — ссылки на Э6.3 и Э6.5.">
      <Rows>
        <Row nm="Сетка не собрана" sub="Э6.3 · состав закрыт, можно строить" pill={{ t: 'ПОРА', cls: 'wait' }} />
        <Row nm="На 2 столах нет судьи" sub="Э6.5 · матч не стартует без судьи" pill={{ t: 'ДО СТАРТА', cls: 'wait' }} />
      </Rows>
    </Shot>

    <Shot tone="info" title="Состояние «Идёт»" text="«3 пары ждут стола» — ссылка на Э6.6.">
      <Rows>
        <Row nm="3 пары ждут стола" sub="Э6.6 · свободных столов нет" pill={{ t: 'ОЧЕРЕДЬ', cls: 'reg' }} />
      </Rows>
    </Shot>
  </States>
);

const Bids6_2States = () => (
  <States>
    <Shot tone="info" title="Заявок нет" text="Пустое состояние со сроком приёма.">
      <Empty title="Заявок пока нет" text="Приём открыт до 12.03, 18:00." />
    </Shot>

    <Shot tone="warning" title="Заявка с непроходящим игроком" text="Кнопка «Принять» остаётся, но с предупреждением ✳.">
      <Rows>
        <Row nm="Жумабеков Расул" sub="взнос не оплачен · медицинский допуск не приложен" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
      </Rows>
      <Alert>Решение за судьёй: система показывает несоответствие, но не решает за него.</Alert>
    </Shot>

    <Shot tone="info" title="Приём закрыт" text="Списки только на чтение." wide>
      <Rows>
        <Row nm="112 участников · приём закрыт 12.03" sub="решения приняты, состав зафиксирован" pill={{ t: 'СОСТАВ СОБРАН', cls: 'live' }} />
      </Rows>
    </Shot>
  </States>
);

const Bracket6_3States = () => (
  <States>
    <Shot tone="danger" title="Состав не собран" text="Экран закрыт с пояснением: сетку раньше состава не строят.">
      <Empty title="Сетку строить рано" text="Приём заявок ещё открыт: сетка собирается по закрытому составу." />
    </Shot>

    <Shot
      tone="warning"
      title="Ни одна система не укладывается в столы и часы"
      text="Все варианты с красным светофором, судья решает сам."
    >
      <Rows>
        <Row nm="Олимпийская с группами" sub="нужно 9 часов · есть 8" pill={{ t: 'НЕ ВЛЕЗАЕТ', cls: 'bad' }} />
        <Row nm="Круговая" sub="нужно 14 часов · есть 8" pill={{ t: 'НЕ ВЛЕЗАЕТ', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

const Schedule6_4States = () => (
  <States>
    <Shot tone="info" title="Сетки ещё нет" text="Экран пуст, со ссылкой на Э6.3." wide>
      <Empty title="Расписание строится по сетке" text="Сначала соберите сетку — Э6.3." />
    </Shot>
  </States>
);

const Judges6_5States = () => (
  <States>
    <Shot tone="danger" title="На столе нет судьи" text="Слот подсвечен; стол не примет матчи, пока судья не назначен." wide>
      <Rows>
        <Row nm="Стол 7" sub="судья не назначен" pill={{ t: 'НЕТ СУДЬИ', cls: 'bad' }} action="Назначить" />
      </Rows>
      <Alert tone="danger">Матч не стартует, пока на стол не назначен судья.</Alert>
    </Shot>
  </States>
);

const Live6_6States = () => (
  <States>
    <Shot tone="danger" title="Матч не может стартовать" text="На карточке стола причина — «нет судьи».">
      <Rows>
        <Row nm="Стол 7 · Ерлан — Пак" sub="пара вызвана, судьи нет" pill={{ t: 'НЕ СТАРТУЕТ', cls: 'bad' }} />
      </Rows>
    </Shot>

    <Shot tone="warning" title="Обрыв связи у стола" text="Карточка помечена; при расхождении приоритет у судьи стола.">
      <Rows>
        <Row nm="Стол 4" sub="связи нет 2 минуты · счёт ведётся локально" pill={{ t: 'БЕЗ СВЯЗИ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

const Protocol6_7States = () => (
  <States>
    <Shot tone="info" title="Ожидание решения ГСК" text="Экран «протокол на утверждении» — без кнопок правки." wide>
      <Rows>
        <Row nm="Протокол отправлен" sub="председателю ГСК · 20.05, 19:10" pill={{ t: 'НА УТВЕРЖДЕНИИ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э6.8 · Отклонение заявки с причиной ───────────────────────── */

export function Reject6_8() {
  return (
    <RoleScreen role={R06} nav="Заявки" title="Заявки участников" sub="Приём открыт до 12.03, 18:00">
      <Rows>
        <Row nm="Жумабеков Расул" sub="2007 · Караганда · «Шахтёр»" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
        <Row nm="Ерлан Бекзат" sub="2006 · Актобе · спортшкола №3" pill={{ t: 'ЗАЯВКА', cls: 'reg' }} />
      </Rows>

      <Modal
        title="Отклонить заявку с причиной"
        sub="Жумабеков Расул · одиночный разряд"
        foot={
          <>
            <div className="dcount">Причина уйдёт заявителю и останется в журнале</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>Отклонить</button>
            </div>
          </>
        }
      >
        <Rows>
          <Row nm="Годовой взнос" sub="не оплачен" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
          <Row nm="Медицинский допуск" sub="документ не приложен" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
          <Row nm="Возраст" sub="2007 · граница «без ограничения»" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
        </Rows>
        <Form>
          <Input label="Причина" value="нет медицинского допуска и не оплачен годовой взнос" wide />
        </Form>
        <Alert>Проверку система сделала сама, но решение — судьи: он может принять и с замечанием.</Alert>
      </Modal>
    </RoleScreen>
  );
}

const Reject6_8States = () => (
  <States>
    <Shot tone="danger" title="Причина не заполнена" text="Кнопка неактивна.">
      <div className="dfield">
        <div className="k">Причина</div>
        <div className="dval" style={{ color: 'var(--c-danger)' }}>— не заполнена</div>
      </div>
      <Off>Отклонить</Off>
    </Shot>

    <Shot tone="warning" title="Приём уже закрыт ✳" text="В уведомлении не обещаем повторную подачу.">
      <Rows>
        <Row nm="Приём заявок" sub="закрыт 12.03, 18:00" pill={{ t: 'ЗАКРЫТ', cls: 'done' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э6.9 · Формирование итогового протокола ───────────────────── */

export function Finish6_9() {
  return (
    <RoleScreen role={R06} nav="Протокол" title="Итоговый протокол" sub="Чемпионат Казахстана 2026">
      <Rows>
        <Row nm="Сыграно матчей" sub="127 из 127" pill={{ t: 'ВСЁ СЫГРАНО', cls: 'live' }} />
      </Rows>

      <Modal
        title="Сформировать итоговый протокол"
        sub="Чемпионат Казахстана 2026 · шаг необратим"
        foot={
          <>
            <div className="dcount">После формирования ввод результатов закрыт</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>Сформировать</button>
            </div>
          </>
        }
      >
        <Rows>
          <Row nm="Все матчи сыграны" sub="127 из 127" pill={{ t: 'ДА', cls: 'live' }} />
          <Row nm="Незакрытых протестов нет" sub="проверено" pill={{ t: 'ДА', cls: 'live' }} />
          <Row nm="Столы освобождены" sub="20 из 20" pill={{ t: 'ДА', cls: 'live' }} />
        </Rows>
        <Alert>
          Ввод результатов закроется, турнир перейдёт в «Итоговый протокол», а сам протокол уйдёт
          председателю ГСК на утверждение.
        </Alert>
      </Modal>
    </RoleScreen>
  );
}

const Finish6_9States = () => (
  <States>
    <Shot tone="danger" title="Есть несыгранные матчи" text="«Сформировать» неактивна со списком того, что мешает.">
      <Rows>
        <Row nm="Не сыграно матчей" sub="стол 4 — 1/4 финала, стол 9 — за 3-е место" val="2" pill={{ t: 'МЕШАЕТ', cls: 'bad' }} />
      </Rows>
      <Off>Сформировать</Off>
    </Shot>

    <Shot tone="info" title="Протокол уже сформирован" text="Вместо кнопки — состояние «на утверждении».">
      <Rows>
        <Row nm="Протокол отправлен" sub="председателю ГСК · 20.05, 19:10" pill={{ t: 'НА УТВЕРЖДЕНИИ', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  /* Борд роли начинается со входа — как у всех ролей (flows/00): маршрут не
     должен обрываться на середине. Регистрация стоит следом: это путь ДО
     входа, и на карте она ветка входа, а не его корень. */
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
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
  'Э6.1': {
    cap: 'Мой турнир',
    view: () => (
      <>
        <Tournament6_1 />
        <Tournament6_1States />
      </>
    ),
    next: '8 заявок ждут решения',
  },
  'Э6.2': {
    cap: 'Заявки участников',
    view: () => (
      <>
        <Bids6_2 />
        <Bids6_2States />
      </>
    ),
    next: 'закрыть приём',
  },
  'Э6.3': {
    cap: 'Сетка: формат, посев, сборка',
    view: () => (
      <>
        <Bracket6_3 />
        <Bracket6_3States />
      </>
    ),
    next: 'сетка собрана',
  },
  'Э6.4': {
    cap: 'Расписание и столы',
    view: () => (
      <>
        <Schedule6_4 />
        <Schedule6_4States />
      </>
    ),
    next: 'матчи разложены',
  },
  'Э6.5': {
    cap: 'Судьи на столах',
    view: () => (
      <>
        <Judges6_5 />
        <Judges6_5States />
      </>
    ),
    next: 'столы укомплектованы',
  },
  'Э6.6': {
    cap: 'Ход турнира',
    view: () => (
      <>
        <Live6_6 />
        <Live6_6States />
      </>
    ),
    next: 'все матчи сыграны',
  },
  'Э6.7': {
    cap: 'Итоговый протокол',
    view: () => (
      <>
        <Protocol6_7 />
        <Protocol6_7States />
      </>
    ),
  },
  'Э6.8': {
    cap: 'Отклонение заявки с причиной',
    view: () => (
      <>
        <Reject6_8 />
        <Reject6_8States />
      </>
    ),
    next: 'формирование протокола',
  },
  'Э6.9': {
    cap: 'Формирование итогового протокола',
    view: () => (
      <>
        <Finish6_9 />
        <Finish6_9States />
      </>
    ),
  },
};

export function Role06Board() {
  return <Board role={R06} screens={SCREENS} />;
}
