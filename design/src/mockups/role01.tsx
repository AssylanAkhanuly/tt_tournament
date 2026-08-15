/* Роль 1 · Администратор Федерации — макеты по флоу.
   Экраны Э1.1–Э1.14 (см. `flows/01-admin-federacii.md` и схему роли).

   Роль работает с десктопа и видит всю систему: календарь и турниры, роли,
   реестры, журнал, контент. Полный доступ безопасен потому, что система
   именная — каждое действие попадает в журнал (TZ §12).

   Под каждым экраном стоит полка `States` — тот же экран в других ситуациях
   (пусто, поле не заполнено, действие запрещено). Подписи кадров повторяют
   `states[]` из данных роли: `src/flows/data/role01.ts`.

   Сегодня в макете — 15 апреля 2026: идёт 2-й тур Евразийской лиги, ближайший
   главный старт (Кубок РК) — 18 мая. От этой даты считаются все «сегодня»,
   «через сколько дней» и записи журнала. */

import type { ReactNode } from 'react';
import {
  AlertTriangle, Download, Eye, GitMerge, Image, Link2, Merge, Plus, Search, Send, UserPlus,
} from 'lucide-react';
import {
  A, ActionBar, Alert, Also, Arrow, AW, Board, Chips, Empty, Field, Form, Ghost, Hint, Modal, Off, P,
  Panel, RoleScreen, Row, Rows, Screen, Shot, States,
} from './shell';
import type { ScreenMap } from './shell';
import type { DeskVariant } from '../deskShell';
import { R01 } from './roles';
import { Login0_1 } from './role00';

/* ── Общие мелочи роли ──────────────────────────────────────────── */

/** Второстепенная кнопка с иконкой: `dpickbtn` — не флекс-контейнер, а иконки
    в макетном слое блочные, поэтому раскладку задаём здесь. */
export const Btn = ({ children }: { children: ReactNode }) => (
  <button className="dpickbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {children}
  </button>
);

/** Раздел диалога с отбивкой: без неё подпись раздела читается как подпись к
    предыдущему полю формы. */
export const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--c-glass-line)', paddingTop: 12 }}>
    <div className="dcount" style={{ marginBottom: 8 }}>{title}</div>
    {children}
  </div>
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
  { nm: 'Евразийская лига · 2-й тур', mt: 'Лига · Караганда · 14–16 апреля', apps: '12 команд', judge: 'Пак С.', st: 'ИДЁТ', cls: 'live' },
  { nm: 'ОРТ «Кубок Иртыша»', mt: 'ОРТ · Павлодар · 25 апреля', apps: '34 / 34', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' },
  { nm: 'ОРТ «Шымкент Open»', mt: 'ОРТ · Шымкент · 9 мая', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'Открытие сезона 2026', mt: 'Главный старт · Астана · 17–19 января', apps: '142 / 138', judge: 'Мукашев Б.', st: 'ЗАВЕРШЁН', cls: 'done' },
];

/** Строка календаря. `judge` — показывать ли колонку главного судьи:
    не назначен — прочерк с подсветкой, как требует флоу. */
export const TourRow = ({ t, judge }: { t: Tour; judge?: boolean }) => (
  <div className="drow" data-to="Э1.3">
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

/** «Сегодня идут»: тур Лиги идёт двумя дивизионами сразу, на разных столах.

    `act` — показывать ли переход в ход турнира. У ролей 3 и 4 (наблюдатели)
    кнопок на экранах нет вовсе, поэтому они берут ту же зону без неё. */
export const TodayRows = ({ act = true }: { act?: boolean }) => (
  <Rows>
    {[
      { nm: 'Суперлига · мужчины', sub: 'Евразийская лига, 2-й тур · Караганда · столы 1–6', v: '34 из 60' },
      { nm: 'Суперлига · женщины', sub: 'Евразийская лига, 2-й тур · Караганда · столы 7–10', v: '26 из 48' },
    ].map((r) => (
      <div className="drow" key={r.nm} data-to="Э1.3">
        <div className="who">
          <div className="nm">{r.nm}</div>
          <div className="rl">{r.sub}</div>
        </div>
        <div className="amt">{r.v}</div>
        <P t="ИДЁТ" cls="live" />
        {act && <button className="dpickbtn">Ход турнира</button>}
      </div>
    ))}
  </Rows>
);

/** «Сегодня идут» в межсезонье — пустая зона (её же показывают роли 3 и 4). */
export const TodayEmpty = () => (
  <Empty
    title="Сегодня матчей нет"
    text="Здесь появляются турниры в состоянии «Идёт» со счётом сыгранных матчей и ссылкой на ход турнира."
  />
);

/* ── Э1.1 · Панель Федерации ───────────────────────────────────── */

export function Dash1_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen
      variant={variant}
      role={R01}
      nav="Панель"
      title="Панель Федерации"
      sub="Сезон 2026 · 15 апреля · 8 главных стартов, 24 ОРТ, Евразийская лига — 4 тура"
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
            {TOURS.slice(0, 4).map((t) => (
              <TourRow key={t.nm} t={t} />
            ))}
          </Rows>
        </Panel>
        <Panel title="Сегодня идут">
          <TodayRows />
          <Notes>
            <Hint>Счёт сыгранных матчей идёт от судей на столах — панель его только показывает.</Hint>
          </Notes>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Dash1_1States = () => (
  <States>
    <Shot
      tone="success"
      title="Всё разобрано"
      text="Зона «Требует внимания» пустая, с подписью «всё в порядке»."
    >
      <Chips
        items={[
          { v: '0', k: 'Без главного судьи' },
          { v: '0', k: 'Регламент не заполнен' },
          { v: '0', k: 'Заявки без решения' },
        ]}
      />
      <Empty
        title="Всё в порядке"
        text="Нерешённых дел по календарю нет. Плитки вернутся, как только появится турнир без судьи или зависшая заявка."
      />
    </Shot>

    <Shot
      tone="info"
      title="Межсезонье"
      text="Вместо ближайших стартов — приглашение завести сезон, «Сегодня идут» пустая."
    >
      <Empty
        title="Сезон 2027 ещё не заведён"
        text="Календарь сезона пуст: заведите первое соревнование или скопируйте прошлогодний календарь."
      />
      <TodayEmpty />
    </Shot>
  </States>
);

/* ── Э1.2 · Календарь сезона ───────────────────────────────────── */

export function Cal1_2({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen
      variant={variant}
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

const Cal1_2States = () => (
  <States>
    <Shot tone="info" title="Пустой сезон" text="Приглашение завести первое соревнование." wide>
      <ActionBar count="0 соревнований · сезон 2027">
        <button className="dsubmit" style={{ padding: '10px 14px' }}>
          <Plus size={15} /> Завести соревнование
        </button>
      </ActionBar>
      <Empty
        title="В сезоне 2027 соревнований нет"
        text="Календарь наполняется по мере заведения: главные старты, туры Евразийской лиги, открытые республиканские турниры."
      />
    </Shot>
  </States>
);

/* ── Э1.4 · Форма «Завести соревнование» ───────────────────────── */

const STEPS = ['1 · Категория', '2 · Основное', '3 · Допуск', '4 · Флаги', '5 · Столы'];

const NewFlags = () => (
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
);

/** Оболочка мастера: шаги сверху, текущий подсвечен.

    Мастер показываем всеми пятью шагами подряд, а не одним итоговым кадром:
    человек проходит его с начала, и «шаг 5 из 5» первым экраном — это уже не
    флоу, а сводка. Первый кадр — шаг 1, остальные идут кадрами «то же на
    следующем шаге». */
const Wizard = ({ step, sub, children }: { step: number; sub: string; children: ReactNode }) => (
  <RoleScreen
    role={R01}
    nav="Календарь"
    title="Завести соревнование"
    sub={`Шаг ${step} из 5 · ${sub}`}
    hint="Соревнование создаётся в состоянии «Черновик»: публично не видно, пока не опубликовано."
  >
    <div className="dseg2">
      {STEPS.map((s, i) => (
        <span key={s} className={i + 1 === step ? 'on' : undefined}>{s}</span>
      ))}
    </div>
    {children}
  </RoleScreen>
);

/** Полоса «дальше»: сколько шагов позади и главное действие шага. */
const WizardBar = ({ note, btn }: { note: string; btn: string }) => (
  <div className="dactionbar">
    <div className="dcount">{note}</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Ghost>Назад</Ghost>
      <button className="dsubmit" style={{ padding: '12px 18px' }}>{btn}</button>
    </div>
  </div>
);

/** Шаг 1 — категория: от неё зависят остальные шаги, поэтому она первая. */
export function New1_4() {
  return (
    <Wizard step={1} sub="категория соревнования">
      <div className="mkcols" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <Panel title="Главный старт" extra={<P t="ВЫБРАНО" cls="live" />}>
          <Hint>
            Восемь республиканских стартов календаря: чемпионат, молодёжный, пять возрастных
            первенств и Кубок РК. Заявляет старший тренер региона (§4.1).
          </Hint>
        </Panel>
        <Panel title="Евразийская лига">
          <Hint>
            Командная, четыре тура: мужская — Суперлига и 2–6 лиги, женская — Суперлига и 2 лига.
            Создастся сезон с дивизионами и датами туров (§4.10).
          </Hint>
        </Panel>
        <Panel title="ОРТ">
          <Hint>Открытый республиканский турнир: спортсмен заявляется сам.</Hint>
        </Panel>
      </div>
      <Hint>
        Категория определяет остальные шаги: у Лиги вместо одного соревнования заводится сезон с
        дивизионами, у ОРТ проще допуск.
      </Hint>
      <WizardBar note="Шаг 1 из 5 · дальше — название, город и окно дат" btn="Дальше · основное" />
    </Wizard>
  );
}

/** Шаг 2 — основное. */
export const New1_4Step2 = () => (
  <Wizard step={2} sub="название, город, даты">
    <Panel title="Основное">
      <Form>
        <Field label="Название" value="Первенство РК · 2012 г.р. и моложе" wide />
        <Field label="Город" value="Актобе · ДС «Коктем»" />
        <Field label="Окно дат" value="12–14 сентября 2026" />
        <Field label="Разряды" value="Одиночный · парный" />
        <Field label="Сезон" value="2026" />
      </Form>
      <Notes>
        <Hint>
          Название возрастного первенства собирается из сезона и правила «год рождения и моложе»
          (§4.1) — руками год в название не пишут.
        </Hint>
      </Notes>
    </Panel>
    <WizardBar note="Шаг 2 из 5 · дальше — условия допуска" btn="Дальше · допуск" />
  </Wizard>
);

/** Шаг 3 — допуск. */
export const New1_4Step3 = () => (
  <Wizard step={3} sub="возрастная граница и ценз">
    <Panel title="Допуск">
      <Form>
        <Field label="Возрастная граница" value="2012 г.р. и моложе — правило от сезона" wide />
        <Field label="Ценз по рейтингу" value="не требуется" />
        <Field label="Пол" value="раздельно: мужчины и женщины" />
      </Form>
      <Notes>
        <Hint>
          Граница хранится правилом, а не строкой: в следующем сезоне то же первенство считается от
          нового года без переименования.
        </Hint>
      </Notes>
    </Panel>
    <WizardBar note="Шаг 3 из 5 · дальше — флаги допуска" btn="Дальше · флаги" />
  </Wizard>
);

/** Шаг 4 — флаги допуска с умолчаниями от категории. */
export const New1_4Step4 = () => (
  <Wizard step={4} sub="флаги допуска">
    <Panel title="Флаги допуска (§4.2)" extra={<span className="dcount">умолчания от категории</span>}>
      <NewFlags />
      <Notes>
        <Hint>Каждый флаг можно переопределить: умолчание подставляет категория, решает человек.</Hint>
      </Notes>
    </Panel>
    <WizardBar note="Шаг 4 из 5 · дальше — столы и трансляция" btn="Дальше · столы" />
  </Wizard>
);

/** Шаг 5 — столы, сводка всех шагов и «Создать». */
export const New1_4Step5 = () => (
  <Wizard step={5} sub="столы и трансляция">
    <div className="mkcols">
      <Panel title="Столы">
        <Form>
          <Field label="Сколько столов" value="12" />
          <Field label="С трансляцией" value="столы 1 и 2" />
        </Form>
        <Notes>
          <Hint>Столы с трансляцией отмечает главный судья при распределении — здесь только их число.</Hint>
        </Notes>
      </Panel>

      <Panel title="Что создастся" extra={<P t="ЧЕРНОВИК" cls="done" />}>
        <Form>
          <Field label="Категория" value="Главный старт" />
          <Field label="Название" value="Первенство РК · 2012 г.р. и моложе" wide />
          <Field label="Город и даты" value="Актобе · 12–14 сентября 2026" wide />
          <Field label="Допуск" value="взнос и документы обязательны · ценз не требуется" wide />
        </Form>
      </Panel>
    </div>
    <div className="dactionbar">
      <div className="dcount">
        Обязательные поля заполнены · соревнование создастся в состоянии «Черновик»
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Ghost>Назад</Ghost>
        <button className="dsubmit" style={{ padding: '12px 18px' }}>Создать</button>
      </div>
    </div>
  </Wizard>
);

const New1_4States = () => (
  <States>
    <Shot
      tone="danger"
      title="Обязательные поля не заполнены"
      text="«Создать» неактивна, с пояснением."
      wide
    >
      <Form>
        <Field label="Название" value="Первенство РК · 2012 г.р. и моложе" />
        <div className="dfield">
          <div className="k">Окно дат</div>
          <div className="dval" style={{ color: 'var(--c-warning)' }}>— не выбрано</div>
        </div>
      </Form>
      <div className="dactionbar">
        <div className="dcount" style={{ color: 'var(--c-warning)' }}>
          Заполните обязательное поле «Окно дат» — без него соревнование не создать
        </div>
        <Off>Создать</Off>
      </div>
    </Shot>
  </States>
);

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

/** Шкала жизненного цикла: `now` — подсвеченное состояние. */
const Stages = ({ now = NOW_STAGE }: { now?: string }) => (
  <div>
    <div className="dcount" style={{ marginBottom: 8 }}>Состояние турнира — восемь состояний по §4.3</div>
    <div className="dseg2">
      {STAGES.map((s) => (
        <span key={s} className={s === now ? 'on' : undefined}>{s}</span>
      ))}
    </div>
  </div>
);

const TourTabs = ({ on = 'Регламент' }: { on?: string }) => (
  <div className="ttabs">
    {TABS.map((t) => (
      <span key={t} className={'ttab' + (t === on ? ' on' : '')}>{t}</span>
    ))}
  </div>
);

/** Регламент турнира — он же подложка диалога отмены (Э1.9). */
const TourRules = () => (
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
);

export function Tour1_3() {
  return (
    <RoleScreen
      role={R01}
      nav="Календарь"
      title="Кубок Республики Казахстан 2026"
      sub="Главный старт · г. Астана · 18–20 мая · подано 128 заявок, принято 96"
      hint="«Опубликовать» доступно в состоянии «Судья назначен»: турнир становится виден публично и открывается приём заявок игроков."
    >
      <Stages />
      <TourTabs />
      <div className="mkcols">
        <Panel title="Регламент" extra={<P t={NOW_STAGE.toUpperCase()} cls="reg" />}>
          <TourRules />
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

const Tour1_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="«Черновик» — незаполненные обязательные поля"
      text="Поля подсвечены; с ними нельзя публиковать."
    >
      <Form>
        <Field label="Даты" value="9 мая 2026" />
        <div className="dfield">
          <div className="k">Формат</div>
          <div className="dval" style={{ color: 'var(--c-warning)' }}>— не выбран</div>
        </div>
        <div className="dfield">
          <div className="k">Столов</div>
          <div className="dval" style={{ color: 'var(--c-warning)' }}>— не указано</div>
        </div>
      </Form>
      <Alert>Пока регламент не заполнен, турнир нельзя опубликовать и на него нельзя открыть приём заявок судей.</Alert>
      <Off>Опубликовать</Off>
    </Shot>

    <Shot
      tone="info"
      title="После состояния «Завершён»"
      text="Всё только чтение, кнопок правки нет."
    >
      <Stages now="Завершён" />
      <Rows>
        <Row nm="Итоговый протокол" sub="утверждён председателем ГСК · 21.01.2026" pill={{ t: 'ЗАКРЫТ', cls: 'done' }} action="Печать" />
        <Row nm="Рейтинг" sub="пересчитан по 142 матчам · 21.01.2026" pill={{ t: 'УЧТЁН', cls: 'done' }} />
      </Rows>
      <Hint>Правка регламента, отмена и перенос из завершённого турнира убраны — осталась печать и журнал.</Hint>
    </Shot>
  </States>
);

/* ── Э1.9 · Отмена или перенос соревнования ────────────────────── */

export function Cancel1_9() {
  return (
    <RoleScreen
      role={R01}
      nav="Календарь"
      title="Кубок Республики Казахстан 2026"
      sub="Главный старт · г. Астана · 18–20 мая · подано 128 заявок, принято 96"
      hint="Причина обязательна: она уходит и в уведомление заявителям, и в журнал действий."
    >
      <Stages />
      <TourTabs />
      <Panel title="Регламент" extra={<P t={NOW_STAGE.toUpperCase()} cls="reg" />}>
        <TourRules />
      </Panel>

      <Modal
        title="Отменить или перенести соревнование"
        sub="Кубок Республики Казахстан 2026 · 18–20 мая · Астана"
        foot={
          <>
            <div className="dcount">Причина уйдёт заявителям и в журнал</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>Перенести</button>
            </div>
          </>
        }
      >
        <div className="dseg2">
          <span className="on">Перенести</span>
          <span>Отменить совсем</span>
        </div>
        <Form>
          <Field label="Было" value="18–20 мая 2026" />
          <Field label="Новое окно дат" value="1–3 июня 2026" />
          <Field
            label="Причина"
            value="ДС «Барыс» занят под другое мероприятие; зал подтвердил новые даты"
            wide
          />
        </Form>
        <Block title="Кого затрагивает">
          <Chips
            items={[
              { v: '128', k: 'Заявок подано' },
              { v: '96', k: 'Принято', tone: 'g' },
              { v: '14', k: 'Судей в наряде', tone: 'b' },
            ]}
          />
        </Block>
        <Hint>
          Заявки сохраняются и переезжают на новые даты; уведомление уйдёт всем, кто подал заявку, —
          игрокам, тренерам и судьям наряда (§10.1).
        </Hint>
      </Modal>
    </RoleScreen>
  );
}

const Cancel1_9States = () => (
  <States>
    <Shot tone="danger" title="Причина не заполнена" text="Обе кнопки неактивны, с пояснением.">
      <div className="dfield">
        <div className="k">Причина</div>
        <div className="dval" style={{ color: 'var(--c-danger)' }}>— не заполнена</div>
      </div>
      <Alert tone="danger">
        Без причины ни перенести, ни отменить нельзя: она уходит людям в уведомление и остаётся в журнале.
      </Alert>
      <div style={{ display: 'flex', gap: 8 }}>
        <Off>Перенести</Off>
        <Off>Отменить соревнование</Off>
      </div>
    </Shot>

    <Shot
      tone="warning"
      title="Турнир в состоянии «Идёт» ✳"
      text="Предупреждение, что часть матчей уже сыграна и отмена их результаты не удаляет."
    >
      <Rows>
        <Row nm="Сыграно матчей" sub="Суперлига (мужчины) · день 2 из 3" val="34 из 60" pill={{ t: 'ИДЁТ', cls: 'live' }} />
      </Rows>
      <Alert>
        <AlertTriangle size={13} style={{ verticalAlign: '-2px' }} /> Турнир уже идёт: сыгранные матчи
        останутся в журнале и в истории игроков, но турнир не будет доигран.
      </Alert>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ вопрос 2.2 — чем становится отменённый турнир"
      text="Среди восьми состояний §4.3 «отменён» нет, и кто именно отменяет — тоже открыто."
      wide
    >
      <div className="dseg2">
        {STAGES.map((s) => (
          <span key={s}>{s}</span>
        ))}
        <span style={{ color: 'var(--c-danger)', borderColor: 'var(--c-danger-line)' }}>Отменён — ⚠ такого состояния в §4.3 нет</span>
      </div>
      <Alert tone="danger">
        Пока не решено: остаётся ли отменённый турнир в календаре, кто его отменяет — председатель ГСК
        (так в §4.3) или администратор Федерации по «полному доступу», и что происходит с уже сыгранными
        матчами. В макете это место помечено, а не придумано.
      </Alert>
    </Shot>
  </States>
);

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

const Users1_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Попытка выдать роль «главный судья» ✳"
      text="Подсказка, что на официальный турнир судью назначает председатель ГСК через заявки, а не этот экран."
    >
      <Rows>
        <div className="drow">
          <img src={A(76)} alt="" />
          <div className="who">
            <div className="nm">Оспанов Тимур</div>
            <div className="rl">Главный судья · Кубок РК · назначил председатель ГСК, 12.04.2026</div>
          </div>
          <P t="НАЗНАЧЕН ГСК" cls="reg" />
        </div>
      </Rows>
      <Alert>
        У этой роли нет ни «Выдать», ни «Отозвать»: она появилась из решения по заявке судьи (§4.4).
        Снять её можно только сменой главного судьи на турнире.
      </Alert>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.8 — один аккаунт на федерацию или несколько"
      text="Не решено и то, нужен ли технический администратор без доступа к спортивным решениям."
    >
      <Rows>
        <Row av={AW(44)} nm="Абаева Динара" sub="Администратор Федерации · система · бессрочно" pill={{ t: 'АКТИВЕН', cls: 'live' }} />
        <Row av={A(60)} nm="Сериков Нурлан" sub="Экономист · система · бессрочно" pill={{ t: 'АКТИВЕН', cls: 'live' }} />
      </Rows>
      <Alert>
        Сколько людей держат роль администратора и нужен ли отдельный технический администратор —
        без доступа к спортивным решениям и персональным данным — федерация ещё не ответила.
      </Alert>
    </Shot>
  </States>
);

/* ── Э1.10 · Форма «Завести аккаунт» ───────────────────────────── */

export function NewUser1_10() {
  return (
    <RoleScreen
      role={R01}
      nav="Пользователи"
      title="Завести аккаунт"
      sub="Учётная запись без ролей: права выдаются отдельно, на экране выдачи роли"
      hint="Аккаунт заводится неактивным и включается сам, когда человек принял приглашение и задал пароль."
    >
      <div className="mkcols">
        <Panel title="Человек и контакты">
          <Form>
            <Field label="Фамилия" value="Абдрахманова" />
            <Field label="Имя, отчество" value="Айгерим Ерлановна" />
            <Field label="Год рождения ✳" value="1994" />
            <Field label="Телефон" value="+7 707 118 44 03" />
            <Field label="Почта" value="a.abdrakhmanova@ttfrk.kz" />
            <Field label="Хотя бы один контакт ✳" value="телефон и почта заполнены" wide />
          </Form>
        </Panel>

        <Panel title="Связь с реестром ✳">
          <ActionBar count="Поиск: «абдрахманова»">
            <Btn>
              <Search size={14} /> Искать в реестрах
            </Btn>
          </ActionBar>
          <Rows>
            <div className="drow">
              <img src={AW(32)} alt="" />
              <div className="who">
                <div className="nm">Абдрахманова Айгерим</div>
                <div className="rl">Реестр судей · вторая категория · Астана</div>
              </div>
              <button className="dpickbtn">
                <Link2 size={14} /> Связать
              </button>
            </div>
          </Rows>
          <Notes>
            <Hint>
              Аккаунт привязывается к существующей записи реестра, а не заводит вторую: несвязанные
              записи — и есть источник дублей (Э1.13).
            </Hint>
          </Notes>
        </Panel>
      </div>

      <Panel title="Приглашение ✳">
        <div className="dactionbar">
          <div className="dseg2">
            <span className="on">На почту</span>
            <span>SMS</span>
          </div>
          <div className="dcount">Пароль человек задаёт сам по ссылке — мы его не знаем и не храним</div>
        </div>
      </Panel>

      <div className="dactionbar">
        <div className="dcount">Заведение аккаунта пишется в журнал: кто завёл, когда, кому отправлено приглашение</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Ghost>Выдать роль сразу</Ghost>
          <button className="dsubmit" style={{ padding: '12px 18px' }}>
            <Send size={15} /> Завести и пригласить
          </button>
        </div>
      </div>
    </RoleScreen>
  );
}

const NewUser1_10States = () => (
  <States>
    <Shot
      tone="warning"
      title="Найден похожий человек ✳"
      text="Предложение связать с существующей записью, а не заводить новую."
    >
      <Rows>
        <div className="drow">
          <img src={AW(32)} alt="" />
          <div className="who">
            <div className="nm">Абдрахманова Айгерим Ерлановна</div>
            <div className="rl">1994 · Астана · судья второй категории · есть в реестре</div>
          </div>
          <P t="СОВПАДЕНИЕ" cls="wait" />
        </div>
      </Rows>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dpickbtn">Связать с этой записью</button>
        <Ghost>Всё равно завести новую</Ghost>
      </div>
    </Shot>

    <Shot
      tone="danger"
      title="Приглашение не доставлено ✳"
      text="Контакт помечен, есть «отправить ещё раз»."
    >
      <Rows>
        <div className="drow">
          <div className="who">
            <div className="nm">a.abdrakhmanova@ttfrk.kz</div>
            <div className="rl" style={{ color: 'var(--c-danger)' }}>письмо вернулось: адрес не существует</div>
          </div>
          <P t="НЕ ДОСТАВЛЕНО" cls="bad" />
          <button className="dpickbtn">Отправить ещё раз</button>
        </div>
      </Rows>
      <Alert tone="danger">Аккаунт остаётся неактивным: человек не задал пароль и войти не может.</Alert>
    </Shot>
  </States>
);

/* ── Э1.11 · Выдача роли ───────────────────────────────────────── */

/* Список ролей в диалоге показан не целиком: их четырнадцать, и в макете важно
   не перечислить все, а показать, как выглядит выбор. Полный перечень — ROLES.md. */
const ROLE_PICK = [
  'Экономист',
  'Председатель ГСК',
  'Главный судья',
  'Судья',
  'Инспектор',
  'Ещё 9 ролей',
];

export function GrantRole1_11() {
  return (
    <RoleScreen
      role={R01}
      nav="Пользователи"
      title="Пользователи и роли"
      sub="214 учётных записей · выдача роли открыта поверх списка"
      hint="Роль — это всегда «роль · область · срок»: без области роль ничего не значит, без срока её потом некому снять."
    >
      <Rows>
        {USERS.slice(0, 4).map((u) => (
          <Row key={u.nm} av={u.av} nm={u.nm} sub={u.roles} pill={{ t: u.st, cls: 'live' }} />
        ))}
      </Rows>

      <Modal
        title="Выдать роль"
        sub="Пак Сергей · +7 705 431 20 18 · уже есть роль «Судья стола · стол 4»"
        foot={
          <>
            <div className="dcount">Выдача пишется в журнал: кто выдал, кому, когда</div>
            <button className="dsubmit" style={{ padding: '11px 16px' }}>Выдать</button>
          </>
        }
      >
        <div>
          <div className="dcount" style={{ marginBottom: 8 }}>Роль — из четырнадцати по документу федерации</div>
          <div className="dseg2">
            {ROLE_PICK.map((r) => (
              <span key={r} className={r === 'Судья' ? 'on' : undefined}>{r}</span>
            ))}
          </div>
        </div>
        <Block title="Область — состав зависит от роли">
          <div className="dseg2">
            <span>Система</span>
            <span className="on">Турнир</span>
            <span>Клуб</span>
            <span>Стол</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Form>
              <Field label="Турнир" value="Кубок Республики Казахстан 2026" />
              <Field label="Срок — по последний день турнира" value="до 20.05.2026" />
            </Form>
          </div>
        </Block>
        <Block title="Что человек сможет ✳">
          <Rows>
            <Row nm="Вести счёт на своём столе" sub="матч не стартует, пока стол без судьи (§4.7)" pill={{ t: 'ДА', cls: 'live' }} />
            <Row nm="Видеть расписание и вызовы" sub="уведомление о вызове пары приходит мгновенно" pill={{ t: 'ДА', cls: 'live' }} />
            <Row nm="Править чужие результаты" sub="это делает главный судья соревнований" pill={{ t: 'НЕТ', cls: 'done' }} />
          </Rows>
        </Block>
      </Modal>
    </RoleScreen>
  );
}

const GrantRole1_11States = () => (
  <States>
    <Shot
      tone="danger"
      title="Выбрана роль «Главный судья соревнований»"
      text="Выдать нельзя: на официальный турнир судью назначает председатель ГСК через заявки (§4.4)."
    >
      <div className="dseg2">
        <span>Судья</span>
        <span style={{ color: 'var(--c-danger)', borderColor: 'var(--c-danger-line)' }}>Главный судья</span>
        <span>Инспектор</span>
      </div>
      <Alert tone="danger">
        Эта роль не раздаётся руками: судьи подают заявки на судейство, председатель ГСК выбирает одного,
        и он становится главным судьёй турнира.
      </Alert>
      <Off>Выдать</Off>
    </Shot>

    <Shot tone="warning" title="Срок указан в прошлом" text="«Выдать» неактивна.">
      <Form>
        <Field label="Роль и область" value="Судья · Кубок Республики Казахстан 2026" />
        <div className="dfield">
          <div className="k">Срок</div>
          <div className="dval" style={{ color: 'var(--c-warning)' }}>до 20.05.2025 — дата уже прошла</div>
        </div>
      </Form>
      <Off>Выдать</Off>
    </Shot>
  </States>
);

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
          <Row key={p.nm} av={p.av} nm={p.nm} sub={p.sub} val={`рейтинг ${p.rt}`} pill={{ t: p.st, cls: p.cls }} action="Открыть" to="Э1.12" />
        ))}
      </Rows>
    </RoleScreen>
  );
}

const Reg1_6States = () => (
  <States>
    <Shot
      tone="info"
      title="Запись заведена клубом или самим человеком ✳"
      text="Виден источник записи — «завёл клуб „Достык“, 03.02.2026»."
    >
      <Rows>
        <div className="drow">
          <img src={AW(21)} alt="" />
          <div className="who">
            <div className="nm">Тлеуова Аружан</div>
            <div className="rl">завёл клуб «Достык», 03.02.2026 · 2009 · Шымкент</div>
          </div>
          <P t="ЗАВЁЛ КЛУБ" cls="wait" />
        </div>
        <div className="drow">
          <img src={A(32)} alt="" />
          <div className="who">
            <div className="nm">Смагулов Алан</div>
            <div className="rl">зарегистрировался сам, 11.01.2026 · 2004 · Алматы</div>
          </div>
          <P t="САМ" cls="reg" />
        </div>
      </Rows>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.10 — стык ручного заведения с самостоятельной регистрацией"
      text="Как ручное заведение записи стыкуется с регистрацией спортсмена и заведением через клуб — не решено."
    >
      <Rows>
        <Row av={A(75)} nm="Ерлан Бекзат · 2006" sub="завела федерация, 14.01.2026" pill={{ t: 'ДУБЛЬ?', cls: 'wait' }} />
        <Row av={A(75)} nm="Ерлан Бекзат · 2006" sub="зарегистрировался сам, 02.03.2026" pill={{ t: 'ДУБЛЬ?', cls: 'wait' }} />
      </Rows>
      <Alert>
        Один человек тремя путями попадает в реестр — сам, через клуб, руками федерации. Пока правило не
        принято, система показывает подозрение на дубль и отдаёт решение человеку (Э1.13).
      </Alert>
    </Shot>
  </States>
);

/* ── Э1.12 · Карточка спортсмена ───────────────────────────────── */

export function Athlete1_12() {
  return (
    <RoleScreen
      role={R01}
      nav="Реестры"
      title="Смагулов Алан"
      sub="2004 · Алматы · клуб «Алатау» · тренер Смагулов А. · КМС · рейтинг 2456"
      hint="Состояние взноса здесь только показывается: отмечает его экономист, и правка идёт с его экрана (§9.2)."
    >
      <ActionBar count="Каждая правка профиля пишется в журнал: кто, когда, было → стало">
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>Действия по человеку</Btn>
          <Ghost>
            <GitMerge size={14} /> Объединить с другой записью
          </Ghost>
          <button className="dpickbtn">Править</button>
        </div>
      </ActionBar>

      <div className="mkcols">
        <div style={{ display: 'grid', gap: 12 }}>
          <Panel title="Профиль" extra={<P t="ЗАРЕГИСТРИРОВАЛСЯ САМ" cls="reg" />}>
            <Form>
              <Field label="Год рождения · пол" value="2004 · мужской" />
              <Field label="Разряд" value="кандидат в мастера спорта" />
              <Field label="Регион и клуб" value="Алматы · «Алатау»" />
              <Field label="Тренер" value="Смагулов Асхат" />
              <Field label="Источник записи ✳" value="зарегистрировался сам, 11.01.2026 · подтвердил клуб «Алатау»" wide />
            </Form>
          </Panel>

          <Panel title="История матчей" extra={<span className="dcount">42 матча за две кампании</span>}>
            <Rows>
              <Row av={A(44)} nm="Ким Георгий" sub="Открытие сезона 2026 · 1/4 финала · 19.01.2026" val="2 : 4" pill={{ t: 'ПОРАЖЕНИЕ', cls: 'bad' }} />
              <Row av={A(13)} nm="Пак Сергей" sub="Открытие сезона 2026 · 1/8 финала · 18.01.2026" val="4 : 1" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
            </Rows>
          </Panel>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Panel title="Рейтинг (§7.1)">
            <Chips
              items={[
                { v: '2456', k: 'Рейтинг', tone: 'b' },
                { v: '7', k: 'Место в РК' },
                { v: '+38', k: 'За сезон', tone: 'g' },
              ]}
            />
            <div style={{ marginTop: 10 }}>
              <Rows>
                <Row nm="Открытие сезона 2026" sub="1/4 финала · 19.01.2026" val="+22" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
                <Row nm="ОРТ «Кубок Иртыша» 2025" sub="финал · 26.10.2025" val="+16" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
              </Rows>
            </div>
          </Panel>

          <Panel title="Годовой взнос" extra={<P t="ОПЛАЧЕН" cls="live" />}>
            <Row nm="2026 · ₸ 10 000" sub="оплачен 14.01.2026 · картой через Halyk ePay" />
            <Notes>
              <Hint>Отметил экономист — здесь только просмотр (Э2.2).</Hint>
            </Notes>
          </Panel>
        </div>
      </div>
    </RoleScreen>
  );
}

const Athlete1_12States = () => (
  <States>
    <Shot
      tone="warning"
      title="Взнос не оплачен"
      text="Плашка, что заявки на турниры с обязательным взносом не пройдут (§9.2)."
    >
      <div className="dactionbar">
        <div className="dcount">Годовой взнос 2026</div>
        <P t="НЕ ОПЛАЧЕН" cls="wait" />
      </div>
      <Alert>
        Пока взнос не отмечен, заявки этого спортсмена на турниры с включённым флагом взноса приниматься
        не будут. Отметку ставит экономист — с этого экрана её не поставить.
      </Alert>
    </Shot>

    <Shot
      tone="info"
      title="Запись заведена клубом или самим человеком ✳"
      text="Виден источник записи."
    >
      <Form>
        <Field label="Спортсмен" value="Тлеуова Аружан · 2009 · Шымкент" />
        <Field label="Источник записи" value="завёл клуб «Достык», 03.02.2026 · федерация не правила" wide />
      </Form>
      <Hint>Источник виден всегда: по нему разбирают дубли и понимают, кому писать при расхождении.</Hint>
    </Shot>
  </States>
);

/* ── Э1.13 · Объединение дублей ────────────────────────────────── */

const MergeCol = ({
  main,
  nm,
  sub,
  born,
  city,
  club,
  rating,
}: {
  main?: boolean;
  nm: string;
  sub: string;
  born: string;
  city: string;
  club: string;
  rating: string;
}) => (
  <Panel
    title={nm}
    extra={<P t={main ? 'ГЛАВНАЯ ЗАПИСЬ' : 'ДУБЛЬ'} cls={main ? 'live' : 'wait'} />}
  >
    <Form>
      <Field label="Источник записи" value={sub} wide />
      <Field label="Год рождения · город" value={`${born} · ${city}`} />
      <Field label="Клуб" value={club} />
      <Field label="Рейтинг" value={rating} wide />
    </Form>
    <div style={{ marginTop: 12 }}>
      {main ? <Hint>Значения этой записи остаются, если не выбрано иное.</Hint> : <Btn>Сделать главной</Btn>}
    </div>
  </Panel>
);

export function Merge1_13() {
  return (
    <RoleScreen
      role={R01}
      nav="Реестры"
      title="Объединение дублей"
      sub="Реестр спортсменов · две записи об одном человеке"
      hint="Объединение видно в журнале, но само не откатывается: сначала убеждаемся, что это один человек."
    >
      <div className="mkcols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <MergeCol
          main
          nm="Ерлан Бекзат"
          sub="завела федерация, 14.01.2026"
          born="2006"
          city="Актобе"
          club="спортшкола №3"
          rating="2105 · 34 матча"
        />
        <MergeCol
          nm="Ерлан Бекзат"
          sub="зарегистрировался сам, 02.03.2026"
          born="2006"
          city="Актобе"
          club="— не указан"
          rating="1840 · 8 матчей"
        />
      </div>

      <Panel
        title="Что переедет в главную запись ✳"
        extra={<span className="dcount">совпали ФИО, год рождения и город — пара предложена как дубль</span>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Row nm="История матчей" sub="34 + 8 матчей — в одну историю" val="42" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Взносы" sub="2025 и 2026 оплачены" val="2 года" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Заявки на турниры" sub="в том числе одна на Кубок РК" val="6" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Рейтинг" sub="2105 и 1840 — что остаётся, не решено" val="⚠" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        </div>
      </Panel>

      <div className="dactionbar">
        <Alert>Объединение пишется в журнал, но само не откатывается: разделять придётся руками.</Alert>
        <div style={{ display: 'flex', gap: 8 }}>
          <Ghost>Это разные люди</Ghost>
          <button className="dsubmit" style={{ padding: '12px 18px' }}>
            <Merge size={15} /> Объединить
          </button>
        </div>
      </div>
    </RoleScreen>
  );
}

const Merge1_13States = () => (
  <States>
    <Shot
      tone="danger"
      title="Пол или год рождения расходятся ✳"
      text="Предупреждение, что это, возможно, разные люди: объединять без проверки нельзя."
    >
      <Rows>
        <Row nm="Ерлан Бекзат · 2006 · мужской" sub="завела федерация, 14.01.2026" pill={{ t: 'ЗАПИСЬ A', cls: 'reg' }} />
        <Row nm="Ерлан Бекзат · 2009 · мужской" sub="завёл клуб «Достык», 03.02.2026" pill={{ t: 'ЗАПИСЬ Б', cls: 'wait' }} />
      </Rows>
      <Alert tone="danger">
        Год рождения расходится на три года — это может быть однофамилец. Объединение закрыто, пока
        расхождение не разобрано.
      </Alert>
      <Off>Объединить</Off>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ У обеих записей есть рейтинг"
      text="Не решено, какой рейтинг остаётся у объединённой записи и пересчитывается ли история."
    >
      <div className="dactionbar">
        <div className="dcount">Рейтинг записи A</div>
        <div className="amt">2105 · 34 матча</div>
      </div>
      <div className="dactionbar">
        <div className="dcount">Рейтинг записи Б</div>
        <div className="amt">1840 · 8 матчей</div>
      </div>
      <Alert>
        Взять больший, взять рейтинг главной записи или пересчитать движком по объединённой истории —
        решение за федерацией и движком рейтинга (§7.1). В макете место помечено вопросом.
      </Alert>
    </Shot>
  </States>
);

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

const LogRow = ({ l }: { l: Log }) => (
  <div className="drow">
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
);

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
          <LogRow key={l.act + l.who} l={l} />
        ))}
      </Rows>
    </RoleScreen>
  );
}

const Log1_7States = () => (
  <States>
    <Shot
      tone="info"
      title="По фильтру записей нет ✳"
      text="Журнал пуст только по фильтру, а не вообще: видно, какой фильтр это дал."
      wide
    >
      <ActionBar count="0 записей · человек: Тлеуова А. · тип: взносы · период: 7 дней">
        <Btn>Сбросить фильтр</Btn>
      </ActionBar>
      <Empty
        title="За выбранный период этот человек ничего не делал"
        text="Записи журнала не удаляются: пусто здесь означает только то, что под фильтр ничего не попало."
      />
    </Shot>
  </States>
);

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

const NewsRow = ({ n }: { n: News }) => (
  <div className="drow">
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
    <Ghost>Править</Ghost>
    <button className="dpickbtn">{n.cls === 'live' ? 'Снять с публикации' : 'Опубликовать'}</button>
  </div>
);

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
          <NewsRow key={n.nm} n={n} />
        ))}
      </Rows>
    </RoleScreen>
  );
}

const News1_8States = () => (
  <States>
    <Shot
      tone="warning"
      title="Язык не заполнен ✳"
      text="Индикатор пустого перевода; на публичном сайте показывается заполненный язык."
      wide
    >
      <Rows>
        <NewsRow n={NEWS[2]} />
        <NewsRow n={NEWS[4]} />
      </Rows>
      <Alert>
        Серый индикатор — язык пустой. Материал от этого не прячется: посетителю с казахским интерфейсом
        покажется русская версия, а не пустая страница.
      </Alert>
    </Shot>
  </States>
);

/* ── Э1.14 · Редактор материала ────────────────────────────────── */

export function Editor1_14() {
  return (
    <RoleScreen
      role={R01}
      nav="Новости"
      title="Кубок Республики: приём заявок открыт"
      sub="Новость · черновик · публикация 12.04.2026"
      hint="Языки живут в одном материале: переключатель меняет поля, а не создаёт вторую новость."
    >
      <div className="ttabs">
        <span className="ttab on">RU · заполнен</span>
        <span className="ttab">KZ · заполнен</span>
        <span className="ttab" style={{ color: 'var(--c-warning)' }}>EN · пусто</span>
      </div>
      <div className="mkcols">
        <Panel title="Текст · русский">
          <Form>
            <Field label="Заголовок" value="Кубок Республики: приём заявок открыт" wide />
            <Field
              label="Лид"
              value="Заявки на Кубок Республики Казахстан 2026 принимаются до 10 мая через личный кабинет спортсмена."
              wide
            />
            <Field
              label="Текст"
              value="Соревнование пройдёт 18–20 мая в Астане, ДС «Барыс». Главный судья — Оспанов Т. Допуск: годовой взнос федерации и документы к заявке…"
              wide
            />
          </Form>
        </Panel>

        <div style={{ display: 'grid', gap: 12 }}>
          <Panel title="Материал">
            <Form>
              <Field label="Тип" value="Новость" />
              <Field label="Дата публикации" value="12.04.2026" />
            </Form>
            <div style={{ marginTop: 12 }}>
              <Empty title="Обложка 16:9" text="jpg или png, от 1600 px по ширине" />
            </div>
          </Panel>

          <Panel title="Предпросмотр ✳" extra={<Image size={15} />}>
            <Hint>Показывает, как материал встанет на публичном сайте — в списке новостей и на своей странице.</Hint>
          </Panel>
        </div>
      </div>
      <div className="dactionbar">
        <div className="dcount">Английская версия пустая — на сайте вместо неё покажется русская</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Ghost>Сохранить черновик</Ghost>
          <button className="dsubmit" style={{ padding: '12px 18px' }}>
            <Send size={15} /> Опубликовать
          </button>
        </div>
      </div>
    </RoleScreen>
  );
}

const Editor1_14States = () => (
  <States>
    <Shot
      tone="warning"
      title="Язык не заполнен ✳"
      text="Индикатор пустого перевода и пояснение, чем он подменится на сайте."
    >
      <div className="ttabs">
        <span className="ttab on">RU · заполнен</span>
        <span className="ttab">KZ · заполнен</span>
        <span className="ttab" style={{ color: 'var(--c-warning)' }}>EN · пусто</span>
      </div>
      <Empty title="Английская версия не заполнена" text="Скопировать русский текст и перевести — или оставить пустым." />
      <Alert>Публикация не блокируется: посетителю с английским интерфейсом покажется русская версия.</Alert>
    </Shot>

    <Shot
      tone="info"
      title="Правка опубликованного материала ✳"
      text="Изменения видны сразу, и каждая версия пишется в журнал."
    >
      <div className="dactionbar">
        <div className="dcount">Материал опубликован 12.04.2026</div>
        <P t="ОПУБЛИКОВАНО" cls="live" />
      </div>
      <Rows>
        <Row nm="Версия 2 · сейчас" sub="Абаева Д. · 15.04.2026, 09:20 · правка лида" pill={{ t: 'ТЕКУЩАЯ', cls: 'reg' }} />
        <Row nm="Версия 1" sub="Абаева Д. · 12.04.2026, 11:05 · публикация" />
      </Rows>
      <Hint>Правка уходит на сайт сразу — снимать материал с публикации ради этого не нужно.</Hint>
    </Shot>
  </States>
);

/* ── Борд роли ─────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э1.1': {
    cap: 'Панель Федерации',
    view: () => (
      <>
        <Dash1_1 />
        <Dash1_1States />
      </>
    ),
    next: 'пункт «Календарь»',
  },
  'Э1.2': {
    cap: 'Календарь сезона',
    view: () => (
      <>
        <Cal1_2 />
        <Cal1_2States />
      </>
    ),
    next: '«Завести соревнование»',
  },
  'Э1.4': {
    cap: 'Форма «Завести соревнование»',
    view: () => (
      <>
        <New1_4 />
        <Also cap="Шаг 2 · основное">
          <New1_4Step2 />
        </Also>
        <Also cap="Шаг 3 · допуск">
          <New1_4Step3 />
        </Also>
        <Also cap="Шаг 4 · флаги допуска">
          <New1_4Step4 />
        </Also>
        <Also cap="Шаг 5 · столы и «Создать»">
          <New1_4Step5 />
        </Also>
        <New1_4States />
      </>
    ),
    next: '«Создать»',
  },
  'Э1.3': {
    cap: 'Карточка турнира',
    view: () => (
      <>
        <Tour1_3 />
        <Tour1_3States />
      </>
    ),
    next: '«Отменить / перенести»',
  },
  'Э1.9': {
    cap: 'Отмена или перенос',
    view: () => (
      <>
        <Cancel1_9 />
        <Cancel1_9States />
      </>
    ),
    next: 'пункт «Пользователи»',
  },
  'Э1.5': {
    cap: 'Пользователи и роли',
    view: () => (
      <>
        <Users1_5 />
        <Users1_5States />
      </>
    ),
    next: '«Завести аккаунт»',
  },
  'Э1.10': {
    cap: 'Форма «Завести аккаунт»',
    view: () => (
      <>
        <NewUser1_10 />
        <NewUser1_10States />
      </>
    ),
    next: '«Выдать роль сразу»',
  },
  'Э1.11': {
    cap: 'Выдача роли',
    view: () => (
      <>
        <GrantRole1_11 />
        <GrantRole1_11States />
      </>
    ),
    next: 'пункт «Реестры»',
  },
  'Э1.6': {
    cap: 'Реестры',
    view: () => (
      <>
        <Reg1_6 />
        <Reg1_6States />
      </>
    ),
    next: 'строка спортсмена',
  },
  'Э1.12': {
    cap: 'Карточка спортсмена',
    view: () => (
      <>
        <Athlete1_12 />
        <Athlete1_12States />
      </>
    ),
    next: '«Объединить с другой записью»',
  },
  'Э1.13': {
    cap: 'Объединение дублей',
    view: () => (
      <>
        <Merge1_13 />
        <Merge1_13States />
      </>
    ),
    next: 'пункт «Журнал»',
  },
  'Э1.7': {
    cap: 'Журнал действий',
    view: () => (
      <>
        <Log1_7 />
        <Log1_7States />
      </>
    ),
    next: 'пункт «Новости»',
  },
  'Э1.8': {
    cap: 'Новости и страницы',
    view: () => (
      <>
        <News1_8 />
        <News1_8States />
      </>
    ),
    next: '«Править»',
  },
  'Э1.14': {
    cap: 'Редактор материала',
    view: () => (
      <>
        <Editor1_14 />
        <Editor1_14States />
      </>
    ),
  },
};

export function Role01Board() {
  return <Board role={R01} screens={SCREENS} />;
}
