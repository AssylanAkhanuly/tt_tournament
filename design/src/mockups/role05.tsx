/* Роль 5 · Председатель ГСК — макеты по флоу.
   Экраны Э5.1–Э5.7 (см. `flows/05-predsedatel-gsk.md` и схему роли).

   Две мысли, которые макеты обязаны передать:
   1. роль утверждает, а не подменяет — сетку и расписание строит главный судья
      (TZ §4.6), председатель назначает судью и утверждает протокол;
   2. рейтинг судей считается по Положению (TZ §7.2): R = S1 + S2 + S3 + S4,
      коэффициент 1,5 за роль и за выезд, окно апелляций — 10 дней. */

import type { ReactNode } from 'react';
import { BadgeCheck, Ban, Check, Megaphone, Paperclip, Undo2, UserPlus } from 'lucide-react';
import { ActionBar, Arrow, Board, Chips, Field, Form, Hint, Panel, Row, Rows, RoleScreen, Screen, A, AW } from './shell';
import { R05 } from './roles';
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

/* ── Э5.1 · Мои соревнования: две очереди решений ────────────────── */

export function Queues5_1() {
  return (
    <RoleScreen
      role={R05}
      nav="Мои соревнования"
      title="Мои соревнования"
      sub="Сезон 2026 · официальные старты, где решение за коллегией"
      hint="Сетку и расписание строит главный судья, коллегия их не утверждает (§4.6). Назначить турнир самому себе председатель не может."
    >
      <Chips
        items={[
          { v: '3', k: 'Ждут назначения судьи', tone: 'a' },
          { v: '2', k: 'Ждут утверждения протокола', tone: 'b' },
          { v: '41', k: 'Заявок судей подано', tone: 'g' },
          { v: '8', k: 'Официальных стартов' },
        ]}
      />

      <div className="mkcols">
        <Panel title="Ждут назначения судьи" extra={<P t="3 ТУРНИРА" cls="wait" />}>
          <Rows>
            <Row
              nm="Кубок Республики Казахстан 2026"
              sub="Караганда · 12–15.09 · подано 9 заявок судей"
              pill={{ t: '31 ДЕНЬ ДО СТАРТА', cls: 'reg' }}
            />
            <Row
              nm="Первенство РК до 19 лет"
              sub="Шымкент · 24–27.08 · подано 6 заявок судей"
              pill={{ t: '12 ДНЕЙ ДО СТАРТА', cls: 'wait' }}
            />
            <Row
              nm="Открытый турнир «Тараз Опен»"
              sub="Тараз · 16–17.08 · подано 3 заявки судей"
              pill={{ t: '4 ДНЯ ДО СТАРТА', cls: 'bad' }}
            />
          </Rows>
        </Panel>

        <Panel title="Ждут утверждения протокола" extra={<P t="2 ПРОТОКОЛА" cls="wait" />}>
          <Rows>
            <Row
              nm="«Алатау Опен» 2026"
              sub="сыгран 09.08 · главный судья Оспанов Т."
              pill={{ t: 'ЖДЁТ 3 ДНЯ', cls: 'wait' }}
            />
            <Row
              nm="Первенство РК до 15 лет"
              sub="сыгран 02.08 · главный судья Токаев М."
              pill={{ t: 'ЖДЁТ 10 ДНЕЙ', cls: 'bad' }}
            />
          </Rows>
        </Panel>
      </div>

      <ActionBar count="Остальные официальные старты сезона · для обзора, отмены и переноса" />
      <Rows>
        <Row
          nm="Чемпионат Казахстана 2026"
          sub="Астана · 18–20.05 · протокол утверждён 24.05"
          pill={{ t: 'ЗАВЕРШЁН', cls: 'live' }}
        />
        <Row
          nm="Кубок вызова, 1-й тур"
          sub="Актобе · 03–05.10 · приём заявок судей ещё не открыт"
          pill={{ t: 'ЧЕРНОВИК', cls: 'wait' }}
          action="Открыть приём заявок судей"
        />
      </Rows>
    </RoleScreen>
  );
}

/* ── Э5.2 · Заявки судей: по каждому видно, кого назначаешь ──────── */

type Cand = {
  av: string;
  nm: string;
  cat: string;
  reg: string;
  r: string;
  place: string;
  season: string;
  last: string;
  /** судья из другого региона — на республиканских идёт коэффициент 1,5 (§7.2) */
  away?: boolean;
};

const CANDS: Cand[] = [
  { av: A(76), nm: 'Оспанов Тимур', cat: 'Национальная категория', reg: 'Астана', r: '27,5', place: '№1', season: '6', last: 'Чемпионат РК, гл. судья', away: true },
  { av: A(13), nm: 'Пак Сергей', cat: 'Первая категория', reg: 'Павлодар', r: '18', place: '№3', season: '5', last: '«Алатау Опен», судья', away: true },
  { av: AW(65), nm: 'Абдрахманова Сауле', cat: 'Первая категория', reg: 'Караганда', r: '12,5', place: '№5', season: '4', last: 'Первенство до 15, секретарь' },
  { av: A(19), nm: 'Цой Виктор', cat: 'Первая категория', reg: 'Караганда', r: '9,5', place: '№6', season: '3', last: 'Кубок Караганды, судья' },
  { av: A(22), nm: 'Жумабеков Расул', cat: 'Судья по спорту', reg: 'Караганда', r: '7', place: '№19', season: '2', last: 'Кубок Караганды, судья' },
];

const CandRow = ({ c }: { c: Cand }) => (
  <div className="drow">
    <img src={c.av} alt="" />
    <div className="who">
      <div className="nm">{c.nm}</div>
      <div className="rl">{c.cat} · {c.reg} · {c.last}</div>
    </div>
    <div className="rt">
      <div><div className="v">{c.r}</div><div className="k">Рейтинг R</div></div>
      <div><div className="v">{c.place}</div><div className="k">Место</div></div>
      <div><div className="v">{c.season}</div><div className="k">Турниров</div></div>
    </div>
    {c.away ? <P t="ВЫЕЗД · К 1,5" cls="reg" /> : <P t="СВОЙ РЕГИОН" cls="wait" />}
    <button className="dpickbtn">Назначить</button>
    <GhostPick>Отклонить</GhostPick>
  </div>
);

export function Applications5_2() {
  return (
    <RoleScreen
      role={R05}
      nav="Заявки судей"
      title="Заявки судей на турнир"
      sub="Кубок Республики Казахстан 2026 · Караганда · 12–15.09.2026"
      hint="Экран живёт, пока сохраняется конкурс заявок (⚠ 12.6). При прямом назначении здесь будет тот же список, но из реестра судей."
    >
      <Chips
        items={[
          { v: '9', k: 'Заявок судей', tone: 'b' },
          { v: '25.08', k: 'Приём заявок до' },
          { v: '4', k: 'Национальная категория' },
          { v: '4', k: 'Из других регионов', tone: 'a' },
        ]}
      />
      <ActionBar count="9 заявок по рейтингу R · в строке: категория, регион и последний турнир с ролью">
        <GhostPick>Журнал начислений судьи</GhostPick>
      </ActionBar>
      <Rows>
        {CANDS.map((c) => <CandRow key={c.nm} c={c} />)}
      </Rows>
      <Hint>
        Назначение переводит турнир в «Судья назначен»: назначенному уходит уведомление, остальным — отказ.
        Отклонённый судья может подать заявку снова, пока приём открыт.
      </Hint>
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
      hint="Здесь только состав бригады. Кто на каком столе — решает главный судья на этапе системы проведения (Э6.5)."
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
      <Hint>
        Добавление даёт человеку роль «судья» с областью-турниром и сроком; снятие — только с причиной,
        судья получает уведомление. Кто на каком столе — не здесь: столы распределяет главный судья (Э6.5).
      </Hint>
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
      hint="Утверждение переводит турнир в «Завершён» и запускает пересчёт рейтинга. Возврат снова открывает ввод результатов главному судье."
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
      sub="R = S1 + S2 + S3 + S4 · пересчёт при каждом начислении · S1, S3 и S4 обнуляются с 1 января"
      hint="S1 и S2 система начисляет сама. Итоговый S1 по турниру и правки по апелляциям вносит председатель — каждая запись попадает в журнал."
    >
      <Chips
        items={[
          { v: '86', k: 'Судей в рейтинге', tone: 'b' },
          { v: '7', k: 'Документов на проверке', tone: 'a' },
          { v: '05.08', k: 'Последняя публикация', tone: 'g' },
          { v: '5', k: 'Без зачёта' },
        ]}
      />
      <div className="mkcols" style={{ gridTemplateColumns: '1.7fr 1fr' }}>
        <Panel title="Таблица рейтинга" extra={<GhostPick>Документы на проверке · 7</GhostPick>}>
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
          <Hint>
            Зачёт — при баллах не менее чем в трёх категориях из четырёх и обязательных S1 и S2.
            Коэффициент 1,5 идёт за роль главного судьи, зама или секретаря и за выезд в другой регион.
          </Hint>
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
      sub="Очередь рейтинговой комиссии · баллы предзаполнены по таблицам Положения"
      hint="Документ о категории обновляет категорию в профиле — дальше S2 идёт автоматически. Отклонение только уведомляет судью: оспорить можно после публикации рейтинга."
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
          <Hint>Система подсказала 3 × 1,5 по таблице 3 — председатель может поправить число перед приёмом.</Hint>
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
      sub="Сезон 2026 · опубликован 05.08.2026 · окно апелляций открыто до 15.08.2026"
      hint="Оспорить рейтинг можно только после публикации и только 10 дней. Комиссия рассматривает апелляцию 10 рабочих дней, решение окончательное."
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
          <Hint>
            Публикация заново открывает окно на 10 дней. Когда окно закрыто, форма подачи у судей исчезает
            и поздние обращения не принимаются. По итогам года — номинации Gold, Silver и Bronze, топ-10 в каждой.
          </Hint>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Борд роли: семь экранов маршрута подряд ─────────────────────── */

export function Role05Board() {
  return (
    <Board role={R05}>
      <Screen code="Э0.1" cap="Вход">
        <Login0_1 />
      </Screen>
      <Arrow lbl="первый экран роли" />
      <Screen code="Э5.1" cap="Мои соревнования">
        <Queues5_1 />
      </Screen>
      <Arrow lbl="очередь «ждут назначения»" />
      <Screen code="Э5.2" cap="Заявки судей">
        <Applications5_2 />
      </Screen>
      <Arrow lbl="назначен главный судья" />
      <Screen code="Э5.3" cap="Наряд судей">
        <Brigade5_3 />
      </Screen>
      <Arrow lbl="турнир сыгран · вторая очередь" />
      <Screen code="Э5.4" cap="Протокол на утверждении">
        <Protocol5_4 />
      </Screen>
      <Arrow lbl="меню «Рейтинг судей»" />
      <Screen code="Э5.5" cap="Рейтинг судей">
        <Rating5_5 />
      </Screen>
      <Arrow lbl="счётчик документов" />
      <Screen code="Э5.6" cap="Документы на проверке">
        <Docs5_6 />
      </Screen>
      <Arrow lbl="публикация рейтинга" />
      <Screen code="Э5.7" cap="Публикация и апелляции">
        <Publish5_7 />
      </Screen>
    </Board>
  );
}
