/* Роль 1 · Администратор Федерации — макеты по флоу.
   Экраны Э1.1–Э1.8 (см. `flows/01-admin-federacii.md` и схему роли).

   Роль работает с десктопа и видит всю систему: календарь и турниры, роли,
   реестры, журнал, контент. Полный доступ безопасен потому, что система
   именная — каждое действие попадает в журнал (TZ §12). */

import type { ReactNode } from 'react';
import { Download, Eye, Merge, Plus, Send, UserPlus } from 'lucide-react';
import {
  A, ActionBar, Arrow, AW, Board, Chips, Empty, Field, Form, Hint, Panel, RoleScreen, Row, Rows, Screen,
} from './shell';
import { R01 } from './roles';

/* ── Общие мелочи роли ──────────────────────────────────────────── */

/** Значок состояния: те же классы, что у принятых экранов (`pill live|wait|bad|reg|done`). */
export const P = ({ t, cls }: { t: string; cls: string }) => (
  <span className={'pill ' + cls} style={{ margin: 0, whiteSpace: 'nowrap' }}>{t}</span>
);

/** Второстепенная кнопка с иконкой: `dpickbtn` — не флекс-контейнер, а иконки
    в макетном слое блочные, поэтому раскладку задаём здесь. */
export const Btn = ({ children }: { children: ReactNode }) => (
  <button className="dpickbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {children}
  </button>
);

/** Пара строк-подсказок под списком: чтобы плашки не слипались. */
export const Notes = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{children}</div>
);

/** Соревнование в списке: название, где и когда, судья, заявки, состояние. */
type Tour = { nm: string; mt: string; apps: string; judge?: string; st: string; cls: string };

const TOURS: Tour[] = [
  { nm: 'Кубок Республики Казахстан 2026', mt: 'Главный старт · Астана · 18–20 мая', apps: '128 / 96', judge: 'Оспанов Т.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'Первенство РК · 2010 г.р. и моложе', mt: 'Главный старт · Алматы · 3–5 июня', apps: '96 / 71', judge: 'Токаев М.', st: 'ЗАЯВКИ ИГРОКОВ', cls: 'live' },
  { nm: 'Евразийская лига · 2-й тур', mt: 'Лига · Караганда · 11–12 апреля', apps: '12 команд', judge: 'Пак С.', st: 'СИСТЕМА ПРОВЕДЕНИЯ', cls: 'wait' },
  { nm: 'ОРТ «Кубок Иртыша»', mt: 'ОРТ · Павлодар · 25 апреля', apps: '34 / 34', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' },
  { nm: 'ОРТ «Шымкент Open»', mt: 'ОРТ · Шымкент · 9 мая', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'Открытие сезона 2026', mt: 'Главный старт · Астана · 17–19 января', apps: '142 / 138', judge: 'Мукашев Б.', st: 'ЗАВЕРШЁН', cls: 'done' },
];

/** Строка календаря. `judge` — показывать ли колонку главного судьи:
    не назначен — прочерк с подсветкой, как требует флоу. */
export const TourRow = ({ t, judge }: { t: Tour; judge?: boolean }) => (
  <div className="drow">
    <div className="who">
      <div className="nm">{t.nm}</div>
      <div className="rl">{t.mt}</div>
    </div>
    {judge &&
      (t.judge ? (
        <div className="amt" style={{ color: 'var(--c-muted)' }}>{t.judge}</div>
      ) : (
        <div className="amt" style={{ color: 'var(--c-warning)' }}>— судьи нет</div>
      ))}
    <div className="amt">{t.apps}</div>
    <P t={t.st} cls={t.cls} />
  </div>
);

/** Плитки «Требует внимания» — общие с обзорной панелью менеджеров (Э3.1). */
export const ATTENTION = [
  { v: '3', k: 'Без главного судьи' },
  { v: '5', k: 'Регламент не заполнен', tone: 'a' as const },
  { v: '12', k: 'Заявки без решения > 3 дней', tone: 'a' as const },
  { v: '96', k: 'Взносы не оплачены', tone: 'b' as const },
];

/** «Сегодня идут» — пустая зона: сегодня ни один турнир не в состоянии «Идёт». */
export const TodayEmpty = () => (
  <Empty
    title="Сегодня матчей нет"
    text="Ближайший старт — Кубок Республики Казахстан, 18 мая, Астана. Здесь появятся турниры в состоянии «Идёт» со счётом сыгранных матчей."
  />
);

/* ── Э1.1 · Панель Федерации ───────────────────────────────────── */

export function Dash1_1() {
  return (
    <RoleScreen
      role={R01}
      nav="Панель"
      title="Панель Федерации"
      sub="Сезон 2026 · 8 главных стартов, 24 ОРТ, Евразийская лига — 4 тура"
      hint="Полный доступ безопасен потому, что система именная: каждое действие пишется в журнал с автором и временем (§12)."
    >
      <Chips items={ATTENTION} />
      <ActionBar count="Требует внимания · каждая плитка открывает список с готовым фильтром">
        <button className="dsubmit" style={{ padding: '10px 14px' }}>
          <Plus size={15} /> Завести соревнование
        </button>
      </ActionBar>
      <div className="mkcols">
        <Panel title="Ближайшие старты">
          <Rows>
            {TOURS.slice(0, 5).map((t) => (
              <TourRow key={t.nm} t={t} />
            ))}
          </Rows>
        </Panel>
        <Panel title="Сегодня идут">
          <TodayEmpty />
          <Notes>
            <Hint>Зона «Требует внимания» пустеет так же — с подписью «всё в порядке».</Hint>
          </Notes>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э1.2 · Календарь сезона ───────────────────────────────────── */

export function Cal1_2() {
  return (
    <RoleScreen
      role={R01}
      nav="Календарь"
      title="Календарь сезона"
      sub="2026 год · 32 соревнования: главные старты, Лига, ОРТ"
      hint="Название возрастного первенства собирается из сезона и правила «год рождения и моложе», а не пишется строкой (§4.1)."
    >
      <div className="dactionbar">
        <div className="dseg2">
          <span className="on">Все категории</span>
          <span>Главный старт</span>
          <span>Лига</span>
          <span>ОРТ</span>
        </div>
        <div className="dseg2">
          <span className="on">Список</span>
          <span>Сетка месяцев</span>
        </div>
      </div>
      <ActionBar count="32 соревнования · поиск: «кубок» · фильтры: пол — любой, возраст — любой, город — все, состояние — любое">
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>
            <Download size={14} /> Выгрузить календарь
          </Btn>
          <button className="dsubmit" style={{ padding: '10px 14px' }}>
            <Plus size={15} /> Завести соревнование
          </button>
        </div>
      </ActionBar>
      <Rows>
        {TOURS.map((t) => (
          <TourRow key={t.nm} t={t} judge />
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* ── Э1.3 · Карточка турнира ───────────────────────────────────── */

/** Восемь состояний турнира (TZ §4.3) — шкала с подсветкой текущего. */
const STAGES = [
  'Черновик',
  'Приём заявок судей',
  'Судья назначен',
  'Приём заявок игроков',
  'Система проведения',
  'Идёт',
  'Итоговый протокол',
  'Завершён',
];
const NOW_STAGE = 'Судья назначен';

const TABS = ['Регламент', 'Заявки', 'Сетка', 'Расписание', 'Судьи', 'Протокол', 'Журнал'];

export function Tour1_3() {
  return (
    <RoleScreen
      role={R01}
      nav="Календарь"
      title="Кубок Республики Казахстан 2026"
      sub="Главный старт · г. Астана · 18–20 мая · подано 128 заявок, принято 96"
      hint="«Опубликовать» доступно в состоянии «Судья назначен»: турнир становится виден публично и открывается приём заявок игроков."
    >
      <div>
        <div className="dcount" style={{ marginBottom: 8 }}>Состояние турнира — восемь состояний по §4.3</div>
        <div className="dseg2">
          {STAGES.map((s) => (
            <span key={s} className={s === NOW_STAGE ? 'on' : undefined}>{s}</span>
          ))}
        </div>
      </div>
      <div className="ttabs">
        {TABS.map((t) => (
          <span key={t} className={'ttab' + (t === 'Регламент' ? ' on' : '')}>{t}</span>
        ))}
      </div>
      <div className="mkcols">
        <Panel title="Регламент" extra={<P t={NOW_STAGE.toUpperCase()} cls="reg" />}>
          <Form>
            <Field label="Даты" value="18–20 мая 2026" />
            <Field label="Город" value="Астана · ДС «Барыс»" />
            <Field label="Разряды" value="Одиночный · парный" />
            <Field label="Формат" value="Олимпийская с группами" />
            <Field label="Столов" value="16 · трансляция со столов 1–4" />
            <Field label="Возрастная граница" value="без ограничения" />
            <Field
              label="Условия допуска (§4.2)"
              value="годовой взнос обязателен · документы к заявке обязательны · ценз по рейтингу не требуется"
              wide
            />
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Правка после «Черновика» сохраняется с автором и уходит в журнал</div>
            <button className="dpickbtn">Править регламент</button>
          </div>
        </Panel>

        <Panel title="Действия по турниру">
          <button className="dsubmit" style={{ width: '100%' }}>
            <Send size={15} /> Опубликовать
          </button>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">До состояния «Завершён»</div>
            <button className="dpickbtn">Отменить / перенести</button>
          </div>
          <Notes>
            <Hint>Отмена или перенос заявки не удаляет: они сохраняются, а заявители получают уведомление.</Hint>
            <Hint>
              ⚠ Открытый вопрос: в документе федерации есть «подтверждение изменений», но не сказано, каких —
              правок реестров, результатов или платежей.
            </Hint>
          </Notes>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э1.4 · Форма «Завести соревнование» ───────────────────────── */

const STEPS = ['1 · Категория', '2 · Основное', '3 · Допуск', '4 · Флаги', '5 · Столы'];

export function New1_4() {
  return (
    <RoleScreen
      role={R01}
      nav="Календарь"
      title="Завести соревнование"
      sub="Шаг 5 из 5 · столы и трансляция"
      hint="Соревнование создаётся в состоянии «Черновик»: публично не видно, пока не опубликовано."
    >
      <div className="dseg2">
        {STEPS.map((s) => (
          <span key={s} className={s === '5 · Столы' ? 'on' : undefined}>{s}</span>
        ))}
      </div>
      <div className="mkcols">
        <Panel title="Шаги 1–3 · категория, основное, допуск">
          <Form>
            <Field label="Категория" value="Главный старт" />
            <Field label="Название" value="Первенство РК · 2012 г.р. и моложе" />
            <Field label="Город" value="Актобе" />
            <div className="dfield">
              <div className="k">Окно дат</div>
              <div className="dval" style={{ color: 'var(--c-warning)' }}>— не выбрано</div>
            </div>
            <Field label="Разряды" value="Одиночный · парный" />
            <Field label="Ценз по рейтингу" value="не требуется" />
            <Field
              label="Возрастная граница"
              value="правило от сезона: «2012 г.р. и моложе» — не строка в названии"
              wide
            />
          </Form>
        </Panel>

        <Panel title="Шаг 4 · флаги допуска · Шаг 5 · столы">
          <Rows>
            <Row nm="Годовой взнос федерации" sub="умолчание категории «Главный старт»" pill={{ t: 'ВКЛЮЧЁН', cls: 'live' }} />
            <Row nm="Документы к заявке" sub="удостоверение личности, медицинский допуск" pill={{ t: 'ВКЛЮЧЁН', cls: 'live' }} />
            <div className="drow">
              <div className="who">
                <div className="nm">Ценз по рейтингу</div>
                <div className="rl">переопределён вручную для первенства</div>
              </div>
              <P t="ВЫКЛЮЧЕН" cls="done" />
            </div>
          </Rows>
          <div style={{ marginTop: 12 }}>
            <Form>
              <Field label="Сколько столов" value="12" />
              <Field label="С трансляцией" value="столы 1 и 2" />
            </Form>
          </div>
        </Panel>
      </div>
      <div className="dactionbar">
        <div className="dcount" style={{ color: 'var(--c-warning)' }}>
          Заполните обязательное поле «Окно дат» — без него соревнование не создать
        </div>
        <button
          className="dsubmit"
          style={{ padding: '12px 18px', background: 'var(--c-panel-3)', color: 'var(--c-dim)', boxShadow: 'none' }}
        >
          Создать
        </button>
      </div>
    </RoleScreen>
  );
}

/* ── Э1.5 · Пользователи и роли ────────────────────────────────── */

type User = { av: string; nm: string; roles: string; st: string; cls: string };

const USERS: User[] = [
  { av: A(76), nm: 'Оспанов Тимур', roles: 'Главный судья · Кубок РК · до 20.05.2026', st: 'АКТИВЕН', cls: 'live' },
  { av: A(13), nm: 'Пак Сергей', roles: 'Судья · Кубок РК · до 20.05.2026 · и ещё 1 роль', st: 'АКТИВЕН', cls: 'live' },
  { av: A(76), nm: 'Мукашев Бекзат', roles: 'Председатель ГСК · система · бессрочно', st: 'АКТИВЕН', cls: 'live' },
  { av: AW(21), nm: 'Тлеуова Аружан', roles: 'Менеджер · только чтение · система · до 31.12.2026', st: 'АКТИВЕН', cls: 'live' },
  { av: A(45), nm: 'Досжан Марат', roles: 'Администратор клуба «Алатау» · клуб · до 31.12.2026', st: 'ОТКЛЮЧЁН', cls: 'bad' },
];

export function Users1_5() {
  return (
    <RoleScreen
      role={R01}
      nav="Пользователи"
      title="Пользователи и роли"
      sub="Единственный экран, где выдают роли: роль · область · срок"
      hint="Роль главного судьи на официальный турнир этот экран не выдаёт: судью назначает председатель ГСК через заявки (§4.4)."
    >
      <ActionBar count="214 учётных записей · поиск: «пак» · фильтры: роль — любая, область — Кубок РК">
        <button className="dsubmit" style={{ padding: '10px 14px' }}>
          <UserPlus size={15} /> Завести аккаунт
        </button>
      </ActionBar>
      <div className="mkcols">
        <Panel title="Учётные записи">
          <Rows>
            {USERS.map((u) => (
              <Row
                key={u.nm}
                av={u.av}
                nm={u.nm}
                sub={u.roles}
                pill={{ t: u.st, cls: u.cls === 'live' ? 'live' : 'bad' }}
                action="Выдать роль"
              />
            ))}
          </Rows>
        </Panel>

        <Panel title="Пак Сергей · карточка" extra={<P t="АКТИВЕН" cls="live" />}>
          <Form>
            <Field label="Телефон" value="+7 705 431 20 18" />
            <Field label="Почта" value="s.pak@ttfrk.kz" />
          </Form>
          <div className="dcount" style={{ margin: '12px 0 8px' }}>Роли · кто выдал и когда</div>
          <Rows>
            <Row nm="Судья · Кубок РК" sub="выдала Абаева Д., 10.04.2026 · до 20.05.2026" action="Отозвать" />
            <Row nm="Судья стола · стол 4" sub="выдал Оспанов Т., 15.04.2026 · до 20.05.2026" action="Отозвать" />
          </Rows>
          <Notes>
            <Hint>Отзыв закрывает доступ сразу, а история действий человека остаётся в журнале (§12).</Hint>
          </Notes>
        </Panel>
      </div>
    </RoleScreen>
  );
}

/* ── Э1.6 · Реестры ────────────────────────────────────────────── */

type Athlete = { av: string; nm: string; sub: string; rt: string; st: string; cls: 'live' | 'wait' | 'bad' };

const ATHLETES: Athlete[] = [
  { av: A(32), nm: 'Смагулов Алан', sub: '2004 · Алматы · «Алатау» · тренер Смагулов А. · КМС', rt: '2456', st: 'ВЗНОС ОПЛАЧЕН', cls: 'live' },
  { av: A(44), nm: 'Ким Георгий', sub: '2003 · Астана · СКА · тренер Гладун И. · МС', rt: '2401', st: 'ВЗНОС ОПЛАЧЕН', cls: 'live' },
  { av: A(13), nm: 'Пак Сергей', sub: '2005 · Павлодар · «Иртыш» · тренер Ким Л. · КМС', rt: '2312', st: 'ВЗНОС ОПЛАЧЕН', cls: 'live' },
  { av: A(22), nm: 'Жумабеков Расул', sub: '2007 · Караганда · «Шахтёр» · тренер Досжан М. · 1 разряд', rt: '2290', st: 'ВЗНОС НЕ ОПЛАЧЕН', cls: 'wait' },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: 'завёл клуб «Достык», 03.02.2026 · 2009 · Шымкент · 2 разряд', rt: '1980', st: 'ВЗНОС НЕ ОПЛАЧЕН', cls: 'wait' },
  { av: A(75), nm: 'Ерлан Бекзат', sub: '2006 · Актобе · спортшкола №3 · тренер Токаев М. · 1 разряд', rt: '2105', st: 'ВЗНОС ОПЛАЧЕН', cls: 'live' },
];

export function Reg1_6() {
  return (
    <RoleScreen
      role={R01}
      nav="Реестры"
      title="Реестры"
      sub="Спортсмены, судьи, тренеры, клубы и организации (§9.1)"
      hint="У записи, заведённой клубом или самим человеком, виден источник — это важно для разбора дублей."
    >
      <div className="ttabs">
        <span className="ttab on">Спортсмены · 5 210</span>
        <span className="ttab">Судьи · 214</span>
        <span className="ttab">Тренеры · 96</span>
        <span className="ttab">Клубы и организации · 78</span>
      </div>
      <ActionBar count="5 210 спортсменов · поиск: «алм» · фильтры: регион Алматы, 2003–2009 г.р.">
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>
            <Merge size={14} /> Объединить дубли
          </Btn>
          <button className="dsubmit" style={{ padding: '10px 14px' }}>
            <Plus size={15} /> Завести запись
          </button>
        </div>
      </ActionBar>
      <Rows>
        {ATHLETES.map((p) => (
          <Row key={p.nm} av={p.av} nm={p.nm} sub={p.sub} val={`рейтинг ${p.rt}`} pill={{ t: p.st, cls: p.cls }} action="Править" />
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* ── Э1.7 · Журнал действий ────────────────────────────────────── */

type Log = { av: string; act: string; who: string; was: string; now: string; obj: string; cls: string };

const LOG: Log[] = [
  { av: AW(44), act: 'Опубликовала соревнование', who: 'Абаева Д. · Кубок РК · 14.04.2026, 10:42', was: 'Судья назначен', now: 'Приём заявок игроков', obj: 'ТУРНИР', cls: 'reg' },
  { av: A(76), act: 'Назначил главного судью', who: 'Мукашев Б. · Кубок Иртыша · 12.04.2026, 16:20', was: 'не назначен', now: 'Оспанов Т.', obj: 'ТУРНИР', cls: 'reg' },
  { av: A(60), act: 'Отметил оплату взноса', who: 'Сериков Н. · Смагулов А. · 14.01.2026, 10:42', was: 'Не оплачен', now: 'Оплачен', obj: 'ВЗНОС', cls: 'live' },
  { av: AW(44), act: 'Выдала роль', who: 'Абаева Д. · Пак С. · 10.04.2026, 09:15', was: 'нет роли', now: 'Судья · Кубок РК', obj: 'РОЛЬ', cls: 'wait' },
  { av: A(76), act: 'Изменил расписание', who: 'Оспанов Т. · Кубок РК · 15.04.2026, 18:03', was: 'стол 4, 10:00', now: 'стол 6, 11:30', obj: 'РАСПИСАНИЕ', cls: 'reg' },
  { av: A(45), act: 'Завёл спортсмена', who: 'Досжан М. · клуб «Алатау» · 03.02.2026, 14:05', was: 'нет записи', now: 'Ахметов Диас', obj: 'РЕЕСТР', cls: 'wait' },
];

export function Log1_7() {
  return (
    <RoleScreen
      role={R01}
      nav="Журнал"
      title="Журнал действий"
      sub="Кто · что · когда · было → стало"
      hint="Записи журнала не редактируются и не удаляются (§12): доступны только чтение и выгрузка."
    >
      <div className="dactionbar">
        <div className="dseg2">
          <span className="on">Все действия</span>
          <span>Турниры</span>
          <span>Роли</span>
          <span>Взносы</span>
          <span>Реестры</span>
          <span>Результаты</span>
        </div>
        <div className="dseg2">
          <span className="on">7 дней</span>
          <span>30 дней</span>
          <span>Сезон</span>
        </div>
      </div>
      <ActionBar count="1 248 записей · фильтры: человек — все, турнир — все, период — 7 дней">
        <Btn>
          <Download size={14} /> Выгрузить журнал
        </Btn>
      </ActionBar>
      <Rows>
        {LOG.map((l) => (
          <div className="drow" key={l.act + l.who}>
            <img src={l.av} alt="" />
            <div className="who">
              <div className="nm">{l.act}</div>
              <div className="rl">{l.who}</div>
            </div>
            <div className="amt" style={{ color: 'var(--c-muted)' }}>{l.was}</div>
            <span style={{ color: 'var(--c-dim)', fontWeight: 800 }}>→</span>
            <div className="amt">{l.now}</div>
            <P t={l.obj} cls={l.cls} />
          </div>
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* ── Э1.8 · Новости и страницы ─────────────────────────────────── */

type News = { nm: string; mt: string; langs: string[]; st: string; cls: string };

const NEWS: News[] = [
  { nm: 'Кубок Республики: приём заявок открыт', mt: 'Новость · 12.04.2026', langs: ['RU', 'KZ'], st: 'ОПУБЛИКОВАНО', cls: 'live' },
  { nm: 'Итоги открытия сезона 2026', mt: 'Новость · 21.01.2026', langs: ['RU', 'KZ', 'EN'], st: 'ОПУБЛИКОВАНО', cls: 'live' },
  { nm: 'Положение о Евразийской лиге', mt: 'Страница · 05.03.2026', langs: ['RU'], st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'Календарь сезона 2026', mt: 'Страница · 10.01.2026', langs: ['RU', 'KZ'], st: 'ОПУБЛИКОВАНО', cls: 'live' },
  { nm: 'Судейский семинар в Астане', mt: 'Новость · 02.04.2026', langs: ['RU'], st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'Как считается рейтинг игрока', mt: 'Страница · 18.02.2026', langs: ['RU', 'KZ', 'EN'], st: 'ОПУБЛИКОВАНО', cls: 'live' },
];

export function News1_8() {
  return (
    <RoleScreen
      role={R01}
      nav="Новости"
      title="Новости и страницы"
      sub="46 материалов · три языка: RU / KZ / EN"
      hint="Пустой перевод виден индикатором: на публичном сайте показывается заполненный язык."
    >
      <div className="ttabs">
        <span className="ttab on">Все материалы · 46</span>
        <span className="ttab">Новости · 34</span>
        <span className="ttab">Страницы · 12</span>
      </div>
      <ActionBar count="Индикаторы RU / KZ / EN показывают заполненность перевода">
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>
            <Eye size={14} /> Предпросмотр сайта
          </Btn>
          <button className="dsubmit" style={{ padding: '10px 14px' }}>
            <Plus size={15} /> Создать материал
          </button>
        </div>
      </ActionBar>
      <Rows>
        {NEWS.map((n) => (
          <div className="drow" key={n.nm}>
            <div className="who">
              <div className="nm">{n.nm}</div>
              <div className="rl">{n.mt}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['RU', 'KZ', 'EN'].map((l) => (
                <P key={l} t={l} cls={n.langs.includes(l) ? 'reg' : 'done'} />
              ))}
            </div>
            <P t={n.st} cls={n.cls} />
            <button className="dpickbtn">{n.cls === 'live' ? 'Снять с публикации' : 'Опубликовать'}</button>
          </div>
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* ── Борд роли ─────────────────────────────────────────────────── */

export function Role01Board() {
  return (
    <Board role={R01}>
      <Screen code="Э1.1" cap="Панель Федерации">
        <Dash1_1 />
      </Screen>
      <Arrow lbl="пункт «Календарь»" />
      <Screen code="Э1.2" cap="Календарь сезона">
        <Cal1_2 />
      </Screen>
      <Arrow lbl="строка соревнования" />
      <Screen code="Э1.3" cap="Карточка турнира">
        <Tour1_3 />
      </Screen>
      <Arrow lbl="«Завести соревнование»" />
      <Screen code="Э1.4" cap="Форма «Завести соревнование»">
        <New1_4 />
      </Screen>
      <Arrow lbl="пункт «Пользователи»" />
      <Screen code="Э1.5" cap="Пользователи и роли">
        <Users1_5 />
      </Screen>
      <Arrow lbl="пункт «Реестры»" />
      <Screen code="Э1.6" cap="Реестры">
        <Reg1_6 />
      </Screen>
      <Arrow lbl="пункт «Журнал»" />
      <Screen code="Э1.7" cap="Журнал действий">
        <Log1_7 />
      </Screen>
      <Arrow lbl="пункт «Новости»" />
      <Screen code="Э1.8" cap="Новости и страницы">
        <News1_8 />
      </Screen>
    </Board>
  );
}
