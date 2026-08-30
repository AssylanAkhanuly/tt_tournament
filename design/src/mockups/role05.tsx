/* Роль 5 · Председатель ГСК — макеты по флоу на новом слое (HeroUI) ✳ (30.08.2026).
   Содержание, решения и переходы — прежние (см. `flows/05-predsedatel-gsk.md`);
   меняется подача: оболочка WebApp и доменные компоненты `kit/hero/app` вместо
   старого макетного слоя.

   Две мысли, которые макеты обязаны передать:
   1. роль утверждает, а не подменяет — сетку и расписание строит главный судья
      (TZ §4.6), председатель назначает судью и утверждает протокол;
   2. рейтинг судей считается по Положению (TZ §7.2): R = S1 + S2 + S3 + S4,
      коэффициент 1,5 за роль и за выезд, окно апелляций — 10 дней. */

import { useState, type ReactNode } from 'react';
import {
  ArrowUpDown, BadgeCheck, Ban, Bell, CalendarDays, Check, ClipboardCheck, FileCheck, Gavel,
  GraduationCap, LayoutDashboard, Megaphone, Plus, Trophy, Undo2, Upload, UserPlus, X,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import {
  A, AW, Attention, Bar, DataTable, DisabledAction, EmptyBox, Facts, FieldView,
  FilterSeg, FormGrid, InlineDialog, KV, MONTHS, MonthGrid, PageTabs, Pager, Panel, PickField,
  Pill, PrimaryAction, QuietAction, Row, Rows, ScreenScope, SearchInput, SeasonTable, StatTiles,
  TextInput, TimeGrid, WebApp,
  type AttnItem, type CalEvent, type RoleUI, type SeasonRow, type SlotEvent,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Also, Board, States, Shot, type ScreenMap } from './shell';
/* Сетка — настоящий компонент фронта, как и в прежнем слое: вторая
   нарисованная сетка разошлась бы с той, что увидят в продукте. */
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { myBracket } from './myBracket';
import { Context0_1, Login0_1 } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    `badge: false` — роль вне турнира, значка состояния в шапке нет. */
const R05: RoleUI = {
  num: '5',
  title: 'Председатель ГСК',
  person: { nm: 'Мукашев Б.', rl: 'Председатель ГСК', av: A(83) },
  brandName: 'Судейство сезона',
  brandSub: 'Назначения · протоколы · рейтинг судей',
  badge: false,
  nav: [
    /* «Панель» и «Соревнования» — разные вещи ✳: панель отвечает «что решить
       сегодня», раздел соревнований — «что в сезоне есть». Пока пункт был один,
       панель работала за оба, и попасть на конкретный турнир было неоткуда. */
    [<LayoutDashboard size={16} key="p" />, 'Панель'],
    [<Trophy size={16} key="t" />, 'Соревнования'],
    /* «Судьи» — список судей, а не судьи по турнирам ✳: наряд собирается в
       карточке самого турнира, а этот пункт отвечает «кто у нас вообще есть». */
    [<Gavel size={16} key="s" />, 'Судьи'],
    /* Документы и публикация — свои пункты, а не счётчики внутри рейтинга:
       обе обязанности из Положения (§7.2) живут своим ритмом. */
    [<ClipboardCheck size={16} key="d" />, 'Документы'],
    /* Аттестация — свой раздел ✳ (комментарий федерации, 09.2026): онлайн-тест
       с комиссией, сроками и базой вопросов, цикл у неё свой. */
    [<GraduationCap size={16} key="a" />, 'Аттестация'],
    [<Megaphone size={16} key="pu" />, 'Публикация'],
  ],
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. */
type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const P = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

/** Таблица с «живыми» строками. Готовый DataTable рисует однородные строки, а
    здесь строка меняет и подпись, и тон от принятого решения — шапка та же,
    строки собирает сам экран. */
const Sheet = ({ cols, grid, children }: { cols: ReactNode[]; grid: string; children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <div
      className="grid items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
      style={{ gridTemplateColumns: grid }}
    >
      {cols.map((c, i) => <span key={i} className="min-w-0">{c}</span>)}
    </div>
    <div className="divide-y divide-neutral-100">{children}</div>
  </div>
);

/** Заголовок сортируемого столбца: список судей сравнивают по разным полям. */
const Th = ({ t, on, onClick }: { t: string; on: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={'flex items-center gap-1 text-left ' + (on ? 'text-neutral-700' : 'hover:text-neutral-600')}
  >
    {t}
    {on && <ArrowUpDown size={11} />}
  </button>
);

/** Пустой результат поиска — строкой таблицы, а не отдельным экраном. */
const NoRows = ({ children }: { children: ReactNode }) => (
  <div className="px-4 py-4 text-[12.5px] text-neutral-500">{children}</div>
);

/** Человек в строке таблицы: фото и две строки. `to` — переход в карточку. */
const Who = ({ av, nm, sub, to }: { av: string; nm: string; sub?: ReactNode; to?: string }) => {
  const inner = (
    <>
      <Avatar size="sm">
        <Avatar.Image alt={nm} src={av} />
        <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[13.5px] font-medium">{nm}</span>
        {sub && <span className="block truncate text-xs text-neutral-500">{sub}</span>}
      </span>
    </>
  );
  return to ? (
    <button type="button" data-to={to} className="flex min-w-0 items-center gap-2.5 text-left">{inner}</button>
  ) : (
    <span className="flex min-w-0 items-center gap-2.5">{inner}</span>
  );
};

/** Малые плитки-показатели внутри панели (зона сверки, слагаемые рейтинга).
    Тон `b` — акцент, как в старом слое; `r` — тревога. */
const CELL_TONE = { g: 'text-green-700', a: 'text-amber-600', r: 'text-red-600', b: 'text-blue-700' } as const;
const Cells = ({ items, cols = 2 }: { items: { v: string; k: string; tone?: keyof typeof CELL_TONE }[]; cols?: number }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
    {items.map((c) => (
      <div key={c.k} className="rounded-lg bg-neutral-50 px-3 py-2.5">
        <div className={'text-lg font-semibold leading-tight tabular-nums ' + (c.tone ? CELL_TONE[c.tone] : '')}>{c.v}</div>
        <div className="mt-0.5 text-[11px] text-neutral-500">{c.k}</div>
      </div>
    ))}
  </div>
);

/** Подзаголовок раздела внутри панели-документа (протокол). */
const Sec = ({ children }: { children: ReactNode }) => (
  <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 first:mt-0">{children}</div>
);

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/** Рамка для кадра с диалогом. `InlineDialog` — абсолютный слой поверх экрана
    (`absolute inset-0`), и в кадре состояния ему не от чего отталкиваться:
    без явной высоты рамка схлопывается в полосу, а диалог пропадает. Высота
    задаётся здесь, содержимое диалога прокручивается внутри него самого. */
const DialogFrag = ({ h, children }: { h: number; children: ReactNode }) => (
  <div
    className="relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
    style={{ height: h }}
  >
    {children}
  </div>
);

/* ── Э0.1 · Вход: состояния на борде роли ───────────────────────── */

/** Состояния входа — по данным сквозных экранов (`data/role00.ts`, Э0.1).
    Сам экран общий и импортируется из role00; его полка States там не
    экспортируется, поэтому кадры собраны здесь тем же содержанием. */
const Login0_1States5 = () => (
  <States>
    <Shot tone="danger" title="Неверный логин или пароль" text="Ошибка под полем; поля не очищаются.">
      <Frag w={420}>
        <FormGrid>
          <TextInput label="Телефон или почта" value="+7 707 118 42 55" wide />
          <TextInput label="Пароль" value="••••••" bad wide />
          <span className="col-span-2 -mt-1 text-xs font-medium text-red-600">
            Неверный логин или пароль. Проверьте раскладку или восстановите пароль
          </span>
        </FormGrid>
        <div className="mt-3"><DisabledAction>Войти</DisabledAction></div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Роль истекла"
      text="Роли нет в списке контекстов, история действий человека сохраняется."
    >
      <Frag>
        <Rows>
          <Row
            nm="Председатель ГСК · сезон 2026"
            sub="выдана Федерацией · действует весь сезон"
            pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
          />
          <Row
            nm="Судья · Открытие сезона 2026"
            sub="срок вышел 21.01.2026"
            pill={{ t: 'ИСТЕКЛА', cls: 'done' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Истёкшая роль в выбор не попадает: войти под ней нельзя. Всё, что человек делал в ней,
            остаётся в журнале с его именем.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Аккаунт не активирован ✳"
      text="Приглашение отправлено, но пароль ещё не задан — стыкуется с Э1.10."
      wide
    >
      <Frag>
        <Bar>
          На этот адрес отправлено приглашение 15.04.2026. Пароль задаётся по ссылке из письма — до
          этого вход не работает.
        </Bar>
        <div className="flex items-center gap-2">
          <QuietAction>Отправить приглашение ещё раз</QuietAction>
          <DisabledAction>Войти</DisabledAction>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.1 · Панель ГСК: очередь решений ─────────────────────────── */

/** Очередь председателя ГСК. Тот же компонент, что у администратора федерации:
    вопрос один — «что от меня ждут». Разница в колонке решения: здесь ждут
    самого председателя, поэтому в ней написано, что именно решить. */
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

/** Панель ГСК: как идёт сезон и что решить сегодня.

    Экран навигационный ✳: он не место работы, а вход в неё. Календарь целиком
    живёт в своём разделе (Э5.3), а здесь — очередь решений, счётчики сезона и
    три ближайших старта. Проп `variant` старой адаптивной рамки сохранён ради
    истории «Адаптив»: у нового слоя своей планшетной рамки веба пока нет. */
export function Queues5_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <WebApp
      role={R05}
      nav="Панель"
      title="Панель ГСК"
      sub="Сезон 2026 · назначения, протоколы и рейтинг судей"
    >
      {/* Очередь первой: главный акцент экрана — «что от меня ждут». */}
      <Attention items={ATTENTION5} />

      <StatTiles
        items={[
          { v: '8', k: 'Официальных стартов' },
          { v: '41', k: 'Заявок судей подано', tone: 'g' },
          { v: '12', k: 'Протоколов утверждено' },
          { v: '86', k: 'Судей в рейтинге' },
        ]}
      />

      {/* Ближайшие старты — обзор, а не очередь: решения они не ждут, но по ним
          видно, что впереди. Строка ведёт в карточку турнира, весь календарь —
          своим разделом: панель не должна быть вторым календарём. */}
      <Panel
        title="Ближайшие старты"
        extra={<Button size="sm" variant="outline" data-to="Э5.3">Все соревнования сезона</Button>}
        flush
      >
        <div className="divide-y divide-neutral-100">
          <Row
            nm="Открытый турнир «Тараз Опен»"
            sub="Тараз · 16–17.08 · подано 3 заявки судей"
            pill={{ t: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' }}
            to="Э5.10"
          />
          <Row
            nm="Первенство РК до 19 лет"
            sub="Шымкент · 24–27.08 · подано 6 заявок судей"
            pill={{ t: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' }}
            to="Э5.10"
          />
          <Row
            nm="Кубок вызова, 1-й тур"
            sub="Актобе · 03–05.10 · приём заявок судей ещё не открыт"
            pill={{ t: 'ЧЕРНОВИК', cls: 'done' }}
            to="Э5.10"
          />
        </div>
      </Panel>
    </WebApp>
  );
}

const Queues5_1States = () => (
  <States>
    <Shot tone="info" title="Обе очереди пустые" text="«Решений не ждёт ничего»." wide>
      <Frag>
        <EmptyBox
          title="Решений не ждёт ничего"
          text="Ни одного турнира без судьи и ни одного протокола на утверждении."
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.3 · Соревнования сезона ─────────────────────────────────── */

/** Календарь глазами коллегии: не «что от меня ждут», а «что в сезоне есть».
    Строка открывает карточку турнира (Э5.10); колонка состояния — про сам
    турнир (§4.3), словарь `TST` нового слоя. Таблица та же, что у региона
    (Э12.2) и клуба (Э13.6): один календарь, разными глазами. */
const SEASON5: SeasonRow[] = [
  {
    key: 'taraz', m: 8, nm: 'Открытый турнир «Тараз Опен»', sub: 'Открытый республиканский',
    when: 'Тараз · 16–17.08', val: 'до старта 4 дня', st: 'claim', tst: 'judges', to: 'Э5.10', wait: true,
  },
  {
    key: 'u19', m: 8, nm: 'Первенство РК до 19 лет', sub: 'Главный старт · 2007 г.р. и моложе',
    when: 'Шымкент · 24–27.08', val: 'до старта 12 дней', st: 'claim', tst: 'judges', to: 'Э5.10',
  },
  {
    key: 'cup', m: 9, nm: 'Кубок Республики Казахстан 2026', sub: 'Главный старт',
    when: 'Караганда · 12–15.09', val: 'до старта 31 день', st: 'claim', tst: 'judges', to: 'Э5.10',
  },
  {
    key: 'league', m: 10, nm: 'Кубок вызова, 1-й тур', sub: 'Евразийская лига · командный',
    when: 'Актобе · 03–05.10', val: 'приём заявок судей не открыт', st: 'claim', tst: 'draft', to: 'Э5.10',
  },
  {
    key: 'u15', m: 8, nm: 'Первенство РК до 15 лет', sub: 'Главный старт · 2011 г.р. и моложе',
    when: 'Костанай · 30.07–02.08', val: 'протокол ждёт 10 дней', st: 'claim', tst: 'protocol', to: 'Э5.10', wait: true,
  },
  {
    key: 'alatau', m: 8, nm: '«Алатау Опен» 2026', sub: 'Открытый республиканский',
    when: 'Алматы · 07–09.08', val: 'протокол ждёт 3 дня', st: 'claim', tst: 'protocol', to: 'Э5.10',
  },
  {
    key: 'champ', m: 5, nm: 'Чемпионат Казахстана 2026', sub: 'Главный старт',
    when: 'Астана · 18–20.05', val: 'протокол утверждён 24.05', st: 'claim', tst: 'done', to: 'Э5.10',
  },
];

/** Фильтр по состоянию: сезон длинный, а смотрят обычно один его срез. */
const SEASON_FILTER = ['Все', 'Ждут решения', 'Идут и впереди', 'Завершены'];

/** Сегодня в макете. Дата задана здесь, а не берётся у машины ✳: от неё
    считаются «до старта 4 дня» и «протокол ждёт 10 дней» в строках сезона, и
    макет обязан выглядеть одинаково у всех смотрящих. */
const TODAY5 = '2026-08-12';

/** Те же даты сезона машинно ✳: в строке таблицы они написаны для человека
    («Тараз · 16–17.08»), а календарю нужны 'ГГГГ-ММ-ДД'. Словарь по ключу
    строки, а не вторая таблица: список названий разошёлся бы с SEASON5. */
const SEASON_DAYS: Record<string, { from: string; till: string }> = {
  taraz: { from: '2026-08-16', till: '2026-08-17' },
  u19: { from: '2026-08-24', till: '2026-08-27' },
  cup: { from: '2026-09-12', till: '2026-09-15' },
  league: { from: '2026-10-03', till: '2026-10-05' },
  u15: { from: '2026-07-30', till: '2026-08-02' },
  alatau: { from: '2026-08-07', till: '2026-08-09' },
  champ: { from: '2026-05-18', till: '2026-05-20' },
};

/** Тон полосы — по состоянию турнира, а не по красоте: горящий срок красным,
    протокол на решении — тревожным, черновик серым, завершённый зелёным. */
const seasonTone = (r: SeasonRow): CalEvent['tone'] =>
  r.tst === 'done'
    ? 'success'
    : r.tst === 'protocol'
      ? 'warning'
      : r.tst === 'draft'
        ? 'neutral'
        : r.wait
          ? 'danger'
          : 'accent';

/** Строки сезона → события календаря. `to` сохраняется: полоса открывает ту же
    карточку турнира, что и строка таблицы. */
const seasonEvents = (rows: SeasonRow[]): CalEvent[] =>
  rows.map((r) => ({
    id: r.key,
    nm: r.nm,
    from: SEASON_DAYS[r.key].from,
    till: SEASON_DAYS[r.key].till,
    tone: seasonTone(r),
    sub: r.when,
    to: r.to,
  }));

/** Какой месяц показывать ✳: тот, где стоит ближайший старт выборки, а если
    впереди ничего нет — самый ранний. Прибитый «текущий месяц» открывал бы на
    фильтре «завершены» пустую сетку, хотя турнир в выборке есть. */
const seasonMonth = (evs: CalEvent[]) => {
  const byDate = [...evs].sort((a, b) => a.from.localeCompare(b.from));
  return (byDate.find((e) => (e.till ?? e.from) >= TODAY5) ?? byDate[0])?.from ?? TODAY5;
};

const monthWords = (day: string) => `${MONTHS[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}`;

/** Два вида одного сезона ✳. Список отвечает на «что решить и когда» — по нему
    работают, и он остаётся основным. Календарь отвечает на «как сезон стоит по
    месяцам»: турнир идёт несколько дней, и полоса показывает длительность и
    наложение стартов — по строке таблицы этого не видно, а судейская бригада
    одна на всех (см. предупреждение о пересечении дат в Э5.11). */
const SEASON_VIEWS = ['Список', 'Календарь'];

/** Календарный вид сезона: один месяц полосами по дням.

    Компонент отдельный ✳, потому что мест у него два: второй вид самого экрана
    и врезка на борде. На борде экран снят в состоянии по умолчанию — списком, —
    и календарь, ради которого вид заводился, в кадр не попадал вовсе. Второй
    нарисованный календарь разошёлся бы с тем, что переключает сам экран. */
const SeasonCalendar5 = ({ rows }: { rows: SeasonRow[] }) => {
  const events = seasonEvents(rows);
  const month = seasonMonth(events);
  return (
    <>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-[13.5px] font-semibold">{monthWords(month)}</h3>
        <span className="text-[12.5px] text-neutral-500">
          полоса — весь турнир, а не день старта
        </span>
      </div>
      <MonthGrid month={month} events={events} today={TODAY5} />
      <div className="mt-3">
        <Bar>
          В сетке стоит один месяц — тот, где ближайший старт выборки; соревнования других
          месяцев видны в списке. Полоса ведёт в ту же карточку турнира, что и строка.
        </Bar>
      </div>
    </>
  );
};

export function Season5_3() {
  const [f, setF] = useState(SEASON_FILTER[0]);
  const [view, setView] = useState(SEASON_VIEWS[0]);
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const rows = SEASON5.filter((r) => {
    const waiting = r.tst === 'protocol' || (r.tst === 'judges' && r.wait);
    if (f === 'Ждут решения' && !waiting) return false;
    if (f === 'Идут и впереди' && (r.tst === 'done' || r.tst === 'protocol')) return false;
    if (f === 'Завершены' && r.tst !== 'done') return false;
    return !t || r.nm.toLowerCase().includes(t) || r.sub.toLowerCase().includes(t) || r.when.toLowerCase().includes(t);
  });
  return (
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Соревнования сезона"
      sub="Официальные старты календаря ФНТ РК · строка открывает карточку турнира"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg items={SEASON_FILTER} active={f} onPick={setF} />
        <Button variant="primary" data-to="Э5.11">
          <Plus size={15} /> Завести соревнование
        </Button>
      </div>
      {/* Вид — рядом с поиском, а не в одну строку с фильтром: фильтр сужает
          выборку, а вид меняет её подачу; рядом они читались бы как два
          фильтра. Переключение настоящее — оно и есть смысл переключателя. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <SearchInput value={q} onChange={setQ} placeholder="Название, категория или город" className="w-80" />
        <FilterSeg items={SEASON_VIEWS} active={view} onPick={setView} />
      </div>

      {/* Календарь считается по той же выборке, что и таблица: фильтр и поиск
          работают в обоих видах, иначе переключение вида молча меняло бы
          состав. */}
      {rows.length ? (
        view === 'Календарь' ? <SeasonCalendar5 rows={rows} /> : <SeasonTable rows={rows} />
      ) : (
        <EmptyBox title="Ничего не нашлось" text="Проверьте написание или снимите фильтр." />
      )}

      {/* Счётчик под таблицей: сколько показано из скольких. */}
      <div className="mt-3 text-[12.5px] text-neutral-500">
        {rows.length === SEASON5.length
          ? `${SEASON5.length} стартов в сезоне`
          : `показано ${rows.length} из ${SEASON5.length}`}
      </div>
    </WebApp>
  );
}

/** Тот же экран, открытый календарным видом ✳. На борде экран снят в состоянии
    по умолчанию — списком, — и второй вид, ради которого календарь и встраивали,
    в кадр не попадал: чтобы его увидеть, надо было нажать переключатель.
    Выборка та же, что у списка по умолчанию: фильтр «Все», поиск пуст.
    Ширина 940 — рабочая область ноутбука (1200 − сайдбар 212 − поля 48). */
const Season5_3Also = () => (
  <Also cap="Вид «Календарь» — тот же сезон полосами по дням">
    <Frag w={940}>
      <SeasonCalendar5 rows={SEASON5} />
    </Frag>
  </Also>
);

const Season5_3States = () => (
  <States>
    <Shot
      tone="info"
      title="Сезон ещё не заведён"
      text="Календарь пуст — остаётся одно действие: завести первое соревнование."
    >
      <Frag w={520}>
        <EmptyBox title="Соревнований сезона пока нет" text="Заведите первое — остальное появится по ходу." />
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Срок горит"
      text="До старта меньше недели, а судья не назначен: такие строки идут первыми и подсвечены."
    >
      <Frag>
        <Rows>
          <Row
            nm="Открытый турнир «Тараз Опен»"
            sub="Тараз · 16–17.08 · подано 3 заявки судей"
            val="до старта 4 дня"
            pill={{ t: 'ЗАЯВКИ СУДЕЙ', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">
            Пока главный судья не назначен, турнир не опубликовать и приём заявок игроков не открыть.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.11 · Заведение соревнования ─────────────────────────────── */

/** Официальный турнир заводит председатель ГСК (TZ §4.4).

    Полей ровно столько, сколько известно на этот момент ✳: название, категория
    календаря, город и окно дат. Столов, формата и трансляции здесь нет — в день
    заведения их не знают: зал не подтверждён, а систему проведения строит потом
    главный судья (§4.5, §4.6). Форма, которая спрашивает их сразу, заставляет
    выдумать число и потом его править. */
const CATS5 = ['Главный старт', 'Евразийская лига', 'Открытый республиканский'];

/** Дата по-русски ✳: нативный `input[type=date]` рисует значение локалью
    браузера — в en-US выходит MM/DD/YYYY, и «10/03/2026» читается как
    10 марта. Значение показываем сами, ДД.ММ.ГГГГ, независимо от локали. */
const RuDate = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    <span className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm tabular-nums">
      {value}
      <CalendarDays size={14} className="shrink-0 text-neutral-400" />
    </span>
  </div>
);

export function NewTour5_11() {
  const [cat, setCat] = useState(CATS5[1]);
  return (
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Завести соревнование"
      back={{ label: 'Соревнования сезона', to: 'Э5.3' }}
      sub="Только то, что известно сегодня — остальное дозаполняется в карточке"
    >
      <Panel title="Новое соревнование">
        <FormGrid>
          <TextInput label="Название" value="Кубок вызова, 2-й тур" wide />
          {/* Категорий три и они видны все: выбор — проектное решение календаря,
              прятать его в закрытый список незачем. */}
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Категория календаря</span>
            <div><FilterSeg items={CATS5} active={cat} onPick={setCat} /></div>
          </div>
          <TextInput label="Город" value="Актобе" />
          {/* Окно дат — два календаря, а не строка «03–05.10»: даты выбирают,
              а не печатают, и границы окна — две разные даты. */}
          <RuDate label="Окно дат · начало" value="03.10.2026" />
          <RuDate label="Окно дат · окончание" value="05.10.2026" />
        </FormGrid>
        <div className="mt-4">
          <Bar>
            Столы, формат и возрастная граница здесь не спрашиваются: на момент заведения их не
            знают. Они дозаполняются в карточке турнира, пока он в черновике, а систему проведения
            строит главный судья по собранному составу.
          </Bar>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[12.5px] text-neutral-500">
            Турнир появится в календаре черновиком — публично не виден
          </span>
          <PrimaryAction>Создать</PrimaryAction>
        </div>
      </Panel>
    </WebApp>
  );
}

const NewTour5_11States = () => (
  <States>
    <Shot tone="warning" title="Окно дат не выбрано" text="«Создать» неактивна: без дат старт не встанет в календарь.">
      <Frag w={520}>
        <FormGrid>
          <FieldView label="Название" value="Кубок вызова, 2-й тур" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Окно дат</span>
            <span className="w-full rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
              — не выбрано
            </span>
          </div>
        </FormGrid>
        <div className="mt-3"><DisabledAction>Создать</DisabledAction></div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Даты пересекаются с другим стартом ✳"
      text="Предупреждение, а не запрет: два старта в одни дни бывают, но судей на оба может не хватить."
    >
      <Frag>
        <Bar tone="warning">
          В эти дни уже стоит «Первенство РК до 19 лет» (Шымкент, 24–27.08). Судейская бригада у вас
          одна — проверьте, хватит ли людей.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.10 · Карточка турнира ───────────────────────────────────── */

/** Всё про один турнир в одном месте: регламент, наряд судей, состав, сетка,
    расписание и протокол. Разделы читаются, а не правятся: **роль утверждает,
    а не подменяет** (§4.6) — от председателя тут два решения: назначить судью
    и закрыть протокол. */
const TOUR_TABS5 = ['Регламент', 'Судьи', 'Участники', 'Сетка', 'Расписание', 'Протокол'];

/** Кто назначает соревнование — по уровню, а не по одному правилу на всех ✳
    (комментарий федерации, 09.2026): чемпионат РК и турниры федерации — ФНТ РК,
    любительские — федерация города или района. ⚠ Как это ложится на роли —
    есть ли председатель ГСК у городской федерации — не решено. */
const APPOINTER: Record<string, string> = {
  'Главный старт': 'Федерация настольного тенниса РК',
  'Чемпионат РК': 'Федерация настольного тенниса РК',
  ОРТ: 'Федерация настольного тенниса РК',
  Лига: 'Федерация настольного тенниса РК',
  Любительский: 'Федерация города · Караганда',
};

/** Регламент на чтение. Пустые поля — не ошибка: столов и формата на момент
    заведения не знают, они появляются позже. */
const Rules5_10 = () => (
  <div className="grid grid-cols-2 items-start gap-4">
    <Panel title="Регламент" extra={<P t="ЗАПОЛНЕН НЕ ДО КОНЦА" cls="wait" />}>
      <KV
        items={[
          ['Категория календаря', 'Главный старт'],
          /* Назначающая федерация выводится из категории, а не выбирается. */
          ['Назначает соревнование', APPOINTER['Главный старт']],
          ['Город', 'Караганда'],
          ['Окно дат', '12–15 сентября 2026'],
          ['Разряды', 'Одиночный · парный'],
          ['Формат', <span key="f" className="text-neutral-400">— задаст главный судья</span>],
          ['Столов', <span key="s" className="text-neutral-400">— уточняется</span>],
        ]}
      />
      <div className="mt-4">
        <Bar>
          Формат и столы задаются позже: систему проведения строит главный судья по собранному
          составу (§4.5), утверждение коллегией ей не требуется (§4.6).
        </Bar>
        <Bar tone="warning">
          ⚠ Чемпионат РК и турниры федерации назначает ФНТ РК, любительские — федерация города
          или района. Кто в этом случае собирает судейскую коллегию, не решено.
        </Bar>
      </div>
    </Panel>

    <Panel title="Что можно сделать" flush>
      <div className="divide-y divide-neutral-100">
        <Row
          nm="Дозаполнить регламент"
          sub="то, чего не знали при заведении: формат, столы, трансляция"
          pill={{ t: 'ПОКА ЧЕРНОВИК', cls: 'done' }}
          action="Править"
        />
        <Row
          nm="Приём заявок судей"
          sub="без заявок некого назначать"
          pill={{ t: 'ОТКРЫТ', cls: 'wait' }}
          action="Закрыть приём"
        />
        <Row nm="Заявки судей" sub="подано 9 · нужно 10 в бригаду" action="Разобрать" to="Э5.2" />
        <Row nm="Отмена или перенос" sub="заявки сохраняются, заявители уведомлены" action="Перенести" />
      </div>
      <div className="px-4 pb-1 pt-3">
        <Bar>Публикует турнир и открывает приём заявок игроков администратор Федерации (Э1.3).</Bar>
      </div>
    </Panel>
  </div>
);

/* Состав участников в старом слое брался из Э14.5 тем же компонентом. Его
   таблица осталась на старом слое, поэтому список собран заново новым слоем —
   генератор тот же, что у спортсмена, чтобы фамилии совпадали. ⚠ Когда роль 14
   переедет на новый слой, состав должен снова стать общим компонентом. */
const SURN5 = [
  'Смагулов', 'Ким', 'Токаев', 'Жумабеков', 'Пак', 'Гладун', 'Оспанов', 'Байжанов',
  'Абиш', 'Сериков', 'Цой', 'Ли', 'Мурат', 'Асан', 'Бекзат', 'Кайрат',
  'Нурлан', 'Тлеу', 'Садык', 'Жанибек', 'Алтай', 'Ерасыл', 'Мади', 'Арман',
];
const FIRST5 = ['Алан', 'Георгий', 'Марат', 'Расул', 'Сергей', 'Игорь', 'Тимур', 'Ерасыл', 'Данияр', 'Асхат'];
const CITY5: [string, string][] = [
  ['Астана', 'СКА'], ['Алматы', '«Алатау»'], ['Шымкент', '«Жетісу»'], ['Караганда', '«Шахтёр»'],
  ['Павлодар', '«Иртыш»'], ['Актобе', '«Актобе»'], ['Тараз', 'без клуба'], ['Костанай', '«Тобол»'],
];
const ROSTER5 = Array.from({ length: 128 }, (_, i) => {
  const [city, club] = CITY5[i % CITY5.length];
  const nm = `${SURN5[i % SURN5.length]} ${FIRST5[(i * 7 + Math.floor(i / SURN5.length)) % FIRST5.length]}`;
  return { s: i + 1, nm, city, club, r: 2612 - i * 7 - (i % 5) };
});

/** Вкладка «Участники»: таблица состава с поиском и страницами по 30 — на
    главном старте 128 человек, глазами в таком списке не ищут. Сеяные —
    первые шестнадцать по рейтингу — помечены. */
const Players5_10 = () => {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const t = q.trim().toLowerCase();
  const found = ROSTER5.filter(
    (p) => !t || p.nm.toLowerCase().includes(t) || p.club.toLowerCase().includes(t) || p.city.toLowerCase().includes(t),
  );
  const pages = Math.max(1, Math.ceil(found.length / 30));
  const cur = Math.min(page, pages - 1);
  const shown = found.slice(cur * 30, cur * 30 + 30);
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <SearchInput
          value={q}
          onChange={(v) => { setQ(v); setPage(0); }}
          placeholder="Фамилия, клуб или регион"
          className="w-80"
        />
        <Facts
          items={[
            { k: found.length === ROSTER5.length ? 'участников' : 'найдено', v: found.length === ROSTER5.length ? '128' : `${found.length} из 128`, },
            { k: 'сеяных', v: '16' },
          ]}
        />
      </div>
      {shown.length ? (
        <DataTable
          cols={['№ посева', 'Участник', 'Регион и клуб', 'Рейтинг', '']}
          grid="86px 1.6fr 1.4fr 90px 110px"
          rows={shown.map((p) => ({
            key: String(p.s),
            cells: [
              <b key="s" className="tabular-nums">{p.s}</b>,
              <span key="n" className="font-medium">{p.nm}</span>,
              <span key="c" className="text-neutral-500">{p.city} · {p.club}</span>,
              <span key="r" className="tabular-nums">{p.r}</span>,
              p.s <= 16 ? <P key="p" t="СЕЯНЫЙ" cls="reg" /> : <span key="p" />,
            ],
          }))}
        />
      ) : (
        <EmptyBox title="Никого не нашлось" text={`По запросу «${q}» никого нет — проверьте написание фамилии.`} />
      )}
      {pages > 1 && <Pager page={cur} pages={pages} onPick={setPage} />}
    </>
  );
};

/** Вкладка «Сетка»: настоящая сетка тем же компонентом, что на фронте — на
    чтение. Светлый тон: новый слой светлый, чёрная плоскость из него выпадала. */
const Bracket5_10 = () => (
  <div className="relative h-[430px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
    <div className="absolute inset-0 [&>div]:h-full!">
      <BracketFlow bracket={myBracket} minZoom={0.15} fitPadding={0.06} tone="light" />
    </div>
  </div>
);

/* Расписание в старом слое бралось из карточки турнира федерации (Э1.3); его
   календарь остался на старом слое, поэтому те же дни, круги и столы собраны
   заново. ⚠ При переезде роли 1 на новый слой — снова общий компонент.

   Содержание прежнее, вид машинный ✳: дата 'ГГГГ-ММ-ДД', время 'ЧЧ:ММ' и число
   занятых столов. Из тех же значений таблица собиралась строками, а сетка
   времени — колонками столов; выдумывать матчи для этого не потребовалось. */
const SCHED5 = [
  { key: 'd1', day: '2026-09-12', round: 'Группы', from: '10:00', till: '19:00', tables: 16, n: '72 матча' },
  { key: 'd2', day: '2026-09-13', round: 'Группы', from: '10:00', till: '19:00', tables: 16, n: '72 матча' },
  { key: 'd3a', day: '2026-09-14', round: '1/16 финала', from: '10:00', till: '12:30', tables: 16, n: '16 матчей' },
  { key: 'd3b', day: '2026-09-14', round: '1/8 финала', from: '13:30', till: '15:30', tables: 8, n: '8 матчей' },
  { key: 'd3c', day: '2026-09-14', round: '1/4 финала', from: '16:30', till: '18:00', tables: 4, n: '4 матча' },
  { key: 'd4a', day: '2026-09-15', round: '1/2 финала', from: '11:00', till: '12:30', tables: 2, n: '2 матча' },
  { key: 'd4b', day: '2026-09-15', round: 'Финал', from: '14:00', till: '15:30', tables: 1, n: 'трансляция' },
];

/** Дни турнира: подпись переключателя и дата для сетки. */
const SCHED_DAYS = [
  { d: '2026-09-12', t: '12 сентября · сб' },
  { d: '2026-09-13', t: '13 сентября · вс' },
  { d: '2026-09-14', t: '14 сентября · пн' },
  { d: '2026-09-15', t: '15 сентября · вт' },
];

/** Вкладка «Расписание»: сетка времени вместо таблицы ✳ — колонки столы, ось
    часы. Таблица отвечала на «влезает ли турнир в четыре дня и шестнадцать
    столов» пятью числами в строке, а зал читают глазами: по сетке сразу видно,
    когда столы освобождаются и сколько зал простаивает. Поматчевого списка
    по-прежнему нет намеренно: 175 блоков отвечали бы на «когда мой матч», а это
    вопрос главного судьи (Э6.5). */
const Schedule5_10 = () => {
  /* Открыт третий день ✳: в групповые дни все шестнадцать столов заняты
     одинаково с 10 до 19 — сетка в них одна полоса, — а в день плей-офф
     расписание меняется трижды, и по нему видно, как столы освобождаются
     круг за кругом. */
  const [day, setDay] = useState(SCHED_DAYS[2].t);
  const cur = SCHED_DAYS.find((x) => x.t === day) ?? SCHED_DAYS[0];
  const rounds = SCHED5.filter((r) => r.day === cur.d);
  /* Колонок столько, сколько столов занято в этот день: шестнадцать пустых
     колонок в день финала врали бы про загрузку зала. */
  const tables = Math.max(...rounds.map((r) => r.tables));
  const cols = Array.from({ length: tables }, (_, i) => ({
    key: `t${i + 1}`,
    t: String(i + 1),
    /* Первый стол — центральный: на нём финал и трансляция (см. SCHED5). */
    sub: i === 0 ? 'трансляция' : undefined,
  }));
  /* Круг занимает столы подряд с первого: поимённо — кто на каком столе играет
     и судит — расписывает главный судья (Э6.5), здесь известно только число. */
  const slots: SlotEvent[] = rounds.flatMap((r) =>
    Array.from({ length: r.tables }, (_, i) => ({
      id: `${r.key}-${i + 1}`,
      col: `t${i + 1}`,
      from: r.from,
      till: r.till,
      nm: r.round,
      tone: r.round === 'Финал' ? ('success' as const) : ('accent' as const),
    })),
  );
  return (
    <Panel
      title="Расписание"
      extra={<span className="text-xs text-neutral-500">4 дня · 16 столов · 175 матчей</span>}
    >
      {/* День выбирается по-настоящему: сетка времени показывает один день, а
          турнир идёт четыре — без переключателя три из них были бы не видны.
          Что означают колонки — сказано рядом с сеткой, а не в плашке под ней:
          номера столов надо понимать, ещё глядя на сетку. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg items={SCHED_DAYS.map((x) => x.t)} active={day} onPick={setDay} />
        <span className="text-[12.5px] text-neutral-500">колонки — столы зала, ось — время дня</span>
      </div>

      {/* Шкала одна на все дни (10:00–19:00): так по пустому низу сетки видно,
          что день плей-офф короче группового. */}
      <TimeGrid cols={cols} events={slots} from={10} till={19} />

      {/* Матчи по кругам — то же число, что стояло столбцом в таблице: в блоке
          его писать нельзя, оно про весь круг, а не про один стол. */}
      <div className="mt-3 text-[12.5px] text-neutral-500">
        {rounds.map((r) => `${r.round} — ${r.n}, столов ${r.tables}`).join(' · ')}
      </div>

      <div className="pt-3">
        <Bar>Расписание считается по сетке и строит его главный судья — здесь оно на чтение.</Bar>
      </div>
    </Panel>
  );
};

/** Расписание врезкой ✳: карточка турнира снята на первой вкладке
    («Регламент»), и шкала со столами — то, ради чего вкладка заводилась, — в
    кадр борда не попадала. Компонент тот же, что во вкладке: второй нарисованной
    шкале разойтись было бы с чем. */
const Schedule5_10Also = () => (
  <Also cap="Вкладка «Расписание» — шкала игрового дня, колонки-столы">
    <Frag w={940}>
      <Schedule5_10 />
    </Frag>
  </Also>
);

/** Вкладка «Судьи»: весь наряд этого старта и управление им — тем же
    компонентом, что и в разборе очереди (Э5.2): двумя реализациями наряд в
    карточке и в очереди разъехался бы. */
const Crew5_10 = () => (
  <>
    <JudgeCrew cur={OPEN_TOURS[2]} />
    <div className="mt-4">
      <Bar>
        Пока на каждый стол нет судьи, главный судья не запустит игру: столы распределяет он сам
        на этапе системы проведения (Э6.5). Если заявок меньше, чем мест, недостающих добирают из
        реестра судей (Э5.8).
      </Bar>
    </div>
  </>
);

/** Вкладка «Протокол»: то же решение, что в очереди (Э5.4), но на месте —
    когда председатель пришёл смотреть турнир целиком, а не разбирать очередь. */
const Protocol5_10 = () => (
  <div className="grid grid-cols-2 items-start gap-4">
    <Panel title="Итоговый протокол" extra={<P t="ЖДЁТ РЕШЕНИЯ" cls="wait" />}>
      <Rows>
        <Row nm="Сформирован" sub="главный судья Оспанов Т. · 15.09, 19:40" pill={{ t: 'ВВОД ЗАКРЫТ', cls: 'reg' }} />
        <Row nm="Матчей сыграно" sub="175 из 175 · правок счёта 3, все в журнале" val="175" />
        <Row nm="Ждёт решения" sub="3 дня · пока протокол не закрыт, рейтинг не считается" val="3 дня" />
      </Rows>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500">
          Утверждение переводит турнир в «Завершён» и запускает пересчёт рейтинга
        </span>
        <QuietAction to="Э5.4">Открыть протокол</QuietAction>
      </div>
    </Panel>

    <Panel title="Результаты">
      <Rows>
        <Row nm="Победитель" sub="Смагулов Алан · Алматы, «Алатау»" pill={{ t: '1 МЕСТО', cls: 'live' }} />
        <Row nm="Финалист" sub="Ким Георгий · Астана, СКА" pill={{ t: '2 МЕСТО', cls: 'reg' }} />
        <Row nm="Полуфиналисты" sub="Токаев М. · Жумабеков Р." pill={{ t: '3–4 МЕСТО', cls: 'reg' }} />
      </Rows>
      <div className="mt-3">
        <Bar>Итоговая таблица целиком — в самом протоколе; здесь только верх, чтобы узнать турнир.</Bar>
      </div>
    </Panel>
  </div>
);

export function Tour5_10() {
  return (
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Кубок Республики Казахстан 2026"
      back={{ label: 'Соревнования сезона', to: 'Э5.3' }}
      sub="Главный старт · Караганда · 12–15 сентября · судья назначен"
    >
      {/* Чем турнир меряется — до вкладок ✳ (комментарий федерации, 09.2026):
          председатель приходит в карточку за размером турнира — от него зависит
          и бригада, и расписание, а вкладки отвечают уже на «что с ним делать». */}
      <StatTiles
        items={[
          { v: '128', k: 'Участников' },
          { v: '14', k: 'Регионов' },
          { v: '2', k: 'Разряда · одиночный, парный' },
          { v: '10', k: 'Судей в наряде' },
          { v: '16', k: 'Столов в зале' },
        ]}
      />
      <PageTabs
        items={[
          { t: TOUR_TABS5[0], view: <Rules5_10 /> },
          { t: TOUR_TABS5[1], view: <Crew5_10 /> },
          { t: TOUR_TABS5[2], view: <Players5_10 /> },
          { t: TOUR_TABS5[3], view: <Bracket5_10 /> },
          { t: TOUR_TABS5[4], view: <Schedule5_10 /> },
          { t: TOUR_TABS5[5], view: <Protocol5_10 /> },
        ]}
      />
    </WebApp>
  );
}

const Tour5_10States = () => (
  <States>
    <Shot
      tone="info"
      title="Турнир в черновике"
      text="Ни судей, ни состава ещё нет: вкладки пустые, а из действий — открыть приём заявок судей."
    >
      <Frag>
        <Rows>
          <Row
            nm="Приём заявок судей"
            sub="пока не открыт — судьи турнира не видят"
            pill={{ t: 'ЧЕРНОВИК', cls: 'done' }}
            action="Открыть приём"
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Столы и формат в черновике не заданы — это нормально: их узнают позже.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Турнир идёт"
      text="Смотреть можно всё, решать нечего: ход турнира ведёт главный судья."
    >
      <Frag>
        <Rows>
          <Row nm="Сыграно матчей" sub="Кубок РК · день 2 из 3" val="34 из 175" pill={{ t: 'ИДЁТ', cls: 'live' }} />
        </Rows>
        <div className="mt-3"><DisabledAction>Утвердить протокол</DisabledAction></div>
      </Frag>
    </Shot>

    <Shot
      tone="success"
      title="Протокол утверждён"
      text="Турнир завершён, рейтинг пересчитан — карточка остаётся на чтение."
    >
      <Frag>
        <Rows>
          <Row
            nm="Итоговый протокол"
            sub="утверждён 24.05 · рейтинг пересчитан по 142 матчам"
            pill={{ t: 'ЗАВЕРШЁН', cls: 'done' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.2 · Судьи на турнир: заявки и наряд одним экраном ────────── */

/** Заявки и наряд были двумя экранами, а вопрос у председателя один: **кто
    судит этот турнир**. Наряд считается из решений на этом же экране: второму
    списку, который мог бы разойтись с назначениями, взяться неоткуда. Тем же
    приёмом собран наряд у администратора федерации (Э1.3). */

/** Турниры, где приём заявок судей открыт. `crew` — сколько судей нужно в
    бригаду по числу столов: по нему видно, что заявок не хватает и придётся
    добирать из реестра. */
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
  /** На какие места судья заявился (Э0.10) ✳: заявка не безадресная — судья с
      национальной категорией метит в главные, новичок на стол. Без этой строки
      председатель ставил бы людей вслепую и получал отказы после назначения. */
  want: string;
};

const CANDS: Cand[] = [
  { av: A(76), nm: 'Оспанов Тимур', cat: 'Национальная', reg: 'Астана', r: 27.5, place: 1, season: 6, last: 'Чемпионат РК, гл. судья', want: 'главный · зам' },
  { av: A(51), nm: 'Токаев Марат', cat: 'Национальная', reg: 'Шымкент', r: 22.5, place: 2, season: 5, last: 'Первенство до 19, гл. судья', want: 'главный' },
  { av: A(13), nm: 'Пак Сергей', cat: 'Первая', reg: 'Павлодар', r: 18, place: 3, season: 5, last: '«Алатау Опен», судья', want: 'зам · стол' },
  { av: AW(31), nm: 'Ким Лариса', cat: 'Первая', reg: 'Караганда', r: 14, place: 4, season: 4, last: 'Кубок Караганды, секретарь', want: 'секретарь' },
  { av: AW(65), nm: 'Абдрахманова Сауле', cat: 'Первая', reg: 'Караганда', r: 12.5, place: 5, season: 4, last: 'Первенство до 15, секретарь', want: 'секретарь · стол' },
  { av: A(19), nm: 'Цой Виктор', cat: 'Первая', reg: 'Караганда', r: 9.5, place: 6, season: 3, last: 'Кубок Караганды, судья', want: 'стол' },
  { av: A(22), nm: 'Жумабеков Расул', cat: 'Судья по спорту', reg: 'Караганда', r: 7, place: 19, season: 2, last: 'Кубок Караганды, судья', want: 'стол' },
  { av: AW(32), nm: 'Абдрахманова Айгерим', cat: 'Вторая', reg: 'Астана', r: 4, place: 61, season: 1, last: 'Кубок Алатау, судья', want: 'стол' },
  { av: A(45), nm: 'Досжан Марат', cat: 'Вторая', reg: 'Алматы', r: 3.5, place: 68, season: 1, last: 'Клубная лига, судья', want: 'стол' },
];

/** Реестр судей — второй источник наряда: заявки отвечают «кто сам вызвался»,
    реестр — «кто вообще есть». Предлагаются только с подтверждённой
    категорией; `busy` — судья уже в наряде другого старта на эти даты:
    назначить можно, но председатель должен об этом знать. */
const REGISTRY: (Cand & { busy?: string })[] = [
  { av: A(76), nm: 'Оспанов Тимур', cat: 'Национальная', reg: 'Астана', r: 27.5, place: 1, season: 6, last: 'Чемпионат РК, гл. судья', want: '42 турнира в реестре' },
  { av: A(51), nm: 'Токаев Марат', cat: 'Национальная', reg: 'Шымкент', r: 22.5, place: 2, season: 5, last: 'Первенство до 19, гл. судья', want: '31 турнир в реестре' },
  { av: A(13), nm: 'Пак Сергей', cat: 'Первая', reg: 'Павлодар', r: 18, place: 3, season: 5, last: '«Алатау Опен», судья', want: '28 турниров в реестре', busy: 'занят 12–15.09 на «Кубке Иртыша»' },
  { av: AW(31), nm: 'Ким Лариса', cat: 'Первая', reg: 'Караганда', r: 14, place: 4, season: 4, last: 'Кубок Караганды, секретарь', want: '19 турниров в реестре' },
  { av: AW(65), nm: 'Абдрахманова Сауле', cat: 'Первая', reg: 'Караганда', r: 12.5, place: 5, season: 4, last: 'Первенство до 15, секретарь', want: '17 турниров в реестре' },
  { av: A(19), nm: 'Цой Виктор', cat: 'Первая', reg: 'Караганда', r: 9.5, place: 6, season: 3, last: 'Кубок Караганды, судья', want: '11 турниров в реестре' },
  { av: A(64), nm: 'Сериков Нурлан', cat: 'Вторая', reg: 'Астана', r: 7.5, place: 12, season: 2, last: 'Кубок Алатау, судья', want: '12 турниров в реестре' },
  { av: A(22), nm: 'Жумабеков Расул', cat: 'Судья по спорту', reg: 'Караганда', r: 7, place: 19, season: 2, last: 'Кубок Караганды, судья', want: '8 турниров в реестре' },
];

/** Колонки: по каким сортируют — фамилия, категория, регион, рейтинг. */
const COLS5: { k: 'nm' | 'cat' | 'reg' | 'r'; t: string }[] = [
  { k: 'nm', t: 'Судья' },
  { k: 'cat', t: 'Категория' },
  { k: 'reg', t: 'Регион' },
  { k: 'r', t: 'Рейтинг R' },
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
    `out` — отклонённые заявки: остаются на экране, но в наряд не входят. */
type Crew = { chief: string; sec: string; dep: string; judges: string[]; out: string[] };
const EMPTY: Crew = { chief: '', sec: '', dep: '', judges: [], out: [] };

const num = (n: number) => String(n).replace('.', ',');

/** Наряд полосой над таблицей: итог решений, а не второй список — расходиться
    нечему. Пустое место написано словами «не назначен» и подсвечено. */
const CrewBar = ({ items }: { items: { k: string; v: string; free?: boolean }[] }) => (
  <div className="mb-4 grid grid-cols-4 gap-3">
    {items.map((d) => (
      <div
        key={d.k}
        className={
          'rounded-xl border px-4 py-3 ' +
          (d.free ? 'border-dashed border-amber-300 bg-amber-50/60' : 'border-neutral-200 bg-white shadow-sm')
        }
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{d.k}</div>
        <div className={'mt-0.5 truncate text-[13.5px] font-semibold ' + (d.free ? 'text-amber-700' : '')}>{d.v}</div>
      </div>
    ))}
  </div>
);

/** Что за список сейчас на экране: кто подал заявку или весь реестр. */
type Src = 'apps' | 'reg';

const CREW_GRID = '2.3fr 1fr 0.9fr 0.7fr 238px';

/** Судейская бригада одного турнира: все судьи этого старта и их места.

    Компонент отдельный, потому что мест у него два ✳: вкладка «Судьи» карточки
    турнира (Э5.10) и экран разбора заявок (Э5.2). Содержание одно, и двумя
    реализациями оно бы разъехалось. */
export function JudgeCrew({ cur }: { cur: (typeof OPEN_TOURS)[number] }) {
  const tour = cur.nm;
  /* Два списка вкладками, а не список и диалог поверх него ✳: заявки и реестр
     отвечают на разные вопросы — «кто сам вызвался» и «кто вообще есть», — а
     хватает ли заявок на бригаду, видно по счётчикам вкладок до нажатия. */
  const [src, setSrc] = useState<Src>('apps');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS5)[number]['k']; up: boolean }>({ k: 'r', up: false });
  /* Наряд хранится по турниру: турниров на экране несколько, состав у каждого
     свой, а люди в заявках повторяются — общим состоянием назначение на один
     турнир проступало бы и в остальных. */
  const [crews, setCrews] = useState<Record<string, Crew>>({});
  const crew = crews[tour] ?? EMPTY;
  const put = (c: Crew) => setCrews({ ...crews, [tour]: c });

  /* Место в наряде у человека одно: назначение снимает предыдущее место — и у
     того, кто его занимал, и у самого назначенного. Отклонённая заявка при
     назначении перестаёт быть отклонённой: решение поменяли. */
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

  const pool: (Cand & { busy?: string })[] = src === 'apps' ? CANDS.slice(0, cur.n) : REGISTRY;
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
    <>
      {/* Наряд — итог решений внизу: какие места ещё пустые, читается отсюда,
          не открывая ничего. У судей — сколько набрано из скольких нужно по
          числу столов: «не назначен» о четырёх местах сразу ничего не говорит. */}
      <CrewBar
        items={POSTS.map((p) => {
          const many = p.k === 'judge';
          const who = many ? `${crew.judges.length} из ${cur.crew}` : crew[p.k];
          const free = many ? crew.judges.length === 0 : !who;
          return { k: p.full, v: who || 'не назначен', free };
        })}
      />

      {/* Заявки и реестр — вкладки со счётчиками: хватает ли заявок на бригаду,
          видно до нажатия. */}
      <div className="mb-3">
        <FilterSeg
          items={[`Заявки на судейство · ${cur.n}`, `Реестр судей · ${REGISTRY.length} из 214`]}
          active={src === 'apps' ? `Заявки на судейство · ${cur.n}` : `Реестр судей · ${REGISTRY.length} из 214`}
          onPick={(v) => setSrc(v.startsWith('Заявки') ? 'apps' : 'reg')}
        />
      </div>

      {/* Плиток над таблицей нет ✳: заявок в них было бы столько же, сколько
          строк ниже. Даты и срок приёма — фактами рядом с поиском; срочность
          близкого старта остаётся цветной. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия, регион или категория" className="w-72" />
        {src === 'apps' ? (
          <Facts
            items={[
              { k: 'даты', v: cur.d },
              { k: 'приём до', v: cur.till },
              { k: 'до старта', v: cur.left.replace('до старта ', ''), hot: cur.cls === 'bad' },
            ]}
          />
        ) : (
          <span className="text-[12.5px] text-neutral-500">предлагаются только с подтверждённой категорией</span>
        )}
        {/* Добор из реестра (18.08.2026): судья заводит себя сам (Э0.7), реестр
            живой, и когда заявок меньше, чем мест, есть из кого добрать. */}
        <Button size="sm" variant="outline" data-to="Э5.8">
          <UserPlus size={14} /> Добавить из реестра
        </Button>
      </div>

      <Sheet
        grid={CREW_GRID}
        cols={[
          ...COLS5.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : c.k === 'nm' })}
            />
          )),
          <span key="place" className="text-right">Место в наряде</span>,
        ]}
      >
        {rows.map((c) => {
          const post = postOf(c.nm);
          const out = crew.out.includes(c.nm);
          /* Пока решения нет, под фамилией то, по чему решают: заявленные места
             и последний турнир (в реестре — опыт и занятость). Как только место
             дано, важнее само решение — строка говорит о нём. */
          const sub = post ? (
            <span className="font-medium text-green-700">{POSTS.find((p) => p.k === post)!.full}</span>
          ) : out ? (
            <span className="text-red-600">Заявка отклонена</span>
          ) : src === 'reg' ? (
            <>{c.want} · {c.last}{c.busy ? ` · ${c.busy}` : ''}</>
          ) : (
            <>заявился: {c.want} · {c.last}</>
          );
          return (
            <div
              key={c.nm}
              className={
                'grid items-center gap-3 px-4 py-2.5 text-[13px] ' +
                (post ? 'bg-green-50/60' : out ? 'opacity-55' : 'hover:bg-neutral-50')
              }
              style={{ gridTemplateColumns: CREW_GRID }}
            >
              {/* Имя и фото открывают карточку судьи (Э5.12): решают по
                  человеку, а в строке помещаются три факта из тридцати. */}
              <Who av={c.av} nm={c.nm} sub={sub} to="Э5.12" />
              <span className="text-neutral-600">{c.cat}</span>
              <span className="text-neutral-600">{c.reg}</span>
              <span className="font-semibold tabular-nums">{num(c.r)}</span>
              <span className="flex items-center justify-end gap-1.5">
                {post ? (
                  /* Человек в наряде — место у него одно, и менять его — это
                     выбирать из четырёх, а не добавлять. */
                  <span className="flex overflow-hidden rounded-lg border border-neutral-200">
                    {POSTS.map((p, i) => (
                      <button
                        key={p.k}
                        type="button"
                        onClick={() => pick(c.nm, p.k)}
                        className={
                          'px-2 py-1 text-[11px] font-medium ' +
                          (post === p.k ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-100') +
                          (i > 0 ? ' border-l border-neutral-200' : '')
                        }
                      >
                        {p.t}
                      </button>
                    ))}
                  </span>
                ) : (
                  /* Пока судья не в наряде — одна кнопка «Добавить» ✳, и она
                     ставит его судьёй стола: в девяти строках из девяти нужен
                     именно стол. Четыре кнопки в каждой строке — тридцать шесть
                     кнопок на экране, из которых нажимают четыре. */
                  <Button size="sm" variant="outline" onPress={() => pick(c.nm, 'judge')}>
                    <UserPlus size={14} /> Добавить
                  </Button>
                )}
                {/* Отклоняют заявку, а не человека: в реестре отклонять нечего —
                    там просто не назначают. */}
                {src === 'apps' && (
                  <button
                    type="button"
                    title="Отклонить заявку с причиной"
                    data-to="Э5.9"
                    onClick={() => reject(c.nm)}
                    className={
                      'flex h-7 w-7 items-center justify-center rounded-md ' +
                      (out ? 'bg-red-100 text-red-700' : 'text-neutral-400 hover:bg-red-50 hover:text-red-600')
                    }
                  >
                    <X size={15} />
                  </button>
                )}
              </span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <NoRows>
            {q
              ? `По запросу «${q}» никого нет — проверьте написание фамилии.`
              : 'Заявок на этот старт пока нет — бригаду собирают из реестра, вкладка рядом.'}
          </NoRows>
        )}
      </Sheet>
    </>
  );
}

/** Экран разбора заявок по одному турниру. Турнир задан тем, откуда пришли —
    из очереди на панели (Э5.1) или из карточки турнира (Э5.10); полосы выбора
    турнира сверху нет ✳: вопрос здесь про один старт, а список всех судей
    живёт своим разделом (Э5.5). */
export function Applications5_2() {
  return (
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Судьи на турнир"
      sub={`${OPEN_TOURS[2].nm} · ${OPEN_TOURS[2].d} · приём заявок до ${OPEN_TOURS[2].till}`}
      back={{ label: 'Карточка турнира', to: 'Э5.10' }}
    >
      <JudgeCrew cur={OPEN_TOURS[2]} />
    </WebApp>
  );
}

const Applications5_2States = () => (
  <States>
    <Shot
      tone="warning"
      title="Заявок нет"
      text="⚠ Что делать в этом случае — не определено (QUESTIONS 3). Показываем пустую очередь и срок."
      wide
    >
      <Frag>
        <EmptyBox
          title="Заявок на судейство нет"
          text="Приём открыт до 18.04. Что делать, если заявок не будет вовсе, — вопрос к федерации."
        />
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Заявок меньше, чем мест в бригаде"
      text="Подано трое, нужно четверо: недостающих добирают из реестра судей (Э5.8)."
      wide
    >
      <Frag w={620}>
        <Rows>
          <Row
            nm="Открытый турнир «Тараз Опен»"
            sub="приём открыт до 25.07 · до старта 4 дня"
            val="3 из 4"
            pill={{ t: 'НЕ ХВАТАЕТ 1', cls: 'wait' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Заявками бригада не закрывается: недостающего судью добирают из реестра — вкладка
            «Реестр судей» рядом с заявками.
          </Bar>
        </div>
      </Frag>
    </Shot>

    {/* Резерв ✳ (замечание федерации, 09.2026): переполнение перестало быть
        отказом. Раньше на полный наряд председатель отвечал отказом «мест нет»,
        а судья подавал заявку снова и снова. */}
    <Shot
      tone="info"
      title="Мест не осталось — заявки идут в резерв ✳"
      text="Судья заявляется один раз: переполнение больше не отказ, а очередь (TZ §4.4)."
      wide
    >
      <Frag w={620}>
        <Rows>
          <Row nm="Наряд · 10 мест из 10" sub="принятые заявки закрыли бригаду" pill={{ t: 'СОБРАН', cls: 'live' }} />
          <Row nm="Цой Виктор · 1-й в резерве" sub="подал 04.04 · ждёт, пока освободится место" pill={{ t: 'В РЕЗЕРВЕ', cls: 'reg' }} />
          <Row nm="Досжан Марат · 2-й в резерве" sub="подал 06.04" pill={{ t: 'В РЕЗЕРВЕ', cls: 'reg' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Одобряется первая заявка из резерва автоматически или председатель выбирает из резерва
            сам, по категории и рейтингу, как при первичном отборе, — федерация не сказала (вопрос 3.3).
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Приём закрылся — резерв отклоняется сам ✳"
      text="Разбирать его руками не нужно: иначе эти заявки висели бы в очереди у председателя до конца сезона."
    >
      <Frag w={620}>
        <Rows>
          <Row
            nm="2 заявки в резерве"
            sub="отклонены автоматически 12.05, 18:00 · «приём закрыт, место не освободилось»"
            pill={{ t: 'ОТКЛОНЕНЫ', cls: 'bad' }}
          />
          <Row
            nm="Заявители уведомлены"
            sub="уведомление уходит само, причина видна в заявке (Э0.10)"
            pill={{ t: 'УВЕДОМЛЕНЫ', cls: 'done' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.4 · Протокол на утверждении: документ и зона сверки ──────── */

type Res = { pl: number; av: string; nm: string; club: string; sc: string; pill?: { t: string; cls: Cls } };

const RESULTS: Res[] = [
  { pl: 1, av: A(32), nm: 'Смагулов Алан', club: 'Алатау · Алматы', sc: 'финал 4:2' },
  { pl: 2, av: A(44), nm: 'Ким Георгий', club: 'СКА · Астана', sc: 'финал 2:4' },
  { pl: 3, av: A(13), nm: 'Пак Сергей', club: 'Иртыш · Павлодар', sc: '1/2 · 3:4' },
  { pl: 4, av: A(51), nm: 'Токаев Марат', club: 'Шымкент', sc: '1/2 · 1:4', pill: { t: 'ТЕХПОБЕДА В 1/4', cls: 'wait' } },
  { pl: 5, av: A(56), nm: 'Гладун Игорь', club: 'Тараз', sc: '1/4 · снят', pill: { t: 'НЕЯВКА', cls: 'bad' } },
];

/** Решение по протоколу: `''` — ещё ждёт, `ok` — утверждён, `back` — возвращён
    на исправление. Решение видно в шапке протокола, а не только по кнопке. */
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
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Протокол на утверждении"
      back={{ label: 'Карточка турнира', to: 'Э5.10' }}
    >
      <div className="grid grid-cols-[1.5fr_1fr] items-start gap-4">
        {/* Протокол — документ, а не список «кто с кем сыграл» ✳ (комментарий
            федерации, 09.2026): бумага уходит в архив, и на её основании
            считается рейтинг — на экране всё, что в ней есть: шапка турнира,
            коллегия, места, особые случаи и подписи. */}
        <Panel title="Итоговый протокол" extra={<P t={head[v].t} cls={head[v].cls} />}>
          <Sec>Соревнование</Sec>
          <KV
            items={[
              ['Наименование', '«Алатау Опен» 2026'],
              ['Категория', 'Открытый республиканский турнир'],
              ['Назначен', 'Федерация настольного тенниса РК'],
              ['Место проведения', 'Алматы, ЦСКА'],
              ['Сроки', '07–09.08.2026'],
              ['Разряды', 'Одиночный · парный'],
              ['Участников', '64 из 11 регионов'],
            ]}
          />

          <Sec>Судейская коллегия</Sec>
          <Rows>
            <Row nm="Главный судья" sub="Оспанов Тимур · национальная категория" val="Астана" />
            <Row nm="Главный секретарь" sub="Ким Лариса · первая категория" val="Караганда" />
            <Row nm="Заместитель главного судьи" sub="Жумабеков Расул · судья по спорту" val="Караганда" />
            <Row nm="Судей на столах" sub="по одному на стол, 8 столов" val="8" />
          </Rows>

          <Sec>Итоговые места</Sec>
          {/* Строки волосяной линией, а не каждая в своей рамке: протокол
              читают сверху вниз одним взглядом. */}
          <DataTable
            cols={['Место', 'Спортсмен', 'Результат', '']}
            grid="60px 1.8fr 0.9fr 1.3fr"
            rows={RESULTS.map((r) => ({
              key: String(r.pl),
              cells: [
                <b key="p" className="text-[14px] tabular-nums">{r.pl}</b>,
                <Who key="w" av={r.av} nm={r.nm} sub={r.club} />,
                <span key="s" className="tabular-nums text-neutral-600">{r.sc}</span>,
                r.pill ? <span key="m" className="flex justify-end"><P t={r.pill.t} cls={r.pill.cls} /></span> : <span key="m" />,
              ],
            }))}
          />

          <Sec>Особые случаи</Sec>
          <Rows>
            <Row nm="Техническая победа · 1/4" sub="Токаев М. — Гладун И. · неявка соперника" pill={{ t: 'ТЕХПОБЕДА', cls: 'wait' }} />
            <Row nm="Неявка · 1/4" sub="Гладун Игорь · снят с турнира" pill={{ t: 'НЕЯВКА', cls: 'bad' }} />
          </Rows>

          <Sec>Подписи</Sec>
          <Rows>
            <Row nm="Главный судья" sub="Оспанов Т. · сформировал протокол 10.08 в 19:40" pill={{ t: 'ПОДПИСАН', cls: 'live' }} />
            <Row nm="Главный секретарь" sub="Ким Л. · оформила 10.08 в 19:10" pill={{ t: 'ПОДПИСАН', cls: 'live' }} />
            <Row
              nm="Председатель ГСК"
              sub="Мукашев Б. · подпись ставится утверждением"
              pill={v === 'ok' ? { t: 'ПОДПИСАН', cls: 'live' } : { t: 'ЖДЁТ', cls: 'wait' }}
            />
          </Rows>
          <div className="mt-4">
            <Bar>
              Утверждение председателя и есть его подпись под документом: отдельной кнопки
              «подписать» нет ✳ — иначе одно и то же действие пришлось бы делать дважды.
            </Bar>
          </div>
        </Panel>

        <Panel title="Зона сверки" extra={<P t="3 ПРАВКИ СЧЁТА" cls="bad" />}>
          <Cells
            items={[
              { v: '63 / 64', k: 'Матчей сыграно', tone: 'b' },
              { v: '2', k: 'Технические победы' },
              { v: '3', k: 'Правки счёта', tone: 'r' },
              { v: '1', k: 'Неявки' },
            ]}
          />

          <Sec>Правки счёта — из журнала</Sec>
          <Rows>
            <Row nm="1/8 · Ким Г. — Пак С. · 3:1 → 3:2" sub="внёс Оспанов Т. · 09.08, 16:12" />
            <Row nm="1/4 · Токаев М. — Гладун И. · 4:0 → техпобеда" sub="внёс Оспанов Т. · 09.08, 17:40" />
            <Row nm="1/16 · Цой В. — Сериков Н. · 3:0 → 3:1" sub="внесла Ким Л. · 09.08, 11:05" />
          </Rows>

          {/* Решение принято — кнопок больше нет, а не «серые»: утверждённый
              протокол завершает турнир и запускает пересчёт рейтинга. Вместо
              кнопок — что именно произошло. */}
          <div className="mt-4 flex flex-col gap-2">
            {v === '' && (
              <>
                <Button variant="primary" onPress={() => setV('ok')}>
                  <Check size={15} /> Утвердить протокол
                </Button>
                <Button variant="outline" onPress={() => setAsk(true)}>
                  <Undo2 size={15} /> Вернуть с причиной
                </Button>
              </>
            )}
            {v === 'ok' && (
              <Bar tone="success">
                Протокол утверждён: турнир → «Завершён», запущен пересчёт рейтинга, главному судье
                ушло уведомление. Отменить можно, пока пересчитанный рейтинг не опубликован
                (Э5.7): после публикации счёт правят апелляцией, а не отменой утверждения.
              </Bar>
            )}
            {v === 'back' && (
              <Bar tone="warning">
                Протокол возвращён: ввод результатов открыт снова, главный судья исправляет и
                отправляет повторно. В «Моих соревнованиях» строка помечена «на исправлении».
                Отменить возврат можно, пока судья не отправил протокол заново.
              </Bar>
            )}
            {/* Возврат решения ✳: председатель ошибается тем же способом, что и
                все, а до публикации рейтинга откатить ещё можно. Кнопка тихая,
                не вровень с «Утвердить»; каждая отмена идёт в журнал (§12). */}
            {v !== '' && (
              <QuietAction onPress={() => setV('')}>
                <Undo2 size={15} /> {v === 'ok' ? 'Отменить утверждение' : 'Отменить возврат'}
              </QuietAction>
            )}
          </div>
        </Panel>
      </div>

      {ask && (
        <InlineDialog
          title="Вернуть протокол с причиной"
          sub="«Алатау Опен» 2026 · главному судье Оспанову Т."
          to="Э5.4"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">
                Причина уйдёт главному судье и останется в журнале
              </span>
              <QuietAction onPress={() => setAsk(false)}>Закрыть</QuietAction>
              <Button variant="primary" onPress={() => { setV('back'); setAsk(false); }}>
                Вернуть
              </Button>
            </>
          }
        >
          <FormGrid>
            <FieldView label="Что возвращается" value="Итоговый протокол · «Алатау Опен» 2026" wide />
            <TextInput label="Причина" value="в 1/4 техпобеда без основания в журнале матча" wide />
          </FormGrid>
          <div className="mt-3">
            <Bar>Ввод результатов откроется снова — это сказано в уведомлении главному судье.</Bar>
          </div>
        </InlineDialog>
      )}
    </WebApp>
  );
}

const Protocol5_4States = () => (
  <States>
    <Shot
      tone="success"
      title="Решение принято — кнопок нет вовсе"
      text="Утверждённый протокол завершает турнир и запускает пересчёт: в шапке «утверждён», вместо кнопок — что произошло."
      wide
    >
      <Frag w={620}>
        <Panel title="Итоговый протокол" extra={<P t="УТВЕРЖДЁН" cls="live" />}>
          <Bar tone="success">
            Протокол утверждён: турнир → «Завершён», запущен пересчёт рейтинга, главному судье
            ушло уведомление.
          </Bar>
          <div className="mt-2">
            <QuietAction><Undo2 size={15} /> Отменить утверждение</QuietAction>
          </div>
        </Panel>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Протокол возвращён и ещё не переотправлен"
      text="Строка в Э5.1 с пометкой «на исправлении»."
      wide
    >
      <Frag>
        <Rows>
          <Row
            nm="«Алатау Опен» 2026"
            sub="возвращён 12.08 · «нет второго номера пары»"
            pill={{ t: 'НА ИСПРАВЛЕНИИ', cls: 'wait' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.8 · Выбор судьи в наряд ────────────────────────────────── */

/** Судья в списке выбора: по чему председатель решает — категория, рейтинг,
    занятость на эти же даты. В список попадают только с подтверждённой
    категорией: заведший себя сам (Э0.7) виден в реестре (Э5.5), но в наряд не
    предлагается, пока коллегия не проставила категорию по документу. */
const PICK = [
  { av: A(76), nm: 'Оспанов Тимур', reg: 'Астана', sub: 'национальная категория · 42 турнира', r: 'R 27,5 · №1', busy: false },
  { av: A(51), nm: 'Токаев Марат', reg: 'Шымкент', sub: 'национальная категория · 31 турнир', r: 'R 24,1 · №2', busy: false },
  { av: A(13), nm: 'Пак Сергей', reg: 'Павлодар', sub: 'первая категория · 28 турниров', r: 'R 21,8 · №4', busy: true },
  { av: A(64), nm: 'Сериков Нурлан', reg: 'Астана', sub: 'вторая категория · 12 турниров', r: 'R 14,2 · №9', busy: false },
];

export function PickJudge5_8() {
  /* Выбор и добавление — два шага, а не один: судью сверяют по категории,
     рейтингу и занятости, а нажатие «Выбрать» рядом с фамилией слишком дёшево,
     чтобы сразу ставить человека в наряд. */
  const [pick, setPick] = useState<string | null>(null);
  const [dep, setDep] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  /* Поиск по реестру: реестр на 214 человек, глазами в нём не ищут. */
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const list = PICK.filter(
    (j) => !t || j.nm.toLowerCase().includes(t) || j.reg.toLowerCase().includes(t) || j.sub.toLowerCase().includes(t),
  );
  const cur = PICK.find((j) => j.nm === pick);

  return (
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Кубок Республики Казахстан 2026"
      sub="Судьи · добор из реестра в наряд этого турнира"
      back={{ label: 'Карточка турнира', to: 'Э5.10' }}
    >
      {/* Позади диалога — наряд этого турнира: добор нужен ровно там, где
          видно, что место в бригаде пустое. Экран живёт в «Соревнованиях» ✳:
          добор относится к одному старту. */}
      <CrewBar
        items={[
          { k: 'Главный судья', v: 'Оспанов Тимур' },
          { k: 'Главный секретарь', v: 'Ким Лариса' },
          { k: 'Заместитель', v: dep ?? 'не назначен', free: !dep },
          { k: 'Судья', v: '7 из 10' },
        ]}
      />

      {!open && (
        <div className="flex items-center justify-between gap-3">
          {dep ? (
            <P t={`${dep} — добавлен в наряд`} cls="live" />
          ) : (
            <span className="text-[12.5px] text-neutral-500">Реестр закрыт — наряд остался прежним</span>
          )}
          <Button size="sm" variant="outline" onPress={() => { setOpen(true); setPick(null); }}>
            <UserPlus size={14} /> Добавить из реестра
          </Button>
        </div>
      )}

      {open && (
        <InlineDialog
          wide
          title="Добавить судью в наряд"
          sub="Кубок Республики Казахстан 2026 · 18–20 мая · Астана"
          to="Э5.10"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">
                {cur
                  ? `Выбран ${cur.nm} · вместе с добавлением выдаётся роль «судья» на этот турнир`
                  : 'Вместе с добавлением выдаётся роль «судья» на этот турнир'}
              </span>
              <QuietAction onPress={() => { setOpen(false); setPick(null); }}>Закрыть</QuietAction>
              {/* Пока никто не выбран, добавлять нечего — кнопки нет, а не
                  серая: недоступное действие мы не показываем. */}
              {cur && (
                <Button variant="primary" onPress={() => { setDep(cur.nm); setOpen(false); setPick(null); }}>
                  Добавить
                </Button>
              )}
            </>
          }
        >
          <Bar>
            214 судей в реестре с подтверждённой категорией · 2 новых записи ждут подтверждения и
            здесь не предлагаются
          </Bar>
          {/* Поиск и фильтры — зона «Поиск по реестру судей» ✳: в реестре 214
              человек, и без них диалог отвечал бы только на «кто первый в
              списке». Поиск живой; категория и регион — статичный выбор
              (PickField, без портала: порталы на борде накрывают чужие
              колонки). */}
          <div className="mb-3 grid grid-cols-[1.3fr_1fr_1fr] items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Поиск по ФИО</span>
              <SearchInput value={q} onChange={setQ} placeholder="Фамилия судьи" className="w-full" />
            </label>
            <PickField label="Категория" value="Все категории" />
            <PickField label="Регион" value="Все регионы" />
          </div>
          {list.length ? (
            <Rows>
              {list.map((j) => (
                <Row
                  key={j.nm}
                  av={j.av}
                  nm={j.nm}
                  sub={`${j.sub} · ${j.reg}${j.busy ? ' · занят 18–20 мая на «Кубке Иртыша»' : ''}`}
                  val={j.r}
                  pill={
                    pick === j.nm
                      ? { t: 'ВЫБРАН', cls: 'live' }
                      : j.busy
                        ? { t: 'ЗАНЯТ', cls: 'wait' }
                        : undefined
                  }
                  /* Занятого выбрать можно: два наряда на одни даты — решение
                     председателя, система только показывает пересечение. */
                  action={pick === j.nm ? 'Снять выбор' : 'Выбрать'}
                  onAction={() => setPick(pick === j.nm ? null : j.nm)}
                />
              ))}
            </Rows>
          ) : (
            <EmptyBox
              title="Судей не нашлось"
              text={`По запросу «${q}» никого нет — проверьте написание фамилии или снимите фильтр.`}
            />
          )}
        </InlineDialog>
      )}
    </WebApp>
  );
}

const PickJudge5_8States = () => (
  <States>
    <Shot
      tone="warning"
      title="Новая запись в наряд не предлагается ✳"
      text="Судья завёл себя сам (Э0.7), но категорию коллегия ещё не проставила: в реестре он виден, в списке выбора его нет."
      wide
    >
      <Frag w={620}>
        <Rows>
          <Row
            av={A(39)}
            nm="Оралбай Ержан"
            sub="зарегистрировался 18.08 · удостоверение на проверке (Э5.6)"
            pill={{ t: 'ЖДЁТ ПОДТВЕРЖДЕНИЯ', cls: 'wait' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Поставить на турнир человека, чью квалификацию никто не видел, нельзя: от категории
            зависит и допуск к роли, и балл S2. Проверьте документ — после подтверждения он появится здесь.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Судья занят на эти даты ✳"
      text="Строка помечена; добавить можно, но с предупреждением."
    >
      <Frag>
        <Rows>
          <Row
            av={A(13)}
            nm="Пак Сергей"
            sub="в наряде «Кубка Иртыша», 18–20 мая"
            pill={{ t: 'ЗАНЯТ', cls: 'wait' }}
            action="Выбрать"
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Два наряда на одни даты — решение председателя, система только показывает пересечение.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="info" title="По фильтру никого нет" text="Пустой список с подсказкой снять фильтр.">
      <Frag w={480}>
        <EmptyBox
          title="Судей не нашлось"
          text="Фильтр: национальная категория · регион Актобе. Снимите один из фильтров."
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.9 · Отказ с причиной ───────────────────────────────────── */

/** Позади диалога — очередь заявок **без решения**. Разобранная заявка из неё
    уходит: очередь отвечает на вопрос «что ещё не решено». На экране судей
    (Э5.2) отклонённый, наоборот, остаётся со своей пометкой — там список
    другой, полный состав заявившихся. */
const WAITING = [
  { av: A(76), nm: 'Оспанов Тимур', sub: 'национальная категория · R 27,5' },
  { av: A(64), nm: 'Сериков Нурлан', sub: 'вторая категория · R 14,2' },
];

export function Reject5_9() {
  const [left, setLeft] = useState(WAITING);
  /* Кого отклоняем. `null` — диалог закрыт: тем же состоянием работает и
     «Закрыть» внизу диалога. */
  const [who, setWho] = useState<string | null>('Сериков Нурлан');
  const cur = left.find((j) => j.nm === who);
  return (
    <WebApp
      role={R05}
      nav="Соревнования"
      title="Кубок Республики Казахстан 2026"
      sub="Судьи · заявки без решения"
      back={{ label: 'Карточка турнира', to: 'Э5.10' }}
    >
      {left.length ? (
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
      ) : (
        <EmptyBox title="Решений не ждёт ничего" text="Все заявки на судейство этого турнира разобраны." />
      )}

      {cur && (
        <InlineDialog
          title="Отклонить заявку с причиной"
          sub={`${cur.nm} · заявка на судейство Кубка РК`}
          to="Э5.10"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">
                Причина уйдёт судье в уведомление и останется в журнале
              </span>
              <QuietAction onPress={() => setWho(null)}>Закрыть</QuietAction>
              <Button
                variant="danger"
                onPress={() => { setLeft(left.filter((j) => j.nm !== cur.nm)); setWho(null); }}
              >
                Отклонить
              </Button>
            </>
          }
        >
          <FormGrid>
            <FieldView label="Что отклоняется" value={`Заявка на судейство · ${cur.nm}`} wide />
            <TextInput label="Причина" value="на главный старт нужна первая или национальная категория" wide />
          </FormGrid>
          <div className="mt-3">
            <Bar>Приём заявок открыт до 18.04 — судья может подать снова, и это сказано в уведомлении.</Bar>
          </div>
        </InlineDialog>
      )}
    </WebApp>
  );
}

const Reject5_9States = () => (
  <States>
    <Shot tone="danger" title="Причина не заполнена" text="Кнопка неактивна, с пояснением.">
      <Frag w={480}>
        <FormGrid>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Причина</span>
            <span className="w-full rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              — не заполнена
            </span>
          </div>
        </FormGrid>
        <div className="mt-3"><DisabledAction>Отклонить</DisabledAction></div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Приём заявок уже закрыт ✳"
      text="В тексте уведомления не обещаем «подайте снова»."
    >
      <Frag>
        <Rows>
          <Row nm="Приём заявок судей" sub="закрыт 18.04.2026" pill={{ t: 'ЗАКРЫТ', cls: 'done' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Уведомление уходит без строки «можно подать снова»: приём уже не открыт.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.5 · Реестр судей: S1–S4, итог R и признак зачёта ────────── */

/** Судья в рейтинге. S1–S4 — слагаемые по Положению (§7.2), R — их сумма;
    `ok` — признак зачёта: баллы не меньше чем в трёх категориях из четырёх и
    обязательно S1 и S2. `fresh` — судья завёл себя сам (Э0.7) и ждёт, пока
    коллегия проставит категорию по документу: в реестре виден, но в наряд не
    назначается — без S2 нет и зачёта. */
type JR = {
  pl: number;
  av: string;
  nm: string;
  cat: string;
  s1: number; s2: number; s3: number; s4: number; r: number;
  ok: boolean;
  fresh?: { when: string; doc: string };
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

  /* Пришли сами (Э0.7): категории ещё нет — её проставляет коллегия по
     приложенному документу, и до этого места в рейтинге у них тоже нет. */
  { pl: 0, av: A(39), nm: 'Оралбай Ержан', cat: 'категория не подтверждена', s1: 0, s2: 0, s3: 0, s4: 0, r: 0, ok: false, fresh: { when: '18.08', doc: 'удостоверение первой категории' } },
  { pl: 0, av: AW(26), nm: 'Сейтжан Аяулым', cat: 'категория не подтверждена', s1: 0, s2: 0, s3: 0, s4: 0, r: 0, ok: false, fresh: { when: '17.08', doc: 'документ не приложен' } },
];

/** Колонки рейтинга: фамилия и итог R. Слагаемых S1–S4 в таблице нет — сюда
    приходят за местом в рейтинге, а «почему» разбирают в журнале по судье. */
const COLS55: { k: 'nm' | 'r'; t: string }[] = [
  { k: 'nm', t: 'Судья' },
  { k: 'r', t: 'Итог R' },
];

/** Срезы реестра — по двум рабочим вопросам председателя: кого допустить
    (новые регистрации ждут категории) и кому рейтинг зачтётся. Срез «Ждут
    подтверждения» появился вместе с самостоятельной регистрацией судей (Э0.7). */
const F55 = ['Все судьи', 'Ждут подтверждения', 'В зачёте', 'Без зачёта'];

/** Журнал начислений одного судьи: в первой строке — сам турнир или документ
    («за что»), во второй — слагаемое S1…S4, дата, коэффициент, кто внёс. */
const JOURNAL = [
  { what: 'Чемпионат РК, главный судья', when: 'S1 · 18.05.2026 · 3 × 1,5 · автоначисление', pts: '+4,5' },
  { what: 'Кубок Караганды, выезд', when: 'S1 · 12.04.2026 · 3 × 1,5 · автоначисление', pts: '+4,5' },
  { what: 'Национальная категория', when: 'S2 · 01.01.2026 · опорный балл · автоначисление', pts: '+4' },
  { what: 'Офлайн-семинар Федерации', when: 'S3 · 22.03.2026 · Алматы · принял Мукашев Б.', pts: '+3' },
  { what: 'Работа в ГСК РК, 6 месяцев', when: 'S4 · 01.07.2026 · принял Мукашев Б.', pts: '+2' },
];

const RANK_GRID = '2.4fr 0.8fr 1.6fr';

export function Rating5_5() {
  const [f, setF] = useState(F55[0]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS55)[number]['k']; up: boolean }>({ k: 'r', up: false });
  /* Чей журнал открыт. `null` — диалога нет. Журнал открывается по строке, а
     не стоит второй колонкой: чей он, видно из того, на кого нажали. */
  const [open, setOpen] = useState<string | null>(null);
  const cur = RANK.find((j) => j.nm === open);

  const found = RANK.filter((j) => {
    const t = q.trim().toLowerCase();
    const byF =
      f === F55[0]
        ? true
        : f === F55[1]
          ? Boolean(j.fresh)
          : !j.fresh && (f === F55[2]) === j.ok;
    return byF && (!t || j.nm.toLowerCase().includes(t) || j.cat.toLowerCase().includes(t));
  });
  const rows = [...found].sort((a, b) => {
    const x = sort.k === 'nm' ? a.nm.localeCompare(b.nm, 'ru') : a.r - b.r;
    return sort.up ? x : -x;
  });

  return (
    <WebApp
      role={R05}
      nav="Судьи"
      title="Реестр судей · сезон 2026"
      sub="Кто есть в реестре, кого ещё не допустили и какой у каждого рейтинг"
    >
      {/* Фильтр сверху, поиск под ним ✳: сначала сужают круг, потом ищут
          внутри — в одной строке два приёма мешали друг другу. Счётчиков рядом
          нет: они пересчитываются по той же таблице, что стоит ниже. */}
      <div className="mb-3"><FilterSeg items={F55} active={f} onPick={setF} /></div>
      <div className="mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия или категория" className="w-80" />
      </div>

      <Sheet
        grid={RANK_GRID}
        cols={[
          ...COLS55.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : c.k === 'nm' })}
            />
          )),
          <span key="ok">Зачёт</span>,
        ]}
      >
        {rows.map((j) => (
          /* Строка открывает журнал начислений этого судьи. Новая запись ведёт
             не в журнал — его ещё нет, — а в проверку документа (Э5.6): там
             решается, пускать ли судью в реестр и с какой категорией. */
          <div
            key={j.nm}
            role="button"
            tabIndex={0}
            data-row
            data-to={j.fresh ? 'Э5.6' : undefined}
            onClick={j.fresh ? undefined : () => setOpen(j.nm)}
            className={
              'grid cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] ' +
              (open === j.nm ? 'bg-blue-50/60' : 'hover:bg-neutral-50')
            }
            style={{ gridTemplateColumns: RANK_GRID }}
          >
            <Who
              av={j.av}
              nm={j.nm}
              sub={
                j.fresh
                  ? /* Без рода в подписи: в реестре и судьи, и судьи-женщины. */
                    `сам, регистрация ${j.fresh.when} · ${j.fresh.doc}`
                  : `${j.cat} · №${j.pl}`
              }
            />
            <span className="text-[14px] font-semibold tabular-nums">{j.fresh ? '—' : num(j.r)}</span>
            <span className="flex justify-end">
              {j.fresh ? (
                <P t="ЖДЁТ ПОДТВЕРЖДЕНИЯ" cls="wait" />
              ) : (
                <P t={j.ok ? 'В ЗАЧЁТЕ' : 'БЕЗ ЗАЧЁТА'} cls={j.ok ? 'live' : 'bad'} />
              )}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <NoRows>
            {q ? `По запросу «${q}» никого нет — проверьте написание фамилии.` : 'По этому срезу никого нет.'}
          </NoRows>
        )}
      </Sheet>

      {/* Что дальше с записями обоих видов — одной строкой под таблицей.
          Реестр стал входом в наряд: раньше добор судьи (Э5.8) висел без входа. */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-neutral-500">
          {RANK.length} судей в реестре · {RANK.filter((j) => j.fresh).length} ждут подтверждения категории
        </span>
        <span className="flex gap-2">
          <Button size="sm" variant="outline" data-to="Э5.6">
            <FileCheck size={14} /> Документы на проверке
          </Button>
          <Button size="sm" variant="outline" data-to="Э5.8">
            <UserPlus size={14} /> Назначить в наряд
          </Button>
        </span>
      </div>

      <div className="mt-3">
        <Bar>
          Судья заводит аккаунт сам (Э0.7), а категорию по удостоверению проставляет коллегия — до
          этого он в реестре виден, но в наряд не назначается и балла за категорию (S2) не получает.
          ⚠ 9.2 — сам ли регистрируется судья, федерация не ответила.
        </Bar>
      </div>

      {cur && (
        <InlineDialog
          title={`Журнал начислений · ${cur.nm}`}
          sub={`${cur.cat} · R ${num(cur.r)} · №${cur.pl} · сезон 2026`}
          to="Э5.5"
          foot={<QuietAction onPress={() => setOpen(null)}>Закрыть</QuietAction>}
        >
          {/* Пояснения про зачёт здесь нет: сам журнал и есть ответ — строк за
              семинары и коллегию в нём просто не будет. */}
          <Rows>
            {JOURNAL.map((l) => (
              <Row key={l.what} nm={l.what} sub={l.when} val={l.pts} />
            ))}
          </Rows>
        </InlineDialog>
      )}
    </WebApp>
  );
}

/** Журнал начислений — как он открывается по строке реестра ✳ (зона данных
    «Журнал начислений — отдельным окном по судье»). На самом экране окно по
    умолчанию закрыто, и решение «турнир первой строкой, слагаемое и
    коэффициент второй» нигде не было видно. */
const Journal5_5Also = () => (
  <Also cap="Журнал начислений — окном по судье ✳">
    <Frag w={620}>
      <DialogFrag h={480}>
        <InlineDialog
          title="Журнал начислений · Оспанов Тимур"
          sub="Национальная категория · R 27,5 · №1 · сезон 2026"
          to="Э5.5"
          foot={<QuietAction>Закрыть</QuietAction>}
        >
          {/* Пояснения про зачёт здесь нет: сам журнал и есть ответ. */}
          <Rows>
            {JOURNAL.map((l) => (
              <Row key={l.what} nm={l.what} sub={l.when} val={l.pts} />
            ))}
          </Rows>
        </InlineDialog>
      </DialogFrag>
    </Frag>
  </Also>
);

const Rating5_5States = () => (
  <States>
    <Shot tone="info" title="По поиску никого нет" text="Сказано, что проверить написание фамилии ✳.">
      <Frag w={520}>
        <Sheet
          grid={RANK_GRID}
          cols={[
            <span key="nm">Судья</span>,
            <span key="r">Итог R</span>,
            <span key="ok">Зачёт</span>,
          ]}
        >
          <NoRows>По запросу «Оралбаев» никого нет — проверьте написание фамилии.</NoRows>
        </Sheet>
      </Frag>
    </Shot>

    <Shot
      tone="success"
      title="Документы и публикация — свои пункты меню ✳"
      text="Счётчик документов и «последняя публикация» из реестра убраны: обе обязанности из Положения (§7.2) живут своим ритмом."
      wide
    >
      <Frag w={620}>
        <Rows>
          <Row
            nm="Документы на проверке"
            sub="приходят весь сезон · пункт меню «Документы»"
            pill={{ t: 'СВОЙ РАЗДЕЛ', cls: 'reg' }}
            action="Открыть"
            actionTo="Э5.6"
          />
          <Row
            nm="Публикация рейтинга"
            sub="бывает раз в период · пункт меню «Публикация»"
            pill={{ t: 'СВОЙ РАЗДЕЛ', cls: 'reg' }}
            action="Открыть"
            actionTo="Э5.7"
          />
        </Rows>
        <div className="mt-3">
          <Bar>Внутри рейтинга обе обязанности прятались за числом в плитке — и не было видно, что с ними делать.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.12 · Карточка судьи ─────────────────────────────────────── */

/** Всё про одного судью в одном месте ✳: кто он, чем подтверждена категория,
    из чего сложился рейтинг, где судил и что с документами. Экран **на чтение
    и на два решения**: допустить категорию по документу (Э5.6) и поставить в
    наряд (Э5.8) — ни рейтинг, ни история здесь не правятся (§7.2). */

/** Где судил: наряд по сезонам — ответ на «потянет ли он главного», по одной
    строке рейтинга этого не видно. */
const JUDGE_TOURS = [
  { nm: 'Чемпионат Казахстана 2026', sub: 'Астана · 18–20.05', role: 'Главный судья', cls: 'live' as Cls },
  { nm: 'Кубок Караганды 2026', sub: 'Караганда · 12–14.04 · выезд', role: 'Главный судья', cls: 'live' as Cls },
  { nm: 'Первенство РК до 19 лет', sub: 'Шымкент · 02–05.03', role: 'Заместитель', cls: 'reg' as Cls },
  { nm: '«Алатау Опен» 2026', sub: 'Алматы · 21–22.02', role: 'Судья стола', cls: 'reg' as Cls },
  { nm: 'Открытие сезона 2026', sub: 'Астана · 17–19.01', role: 'Главный секретарь', cls: 'reg' as Cls },
];

export function Judge5_12() {
  return (
    <WebApp
      role={R05}
      nav="Судьи"
      title="Оспанов Тимур"
      sub="Национальная категория · Астана · рейтинг R 27,5 · 1-е место в сезоне"
      back={{ label: 'Реестр судей', to: 'Э5.5' }}
    >
      <div className="grid grid-cols-2 items-start gap-4">
        <div>
          <Panel title="Судья" extra={<P t="ДОПУЩЕН" cls="live" />}>
            <div className="mb-4 flex items-center gap-3.5">
              <Avatar size="lg">
                <Avatar.Image alt="Оспанов Тимур" src={A(76)} />
                <Avatar.Fallback>О</Avatar.Fallback>
              </Avatar>
              <div className="leading-tight">
                <div className="text-[15px] font-semibold">Оспанов Тимур</div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  Национальная категория · Астана · в реестре с 2019 года
                </div>
              </div>
            </div>
            <KV
              items={[
                ['Категория', 'национальная'],
                ['Чем подтверждена', 'удостоверение №41-Н, принято 12.01.2026'],
                ['Регион', 'Астана'],
                ['Турниров за сезон', '6 · из них 2 выездных'],
              ]}
            />
          </Panel>

          <Panel title="Где судил" extra={<span className="text-xs text-neutral-500">сезон 2026</span>}>
            <Rows>
              {JUDGE_TOURS.map((t) => (
                <Row key={t.nm} nm={t.nm} sub={t.sub} pill={{ t: t.role.toUpperCase(), cls: t.cls }} />
              ))}
            </Rows>
            <div className="mt-3">
              <Bar>
                Наряд по прошлым стартам — то, по чему и решают, потянет ли судья главного на
                главном старте: по одной строке рейтинга этого не видно.
              </Bar>
            </div>
          </Panel>
        </div>

        <div>
          {/* Рейтинг по Положению (§7.2): R = S1 + S2 + S3 + S4. Слагаемые
              здесь на месте — в реестре их намеренно нет: там отвечают
              «сколько», а «почему» разбирают у человека. */}
          <Panel title="Рейтинг судьи" extra={<P t="R 27,5 · №1" cls="reg" />}>
            <Cells
              cols={4}
              items={[
                { v: '16,5', k: 'S1 · турниры', tone: 'b' },
                { v: '4', k: 'S2 · категория' },
                { v: '5', k: 'S3 · семинары' },
                { v: '2', k: 'S4 · коллегия' },
              ]}
            />
            <div className="mt-3">
              <Rows>
                {JOURNAL.slice(0, 3).map((j) => (
                  <Row key={j.what} nm={j.what} sub={j.when} val={j.pts} />
                ))}
              </Rows>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500">Журнал начислений целиком — в реестре судей</span>
              <QuietAction to="Э5.5">Открыть журнал</QuietAction>
            </div>
          </Panel>

          <Panel title="Что можно сделать">
            <Rows>
              {/* Даты свободного окна — в подписи, а не в значке ✳: значок
                  «СВОБОДЕН 12–15.09» вместе с кнопкой съедал колонку, и
                  заголовок действия резался до «Поставить в…». */}
              <Row
                nm="Поставить в наряд"
                sub="на турнир с открытым приёмом заявок · свободен 12–15.09"
                pill={{ t: 'СВОБОДЕН', cls: 'live' }}
                action="Выбрать турнир"
                to="Э5.8"
              />
              <Row
                nm="Документы"
                sub="удостоверение принято 12.01.2026 · новых нет"
                pill={{ t: 'В ПОРЯДКЕ', cls: 'done' }}
                action="Проверка"
                to="Э5.6"
              />
            </Rows>
            <div className="mt-3">
              <Bar>
                Рейтинг и история здесь не правятся: R считается по Положению (§7.2), а наряд —
                решение по конкретному турниру, и принимают его в самом турнире.
              </Bar>
            </div>
          </Panel>
        </div>
      </div>
    </WebApp>
  );
}

const Judge5_12States = () => (
  <States>
    <Shot
      tone="warning"
      title="Категория не подтверждена"
      text="Судья завёл себя сам (Э0.7): рейтинга и места у него нет, в наряд не предлагается."
      wide
    >
      <Frag w={640}>
        <Rows>
          <Row
            av={A(39)}
            nm="Оралбай Ержан"
            sub="категория не подтверждена · подал 18.08 · удостоверение первой категории"
            pill={{ t: 'ЖДЁТ ДОПУСКА', cls: 'wait' }}
            action="Проверить документ"
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Пока коллегия не проставила категорию, S2 не начислен — а без S2 нет и зачёта (§7.2).
            В наряд такой судья не предлагается: ставить человека, чью квалификацию никто не видел,
            нельзя.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Занят на эти даты"
      text="Судья уже в наряде другого старта: назначить можно, но председатель должен это знать."
    >
      <Frag>
        <Rows>
          <Row av={A(13)} nm="Пак Сергей" sub="Первая категория · Павлодар · R 18" pill={{ t: 'ЗАНЯТ 12–15.09', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.13 · Аттестация судей: онлайн-тест, комиссия, база вопросов ─ */

/** Аттестация — то, чем судья подтверждает право работать: прошёл — допуск
    проставляется сам, просрочил — работать нельзя. Порядок пришёл комментарием
    федерации (09.2026): онлайн-тест, комиссия, уведомления по срокам,
    автоматический допуск и пополняемая база вопросов. ⚠ Периодичность,
    проходной балл и число попыток не названы — уточнить. */
type Att = {
  av: string;
  nm: string;
  cat: string;
  /** До какого числа действует аттестация. */
  till: string;
  /** Сколько дней осталось; отрицательное — просрочена. */
  left: number;
  score?: string;
};

const ATTEST: Att[] = [
  { av: A(76), nm: 'Оспанов Тимур', cat: 'Национальная', till: '14.03.2027', left: 200, score: '92 из 100' },
  { av: A(51), nm: 'Токаев Марат', cat: 'Национальная', till: '02.11.2026', left: 68, score: '88 из 100' },
  { av: A(13), nm: 'Пак Сергей', cat: 'Первая', till: '30.09.2026', left: 35, score: '81 из 100' },
  { av: AW(31), nm: 'Ким Лариса', cat: 'Первая', till: '20.09.2026', left: 25, score: '79 из 100' },
  { av: A(19), nm: 'Цой Виктор', cat: 'Первая', till: '05.09.2026', left: 10 },
  { av: A(22), nm: 'Жумабеков Расул', cat: 'Судья по спорту', till: '18.08.2026', left: -8 },
  { av: AW(32), nm: 'Абдрахманова Айгерим', cat: 'Вторая', till: '01.08.2026', left: -25 },
];

/** Состояние аттестации считается из срока, а не хранится отдельно: иначе
    «действует» и «до какого числа» разъедутся, и допуск повиснет на судье,
    у которого срок вышел месяц назад. */
const attState = (a: Att): { t: string; cls: Cls } => {
  if (a.left < 0) return { t: 'ПРОСРОЧЕНА', cls: 'bad' };
  if (a.left <= 30) return { t: `ИСТЕКАЕТ ЧЕРЕЗ ${a.left} ДН.`, cls: 'wait' };
  return { t: 'ДЕЙСТВУЕТ', cls: 'live' };
};

const ATT_TABS = ['Сроки и допуск', 'Комиссия', 'База вопросов'];

const COLS513: { k: 'nm' | 'cat' | 'till'; t: string }[] = [
  { k: 'nm', t: 'Судья' },
  { k: 'cat', t: 'Категория' },
  { k: 'till', t: 'Аттестация до' },
];

/** База вопросов: тема, сколько вопросов и когда пополняли. Пополняет её
    комиссия — этим тест и живёт: одни и те же вопросы из года в год судьи
    выучивают наизусть. */
const QBANK = [
  { t: 'Правила игры ITTF', n: 68, upd: 'пополнена 12.06.2026 · Оспанов Т.' },
  { t: 'Судейство матча и жесты', n: 42, upd: 'пополнена 03.05.2026 · Ким Л.' },
  { t: 'Регламент ФНТ РК', n: 35, upd: 'пополнена 21.02.2026 · Мукашев Б.' },
  { t: 'Системы проведения и сетки', n: 27, upd: 'пополнена 21.02.2026 · Мукашев Б.' },
  { t: 'Инвентарь и оборудование', n: 18, upd: 'не пополнялась с 2025 года' },
];

const ATT_GRID = '2fr 1fr 0.9fr 0.8fr 1.5fr';
const attDue = ATTEST.filter((a) => a.left <= 30);

/** Вкладка «Сроки и допуск»: у кого аттестация действует и до какого числа. */
const AttDue5_13 = () => {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS513)[number]['k']; up: boolean }>({ k: 'till', up: true });
  /* Кому уже отправили напоминание: уведомление уходит списком — срок подходит
     сразу у многих, и разбирать их поштучно — работа ни о чём. */
  const [told, setTold] = useState<string[]>([]);

  const key = (d: string) => d.split('.').reverse().join('');
  const found = ATTEST.filter((a) => {
    const t = q.trim().toLowerCase();
    return !t || a.nm.toLowerCase().includes(t) || a.cat.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const v = sort.k === 'till'
      ? key(a.till).localeCompare(key(b.till))
      : String(a[sort.k]).localeCompare(String(b[sort.k]), 'ru');
    return sort.up ? v : -v;
  });

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия или категория" className="w-72" />
        <Button size="sm" variant="outline" onPress={() => setTold(attDue.map((a) => a.nm))}>
          <Bell size={14} /> Напомнить всем, у кого истекает
        </Button>
      </div>

      <Sheet
        grid={ATT_GRID}
        cols={[
          ...COLS513.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
            />
          )),
          <span key="sc">Балл</span>,
          <span key="ok" className="text-right">Допуск</span>,
        ]}
      >
        {rows.map((a) => {
          const st = attState(a);
          return (
            <div
              key={a.nm}
              data-to="Э5.12"
              data-row
              className={
                'grid cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-neutral-50' +
                (a.left < 0 ? ' opacity-60' : '')
              }
              style={{ gridTemplateColumns: ATT_GRID }}
            >
              <Who
                av={a.av}
                nm={a.nm}
                sub={
                  told.includes(a.nm) ? (
                    <span className="font-medium text-green-700">напоминание отправлено</span>
                  ) : a.left < 0 ? (
                    /* Без рода: в реестре и судьи, и судьи-женщины — «не
                       допущен» под фамилией Абдрахмановой читался ошибкой. */
                    <span className="text-red-600">допуска нет · срок вышел</span>
                  ) : (
                    `до ${a.till}`
                  )
                }
              />
              <span className="text-neutral-600">{a.cat}</span>
              <span className="tabular-nums text-neutral-600">{a.till}</span>
              <span className="tabular-nums">{a.score ?? '—'}</span>
              <span className="flex justify-end"><P t={st.t} cls={st.cls} /></span>
            </div>
          );
        })}
        {rows.length === 0 && <NoRows>По запросу «{q}» никого нет — проверьте написание фамилии.</NoRows>}
      </Sheet>

      <div className="mt-3">
        <Bar>
          Допуск к работе проставляется сам: сдал тест — аттестация действует до указанной даты,
          вышел срок — судья в наряд не назначается ✳. Отдельной кнопки «допустить» нет, иначе
          допуск разошёлся бы со сроком.
        </Bar>
      </div>
    </>
  );
};

/** Вкладка «Комиссия»: состав и порядок аттестации. */
const AttBoard5_13 = () => (
  <div className="grid grid-cols-2 items-start gap-4">
    <Panel title="Аттестационная комиссия" extra={<P t="НАЗНАЧЕНА НА СЕЗОН" cls="live" />}>
      <Rows>
        <Row av={A(83)} nm="Мукашев Б." sub="председатель ГСК · председатель комиссии" pill={{ t: 'ПРЕДСЕДАТЕЛЬ', cls: 'reg' }} />
        <Row av={A(76)} nm="Оспанов Тимур" sub="национальная категория · Астана" pill={{ t: 'ЧЛЕН КОМИССИИ', cls: 'live' }} action="Убрать" />
        <Row av={AW(31)} nm="Ким Лариса" sub="первая категория · Караганда" pill={{ t: 'ЧЛЕН КОМИССИИ', cls: 'live' }} action="Убрать" />
        <Row av={A(51)} nm="Токаев Марат" sub="национальная категория · Шымкент" pill={{ t: 'ЧЛЕН КОМИССИИ', cls: 'live' }} action="Убрать" />
      </Rows>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500">Комиссия принимает тест и пополняет базу вопросов</span>
        <Button size="sm" variant="outline" data-to="Э5.5">
          <UserPlus size={14} /> Добавить из реестра судей
        </Button>
      </div>
    </Panel>

    <Panel title="Порядок аттестации" extra={<P t="⚠ УТОЧНИТЬ" cls="wait" />}>
      <KV
        items={[
          ['Форма', 'Онлайн-тест'],
          ['Кто принимает', 'Аттестационная комиссия'],
          ['Периодичность', <span key="p" className="text-amber-700">⚠ не названа федерацией</span>],
          ['Проходной балл', <span key="b" className="text-amber-700">⚠ не назван</span>],
          ['Число попыток', <span key="n" className="text-amber-700">⚠ не названо</span>],
          ['Срок действия', <span key="s" className="text-amber-700">⚠ не назван — в макете год</span>],
        ]}
      />
      <div className="mt-3">
        <Bar>
          Пока эти четыре величины не заданы, экран показывает их как открытые вопросы, а не
          подставляет свои: от периодичности и проходного балла зависит, кто вообще допущен к
          судейству.
        </Bar>
      </div>
    </Panel>
  </div>
);

/** Вкладка «База вопросов». */
const AttBank5_13 = () => (
  <>
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-[12.5px] text-neutral-500">
        {QBANK.reduce((n, t) => n + t.n, 0)} вопросов в {QBANK.length} темах
      </span>
      <Button size="sm" variant="outline">
        <Upload size={14} /> Добавить вопросы
      </Button>
    </div>
    <Rows>
      {QBANK.map((t) => (
        <Row
          key={t.t}
          nm={t.t}
          sub={t.upd}
          val={`${t.n} вопросов`}
          pill={t.upd.startsWith('не пополнялась') ? { t: 'УСТАРЕЛА', cls: 'bad' } : undefined}
          action="Открыть"
        />
      ))}
    </Rows>
    <div className="mt-3">
      <Bar>
        База пополняется, иначе тест перестаёт проверять ✳: одни и те же вопросы из года в год
        судьи выучивают наизусть. Тема, которую не трогали больше года, помечена.
      </Bar>
    </div>
  </>
);

export function Attest5_13() {
  const gone = ATTEST.filter((a) => a.left < 0);
  return (
    <WebApp role={R05} nav="Аттестация" title="Аттестация судей">
      <StatTiles
        items={[
          { v: String(ATTEST.length), k: 'Судей в реестре' },
          { v: String(ATTEST.length - attDue.length), k: 'Аттестация действует', tone: 'g' },
          { v: String(attDue.length - gone.length), k: 'Истекает в 30 дней', tone: 'a' },
          /* Просрочка — красным, а не жёлтым: эти судьи уже не допущены. */
          { v: String(gone.length), k: 'Просрочена — к работе не допущены', tone: 'b' },
        ]}
      />
      <PageTabs
        items={[
          { t: ATT_TABS[0], view: <AttDue5_13 /> },
          { t: ATT_TABS[1], view: <AttBoard5_13 /> },
          { t: ATT_TABS[2], view: <AttBank5_13 /> },
        ]}
      />
    </WebApp>
  );
}

const Attest5_13States = () => (
  <States>
    <Shot
      tone="warning"
      title="Порядок аттестации задан не до конца"
      text="⚠ Периодичность, проходной балл, число попыток и срок действия федерацией не названы: экран показывает их открытыми вопросами, а не подставляет свои. В макете срок взят годом."
      wide
    >
      <Frag w={620}>
        <Panel title="Порядок аттестации" extra={<P t="⚠ УТОЧНИТЬ" cls="wait" />}>
          <KV
            items={[
              ['Форма', 'Онлайн-тест'],
              ['Кто принимает', 'Аттестационная комиссия'],
              ['Периодичность', <span key="p" className="text-amber-700">⚠ не названа федерацией</span>],
              ['Проходной балл', <span key="b" className="text-amber-700">⚠ не назван</span>],
              ['Число попыток', <span key="n" className="text-amber-700">⚠ не названо</span>],
              ['Срок действия', <span key="s" className="text-amber-700">⚠ не назван — в макете год</span>],
            ]}
          />
          <div className="mt-3">
            <Bar tone="warning">
              От периодичности и проходного балла зависит, кто вообще допущен к судейству: пока их
              нет, столбец «Аттестация до» в списке держится на нашем предположении.
            </Bar>
          </div>
        </Panel>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.6 · Документы на проверке: баллы подсказаны Положением ───── */

/** Документ на балл. `pts` — что система насчитала по таблицам Положения:
    балл вида умножен на коэффициент. Председатель подтверждает или отклоняет —
    считает система, решает человек. */
type Doc = {
  av: string;
  nm: string;
  what: string;
  kind: string;
  when: string;
  pts: string;
  file: string;
  /** Подан позже 10 дней: ⚠ последствие в Положении не указано. */
  late?: boolean;
};

const DOCS: Doc[] = [
  { av: A(13), nm: 'Пак Сергей', what: 'Офлайн-семинар Федерации, Алматы', kind: 'Семинар', when: '08.08.2026', pts: '+4,5', file: 'сертификат-семинар-05-08.pdf' },
  { av: AW(31), nm: 'Ким Лариса', what: 'Онлайн-семинар ITTF', kind: 'Семинар', when: '07.08.2026', pts: '+1', file: 'ittf-online-certificate.pdf' },
  { av: A(51), nm: 'Токаев Марат', what: 'Работа в ГСК РК, 6 месяцев', kind: 'Коллегия', when: '05.08.2026', pts: '+2', file: 'vypiska-gsk.pdf' },
  { av: A(22), nm: 'Жумабеков Расул', what: 'Благодарственное письмо', kind: 'Награда', when: '27.06.2026', pts: '+1', file: 'blagodarnost.pdf', late: true },
  { av: AW(32), nm: 'Абдрахманова Айгерим', what: 'Судейский семинар области', kind: 'Семинар', when: '01.08.2026', pts: '+2', file: 'seminar-oblast.pdf' },
  { av: A(45), nm: 'Досжан Марат', what: 'Работа в коллегии региона', kind: 'Коллегия', when: '29.07.2026', pts: '+1', file: 'kollegiya-region.pdf' },
];

const COLS56: { k: 'nm' | 'kind' | 'when'; t: string }[] = [
  { k: 'nm', t: 'Судья и документ' },
  { k: 'kind', t: 'Вид' },
  { k: 'when', t: 'Подан' },
];

/** Виды документов по Положению: семинары идут в S3, награды и работа в
    коллегии — в S4. Смены категории здесь нет ✳: она не начисляет балл, а
    меняет опорный S2 и категорию в профиле — правит справочные данные
    человека, а не его активность. ⚠ Где её принимают, не определено. */
const F56 = ['Все документы', 'Семинары', 'Награды и коллегия'];

const DOCS_GRID = '2.2fr 0.8fr 1.1fr 0.9fr 96px';

export function Docs5_6() {
  const [f, setF] = useState(F56[0]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS56)[number]['k']; up: boolean }>({ k: 'when', up: false });
  /* Решение по документу: 1 — принят с баллами, −1 — отклонён. Разобранный
     документ остаётся в списке с пометкой — как на экране судей. */
  const [v, setV] = useState<Record<string, number>>({});
  const set = (k: string, n: number) => setV({ ...v, [k]: v[k] === n ? 0 : n });

  const byF = (d: Doc) =>
    f === F56[0] ||
    (f === F56[1] && d.kind === 'Семинар') ||
    (f === F56[2] && (d.kind === 'Награда' || d.kind === 'Коллегия'));
  const found = DOCS.filter((d) => {
    const t = q.trim().toLowerCase();
    return byF(d) && (!t || d.nm.toLowerCase().includes(t) || d.what.toLowerCase().includes(t));
  });
  const rows = [...found].sort((a, b) => {
    const x = sort.k === 'when'
      ? a.when.split('.').reverse().join('').localeCompare(b.when.split('.').reverse().join(''))
      : String(a[sort.k]).localeCompare(String(b[sort.k]), 'ru');
    return sort.up ? x : -x;
  });

  return (
    <WebApp role={R05} nav="Документы" title="Документы на проверке">
      {/* Тот же приём, что на экране судей: фильтр, поиск, таблица с решением в
          строке. Плиток нет — «сколько в очереди» и «сколько какого вида»
          считаются по той же таблице, что стоит ниже. */}
      <div className="mb-3"><FilterSeg items={F56} active={f} onPick={setF} /></div>
      <div className="mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия или документ" className="w-80" />
      </div>

      <Sheet
        grid={DOCS_GRID}
        cols={[
          ...COLS56.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
            />
          )),
          <span key="pts">К начислению</span>,
          <span key="v" className="text-right">Решение</span>,
        ]}
      >
        {rows.map((d) => (
          <div
            key={d.nm}
            className={
              'grid items-center gap-3 px-4 py-2.5 text-[13px] ' +
              (v[d.nm] === 1 ? 'bg-green-50/60' : v[d.nm] === -1 ? 'opacity-55' : 'hover:bg-neutral-50')
            }
            style={{ gridTemplateColumns: DOCS_GRID }}
          >
            {/* Пока решения нет, под фамилией сам документ — по нему и решают;
                после решения строка говорит о решении. */}
            <Who
              av={d.av}
              nm={d.nm}
              sub={
                v[d.nm] === 1 ? (
                  <span className="font-medium text-green-700">Принят с баллами</span>
                ) : v[d.nm] === -1 ? (
                  <span className="text-red-600">Отклонён с причиной</span>
                ) : (
                  d.what
                )
              }
            />
            <span className="text-neutral-600">{d.kind}</span>
            {/* Срок подачи — 10 дней. ⚠ Последствие пропуска в Положении не
                указано, поэтому не отклоняем сами, а помечаем. */}
            <span className={d.late ? 'font-medium text-amber-700' : 'text-neutral-600'}>
              {d.when}
              {d.late && ' · позже срока'}
            </span>
            <b className="tabular-nums" title={d.file}>{d.pts}</b>
            <span className="flex justify-end gap-1.5">
              <button
                type="button"
                title="Принять с баллами"
                onClick={() => set(d.nm, 1)}
                className={
                  'flex h-7 w-7 items-center justify-center rounded-md ' +
                  (v[d.nm] === 1 ? 'bg-green-100 text-green-700' : 'text-neutral-400 hover:bg-green-50 hover:text-green-700')
                }
              >
                <BadgeCheck size={15} />
              </button>
              <button
                type="button"
                title="Отклонить с причиной"
                data-to="Э5.9"
                onClick={() => set(d.nm, -1)}
                className={
                  'flex h-7 w-7 items-center justify-center rounded-md ' +
                  (v[d.nm] === -1 ? 'bg-red-100 text-red-700' : 'text-neutral-400 hover:bg-red-50 hover:text-red-600')
                }
              >
                <Ban size={15} />
              </button>
            </span>
          </div>
        ))}
        {rows.length === 0 && <NoRows>По запросу «{q}» ничего нет — проверьте написание.</NoRows>}
      </Sheet>
    </WebApp>
  );
}

const Docs5_6States = () => (
  <States>
    <Shot
      tone="warning"
      title="Документ подан позже 10 дней"
      text="⚠ Последствие пропуска срока в Положении не указано, уточняется у федерации."
      wide
    >
      <Frag w={620}>
        <Rows>
          <Row
            nm="Оспанов Т. · семинар S3"
            sub="подан на 14-й день · срок подачи — 10 дней"
            pill={{ t: 'ПОЗЖЕ СРОКА', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Засчитывать или нет — решения нет: балл не проставляем, документ остаётся в очереди.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э5.7 · Публикация рейтинга и окно апелляций на 10 дней ──────── */

type App = { av: string; nm: string; what: string; when: string; done?: 1 | -1 };

const APPEALS: App[] = [
  { av: A(13), nm: 'Пак Сергей', what: 'Коэффициент 1,5 за выезд · S1, Кубок Караганды', when: '06.08.2026' },
  { av: A(22), nm: 'Жумабеков Расул', what: 'Отклонён документ S4 · благодарственное письмо', when: '07.08.2026' },
  { av: A(19), nm: 'Цой Виктор', what: 'Начисление S1 за «Алатау Опен»', when: '04.08.2026', done: 1 },
  { av: AW(31), nm: 'Ким Лариса', what: 'Место в рейтинге при равенстве баллов', when: '03.08.2026', done: -1 },
];

const COLS57: { k: 'nm' | 'when'; t: string }[] = [
  { k: 'nm', t: 'Судья и о чём апелляция' },
  { k: 'when', t: 'Подана' },
];

const F57 = ['Все апелляции', 'Ждут решения', 'Решённые'];

const APP_GRID = '2.6fr 0.9fr 1.4fr';

export function Publish5_7() {
  const [f, setF] = useState(F57[0]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS57)[number]['k']; up: boolean }>({ k: 'when', up: false });
  const [v, setV] = useState<Record<string, number>>(
    Object.fromEntries(APPEALS.filter((a) => a.done).map((a) => [a.nm, a.done as number])),
  );
  /* Чья апелляция открыта: строка открывает разбор — решают по одному
     человеку, а не по списку, как журнал начислений в Э5.5. */
  const [open, setOpen] = useState<string | null>(null);
  /* Опубликован ли рейтинг. Публикация показывает рейтинг всем и открывает
     окно апелляций, поэтому кнопка после нажатия перестаёт быть кнопкой и
     горит состоянием. Отозвать можно ✳ — но только пока не подана ни одна
     апелляция: после неё только апелляционный порядок. */
  const [pub, setPub] = useState(false);
  const cur = APPEALS.find((a) => a.nm === open);

  const found = APPEALS.filter((a) => {
    const t = q.trim().toLowerCase();
    const byF = f === F57[0] || (f === F57[1]) === !v[a.nm];
    return byF && (!t || a.nm.toLowerCase().includes(t) || a.what.toLowerCase().includes(t));
  });
  const rows = [...found].sort((a, b) => {
    const x = sort.k === 'when'
      ? a.when.split('.').reverse().join('').localeCompare(b.when.split('.').reverse().join(''))
      : a.nm.localeCompare(b.nm, 'ru');
    return sort.up ? x : -x;
  });

  return (
    <WebApp role={R05} nav="Публикация" title="Публикация рейтинга и апелляции">
      {/* Публикация — главное действие экрана, поэтому стоит в одной строке с
          фильтром, а не панелью справа. Подписи под заголовком нет и сроков
          рядом тоже: до нажатия публиковать нечего было объяснять, а после —
          состояние написано на самой кнопке. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg items={F57} active={f} onPick={setF} />
        {pub ? (
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-[13px] font-semibold text-green-800">
              <BadgeCheck size={15} /> Рейтинг опубликован
            </span>
            <QuietAction onPress={() => setPub(false)}>
              <Undo2 size={15} /> Отозвать публикацию
            </QuietAction>
          </span>
        ) : (
          <Button variant="primary" onPress={() => setPub(true)}>
            <Megaphone size={15} /> Опубликовать рейтинг
          </Button>
        )}
      </div>
      <div className="mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия или предмет апелляции" className="w-80" />
      </div>

      <Sheet
        grid={APP_GRID}
        cols={[
          ...COLS57.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
            />
          )),
          <span key="v" className="text-right">Решение</span>,
        ]}
      >
        {rows.map((a) => (
          <div
            key={a.nm}
            role="button"
            tabIndex={0}
            data-row
            onClick={() => setOpen(a.nm)}
            className={
              'grid cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] ' +
              (open === a.nm ? 'bg-blue-50/60' : 'hover:bg-neutral-50')
            }
            style={{ gridTemplateColumns: APP_GRID }}
          >
            <Who av={a.av} nm={a.nm} sub={a.what} />
            <span className="tabular-nums text-neutral-600">{a.when}</span>
            <span className="flex justify-end">
              <P
                t={v[a.nm] === 1 ? 'УДОВЛЕТВОРЕНА' : v[a.nm] === -1 ? 'ОТКЛОНЕНА' : 'ЖДЁТ РЕШЕНИЯ'}
                cls={v[a.nm] === 1 ? 'live' : v[a.nm] === -1 ? 'bad' : 'wait'}
              />
            </span>
          </div>
        ))}
        {rows.length === 0 && <NoRows>По запросу «{q}» ничего нет — проверьте написание.</NoRows>}
      </Sheet>

      {cur && (
        <InlineDialog
          title={`Апелляция · ${cur.nm}`}
          sub={`подана ${cur.when} · рассмотреть за 10 рабочих дней · решение окончательное`}
          to="Э5.7"
          foot={
            <>
              <span className="mr-auto"><QuietAction onPress={() => setOpen(null)}>Закрыть</QuietAction></span>
              <Button variant="outline" onPress={() => { setV({ ...v, [cur.nm]: -1 }); setOpen(null); }}>
                <Ban size={15} /> Отклонить
              </Button>
              <Button variant="primary" onPress={() => { setV({ ...v, [cur.nm]: 1 }); setOpen(null); }}>
                <BadgeCheck size={15} /> Удовлетворить
              </Button>
            </>
          }
        >
          <FormGrid>
            <FieldView label="Что оспаривается" value={cur.what} wide />
            <FieldView label="Подана" value={`${cur.when} · в окне 10 дней`} />
            <FieldView label="Рейтинг на момент публикации" value="R 18 · 3 место" />
          </FormGrid>
          <div className="mt-3">
            <Bar>
              Удовлетворение — пересчёт: исправление попадает в журнал начислений, рейтинг
              обновляется, судье уходит уведомление.
            </Bar>
          </div>
        </InlineDialog>
      )}
    </WebApp>
  );
}

/** Разбор апелляции — как он открывается по строке ✳ (зона данных «Разбор —
    окном по строке»). На самом экране диалог по умолчанию закрыт, и ни то, что
    оспаривается, ни рейтинг на момент публикации, ни оба решения нигде не были
    видны. */
const Appeal5_7Also = () => (
  <Also cap="Разбор апелляции — окном по строке ✳">
    <Frag w={620}>
      <DialogFrag h={440}>
        <InlineDialog
          title={`Апелляция · ${APPEALS[0].nm}`}
          sub={`подана ${APPEALS[0].when} · рассмотреть за 10 рабочих дней · решение окончательное`}
          to="Э5.7"
          foot={
            <>
              <span className="mr-auto"><QuietAction>Закрыть</QuietAction></span>
              <Button variant="outline">
                <Ban size={15} /> Отклонить
              </Button>
              <Button variant="primary">
                <BadgeCheck size={15} /> Удовлетворить
              </Button>
            </>
          }
        >
          <FormGrid>
            <FieldView label="Что оспаривается" value={APPEALS[0].what} wide />
            <FieldView label="Подана" value={`${APPEALS[0].when} · в окне 10 дней`} />
            <FieldView label="Рейтинг на момент публикации" value="R 18 · 3 место" />
          </FormGrid>
          <div className="mt-3">
            <Bar>
              Удовлетворение — пересчёт: исправление попадает в журнал начислений, рейтинг
              обновляется, судье уходит уведомление.
            </Bar>
          </div>
        </InlineDialog>
      </DialogFrag>
    </Frag>
  </Also>
);

const Publish5_7States = () => (
  <States>
    <Shot
      tone="info"
      title="Окно апелляций закрыто"
      text="Форма подачи у судей исчезает, поздние обращения не принимаются."
    >
      <Frag>
        <Rows>
          <Row nm="Апелляции сезона 2026" sub="окно было открыто до 15.08" pill={{ t: 'ЗАКРЫТО', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="success"
      title="Итоги года"
      text="Номинации Gold / Silver / Bronze (топ-10) на публичной странице рейтинга."
    >
      <Frag>
        <Rows>
          <Row nm="Оспанов Тимур" sub="R 27,5 · 1 место" pill={{ t: 'GOLD', cls: 'live' }} />
          <Row nm="Токаев Марат" sub="R 24,1 · 2 место" pill={{ t: 'SILVER', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд роли: экраны маршрута подряд ──────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.
    Коды, подписи и порядок — те же, что были: по ним сходятся flows/, данные
    роли и Storybook. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => (
      <>
        <Login0_1 />
        {/* Выбор контекста — зона данных Э0.1: у председателя ГСК ролей бывает
            несколько (он же судья и член комиссии), и после входа спрашивают, с
            какой работать. Экран сквозной, поэтому берётся из role00. */}
        <Also cap="Следующий шаг, если ролей несколько ✳">
          <Context0_1 />
        </Also>
        <Login0_1States5 />
      </>
    ),
    next: 'первый экран роли',
  },
  'Э5.1': {
    cap: 'Панель ГСК',
    view: () => (
      <>
        <Queues5_1 />
        <Queues5_1States />
      </>
    ),
    next: 'пункт меню «Соревнования»',
  },
  'Э5.3': {
    cap: 'Соревнования сезона',
    view: () => (
      <>
        <Season5_3 />
        <Season5_3Also />
        <Season5_3States />
      </>
    ),
    next: '«Завести соревнование»',
  },
  'Э5.11': {
    cap: 'Завести соревнование',
    view: () => (
      <>
        <NewTour5_11 />
        <NewTour5_11States />
      </>
    ),
    next: 'строка соревнования',
  },
  'Э5.10': {
    cap: 'Карточка турнира',
    view: () => (
      <>
        <Tour5_10 />
        <Schedule5_10Also />
        <Tour5_10States />
      </>
    ),
    next: 'вкладка «Судьи»',
  },
  'Э5.2': {
    cap: 'Судьи на турнир',
    view: () => (
      <>
        <Applications5_2 />
        <Applications5_2States />
      </>
    ),
    next: 'меню «Протоколы»',
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
    next: 'меню «Документы»',
  },
  'Э5.5': {
    cap: 'Реестр судей: допуск и рейтинг',
    view: () => (
      <>
        <Rating5_5 />
        <Journal5_5Also />
        <Rating5_5States />
      </>
    ),
    next: 'строка судьи',
  },
  'Э5.13': {
    cap: 'Аттестация судей',
    view: () => (
      <>
        <Attest5_13 />
        <Attest5_13States />
      </>
    ),
    next: 'карточка судьи',
  },
  'Э5.12': {
    cap: 'Карточка судьи',
    view: () => (
      <>
        <Judge5_12 />
        <Judge5_12States />
      </>
    ),
    next: 'меню «Документы»',
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
        <Appeal5_7Also />
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
