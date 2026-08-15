/* Роль 6 · Главный судья соревнований — макеты по флоу.
   Экраны Э6.1–Э6.7 (см. `flows/06-glavnyy-sudya.md` и схему роли).

   Роль ключевая, и маршрут у неё — это жизненный цикл турнира (§4.3). Поэтому
   значок состояния в шапке меняется от экрана к экрану: «Приём заявок игроков»
   → «Система проведения» → «Идёт» → «Итоговый протокол». Читать борд слева
   направо = смотреть, как турнир проходит свои состояния.

   Блоки, которые заместитель (роль 8) видит один в один, отсюда
   экспортируются: шкала состояний, строка «что требуется», карта столов,
   живые матчи и очередь пар. */

import { Fragment, type ReactNode } from 'react';
import {
  Ban, Check, ChevronRight, ClipboardList, Grid3x3, Lock, Pencil, Printer,
  Radio, Shield, TriangleAlert, X,
} from 'lucide-react';
import {
  A, ActionBar, Arrow, AW, Board, Chips, Hint, Panel, Row, Rows, RoleScreen,
  Screen, Submit,
} from './shell';
import type { ScreenMap } from './shell';
import { FormSeg, PanelSeg } from '../segs';
import { R06 } from './roles';
import { Login0_1 } from './role00';

/* ── Люди турнира ───────────────────────────────────────────────── */

const P = {
  kim: A(44), tok: A(51), gla: A(56), bai: A(85), mur: A(93),
  dos: A(45), ahm: A(67), sar: A(23), sat: A(64), nur: A(53),
  tle: AW(21), ora: AW(65),
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
      <div style={{ marginTop: 12 }}>
        <Hint>Вызов уходит обоим игрокам и судье стола мгновенно (§4.7).</Hint>
      </div>
    </Panel>
  );
}

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
    s: 'Э6.3 · строить сетку раньше состава нельзя (§4.3)', p: 'ПОЗЖЕ', cls: 'reg',
  },
];

export function Tournament6_1() {
  return (
    <RoleScreen
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Мой турнир"
      title="Чемпионат Казахстана 2026"
      sub="Главный республиканский старт · одиночный · г. Астана · 12–14 марта"
      hint="Регламент судья не правит — он его исполняет: условия допуска приходят из положения турнира."
    >
      <Stages cur="Приём заявок игроков" />
      <Chips
        items={[
          { v: '128 / 112', k: 'Заявок подано / принято', tone: 'b' },
          { v: '112', k: 'Участников в составе', tone: 'g' },
          { v: '20', k: 'Столов в зале' },
          { v: '14', k: 'Судей в наряде' },
          { v: '—', k: 'Матчей: сетки ещё нет' },
        ]}
      />

      <div className="mkcols">
        <Panel
          title="Что сейчас требуется"
          extra={<span className="pill wait" style={{ margin: 0 }}>ПРИЁМ ЗАЯВОК ИГРОКОВ</span>}
        >
          <Rows>
            {NEEDS.map((n) => <NeedRow key={n.t} n={n} />)}
          </Rows>
          <div style={{ marginTop: 10 }}>
            <Hint>
              Зона меняется вместе с состоянием турнира: в «Системе проведения» — «сетка не собрана»,
              «на 2 столах нет судьи»; в «Идёт» — «3 пары ждут стола». Каждая строка ведёт на свой экран.
            </Hint>
          </div>
        </Panel>

        <Panel title="Условия допуска турнира" extra={<span className="pill reg" style={{ margin: 0 }}>ТОЛЬКО ЧТЕНИЕ</span>}>
          <div className="dform">
            <div className="dfield"><label>Возрастная граница</label><div className="dval">2003 г.р. и моложе</div></div>
            <div className="dfield"><label>Годовой взнос федерации</label><div className="dval">требуется · ₸ 10 000</div></div>
            <div className="dfield"><label>Ценз по рейтингу</label><div className="dval">от 1800</div></div>
            <div className="dfield"><label>Документы к заявке</label><div className="dval">паспорт, мед. допуск, согласие</div></div>
            <div className="dfield wide">
              <label>Кто вправе подать заявку</label>
              <div className="dval">старший тренер региона — списком (§8.2)</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Hint>От этих условий система считает авто-проверки допуска в заявках (Э6.2).</Hint>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э6.2 · Заявки участников ───────────────────────────────────── */

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

type Ply = { av: string; nm: string; sub: string; v: boolean[]; p: string; cls: 'live' | 'bad' };

const SQUAD: Ply[] = [
  { av: P.kim, nm: 'Ким Георгий', sub: '2003 г.р. · «Алатау» · рейтинг 2401', v: [true, true, true, true], p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.tok, nm: 'Токаев Марат', sub: '2005 г.р. · «Алатау» · рейтинг 2350', v: [true, true, true, true], p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.ahm, nm: 'Ахметов Дархан', sub: '2006 г.р. · «Алатау» · рейтинг 2120', v: [true, true, true, true], p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.tle, nm: 'Тлеуова Аружан', sub: '2011 г.р. · «Достык» · рейтинг 1720', v: [false, false, true, true], p: 'МЛАДШЕ ГРАНИЦЫ · 2011', cls: 'bad' },
  { av: P.bai, nm: 'Байжанов Асхат', sub: '2004 г.р. · «Алатау» · рейтинг 2180', v: [true, true, false, true], p: 'ВЗНОС НЕ ОПЛАЧЕН', cls: 'bad' },
  { av: P.mur, nm: 'Мұрат Ерлан', sub: '2006 г.р. · «Алатау» · рейтинг 2040', v: [true, true, true, false], p: 'НЕТ МЕД. ДОПУСКА', cls: 'bad' },
];

const BIDS = [
  { nm: 'Сборная Алматы · 6 игроков', sub: 'Смагулов А. · 09.03, 11:20', who: 'РЕГИОН', on: true },
  { nm: 'Сборная Караганды · 7 игроков', sub: 'Ахметов К. · 09.03, 14:05', who: 'РЕГИОН' },
  { nm: 'Сборная Шымкента · 5 игроков', sub: 'Ержанов Д. · 10.03, 09:40', who: 'РЕГИОН' },
  { nm: 'Сборная Павлодара · 4 игрока', sub: 'Сейтқали А. · 10.03, 18:12', who: 'РЕГИОН' },
  { nm: 'Сборная Тараза · 3 игрока', sub: 'Бектұров Р. · 11.03, 08:30', who: 'РЕГИОН' },
];

export function Bids6_2() {
  return (
    <RoleScreen
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Заявки"
      title="Заявки участников"
      sub="Состав заявки № 14 · решение по списочной заявке принимается по заявке целиком (§8.2)"
      hint="Отклонённая заявка возвращается с причиной: заявитель правит и подаёт снова, пока приём открыт."
    >
      <FormSeg items={['Ждут решения · 8', 'Приняты · 104', 'Отклонены · 12', 'Отозваны · 4']} />

      <ActionBar count="8 заявок ждут решения · приём открыт до 12.03, 18:00">
        <button className="dpickbtn">
          <Lock size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />
          Закрыть приём
        </button>
      </ActionBar>

      <div className="dcols">
        <Panel
          title="Заявка № 14 · сборная Алматы · 6 игроков"
          extra={<span className="pill reg" style={{ margin: 0 }}>РЕГИОН · старший тренер Смагулов А.</span>}
        >
          <Rows>
            {SQUAD.map((s) => (
              <div className="drow" key={s.nm} style={{ padding: '8px 11px' }}>
                <img src={s.av} alt="" style={{ width: 28, height: 28 }} />
                <div className="who"><div className="nm">{s.nm}</div><div className="rl">{s.sub}</div></div>
                <Checks v={s.v} />
                <span className={'pill ' + s.cls} style={{ margin: 0 }}>{s.p}</span>
              </div>
            ))}
          </Rows>

          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">3 игрока из 6 не проходят проверки допуска</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="dpickbtn">Отклонить с причиной</button>
              <button className="dsubmit" style={{ padding: '9px 16px', fontSize: 12.5 }}>
                <TriangleAlert size={14} />Принять с предупреждением
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Hint>
              Проверки система считает по условиям допуска турнира (Э6.1): 2003 г.р. и моложе, ценз
              от 1800, годовой взнос, документы к заявке.
            </Hint>
          </div>
        </Panel>

        <Panel title="Ждут решения" extra={<span className="pill wait" style={{ margin: 0 }}>8</span>}>
          <div className="qsec">Кто подал заявку</div>
          <Rows>
            {BIDS.map((b) => (
              <div className={'drow' + (b.on ? ' pick' : '')} key={b.nm} style={{ padding: '9px 11px' }}>
                <div className="who">
                  <div className="nm" style={{ fontSize: 12.5 }}>{b.nm}</div>
                  <div className="rl">{b.sub}</div>
                </div>
                <span className="pill reg" style={{ margin: 0 }}>{b.who}</span>
              </div>
            ))}
          </Rows>
          <div style={{ marginTop: 12 }}>
            <Hint>
              Бейдж заявки — путь подачи (§8.2): «РЕГИОН» — список от старшего тренера, «КЛУБ» —
              команда Лиги, «САМ ИГРОК» — открытый турнир. У чемпионата РК путь один: регион.
            </Hint>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э6.3 · Сетка: формат, посев, сборка ────────────────────────── */

/* Подсказка системы (§5.3). Ресурс зала считается один раз: 20 столов × 3 дня
   × 8 часов = 480 стол-часов, средний матч — 35 минут. Светофор сравнивает
   потребность варианта с этим ресурсом, поэтому расчёт раскрывается и
   проверяется руками — судья видит, из чего сложилась оценка. */
type Sys = { nm: string; sum: string; calc: string; idle: string; p: string; cls: 'live' | 'wait' | 'bad'; on?: boolean };

const SYSTEMS: Sys[] = [
  {
    nm: 'Олимпийская (с утешением за 3–4 места)',
    sum: '111 матчей · 65 стол-часов · 14 % ресурса зала',
    calc: 'расчёт: 111 матчей × 35 мин ÷ 20 столов ≈ 3,2 часа чистой игры',
    idle: 'простой: в 1/2 и финале заняты 2 стола из 20 — третий день зал стоит',
    p: 'УКЛАДЫВАЕТСЯ', cls: 'live',
  },
  {
    nm: 'Группы по 4 + плей-офф',
    sum: '223 матча · 130 стол-часов · 27 % ресурса зала',
    calc: 'расчёт: 28 групп × 6 матчей = 168, плей-офф 56 участников = 55; 223 × 35 мин ÷ 20 столов ≈ 6,5 часа',
    idle: 'простоя нет: у каждого участника не меньше трёх матчей',
    p: 'УКЛАДЫВАЕТСЯ', cls: 'live', on: true,
  },
  {
    nm: 'Круговая в 8 группах по 14',
    sum: '728 матчей · 425 стол-часов · 88 % ресурса зала',
    calc: 'расчёт: 8 групп × 91 матч = 728; 728 × 35 мин ÷ 20 столов ≈ 21 час — почти все три дня',
    idle: 'резерв на задержки — полдня: одна затянувшаяся группа сдвинет расписание',
    p: 'ВПРИТЫК', cls: 'wait',
  },
  {
    nm: 'Круговая — все со всеми',
    sum: '6 216 матчей · 3 626 стол-часов · 756 % ресурса зала',
    calc: 'расчёт: 112 × 111 ÷ 2 = 6 216 матчей; при 20 столах и 8 часах в день это 23 дня вместо 3',
    idle: 'не помещается ни в столы, ни в часы',
    p: 'НЕ УКЛАДЫВАЕТСЯ', cls: 'bad',
  },
];

export function Bracket6_3() {
  return (
    <RoleScreen
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Сетка"
      title="Сетка: формат, посев, сборка"
      sub="Состав собран — 112 участников · утверждение сетки коллегией не требуется (§4.6)"
      hint="Подсказка системы рекомендательная: судья видит последствия каждого варианта и решает сам."
    >
      <Chips
        items={[
          { v: '112', k: 'Участников в составе', tone: 'b' },
          { v: '3 × 8 ч', k: 'Дней и часов игры' },
          { v: '20', k: 'Столов в зале' },
          { v: '2', k: 'Возрастные группы' },
          { v: '480', k: 'Стол-часов ресурса', tone: 'g' },
        ]}
      />

      <div className="dcols">
        <Panel
          title="Подсказка системы: чем провести"
          extra={<PanelSeg items={['Свод', 'По кругам']} />}
        >
          <Rows>
            {SYSTEMS.map((s) => (
              <div
                className={'drow' + (s.on ? ' pick' : '')}
                key={s.nm}
                style={{ alignItems: 'flex-start', padding: '9px 12px' }}
              >
                <div className="who">
                  <div className="nm">
                    {s.nm}
                    {s.on && <span className="pill reg" style={{ margin: '0 0 0 8px' }}>РЕКОМЕНДУЕМ</span>}
                  </div>
                  <div className="rl">{s.sum}</div>
                  <div className="rl" style={{ fontSize: 11, color: 'var(--c-dim)' }}>{s.calc}</div>
                  <div className="rl" style={{ fontSize: 11, color: 'var(--c-dim)' }}>{s.idle}</div>
                </div>
                <span className={'pill ' + s.cls} style={{ margin: 0 }}>{s.p}</span>
              </div>
            ))}
          </Rows>
          <div style={{ marginTop: 10 }}>
            <Hint>
              Ресурс зала: 20 столов × 3 дня × 8 часов = 480 стол-часов, средний матч — 35 минут.
              Светофор сравнивает потребность варианта с этим ресурсом (§5.3).
            </Hint>
          </div>
        </Panel>

        <Panel title="Формат и расстановка">
          <div className="dfield" style={{ marginBottom: 14 }}>
            <label>Формат из библиотеки</label>
            <FormSeg
              items={['Олимпийская', 'Двойное выбывание', 'Круговая', 'Группы + плей-офф']}
              active="Группы + плей-офф"
            />
          </div>
          <div className="dfield" style={{ marginBottom: 14 }}>
            <label>Расстановка участников</label>
            <FormSeg items={['Посев по рейтингу', 'Жеребьёвка']} />
          </div>
          <div className="dfield" style={{ marginBottom: 12 }}>
            <label>Сеяных и недостающие слоты</label>
            <div className="dval">16 сеяных · 16 bye добираются автоматически</div>
          </div>
          <Hint>
            Перечень форматов предварительный ⚠ (вопрос 17). Нестандартную структуру собирает
            конструктор (§5.2), удачную конфигурацию сохраняем шаблоном.
          </Hint>
          <div style={{ marginTop: 12 }}>
            <Submit>Собрать сетку</Submit>
          </div>
        </Panel>
      </div>
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

export function Schedule6_4() {
  return (
    <RoleScreen
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Расписание"
      title="Расписание и столы"
      sub="Дни × столы · 127 матчей сетки разложены по трём дням игры"
      hint="Расписание может составить секретарь (Э7.4) — судья проверяет и меняет."
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
      <FormSeg items={['День 1 · 12.03', 'День 2 · 13.03', 'День 3 · 14.03']} />

      <Panel
        title="День 1 · 12 марта · столы 1–8 из 20"
        extra={<PanelSeg items={['Дни × столы', 'Списком']} />}
      >
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
                const bad = CONFLICT[key];
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
                    <div className="tn">{ROUNDS[r]}<span className="st" /></div>
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

        <div style={{ marginTop: 12 }}>
          <Hint>
            Столы с трансляцией отмечены значком (1 и 3). Конфликты подсвечены красным: в 13:00
            участник поставлен и на стол 3, и на стол 6; в 14:30 стол 6 ещё занят предыдущим матчем.
          </Hint>
        </div>
      </Panel>
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

export function Judges6_5() {
  return (
    <RoleScreen
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Судьи на столах"
      title="Судьи на столах"
      sub="Наряд турнира набирает председатель ГСК (Э5.3) — главный судья расставляет его по столам"
      hint="Матч не начнётся, пока на стол не назначен судья."
    >
      <Chips
        items={[
          { v: '20', k: 'Столов в зале', tone: 'b' },
          { v: '14', k: 'Столов в игре' },
          { v: '12', k: 'Столов с судьёй', tone: 'g' },
          { v: '2', k: 'Столов без судьи', tone: 'a' },
          { v: '2', k: 'Судьи свободны' },
        ]}
      />

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
          <div style={{ marginTop: 12 }}>
            <Hint>
              Пустой слот подсвечен: стол не примет матчи, пока судья не назначен (§4.7). Снятие и
              замена судьи пишутся в журнал ✳.
            </Hint>
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
      hint="Правка счёта и техническая победа пишутся в журнал с автором и временем."
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
            <div className="dcount">Правка — в пределах лимита ⚠ §13.1, в журнал с автором</div>
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

export function Protocol6_7() {
  return (
    <RoleScreen
      role={at('ИТОГОВЫЙ ПРОТОКОЛ')}
      nav="Протокол"
      title="Итоговый протокол"
      sub="Все 127 матчей сыграны · ввод результатов заблокирован"
      hint="Свой протокол судья не утверждает — утверждает председатель ГСК (Э5.4)."
    >
      <Chips
        items={[
          { v: '127 / 127', k: 'Матчей сыграно', tone: 'g' },
          { v: '112', k: 'Участников в протоколе', tone: 'b' },
          { v: '2', k: 'Технические победы', tone: 'a' },
          { v: '5', k: 'Правок счёта' },
        ]}
      />

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
    </RoleScreen>
  );
}

/* ── Борд роли ──────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э6.1': {
    cap: 'Мой турнир',
    view: () => <Tournament6_1 />,
    next: '8 заявок ждут решения',
  },
  'Э6.2': {
    cap: 'Заявки участников',
    view: () => <Bids6_2 />,
    next: 'закрыть приём',
  },
  'Э6.3': {
    cap: 'Сетка: формат, посев, сборка',
    view: () => <Bracket6_3 />,
    next: 'сетка собрана',
  },
  'Э6.4': {
    cap: 'Расписание и столы',
    view: () => <Schedule6_4 />,
    next: 'матчи разложены',
  },
  'Э6.5': {
    cap: 'Судьи на столах',
    view: () => <Judges6_5 />,
    next: 'столы укомплектованы',
  },
  'Э6.6': {
    cap: 'Ход турнира',
    view: () => <Live6_6 />,
    next: 'все матчи сыграны',
  },
  'Э6.7': {
    cap: 'Итоговый протокол',
    view: () => <Protocol6_7 />,
  },
};

export function Role06Board() {
  return <Board role={R06} screens={SCREENS} />;
}
