/* Роль 7 · Главный секретарь соревнований — макеты по флоу.
   Экраны Э7.1–Э7.5 (см. `flows/07-glavnyy-sekretar.md` и схему роли).

   Главное, что должны показывать макеты: у турнира два рабочих места, и они
   разведены — **судья решает, секретарь оформляет**. Поэтому у секретаря нет
   экрана заявок, формат сетки приходит от судьи только на чтение, а каждая
   готовая работа заканчивается кнопкой «Передать главному судье». */

import type { ReactNode } from 'react';
import { Printer, RefreshCw, Send, Shuffle } from 'lucide-react';
import {
  A, ActionBar, Alert, Arrow, Board, Chips, Field, Form, Hint, Panel, RoleScreen, Row, Rows, Screen, Shot, States,
} from './shell';
import type { DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { FormSeg, PanelSeg } from '../segs';
import { R07 } from './roles';
import { Login0_1 } from './role00';

/* ── мелочи, общие для экранов роли ─────────────────────────────── */

/** Второстепенное действие: форма кнопки та же, заливки акцентом нет. */
const GHOST = {
  background: 'var(--c-panel)',
  color: 'var(--c-ink)',
  border: '1px solid var(--c-glass-line)',
  boxShadow: 'none',
} as const;

const Ghost = ({ children }: { children: ReactNode }) => (
  <button className="dsubmit" style={{ ...GHOST, fontSize: 13 }}>{children}</button>
);

const GhostPick = ({ children }: { children: ReactNode }) => (
  <button className="dpickbtn" style={{ ...GHOST, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {children}
  </button>
);

type Cls = 'live' | 'wait' | 'bad' | 'reg';
const P = ({ t, cls }: { t: string; cls: Cls }) => (
  <span className={'pill ' + cls} style={{ margin: 0 }}>{t}</span>
);

/** Главное действие секретаря: работа готова — уходит судье. */
const ToJudge = ({ children }: { children: ReactNode }) => (
  <button className="dsubmit" style={{ width: '100%', fontSize: 13 }}>
    <Send size={15} />{children}
  </button>
);

/* ── Э7.1 · Рабочий стол: список работ и решение судьи ───────────── */

export function Desk7_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen
      variant={variant}
      role={R07}
      nav="Рабочий стол"
      title="Рабочий стол секретаря"
      sub="Чемпионат Казахстана 2026 · 18–20.05.2026 · состояние «Система проведения»"
    >
      <Chips
        items={[
          { v: '128', k: 'Участников', tone: 'b' },
          { v: '20', k: 'Столов в зале' },
          { v: '3', k: 'Игровых дня' },
          { v: '1 / 4', k: 'Работ готово', tone: 'a' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Работы по турниру" extra={<P t="СИСТЕМА ПРОВЕДЕНИЯ" cls="reg" />}>
          <Rows>
            <Row
              to="Э7.2"
              nm="Жеребьёвка"
              sub="проведена 14.05, 12:40 · посев по рейтингу · 16 сеяных"
              pill={{ t: 'ПРОВЕДЕНА', cls: 'live' }}
              action="Открыть"
            />
            <Row
              to="Э7.3"
              nm="Сетка"
              sub="олимпийская, 128 участников · собрана 15.05, 09:20"
              pill={{ t: 'У ГЛАВНОГО СУДЬИ', cls: 'wait' }}
              action="Открыть"
            />
            <Row
              to="Э7.4"
              nm="Расписание"
              sub="127 матчей без времени · 20 столов, 8 часов в день"
              pill={{ t: 'НЕ СОСТАВЛЕНО', cls: 'bad' }}
              action="Открыть"
            />
            <Row
              to="Э7.5"
              nm="Протокол"
              sub="откроется, когда матчи сыграны"
              pill={{ t: 'ЖДЁТ МАТЧЕЙ', cls: 'wait' }}
            />
          </Rows>
        </Panel>

        <Panel title="Решение главного судьи · чтение" extra={<P t="ТОЛЬКО ПРОСМОТР" cls="wait" />}>
          <Form>
            <Field label="Система проведения" value="Олимпийская" />
            <Field label="Дисциплина" value="Одиночная" />
            <Field label="Партий в матче" value="до 3 из 5" />
            <Field label="Утешительная сетка" value="нет" />
            <Field label="Дни и столы" value="18–20 мая · 20 столов · 8 часов в день" wide />
          </Form>
          <div style={{ height: 12 }} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э7.2 · Жеребьёвка: жребий или посев по рейтингу ─────────────── */

type SlotRow = { slot: number; av: string; nm: string; club: string; rt: string; tag: string; cls: Cls };

const SLOTS: SlotRow[] = [
  { slot: 1, av: A(32), nm: 'Смагулов Алан', club: 'Алатау · Алматы', rt: '2456', tag: 'ПОСЕВ №1', cls: 'reg' },
  { slot: 128, av: A(44), nm: 'Ким Георгий', club: 'СКА · Астана', rt: '2401', tag: 'ПОСЕВ №2', cls: 'reg' },
  { slot: 65, av: A(51), nm: 'Токаев Марат', club: 'Шымкент', rt: '2350', tag: 'ПОСЕВ №3', cls: 'reg' },
  { slot: 64, av: A(13), nm: 'Пак Сергей', club: 'Иртыш · Павлодар', rt: '2312', tag: 'ПОСЕВ №4', cls: 'reg' },
  { slot: 12, av: A(22), nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', rt: '2290', tag: 'ЖРЕБИЙ', cls: 'wait' },
  { slot: 97, av: A(56), nm: 'Гладун Игорь', club: 'Тараз', rt: '2265', tag: 'ЖРЕБИЙ', cls: 'wait' },
];

const SlotLine = ({ s }: { s: SlotRow }) => (
  <div className="drow" style={{ padding: '9px 11px' }}>
    <span className="rank">{s.slot}</span>
    <img src={s.av} alt="" style={{ width: 30, height: 30 }} />
    <div className="who">
      <div className="nm" style={{ fontSize: 13 }}>{s.nm}</div>
      <div className="rl">{s.club}</div>
    </div>
    <div className="amt">{s.rt}</div>
    <P t={s.tag} cls={s.cls} />
  </div>
);

export function Draw7_2() {
  return (
    <RoleScreen
      role={R07}
      nav="Жеребьёвка"
      title="Жеребьёвка"
      sub="128 участников из принятых заявок · Чемпионат Казахстана 2026"
    >
      <Chips
        items={[
          { v: '128', k: 'Участников', tone: 'b' },
          { v: '16', k: 'Сеяных' },
          { v: '112', k: 'В жребий' },
          { v: '2', k: 'Переброса', tone: 'a' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Предпросмотр слотов" extra={<PanelSeg items={['Слоты', 'Список участников']} />}>
          <ActionBar count="Столбец слева — номер слота в сетке; основание посева видно в строке" />
          <div style={{ height: 10 }} />
          <Rows>
            {SLOTS.map((s) => <SlotLine key={s.slot} s={s} />)}
          </Rows>
        </Panel>

        <Panel title="Способ распределения" extra={<P t="ЧЕРНОВИК ЖРЕБИЯ" cls="wait" />}>
          <div className="dfield">
            <label>Как разводим участников</label>
            <FormSeg items={['Посев по рейтингу', 'Жребий']} />
          </div>
          <div style={{ height: 12 }} />
          <Form>
            <Field label="Основание посева" value="Рейтинг ФНТ РК на 10.05.2026" wide />
            <Field label="Сеяных" value="16 · по разным четвертям" />
            <Field label="Последний жребий" value="14.05.2026, 12:40 · Ким Л." />
          </Form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <button className="dsubmit"><Shuffle size={15} />Провести жеребьёвку</button>
            <Ghost><RefreshCw size={15} />Перебросить жребий</Ghost>
            <ToJudge>Передать главному судье на утверждение</ToJudge>
          </div>
          <div style={{ height: 12 }} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э7.3 · Сетка: секретарь собирает по формату судьи ───────────── */

const BPlayer = ({ av, nm, sc }: { av?: string; nm: string; sc: string }) => (
  <div className="bp">
    {av && <img src={av} alt="" />}
    <span className="n">{nm}</span>
    <span className="s">{sc}</span>
  </div>
);

const BMatch = ({ children }: { children: ReactNode }) => <div className="bmatch">{children}</div>;

export function Bracket7_3() {
  return (
    <RoleScreen
      role={R07}
      nav="Сетка"
      title="Сборка сетки"
      sub="Формат выбрал главный судья: олимпийская · 128 участников · без утешительной сетки"
    >
      <Chips
        items={[
          { v: '128', k: 'Участников', tone: 'b' },
          { v: '7', k: 'Раундов' },
          { v: '64', k: 'Матча в 1/64' },
          { v: '16', k: 'Сеяных', tone: 'g' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Предпросмотр сетки" extra={<PanelSeg items={['Дерево', 'Таблица групп']} />}>
          <div className="bracket" style={{ height: 360 }}>
            <div className="bround">
              <div className="brt">1/8 финала</div>
              <BMatch>
                <BPlayer av={A(32)} nm="Смагулов А." sc="—" />
                <BPlayer av={A(19)} nm="Цой В." sc="—" />
              </BMatch>
              <BMatch>
                <BPlayer av={A(13)} nm="Пак С." sc="—" />
                <BPlayer av={A(60)} nm="Сериков Н." sc="—" />
              </BMatch>
              <BMatch>
                <BPlayer av={A(51)} nm="Токаев М." sc="—" />
                <BPlayer av={A(56)} nm="Гладун И." sc="—" />
              </BMatch>
              <BMatch>
                <BPlayer av={A(44)} nm="Ким Г." sc="—" />
                <BPlayer av={A(22)} nm="Жумабеков Р." sc="—" />
              </BMatch>
            </div>
            <div className="bround">
              <div className="brt">1/4 финала</div>
              <BMatch>
                <BPlayer nm="победитель 1" sc="—" />
                <BPlayer nm="победитель 2" sc="—" />
              </BMatch>
              <BMatch>
                <BPlayer nm="победитель 3" sc="—" />
                <BPlayer nm="победитель 4" sc="—" />
              </BMatch>
            </div>
            <div className="bround">
              <div className="brt">1/2 финала</div>
              <BMatch>
                <BPlayer nm="верхняя половина" sc="—" />
                <BPlayer nm="нижняя половина" sc="—" />
              </BMatch>
            </div>
          </div>
        </Panel>

        <Panel title="Вводные от судьи" extra={<P t="СОБРАНА 15.05" cls="live" />}>
          <Form>
            <Field label="Система проведения" value="Олимпийская" />
            <Field label="Партий в матче" value="до 3 из 5" />
            <Field label="Жеребьёвка" value="проведена 14.05" />
            <Field label="Утешительная сетка" value="нет" />
          </Form>
          <div style={{ height: 12 }} />
          <div className="dhintbox">
            Подсказка системы: 128 участников на 20 столах укладываются в 2 игровых дня по 8 часов.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <ToJudge>Передать главному судье на утверждение</ToJudge>
            <Ghost><RefreshCw size={15} />Пересобрать сетку</Ghost>
          </div>
          <div style={{ height: 12 }} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э7.4 · Расписание: дни × столы, конфликты подсвечены ────────── */

type Slot = { n: number; time?: string; pair?: string; clash?: boolean };

const GRID: Slot[] = [
  { n: 1, time: '10:00', pair: 'Смагулов — Цой' },
  { n: 2, time: '10:00', pair: 'Ким — Сериков' },
  { n: 3, time: '10:00', pair: 'Токаев — Гладун' },
  { n: 4, time: '11:00', pair: 'Смагулов — Пак', clash: true },
  { n: 5, time: '10:00', pair: 'Досжан — Ерлан' },
  { n: 6, time: '10:30', pair: 'Жумабеков — Цой' },
  { n: 7, time: '10:30', pair: 'Пак — Мұрат' },
  { n: 8, time: '10:30', pair: 'Байжанов — Ким' },
  { n: 9, time: '11:00', pair: 'Токаев — Досжан' },
  { n: 10, time: '11:00', pair: 'Гладун — Ерлан' },
  { n: 11, time: '11:00', pair: 'Сериков — Мұрат' },
  { n: 12, time: '11:00', pair: 'Смагулов / Ким — пара', clash: true },
  { n: 13, time: '11:30', pair: 'Цой — Байжанов' },
  { n: 14, time: '11:30', pair: 'Жумабеков — Пак' },
  { n: 15 }, { n: 16 }, { n: 17 }, { n: 18 }, { n: 19 }, { n: 20 },
];

const Tile = ({ s }: { s: Slot }) => (
  <div
    className={'dtable ' + (s.pair ? 'busy' : 'free')}
    style={s.clash ? { borderColor: 'var(--c-warning)' } : undefined}
  >
    <div className="tn">Стол {s.n}<span className="st" /></div>
    {s.time && <div className="sc">{s.time}</div>}
    <div className="pl">{s.pair ?? '—'}</div>
  </div>
);

export function Schedule7_4() {
  return (
    <RoleScreen
      role={R07}
      nav="Расписание"
      title="Расписание"
      sub="18–20 мая · 20 столов · 8 часов в день · день 1 из 3"
    >
      <Chips
        items={[
          { v: '3', k: 'Игровых дня' },
          { v: '20', k: 'Столов', tone: 'b' },
          { v: '127', k: 'Матчей в расписании' },
          { v: '2', k: 'Конфликта', tone: 'a' },
        ]}
      />
      <Panel
        title="Дни × столы"
        extra={<PanelSeg items={['День 1 · 18.05', 'День 2 · 19.05', 'День 3 · 20.05']} />}
      >
        <div className="dtables">
          {GRID.map((s) => <Tile key={s.n} s={s} />)}
        </div>
      </Panel>
      <ActionBar count="2 конфликта · подсвечены на плитках столов">
        <GhostPick>Передать главному судье на проверку</GhostPick>
      </ActionBar>
      <Rows>
        <Row
          av={A(32)}
          nm="Смагулов Алан · два матча в 11:00"
          sub="стол 4 — одиночный 1/8 · стол 12 — парный разряд"
          pill={{ t: 'КОНФЛИКТ', cls: 'bad' }}
          action="Перенести"
        />
      </Rows>
    </RoleScreen>
  );
}

/* ── Э7.5 · Протоколы: секретарь оформляет, отправляет судья ─────── */

type Res = { pl: number; av: string; nm: string; club: string; sc: string };

const RESULTS: Res[] = [
  { pl: 1, av: A(32), nm: 'Смагулов Алан', club: 'Алатау · Алматы', sc: 'финал 4:2' },
  { pl: 2, av: A(44), nm: 'Ким Георгий', club: 'СКА · Астана', sc: 'финал 2:4' },
  { pl: 3, av: A(51), nm: 'Токаев Марат', club: 'Шымкент', sc: '1/2 · 3:4' },
  { pl: 4, av: A(13), nm: 'Пак Сергей', club: 'Иртыш · Павлодар', sc: '1/2 · 2:4' },
  { pl: 5, av: A(22), nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', sc: '1/4 · 1:4' },
];

const ResRow = ({ r }: { r: Res }) => (
  <div className="drow" style={{ padding: '9px 11px' }}>
    <span className="rank">{r.pl}</span>
    <img src={r.av} alt="" style={{ width: 30, height: 30 }} />
    <div className="who">
      <div className="nm" style={{ fontSize: 13 }}>{r.nm}</div>
      <div className="rl">{r.club}</div>
    </div>
    <div className="amt">{r.sc}</div>
  </div>
);

export function Protocols7_5() {
  return (
    <RoleScreen
      role={R07}
      nav="Протоколы"
      title="Оформление протокола"
      sub="Чемпионат Казахстана 2026 · матчи сыграны 20.05.2026"
    >
      <Chips
        items={[
          { v: '127', k: 'Матчей сыграно', tone: 'b' },
          { v: '2', k: 'Технические победы' },
          { v: '1', k: 'Неявка', tone: 'a' },
          { v: '20.05', k: 'Последний игровой день' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Итоговый протокол" extra={<PanelSeg items={['Итоговый', 'Протоколы матчей']} />}>
          <ActionBar count="Места 1–5 из 128 · таблица собрана из результатов матчей" />
          <div style={{ height: 10 }} />
          <Rows>
            {RESULTS.map((r) => <ResRow key={r.pl} r={r} />)}
          </Rows>
        </Panel>

        <Panel title="Оформление" extra={<P t="В РАБОТЕ" cls="wait" />}>
          <Form>
            <Field label="Дата составления" value="20.05.2026" />
            <Field label="Место проведения" value="Астана, ЦСКА" />
            <Field label="Главный судья" value="Оспанов Т." />
            <Field label="Главный секретарь" value="Ким Л." />
            <Field label="Состав бригады" value="14 человек · из наряда коллегии" wide />
            <Field label="Подписи" value="главный судья и главный секретарь" wide />
          </Form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <ToJudge>Передать главному судье на утверждение</ToJudge>
            <Ghost><Printer size={15} />Печать протоколов</Ghost>
          </div>
          <div style={{ height: 12 }} />
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Борд роли: пять экранов маршрута подряд ─────────────────────── */

const Desk7_1States = () => (
  <States>
    <Shot
      tone="info"
      title="До «Системы проведения» работы закрыты"
      text="Пояснение «идёт приём заявок»; экрана заявок у секретаря нет."
      wide
    >
      <Rows>
        <Row nm="Жеребьёвка" sub="откроется, когда закроется приём заявок" pill={{ t: 'ЖДЁТ СОСТАВА', cls: 'done' }} />
        <Row nm="Сетка" sub="строится после жеребьёвки" pill={{ t: 'ЖДЁТ', cls: 'done' }} />
      </Rows>
      <Alert>Состав ещё собирается: заявки принимает главный судья, секретарь их не видит.</Alert>
    </Shot>
  </States>
);

const Protocols7_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Протокол возвращён коллегией"
      text="Секретарь видит причину и правит оформление; исправление результатов — не его право."
      wide
    >
      <Rows>
        <Row
          nm="Кубок Республики Казахстан 2026"
          sub="вернул Мукашев Б., 21.05 · «в парном разряде не указан второй номер пары»"
          pill={{ t: 'ВОЗВРАЩЁН', cls: 'bad' }}
        />
      </Rows>
      <Alert>Правится оформление протокола. Счёт и результаты меняет главный судья.</Alert>
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
  'Э7.1': {
    cap: 'Рабочий стол секретаря',
    view: () => (
      <>
        <Desk7_1 />
        <Desk7_1States />
      </>
    ),
    next: 'работа «Жеребьёвка»',
  },
  'Э7.2': {
    cap: 'Жеребьёвка',
    view: () => <Draw7_2 />,
    next: 'после жеребьёвки',
  },
  'Э7.3': {
    cap: 'Сетка — сборка',
    view: () => <Bracket7_3 />,
    next: 'работа «Расписание»',
  },
  'Э7.4': {
    cap: 'Расписание',
    view: () => <Schedule7_4 />,
    next: 'матчи сыграны',
  },
  'Э7.5': {
    cap: 'Протоколы',
    view: () => (
      <>
        <Protocols7_5 />
        <Protocols7_5States />
      </>
    ),
  },
};

export function Role07Board() {
  return <Board role={R07} screens={SCREENS} />;
}
