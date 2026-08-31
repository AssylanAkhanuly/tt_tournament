/* Роль 1 · Администратор Федерации — макеты по флоу на новом слое (HeroUI) ✳
   (30.08.2026). Содержание, решения и переходы — прежние (см.
   `flows/01-admin-federacii.md`); меняется подача: оболочка WebApp и доменные
   компоненты `kit/hero/app` вместо старого макетного слоя.

   Роль работает с десктопа и видит всю систему: календарь и турниры, роли,
   реестры, журнал, контент. Полный доступ безопасен потому, что система
   именная — каждое действие попадает в журнал (TZ §12).

   Под каждым экраном стоит полка `States` — тот же экран в других ситуациях
   (пусто, поле не заполнено, действие запрещено). Подписи кадров повторяют
   `states[]` из данных роли: `src/flows/data/role01.ts`; у входа (Э0.1) —
   из данных сквозных экранов, `role00.ts`. Кроме состояний на полке бывает
   кадр зоны — то, что на самом экране открывается кликом и в снимок борда не
   попадает (карточка человека с ролями на Э1.5); соседний вид того же экрана
   стоит врезкой `Also` (шаг 2 мастера на Э1.4, вид
   «Календарь» на Э1.2, раздел «Расписание» на Э1.3).

   Сегодня в макете — 15 апреля 2026: идёт 2-й тур Евразийской лиги, ближайший
   главный старт (Кубок РК) — 18 мая. От этой даты считаются все «сегодня»,
   «через сколько дней» и записи журнала. */

import { Fragment, useState, type ReactNode } from 'react';
import {
  ChartPie,
  Bell, CalendarDays, Check, ChevronDown, ChevronRight, Copy, FileSpreadsheet, GitMerge, History,
  LayoutDashboard, Merge, Minus, Newspaper, Pencil, Plus, Send, UserCog, UserPlus, X,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
/* Кит-компоненты берутся поимённо. У календаря кита есть свои `MONTHS` и
   `MONTHS_GEN`, а роль экспортирует одноимённые (ими пользуются роли 12 и 13):
   импортировать их отсюда нельзя — имена столкнутся. */
import {
  A, AW, Attention as AttnQueue, AreaInput, Bar, dateWords, DayList, Derived, DisabledAction,
  EmptyBox, EventTimeline, Facts, FieldView, FileDrop, FilterSeg, FormGrid, InlineDialog, MiniMonth,
  MonthGrid, Pager, Panel, PhoneRoleApp, PickField, Pill, QuietAction, Row, Rows, ScreenScope,
  SearchInput, TextInput, TimeGrid, StatTiles, WebApp,
  Bars, ChartRow, Donut, FilterBar,
  type AttnItem, type CalEvent, type CalTone, type RoleUI, type SlotEvent, type TimelineItem,
  Sheet,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки,
   полки состояний и врезки. Сами экраны собраны новым слоем. */
import { Also, Board, States, Shot, type ScreenMap } from './shell';
/* Сетка — настоящий компонент фронта, как и в прежнем слое: вторая
   нарисованная сетка разошлась бы с той, что увидят в продукте. */
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { makeBigBracket } from '../bigBracket';
/* Вход — сквозной экран (Э0.1): его рисует `role00`, борд
   роли ставит их первой колонкой. Полка состояний входа собрана здесь: борд
   роли начинается со входа, и без неё три объявленных состояния нигде не
   показаны. */
import { Login0_1, LoginPhone0_1 } from './role00';
/* Состав участников и его таблица — те же, что у спортсмена (Э14.5) и у клуба
   (Э13.9): список участников турнира у всех ролей один, разный только срез
   «мои». Второй такой же список — это два состава одного турнира, которые
   разъедутся. */
import { PLAYERS as ROSTER, Players14_5, type Ply14 } from './role14';

/** Плей-офф Кубка РК: 32 вышедших из групп. Формат турнира — «олимпийская с
    группами», и сетка на выбывание начинается после группового этапа. */
const playoff32 = { ...makeBigBracket(5), title: 'Кубок Республики Казахстан 2026 · плей-офф' };

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    `badge: false` — роль вне турнира, значка состояния в шапке нет. */
const R01: RoleUI = {
  num: '1',
  title: 'Администратор Федерации',
  person: { nm: 'Абаева Д.', rl: 'Администратор Федерации', av: AW(44) },
  brandName: 'Сезон 2026',
  brandSub: 'Календарь ФНТ РК · 8 главных стартов',
  badge: false,
  nav: [
    [<LayoutDashboard size={16} key="p" />, 'Панель'],
    [<CalendarDays size={16} key="c" />, 'Календарь'],
    [<UserCog size={16} key="u" />, 'Пользователи'],
    [<History size={16} key="j" />, 'Журнал'],
    [<Newspaper size={16} key="n" />, 'Новости'],
    [<ChartPie size={16} key="g" />, 'Статистика регионов'],
  ],
};

/* ── Общие мелочи роли ──────────────────────────────────────────── */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. */
type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const P = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

/** Второстепенная кнопка с иконкой. Экспортируется: ею пользуются
    роли-наблюдатели (role0304) — подпись и место те же, подача новая. */
export const Btn = ({ children }: { children: ReactNode }) => (
  <Button size="sm" variant="outline">{children}</Button>
);

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/* ── Второй формат: те же экраны на телефоне ✳ (30.08.2026) ───────────
   Решение владельца продукта — «все экраны в обоих»: роль работает не только с
   того устройства, под которое её рисовали первой. Администратор Федерации
   сидит за десктопом, но календарь, очередь дел и журнал он открывает и с
   телефона — из зала, из машины, из отпуска.

   Правило переноса одно: данные не удваиваются. Телефонный кадр берёт те же
   массивы и константы, что десктопный (`TOURS`, `ATTENTION`, `LOG`, `NEWS`,
   `REGISTRIES`), а там, где содержимое совпадает целиком, десктоп и телефон
   рисуются одним компонентом с флагом `phone`. Меняется раскладка:
   - таблицы становятся строками — в 392 px пять колонок не читаются;
   - ряды «фильтр + поиск + кнопка» встают друг под другом;
   - поля формы идут в одну колонку;
   - холст сетки и шкала времени заменяются списком того же содержания. */

/** Полоса срезов на телефоне: набор из четырёх-пяти кнопок в 392 px не влезает
    и ломается на второй ряд, а сломанный переключатель перестаёт читаться как
    один выбор. Прокручиваем его вбок, вылезая за поля кадра, — так же, как это
    делают вкладки в мобильных приложениях. */
const Swipe = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 overflow-x-auto px-4 *:flex-nowrap!">{children}</div>
);

/** Диалог на телефоне. `InlineDialog` кита прибит к 520 (или 720) пикселям — в
    кадре шириной 392 он вылезает за края. Второго диалога заводить нельзя:
    заголовок, крестик, подвал и переходы у него те же, — поэтому ширину и поля
    правит обёртка, а сам диалог остаётся тем же компонентом. */
const PhoneDialog = ({ children }: { children: ReactNode }) => (
  <div className="[&>div]:p-3! [&>div>div]:w-full!">{children}</div>
);

/* ⚠ Временная дупликация с role05: Sheet/Th/NoRows/Who — общие мелочи нового
   слоя, но общего дома у них пока нет, а импортировать их из чужого roleNN
   нельзя. Когда мелочи переедут в kit/hero — заменить на общие. */


/** Заголовок сортируемого столбца. */
const Th = ({ t, on, onClick }: { t: string; on: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={'flex items-center gap-1 text-left uppercase tracking-wider ' + (on ? 'text-neutral-700' : 'hover:text-neutral-600')}
  >
    {t}
    {on && <ChevronDown size={11} />}
  </button>
);

/** Пустой результат поиска — строкой таблицы, а не отдельным экраном. */
const NoRows = ({ children }: { children: ReactNode }) => (
  <div className="px-4 py-4 text-[12.5px] text-neutral-500">{children}</div>
);

/** Человек в строке таблицы: фото и две строки. */
const Who = ({ av, nm, sub }: { av?: string; nm: string; sub?: ReactNode }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    {av && (
      <Avatar size="sm">
        <Avatar.Image alt={nm} src={av} />
        <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
    )}
    <span className="min-w-0 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{nm}</span>
      {sub && <span className="block truncate text-xs text-neutral-500">{sub}</span>}
    </span>
  </span>
);

/** Малые плитки-показатели внутри панели или диалога. */
const CELL_TONE = { g: 'text-green-700', a: 'text-amber-600', r: 'text-red-600', b: 'text-blue-700' } as const;
const Cells = ({ items, cols = 3 }: { items: { v: string; k: string; tone?: keyof typeof CELL_TONE }[]; cols?: number }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
    {items.map((c) => (
      <div key={c.k} className="rounded-lg bg-neutral-50 px-3 py-2.5">
        <div className={'text-lg font-semibold leading-tight tabular-nums ' + (c.tone ? CELL_TONE[c.tone] : '')}>{c.v}</div>
        <div className="mt-0.5 text-[11px] text-neutral-500">{c.k}</div>
      </div>
    ))}
  </div>
);

/** Подзаголовок раздела внутри диалога или панели-документа. */
const Sec = ({ children }: { children: ReactNode }) => (
  <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 first:mt-0">{children}</div>
);

/** Тумблер условия допуска: статичный вид с переключением — Switch старого
    слоя в новом не живёт, а Tailwind такие вещи выражает сам. */
const Flag = ({ label, on: initial = true }: { label: string; on?: boolean }) => {
  const [on, setOn] = useState(initial);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-left text-sm"
    >
      {label}
      <span className={'relative h-5 w-9 shrink-0 rounded-full ' + (on ? 'bg-blue-600' : 'bg-neutral-300')}>
        <span className={'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ' + (on ? 'right-0.5' : 'left-0.5')} />
      </span>
    </button>
  );
};

/** Переключатель языка: он стоит в шапке на каждом экране системы (Э0.1, зона
    «Язык»; Э1.1, зона «Шапка»). Свой маленький, а не `FilterSeg`: в шапке
    нужен кегль мельче. */
const Langs = () => {
  const [l, setL] = useState('RU');
  return (
    <div data-seg className="inline-flex gap-0.5 rounded-lg bg-neutral-100 p-0.5">
      {['RU', 'KZ', 'EN'].map((t) => (
        <button
          key={t}
          type="button"
          aria-selected={t === l}
          onClick={() => setL(t)}
          className={
            'rounded-md px-2 py-1 text-[11px] font-semibold ' +
            (t === l ? 'on bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')
          }
        >
          {t}
        </button>
      ))}
    </div>
  );
};

/* ── Э0.1 · Вход: состояния экрана ─────────────────────────────── */

/** Полка состояний входа. Сам экран общий (`Login0_1` из `role00`), а полка у
    каждого борда своя: маршрут роли начинается со входа, и без неё объявленные
    состояния не показаны нигде. Подписи — из данных сквозных экранов
    (`src/flows/data/role00.ts`).

    Переписана под вход по ИИН и одноразовому коду ✳ (30.08.2026): пароля в
    системе нет, поэтому «неверный логин или пароль» и «аккаунт не активирован»
    описывали схему, которой не существует. Полный набор состояний входа — на
    борде сквозных экранов (Э0.1); здесь два, которые упираются в дела
    администратора Федерации. */
const Login0_1States = () => (
  <States>
    <Shot
      tone="danger"
      title="Код подтверждения не подошёл ✳"
      text="ИИН уже принят — заново его не вводят; ошибка стоит под полем кода."
    >
      <Frag w={420}>
        <Rows>
          <Row
            nm="ИИН принят"
            sub="•••• •••• 0123 · Smart Bridge узнал человека"
            pill={{ t: 'ПРОВЕРЕН', cls: 'live' }}
          />
          <Row
            nm="Код из SMS не совпал"
            sub="код одноразовый: из прежней SMS он уже не работает"
            pill={{ t: 'ОШИБКА', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Остальные состояния входа — на борде сквозных экранов (Э0.1): ИИН не найден, срок кода
            вышел, слишком много попыток, Smart Bridge не отвечает.
          </Bar>
          <DisabledAction>Войти</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Роль истекла"
      text="Роль пропадает из карточки роли в меню, история действий человека сохраняется."
    >
      <Frag>
        <Rows>
          <Row
            nm="Администратор Федерации · система"
            sub="выдана 12.01.2026 · бессрочно"
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
      title="Приглашение ещё не принято ✳"
      text="Ссылка выпущена, но человек не подтвердил себя ИИН и кодом — учётной записи ещё нет (Э0.6)."
      wide
    >
      <Frag>
        <Bar>
          Ссылку выпустил администратор Федерации 15.04.2026 (Э1.10). Аккаунт появится в тот
          момент, когда человек откроет её и подтвердит себя ИИН и кодом из SMS, — до этого войти
          не под чем.
        </Bar>
        <div className="flex items-center gap-2">
          <QuietAction>Выпустить ссылку заново</QuietAction>
          <DisabledAction>Войти</DisabledAction>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Календарь сезона: данные ───────────────────────────────────── */

/** Категория соревнования — ею фильтруется календарь (ROLES.md §«по категориям»).
    «Клубные» в календарь федерации не попадают: их ведёт администратор клуба. */
export type Cat = 'Главный старт' | 'Лига' | 'ОРТ';

/** Месяцы сезона: именительный — подпись в полосе месяцев, родительный — дата.
    Календарь есть не только у федерации (у клуба — свой, Э13.6), а месяцы и
    «сегодня» во всех макетах одни: иначе сезоны в них разъедутся. */
export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
export const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** Сегодня в макете — 15 апреля 2026: этот месяц в сетке подсвечен. */
export const NOW_M = 3;

/** Соревнование: название, категория, где и когда, судья, заявки, состояние.

    Дата разобрана на месяц и числа, а не лежит строкой: по строке показа не
    фильтруют и не раскладывают по сетке — сломается от правки подписи. */
type Tour = {
  nm: string;
  cat: Cat;
  city: string;
  /** Месяц сезона, 0 — январь. */
  m: number;
  /** Числа месяца: «18–20», «25». */
  d: string;
  /** Заявок подано / принято — у личных турниров. */
  apps: string;
  /** Командный состав тура Лиги: заявляется клуб, а не игрок, и мужской с
      женским розыгрышем идут отдельно. Лиг у мужчин шесть (Суперлига и со 2-й
      по 6-ю), у женщин пока две — женские команды выделили в отдельный
      розыгрыш только в этом сезоне (TZ §4.1). Пара — [команд, лиг]. */
  teams?: { men: [number, number]; women: [number, number] };
  judge?: string;
  st: string;
  cls: Cls;
};

/** Подпись под названием — собирается из полей, а не дублируется в данных. */
const meta = (t: Tour) => `${t.cat} · ${t.city} · ${t.d} ${MONTHS_GEN[t.m]}`;

/** Календарь сезона 2026 целиком: 8 главных стартов, 4 тура Лиги, 20 ОРТ —
    ровно те 32, что стоят в счётчиках (ROLES.md §«по категориям»).

    Набор сходится с рабочей очередью на панели: пять черновиков без регламента,
    три турнира с открытым приёмом заявок судей и без судьи. Правя одно, правьте
    и другое — иначе сетка месяцев покажет расхождение. */
const TOURS: Tour[] = [
  { nm: 'Открытие сезона 2026', cat: 'Главный старт', city: 'Астана', m: 0, d: '17–19', apps: '142 / 138', judge: 'Мукашев Б.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'ОРТ «Кубок Алатау»', cat: 'ОРТ', city: 'Алматы', m: 0, d: '31', apps: '48 / 46', judge: 'Пак С.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'Евразийская лига · 1-й тур', cat: 'Лига', city: 'Астана', m: 1, d: '6–8', apps: '— / —', teams: { men: [48, 6], women: [16, 2] }, judge: 'Пак С.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'ОРТ «Зимний Астана Open»', cat: 'ОРТ', city: 'Астана', m: 1, d: '14', apps: '52 / 50', judge: 'Мукашев Б.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'Чемпионат РК среди мужчин и женщин', cat: 'Главный старт', city: 'Алматы', m: 1, d: '24–27', apps: '156 / 149', judge: 'Оспанов Т.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'Первенство РК · 2006 г.р. и моложе', cat: 'Главный старт', city: 'Караганда', m: 2, d: '12–15', apps: '118 / 112', judge: 'Токаев М.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'ОРТ «Кубок Наурыза»', cat: 'ОРТ', city: 'Шымкент', m: 2, d: '21', apps: '61 / 58', judge: 'Пак С.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'ОРТ «Кубок Сарыарки»', cat: 'ОРТ', city: 'Караганда', m: 2, d: '28', apps: '44 / 42', judge: 'Мукашев Б.', st: 'ЗАВЕРШЁН', cls: 'done' },
  { nm: 'Евразийская лига · 2-й тур', cat: 'Лига', city: 'Караганда', m: 3, d: '14–16', apps: '— / —', teams: { men: [48, 6], women: [16, 2] }, judge: 'Пак С.', st: 'ИДЁТ', cls: 'live' },
  { nm: 'ОРТ «Кубок Иртыша»', cat: 'ОРТ', city: 'Павлодар', m: 3, d: '25', apps: '34 / 34', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' },
  { nm: 'ОРТ «Тараз Open»', cat: 'ОРТ', city: 'Тараз', m: 4, d: '2', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'ОРТ «Шымкент Open»', cat: 'ОРТ', city: 'Шымкент', m: 4, d: '9', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'Кубок Республики Казахстан 2026', cat: 'Главный старт', city: 'Астана', m: 4, d: '18–20', apps: '128 / 96', judge: 'Оспанов Т.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Актау Open»', cat: 'ОРТ', city: 'Актау', m: 4, d: '23', apps: '18 / 12', judge: 'Токаев М.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'Первенство РК · 2010 г.р. и моложе', cat: 'Главный старт', city: 'Алматы', m: 5, d: '3–5', apps: '96 / 71', judge: 'Токаев М.', st: 'ЗАЯВКИ ИГРОКОВ', cls: 'live' },
  { nm: 'Кубок РК среди ветеранов', cat: 'Главный старт', city: 'Астана', m: 5, d: '6–7', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'ОРТ «Кубок Каспия»', cat: 'ОРТ', city: 'Атырау', m: 5, d: '13', apps: '9 / 0', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' },
  { nm: 'Евразийская лига · 3-й тур', cat: 'Лига', city: 'Актобе', m: 5, d: '26–28', apps: '— / —', teams: { men: [48, 6], women: [16, 2] }, st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait' },
  { nm: 'ОРТ «Семей Open»', cat: 'ОРТ', city: 'Семей', m: 5, d: '27', apps: '6 / 0', judge: 'Пак С.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Летний Кубок Алатау»', cat: 'ОРТ', city: 'Алматы', m: 6, d: '11', apps: '4 / 0', judge: 'Оспанов Т.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'Первенство РК · 2012 г.р. и моложе', cat: 'Главный старт', city: 'Алматы', m: 6, d: '15–17', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'ОРТ «Кубок Костаная»', cat: 'ОРТ', city: 'Костанай', m: 6, d: '25', apps: '2 / 0', judge: 'Мукашев Б.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Кубок Оскемена»', cat: 'ОРТ', city: 'Усть-Каменогорск', m: 7, d: '15', apps: '— / —', judge: 'Токаев М.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Кызылорда Open»', cat: 'ОРТ', city: 'Кызылорда', m: 7, d: '29', apps: '— / —', judge: 'Пак С.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Кубок Туркестана»', cat: 'ОРТ', city: 'Туркестан', m: 8, d: '12', apps: '— / —', judge: 'Оспанов Т.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'Евразийская лига · 4-й тур', cat: 'Лига', city: 'Алматы', m: 8, d: '18–20', apps: '— / —', st: 'ЧЕРНОВИК', cls: 'done' },
  { nm: 'ОРТ «Уральск Open»', cat: 'ОРТ', city: 'Уральск', m: 9, d: '3', apps: '— / —', judge: 'Мукашев Б.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'Чемпионат РК среди команд регионов', cat: 'Главный старт', city: 'Шымкент', m: 9, d: '8–11', apps: '— / —', judge: 'Мукашев Б.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Кубок Жетысу»', cat: 'ОРТ', city: 'Талдыкорган', m: 9, d: '24', apps: '— / —', judge: 'Токаев М.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Осенний Астана Open»', cat: 'ОРТ', city: 'Астана', m: 10, d: '14', apps: '— / —', judge: 'Пак С.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Кубок Кокшетау»', cat: 'ОРТ', city: 'Кокшетау', m: 10, d: '28', apps: '— / —', judge: 'Оспанов Т.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
  { nm: 'ОРТ «Закрытие сезона»', cat: 'ОРТ', city: 'Алматы', m: 11, d: '12', apps: '— / —', judge: 'Мукашев Б.', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' },
];

/** Ближайшие старты — то, что впереди, в порядке дат.

    Не «первые три из календаря»: календарь отсортирован с января, и его начало
    к 15 апреля давно отыграно. Идущие турниры сюда не попадают — им отведена
    зона «Сегодня идут»; черновики тоже, они публично не видны и стартом ещё не
    стали (их место — в очереди «регламент не заполнен»). */
export const UPCOMING = TOURS.filter(
  (t) => t.st !== 'ЗАВЕРШЁН' && t.st !== 'ИДЁТ' && t.st !== 'ЧЕРНОВИК',
);

/** Строка календаря. `judge` — показывать ли колонку главного судьи:
    не назначен — прочерк с подсветкой, как требует флоу. Экспортируется:
    те же строки смотрят роли-наблюдатели (Э3.1, Э3.2). */
export const TourRow = ({ t, judge }: { t: Tour; judge?: boolean }) => (
  <div
    data-to="Э1.3"
    data-row
    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
  >
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{t.nm}</span>
      <span className="block truncate text-xs text-neutral-500">{meta(t)}</span>
    </span>
    {judge &&
      (t.judge ? (
        <span className="shrink-0 text-[13px] text-neutral-500">{t.judge}</span>
      ) : (
        <span className="shrink-0 text-[13px] font-medium text-amber-700">— судьи нет</span>
      ))}
    {/* У Лиги в этой колонке не «заявок подано / принято», а команды: заявляется
        клуб, и мужской с женским розыгрышем идут отдельными лигами (TZ §4.1).
        Одним числом их не свести — «12 команд» скрывало, что розыгрыша два. */}
    {t.teams ? (
      <span className="shrink-0 text-right text-[11px] leading-tight text-neutral-600">
        <span className="block"><i className="mr-1 not-italic text-neutral-400">муж</i>{t.teams.men[0]} команд · {t.teams.men[1]} лиг</span>
        <span className="block"><i className="mr-1 not-italic text-neutral-400">жен</i>{t.teams.women[0]} команд · {t.teams.women[1]} лиги</span>
      </span>
    ) : (
      <span className="shrink-0 text-[13px] tabular-nums text-neutral-700">{t.apps}</span>
    )}
    <P t={t.st} cls={t.cls} />
  </div>
);

/** Строка турнира на телефоне ✳: название, подпись, состояние — этажами.

    В 392 px десктопная строка не живёт: у неё пять колонок (название с
    подписью, судья, заявки, состояние, стрелка), и первой же гибнет подпись —
    «ОРТ · Павлодар · 25 апреля», ради которой в календарь и смотрят. Поэтому
    состояние съезжает под подпись, а судья и заявки идут рядом с ним короткой
    строкой: они отвечают на «что с турниром не так», а не на «что это». */
const TourPhoneRow = ({ t }: { t: Tour }) => (
  <div data-to="Э1.3" data-row className="flex flex-col gap-1 px-4 py-2.5">
    <span className="text-[13.5px] font-medium leading-tight">{t.nm}</span>
    <span className="text-xs leading-snug text-neutral-500">{meta(t)}</span>
    <span className="mt-0.5 flex flex-wrap items-center gap-2">
      <P t={t.st} cls={t.cls} />
      {t.teams ? (
        <span className="text-[11.5px] text-neutral-500">
          муж {t.teams.men[0]} · жен {t.teams.women[0]} команд
        </span>
      ) : (
        t.apps !== '— / —' && (
          <span className="text-[11.5px] tabular-nums text-neutral-500">заявок {t.apps}</span>
        )
      )}
      {!t.judge && <span className="text-[11.5px] font-medium text-amber-700">судьи нет</span>}
    </span>
  </div>
);

/** Ход сезона в четырёх числах — общий с обзорной панелью менеджеров (Э3.1).

    Плитки отвечают на «как идёт сезон»: сколько стартов проведено, сколько
    людей играет, сколько матчей сыграно, сколько собрано взносов. Рабочая
    очередь («без судьи», «зависшие заявки») — это не показатель, ей место
    строкой ниже. */
export const KPI = [
  { v: '12 / 32', k: 'Соревнований проведено' },
  { v: '1 284', k: 'Спортсменов в сезоне', tone: 'b' as const },
  { v: '3 470', k: 'Матчей сыграно' },
  { v: '₸ 4,12 млн', k: 'Взносы собраны · 78%', tone: 'g' as const },
];

/** Рабочая очередь: в каждый счётчик можно провалиться и увидеть, что в нём.

    Числа сходятся с календарём роли (`TOURS`) и с экраном экономиста: судей
    нет у «Иртыша», «Шымкента» и 3-го тура Лиги; «Шымкент» стоит в двух
    счётчиках сразу — пока регламент не заполнен, приём заявок судей на него не
    открыть, и это в очереди видно. */
const ATTENTION: AttnItem[] = [
  {
    n: '3',
    t: 'без главного судьи',
    rows: [
      {
        nm: 'ОРТ «Кубок Иртыша»',
        mt: 'ОРТ · Павлодар · 25 апреля',
        why: 'до старта 10 дней · подано 4 заявки судей, решения нет',
        who: 'председатель ГСК',
        to: 'Э1.3',
        cls: 'bad',
      },
      {
        nm: 'Евразийская лига · 3-й тур',
        mt: 'Лига · Актобе · 26–28 июня',
        why: 'приём заявок судей открыт 2 дня назад, заявок пока нет',
        who: 'председатель ГСК',
        to: 'Э1.3',
      },
      {
        nm: 'ОРТ «Шымкент Open»',
        mt: 'ОРТ · Шымкент · 9 мая',
        why: 'черновик: пока регламент не заполнен, приём заявок судей не открыть',
        who: 'администратор федерации',
        to: 'Э1.3',
      },
    ],
  },
  {
    n: '5',
    t: 'регламент не заполнен',
    rows: [
      {
        nm: 'ОРТ «Шымкент Open»',
        mt: 'ОРТ · Шымкент · 9 мая',
        why: 'не заполнено: столы, разряды · до старта 24 дня',
        who: 'администратор федерации',
        to: 'Э1.3',
      },
      {
        nm: 'ОРТ «Тараз Open»',
        mt: 'ОРТ · Тараз · 2 мая',
        why: 'не заполнено: возрастная граница, условия допуска · до старта 17 дней',
        who: 'администратор федерации',
        to: 'Э1.3',
        cls: 'bad',
      },
      {
        nm: 'Евразийская лига · 4-й тур',
        mt: 'Лига · Алматы · 18–20 сентября',
        why: 'не заполнено: столы, дивизионы · без дивизионов не заявить команды',
        who: 'администратор федерации',
        to: 'Э1.3',
      },
      {
        nm: 'Кубок РК среди ветеранов',
        mt: 'Главный старт · Астана · 6–7 июня',
        why: 'не заполнено: разряды, документы к заявке',
        who: 'администратор федерации',
        to: 'Э1.3',
      },
      {
        nm: 'Первенство РК · 2012 г.р. и моложе',
        mt: 'Главный старт · Алматы · 15–17 июля',
        why: 'не заполнено: окно дат, столы, ценз по рейтингу',
        who: 'администратор федерации',
        to: 'Э1.3',
      },
    ],
  },
  {
    n: '12',
    t: 'заявки без решения > 3 дней',
    rows: [
      {
        nm: 'Первенство РК · 2010 г.р. и моложе',
        mt: 'Главный старт · Алматы · 3–5 июня',
        why: '7 заявок · самая старая ждёт 9 дней',
        who: 'Токаев М., главный судья',
        to: 'Э1.3',
        cls: 'bad',
      },
      {
        nm: 'Кубок Республики Казахстан 2026',
        mt: 'Главный старт · Астана · 18–20 мая',
        why: '4 заявки · самая старая ждёт 5 дней',
        who: 'Оспанов Т., главный судья',
        to: 'Э1.3',
      },
      {
        nm: 'ОРТ «Кубок Иртыша»',
        mt: 'ОРТ · Павлодар · 25 апреля',
        why: '1 заявка · ждёт 4 дня · решать некому, судья не назначен',
        who: '— судьи нет',
        to: 'Э1.3',
        cls: 'bad',
      },
    ],
  },
  {
    n: '18',
    t: 'взносы просрочены',
    rows: [
      {
        nm: 'Жумабеков Расул',
        mt: 'Караганда · «Шахтёр» · 2007 г.р.',
        why: '₸ 10 000 · просрочен 15 дней · заявка на Кубок РК',
        who: 'экономист',
        to: 'Э1.12',
        cls: 'bad',
      },
      {
        nm: 'Тлеуова Аружан',
        mt: 'Шымкент · «Достык» · 2009 г.р.',
        why: '₸ 10 000 · просрочен 15 дней · заявка на Первенство РК',
        who: 'экономист',
        to: 'Э1.12',
        cls: 'bad',
      },
      {
        nm: 'Ещё 16 спортсменов',
        mt: 'девять клубов · шесть регионов',
        why: '₸ 160 000 · заявки на ближайшие четыре старта',
        who: 'экономист',
        to: 'Э1.12',
      },
    ],
  },
];

/** Очередь администратора федерации: общий компонент нового слоя со своими
    данными. Экспортируется — её же смотрят роли-наблюдатели (Э3.1), без
    переходов (`act={false}`). */
export const Attention = (props: { act?: boolean; action?: ReactNode; max?: number }) => (
  <AttnQueue items={ATTENTION} {...props} />
);

/** «Сегодня идут»: тур Лиги идёт двумя дивизионами сразу, на разных столах.

    `act` — показывать ли переход в ход турнира. У ролей 3 и 4 (наблюдатели)
    кнопок на экранах нет вовсе, поэтому они берут ту же зону без неё. */
export const TodayRows = ({ act = true, one, phone }: { act?: boolean; one?: boolean; phone?: boolean }) => (
  <Rows>
    {[
      { nm: 'Суперлига · мужчины', sub: 'Евразийская лига, 2-й тур · Караганда · столы 1–6', v: '34 из 60' },
      { nm: 'Суперлига · женщины', sub: 'Евразийская лига, 2-й тур · Караганда · столы 7–10', v: '26 из 48' },
    ].slice(0, one ? 1 : undefined).map((r) => (
      <div
        key={r.nm}
        data-to={act ? 'Э1.3' : undefined}
        data-row
        /* На телефоне строка складывается в два этажа: счёт сыгранных матчей и
           значок «ИДЁТ» отбирают у подписи половину и без того узкой строки, а
           «где играют и на каких столах» — это и есть подпись. */
        className={
          'flex w-full px-4 py-2.5 text-left ' +
          (phone ? 'flex-col gap-1.5' : 'items-center gap-3') +
          (act ? ' cursor-pointer hover:bg-neutral-50' : '')
        }
      >
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-medium">{r.nm}</span>
          <span className={'block text-xs text-neutral-500' + (phone ? '' : ' truncate')}>{r.sub}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-[13px] tabular-nums text-neutral-700">{r.v}</span>
          <P t="ИДЁТ" cls="live" />
        </span>
      </div>
    ))}
  </Rows>
);

/** «Сегодня идут» в межсезонье — пустая зона (её же показывают роли 3 и 4). */
const TodayEmpty = () => (
  <EmptyBox
    title="Сегодня матчей нет"
    text="Здесь появляются турниры в состоянии «Идёт» со счётом сыгранных матчей и ссылкой на ход турнира."
  />
);

/* ── Э1.1 · Панель Федерации ───────────────────────────────────── */

/** Проп `variant` старой адаптивной рамки сохранён ради истории «Адаптив»
    (role01resp): у нового слоя своей планшетной рамки веба пока нет. */
export function Dash1_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <WebApp
      role={R01}
      nav="Панель"
      title="Панель Федерации"
      sub="Сезон 2026 · 15 апреля"
    >
      <StatTiles items={KPI} />
      {/* В раскрытом счётчике две строки: панель обязана поместиться на экран
          целиком вместе с панелями под ней, а весь список открывается в
          календаре сезона. Сколько строк из скольких — подписано. */}
      <Attention
        max={2}
        action={
          <Button variant="primary">
            <Plus size={15} /> Завести соревнование
          </Button>
        }
      />
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          строки обеих панелей переносились — и «Сегодня идут», и «Ближайшие
          старты» вырастали вдвое ради того, чтобы стоять рядом. Панель сама
          держит отступ снизу, обёртка не нужна. */}
      {/* TodayRows сам рисует рамку списка (его берут и роли-наблюдатели),
          поэтому панель с отступом, а не flush — иначе рамка в рамке. */}
      <Panel title="Сегодня идут">
        <TodayRows />
      </Panel>
      <Panel
        title="Ближайшие старты"
        extra={<span className="text-xs text-neutral-500">ещё {UPCOMING.length - 1} в календаре</span>}
        flush
      >
        {UPCOMING.slice(0, 1).map((t) => (
          <TourRow key={t.nm} t={t} />
        ))}
      </Panel>
    </WebApp>
  );
}

/** Шапка крупным планом: зона «Шапка» из данных роли — сезон, переключатель
    языка, уведомления, профиль.

    Отдельным кадром, потому что переключателя языка в общей оболочке кита
    (`kit/hero/app/chrome`) пока нет ⚠, а он обязан стоять на каждом экране
    системы (Э0.1, зона «Язык»). Кадр показывает, где именно ему место: между
    названием сезона и колокольчиком. */
const Head1_1 = () => (
  <Frag w={620}>
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
      <span className="min-w-0 leading-tight">
        <span className="block text-[13.5px] font-semibold">Сезон 2026</span>
        <span className="block text-[11px] text-neutral-500">Календарь ФНТ РК · 8 главных стартов</span>
      </span>
      <span className="flex-1" />
      <span className="shrink-0"><Langs /></span>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-600">
        <Bell size={17} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        <Avatar size="sm">
          <Avatar.Image alt="Абаева Д." src={AW(44)} />
          <Avatar.Fallback>А</Avatar.Fallback>
        </Avatar>
        <span className="leading-tight">
          <span className="block text-[13px] font-semibold">Абаева Д.</span>
          <span className="block text-[11px] text-neutral-500">Администратор Федерации</span>
        </span>
      </span>
    </div>
  </Frag>
);

const Dash1_1States = () => (
  <States>
    <Shot
      tone="success"
      title="Всё разобрано"
      text="Зона «Требует внимания» пустая, с подписью «всё в порядке»."
    >
      <Frag>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Требует внимания
          </span>
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[13px]">
            <b className="tabular-nums">0</b> нерешённых дел
          </span>
        </div>
        <EmptyBox
          title="Всё в порядке"
          text="Нерешённых дел по календарю нет. Счётчики вернутся, как только появится турнир без судьи или зависшая заявка."
        />
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Межсезонье"
      text="Вместо ближайших стартов — приглашение завести сезон, «Сегодня идут» пустая."
    >
      <Frag>
        <div className="grid gap-3">
          <EmptyBox
            title="Сезон 2027 ещё не заведён"
            text="Календарь сезона пуст: заведите первое соревнование или скопируйте прошлогодний календарь."
          />
          <TodayEmpty />
        </div>
      </Frag>
    </Shot>
  </States>
);

/** Очередь дел на телефоне ✳: те же счётчики и те же строки (`ATTENTION`), но
    строка идёт этажами. У десктопной три колонки — что за дело, кто его
    снимает и почему оно горит; в 392 px каждая получает по сотне пикселей, и
    «подано 4 заявки судей, решения нет» превращается в столбик из слогов. */
const AttnPhone = () => {
  const [open, setOpen] = useState(ATTENTION[0].t);
  const cur = ATTENTION.find((a) => a.t === open);
  /* Строк столько же, сколько на десктопной панели: панель должна помещаться в
     кадр вместе с тем, что под ней, а весь список открывается в календаре. */
  const max = 2;
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Требует внимания
      </div>
      <Swipe>
        <div className="flex gap-2 pb-2">
          {ATTENTION.map((a) => (
            <button
              key={a.t}
              type="button"
              aria-expanded={a.t === open}
              onClick={() => setOpen(a.t)}
              className={
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ' +
                (a.t === open
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-neutral-200 bg-white text-neutral-700')
              }
            >
              <b className="tabular-nums">{a.n}</b> {a.t}
            </button>
          ))}
        </div>
      </Swipe>
      {cur && (
        <Rows>
          {cur.rows.slice(0, max).map((r) => (
            <div key={r.nm} data-to={r.to} data-row className="px-4 py-2.5">
              <div className="text-[13.5px] font-medium leading-tight">{r.nm}</div>
              <div className="mt-0.5 text-xs leading-snug text-neutral-500">{r.mt}</div>
              <div className={'mt-1 text-xs font-medium leading-snug ' + (r.cls ? 'text-red-600' : 'text-neutral-600')}>
                {r.why}
              </div>
              <div className="mt-0.5 text-[11px] text-neutral-400">снимает: {r.who}</div>
            </div>
          ))}
          <div className="bg-neutral-50 px-4 py-1.5 text-[11px] text-neutral-400">
            Строка ведёт туда, где дело снимается · показаны {max} из {cur.n}
          </div>
        </Rows>
      )}
    </div>
  );
};

/** Панель Федерации на телефоне ✳. */
const Dash1_1Phone = () => (
  <PhoneRoleApp role={R01} nav="Панель" title="Панель Федерации" sub="Сезон 2026 · 15 апреля">
    {/* Плиток показателей на телефоне нет: четыре крупных числа занимают
        полкадра и выдавливают очередь дел под сгиб — а с телефона панель
        открывают ради неё. Те же четыре числа стоят строкой фактов. */}
    <div className="mb-4">
      <Facts items={KPI.map((k) => ({ k: k.k, v: k.v }))} />
    </div>
    <AttnPhone />
    {/* Главное действие экрана — во всю ширину: на телефоне кнопка в ряду со
        счётчиками ужалась бы до иконки. Подпись та же, что на десктопе. */}
    <div className="mb-4">
      <Button className="w-full" variant="primary">
        <Plus size={15} /> Завести соревнование
      </Button>
    </div>
    <Panel title="Сегодня идут">
      <TodayRows phone />
    </Panel>
    <Panel
      title="Ближайшие старты"
      extra={<span className="text-xs text-neutral-500">ещё {UPCOMING.length - 1}</span>}
      flush
    >
      {UPCOMING.slice(0, 1).map((t) => (
        <TourPhoneRow key={t.nm} t={t} />
      ))}
    </Panel>
  </PhoneRoleApp>
);

/* ── Э1.2 · Календарь сезона ───────────────────────────────────── */

/** Переключатель категорий и сколько в каждой стартов за сезон.

    Числа — из ROLES.md: восемь главных стартов, четыре тура Лиги, остальное
    ОРТ. Подпись у каждой своя, а не «N соревнований» через плюрализацию:
    категории считаются разным («тур», «старт»), и склеивать их незачем. */
const CATS: { k: 'Все категории' | Cat; sub: string }[] = [
  { k: 'Все категории', sub: '32 соревнования' },
  { k: 'Главный старт', sub: '8 главных стартов' },
  { k: 'Лига', sub: '4 тура Евразийской лиги' },
  { k: 'ОРТ', sub: '20 открытых республиканских' },
];

/* ── Тот же сезон календарём ─────────────────────────────────────
   Раньше вторым видом стояла своя сетка из двенадцати плиток, где турнир был
   строкой «числа + название»: трёхдневный старт в ней выглядел так же, как
   однодневный, а наложение двух стартов приходилось вычитывать глазами. Место
   занял календарь кита (`kit/hero/app/calendar`): турнир рисуется ПОЛОСОЙ через
   все свои дни, и столкновение видно сразу. Год при этом не потерян — его
   держит полоса месяцев над сеткой. */

/** Состояние турнира → тон события календаря. Язык тот же, что у значка в
    строке списка (`PC`): одно состояние не может называться в списке одним
    цветом, а в календаре другим. */
const CAL_TONE: Record<Cls, CalTone> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'neutral',
};

/** Дата сезона в формате календаря — 'ГГГГ-ММ-ДД'. В `TOURS` она намеренно
    разобрана на месяц и числа («14–16»): по строке показа не фильтруют. Сборка
    ISO живёт здесь, рядом с календарём, а не в данных. */
const isoDay = (m: number, d: number) =>
  `2026-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Сегодня в макете — 15 апреля 2026 (см. шапку файла). */
const TODAY = isoDay(NOW_M, 15);

/** Турнир → событие календаря. Переход тот же, что у строки списка: карточка
    турнира. Числа «14–16» разбираются на первый и последний день — однодневный
    старт остаётся без `till`. */
const toEvent = (t: Tour): CalEvent => {
  const [a, b] = t.d.split(/[–—-]/).map((s) => Number(s.trim()));
  return {
    id: t.nm,
    nm: t.nm,
    from: isoDay(t.m, a),
    till: b && b !== a ? isoDay(t.m, b) : undefined,
    tone: CAL_TONE[t.cls],
    sub: `${t.cat} · ${t.city}`,
    to: 'Э1.3',
  };
};

/** Турнир → строка ленты (телефонный вид календаря). Событие то же самое —
    `toEvent`, — к нему добавлен значок состояния: в сетке месяца состояние
    несёт цвет полосы с легендой рядом, а в ленте цвета мало, у карточки есть
    правый край, и подписать состояние словом дешевле, чем объяснять цвет. */
const toTimeline = (t: Tour): TimelineItem => ({
  ...toEvent(t),
  right: <P t={t.st} cls={t.cls} />,
});

/** День недели словом: «15 апреля» без него читается как дата из документа, а
    не как день календаря. Считаем в UTC — как кит, иначе день съедет. */
const DOW = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const dowOf = (day: string) => DOW[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];

/** Полоса месяцев: сезон длиной в год, а календарь показывает один месяц.
    Из апреля не видно, что в июне стартов пять, а в августе два, — полоса
    отвечает ровно на это и заменяет прежние двенадцать плиток. Пустой месяц
    остаётся видимым с прочерком: дыра в календаре тоже информация. */
const MonthStrip = ({ counts, m, onPick }: { counts: number[]; m: number; onPick: (i: number) => void }) => (
  <div className="mb-2 grid grid-cols-12 gap-1">
    {MONTHS.map((nm, i) => (
      <button
        key={nm}
        type="button"
        aria-selected={i === m}
        onClick={() => onPick(i)}
        title={`${nm} 2026 · ${counts[i] ? `стартов: ${counts[i]}` : 'стартов нет'}`}
        className={
          'flex items-baseline justify-center gap-1 rounded-lg border px-1 py-1 text-[11.5px] leading-none ' +
          (i === m
            ? 'border-blue-300 bg-blue-50 font-semibold text-blue-800'
            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300') +
          /* Текущий месяц отмечен даже когда смотрят другой: «где мы сейчас» —
             это не то же самое, что «на что смотрим». */
          (i === NOW_M && i !== m ? ' ring-1 ring-blue-200' : '')
        }
      >
        {nm.slice(0, 3)}
        <span className={'text-[10px] tabular-nums ' + (counts[i] ? 'text-neutral-500' : 'text-neutral-300')}>
          {counts[i] || '—'}
        </span>
      </button>
    ))}
  </div>
);

/** Что означает цвет полосы. В сетке цвет — единственная подпись состояния, а
    цвет без легенды остаётся просто цветом. Стоит в левой колонке: в главной
    всю высоту занимает месяц. */
const CalLegend = () => (
  <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[11.5px] text-neutral-500">
    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
      Цвет полосы — состояние
    </div>
    {[
      ['bg-green-500', 'идёт или принимает заявки'],
      ['bg-amber-500', 'ждёт судью'],
      ['bg-blue-500', 'судья назначен'],
      ['bg-neutral-400', 'черновик или завершён'],
    ].map(([dot, txt]) => (
      <div key={txt} className="flex items-center gap-2 leading-relaxed">
        <span className={'h-2 w-2 shrink-0 rounded-full ' + dot} />
        {txt}
      </div>
    ))}
    <div className="mt-1.5 text-[11px] text-neutral-400">
      Полоса идёт через все дни турнира, а не только через первый.
    </div>
  </div>
);

/** Календарь сезона: месяц с полосами турниров, слева — мини-месяц, список
    выбранного дня и легенда. Мини-месяц и сетка выбирают один и тот же день:
    два календаря рядом, показывающие разное, — это не сайдбар, а вторая
    правда. */
const SeasonCalendar = ({ rows }: { rows: Tour[] }) => {
  const [m, setM] = useState(NOW_M);
  const [day, setDay] = useState(TODAY);
  const events = rows.map(toEvent);
  const counts = MONTHS.map((_, i) => rows.filter((t) => t.m === i).length);
  const month = isoDay(m, 1);
  /* Список дня: события, которые этот день накрывают, — многодневный турнир
     стоит в каждом своём дне, а не только в первом. */
  const inDay = events.filter((e) => e.from <= day && day <= (e.till ?? e.from));
  /* Смена месяца уводит и выбранный день: сетка показывала бы июнь, а список
     рядом — апрельский день. В свой месяц возвращаемся на сегодня. */
  const pickMonth = (i: number) => {
    setM(i);
    setDay(i === NOW_M ? TODAY : isoDay(i, 1));
  };
  return (
    <div className="flex gap-4">
      <div className="flex w-56 shrink-0 flex-col gap-3">
        <MiniMonth month={month} events={events} today={TODAY} selected={day} onPick={setDay} />
        <DayList
          title={`${dateWords(day)}, ${dowOf(day)}`}
          items={inDay.map((e) => ({
            id: e.id,
            /* Времени у турнира в календаре сезона нет и быть не должно: часы
               появляются в расписании игрового дня, а здесь старт занимает день
               целиком. */
            t: 'весь день',
            nm: e.nm,
            sub: e.sub,
            tone: e.tone,
            to: e.to,
          }))}
        />
        <CalLegend />
      </div>
      <div className="min-w-0 flex-1">
        <MonthStrip counts={counts} m={m} onPick={pickMonth} />
        <MonthGrid month={month} events={events} today={TODAY} selected={day} onPick={setDay} />
      </div>
    </div>
  );
};

/* Второй вид называется «Календарь», а не «Сетка месяцев»: сеткой месяцев были
   двенадцать плиток, а теперь это настоящий календарь. ⚠ В `flows/` и в данных
   роли вид пока назван по-старому — расхождение вынесено в отчёт. */
const VIEWS = ['Список', 'Календарь'] as const;

/** Фильтр строки фильтров: подпись и значение одной кнопкой. Отдельной
    подписью сверху (как у поля формы) строка вырастала вдвое, а это не ввод, а
    сужение списка. Выбор статичный — порталов в макетах нет. */
const FilterPick = ({ k, v }: { k: string; v: string }) => (
  <button
    type="button"
    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[13px]"
  >
    <span className="text-neutral-500">{k}</span>
    <span className="font-medium">{v}</span>
    <ChevronDown size={13} className="text-neutral-400" />
  </button>
);

/** Остальные фильтры зоны «Фильтры и поиск»: пол, возраст, город, состояние.
    Стоят рядом с поиском и действуют на оба вида — и на список, и на сетку
    месяцев. Значения по умолчанию — «не сужаем», поэтому в макете список полон. */
const CAL_FILTERS: [string, string][] = [
  ['Пол', 'любой'],
  ['Возраст', 'любой'],
  ['Город', 'все'],
  ['Состояние', 'любое'],
];

/** Сузить календарь категорией и строкой поиска.

    Одна функция на оба формата ✳: если бы список на десктопе и на телефоне
    фильтровался двумя копиями этих трёх строк, они бы разошлись — и один и тот
    же запрос показал бы разное. Поиск по названию и по городу: в календаре
    спрашивают и «где Кубок Иртыша», и «что у нас в Шымкенте». */
const narrow = (cat: 'Все категории' | Cat, q: string) => {
  const t = q.trim().toLowerCase();
  const inCat = cat === 'Все категории' ? TOURS : TOURS.filter((x) => x.cat === cat);
  return {
    inCat,
    rows: t
      ? inCat.filter((x) => x.nm.toLowerCase().includes(t) || x.city.toLowerCase().includes(t))
      : inCat,
  };
};

export function Cal1_2(_props: { variant?: 'desktop' | 'land' } = {}) {
  const [cat, setCat] = useState<'Все категории' | Cat>('Все категории');
  const [view, setView] = useState<(typeof VIEWS)[number]>('Список');
  /* Поиск по названию — живой: фильтр обязан фильтровать, иначе это картинка
     поля, а не поле. */
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const { inCat, rows } = narrow(cat, q);
  return (
    <WebApp
      role={R01}
      nav="Календарь"
      title="Календарь сезона"
      sub={`Сезон 2026 · ${CATS.find((c) => c.k === cat)!.sub}`}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg items={CATS.map((c) => c.k)} active={cat} onPick={(v) => setCat(v as typeof cat)} />
        <FilterSeg items={[...VIEWS]} active={view} onPick={(v) => setView(v as typeof view)} />
      </div>
      {/* Поиск и остальные фильтры — одной полосой: это одно действие, «сузить
          календарь», и разводить его по трём рядам незачем. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Название соревнования" className="w-60" />
        {CAL_FILTERS.map(([k, v]) => (
          <FilterPick key={k} k={k} v={v} />
        ))}
        {/* Счёт — только при поиске: сколько всего в категории, уже написано в
            подзаголовке экрана, и второй раз это не число, а шум. */}
        {t && (
          <span className="ml-auto whitespace-nowrap text-[12.5px] text-neutral-500">
            найдено {rows.length} из {inCat.length}
          </span>
        )}
      </div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <Btn>
          {/* Формат назван на кнопке: «выгрузить» без формата — обещание,
              под которым человек ждёт свой Excel, а получает csv. */}
          <FileSpreadsheet size={14} /> Выгрузить в Excel
        </Btn>
        <Button variant="primary">
          <Plus size={15} /> Завести соревнование
        </Button>
      </div>
      {!rows.length ? (
        <EmptyBox
          title={t ? `По запросу «${q}» ничего не нашлось` : `В категории «${cat}» соревнований нет`}
          text={
            t
              ? 'Проверьте написание названия или снимите фильтр категории.'
              : 'Смените категорию или заведите первое соревнование в этой категории.'
          }
        />
      ) : view === 'Список' ? (
        <Rows>
          {rows.map((x) => (
            <TourRow key={x.nm} t={x} judge />
          ))}
        </Rows>
      ) : (
        <SeasonCalendar rows={rows} />
      )}
    </WebApp>
  );
}

/** Календарный вид Э1.2 врезкой ✳. На самом экране список и календарь
    переключаются, и по умолчанию открыт список — на борде календарь не был
    виден вовсе, хотя ради него и заводился второй вид: полоса через все дни
    турнира, наложение стартов, мини-месяц с днём. Кадр — тот же экран, открытый
    на календаре, с той же выборкой, что стоит по умолчанию (весь сезон, без
    фильтров и поиска).

    Ширина кадра — рабочая область оболочки: 1200 ноутбука минус сайдбар (212) и
    поля (2×24). Уже — и месяц раскладывается не так, как его увидят. */
const Cal1_2Also = () => (
  <Also cap="Вид «Календарь» — тот же сезон полосами по дням">
    <Frag w={940}>
      <SeasonCalendar rows={TOURS} />
    </Frag>
  </Also>
);

/** Тот же сезон на телефоне ✳: мини-месяц, день и лента.

    Сетку месяца в 392 px не развернуть: семь колонок дают клетку в полсотни
    пикселей, полоса турнира в ней остаётся цветным штрихом без подписи, а
    ради подписи и длительности сетка и заводилась. Поэтому на телефоне
    календарь собран из двух вещей: мини-месяц отвечает на «какие дни заняты»
    (и выбирает день — список под ним тот же, что на десктопе), а лента — на
    «что дальше по порядку»: дата слева, карточка справа, месяцы разделены.

    Полоса месяцев сезона на телефон не переезжает: двенадцать кнопок по
    тридцать пикселей нажимать нечем. Её работу — «где в году густо, где
    пусто» — делает сама лента: она идёт через весь сезон с заголовками
    месяцев, и пустой месяц в ней виден тем, что его заголовка нет. */
const SeasonPhoneCalendar = ({ rows }: { rows: Tour[] }) => {
  const [day, setDay] = useState(TODAY);
  const events = rows.map(toEvent);
  const inDay = events.filter((e) => e.from <= day && day <= (e.till ?? e.from));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center rounded-xl border border-neutral-200 bg-white p-3">
        <MiniMonth month={isoDay(NOW_M, 1)} events={events} today={TODAY} selected={day} onPick={setDay} />
      </div>
      <DayList
        title={`${dateWords(day)}, ${dowOf(day)}`}
        items={inDay.map((e) => ({ id: e.id, t: 'весь день', nm: e.nm, sub: e.sub, tone: e.tone, to: e.to }))}
      />
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Весь сезон лентой
        </div>
        <EventTimeline items={rows.map(toTimeline)} today={TODAY} />
      </div>
    </div>
  );
};

/** Календарь сезона на телефоне ✳.

    Кадр открыт на виде «Календарь», а не на списке, как десктопный: список на
    телефоне — те же строки, что видны в кадре над ним, а лента с мини-месяцем
    — единственное место, где узкий экран устроен иначе. Переключатель рабочий:
    «Список» рядом. */
const Cal1_2Phone = () => {
  const [cat, setCat] = useState<'Все категории' | Cat>('Все категории');
  const [view, setView] = useState<(typeof VIEWS)[number]>('Календарь');
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const { inCat, rows } = narrow(cat, q);
  return (
    <PhoneRoleApp
      role={R01}
      nav="Календарь"
      title="Календарь сезона"
      sub={`Сезон 2026 · ${CATS.find((c) => c.k === cat)!.sub}`}
    >
      {/* Ряды «фильтр + поиск + кнопка» идут друг под другом: в одну строку на
          телефоне не встают ни два переключателя, ни поиск с кнопкой. */}
      <div className="mb-2">
        <Swipe>
          <FilterSeg items={CATS.map((c) => c.k)} active={cat} onPick={(v) => setCat(v as typeof cat)} />
        </Swipe>
      </div>
      <div className="mb-2">
        <FilterSeg items={[...VIEWS]} active={view} onPick={(v) => setView(v as typeof view)} />
      </div>
      <div className="mb-2">
        <SearchInput value={q} onChange={setQ} placeholder="Название соревнования" className="w-full" />
      </div>
      <div className="mb-3">
        <Swipe>
          <div className="flex gap-2 pb-1">
            {CAL_FILTERS.map(([k, v]) => (
              <FilterPick key={k} k={k} v={v} />
            ))}
          </div>
        </Swipe>
      </div>
      {t && (
        <div className="mb-3 text-[12.5px] text-neutral-500">
          найдено {rows.length} из {inCat.length}
        </div>
      )}
      <div className="mb-4 flex flex-col gap-2">
        <Button className="w-full" variant="primary">
          <Plus size={15} /> Завести соревнование
        </Button>
        <Button className="w-full" size="sm" variant="outline">
          <FileSpreadsheet size={14} /> Выгрузить в Excel
        </Button>
      </div>
      {!rows.length ? (
        <EmptyBox
          title={t ? `По запросу «${q}» ничего не нашлось` : `В категории «${cat}» соревнований нет`}
          text={
            t
              ? 'Проверьте написание названия или снимите фильтр категории.'
              : 'Смените категорию или заведите первое соревнование в этой категории.'
          }
        />
      ) : view === 'Список' ? (
        <Rows>
          {rows.map((x) => (
            <TourPhoneRow key={x.nm} t={x} />
          ))}
        </Rows>
      ) : (
        <SeasonPhoneCalendar rows={rows} />
      )}
    </PhoneRoleApp>
  );
};

const Cal1_2States = () => (
  <States>
    <Shot tone="info" title="Пустой сезон" text="Приглашение завести первое соревнование." wide>
      <Frag>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-neutral-500">0 соревнований · сезон 2027</span>
          <Button variant="primary">
            <Plus size={15} /> Завести соревнование
          </Button>
        </div>
        <EmptyBox
          title="В сезоне 2027 соревнований нет"
          text="Календарь наполняется по мере заведения: главные старты, туры Евразийской лиги, открытые республиканские турниры."
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.4 · Форма «Завести соревнование» ───────────────────────── */

/* Мастер в два шага: категория и основное. Допуск, флаги и столы задаются не
   при заведении, а в регламенте — турнир создаётся «Черновиком», и регламент у
   него правится на карточке (Э1.3). Держать их в мастере значило спрашивать всё
   сразу там, где достаточно назвать турнир и поставить даты. */
const STEPS = ['1 · Категория', '2 · Основное'];

/** Выбор категории на первом шаге. Категория — единственное, от чего зависят
    остальные шаги (TZ §4.1), поэтому выбирают её карточками, а не строкой
    списка: рядом с названием видно, чем категории отличаются. */
const CAT_PICK: { k: Cat; sub: string }[] = [
  { k: 'Главный старт', sub: '8 стартов календаря · заявляет регион' },
  { k: 'Лига', sub: 'Командная · 4 тура · заявляет клуб' },
  { k: 'ОРТ', sub: 'Спортсмен заявляется сам' },
];

const CatPick = ({ one }: { one?: boolean } = {}) => {
  const [cat, setCat] = useState<Cat>('Главный старт');
  return (
    /* На телефоне карточки идут в столбик: в трети от 392 px от подписи
       категории остаётся одно слово, а выбирают её по второй строке. */
    <div className={one ? 'grid gap-3' : 'grid grid-cols-3 gap-3'}>
      {CAT_PICK.map((c) => (
        <button
          key={c.k}
          type="button"
          aria-selected={c.k === cat}
          onClick={() => setCat(c.k)}
          className={
            'rounded-xl border bg-white p-4 text-left shadow-sm ' +
            (c.k === cat ? 'border-blue-400 ring-1 ring-blue-200' : 'border-neutral-200 hover:border-neutral-300')
          }
        >
          <span className="flex items-center justify-between gap-2 text-[13.5px] font-semibold">
            {c.k === 'Лига' ? 'Евразийская лига' : c.k}
            {c.k === cat && <Pill t="ВЫБРАНО" color="success" />}
          </span>
          <span className="mt-1 block text-xs text-neutral-500">{c.sub}</span>
        </button>
      ))}
    </div>
  );
};

const RANKS = ['Одиночный · парный', 'Одиночный', 'Парный'];

/* Тело каждого шага. На втором — не «дальше», а «Создать»: турнир заводится в
   состоянии «Черновик» и открывается его карточка (Э1.3), где ему и задают
   регламент. */
const STEP_BODY: Record<number, (phone?: boolean) => ReactNode> = {
  1: (phone) => <CatPick one={phone} />,
  2: (phone) => (
    <Panel title="Основное">
      {/* На телефоне поля идут в одну колонку (`wide` каждому): в половине от
          392 px «12–14 сентября 2026» не помещается в поле целиком. */}
      <FormGrid>
        <TextInput label="Название" value="Первенство РК · 2012 г.р. и моложе" wide />
        <TextInput label="Город" value="Актобе · ДС «Коктем»" wide={phone} />
        <TextInput label="Окно дат" value="12–14 сентября 2026" placeholder="дд–дд месяц гггг" wide={phone} />
        <PickField label="Разряды" value={RANKS[0]} wide={phone} />
        {/* Сезон не выбирают: он следует из окна дат. */}
        <Derived k="Сезон" v="2026" />
      </FormGrid>
    </Panel>
  ),
};

/* Подпись главной кнопки называет, куда ведёт шаг: «дальше — то-то» отдельной
   строкой повторяло ровно это. */
const STEP_BTN: Record<number, string> = {
  1: 'Дальше · основное',
  2: 'Создать',
};

export function New1_4() {
  const [step, setStep] = useState(1);
  return (
    <WebApp
      role={R01}
      nav="Календарь"
      title="Завести соревнование"
      back={{ label: 'Календарь сезона', to: 'Э1.2' }}
      sub="Только название и даты: остальное дозаполняется в карточке черновика"
    >
      {/* Полоса шагов сверху, текущий подсвечен, по ним можно листать: мастер —
          один экран, который листается, а не пять кадров подряд. */}
      <div className="mb-4">
        <FilterSeg items={STEPS} active={STEPS[step - 1]} onPick={(s) => setStep(STEPS.indexOf(s) + 1)} />
      </div>
      {STEP_BODY[step]()}
      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          data-to={step === 2 ? 'Э1.3' : undefined}
          onPress={() => setStep(Math.min(2, step + 1))}
        >
          {STEP_BTN[step]}
        </Button>
      </div>
    </WebApp>
  );
}

/** Мастер заведения на телефоне ✳: та же полоса шагов и то же тело шага, но
    карточки категорий и поля формы идут в одну колонку. */
const New1_4Phone = () => {
  const [step, setStep] = useState(1);
  return (
    <PhoneRoleApp
      role={R01}
      nav="Календарь"
      title="Завести соревнование"
      back={{ label: 'Календарь сезона', to: 'Э1.2' }}
      sub="Только название и даты: остальное дозаполняется в карточке черновика"
    >
      <div className="mb-4">
        <FilterSeg items={STEPS} active={STEPS[step - 1]} onPick={(s) => setStep(STEPS.indexOf(s) + 1)} />
      </div>
      {STEP_BODY[step](true)}
      <div className="mt-4">
        <Button
          className="w-full"
          variant="primary"
          data-to={step === 2 ? 'Э1.3' : undefined}
          onPress={() => setStep(Math.min(2, step + 1))}
        >
          {STEP_BTN[step]}
        </Button>
      </div>
    </PhoneRoleApp>
  );
};

const New1_4States = () => (
  <States>
    <Shot
      tone="danger"
      title="Обязательные поля не заполнены"
      text="«Создать» неактивна, с пояснением."
      wide
    >
      <Frag w={520}>
        <FormGrid>
          <FieldView label="Название" value="Первенство РК · 2012 г.р. и моложе" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Окно дат</span>
            <span className="w-full rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
              — не выбрано
            </span>
          </div>
        </FormGrid>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-medium text-amber-700">
            Заполните обязательное поле «Окно дат» — без него соревнование не создать
          </span>
          <DisabledAction>Создать</DisabledAction>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.3 · Карточка турнира ───────────────────────────────────── */

/** Разделы карточки турнира — один ряд, и он идёт **по ходу турнира**: сначала
    его заводят, потом набирают судей, потом игроков, потом строят сетку и
    расписание. У каждого шага ровно одно, на что смотрят. `NOW_STAGE` — где
    турнир сейчас: пройденное читается спокойнее. */
const SECTIONS = [
  'Черновик', 'Заявки судей', 'Заявки игроков', 'Участники', 'Группы', 'Сетка', 'Расписание',
];
const NOW_STAGE = 'Заявки судей';

/** Ряд разделов: пройденное тише, текущее — акцентом.

    `scroll` — телефонный кадр: семь разделов в 392 px ломаются на три ряда, и
    ход турнира по ним больше не читается (а он в этом ряду и есть смысл).
    Прокручиваем вбок одной строкой, как вкладки в мобильном приложении. */
const SectionRow = ({
  on,
  onPick,
  scroll,
}: {
  on: string;
  onPick?: (s: string) => void;
  scroll?: boolean;
}) => {
  const at = SECTIONS.indexOf(NOW_STAGE);
  const row = (
    <div className={'flex items-center gap-1 ' + (scroll ? 'w-max' : 'mb-4 flex-wrap')}>
      {SECTIONS.map((s, i) => (
        <Fragment key={s}>
          {i > 0 && <ChevronRight size={12} className="shrink-0 text-neutral-300" />}
          <button
            type="button"
            aria-selected={s === on}
            onClick={onPick ? () => onPick(s) : undefined}
            className={
              'shrink-0 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium ' +
              (s === on
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : i < at
                  ? 'border-transparent text-neutral-400 hover:bg-neutral-100'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300')
            }
          >
            {s}
          </button>
        </Fragment>
      ))}
    </div>
  );
  return scroll ? <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1">{row}</div> : row;
};

const FORMATS = ['Олимпийская с группами', 'Олимпийская', 'Круговая', 'Швейцарская'];
const AGE_LIMITS = ['без ограничения', '2012 г.р. и моложе', '2010 г.р. и моложе', '2008 г.р. и моложе'];

/** Флаги допуска (§4.2) — тумблер и название, без пояснений: каждый называет
    себя сам. Ценз стоит только здесь: раньше он был и селектором с порогом, и
    флагом, то есть спрашивался дважды. */
const FLAGS = ['Годовой взнос федерации', 'Документы к заявке', 'Ценз по рейтингу'];

/** Регламент в три колонки ✳: панели «Действия по турниру» рядом нет, и её
    ширину забрал сам регламент — поля идут по трое в ряд, а не по двое в
    половине панели. Своя сетка, а не `FormGrid` кита: тот прибит к двум
    колонкам и к `max-w-2xl`, и в нём регламент занимал полпанели. */
const RulesGrid = ({ phone, children }: { phone?: boolean; children: ReactNode }) => (
  /* На телефоне регламент идёт в одну колонку: треть от 392 px — это поле, в
     которое не влезает ни «Астана · ДС «Барыс»», ни «Олимпийская с группами». */
  <div className={phone ? 'grid gap-3.5' : 'grid max-w-5xl grid-cols-3 gap-x-4 gap-y-3.5'}>{children}</div>
);

/** Регламент турнира. В черновике он правится прямо здесь — это единственное
    место, где у турнира задаются даты, формат, столы и условия допуска: из
    мастера заведения их убрали, там остались только название и даты.

    `edit` — редактируемый вид; он же подложка диалога отмены (Э1.9) в виде
    только для чтения. */
const TourRules = ({ edit, phone }: { edit?: boolean; phone?: boolean }) =>
  edit ? (
    <RulesGrid phone={phone}>
      <TextInput label="Даты" value="18–20 мая 2026" />
      <TextInput label="Город" value="Астана · ДС «Барыс»" />
      <PickField label="Разряды" value={RANKS[0]} />
      <PickField label="Формат" value={FORMATS[0]} />
      <TextInput label="Столов" value="16" />
      <TextInput label="Трансляция со столов" value="1–4" />
      <PickField label="Возрастная граница" value={AGE_LIMITS[0]} />
      {/* Три флага — простым списком, без рамок и подписей: каждый называет
          себя сам, а обведённые строки читались как три отдельных блока. */}
      <div className={'flex flex-col gap-1' + (phone ? '' : ' col-span-3')}>
        <span className="text-xs font-medium text-neutral-500">Условия допуска</span>
        <div className={phone ? 'grid gap-1.5' : 'grid grid-cols-3 gap-1.5'}>
          {FLAGS.map((f) => (
            <Flag key={f} label={f} on={f !== 'Ценз по рейтингу'} />
          ))}
        </div>
      </div>
    </RulesGrid>
  ) : (
    <RulesGrid phone={phone}>
      <FieldView label="Даты" value="18–20 мая 2026" />
      <FieldView label="Город" value="Астана · ДС «Барыс»" />
      <FieldView label="Разряды" value="Одиночный · парный" />
      <FieldView label="Формат" value="Олимпийская с группами" />
      <FieldView label="Столов" value="16 · трансляция со столов 1–4" />
      <FieldView label="Возрастная граница" value="без ограничения" />
      {/* Обёртка на всю ширину: `wide` у поля кита — это `col-span-2`, то есть
          две трети ряда, а условия допуска идут строкой под остальными. */}
      <div className={phone ? undefined : 'col-span-3'}>
        <FieldView
          label="Условия допуска"
          value="годовой взнос обязателен · документы к заявке обязательны · ценз по рейтингу не требуется"
        />
      </div>
    </RulesGrid>
  );

/* ── Наряд турнира ──────────────────────────────────────────────── */

const JUDGES = [
  { av: A(76), nm: 'Оспанов Тимур', sub: 'Национальная категория · Астана · рейтинг 27,5' },
  { av: AW(65), nm: 'Абдрахманова Сауле', sub: 'Первая категория · Караганда · рейтинг 12,5' },
  { av: A(13), nm: 'Пак Сергей', sub: 'Первая категория · Павлодар · рейтинг 18' },
  { av: A(19), nm: 'Цой Виктор', sub: 'Первая категория · Караганда · рейтинг 9,5' },
  { av: A(22), nm: 'Жумабеков Расул', sub: 'Судья по спорту · Караганда · рейтинг 7' },
  { av: AW(32), nm: 'Абдрахманова Айгерим', sub: 'Вторая категория · Астана · категория не подтверждена' },
];

/** Наряд: у каждой заявки три места, и они не равнозначны.

    Главный судья и секретарь на турнире **по одному** — это не независимые
    переключатели: назначил другого, прежний освободился. Судей столов много,
    их место включается и выключается само по себе.

    Поэтому три кнопки в ряд, одинаковые в каждой строке: колонка читается
    сверху вниз, и видно, кто на что поставлен, без вчитывания. */
const JudgeApps = ({ phone }: { phone?: boolean } = {}) => {
  const [chief, setChief] = useState('Оспанов Тимур');
  const [sec, setSec] = useState('Абдрахманова Сауле');
  const [tables, setTables] = useState<string[]>(['Пак Сергей', 'Цой Виктор']);
  /* Место в наряде у человека одно: главный судья не стоит заодно на столе, а
     секретарь не ведёт счёт. Поэтому назначение снимает предыдущее место — и у
     того, кто его занимал, и у самого назначенного. */
  const free = (nm: string) => setTables((t) => t.filter((x) => x !== nm));
  const pickChief = (nm: string) => {
    if (chief === nm) return setChief('');
    setChief(nm);
    if (sec === nm) setSec('');
    free(nm);
  };
  const pickSec = (nm: string) => {
    if (sec === nm) return setSec('');
    setSec(nm);
    if (chief === nm) setChief('');
    free(nm);
  };
  const pickTable = (nm: string) => {
    if (tables.includes(nm)) return free(nm);
    setTables([...tables, nm]);
    if (chief === nm) setChief('');
    if (sec === nm) setSec('');
  };
  const named = [chief, sec, ...tables].filter(Boolean).length;
  const SEATS: { t: string; on: (nm: string) => boolean; pick: (nm: string) => void }[] = [
    { t: 'Главный', on: (nm) => chief === nm, pick: pickChief },
    { t: 'Секретарь', on: (nm) => sec === nm, pick: pickSec },
    { t: 'Стол', on: (nm) => tables.includes(nm), pick: pickTable },
  ];
  return (
    <Panel
      title="Заявки на судейство"
      extra={<span className="text-xs text-neutral-500">{JUDGES.length} подано · {named} в наряде</span>}
      flush
    >
      <div className="divide-y divide-neutral-100">
        {JUDGES.map((j) => (
          /* На телефоне место в наряде переезжает под имя и растягивается на
             всю ширину: рядом с фамилией и категорией три кнопки не помещаются,
             а нажимать их приходится пальцем. */
          <div
            key={j.nm}
            className={'flex px-4 py-2.5 ' + (phone ? 'flex-col gap-2' : 'items-center gap-3')}
          >
            <Who av={j.av} nm={j.nm} sub={j.sub} />
            <span
              className={
                'flex overflow-hidden rounded-lg border border-neutral-200 ' + (phone ? 'w-full' : 'ml-auto')
              }
            >
              {SEATS.map((s, i) => (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => s.pick(j.nm)}
                  className={
                    'px-2.5 py-1 text-[11.5px] font-medium ' +
                    (phone ? 'flex-1 py-1.5 ' : '') +
                    (s.on(j.nm) ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-100') +
                    (i > 0 ? ' border-l border-neutral-200' : '')
                  }
                >
                  {s.t}
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ── Заявки участников ──────────────────────────────────────────── */

const PLAYERS = [
  { av: A(32), nm: 'Смагулов Алан', sub: 'Алматы · «Алатау» · КМС · рейтинг 2456 · взнос оплачен', v: 1 },
  { av: A(44), nm: 'Ким Георгий', sub: 'Астана · СКА · МС · рейтинг 2401 · взнос оплачен', v: 1 },
  { av: A(75), nm: 'Ерлан Бекзат', sub: 'Актобе · спортшкола №3 · рейтинг 2105 · взнос оплачен', v: 1 },
  { av: A(22), nm: 'Жумабеков Расул', sub: 'Караганда · «Шахтёр» · взнос не оплачен', v: -1 },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: 'Шымкент · «Достык» · ждёт решения 9 дней', v: 0 },
];

/** Решение по заявке — галочка и крестик, а не значок со словом.

    У решения три состояния, и «без решения» из них — не третья кнопка, а то,
    что получается, когда не нажата ни одна. Нажал галочку — принята, крестик —
    отклонена, нажал ещё раз — решение снято. Так видно и что решено, и что
    решение можно поменять; значок со словом только называл исход. */
const PlayerApps = ({ phone }: { phone?: boolean } = {}) => {
  const [v, setV] = useState<Record<string, number>>(
    Object.fromEntries(PLAYERS.map((p) => [p.nm, p.v])),
  );
  const set = (nm: string, n: number) => setV({ ...v, [nm]: v[nm] === n ? 0 : n });
  const yes = Object.values(v).filter((x) => x === 1).length;
  return (
    <Panel
      title="Заявки участников"
      extra={<span className="text-xs text-neutral-500">{PLAYERS.length} подано · {yes} принято</span>}
      flush
    >
      <div className="divide-y divide-neutral-100">
        {PLAYERS.map((p) => (
          /* На телефоне решение переезжает под имя: подпись заявки («взнос не
             оплачен», «ждёт решения 9 дней») — это то, из-за чего решение и
             принимают, и резать её ради двух кнопок нельзя. */
          <div
            key={p.nm}
            className={'flex px-4 py-2.5 ' + (phone ? 'flex-col gap-2' : 'items-center gap-3')}
          >
            <Who av={p.av} nm={p.nm} sub={p.sub} />
            {/* Пока не нажато ни одной — заявка без решения, и это видно по
                тому, что обе кнопки спокойные. */}
            <span className={'flex items-center gap-1.5 ' + (phone ? 'w-full justify-end' : 'ml-auto')}>
              {v[p.nm] === 0 && <span className="mr-1 text-xs text-neutral-400">без решения</span>}
              <button
                type="button"
                title="Принять заявку"
                onClick={() => set(p.nm, 1)}
                className={
                  'flex h-7 w-7 items-center justify-center rounded-md border ' +
                  (v[p.nm] === 1
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-neutral-200 text-neutral-400 hover:bg-green-50 hover:text-green-600')
                }
              >
                <Check size={15} />
              </button>
              <button
                type="button"
                title="Отклонить заявку"
                onClick={() => set(p.nm, -1)}
                className={
                  'flex h-7 w-7 items-center justify-center rounded-md border ' +
                  (v[p.nm] === -1
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-neutral-200 text-neutral-400 hover:bg-red-50 hover:text-red-600')
                }
              >
                <X size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

/* ── Расписание ─────────────────────────────────────────────────── */

/* Расписание считается по сетке, а не пишется рядом с ней: круги, число матчей
   в каждом и порядок заданы сеткой, и расходиться им нельзя.

   Матч за матчем здесь не расписан намеренно: их 175, и таблица из 175 строк
   отвечает на «когда мой матч», а этот экран отвечает на «влезает ли турнир в
   три дня и шестнадцать столов». Поматчевое расписание — у главного судьи. */

/** Игровой день: с 10:00 до 19:00. Ось времени общая у всех трёх дней — иначе
    блоки не сравнить, а сравнение здесь и есть смысл. */
const DAY_HOURS = { from: 10, till: 19 };

/** Колонки сетки времени — дни турнира, а не столы.

    Столов у Кубка шестнадцать, но по столам расписан каждый матч, а их 175:
    поматчевое расписание ведёт главный судья (Э6.4), здесь стоит круг целиком.
    Сколько столов круг занимает — сказано в самом блоке. */
const SCHED_DAYS = [
  { key: '2026-05-18', t: '18 мая', sub: 'понедельник' },
  { key: '2026-05-19', t: '19 мая', sub: 'вторник' },
  { key: '2026-05-20', t: '20 мая', sub: 'среда' },
];

/** Блоки расписания: круг, окно времени, сколько матчей и сколько из
    шестнадцати столов занято. Значения те же, что были в своей разметке, —
    минуты от полуночи переведены в 'ЧЧ:ММ', как их ждёт сетка кита.

    Загрузка зала была полоской внизу блока и теперь стоит словами: у финала на
    одном столе полоска выходила в несколько пикселей и всё равно ничего не
    показывала. */
const SCHEDULE: SlotEvent[] = [
  { id: 'd1a', col: '2026-05-18', from: '10:00', till: '14:00', nm: 'Группы', sub: '24 группы · 16 из 16 столов' },
  { id: 'd1b', col: '2026-05-18', from: '15:00', till: '19:00', nm: 'Группы', sub: '144 матча · 16 из 16 столов' },
  { id: 'd2a', col: '2026-05-19', from: '10:00', till: '12:30', nm: '1/16', sub: '16 матчей · 8 из 16 столов' },
  { id: 'd2b', col: '2026-05-19', from: '13:30', till: '15:30', nm: '1/8', sub: '8 матчей · 8 из 16 столов' },
  { id: 'd2c', col: '2026-05-19', from: '16:30', till: '18:00', nm: '1/4', sub: '4 матча · 4 из 16 столов' },
  { id: 'd3a', col: '2026-05-20', from: '11:00', till: '12:30', nm: '1/2', sub: '2 матча · 2 из 16 столов' },
  { id: 'd3b', col: '2026-05-20', from: '14:00', till: '15:30', nm: 'Финал', sub: 'стол 1 · трансляция', tone: 'success' },
];

/** Расписание сеткой времени: дни колонками, часы осью, круг — блоком.

    Таблицей это было списком фактов, и главный вопрос экрана — «влезает ли
    турнир в три дня и шестнадцать столов» — приходилось считать в голове. На
    оси времени он виден сразу: первый день забит с утра до вечера, третий почти
    пуст, а перерывы между кругами — это зазоры между блоками.

    Своя разметка делала ровно это же, но руками; сетка кита рисует расписание
    так же, как у главного судьи и у коллегии, — одно расписание в системе
    выглядит одинаково. Линии «сейчас» нет намеренно: турнир 18–20 мая, а
    сегодня в макете 15 апреля. */
const Schedule = () => (
  <Panel title="Расписание" extra={<span className="text-xs text-neutral-500">3 дня · 16 столов · 175 матчей</span>}>
    <TimeGrid
      cols={SCHED_DAYS}
      events={SCHEDULE}
      from={DAY_HOURS.from}
      till={DAY_HOURS.till}
      hourPx={40}
    />
  </Panel>
);

/** Расписание на телефоне списком ✳.

    Шкала времени в 392 px нечитаема: три колонки дня по сотне пикселей, блок
    круга в них остаётся без подписи, а вопрос экрана — «влезает ли турнир в три
    дня и шестнадцать столов» — по цветным прямоугольникам без слов не решается.
    Списком он решается: день — заголовок, круг — строка со временем и с тем,
    сколько столов занято. Блоки те же (`SCHEDULE`), их порядок — по времени. */
const SchedulePhone = () => (
  <Panel title="Расписание" sub="3 дня · 16 столов · 175 матчей" flush>
    {SCHED_DAYS.map((d) => (
      <div key={d.key}>
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {d.t} · {d.sub}
        </div>
        {SCHEDULE.filter((s) => s.col === d.key).map((s) => (
          <div key={s.id} className="flex gap-3 border-b border-neutral-100 px-4 py-2">
            <span className="w-24 shrink-0 text-[12.5px] tabular-nums leading-tight text-neutral-500">
              {s.from}–{s.till}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[13px] font-medium">{s.nm}</span>
              <span className="block text-xs text-neutral-500">{s.sub}</span>
            </span>
          </div>
        ))}
      </div>
    ))}
  </Panel>
);

/** Круги плей-офф: пять кругов на 32 вышедших из групп. Названия здесь, а не в
    данных сетки: в модели круг — это номер, а называет его формат турнира. */
const ROUNDS32 = ['1/16 финала', '1/8 финала', '1/4 финала', '1/2 финала', 'Финал'];

/** Сетка на телефоне списком ✳.

    `BracketFlow` — холст с зумом: в 392 px в него попадают две пары из
    тридцати одной, и ни круга целиком, ни пути игрока по сетке не прочесть.
    Списком читается и то, и другое: круг — панель, пара — строка, победитель
    набран жирным. Матчи те же самые (`playoff32`), второй сетки не заводим. */
const BracketPhone = () => (
  <>
    {ROUNDS32.map((nm, r) => {
      const ms = playoff32.matches.filter((m) => m.round === r);
      return (
        <Panel
          key={nm}
          title={nm}
          extra={<span className="text-xs text-neutral-500">{ms.length} матчей</span>}
          flush
        >
          <div className="divide-y divide-neutral-100">
            {ms.map((m) => (
              <div key={m.id} data-row className="flex items-center gap-3 px-4 py-2 text-[13px]">
                <span className="min-w-0 flex-1 leading-tight">
                  <span className={'block truncate ' + (m.winner === 'a' ? 'font-semibold' : 'text-neutral-500')}>
                    {m.a?.name ?? '—'}
                  </span>
                  <span className={'block truncate ' + (m.winner === 'b' ? 'font-semibold' : 'text-neutral-500')}>
                    {m.b?.name ?? '—'}
                  </span>
                </span>
                <span className="shrink-0 text-right leading-tight tabular-nums">
                  <span className={'block ' + (m.winner === 'a' ? 'font-semibold' : 'text-neutral-500')}>
                    {m.scoreA}
                  </span>
                  <span className={'block ' + (m.winner === 'b' ? 'font-semibold' : 'text-neutral-500')}>
                    {m.scoreB}
                  </span>
                </span>
                {m.status === 'live' && <P t="ИДЁТ" cls="live" />}
              </div>
            ))}
          </div>
        </Panel>
      );
    })}
  </>
);

/* ── Участники и группы ─────────────────────────────────────────── */

/** Состав турнира: подано 128 заявок, принято 96 (Э1.3, «Заявки игроков») —
    в составе стоят принятые, а не все подавшиеся.

    Список общий с остальными ролями, поэтому здесь только срез: у федерации
    свой турнир, но состав участников — одна и та же сущность. */
const ACCEPTED = ROSTER.slice(0, 96);

/** Сеяные — первые шестнадцать по рейтингу: администратору в составе важно
    видеть не «себя» (его в турнире нет), а посев. */
const SEEDED = 16;

/** Групповой этап: 96 принятых — 24 группы по четыре, разведённые змейкой по
    посеву, чтобы сеяные не сошлись в одной группе.

    **В плей-офф выходят 32** — победитель каждой группы и восемь лучших
    вторых ✳. Двадцать четыре группы и сетка на 32 иначе не сходятся, а правило
    добора в документах федерации не описано: ТЗ §5.1 говорит только «лучшие
    выходят в плей-офф». */
type GRow = { p: Ply14; place: number; wl: string; won: number; lost: number; out?: boolean; add?: boolean };
type Grp = { nm: string; rows: GRow[] };

/** Партии по местам: победитель проходит группу уверенно, четвёртый — нет.
    Второму число проигранных партий двигаем от группы к группе — по нему потом
    и отбираются восемь лучших вторых, иначе добор было бы нечем обосновать. */
const SETS: [number, number][] = [[9, 2], [7, 5], [4, 7], [1, 9]];
const WL = ['3 — 0', '2 — 1', '1 — 2', '0 — 3'];

const GROUPS1_3: Grp[] = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('').map((nm, g) => {
  /* По одному из каждой четверти посева: сильнейшие двадцать четыре расходятся
     по группам, следующие двадцать четыре — со сдвигом, и так все четыре раза.
     Сдвиг взаимно прост с числом групп, поэтому каждый попадает ровно в одну
     группу, а однофамильцы в одной не сходятся. */
  const men = [0, 1, 2, 3].map((r) => ACCEPTED[r * 24 + ((g + r * 5) % 24)]);
  /* Кто выиграл группу: обычно первый посев, но в каждой пятой группе его
     обыгрывают — турнир без единой неожиданности выглядит нарисованным. */
  const upset = g % 5 === 4;
  const order = upset ? [men[1], men[0], men[2], men[3]] : men;
  return {
    nm,
    rows: order.map((p, i) => {
      const [won, base] = SETS[i];
      const lost = i === 1 ? 3 + ((g * 7) % 6) : base;
      return { p, place: i + 1, wl: WL[i], won, lost };
    }),
  };
});

/* Восемь лучших вторых: по разнице партий, при равенстве — по посеву. Считаем
   один раз здесь, а не в разметке: это правило турнира, а не оформление. */
const SECONDS = GROUPS1_3.map((g) => g.rows[1])
  .sort((a, b) => b.won - b.lost - (a.won - a.lost) || a.p.s - b.p.s)
  .slice(0, 8);
GROUPS1_3.forEach((g) => {
  g.rows[0].out = true;
  if (SECONDS.includes(g.rows[1])) {
    g.rows[1].out = true;
    g.rows[1].add = true;
  }
});

/** Вкладка «Участники»: тот же состав и та же таблица, что у спортсмена и у
    клуба — поиск, сортировка по любому столбцу, страницы по 30. Своей строки у
    администратора в турнире нет, поэтому помечены сеяные: это то, что в составе
    смотрит федерация. */
const Players1_3 = () => (
  <Players14_5
    list={ACCEPTED}
    mark={(p) => (p.s <= SEEDED ? { t: 'СЕЯНЫЙ', cls: 'reg' } : undefined)}
  />
);

/** «1 группа», «2 группы», «5 групп» — счётчик читается вслух, и «2 групп» в
    нём звучит как опечатка. */
const grp = (n: number) => {
  const t = n % 100;
  if (t > 10 && t < 20) return 'групп';
  const o = n % 10;
  return o === 1 ? 'группа' : o > 1 && o < 5 ? 'группы' : 'групп';
};

/** Вкладка «Группы»: 24 группы карточками, а не одним списком на 96 строк —
    группа читается целиком, вместе с местами и партиями.

    Поиск ищет человека по всем группам сразу: вопрос к этому экрану — «в какой
    он группе и вышел ли», и листать двадцать четыре карточки ради него незачем. */
const Groups1_3 = ({ phone }: { phone?: boolean } = {}) => {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const hit = (nm: string) => Boolean(t) && nm.toLowerCase().includes(t);
  const shown = t ? GROUPS1_3.filter((g) => g.rows.some((r) => hit(r.p.nm))) : GROUPS1_3;
  return (
    <>
      {/* Поиск и счёт — друг под другом на телефоне: в строку они не встают. */}
      <div className={'mb-3 flex ' + (phone ? 'flex-col gap-2' : 'items-center justify-between gap-4')}>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Фамилия участника"
          className={phone ? 'w-full' : 'w-72'}
        />
        <span className="text-[12.5px] text-neutral-500">
          {t
            ? `${shown.length} ${grp(shown.length)} из ${GROUPS1_3.length}`
            : '24 группы по 4 · выходят 32: победители групп и восемь лучших вторых ✳'}
        </span>
      </div>

      {shown.length === 0 ? (
        <EmptyBox title={`По запросу «${q}» никого нет`} text="Проверьте написание фамилии." />
      ) : (
        <div className="max-h-[430px] overflow-auto pr-1">
          {/* На телефоне группы идут в столбик: в четверти от 392 px фамилия
              режется до трёх букв, и карточка перестаёт быть группой. */}
          <div className={phone ? 'grid gap-2' : 'grid grid-cols-4 gap-2'}>
            {shown.map((g) => (
              <div key={g.nm} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className="flex items-baseline justify-between border-b border-neutral-100 px-2.5 py-1.5">
                  <b className="text-[12px] font-semibold">Группа {g.nm}</b>
                  <span className="text-[10px] text-neutral-400">6 матчей · сыграна</span>
                </div>
                {g.rows.map((r) => (
                  <div
                    key={r.p.s}
                    title={
                      r.add
                        ? 'Вышел добором — один из восьми лучших вторых'
                        : r.out
                          ? 'Победитель группы — в плей-офф'
                          : 'Выбыл после группового этапа'
                    }
                    className={
                      'flex items-center gap-1.5 px-2.5 py-1 text-[11px] ' +
                      (r.out ? 'bg-green-50/70 ' : '') +
                      (hit(r.p.nm) ? 'ring-1 ring-inset ring-blue-300' : '')
                    }
                  >
                    <span className="w-3 shrink-0 tabular-nums text-neutral-400">{r.place}</span>
                    <span className={'min-w-0 flex-1 truncate ' + (r.out ? 'font-medium' : 'text-neutral-600')}>{r.p.nm}</span>
                    <span className="shrink-0 tabular-nums text-neutral-500">{r.wl}</span>
                    <span className="w-9 shrink-0 text-right tabular-nums text-neutral-500">{r.won} — {r.lost}</span>
                    {r.add && <em className="shrink-0 not-italic text-[9.5px] font-semibold uppercase text-green-700">добор</em>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 text-[12.5px] text-neutral-500">
        Подсвечены вышедшие в плей-офф: победитель группы и восемь лучших вторых по разнице партий ✳
      </div>
    </>
  );
};

/** Что в каждом разделе. Разделы идут по ходу турнира, и в каждом ровно одно,
    на что смотрят; кто с этим работает — написано в самом разделе. */
const SECTION_BODY: Record<string, (phone?: boolean) => ReactNode> = {
  'Заявки судей': (phone) => <JudgeApps phone={phone} />,
  'Заявки игроков': (phone) => <PlayerApps phone={phone} />,
  /* Состав — общая таблица (Э14.5): она живёт в телефоне спортсмена, и
     подгонять её под второй формат не надо. */
  'Участники': () => <Players1_3 />,
  'Группы': (phone) => <Groups1_3 phone={phone} />,
  /* Сетка — настоящая, тем же компонентом, что на фронте (`widgets/bracket`),
     по общей модели сетки: макет не изображает её своими прямоугольниками.
     Кругов пять, а не семь: формат Кубка РК — «олимпийская с группами», 96
     принятых заявок играют групповой этап, и в сетку на выбывание выходят 32.
     Светлый тон: новый слой светлый, чёрная плоскость из него выпадала. */
  'Сетка': (phone) =>
    phone ? (
      <BracketPhone />
    ) : (
      <div className="relative h-[430px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
        <div className="absolute inset-0 [&>div]:h-full!">
          <BracketFlow bracket={playoff32} minZoom={0.1} fitPadding={0.04} tone="light" />
        </div>
      </div>
    ),
  'Расписание': (phone) => (phone ? <SchedulePhone /> : <Schedule />),
};

export function Tour1_3() {
  const [sec, setSec] = useState('Черновик');
  /* Регламент заполняют, потом закрывают: пока он открыт, поля правятся, после
     «Завершить» — только читаются. «Изменить» открывает его обратно, и это не
     то же самое, что первая правка: она уходит в журнал с автором (§12). */
  const [closed, setClosed] = useState(false);
  return (
    <WebApp
      role={R01}
      nav="Календарь"
      title="Кубок Республики Казахстан 2026"
      back={{ label: 'Календарь сезона', to: 'Э1.2' }}
    >
      <SectionRow on={sec} onPick={setSec} />
      {sec !== 'Черновик' ? (
        SECTION_BODY[sec]()
      ) : (
        /* Регламент правится прямо здесь: после мастера в два шага это
           единственное место, где у турнира задаются формат, столы и допуск.
           Панели «Действия по турниру» рядом нет ✳: кнопка закрытия стоит под
           самим регламентом, а рядом с ней — то, что мешает идти дальше. */
        <Panel
          title="Регламент"
          extra={<P t={closed ? 'РЕГЛАМЕНТ ЗАКРЫТ' : 'ЧЕРНОВИК'} cls={closed ? 'reg' : 'done'} />}
        >
          <TourRules edit={!closed} />
          {/* Одна кнопка на два состояния: закрыть регламент и открыть его
              обратно. Держать обе сразу незачем — доступна всегда ровно та,
              которая сейчас имеет смысл. */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="max-w-lg text-[12.5px] text-neutral-500">
              {closed
                ? 'Регламент закрыт. Правка после этого сохраняется с автором и уходит в журнал.'
                : 'Пока регламент не закрыт, турнир нельзя опубликовать и на него нельзя открыть приём заявок судей.'}
            </span>
            {/* «Отменить / перенести» стоит рядом: это единственный вход в
                Э1.9, и держать его где-то ещё было негде — панели «Действия по
                турниру» у карточки нет. Действие доступно до «Завершён», а
                спорить с главной кнопкой не должно: обводка, не заливка. */}
            <span className="flex shrink-0 items-center gap-2">
              <Button variant="outline" data-to="Э1.9">
                Отменить / перенести
              </Button>
              <Button variant="primary" onPress={() => setClosed(!closed)}>
                {closed ? <Pencil size={15} /> : <Check size={15} />}
                {closed ? 'Изменить' : 'Завершить'}
              </Button>
            </span>
          </div>
        </Panel>
      )}
    </WebApp>
  );
}

/** Карточка турнира на телефоне ✳: тот же ряд разделов (прокруткой вбок) и то
    же тело раздела. Сетка и шкала времени в разделах «Сетка» и «Расписание»
    заменены списком того же содержания — см. `BracketPhone` и `SchedulePhone`. */
const Tour1_3Phone = () => {
  const [sec, setSec] = useState('Черновик');
  const [closed, setClosed] = useState(false);
  return (
    <PhoneRoleApp
      role={R01}
      nav="Календарь"
      title="Кубок Республики Казахстан 2026"
      back={{ label: 'Календарь сезона', to: 'Э1.2' }}
    >
      <SectionRow on={sec} onPick={setSec} scroll />
      {sec !== 'Черновик' ? (
        SECTION_BODY[sec](true)
      ) : (
        <Panel
          title="Регламент"
          extra={<P t={closed ? 'РЕГЛАМЕНТ ЗАКРЫТ' : 'ЧЕРНОВИК'} cls={closed ? 'reg' : 'done'} />}
        >
          <TourRules edit={!closed} phone />
          {/* Правило и кнопки — этажами: в строку они не встают, а правило
              объясняет именно кнопку под ним. */}
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[12.5px] text-neutral-500">
              {closed
                ? 'Регламент закрыт. Правка после этого сохраняется с автором и уходит в журнал.'
                : 'Пока регламент не закрыт, турнир нельзя опубликовать и на него нельзя открыть приём заявок судей.'}
            </span>
            <Button className="w-full" variant="primary" onPress={() => setClosed(!closed)}>
              {closed ? <Pencil size={15} /> : <Check size={15} />}
              {closed ? 'Изменить' : 'Завершить'}
            </Button>
            <Button className="w-full" variant="outline" data-to="Э1.9">
              Отменить / перенести
            </Button>
          </div>
        </Panel>
      )}
    </PhoneRoleApp>
  );
};

/** Расписание Э1.3 врезкой ✳. Разделы карточки листаются, а открыт по
    умолчанию «Черновик» с регламентом: сетка времени — последний из семи
    разделов, и на борде её не было видно. Кадр показывает то, ради чего
    расписание рисуется шкалой: первый день забит с утра до вечера, третий почти
    пуст, перерывы между кругами — зазоры между блоками. */
const Sched1_3Also = () => (
  <Also cap="Раздел «Расписание» — три дня турнира на шкале времени">
    <Frag w={940}>
      <Schedule />
    </Frag>
  </Also>
);

const Tour1_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="«Черновик» — незаполненные обязательные поля"
      text="Поля подсвечены; с ними нельзя публиковать."
    >
      <Frag w={520}>
        <FormGrid>
          <FieldView label="Даты" value="9 мая 2026" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Формат</span>
            <span className="w-full rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">— не выбран</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Столов</span>
            <span className="w-full rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">— не указано</span>
          </div>
        </FormGrid>
        <div className="mt-3">
          <Bar tone="warning">
            Пока регламент не заполнен, турнир нельзя опубликовать и на него нельзя открыть приём заявок судей.
          </Bar>
          <DisabledAction>Опубликовать</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="После состояния «Завершён»"
      text="Всё только чтение, кнопок правки нет."
    >
      <Frag>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-neutral-500">Кубок Республики Казахстан 2026</span>
          <P t="ЗАВЕРШЁН" cls="done" />
        </div>
        <Rows>
          <Row nm="Итоговый протокол" sub="утверждён председателем ГСК · 21.01.2026" pill={{ t: 'ЗАКРЫТ', cls: 'done' }} action="Печать" />
          <Row nm="Рейтинг" sub="пересчитан по 142 матчам · 21.01.2026" pill={{ t: 'УЧТЁН', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.9 · Отмена или перенос соревнования ────────────────────── */

/** Кого затрагивает отмена или перенос — одни и те же числа в обоих форматах:
    на десктопе плитками, на телефоне строкой фактов. */
const AFFECTED: { v: string; k: string; tone?: 'g' | 'b' }[] = [
  { v: '128', k: 'Заявок подано' },
  { v: '96', k: 'Принято', tone: 'g' },
  { v: '14', k: 'Судей в наряде', tone: 'b' },
];

/** Сам диалог отмены и переноса — один на оба формата: состояние («перенести»
    или «отменить совсем») живёт в нём, снаружи остаётся только «открыт или
    нет». Меняется в телефонном кадре одно: поля идут в одну колонку, а плитки
    «кого затрагивает» — строкой. */
const CancelDialog = ({ phone, onClose }: { phone?: boolean; onClose: () => void }) => {
  const [mode, setMode] = useState('Перенести');
  return (
    <InlineDialog
      title="Отменить или перенести соревнование"
      sub="Кубок Республики Казахстан 2026 · 18–20 мая · Астана"
      to="Э1.3"
      foot={
        <>
          {!phone && (
            <span className="mr-auto text-xs text-neutral-500">Причина уйдёт заявителям и в журнал</span>
          )}
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button variant="primary">Перенести</Button>
        </>
      }
    >
      <div className="mb-3">
        <FilterSeg items={['Перенести', 'Отменить совсем']} active={mode} onPick={setMode} />
      </div>
      <FormGrid>
        <FieldView label="Было" value="18–20 мая 2026" wide={phone} />
        <FieldView label="Новое окно дат" value="1–3 июня 2026" wide={phone} />
        <FieldView
          label="Причина"
          value="ДС «Барыс» занят под другое мероприятие; зал подтвердил новые даты"
          wide
        />
      </FormGrid>
      <Sec>Кого затрагивает</Sec>
      {phone ? <Facts items={AFFECTED.map((a) => ({ k: a.k, v: a.v }))} /> : <Cells items={AFFECTED} />}
      {/* Что будет с заявками — здесь же, а не в уведомлении после: это
          первое, о чём спрашивают, увидев числа выше. */}
      <Sec>Что будет с заявками</Sec>
      <Rows>
        <Row
          nm="Заявки сохраняются"
          sub="и при переносе, и при отмене — подавать их заново не нужно"
          pill={{ t: 'СОХРАНЯЮТСЯ', cls: 'live' }}
        />
        <Row
          nm="При переносе переезжают на новые даты"
          sub="1–3 июня 2026 · заявителям уходит уведомление с причиной"
          pill={{ t: 'ПЕРЕЕДУТ', cls: 'reg' }}
        />
      </Rows>
    </InlineDialog>
  );
};

export function Cancel1_9() {
  /* Диалог открыт: экран Э1.9 — это он и есть. Крестик и «Закрыть» возвращают
     на карточку турнира, поверх которой он открыт (Э1.3), — она под ним и
     нарисована. «Отменить / перенести» в шапке регламента открывает снова. */
  const [open, setOpen] = useState(true);
  return (
    <WebApp
      role={R01}
      nav="Календарь"
      title="Кубок Республики Казахстан 2026"
    >
      <SectionRow on="Черновик" />
      <Panel
        title="Регламент"
        extra={
          open ? (
            <P t={NOW_STAGE.toUpperCase()} cls="reg" />
          ) : (
            <Button size="sm" variant="outline" onPress={() => setOpen(true)}>
              Отменить / перенести
            </Button>
          )
        }
      >
        <TourRules />
      </Panel>

      {open && <CancelDialog onClose={() => setOpen(false)} />}
    </WebApp>
  );
}

/** Отмена или перенос на телефоне ✳: под диалогом тот же родительский экран —
    карточка турнира с регламентом. */
const Cancel1_9Phone = () => {
  const [open, setOpen] = useState(true);
  return (
    <PhoneRoleApp role={R01} nav="Календарь" title="Кубок Республики Казахстан 2026">
      <SectionRow on="Черновик" scroll />
      <Panel
        title="Регламент"
        extra={
          open ? (
            <P t={NOW_STAGE.toUpperCase()} cls="reg" />
          ) : (
            <Button size="sm" variant="outline" onPress={() => setOpen(true)}>
              Отменить / перенести
            </Button>
          )
        }
      >
        <TourRules phone />
      </Panel>
      {open && (
        <PhoneDialog>
          <CancelDialog phone onClose={() => setOpen(false)} />
        </PhoneDialog>
      )}
    </PhoneRoleApp>
  );
};

const Cancel1_9States = () => (
  <States>
    <Shot tone="danger" title="Причина не заполнена" text="Обе кнопки неактивны, с пояснением.">
      <Frag w={480}>
        <FormGrid>
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Причина</span>
            <span className="w-full rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">— не заполнена</span>
          </div>
        </FormGrid>
        <div className="mt-3">
          <Bar tone="danger">
            Без причины ни перенести, ни отменить нельзя: она уходит людям в уведомление и остаётся в журнале.
          </Bar>
        </div>
        <div className="flex gap-2">
          <DisabledAction>Перенести</DisabledAction>
          <DisabledAction>Отменить соревнование</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Турнир в состоянии «Идёт» ✳"
      text="Предупреждение, что часть матчей уже сыграна и отмена их результаты не удаляет."
    >
      <Frag>
        <Rows>
          <Row nm="Сыграно матчей" sub="Суперлига (мужчины) · день 2 из 3" val="34 из 60" pill={{ t: 'ИДЁТ', cls: 'live' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Турнир уже идёт: сыгранные матчи останутся в журнале и в истории игроков, но турнир не
            будет доигран.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ вопрос 2.2 — чем становится отменённый турнир"
      text="Среди восьми состояний «отменён» нет, и кто именно отменяет — тоже открыто."
      wide
    >
      <Frag w={720}>
        <div className="mb-3 flex flex-wrap gap-1">
          {['Черновик', 'Приём заявок судей', 'Судья назначен', 'Приём заявок игроков', 'Система проведения', 'Идёт', 'Итоговый протокол', 'Завершён'].map((s) => (
            <span key={s} className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] text-neutral-600">{s}</span>
          ))}
          <span className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-[12px] font-medium text-red-700">
            Отменён — ⚠ такого состояния в ТЗ нет
          </span>
        </div>
        <Bar tone="danger">
          Пока не решено: остаётся ли отменённый турнир в календаре, кто его отменяет — председатель
          ГСК или администратор Федерации по «полному доступу», и что происходит с уже сыгранными
          матчами. В макете это место помечено, а не придумано.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.5 · Пользователи и роли: данные ────────────────────────── */

/** Учётная запись: строка списка и карточка — одни и те же данные. У каждой
    записи свои контакты и свои выданные роли; система именная (TZ §12) — у
    каждой выдачи есть автор, и он виден здесь. */
type User = {
  av: string;
  nm: string;
  /** Роли одной строкой — то, что видно в списке. */
  roles: string;
  st: string;
  cls: Cls;
  phone: string;
  mail: string;
  grants: { nm: string; sub: string }[];
};

const USERS: User[] = [
  {
    av: A(76), nm: 'Оспанов Тимур', roles: 'Главный судья · Кубок РК · до 20.05.2026',
    st: 'АКТИВЕН', cls: 'live', phone: '+7 701 224 88 10', mail: 't.ospanov@ttfrk.kz',
    grants: [
      { nm: 'Главный судья · Кубок РК', sub: 'назначил Мукашев Б., 02.04.2026 · до 20.05.2026' },
    ],
  },
  {
    av: A(13), nm: 'Пак Сергей', roles: 'Судья · Кубок РК · до 20.05.2026 · и ещё 1 роль',
    st: 'АКТИВЕН', cls: 'live', phone: '+7 705 431 20 18', mail: 's.pak@ttfrk.kz',
    grants: [
      { nm: 'Судья · Кубок РК', sub: 'выдала Абаева Д., 10.04.2026 · до 20.05.2026' },
      { nm: 'Судья стола · стол 4', sub: 'выдал Оспанов Т., 15.04.2026 · до 20.05.2026' },
    ],
  },
  {
    av: A(76), nm: 'Мукашев Бекзат', roles: 'Председатель ГСК · система · бессрочно',
    st: 'АКТИВЕН', cls: 'live', phone: '+7 702 118 60 45', mail: 'b.mukashev@ttfrk.kz',
    grants: [
      { nm: 'Председатель ГСК · система', sub: 'выдала Абаева Д., 12.01.2026 · бессрочно' },
    ],
  },
  {
    av: AW(21), nm: 'Тлеуова Аружан', roles: 'Менеджер · только чтение · система · до 31.12.2026',
    st: 'АКТИВЕН', cls: 'live', phone: '+7 707 903 15 72', mail: 'a.tleuova@ttfrk.kz',
    grants: [
      { nm: 'Менеджер по спорту · система', sub: 'выдала Абаева Д., 20.01.2026 · до 31.12.2026' },
    ],
  },
  {
    av: A(45), nm: 'Досжан Марат', roles: 'Администратор клуба «Алатау» · клуб · до 31.12.2026',
    st: 'ОТКЛЮЧЁН', cls: 'bad', phone: '+7 700 512 34 09', mail: 'm.doszhan@alatau.kz',
    grants: [
      { nm: 'Администратор клуба «Алатау»', sub: 'выдала Абаева Д., 05.02.2026 · до 31.12.2026' },
    ],
  },
];

/* ── Реестры: данные и таблица ──────────────────────────────────── */

/** Запись реестра. Колонка `val` у каждого реестра своя: у спортсмена рейтинг
    (§7.1), у судьи — рейтинг судьи (§7.2), у тренера и клуба — сколько за ним
    людей. Общей строки у них нет, поэтому это четыре реестра, а не один список
    с фильтром. */
type Entry = {
  /** Ключ строки. Имена в реестре на пять тысяч человек повторяются — двух
      «Ким Александров» в списке ничем не различить, а строку надо чем-то
      опознавать при сортировке и листании. */
  id?: string;
  av?: string;
  nm: string;
  sub: string;
  /** Число в колонке значения — без повтора её названия в каждой строке. */
  val: string;
  /** Состояние — да/нет, поэтому рисуется галочкой, а не значком со словами:
      в колонке с заголовком слово повторяется столько раз, сколько строк. */
  ok: boolean;
  /** Что именно значит галочка у этой записи — в подсказке при наведении. */
  st: string;
  /** Карточка, которая открывается по клику на строку. */
  card: { k: string; v: string }[];
};

type Registry = {
  /** Подпись вкладки и сколько записей в реестре. Счёт считается по строкам
      (`fill` ниже): число на вкладке и длина таблицы расходиться не должны. */
  k: string;
  n: string;
  /** Заголовок первой колонки — он же кнопка сортировки по алфавиту. */
  who: string;
  /** Что ищет поиск по этому реестру — подсказка в поле. */
  find: string;
  /** Заголовки колонок: значение и состояние. У каждого реестра свои. */
  cols: [string, string];
  /** Фильтр по состоянию: «есть» и «нет» своими словами. Общего слова у
      реестров нет — у спортсмена это взнос, у судьи подтверждённая категория. */
  flt: [string, string];
  /** Подпись кнопки заведения: заводят не «запись», а спортсмена или клуб. */
  add: string;
  /** Карточка записи целым экраном — пока только у спортсмена (Э1.12). */
  to?: string;
  rows: Entry[];
};

const REGISTRIES: Registry[] = [
  {
    k: 'Спортсмены', n: '5 210', add: 'Завести спортсмена', to: 'Э1.12',
    who: 'Спортсмен', find: 'Фамилия, регион, клуб или тренер',
    cols: ['Рейтинг', 'Взнос'],
    flt: ['Взнос оплачен', 'Взнос не оплачен'],
    rows: [
      {
        av: A(32), nm: 'Смагулов Алан', sub: '2004 · Алматы · «Алатау» · тренер Смагулов А. · КМС',
        val: '2456', ok: true, st: 'Годовой взнос 2026 оплачен',
        card: [
          { k: 'Год рождения · пол', v: '2004 · мужской' },
          { k: 'Разряд', v: 'кандидат в мастера спорта' },
          { k: 'Регион и клуб', v: 'Алматы · «Алатау»' },
          { k: 'Тренер', v: 'Смагулов Асхат' },
        ],
      },
      {
        av: A(44), nm: 'Ким Георгий', sub: '2003 · Астана · СКА · тренер Гладун И. · МС',
        val: '2401', ok: true, st: 'Годовой взнос 2026 оплачен',
        card: [
          { k: 'Год рождения · пол', v: '2003 · мужской' },
          { k: 'Разряд', v: 'мастер спорта' },
          { k: 'Регион и клуб', v: 'Астана · СКА' },
          { k: 'Тренер', v: 'Гладун Игорь' },
        ],
      },
      {
        av: A(13), nm: 'Пак Сергей', sub: '2005 · Павлодар · «Иртыш» · тренер Ким Л. · КМС',
        val: '2312', ok: true, st: 'Годовой взнос 2026 оплачен',
        card: [
          { k: 'Год рождения · пол', v: '2005 · мужской' },
          { k: 'Разряд', v: 'кандидат в мастера спорта' },
          { k: 'Регион и клуб', v: 'Павлодар · «Иртыш»' },
          { k: 'Тренер', v: 'Ким Лариса' },
        ],
      },
      {
        av: A(22), nm: 'Жумабеков Расул', sub: '2007 · Караганда · «Шахтёр» · тренер Досжан М. · 1 разряд',
        val: '2290', ok: false, st: 'Взнос не оплачен — заявки на турниры с флагом взноса не пройдут',
        card: [
          { k: 'Год рождения · пол', v: '2007 · мужской' },
          { k: 'Разряд', v: 'первый разряд' },
          { k: 'Регион и клуб', v: 'Караганда · «Шахтёр»' },
          { k: 'Тренер', v: 'Досжан Марат' },
        ],
      },
      {
        av: AW(21), nm: 'Тлеуова Аружан', sub: 'завёл клуб «Достык», 03.02.2026 · 2009 · Шымкент · 2 разряд',
        val: '1980', ok: false, st: 'Взнос не оплачен — заявки на турниры с флагом взноса не пройдут',
        card: [
          { k: 'Год рождения · пол', v: '2009 · женский' },
          { k: 'Разряд', v: 'второй разряд' },
          { k: 'Регион и клуб', v: 'Шымкент · «Достык»' },
          { k: 'Источник записи ✳', v: 'завёл клуб «Достык», 03.02.2026' },
        ],
      },
      {
        av: A(75), nm: 'Ерлан Бекзат', sub: '2006 · Актобе · спортшкола №3 · тренер Токаев М. · 1 разряд',
        val: '2105', ok: true, st: 'Годовой взнос 2026 оплачен',
        card: [
          { k: 'Год рождения · пол', v: '2006 · мужской' },
          { k: 'Разряд', v: 'первый разряд' },
          { k: 'Регион и клуб', v: 'Актобе · спортшкола №3' },
          { k: 'Тренер', v: 'Токаев Марат' },
        ],
      },
    ],
  },
  {
    /* Те же судьи и те же баллы, что в реестре председателя ГСК (Э5.x): один
       реестр, два экрана — расходиться им нельзя. */
    k: 'Судьи', n: '214', add: 'Завести судью',
    who: 'Судья', find: 'Фамилия, категория или регион',
    cols: ['Рейтинг', 'Категория'],
    flt: ['Категория подтверждена', 'Не подтверждена'],
    rows: [
      {
        av: A(76), nm: 'Оспанов Тимур', sub: 'Национальная категория · Астана · в наряде: Кубок РК',
        val: '27,5', ok: true, st: 'Категория подтверждена документом',
        card: [
          { k: 'Категория', v: 'национальная' },
          { k: 'Регион', v: 'Астана' },
          { k: 'Рейтинг судьи · место', v: '27,5 · №1' },
          { k: 'Сейчас в наряде', v: 'Кубок РК — главный судья' },
        ],
      },
      {
        av: A(76), nm: 'Мукашев Бекзат', sub: 'Национальная категория · Астана · председатель ГСК',
        val: '31', ok: true, st: 'Категория подтверждена документом',
        card: [
          { k: 'Категория', v: 'национальная' },
          { k: 'Регион', v: 'Астана' },
          { k: 'Рейтинг судьи · место', v: '31 · вне зачёта, председатель ГСК' },
          { k: 'Турниров за сезон', v: '2 — «Открытие сезона», Кубок Сарыарки' },
        ],
      },
      {
        av: A(13), nm: 'Пак Сергей', sub: 'Первая категория · Павлодар · стол 4, Лига 2-й тур',
        val: '18', ok: true, st: 'Категория подтверждена документом',
        card: [
          { k: 'Категория', v: 'первая' },
          { k: 'Регион', v: 'Павлодар' },
          { k: 'Рейтинг судьи · место', v: '18 · №3' },
          { k: 'Сейчас в наряде', v: 'Лига, 2-й тур — стол 4' },
        ],
      },
      {
        av: AW(65), nm: 'Абдрахманова Сауле', sub: 'Первая категория · Караганда',
        val: '12,5', ok: true, st: 'Категория подтверждена документом',
        card: [
          { k: 'Категория', v: 'первая' },
          { k: 'Регион', v: 'Караганда' },
          { k: 'Рейтинг судьи · место', v: '12,5 · №5' },
          { k: 'Турниров за сезон', v: '4' },
        ],
      },
      {
        av: A(19), nm: 'Цой Виктор', sub: 'Первая категория · Караганда',
        val: '9,5', ok: true, st: 'Категория подтверждена документом',
        card: [
          { k: 'Категория', v: 'первая' },
          { k: 'Регион', v: 'Караганда' },
          { k: 'Рейтинг судьи · место', v: '9,5 · №6' },
          { k: 'Турниров за сезон', v: '3' },
        ],
      },
      {
        av: A(22), nm: 'Жумабеков Расул', sub: 'Судья по спорту · Караганда',
        val: '7', ok: true, st: 'Категория подтверждена документом',
        card: [
          { k: 'Категория', v: 'судья по спорту' },
          { k: 'Регион', v: 'Караганда' },
          { k: 'Рейтинг судьи · место', v: '7 · №19' },
          { k: 'Турниров за сезон', v: '2' },
        ],
      },
      {
        av: AW(32), nm: 'Абдрахманова Айгерим', sub: 'Вторая категория · Астана · документ на проверке',
        val: '4', ok: false, st: 'Категория не подтверждена — документ на проверке у председателя ГСК',
        card: [
          { k: 'Категория', v: 'вторая — на проверке' },
          { k: 'Регион', v: 'Астана' },
          { k: 'Рейтинг судьи · место', v: '4 · №61' },
          { k: 'Документ', v: 'удостоверение подано 12.04.2026' },
        ],
      },
    ],
  },
  {
    k: 'Тренеры', n: '96', add: 'Завести тренера',
    who: 'Тренер', find: 'Фамилия, регион или клуб',
    cols: ['Спортсменов', 'Права заявки'],
    flt: ['Может заявлять', 'Заявлять не может'],
    rows: [
      {
        av: A(51), nm: 'Смагулов Асхат', sub: 'Алматы · «Алатау»',
        val: '24', ok: true, st: 'Может подавать заявки за своих спортсменов',
        card: [
          { k: 'Регион и клуб', v: 'Алматы · «Алатау»' },
          { k: 'Спортсменов', v: '24' },
          { k: 'Права подачи заявок', v: 'за своих спортсменов клуба' },
          { k: 'Учётная запись', v: 'активна' },
        ],
      },
      {
        av: A(19), nm: 'Гладун Игорь', sub: 'Астана · СКА',
        val: '18', ok: true, st: 'Может подавать заявки за своих спортсменов',
        card: [
          { k: 'Регион и клуб', v: 'Астана · СКА' },
          { k: 'Спортсменов', v: '18' },
          { k: 'Права подачи заявок', v: 'за своих спортсменов клуба' },
          { k: 'Учётная запись', v: 'активна' },
        ],
      },
      {
        av: AW(65), nm: 'Ким Лариса', sub: 'Павлодар · «Иртыш»',
        val: '12', ok: true, st: 'Может подавать заявки за своих спортсменов',
        card: [
          { k: 'Регион и клуб', v: 'Павлодар · «Иртыш»' },
          { k: 'Спортсменов', v: '12' },
          { k: 'Права подачи заявок', v: 'за своих спортсменов клуба' },
          { k: 'Учётная запись', v: 'активна' },
        ],
      },
      {
        av: A(45), nm: 'Досжан Марат', sub: 'Караганда · «Шахтёр» · учётная запись отключена',
        val: '9', ok: false, st: 'Заявки подавать не может: учётная запись отключена',
        card: [
          { k: 'Регион и клуб', v: 'Караганда · «Шахтёр»' },
          { k: 'Спортсменов', v: '9' },
          { k: 'Права подачи заявок', v: 'нет — учётная запись отключена' },
          { k: 'Учётная запись', v: 'отключена 12.03.2026' },
        ],
      },
      {
        av: A(76), nm: 'Токаев Марат', sub: 'Актобе · спортшкола №3',
        val: '15', ok: true, st: 'Может подавать заявки за своих спортсменов',
        card: [
          { k: 'Регион и организация', v: 'Актобе · спортшкола №3' },
          { k: 'Спортсменов', v: '15' },
          { k: 'Права подачи заявок', v: 'за своих спортсменов организации' },
          { k: 'Учётная запись', v: 'активна' },
        ],
      },
    ],
  },
  {
    /* Клубы и организации в одном реестре: спортшкола не клуб, но спортсменов
       заявляет так же — различает их подпись, а не отдельный реестр. */
    k: 'Клубы и организации', n: '78', add: 'Завести клуб',
    who: 'Клуб или организация', find: 'Название, тип или город',
    cols: ['Спортсменов', 'Документы'],
    flt: ['Документы приняты', 'Документы на проверке'],
    rows: [
      {
        nm: '«Алатау»', sub: 'клуб · Алматы · 3 команды в Лиге',
        val: '86', ok: true, st: 'Документы приняты, клуб зарегистрирован',
        card: [
          { k: 'Тип', v: 'клуб' },
          { k: 'Город', v: 'Алматы' },
          { k: 'Администратор клуба', v: 'Досжан Марат' },
          { k: 'Команды в Лиге', v: '3 — Суперлига мужчины, 2 лига, женская Суперлига' },
        ],
      },
      {
        nm: '«Барыс»', sub: 'клуб · Астана · 2 команды в Лиге',
        val: '64', ok: true, st: 'Документы приняты, клуб зарегистрирован',
        card: [
          { k: 'Тип', v: 'клуб' },
          { k: 'Город', v: 'Астана' },
          { k: 'Администратор клуба', v: 'Сериков Нурлан' },
          { k: 'Команды в Лиге', v: '2 — Суперлига мужчины, 3 лига' },
        ],
      },
      {
        nm: '«Шахтёр»', sub: 'клуб · Караганда · 1 команда в Лиге',
        val: '41', ok: true, st: 'Документы приняты, клуб зарегистрирован',
        card: [
          { k: 'Тип', v: 'клуб' },
          { k: 'Город', v: 'Караганда' },
          { k: 'Администратор клуба', v: 'Досжан Марат' },
          { k: 'Команды в Лиге', v: '1 — 2 лига' },
        ],
      },
      {
        nm: '«Иртыш»', sub: 'клуб · Павлодар · 1 команда в Лиге',
        val: '38', ok: true, st: 'Документы приняты, клуб зарегистрирован',
        card: [
          { k: 'Тип', v: 'клуб' },
          { k: 'Город', v: 'Павлодар' },
          { k: 'Администратор клуба', v: 'Ким Лариса' },
          { k: 'Команды в Лиге', v: '1 — 4 лига' },
        ],
      },
      {
        nm: '«Достык»', sub: 'клуб · Шымкент · команд в Лиге нет',
        val: '29', ok: true, st: 'Документы приняты, клуб зарегистрирован',
        card: [
          { k: 'Тип', v: 'клуб' },
          { k: 'Город', v: 'Шымкент' },
          { k: 'Администратор клуба', v: 'Тлеуов Ерлан' },
          { k: 'Команды в Лиге', v: 'нет' },
        ],
      },
      {
        nm: 'Спортшкола №3', sub: 'организация, не клуб · Актобе · документы на проверке',
        val: '52', ok: false, st: 'Документы на проверке — регистрация не завершена',
        card: [
          { k: 'Тип', v: 'организация, не клуб' },
          { k: 'Город', v: 'Актобе' },
          { k: 'Ответственный', v: 'Токаев Марат' },
          { k: 'Документы', v: 'поданы 08.04.2026, на проверке' },
        ],
      },
    ],
  },
];

/* ── Реестры: настоящий объём ───────────────────────────────────── */

/* В реестре федерации пять тысяч спортсменов, а в таблице их было шесть — и
   такая таблица не отвечает ни на один вопрос этого экрана: как в реестре
   ищут, как сортируют, сколько выходит страниц. Поэтому реестры достраиваются
   до объёма, который стоит на вкладке, — тем же приёмом, что состав участников
   у спортсмена (Э14.5).

   Записи считаются от номера, а не берутся случайно: `Math.random` давал бы
   каждый раз другой реестр, и макет нельзя было бы ни обсудить, ни сверить.
   Нарисованные вручную записи остаются первыми — на них разобраны состояния
   (взнос не оплачен, категория на проверке, учётная запись отключена). */

/* Списков хватает на то, чтобы полные тёзки в реестре встречались, но не шли
   по три подряд: шестьдесят фамилий на тридцать имён — это тысяча восемьсот
   разных людей, а в реестре их пять тысяч. */
const SURN = [
  'Смагулов', 'Ким', 'Токаев', 'Жумабеков', 'Пак', 'Гладун', 'Оспанов', 'Байжанов',
  'Абиш', 'Сериков', 'Цой', 'Ли', 'Муратов', 'Асанов', 'Бекзатов', 'Кайратов',
  'Нурланов', 'Тлеуов', 'Садыков', 'Жанибеков', 'Алтаев', 'Ерасылов', 'Мадиев', 'Арманов',
  'Абдрахманов', 'Оралбеков', 'Досжанов', 'Мукашев', 'Ерубаев', 'Каиров',
  'Сулейменов', 'Ахметов', 'Искаков', 'Жаксылыков', 'Нургалиев', 'Тураров',
  'Байсеитов', 'Шаяхметов', 'Утегенов', 'Бекмуратов', 'Аманжолов', 'Тлеубаев',
  'Кенжебаев', 'Жунусов', 'Сапаров', 'Даулетов', 'Есимов', 'Койшыбаев',
  'Абдуллаев', 'Мырзабеков', 'Рахимов', 'Сагындыков', 'Турсунов', 'Хамитов',
  'Шакиров', 'Юсупов', 'Ибраев', 'Калиев', 'Омаров', 'Нуртазин',
];
const MEN = [
  'Алан', 'Георгий', 'Марат', 'Расул', 'Сергей', 'Игорь', 'Тимур', 'Ерасыл',
  'Данияр', 'Асхат', 'Бекзат', 'Санжар', 'Диас', 'Алихан', 'Темирлан', 'Нурлан',
  'Арман', 'Ержан', 'Абылай', 'Мади', 'Азамат', 'Дархан', 'Жандос', 'Ильяс',
  'Канат', 'Мирас', 'Олжас', 'Рустам', 'Султан', 'Ануар',
];
const WOMEN = [
  'Аружан', 'Сауле', 'Айгерим', 'Динара', 'Лариса', 'Жанна', 'Камила', 'Асель',
  'Гульнара', 'Мадина', 'Алия', 'Дана', 'Жулдыз', 'Индира', 'Карина', 'Меруерт',
  'Назым', 'Сабина', 'Томирис', 'Айсулу',
];
/** Регион и клуб идут парой: клуб без города в реестре ничего не говорит. */
const PLACES: [string, string][] = [
  ['Астана', 'СКА'], ['Алматы', '«Алатау»'], ['Шымкент', '«Достык»'], ['Караганда', '«Шахтёр»'],
  ['Павлодар', '«Иртыш»'], ['Актобе', 'спортшкола №3'], ['Тараз', '«Жетісу»'], ['Костанай', '«Тобол»'],
  ['Атырау', '«Каспий»'], ['Уральск', '«Жайык»'], ['Семей', '«Ертіс»'], ['Кокшетау', '«Арлан»'],
  ['Талдыкорган', '«Алатау-2»'], ['Актау', '«Каспий-2»'], ['Петропавловск', '«Кызылжар»'],
  ['Туркестан', '«Тұран»'], ['Кызылорда', '«Сырдария»'], ['Экибастуз', '«Оркен»'],
];
const RANKS_FULL = [
  'мастер спорта', 'кандидат в мастера спорта', 'первый разряд', 'второй разряд', 'третий разряд',
];
const RANKS_SHORT = ['МС', 'КМС', '1 разряд', '2 разряд', '3 разряд'];
const COACHES = [
  'Смагулов А.', 'Гладун И.', 'Ким Л.', 'Досжан М.', 'Токаев М.', 'Сериков Н.',
  'Абаева Д.', 'Оралбек Д.', 'Мукашев Б.', 'Тлеуов Е.', 'Каиров Ж.', 'Нургалиева А.',
];

/** Женская форма фамилии: русские на «-ов/-ев/-ин» получают «а», казахские и
    корейские не меняются. */
const she = (nm: string) => (/(ов|ев|ин)$/.test(nm) ? nm + 'а' : nm);

/** Перемешивание номера. Без него у полных тёзок совпадали бы ещё и город,
    клуб, тренер и фотография — три одинаковые строки подряд читались бы как
    сбой, а не как однофамильцы. Считается от номера, поэтому реестр остаётся
    одним и тем же от отрисовки к отрисовке. */
const mix = (i: number, n: number) => (Math.imul(i + 1, 2654435761) >>> 0) % n;

/** Человек по номеру: пол, имя, регион и клуб выводятся из него же. */
const person = (i: number) => {
  /* Пол считается не по одному остатку от номера: длина списка фамилий делится
     на три, и «каждый третий — женщина» намертво привязало бы каждую фамилию к
     одному полу — в реестре не осталось бы ни одной Смагуловой. */
  const w = (i + Math.floor(i / SURN.length)) % 3 === 1;
  const sur = SURN[i % SURN.length];
  /* Имя не идёт следом за фамилией ровным шагом: иначе один и тот же «Смагулов
     Алан» повторялся бы через каждые сорок строк. Шаг взаимно прост с длинами
     списков, поэтому полные тёзки в реестре встречаются, но редко — как в
     настоящем реестре на пять тысяч человек. */
  const step = i * 7 + Math.floor(i / SURN.length);
  const first = w ? WOMEN[step % WOMEN.length] : MEN[step % MEN.length];
  const [city, club] = PLACES[mix(i, PLACES.length)];
  const face = mix(i + 101, 90);
  return { nm: `${w ? she(sur) : sur} ${first}`, av: w ? AW(face) : A(face), city, club, w };
};

/** Спортсмен: рейтинг убывает от номера, поэтому в списке, отсортированном по
    рейтингу, нарисованные вручную остаются наверху. */
const athlete = (i: number): Entry => {
  const p = person(i);
  const year = 1996 + ((i * 7) % 17);
  const rk = (i + Math.floor(i / 7)) % 5;
  const coach = COACHES[mix(i + 7717, COACHES.length)];
  const paid = i % 7 !== 3;
  const val = Math.max(608, 1975 - Math.round(i * 0.26) - (i % 9));
  return {
    av: p.av,
    nm: p.nm,
    sub: `${year} · ${p.city} · ${p.club} · тренер ${coach} · ${RANKS_SHORT[rk]}`,
    val: String(val),
    ok: paid,
    st: paid
      ? 'Годовой взнос 2026 оплачен'
      : 'Взнос не оплачен — заявки на турниры с флагом взноса не пройдут',
    card: [
      { k: 'Год рождения · пол', v: `${year} · ${p.w ? 'женский' : 'мужской'}` },
      { k: 'Разряд', v: RANKS_FULL[rk] },
      { k: 'Регион и клуб', v: `${p.city} · ${p.club}` },
      { k: 'Тренер', v: coach },
    ],
  };
};

/** Категории судей: чем выше категория, тем судей меньше — как в жизни. */
const JUDGE_CATS: [string, string][] = [
  ['Национальная категория', 'национальная'],
  ['Первая категория', 'первая'],
  ['Вторая категория', 'вторая'],
  ['Судья по спорту', 'судья по спорту'],
];

/** Судья: рейтинг судьи (§7.2) считается в баллах с половинами. */
const judgeRow = (i: number): Entry => {
  const p = person(i + 400);
  const c = JUDGE_CATS[i < 12 ? 0 : i < 46 ? 1 : i < 110 ? 2 : 3];
  const ok = i % 23 !== 5;
  const v = String(Math.max(0.5, Math.round((26 - i * 0.12) * 2) / 2)).replace('.', ',');
  return {
    av: p.av,
    nm: p.nm,
    sub: `${c[0]} · ${p.city}${ok ? '' : ' · документ на проверке'}`,
    val: v,
    ok,
    st: ok
      ? 'Категория подтверждена документом'
      : 'Категория не подтверждена — документ на проверке у председателя ГСК',
    card: [
      { k: 'Категория', v: ok ? c[1] : `${c[1]} — на проверке` },
      { k: 'Регион', v: p.city },
      { k: 'Рейтинг судьи', v },
      { k: 'Турниров за сезон', v: String(1 + (i % 5)) },
    ],
  };
};

/** Тренер: за ним стоят его спортсмены, и заявки он подаёт только за них. */
const coachRow = (i: number): Entry => {
  const p = person(i + 800);
  const men = 3 + ((i * 5) % 26);
  const ok = i % 13 !== 4;
  return {
    av: p.av,
    nm: p.nm,
    sub: `${p.city} · ${p.club}${ok ? '' : ' · учётная запись отключена'}`,
    val: String(men),
    ok,
    st: ok
      ? 'Может подавать заявки за своих спортсменов'
      : 'Заявки подавать не может: учётная запись отключена',
    card: [
      { k: 'Регион и клуб', v: `${p.city} · ${p.club}` },
      { k: 'Спортсменов', v: String(men) },
      { k: 'Права подачи заявок', v: ok ? 'за своих спортсменов клуба' : 'нет — учётная запись отключена' },
      { k: 'Учётная запись', v: ok ? 'активна' : 'отключена' },
    ],
  };
};

/** Названия клубов: девятнадцать названий на восемнадцать городов — пара
    «название · город» на всём реестре не повторяется, и строки различимы. */
const CLUB_NAMES = [
  '«Алатау»', '«Барыс»', '«Шахтёр»', '«Иртыш»', '«Достык»', '«Тобол»', '«Жетісу»',
  '«Арлан»', '«Каспий»', '«Сарыарка»', '«Тұран»', '«Ертіс»', '«Жайык»', '«Алтай»',
  '«Кызылжар»', '«Оркен»', '«Сырдария»', '«Ордабасы»', '«Астана»',
];

/** Клуб или организация: спортшкола не клуб, но спортсменов заявляет так же —
    различает их подпись, а не отдельный реестр. */
const clubRow = (i: number): Entry => {
  const [city] = PLACES[(i * 7) % PLACES.length];
  /* Каждая шестая запись — организация, а не клуб: спортшколы в реестре есть,
     но их меньше. */
  const school = i % 6 === 5;
  const nm = school
    ? `Спортшкола №${1 + (i % 9)} · ${city}`
    : `${CLUB_NAMES[i % CLUB_NAMES.length]} · ${city}`;
  const men = 12 + ((i * 11) % 74);
  const ok = i % 17 !== 3;
  const teams = i % 4;
  const league = teams ? `${teams} команд${teams === 1 ? 'а' : 'ы'} в Лиге` : 'команд в Лиге нет';
  return {
    nm,
    sub: `${school ? 'организация, не клуб' : 'клуб'} · ${city} · ${league}${ok ? '' : ' · документы на проверке'}`,
    val: String(men),
    ok,
    st: ok
      ? 'Документы приняты, клуб зарегистрирован'
      : 'Документы на проверке — регистрация не завершена',
    card: [
      { k: 'Тип', v: school ? 'организация, не клуб' : 'клуб' },
      { k: 'Город', v: city },
      { k: 'Спортсменов', v: String(men) },
      { k: 'Команды в Лиге', v: teams ? String(teams) : 'нет' },
    ],
  };
};

/** Счёт записей по-русски, с разделителем тысяч: «5 210», а не «5210». */
const cnt = (n: number) => n.toLocaleString('ru-RU');

/** Достроить реестр до его объёма и раздать строкам ключи. */
const fill = (r: Registry, total: number, make: (i: number) => Entry) => {
  for (let i = r.rows.length; i < total; i++) r.rows.push(make(i));
  r.rows.forEach((e, i) => { e.id = `${r.k}-${i}`; });
  r.n = cnt(r.rows.length);
};

fill(REGISTRIES[0], 5210, athlete);
fill(REGISTRIES[1], 214, judgeRow);
fill(REGISTRIES[2], 96, coachRow);
fill(REGISTRIES[3], 78, clubRow);

/** Роли, выданные человеку: реестровая запись и учётная запись — разные вещи,
    но на экране пользователей их смотрят вместе. Сходятся по имени. */
const grantsOf = (nm: string) => USERS.find((u) => u.nm === nm)?.grants;

/** Число из строки значения: у судьи рейтинг пишется через запятую («27,5»), у
    клуба в той же колонке стоит число спортсменов. Сортировке нужно число. */
const num = (v: string) => Number(v.replace(/\s/g, '').replace(',', '.'));

/** Сколько записей на странице. */
const PER_REG = 20;

/** Колонки, по которым сортируют: кто, значение, состояние. */
type RegKey = 'nm' | 'val' | 'ok';

const REG_GRID_PLAIN = '2.6fr 100px 110px';

/** Таблица реестра — одна на реестры и на пользователей.

    Реестр — это тысячи строк, и лентой строк он не работает: человека в нём
    ищут поиском и сортировкой, а не глазами. Поэтому здесь то же, что в
    составе участников у спортсмена (Э14.5): поиск по строке, сортировка по
    любому столбцу, страницы. Фильтр по состоянию свой у каждого реестра —
    общего слова у взноса, категории и документов нет.

    Кнопок в строках нет ✳ (31.08.2026, решение владельца продукта): строка
    нажимается целиком и открывает карточку человека (Э1.5), а роль выдают уже
    оттуда — диалогом Э1.11. Прежде в каждой строке стояла кнопка «Выдать
    роль»: она спорила со строкой за клик, занимала колонку на всю таблицу и
    на реестре в тысячи строк превращала его в частокол одинаковых кнопок. */
const RegTable = ({
  r,
  onOpen,
  phone,
}: {
  r: Registry;
  onOpen: (e: Entry) => void;
  /** Второй формат ✳: та же таблица строками — в 392 px четыре колонки со
      своими заголовками не читаются. Поиск, фильтр, сортировка и страницы
      остаются те же: это один компонент, а не второй реестр. */
  phone?: boolean;
}) => {
  const [q, setQ] = useState('');
  const [f, setF] = useState('Все');
  /* По умолчанию — по значению вниз: реестр открывают на сильнейших, а не на
     первой букве алфавита. */
  const [sort, setSort] = useState<{ k: RegKey; up: boolean }>({ k: 'val', up: false });
  const [page, setPage] = useState(0);

  const t = q.trim().toLowerCase();
  const found = r.rows.filter((e) => {
    if (f === r.flt[0] && !e.ok) return false;
    if (f === r.flt[1] && e.ok) return false;
    return !t || e.nm.toLowerCase().includes(t) || e.sub.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const v =
      sort.k === 'nm'
        ? a.nm.localeCompare(b.nm, 'ru')
        : sort.k === 'ok'
          ? Number(a.ok) - Number(b.ok)
          : num(a.val) - num(b.val);
    return sort.up ? v : -v;
  });
  const pages = Math.max(1, Math.ceil(rows.length / PER_REG));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PER_REG, cur * PER_REG + PER_REG);

  /* Первый клик по столбцу сортирует так, как по нему смотрят: по алфавиту от
     «А», по состоянию — неоплаченными вверх (их и разбирают), по значению —
     от большего. Повторный клик переворачивает. */
  const pick = (k: RegKey) => {
    setSort({ k, up: sort.k === k ? !sort.up : k !== 'val' });
    setPage(0);
  };

  const grid = REG_GRID_PLAIN;
  const cols: ReactNode[] = [
    <Th key="nm" t={r.who} on={sort.k === 'nm'} onClick={() => pick('nm')} />,
    <Th key="val" t={r.cols[0]} on={sort.k === 'val'} onClick={() => pick('val')} />,
    <Th key="ok" t={r.cols[1]} on={sort.k === 'ok'} onClick={() => pick('ok')} />,
  ];

  const total = rows.length === r.rows.length ? `${r.n} в реестре` : `найдено ${cnt(rows.length)} из ${r.n}`;
  const seen = rows.length
    ? `${cnt(cur * PER_REG + 1)}–${cnt(cur * PER_REG + shown.length)} из ${cnt(rows.length)}`
    : '0 из 0';

  /* Полоса поиска и фильтра: на десктопе одной строкой, на телефоне — друг под
     другом. Срез состояния у реестров длинный («Категория подтверждена / Не
     подтверждена»), поэтому на телефоне он ещё и прокручивается вбок. */
  const head = (
    <div className={'mb-3 flex gap-3 ' + (phone ? 'flex-col' : 'items-center')}>
      <SearchInput
        value={q}
        onChange={(v) => { setQ(v); setPage(0); }}
        placeholder={r.find}
        className={phone ? 'w-full' : 'w-72'}
      />
      {phone ? (
        <Swipe>
          <FilterSeg items={['Все', ...r.flt]} active={f} onPick={(v) => { setF(v); setPage(0); }} />
        </Swipe>
      ) : (
        <FilterSeg items={['Все', ...r.flt]} active={f} onPick={(v) => { setF(v); setPage(0); }} />
      )}
      <span className={'whitespace-nowrap text-[12.5px] text-neutral-500' + (phone ? '' : ' ml-auto')}>
        {total}
      </span>
    </div>
  );

  if (phone) {
    return (
      <>
        {head}
        <Rows>
          {shown.map((e) => (
            /* В строке остаётся то, ради чего в реестр и смотрят: кто это,
               главное значение (рейтинг или сколько за ним людей) и состояние
               галочкой. Регион, клуб и тренер — второй строкой подписью. */
            <div
              key={e.id ?? e.nm}
              role="button"
              tabIndex={0}
              data-row
              onClick={() => onOpen(e)}
              className="cursor-pointer px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <Who av={e.av} nm={e.nm} sub={e.sub} />
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold tabular-nums">{e.val}</span>
                  <span
                    title={e.st}
                    className={
                      'inline-flex h-5 w-5 items-center justify-center rounded-full ' +
                      (e.ok ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400')
                    }
                  >
                    {e.ok ? <Check size={13} /> : <Minus size={13} />}
                  </span>
                </span>
              </div>
            </div>
          ))}
          {shown.length === 0 && (
            <NoRows>Ничего не нашлось — проверьте написание или снимите фильтр.</NoRows>
          )}
        </Rows>
        <div className="mt-1 flex flex-col gap-1">
          <span className="text-[12.5px] text-neutral-500">{seen}</span>
          {/* Страниц у реестра спортсменов больше двух с половиной сотен, и
              окно номеров с «Назад» и «Вперёд» в 392 px не помещается. */}
          <Swipe>
            <Pager page={cur} pages={pages} onPick={setPage} />
          </Swipe>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Поиск, фильтр и счёт — одной полосой: три отдельных ряда над таблицей
          съедали её же высоту, а вместе они одно действие — «сузить список». */}
      {head}

      <Sheet grid={grid} cols={cols}>
        {shown.map((e) => (
          /* Карточку открывает сама строка, а не кнопка «Открыть»: строка и
             так про этого человека, и отдельная кнопка занимала колонку,
             повторяя то, что делает клик по имени. */
          <div
            key={e.id ?? e.nm}
            role="button"
            tabIndex={0}
            data-row
            onClick={() => onOpen(e)}
            className="grid cursor-pointer items-center gap-3 px-4 py-2 text-[13px] hover:bg-neutral-50"
            style={{ gridTemplateColumns: grid }}
          >
            <Who av={e.av} nm={e.nm} sub={e.sub} />
            <span className="font-semibold tabular-nums">{e.val}</span>
            {/* Состояние — галочкой: в колонке с заголовком слово повторялось
                бы столько раз, сколько строк. Что именно значит — в подсказке. */}
            <span>
              <span
                title={e.st}
                className={
                  'inline-flex h-5 w-5 items-center justify-center rounded-full ' +
                  (e.ok ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400')
                }
              >
                {e.ok ? <Check size={13} /> : <Minus size={13} />}
              </span>
            </span>
          </div>
        ))}
        {shown.length === 0 && (
          <NoRows>Ничего не нашлось — проверьте написание или снимите фильтр.</NoRows>
        )}
      </Sheet>

      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-neutral-500">{seen}</span>
        <Pager page={cur} pages={pages} onPick={setPage} />
      </div>
    </>
  );
};

/** Карточка записи диалогом: смотрят её мельком, из списка, и уходить с места
    в списке ради этого незачем. `roles` — показывать ли выданные роли: на
    экране пользователей они и есть главное, в реестре им не место. */
const RegCard = ({
  e,
  r,
  roles,
  onClose,
  to,
  phone,
}: {
  e: Entry;
  r: Registry;
  roles?: boolean;
  onClose: () => void;
  to: string;
  /** Второй формат: поля карточки идут в одну колонку. */
  phone?: boolean;
}) => {
  const g = grantsOf(e.nm);
  return (
    <InlineDialog
      title={e.nm}
      sub={`${r.k} · ${e.sub}`}
      to={to}
      foot={
        <>
          <span className="mr-auto text-xs text-neutral-500">{e.st}</span>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          {r.to && <Btn>Открыть полностью</Btn>}
        </>
      }
    >
      <FormGrid>
        {e.card.map((f) => (
          <FieldView key={f.k} label={f.k} value={f.v} wide={phone} />
        ))}
        <Derived k={r.cols[0]} v={e.val} />
      </FormGrid>
      {roles && (
        <>
          <Sec>Роли · кто выдал и когда</Sec>
          {g ? (
            <Rows>
              {g.map((x) => (
                <Row key={x.nm} nm={x.nm} sub={x.sub} action="Отозвать" />
              ))}
            </Rows>
          ) : (
            /* Запись в реестре и учётная запись — разные вещи: человек может
               быть в реестре и не иметь входа в систему. */
            <Bar tone="warning">
              Учётной записи нет: человек есть в реестре, но в систему не входит. Роль выдаётся
              вместе с аккаунтом ⚠
            </Bar>
          )}
        </>
      )}
    </InlineDialog>
  );
};

/* ── Э1.5 · Пользователи и роли ────────────────────────────────── */

/** Подпись вкладки реестра: название и живой счёт записей. */
const regTab = (r: Registry) => `${r.k} · ${r.n}`;

export function Users1_5() {
  /* Экран показывает реестр, а не отдельный список учётных записей: роль
     выдают человеку, а человек живёт в реестре. Два списка одних и тех же
     людей заставляли прыгать между экранами, чтобы понять, кто это и что ему
     можно. */
  const [reg, setReg] = useState(REGISTRIES[0].k);
  const [open, setOpen] = useState<Entry | null>(null);
  const r = REGISTRIES.find((x) => x.k === reg)!;
  return (
    <WebApp role={R01} nav="Пользователи" title="Пользователи и роли">
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg
          items={REGISTRIES.map(regTab)}
          active={regTab(r)}
          onPick={(v) => {
            const hit = REGISTRIES.find((x) => regTab(x) === v);
            if (hit) { setReg(hit.k); setOpen(null); }
          }}
        />
        <Button variant="primary" data-to="Э1.10">
          <UserPlus size={15} /> Пригласить человека
        </Button>
      </div>
      {/* «Выдать роль» стоит в строке: роль выдают конкретному человеку, и
          выбирать его надо там же, где на него смотрят. `key` по реестру: у
          каждой вкладки свой поиск, свой фильтр и своя страница — вкладки это
          четыре разных списка, а не один с фильтром. */}
      <RegTable key={r.k} r={r} onOpen={setOpen}  />
      {open && <RegCard e={open} r={r} roles onClose={() => setOpen(null)} to="Э1.5" />}
    </WebApp>
  );
}

/** Пользователи и роли на телефоне ✳: тот же реестр строками, вкладки реестров
    прокруткой вбок, «Пригласить человека» — кнопкой во всю ширину. */
const Users1_5Phone = () => {
  const [reg, setReg] = useState(REGISTRIES[0].k);
  const [open, setOpen] = useState<Entry | null>(null);
  const r = REGISTRIES.find((x) => x.k === reg)!;
  return (
    <PhoneRoleApp role={R01} nav="Пользователи" title="Пользователи и роли">
      <div className="mb-2">
        <Swipe>
          <FilterSeg
            items={REGISTRIES.map(regTab)}
            active={regTab(r)}
            onPick={(v) => {
              const hit = REGISTRIES.find((x) => regTab(x) === v);
              if (hit) { setReg(hit.k); setOpen(null); }
            }}
          />
        </Swipe>
      </div>
      <div className="mb-3">
        <Button className="w-full" variant="primary" data-to="Э1.10">
          <UserPlus size={15} /> Пригласить человека
        </Button>
      </div>
      <RegTable key={r.k} r={r} onOpen={setOpen}  phone />
      {open && (
        <PhoneDialog>
          <RegCard e={open} r={r} roles phone onClose={() => setOpen(null)} to="Э1.5" />
        </PhoneDialog>
      )}
    </PhoneRoleApp>
  );
};

const Users1_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Попытка выдать роль «главный судья» ✳"
      text="Подсказка, что на официальный турнир судью назначает председатель ГСК через заявки, а не этот экран."
    >
      <Frag>
        <Rows>
          <Row
            av={A(76)}
            nm="Оспанов Тимур"
            sub="Главный судья · Кубок РК · назначил председатель ГСК, 12.04.2026"
            pill={{ t: 'НАЗНАЧЕН ГСК', cls: 'reg' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            У этой роли нет ни «Выдать», ни «Отозвать»: она появилась из решения по заявке судьи.
            Снять её можно только сменой главного судьи на турнире.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.8 — один аккаунт на федерацию или несколько"
      text="Не решено и то, нужен ли технический администратор без доступа к спортивным решениям."
    >
      <Frag>
        <Rows>
          <Row av={AW(44)} nm="Абаева Динара" sub="Администратор Федерации · система · бессрочно" pill={{ t: 'АКТИВЕН', cls: 'live' }} />
          <Row av={A(60)} nm="Сериков Нурлан" sub="Экономист · система · бессрочно" pill={{ t: 'АКТИВЕН', cls: 'live' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Сколько людей держат роль администратора и нужен ли отдельный технический администратор —
            без доступа к спортивным решениям и персональным данным — федерация ещё не ответила.
          </Bar>
        </div>
      </Frag>
    </Shot>

    {/* Зона «Реестр»: карточка окном с ролями. На самом экране она открывается
        по клику на строку, и в снимке борда её не видно — а «кто выдал и
        когда» вместе с «Отозвать» живут только в ней. */}
    <Shot
      tone="info"
      title="Карточка человека окном — роли, кто выдал и когда"
      text="Открывается кликом по строке реестра: каждая выданная роль с автором, датой и сроком, рядом «Отозвать»."
      wide
    >
      <Frag w={520}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-neutral-500">
            Пак Сергей · судьи · первая категория · Павлодар
          </span>
          <P t="АКТИВЕН" cls="live" />
        </div>
        <Sec>Роли · кто выдал и когда</Sec>
        <Rows>
          {USERS.find((u) => u.nm === 'Пак Сергей')!.grants.map((g) => (
            <Row key={g.nm} nm={g.nm} sub={g.sub} action="Отозвать" />
          ))}
        </Rows>
        <div className="mt-3">
          <Bar>
            Отзыв закрывает доступ сразу; всё, что человек сделал в этой роли, остаётся в журнале с
            его именем (§12).
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.10 · Приглашение человека ──────────────────────────────── */

/** Тело экрана приглашения — одно на оба формата ✳: содержание, поля и подписи
    те же, меняется только раскладка (поля в одну колонку, кнопки этажами). */
const NewUser1_10Body = ({ phone }: { phone?: boolean } = {}) => (
  <>
      <Panel title="Человек и контакты">
        <FormGrid>
          <TextInput label="Фамилия" value="Абдрахманова" wide={phone} />
          <TextInput label="Имя, отчество" value="Айгерим Ерлановна" wide={phone} />
          <TextInput label="Год рождения ✳" value="1994" wide={phone} />
          <TextInput label="Телефон" value="+7 707 118 44 03" placeholder="+7 ___ ___ __ __" wide={phone} />
          <TextInput label="Почта" value="a.abdrakhmanova@ttfrk.kz" placeholder="имя@домен" wide={phone} />
          <FieldView label="Хотя бы один контакт ✳" value="телефон и почта заполнены" wide={phone} />
        </FormGrid>
      </Panel>

      {/* Приглашение — одна ссылка, а не выбор «почта или SMS».

          Канал выбирать незачем: ссылку администратор отправляет чем угодно —
          мессенджером, письмом, надиктовывает по телефону, и системе не нужно
          ни знать этот канал, ни уметь слать письма с SMS. Себя человек
          подтверждает сам, открыв ссылку: ИИН и одноразовым кодом ✳
          (30.08.2026) — пароля в системе нет. */}
      <Panel title="Приглашение — ссылка ✳">
        {/* На телефоне поле и «Скопировать» встают друг под другом: ссылка
            длинная, и делить с кнопкой одну строку ей нечем. */}
        <div className={'flex gap-2 ' + (phone ? 'flex-col' : 'items-end')}>
          <div className="min-w-0 flex-1">
            <TextInput label="Ссылка приглашения" value="https://ttfrk.kz/invite/8f3a-91c2-4d70" wide />
          </div>
          <Btn>
            <Copy size={14} /> Скопировать
          </Btn>
        </div>
        {/* Ссылка и правило под ней — один блок: правило объясняет поле над
            собой. Про то, что канал отправки любой, здесь не пишем — это
            следует из того, что канала на экране нет. */}
        <p className="mt-2 text-[12.5px] text-neutral-500">
          Одноразовая, действует 7 дней ✳. Пересланная ссылка чужого не пустит: открыв её, человек
          подтверждает себя ИИН и кодом из SMS (Э0.6).
        </p>
      </Panel>

      {/* `flex-col-reverse` на телефоне: порядок в разметке остаётся прежним, а
          главное действие встаёт первым — в столбик оно должно быть сверху. */}
      <div className={'flex gap-2 ' + (phone ? 'flex-col-reverse' : 'items-center justify-end')}>
        <QuietAction>Выдать роль сразу</QuietAction>
        <Button className={phone ? 'w-full' : undefined} variant="primary">
          <Send size={15} /> Пригласить и получить ссылку
        </Button>
      </div>
  </>
);

export function NewUser1_10() {
  return (
    <WebApp
      role={R01}
      nav="Пользователи"
      title="Пригласить человека"
      back={{ label: 'Пользователи и роли', to: 'Э1.5' }}
    >
      <NewUser1_10Body />
    </WebApp>
  );
}

/** Приглашение человека на телефоне ✳. */
const NewUser1_10Phone = () => (
  <PhoneRoleApp
    role={R01}
    nav="Пользователи"
    title="Пригласить человека"
    back={{ label: 'Пользователи и роли', to: 'Э1.5' }}
  >
    <NewUser1_10Body phone />
  </PhoneRoleApp>
);

const NewUser1_10States = () => (
  <States>
    <Shot
      tone="warning"
      title="Найден похожий человек ✳"
      text="Система сама сверяет ФИО, год рождения и город и предлагает связать, а не заводить вторую запись."
    >
      <Frag>
        <Rows>
          <Row
            av={AW(32)}
            nm="Абдрахманова Айгерим Ерлановна"
            sub="1994 · Астана · судья второй категории · есть в реестре"
            pill={{ t: 'СОВПАДЕНИЕ', cls: 'wait' }}
          />
        </Rows>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline">Связать с этой записью</Button>
          <Button size="sm" variant="ghost">Всё равно завести новую</Button>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Срок ссылки вышел ✳"
      text="Вместо ссылки — «выпустить новую»; старая больше не работает."
    >
      <Frag>
        <Rows>
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13.5px] font-medium">https://ttfrk.kz/invite/8f3a-91c2-4d70</span>
              <span className="block truncate text-xs text-red-600">выпущена 07.04.2026 · срок вышел 14.04.2026 · не открыта</span>
            </span>
            <P t="ПРОСРОЧЕНА" cls="bad" />
            <Button size="sm" variant="outline">Выпустить новую</Button>
          </div>
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">
            Учётной записи так и не появилось: человек не открыл ссылку и не подтвердил себя ИИН и
            кодом — входить ему не подо что (Э0.6).
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.11 · Выдача роли ───────────────────────────────────────── */

/* Область выдачи: система / турнир / клуб / стол по флоу, плюс регион ✳.

   Региона в списке ТЗ нет, а он нужен: старший тренер региона (роль 12) работает
   своим регионом и только им — «заявить спортсмена не своего региона» ему прямо
   запрещено (ROLES.md §12). Системой его выдать нельзя, турниром и клубом — тоже.
   Это дырка в перечне областей, её надо подтвердить с федерацией. */
type Scope = 'Система' | 'Регион' | 'Турнир' | 'Клуб' | 'Стол';

/** Регионы — области Казахстана и три города республиканского значения. */
const REGIONS = [
  'Абайская область', 'Акмолинская область', 'Актюбинская область', 'Алматинская область',
  'Атырауская область', 'Восточно-Казахстанская область', 'Жамбылская область',
  'Жетысуская область', 'Западно-Казахстанская область', 'Карагандинская область',
  'Костанайская область', 'Кызылординская область', 'Мангистауская область',
  'Павлодарская область', 'Северо-Казахстанская область', 'Туркестанская область',
  'Улытауская область', 'г. Астана', 'г. Алматы', 'г. Шымкент',
];

/** Клубы — те же, что в реестрах и на экране взносов. */
const CLUBS = [
  '«Алатау» · Алматы', '«Барыс» · Астана', '«Шахтёр» · Караганда',
  '«Иртыш» · Павлодар', '«Достык» · Шымкент',
];

/** Роль выдают на то, что ещё не кончилось: завершённый турнир прав не даёт. */
const GRANTABLE = TOURS.filter((t) => t.st !== 'ЗАВЕРШЁН');

/** Сколько столов у турнира — по категории: у главного старта их больше, чем у
    однодневного ОРТ. В регламенте столы задаются турниру отдельно, здесь
    довольно типового числа: полю стола нужен диапазон. */
const TABLES: Record<Cat, number> = { 'Главный старт': 16, 'Лига': 10, 'ОРТ': 8 };

/** Последний день турнира — им же кончается роль, выданная на этот турнир. */
const till = (t: Tour) =>
  `до ${t.d.split('–').pop()!.padStart(2, '0')}.${String(t.m + 1).padStart(2, '0')}.2026`;

/** Срок для областей без привязки к турниру. */
const TERMS = ['до 31.12.2026 — по конец сезона', 'бессрочно'];

/** Объект области: что именно выбирают, выбрав систему, регион, клуб, турнир
    или стол.

    **Стол — единственная область с двойным выбором**: сначала турнир, потом
    стол в нём. Стол сам по себе не адрес: «судья на стол 4» без турнира ничего
    не значит, столы нумеруются заново на каждом соревновании.

    **Срок у турнира и стола не выбирают** — он следует из турнира. Иначе
    область перестаёт работать: можно выдать судье доступ, который переживёт
    турнир, ради которого выдавался. У системы, региона и клуба такой привязки
    нет, там срок выбирается.

    Выбор — статичный PickField (порталов в макетах нет); регион, клуб и стол
    показаны первыми значениями списков REGIONS/CLUBS/TABLES. */
const ScopeFields = ({ scope, phone }: { scope: Scope; phone?: boolean }) => {
  const t = GRANTABLE[0];
  if (scope === 'Система') {
    return (
      <FormGrid>
        <FieldView label="Область" value="Вся система" wide={phone} />
        <PickField label="Срок" value="бессрочно" wide={phone} />
      </FormGrid>
    );
  }
  if (scope === 'Регион' || scope === 'Клуб') {
    return (
      <FormGrid>
        <PickField
          label={scope === 'Регион' ? 'Регион ✳' : 'Клуб'}
          value={scope === 'Регион' ? REGIONS[18] : CLUBS[0]}
          wide={phone}
        />
        <PickField label="Срок" value={TERMS[0]} wide={phone} />
      </FormGrid>
    );
  }
  return (
    <FormGrid>
      <PickField label="Турнир" value={t.nm} wide={scope === 'Турнир' || phone} />
      {scope === 'Стол' && (
        <PickField label="Стол — из столов этого турнира" value={`Стол 1 из ${TABLES[t.cat]}`} wide={phone} />
      )}
      {/* Срок не выбирают — он следует из турнира, поэтому и нарисован иначе:
          строкой без рамки, а не полем. Объяснять это плашкой не нужно, форма
          сама показывает разницу. */}
      <Derived k="Срок — до завершения турнира" v={`ориентировочно по ${till(t)}`} />
    </FormGrid>
  );
};

/** Роль в диалоге выдачи: какие ей доступны области и что она даёт человеку.

    Сводка прав — главное в этом экране: выдающий должен видеть, что именно
    раздаёт (флоу Э1.11). Формулировки — из ROLES.md «Что может нажать»; только
    то, что роль даёт. Запретов в списке нет: экран отвечает на «что человек
    сможет», и перечислять в нём то, чего он не сможет, — значит отвечать на
    вопрос, который здесь не задавали. */
type Grant = {
  nm: string;
  /** Области, которыми роль выдаётся. Первая — по умолчанию. */
  scopes: Scope[];
  can?: { nm: string; sub: string }[];
  /** Роль не раздаётся руками — почему. */
  block?: string;
  /** Функционал в документе федерации не заполнен (ROLES.md, вопрос 12.1). */
  open?: string;
};

const GRANTS: Grant[] = [
  {
    nm: 'Администратор Федерации',
    scopes: ['Система'],
    can: [
      { nm: 'Заводить соревнования и править регламент', sub: 'календарь, карточка турнира, отмена и перенос' },
      { nm: 'Заводить аккаунты и выдавать роли', sub: 'этот же диалог — роль передаётся дальше' },
    ],
  },
  {
    nm: 'Экономист',
    scopes: ['Система'],
    can: [
      { nm: 'Отмечать оплату годового взноса', sub: 'и снимать отметку с причиной ✳' },
      { nm: 'Выгружать списки по взносам', sub: 'по региону, клубу, состоянию оплаты' },
    ],
  },
  {
    nm: 'Менеджер по спорту',
    scopes: ['Система'],
    can: [
      { nm: 'Смотреть и выгружать любой модуль', sub: 'календарь, заявки, сетки, взносы, рейтинг' },
      { nm: 'Подписываться на соревнование ✳', sub: 'уведомления о смене состояния' },
    ],
  },
  {
    nm: 'Менеджер соревнований',
    scopes: ['Система'],
    can: [
      { nm: 'Смотреть и выгружать любой модуль', sub: 'то же, что у менеджера по спорту' },
      { nm: 'Подписываться на соревнование ✳', sub: 'уведомления о смене состояния' },
    ],
  },
  {
    nm: 'Председатель ГСК',
    scopes: ['Система'],
    can: [
      { nm: 'Назначать главного судью и наряд', sub: 'из заявок судей на турнир' },
      { nm: 'Утверждать протоколы и решать апелляции', sub: 'и возвращать с причиной' },
    ],
  },
  {
    nm: 'Главный судья',
    scopes: ['Турнир'],
    block:
      'Эта роль не раздаётся руками: судьи подают заявки на судейство, председатель ГСК выбирает ' +
      'одного, и он становится главным судьёй турнира.',
    can: [
      { nm: 'Принимать заявки и собирать сетку', sub: 'посев или жеребьёвка, расписание по столам' },
      { nm: 'Ставить судей на столы и вести протокол', sub: 'исправление счёта идёт через него' },
    ],
  },
  {
    nm: 'Главный секретарь',
    scopes: ['Турнир'],
    can: [
      { nm: 'Проводить жеребьёвку и собирать сетку', sub: 'вместе с главным судьёй' },
      { nm: 'Оформлять и печатать протокол', sub: 'итоговый протокол турнира' },
    ],
  },
  {
    nm: 'Заместитель судьи',
    scopes: ['Турнир'],
    open:
      'Функционал этой роли в документе федерации не заполнен — вопрос 12.1. Неизвестно даже ' +
      'главное: права те же, что у главного судьи, но только в его отсутствие, или постоянно. ' +
      'Пока на вопрос нет ответа, выдавать роль нечем — сводки прав не существует.',
  },
  {
    nm: 'Судья',
    scopes: ['Турнир', 'Стол'],
    can: [
      { nm: 'Вести счёт на своём столе', sub: 'матч не стартует, пока стол без судьи' },
      { nm: 'Видеть расписание и вызовы', sub: 'уведомление о вызове пары приходит мгновенно' },
    ],
  },
  {
    nm: 'Инспектор',
    scopes: ['Турнир', 'Система'],
    can: [
      { nm: 'Создавать заключение по турниру', sub: 'с материалами; уходит в ГСК' },
      { nm: 'Смотреть, фильтровать, выгружать', sub: 'весь турнир целиком' },
    ],
  },
  {
    nm: 'Главный тренер',
    scopes: ['Система'],
    open:
      'Функционал этой роли в документе федерации не заполнен — вопрос 12.1. Он смотрит составы и ' +
      'рейтинги или ещё и заявляет сборную на международные старты, которых в календаре пока нет? ' +
      'В матрице ему проставлено только чтение, и это наше допущение, а не решение федерации.',
  },
  {
    nm: 'Старший тренер региона',
    scopes: ['Регион'],
    can: [
      { nm: 'Регистрировать спортсменов своего региона', sub: 'с документами; заявка списком' },
      { nm: 'Подавать заявку на главные старты', sub: 'только он заявляет на них состав' },
    ],
  },
  {
    nm: 'Администратор клуба',
    scopes: ['Клуб'],
    can: [
      { nm: 'Вести клуб: спортсмены, тренеры, команды', sub: 'и заявлять команду в Лигу' },
      { nm: 'Заводить клубные турниры', sub: 'с флагами: судьи, рейтинг, плата, ценз' },
    ],
  },
  {
    nm: 'Спортсмен',
    scopes: ['Система'],
    can: [
      { nm: 'Заявляться на ОРТ и клубные турниры', sub: 'сам за себя; платить годовой взнос' },
      { nm: 'Смотреть свой рейтинг и матчи', sub: 'и сетки с расписанием' },
    ],
  },
];

/** Выбор роли — раскрывающийся список внутри диалога, а не портал: ролей
    четырнадцать, кнопками они занимали четыре строки, а закрытый список
    оставляет место сводке прав. Раскрытие рисуется на месте, вниз. */
const RolePick = ({ value, onPick }: { value: string; onPick: (g: Grant) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500">Роль</span>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
      >
        {value}
        <ChevronDown size={14} className={'text-neutral-400 ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="max-h-44 overflow-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          {GRANTS.map((g) => (
            <button
              key={g.nm}
              type="button"
              onClick={() => { onPick(g); setOpen(false); }}
              className={
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-neutral-50 ' +
                (g.nm === value ? 'bg-blue-50/60 font-medium' : '')
              }
            >
              <span className="w-4">{g.nm === value && <Check size={13} className="text-blue-600" />}</span>
              {g.nm}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Диалог выдачи роли — один на оба формата ✳: роль, область и сводка прав
    живут в нём, снаружи остаётся только «открыт или нет». На телефоне поля
    области идут в одну колонку, а сам набор областей прокручивается вбок. */
const GrantDialog = ({ phone, onClose }: { phone?: boolean; onClose: () => void }) => {
  const [role, setRole] = useState('Судья');
  const [scope, setScope] = useState<Scope>('Турнир');
  const g = GRANTS.find((x) => x.nm === role)!;
  /* Область переключается вместе с ролью: у судьи это турнир или стол, у
     администратора клуба — только клуб. Оставить прежнюю было бы враньём —
     диалог показал бы область, которой у роли не бывает. */
  const pick = (x: Grant) => {
    setRole(x.nm);
    setScope(x.scopes[0]);
  };
  return (
    <InlineDialog
      title="Выдать роль"
      sub="Пак Сергей · +7 705 431 20 18 · уже есть роль «Судья стола · стол 4»"
      to="Э1.5"
      foot={
        <>
          <span className={phone ? undefined : 'mr-auto'}>
            <QuietAction onPress={onClose}>Закрыть</QuietAction>
          </span>
          {g.block || g.open ? (
            <DisabledAction>Выдать</DisabledAction>
          ) : (
            <Button variant="primary">Выдать</Button>
          )}
        </>
      }
    >
      <RolePick value={role} onPick={pick} />
      <Sec>Область — состав зависит от роли</Sec>
      {/* Недоступные области не показываем серыми — их просто нет: у роли
          они не бывают, и выбор из одной кнопки сам это говорит. */}
      <div className="mb-3">
        {phone ? (
          <Swipe>
            <FilterSeg items={g.scopes} active={scope} onPick={(v) => setScope(v as Scope)} />
          </Swipe>
        ) : (
          <FilterSeg items={g.scopes} active={scope} onPick={(v) => setScope(v as Scope)} />
        )}
      </div>
      {/* Ключ по области сбрасывает выбор при её смене: турнир, выбранный
          для стола, не должен всплыть в клубе. */}
      <ScopeFields key={scope} scope={scope} phone={phone} />
      <Sec>Что человек сможет ✳</Sec>
      {g.open ? (
        <Bar tone="warning">{g.open} ⚠</Bar>
      ) : (
        <>
          {g.block && <Bar tone="danger">{g.block}</Bar>}
          {/* Значка «ДА» у строк нет: заголовок зоны уже сказал, что это
              список того, что человек сможет, и метка на каждой строке
              повторяет его четырежды. */}
          <Rows>
            {g.can!.map((c) => (
              <Row key={c.nm} nm={c.nm} sub={c.sub} />
            ))}
          </Rows>
        </>
      )}
    </InlineDialog>
  );
};

export function GrantRole1_11() {
  /* Диалог открыт по умолчанию: экран Э1.11 — это и есть выдача роли, и в борде
     колонка должна показывать её, а не список под ней. Крестик закрывает,
     «Выдать роль» в строке открывает снова. */
  const [open, setOpen] = useState(true);
  return (
    <WebApp role={R01} nav="Пользователи" title="Пользователи и роли">
      {/* Под диалогом — тот же экран, с которого пришли (Э1.5), и тот же реестр:
          закрыл крестиком — вернулся ровно туда, откуда нажал «Выдать роль». */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg
          items={REGISTRIES.map(regTab)}
          active={regTab(REGISTRIES[1])}
          onPick={() => {}}
        />
        <Button variant="primary" data-to="Э1.10">
          <UserPlus size={15} /> Пригласить человека
        </Button>
      </div>
      <RegTable r={REGISTRIES[1]} onOpen={() => setOpen(true)}  />

      {open && <GrantDialog onClose={() => setOpen(false)} />}
    </WebApp>
  );
}

/** Выдача роли на телефоне ✳: под диалогом тот же реестр судей строками. */
const GrantRole1_11Phone = () => {
  const [open, setOpen] = useState(true);
  return (
    <PhoneRoleApp role={R01} nav="Пользователи" title="Пользователи и роли">
      <div className="mb-2">
        <Swipe>
          <FilterSeg items={REGISTRIES.map(regTab)} active={regTab(REGISTRIES[1])} onPick={() => {}} />
        </Swipe>
      </div>
      <div className="mb-3">
        <Button className="w-full" variant="primary" data-to="Э1.10">
          <UserPlus size={15} /> Пригласить человека
        </Button>
      </div>
      <RegTable r={REGISTRIES[1]} onOpen={() => setOpen(true)}  phone />
      {open && (
        <PhoneDialog>
          <GrantDialog phone onClose={() => setOpen(false)} />
        </PhoneDialog>
      )}
    </PhoneRoleApp>
  );
};

const GrantRole1_11States = () => (
  <States>
    <Shot
      tone="danger"
      title="Выбрана роль «Главный судья соревнований»"
      text="Выдать нельзя: на официальный турнир судью назначает председатель ГСК через заявки."
    >
      <Frag>
        <div className="mb-3 flex flex-wrap gap-1">
          <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] text-neutral-600">Судья</span>
          <span className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-[12.5px] font-medium text-red-700">Главный судья</span>
          <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] text-neutral-600">Инспектор</span>
        </div>
        <Bar tone="danger">
          Эта роль не раздаётся руками: судьи подают заявки на судейство, председатель ГСК выбирает
          одного, и он становится главным судьёй турнира.
        </Bar>
        <DisabledAction>Выдать</DisabledAction>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Выбрана роль с незаполненным функционалом ⚠"
      text="Вместо сводки прав стоит сам вопрос 12.1, «Выдать» неактивна — выдавать нечем."
    >
      <Frag>
        <Bar tone="warning">
          Заместитель главного судьи и главный тренер национальной команды: функционала в документе
          федерации нет (вопрос 12.1). Пока не сказано, что роль даёт, сводки прав не существует.
        </Bar>
        <DisabledAction>Выдать</DisabledAction>
      </Frag>
    </Shot>

    <Shot tone="warning" title="Срок указан в прошлом" text="«Выдать» неактивна.">
      <Frag w={480}>
        <FormGrid>
          <FieldView label="Роль и область" value="Судья · Кубок Республики Казахстан 2026" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Срок</span>
            <span className="w-full rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
              до 20.05.2025 — дата уже прошла
            </span>
          </div>
        </FormGrid>
        <div className="mt-3"><DisabledAction>Выдать</DisabledAction></div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.12 · Карточка спортсмена ───────────────────────────────── */

/** Тело карточки спортсмена — одно на оба формата ✳: те же панели в том же
    порядке, на телефоне поля профиля идут в одну колонку, а полоса действий
    складывается под подпись про журнал. */
const Athlete1_12Body = ({ phone }: { phone?: boolean } = {}) => (
  <>
      <div className={'mb-3 flex ' + (phone ? 'flex-col gap-3' : 'items-center justify-between gap-4')}>
        <span className="text-[12.5px] text-neutral-500">
          Каждая правка профиля пишется в журнал: кто, когда, было → стало
        </span>
        <span className="flex flex-wrap gap-2">
          <Btn>Действия по человеку</Btn>
          <QuietAction>
            <GitMerge size={14} /> Объединить с другой записью
          </QuietAction>
          <Button size="sm" variant="outline">Править</Button>
        </span>
      </div>

      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          узкая правая половина резала подписи рейтинга и взноса, а «Историю
          матчей» жала до полутора третей экрана. Порядок сверху вниз — от «кто
          это» к тому, что он наиграл: профиль, показатели, взнос, лента матчей. */}
      <Panel title="Профиль" extra={<P t="ЗАРЕГИСТРИРОВАЛСЯ САМ" cls="reg" />}>
        <FormGrid>
          <FieldView label="Год рождения · пол" value="2004 · мужской" wide={phone} />
          <FieldView label="Разряд" value="кандидат в мастера спорта" wide={phone} />
          <FieldView label="Регион и клуб" value="Алматы · «Алатау»" wide={phone} />
          <FieldView label="Тренер" value="Смагулов Асхат" wide={phone} />
          <FieldView label="Источник записи ✳" value="зарегистрировался сам, 11.01.2026 · подтвердил клуб «Алатау»" wide />
        </FormGrid>
      </Panel>

      <Panel title="Рейтинг">
        <Cells
          items={[
            { v: '2456', k: 'Рейтинг', tone: 'b' },
            { v: '7', k: 'Место в РК' },
            { v: '+38', k: 'За сезон', tone: 'g' },
          ]}
        />
        <div className="mt-3">
          <Rows>
            <Row nm="Открытие сезона 2026" sub="1/4 финала · 19.01.2026" val="+22" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
            <Row nm="ОРТ «Кубок Иртыша» 2025" sub="финал · 26.10.2025" val="+16" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
          </Rows>
        </div>
      </Panel>

      <Panel title="Годовой взнос" extra={<P t="ОПЛАЧЕН" cls="live" />} flush>
        <Row nm="2026 · ₸ 10 000" sub="оплачен 14.01.2026 · картой через Halyk ePay" />
      </Panel>

      <Panel title="История матчей" extra={<span className="text-xs text-neutral-500">42 матча за две кампании</span>} flush>
        <div className="divide-y divide-neutral-100">
          <Row av={A(44)} nm="Ким Георгий" sub="Открытие сезона 2026 · 1/4 финала · 19.01.2026" val="2 : 4" pill={{ t: 'ПОРАЖЕНИЕ', cls: 'bad' }} />
          <Row av={A(13)} nm="Пак Сергей" sub="Открытие сезона 2026 · 1/8 финала · 18.01.2026" val="4 : 1" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
        </div>
      </Panel>
  </>
);

export function Athlete1_12() {
  return (
    <WebApp
      role={R01}
      nav="Пользователи"
      title="Смагулов Алан"
      sub="2004 · Алматы · «Алатау» · КМС"
      back={{ label: 'Пользователи и роли', to: 'Э1.5' }}
    >
      <Athlete1_12Body />
    </WebApp>
  );
}

/** Карточка спортсмена на телефоне ✳. */
const Athlete1_12Phone = () => (
  <PhoneRoleApp
    role={R01}
    nav="Пользователи"
    title="Смагулов Алан"
    sub="2004 · Алматы · «Алатау» · КМС"
    back={{ label: 'Пользователи и роли', to: 'Э1.5' }}
  >
    <Athlete1_12Body phone />
  </PhoneRoleApp>
);

const Athlete1_12States = () => (
  <States>
    <Shot
      tone="warning"
      title="Взнос не оплачен"
      text="Плашка, что заявки на турниры с обязательным взносом не пройдут."
    >
      <Frag>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-neutral-500">Годовой взнос 2026</span>
          <P t="НЕ ОПЛАЧЕН" cls="wait" />
        </div>
        <Bar tone="warning">
          Пока взнос не отмечен, заявки этого спортсмена на турниры с включённым флагом взноса
          приниматься не будут. Отметку ставит экономист — с этого экрана её не поставить.
        </Bar>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Запись заведена клубом или самим человеком ✳"
      text="Виден источник записи."
    >
      <Frag w={520}>
        <FormGrid>
          <FieldView label="Спортсмен" value="Тлеуова Аружан · 2009 · Шымкент" wide />
          <FieldView label="Источник записи" value="завёл клуб «Достык», 03.02.2026 · федерация не правила" wide />
        </FormGrid>
      </Frag>
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
  phone,
}: {
  main?: boolean;
  nm: string;
  sub: string;
  born: string;
  city: string;
  club: string;
  rating: string;
  phone?: boolean;
}) => (
  <Panel
    title={nm}
    extra={<P t={main ? 'ГЛАВНАЯ ЗАПИСЬ' : 'ДУБЛЬ'} cls={main ? 'live' : 'wait'} />}
  >
    <FormGrid>
      <FieldView label="Источник записи" value={sub} wide />
      <FieldView label="Год рождения · город" value={`${born} · ${city}`} wide={phone} />
      <FieldView label="Клуб" value={club} wide={phone} />
      <FieldView label="Рейтинг" value={rating} wide />
    </FormGrid>
    {!main && (
      <div className="mt-3">
        <Btn>Сделать главной</Btn>
      </div>
    )}
  </Panel>
);

/** Тело экрана объединения — одно на оба формата ✳. */
const Merge1_13Body = ({ phone }: { phone?: boolean } = {}) => (
  <>
      {/* Записи идут одна под другой во всю ширину ✳ (30.08.2026): в две колонки
          у каждой оставалось полполосы, и поля («источник записи», «рейтинг ·
          матчи») переносились в две строки. Сравнивают их по одинаковым
          подписям полей, а не по тому, что они стоят рядом; главная запись —
          первой, значок «ГЛАВНАЯ ЗАПИСЬ» / «ДУБЛЬ» называет каждую. */}
      <MergeCol
        main
        phone={phone}
        nm="Ерлан Бекзат"
        sub="завела федерация, 14.01.2026"
        born="2006"
        city="Актобе"
        club="спортшкола №3"
        rating="2105 · 34 матча"
      />
      <MergeCol
        phone={phone}
        nm="Ерлан Бекзат"
        sub="зарегистрировался сам, 02.03.2026"
        born="2006"
        city="Актобе"
        club="— не указан"
        rating="1840 · 8 матчей"
      />

      <Panel
        title="Что переедет в главную запись ✳"
        extra={<span className="text-xs text-neutral-500">совпали ФИО, год рождения и город — пара предложена как дубль</span>}
        flush
      >
        {/* Пять слагаемых зоны: история матчей, заявки, роли, взносы, рейтинг.
            Роли — тоже переезд: дубль человек завёл сам, и роль спортсмена
            выдана именно ему; без этой строки после объединения было бы
            непонятно, чем он теперь входит. */}
        {/* Одним списком, а не двумя колонками ✳ (30.08.2026): пять строк,
            разложенные в два столбца, читались как два разных перечня, и
            «Рейтинг» с вопросом прятался во второй колонке. */}
        <div className="divide-y divide-neutral-100">
          <Row nm="История матчей" sub="34 + 8 матчей — в одну историю" val="42" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Заявки на турниры" sub="в том числе одна на Кубок РК" val="6" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Роли" sub="спортсмен — с записи, которую человек завёл сам" val="1" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Взносы" sub="2025 и 2026 оплачены" val="2 года" pill={{ t: 'ПЕРЕЕДЕТ', cls: 'live' }} />
          <Row nm="Рейтинг" sub="2105 и 1840 — что остаётся, не решено" val="⚠" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        </div>
      </Panel>

      <div className={'flex ' + (phone ? 'flex-col gap-3' : 'items-center justify-between gap-4')}>
        <span className="max-w-md text-[12.5px] text-neutral-500">
          Объединение пишется в журнал, но само не откатывается: разделять придётся руками.
        </span>
        {/* На телефоне решения встают этажами, главное — сверху. */}
        <span className={'flex gap-2 ' + (phone ? 'flex-col-reverse' : '')}>
          <QuietAction>Это разные люди</QuietAction>
          <Button className={phone ? 'w-full' : undefined} variant="primary">
            <Merge size={15} /> Объединить
          </Button>
        </span>
      </div>
  </>
);

export function Merge1_13() {
  return (
    <WebApp
      role={R01}
      nav="Пользователи"
      title="Объединение дублей"
      sub="Реестр спортсменов · две записи об одном человеке"
      back={{ label: 'Карточка спортсмена', to: 'Э1.12' }}
    >
      <Merge1_13Body />
    </WebApp>
  );
}

/** Объединение дублей на телефоне ✳. */
const Merge1_13Phone = () => (
  <PhoneRoleApp
    role={R01}
    nav="Пользователи"
    title="Объединение дублей"
    sub="Реестр спортсменов · две записи об одном человеке"
    back={{ label: 'Карточка спортсмена', to: 'Э1.12' }}
  >
    <Merge1_13Body phone />
  </PhoneRoleApp>
);

const Merge1_13States = () => (
  <States>
    <Shot
      tone="danger"
      title="Пол или год рождения расходятся ✳"
      text="Предупреждение, что это, возможно, разные люди: объединять без проверки нельзя."
    >
      <Frag>
        <Rows>
          <Row nm="Ерлан Бекзат · 2006 · мужской" sub="завела федерация, 14.01.2026" pill={{ t: 'ЗАПИСЬ A', cls: 'reg' }} />
          <Row nm="Ерлан Бекзат · 2009 · мужской" sub="завёл клуб «Достык», 03.02.2026" pill={{ t: 'ЗАПИСЬ Б', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">
            Год рождения расходится на три года — это может быть однофамилец. Объединение закрыто,
            пока расхождение не разобрано.
          </Bar>
        </div>
        <DisabledAction>Объединить</DisabledAction>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ У обеих записей есть рейтинг"
      text="Не решено, какой рейтинг остаётся у объединённой записи и пересчитывается ли история."
    >
      <Frag>
        <Rows>
          <Row nm="Рейтинг записи A" sub="завела федерация" val="2105 · 34 матча" />
          <Row nm="Рейтинг записи Б" sub="зарегистрировался сам" val="1840 · 8 матчей" />
        </Rows>
        <div className="mt-3">
          <Bar>
            Взять больший, взять рейтинг главной записи или пересчитать движком по объединённой
            истории — решение за федерацией и движком рейтинга. В макете место помечено вопросом.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.7 · Журнал действий ────────────────────────────────────── */

/** Запись журнала: «кто», «что сделал», «было → стало» и «когда» разобраны по
    полям — у каждого столбца свои данные.

    `ago` — сколько дней назад, от 15 апреля 2026; по нему работает фильтр
    периода. Хранить и дату строкой, и число дней — не дубль: дату показываем,
    по числу фильтруем, а вычислять одно из другого в макете незачем. */
type Log = {
  av: string;
  who: string;
  /** Роль, под которой действовал: у человека их бывает несколько. */
  role: string;
  act: string;
  /** Над чем: турнир, человек, матч. */
  obj: string;
  was: string;
  now: string;
  date: string;
  time: string;
  type: LogType;
  ago: number;
};

/** Тип изменения — им фильтруют. «Реестры» в списке фильтров нет, и такие
    записи находятся только под «Все действия»: четыре названные категории
    правки реестров не покрывают ⚠. */
type LogType = 'Турниры' | 'Роли' | 'Взносы' | 'Результаты' | 'Реестры';

const LOG_TYPES = ['Все действия', 'Турниры', 'Роли', 'Взносы', 'Результаты'] as const;
const LOG_PERIODS: { k: string; days: number }[] = [
  { k: '7 дней', days: 7 },
  { k: '30 дней', days: 30 },
  { k: 'Сезон', days: 400 },
];

const LOG: Log[] = [
  { av: A(76), who: 'Оспанов Т.', role: 'Главный судья', act: 'Изменил расписание', obj: 'Кубок РК', was: 'стол 4, 10:00', now: 'стол 6, 11:30', date: '15.04.2026', time: '18:03', type: 'Турниры', ago: 0 },
  { av: A(76), who: 'Оспанов Т.', role: 'Главный судья', act: 'Исправил счёт', obj: 'Цой В. — Ерлан Б.', was: '3:0', now: '3:1', date: '15.04.2026', time: '15:05', type: 'Результаты', ago: 0 },
  { av: A(13), who: 'Пак С.', role: 'Судья стола', act: 'Подтвердил счёт', obj: 'Ким Г. — Смагулов А.', was: 'счёт открыт', now: '3:1', date: '15.04.2026', time: '14:22', type: 'Результаты', ago: 0 },
  { av: A(76), who: 'Оспанов Т.', role: 'Главный судья', act: 'Поставил судью на стол', obj: 'Пак С.', was: 'не назначен', now: 'стол 4', date: '15.04.2026', time: '08:30', type: 'Роли', ago: 0 },
  { av: AW(44), who: 'Абаева Д.', role: 'Администратор Федерации', act: 'Опубликовала соревнование', obj: 'Кубок РК', was: 'Судья назначен', now: 'Приём заявок игроков', date: '14.04.2026', time: '10:42', type: 'Турниры', ago: 1 },
  { av: A(76), who: 'Мукашев Б.', role: 'Председатель ГСК', act: 'Назначил главного судью', obj: 'ОРТ «Кубок Иртыша»', was: 'не назначен', now: 'Оспанов Т.', date: '12.04.2026', time: '16:20', type: 'Турниры', ago: 3 },
  { av: AW(44), who: 'Абаева Д.', role: 'Администратор Федерации', act: 'Выдала роль', obj: 'Пак С.', was: 'нет роли', now: 'Судья · Кубок РК', date: '10.04.2026', time: '09:15', type: 'Роли', ago: 5 },
  { av: AW(44), who: 'Абаева Д.', role: 'Администратор Федерации', act: 'Изменила регламент', obj: 'Кубок РК', was: 'столов 12', now: 'столов 16', date: '28.03.2026', time: '11:07', type: 'Турниры', ago: 18 },
  { av: AW(44), who: 'Абаева Д.', role: 'Администратор Федерации', act: 'Отозвала роль', obj: 'Досжан М.', was: 'Администратор клуба', now: 'отозвана', date: '12.03.2026', time: '15:40', type: 'Роли', ago: 34 },
  { av: A(60), who: 'Сериков Н.', role: 'Экономист', act: 'Снял отметку оплаты', obj: 'Пак С.', was: 'оплачен', now: 'не оплачен', date: '22.02.2026', time: '09:12', type: 'Взносы', ago: 52 },
  { av: A(45), who: 'Досжан М.', role: 'Администратор клуба', act: 'Завёл спортсмена', obj: 'клуб «Алатау»', was: 'нет записи', now: 'Ахметов Диас', date: '03.02.2026', time: '14:05', type: 'Реестры', ago: 71 },
  { av: A(76), who: 'Мукашев Б.', role: 'Председатель ГСК', act: 'Утвердил протокол', obj: 'Открытие сезона 2026', was: 'на утверждении', now: 'утверждён', date: '21.01.2026', time: '12:00', type: 'Результаты', ago: 84 },
  { av: A(60), who: 'Сериков Н.', role: 'Экономист', act: 'Отметил оплату взноса', obj: 'Смагулов А.', was: 'не оплачен', now: 'оплачен', date: '14.01.2026', time: '10:42', type: 'Взносы', ago: 91 },
];

const LOG_GRID = '1.1fr 1.3fr 1.1fr 92px';

/** Журнал таблицей: кто · что сделал · детали · когда.

    «Детали» — это и есть «было → стало»: без него запись говорит, что что-то
    поменяли, но не говорит что. Старое зачёркнуто, новое выделено — стрелка не
    нужна, направление видно и так. */
export function Log1_7() {
  const [type, setType] = useState<string>(LOG_TYPES[0]);
  const [period, setPeriod] = useState(LOG_PERIODS[0]);
  const rows = LOG.filter(
    (l) => (type === LOG_TYPES[0] || l.type === type) && l.ago <= period.days,
  );
  return (
    <WebApp role={R01} nav="Журнал" title="Журнал действий" sub="Записи не редактируются и не удаляются (TZ §12) · новые сверху">
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg items={[...LOG_TYPES]} active={type} onPick={setType} />
        <FilterSeg
          items={LOG_PERIODS.map((x) => x.k)}
          active={period.k}
          onPick={(k) => setPeriod(LOG_PERIODS.find((x) => x.k === k)!)}
        />
      </div>

      {rows.length ? (
        <Sheet grid={LOG_GRID} cols={['Кто', 'Что сделал', 'Детали', <span key="w" className="text-right">Когда</span>]}>
          {rows.map((l) => (
            <div
              key={l.act + l.who + l.time}
              className="grid items-center gap-3 px-4 py-2 text-[13px]"
              style={{ gridTemplateColumns: LOG_GRID }}
            >
              {/* Под какой ролью действовал: у человека их бывает несколько, и
                  без этого запись не отвечает, кем он тут был. */}
              <Who av={l.av} nm={l.who} sub={l.role} />
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-medium">{l.act}</span>
                <span className="block truncate text-xs text-neutral-500">{l.obj}</span>
              </span>
              <span className="min-w-0 leading-tight">
                <s className="block truncate text-xs text-neutral-400 line-through">{l.was}</s>
                <b className="block truncate font-semibold">{l.now}</b>
              </span>
              <span className="text-right leading-tight">
                <span className="block tabular-nums">{l.date}</span>
                <span className="block text-xs tabular-nums text-neutral-500">{l.time}</span>
              </span>
            </div>
          ))}
        </Sheet>
      ) : (
        <EmptyBox
          title="Под этот фильтр записей не попало"
          text="Записи журнала не удаляются: пусто здесь означает только то, что выбранный тип изменений за выбранный период не встречался."
        />
      )}
    </WebApp>
  );
}

/** Журнал на телефоне ✳: те же записи и те же фильтры, но строкой.

    В 392 px четыре колонки таблицы («кто», «что сделал», «детали», «когда»)
    получают по девяносто пикселей, и «Опубликовала соревнование» становится
    столбиком из слогов. Этажи идут в том же порядке, что колонки: кто и когда —
    первой строкой, что сделал — второй, было → стало — третьей. Стрелка здесь
    нужна: на десктопе направление показывал сам порядок (старое над новым), а в
    одну строку оно ничем не выражено. */
const Log1_7Phone = () => {
  const [type, setType] = useState<string>(LOG_TYPES[0]);
  const [period, setPeriod] = useState(LOG_PERIODS[0]);
  const rows = LOG.filter(
    (l) => (type === LOG_TYPES[0] || l.type === type) && l.ago <= period.days,
  );
  return (
    <PhoneRoleApp
      role={R01}
      nav="Журнал"
      title="Журнал действий"
      sub="Записи не редактируются и не удаляются (TZ §12) · новые сверху"
    >
      <div className="mb-2">
        <Swipe>
          <FilterSeg items={[...LOG_TYPES]} active={type} onPick={setType} />
        </Swipe>
      </div>
      <div className="mb-3">
        <FilterSeg
          items={LOG_PERIODS.map((x) => x.k)}
          active={period.k}
          onPick={(k) => setPeriod(LOG_PERIODS.find((x) => x.k === k)!)}
        />
      </div>
      {rows.length ? (
        <Rows>
          {rows.map((l) => (
            <div key={l.act + l.who + l.time} className="px-4 py-2.5">
              <div className="flex items-start gap-3">
                <Who av={l.av} nm={l.who} sub={l.role} />
                <span className="ml-auto shrink-0 text-right text-[11px] leading-tight tabular-nums text-neutral-500">
                  <span className="block">{l.date}</span>
                  <span className="block">{l.time}</span>
                </span>
              </div>
              <div className="mt-1.5 text-[13px] font-medium leading-tight">{l.act}</div>
              <div className="text-xs text-neutral-500">{l.obj}</div>
              <div className="mt-1 text-[12.5px] leading-snug">
                <s className="text-neutral-400 line-through">{l.was}</s>{' '}
                <b className="font-semibold">→ {l.now}</b>
              </div>
            </div>
          ))}
        </Rows>
      ) : (
        <EmptyBox
          title="Под этот фильтр записей не попало"
          text="Записи журнала не удаляются: пусто здесь означает только то, что выбранный тип изменений за выбранный период не встречался."
        />
      )}
    </PhoneRoleApp>
  );
};

const Log1_7States = () => (
  <States>
    <Shot
      tone="info"
      title="По фильтру записей нет ✳"
      text="Журнал пуст только по фильтру, а не вообще: видно, какой фильтр это дал."
      wide
    >
      <Frag>
        <div className="mb-3">
          <FilterSeg items={['Все действия', 'Взносы', 'Результаты']} active="Взносы" onPick={() => {}} />
        </div>
        <EmptyBox
          title="За 7 дней по взносам изменений не было"
          text="Записи журнала не удаляются и не правятся: пусто здесь означает только то, что под фильтр ничего не попало."
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.8 · Новости и страницы ─────────────────────────────────── */

type News = { nm: string; kind: 'Новость' | 'Страница'; date: string; pub: boolean };

const NEWS: News[] = [
  { nm: 'Кубок Республики: приём заявок открыт', kind: 'Новость', date: '12.04.2026', pub: true },
  { nm: 'Судейский семинар в Астане', kind: 'Новость', date: '02.04.2026', pub: false },
  { nm: 'Положение о Евразийской лиге', kind: 'Страница', date: '05.03.2026', pub: false },
  { nm: 'Как считается рейтинг игрока', kind: 'Страница', date: '18.02.2026', pub: true },
  { nm: 'Итоги открытия сезона 2026', kind: 'Новость', date: '21.01.2026', pub: true },
  { nm: 'Календарь сезона 2026', kind: 'Страница', date: '10.01.2026', pub: true },
];

const NEWS_TABS = ['Все материалы', 'Новости', 'Страницы'] as const;

const NEWS_GRID = '2.2fr 170px 230px';

/** Материалы вкладки: одна выборка на оба формата — иначе счётчик на вкладке и
    длина списка под ней разъедутся. */
const newsOf = (tab: string) =>
  tab === NEWS_TABS[0] ? NEWS : NEWS.filter((n) => n.kind === (tab === 'Новости' ? 'Новость' : 'Страница'));

/** Материалы таблицей: материал · состояние · действия.

    Заполненность языков из списка убрана: место, где видно, чего не переведено,
    остаётся только в редакторе (Э1.14) — по списку это больше не читается ⚠. */
export function News1_8() {
  const [tab, setTab] = useState<string>(NEWS_TABS[0]);
  /* Состояние материала живёт здесь: «Опубликовать» переводит черновик в
     опубликованный, «Снять» — обратно. Одна кнопка на два состояния, как у
     регламента турнира: доступна всегда ровно та, которая имеет смысл. */
  const [pub, setPub] = useState<Record<string, boolean>>(
    Object.fromEntries(NEWS.map((n) => [n.nm, n.pub])),
  );
  /* Правка открывается диалогом поверх списка: материал правят мельком, из
     списка, и уходить с места ради этого незачем. Форма внутри — та же, что на
     своём экране (Э1.14), одним компонентом. */
  const [edit, setEdit] = useState<string | null>(null);
  const rows = newsOf(tab);
  const count = (t: string) => newsOf(t).length;
  return (
    <WebApp role={R01} nav="Новости" title="Новости и страницы">
      <div className="mb-3 flex items-center justify-between gap-4">
        {/* Вкладки со счётчиками: сколько материалов в каждой, видно до нажатия. */}
        <FilterSeg
          items={NEWS_TABS.map((t) => `${t} · ${count(t)}`)}
          active={`${tab} · ${count(tab)}`}
          onPick={(v) => setTab(NEWS_TABS.find((t) => v.startsWith(t)) ?? NEWS_TABS[0])}
        />
        <Button variant="primary" data-to="Э1.14">
          <Plus size={15} /> Создать материал
        </Button>
      </div>

      <Sheet grid={NEWS_GRID} cols={['Материал', 'Состояние', <span key="a" className="text-right">Действия</span>]}>
        {rows.map((n) => (
          <div
            key={n.nm}
            className="grid items-center gap-3 px-4 py-2 text-[13px]"
            style={{ gridTemplateColumns: NEWS_GRID }}
          >
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-medium">{n.nm}</span>
              <span className="block truncate text-xs text-neutral-500">{n.kind} · {n.date}</span>
            </span>
            <span><P t={pub[n.nm] ? 'ОПУБЛИКОВАНО' : 'ЧЕРНОВИК'} cls={pub[n.nm] ? 'live' : 'done'} /></span>
            <span className="flex justify-end gap-1.5">
              <Button size="sm" variant="ghost" onPress={() => setEdit(n.nm)}>Править</Button>
              <Button size="sm" variant="outline" onPress={() => setPub({ ...pub, [n.nm]: !pub[n.nm] })}>
                {pub[n.nm] ? 'Снять' : 'Опубликовать'}
              </Button>
            </span>
          </div>
        ))}
      </Sheet>

      {edit && <NewsEditDialog nm={edit} published={pub[edit]} onClose={() => setEdit(null)} />}
    </WebApp>
  );
}

/** Правка материала окном — одна на оба формата ✳: форма внутри та же, что на
    своём экране (Э1.14), и разводить их двумя разметками нельзя. */
const NewsEditDialog = ({
  nm,
  published,
  phone,
  onClose,
}: {
  nm: string;
  published: boolean;
  phone?: boolean;
  onClose: () => void;
}) => (
  <InlineDialog
    title={nm}
    sub={`${NEWS.find((n) => n.nm === nm)!.kind} · ${published ? 'опубликовано' : 'черновик'}`}
    to="Э1.8"
    wide
    foot={
      <>
        <QuietAction onPress={onClose}>Сохранить</QuietAction>
        <Button variant="primary" data-to="Э1.14">Открыть в редакторе</Button>
      </>
    }
  >
    <MaterialForm closed={false} phone={phone} />
  </InlineDialog>
);

/** Новости и страницы на телефоне ✳: та же таблица строками — материал,
    состояние и два действия не встают в 392 px в одну строку с колонками. */
const News1_8Phone = () => {
  const [tab, setTab] = useState<string>(NEWS_TABS[0]);
  const [pub, setPub] = useState<Record<string, boolean>>(
    Object.fromEntries(NEWS.map((n) => [n.nm, n.pub])),
  );
  const [edit, setEdit] = useState<string | null>(null);
  const rows = newsOf(tab);
  const count = (t: string) => newsOf(t).length;
  return (
    <PhoneRoleApp role={R01} nav="Новости" title="Новости и страницы">
      <div className="mb-2">
        <Swipe>
          <FilterSeg
            items={NEWS_TABS.map((t) => `${t} · ${count(t)}`)}
            active={`${tab} · ${count(tab)}`}
            onPick={(v) => setTab(NEWS_TABS.find((t) => v.startsWith(t)) ?? NEWS_TABS[0])}
          />
        </Swipe>
      </div>
      <div className="mb-3">
        <Button className="w-full" variant="primary" data-to="Э1.14">
          <Plus size={15} /> Создать материал
        </Button>
      </div>
      <Rows>
        {rows.map((n) => (
          <div key={n.nm} className="px-4 py-2.5">
            <div className="text-[13.5px] font-medium leading-tight">{n.nm}</div>
            <div className="mt-0.5 text-xs text-neutral-500">{n.kind} · {n.date}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <P t={pub[n.nm] ? 'ОПУБЛИКОВАНО' : 'ЧЕРНОВИК'} cls={pub[n.nm] ? 'live' : 'done'} />
              <span className="ml-auto flex gap-1.5">
                <Button size="sm" variant="ghost" onPress={() => setEdit(n.nm)}>Править</Button>
                <Button size="sm" variant="outline" onPress={() => setPub({ ...pub, [n.nm]: !pub[n.nm] })}>
                  {pub[n.nm] ? 'Снять' : 'Опубликовать'}
                </Button>
              </span>
            </div>
          </div>
        ))}
      </Rows>
      {edit && (
        <PhoneDialog>
          <NewsEditDialog nm={edit} published={pub[edit]} phone onClose={() => setEdit(null)} />
        </PhoneDialog>
      )}
    </PhoneRoleApp>
  );
};

const News1_8States = () => (
  <States>
    <Shot
      tone="warning"
      title="Заполненность языков по списку не видна ⚠"
      text="Колонка языков убрана: где перевода нет, теперь узнают только в редакторе."
      wide
    >
      <Frag>
        <Bar tone="warning">
          Материал переводится не весь и не сразу. Пока заполненность была в списке, непереведённые
          находились одним взглядом; теперь их надо искать, открывая материалы по одному. Нужно
          решить, где это место — фильтр «без перевода», колонка обратно или отдельная сводка.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Э1.14 · Редактор материала ────────────────────────────────── */

/** Дата в форме: русский формат ДД.ММ.ГГГГ и значок календаря.

    Нативный `input[type="date"]` (`DateInput` кита) рисуется локалью браузера:
    в снимке он показал «04/12/2026» — по-русски это читается как 4 декабря,
    хотя материал датирован 12 апреля и в списке Э1.8 стоит «12.04.2026». Дату
    по-прежнему выбирают календарём — календарь и открывается по этому полю, —
    но написана она так, как её читают в системе. */
const DateField = ({ label, value, wide }: { label: string; value: string; wide?: boolean }) => (
  <label className={'flex flex-col gap-1' + (wide ? ' col-span-2' : '')}>
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    <span className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm">
      <span className="tabular-nums">{value}</span>
      <CalendarDays size={14} className="text-neutral-400" />
    </span>
  </label>
);

/** Форма материала — одна на редактор (Э1.14) и на диалог правки из списка
    (Э1.8). Общая нарочно: это одно и то же содержимое, и если развести его
    двумя разметками, они разойдутся — на одном экране появится поле, которого
    нет на другом. `closed` — черновик закрыт: поля только читаются. */
const MaterialForm = ({ closed, phone }: { closed: boolean; phone?: boolean }) => (
  /* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки поля
     текста жались в полторы трети — лид и текст материала пишут длинными
     строками, и узкая колонка врала про то, сколько сюда влезает. Панель сама
     держит отступ снизу, обёртка не нужна. */
  <>
    <Panel title="Текст">
      {closed ? (
        <FormGrid>
          <FieldView label="Заголовок" value="Кубок Республики: приём заявок открыт" wide />
          <FieldView
            label="Лид"
            value="Заявки на Кубок Республики Казахстан 2026 принимаются до 10 мая через личный кабинет спортсмена."
            wide
          />
          <FieldView
            label="Текст"
            value="Соревнование пройдёт 18–20 мая в Астане, ДС «Барыс». Главный судья — Оспанов Т. Допуск: годовой взнос федерации и документы к заявке."
            wide
          />
        </FormGrid>
      ) : (
        /* Заголовок строкой, лид и текст — многострочные: у них разный объём, и
           одинаковые поля врали бы про то, сколько сюда пишут. */
        <FormGrid>
          <TextInput label="Заголовок" value="Кубок Республики: приём заявок открыт" wide />
          <AreaInput
            label="Лид"
            value="Заявки на Кубок Республики Казахстан 2026 принимаются до 10 мая через личный кабинет спортсмена."
            rows={2}
            wide
          />
          <AreaInput
            label="Текст"
            value="Соревнование пройдёт 18–20 мая в Астане, ДС «Барыс». Главный судья — Оспанов Т. Допуск: годовой взнос федерации и документы к заявке."
            rows={5}
            wide
          />
        </FormGrid>
      )}
    </Panel>

    <Panel title="Материал">
      {closed ? (
        <FormGrid>
          <FieldView label="Тип" value="Новость" wide={phone} />
          <FieldView label="Дата публикации" value="12.04.2026" wide={phone} />
          <div className="col-span-2">
            <EmptyBox title="Обложка не загружена" text="Материал выйдет без картинки." />
          </div>
        </FormGrid>
      ) : (
        <FormGrid>
          <PickField label="Тип" value="Новость" wide={phone} />
          {/* Дату выбирают календарём, а не вписывают: набранная руками приходит
              с опечатками и в разных форматах. Показана по-русски — формат не
              зависит от локали браузера, в котором открыт макет. */}
          <DateField label="Дата публикации" value="12.04.2026" wide={phone} />
          {/* Формат и размер сказаны до выбора, а не в ошибке после. */}
          <FileDrop label="Обложка 16:9" hint="jpg или png, от 1600 px по ширине" />
        </FormGrid>
      )}
    </Panel>
  </>
);

/** Редактор материала.

    Черновик заполняют, потом закрывают: пока он открыт, поля правятся, после
    «Сохранить черновик» — только читаются, а кнопка становится «Править». Тот
    же приём, что у регламента турнира: одна кнопка на два состояния, доступна
    всегда ровно та, которая сейчас имеет смысл. */
export function Editor1_14() {
  const [closed, setClosed] = useState(false);
  return (
    <WebApp
      role={R01}
      nav="Новости"
      title="Кубок Республики: приём заявок открыт"
      back={{ label: 'Новости и страницы', to: 'Э1.8' }}
    >
      <MaterialForm closed={closed} />
      <div className="flex items-center justify-end gap-2">
        <QuietAction onPress={() => setClosed(!closed)}>
          {closed ? 'Править' : 'Сохранить черновик'}
        </QuietAction>
        {/* ⚠ Куда ведёт «Опубликовать», не решено: у публичной страницы
            материала (Э0.4) нет своего кода экрана. */}
        <Button variant="primary">
          <Send size={15} /> Опубликовать
        </Button>
      </div>
    </WebApp>
  );
}

/** Редактор материала на телефоне ✳: та же форма в одну колонку, решения —
    этажами, главное сверху. */
const Editor1_14Phone = () => {
  const [closed, setClosed] = useState(false);
  return (
    <PhoneRoleApp
      role={R01}
      nav="Новости"
      title="Кубок Республики: приём заявок открыт"
      back={{ label: 'Новости и страницы', to: 'Э1.8' }}
    >
      <MaterialForm closed={closed} phone />
      <div className="flex flex-col-reverse gap-2">
        <QuietAction onPress={() => setClosed(!closed)}>
          {closed ? 'Править' : 'Сохранить черновик'}
        </QuietAction>
        <Button className="w-full" variant="primary">
          <Send size={15} /> Опубликовать
        </Button>
      </div>
    </PhoneRoleApp>
  );
};

const Editor1_14States = () => (
  <States>
    <Shot
      tone="warning"
      title="Материала на трёх языках больше нет ⚠"
      text="Переключатель RU / KZ / EN убран — у материала одна версия текста."
    >
      <Frag>
        <Bar tone="warning">
          Сайт по ТЗ трёхъязычный, а редактор теперь ведёт один текст: где живут казахская и
          английская версии, надо решить — тремя полями в этой же форме, тремя материалами в списке
          или отдельным экраном перевода.
        </Bar>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Правка опубликованного материала ✳"
      text="Изменения видны сразу, и каждая версия пишется в журнал."
    >
      <Frag>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-neutral-500">Материал опубликован 12.04.2026</span>
          <P t="ОПУБЛИКОВАНО" cls="live" />
        </div>
        <Rows>
          <Row nm="Версия 2 · сейчас" sub="Абаева Д. · 15.04.2026, 09:20 · правка лида" pill={{ t: 'ТЕКУЩАЯ', cls: 'reg' }} />
          <Row nm="Версия 1" sub="Абаева Д. · 12.04.2026, 11:05 · публикация" />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд роли ─────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.

    У каждого экрана есть `alt` — тот же экран во втором формате ✳ (30.08.2026):
    у этой роли основной формат десктопный, второй — телефон. Состояния во
    втором кадре не повторяются: они уже разобраны под десктопным макетом, а
    `alt` показывает сам экран. */
/* ── Э1.15 · Сводка по регионам ✳ (31.08.2026) ─────────────────────
   Пункт 3 документа федерации: «автоматическое формирование сводной
   статистики по регионам, а также возможность создания аналитической панели
   (дашборда)». Вносят цифры регионы (роль 17, Э17.1) — здесь их только
   смотрят: у вносящего форма с полями, у смотрящего сравнение регионов. */

type Reg115 = {
  nm: string;
  players: number;
  coaches: number;
  judges: number;
  halls: number;
  tables: number;
  /** Когда регион последний раз обновлял данные. */
  upd: string;
  stale?: boolean;
};

const REGIONS115: Reg115[] = [
  { nm: 'Алматы', players: 1240, coaches: 58, judges: 74, halls: 22, tables: 168, upd: '28.08.2026' },
  { nm: 'Астана', players: 980, coaches: 44, judges: 61, halls: 18, tables: 134, upd: '30.08.2026' },
  { nm: 'Шымкент', players: 720, coaches: 33, judges: 40, halls: 14, tables: 96, upd: '19.08.2026' },
  { nm: 'Караганда', players: 610, coaches: 28, judges: 35, halls: 12, tables: 84, upd: '02.06.2026', stale: true },
  { nm: 'Павлодар', players: 412, coaches: 21, judges: 31, halls: 9, tables: 54, upd: '31.08.2026' },
  { nm: 'Тараз', players: 305, coaches: 16, judges: 22, halls: 7, tables: 41, upd: '14.03.2026', stale: true },
];

const REG115_GRID = 'minmax(0,1.4fr) 96px 96px 84px 84px 88px 132px';
const REG115_SORTS = ['По спортсменам', 'По судьям', 'По столам'];

export function RegSum1_12() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(REG115_SORTS[0]);
  const rows = REGIONS115.filter((r) => r.nm.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) =>
    sort === 'По судьям' ? b.judges - a.judges : sort === 'По столам' ? b.tables - a.tables : b.players - a.players,
  );
  return (
    <WebApp
      role={R01}
      nav="Статистика регионов"
      title="Статистика по регионам"
      sub="Сводка складывается из данных, которые вносят региональные федерации"
      hint="Предложение 3: автоматическая сводная статистика по регионам и аналитическая панель по этим показателям."
    >
      <StatTiles
        items={[
          { v: '4 267', k: 'Спортсменов в стране' },
          { v: '200', k: 'Тренеров' },
          { v: '263', k: 'Судей' },
          { v: '82', k: 'Залов' },
          { v: '577', k: 'Столов' },
          { v: '2', k: 'Регионов не обновляли данные', tone: 'a' },
        ]}
      />

      <ChartRow>
        <Panel title="Где сосредоточены спортсмены" sub="Доли регионов в общем числе">
          <Donut
            label="Спортсмены по регионам"
            total="4 267"
            totalNote="спортсменов"
            parts={[
              { t: 'Алматы', v: 1240 },
              { t: 'Астана', v: 980 },
              { t: 'Шымкент', v: 720 },
              { t: 'Остальные регионы', v: 1327 },
            ]}
          />
        </Panel>
        <Panel title="Судьи по регионам" sub="Столбик — регион; свой выделен">
          <Bars
            label="Число судей по регионам"
            suffix="судей в регионе"
            items={REGIONS115.map((r) => ({ t: r.nm, v: r.judges, on: r.nm === 'Павлодар' }))}
          />
        </Panel>
      </ChartRow>

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Регион" className="w-64" />
        <FilterSeg items={REG115_SORTS} active={sort} onPick={setSort} />
      </FilterBar>

      <Panel title={`Регионы · ${rows.length}`} sub="Строка ведёт в карточку региона" flush>
        <Sheet
          flush
          grid={REG115_GRID}
          cols={['Регион', 'Спортсмены', 'Тренеры', 'Судьи', 'Залы', 'Столы', 'Данные на']}
        >
          {rows.map((r) => (
            <div
              key={r.nm}
              data-row
              className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] tabular-nums"
              style={{ gridTemplateColumns: REG115_GRID }}
            >
              <span className="truncate font-medium">{r.nm}</span>
              <span className="text-right">{r.players}</span>
              <span className="text-right">{r.coaches}</span>
              <span className="text-right">{r.judges}</span>
              <span className="text-right">{r.halls}</span>
              <span className="text-right">{r.tables}</span>
              <span>
                <Pill t={r.upd} color={r.stale ? 'warning' : 'default'} />
              </span>
            </div>
          ))}
        </Sheet>
      </Panel>

      <Bar tone="warning">
        Сводка честна ровно настолько, насколько свежи данные регионов. Поэтому дата обновления
        стоит колонкой в самой таблице, а не прячется в карточке: два региона здесь не обновлялись с
        весны, и их числа в общую сумму входят как есть. ⚠ Как часто регион обязан обновлять данные
        и что делать с просроченными — федерация не сказала.
      </Bar>
    </WebApp>
  );
}


export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => (
      <>
        <Login0_1 />
        <Login0_1States />
      </>
    ),
    /* Вход сквозной, и телефонный кадр у него уже есть — тот самый, что рисует
       role00: вход один на сайт и приложение, второго заводить нельзя. */
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э1.1': {
    cap: 'Панель Федерации',
    view: () => (
      <>
        <Dash1_1 />
        <Also cap="Шапка · переключатель языка: RU / KZ / EN рядом с уведомлениями и профилем">
          <Head1_1 />
        </Also>
        <Dash1_1States />
      </>
    ),
    alt: () => <Dash1_1Phone />,
    next: 'пункт «Календарь»',
  },
  'Э1.2': {
    cap: 'Календарь сезона',
    view: () => (
      <>
        <Cal1_2 />
        {/* Второй вид экрана: на самом экране он открывается переключателем
            «Список / Календарь», и в снимок борда попадает только список. */}
        <Cal1_2Also />
        <Cal1_2States />
      </>
    ),
    alt: () => <Cal1_2Phone />,
    next: '«Завести соревнование»',
  },
  'Э1.4': {
    cap: 'Форма «Завести соревнование»',
    view: () => (
      <>
        <New1_4 />
        {/* Второй шаг мастера целиком: на самом экране он открывается кнопкой
            «Дальше · основное», и в снимке борда виден только первый. Поля
            шага — из данных роли: название, город, окно дат, разряды. */}
        <Also cap="Шаг 2 «Основное» — название, город, окно дат, разряды">
          <Frag w={620}>{STEP_BODY[2]()}</Frag>
        </Also>
        <New1_4States />
      </>
    ),
    alt: () => <New1_4Phone />,
    next: '«Создать»',
  },
  'Э1.3': {
    cap: 'Карточка турнира',
    view: () => (
      <>
        <Tour1_3 />
        {/* Последний из семи разделов карточки: на экране он открывается
            кликом по ряду разделов, а по умолчанию стоит «Черновик». */}
        <Sched1_3Also />
        <Tour1_3States />
      </>
    ),
    alt: () => <Tour1_3Phone />,
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
    alt: () => <Cancel1_9Phone />,
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
    alt: () => <Users1_5Phone />,
    next: '«пригласить человека»',
  },
  'Э1.10': {
    cap: 'Приглашение человека',
    view: () => (
      <>
        <NewUser1_10 />
        <NewUser1_10States />
      </>
    ),
    alt: () => <NewUser1_10Phone />,
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
    alt: () => <GrantRole1_11Phone />,
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
    alt: () => <Athlete1_12Phone />,
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
    alt: () => <Merge1_13Phone />,
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
    alt: () => <Log1_7Phone />,
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
    alt: () => <News1_8Phone />,
    next: '«Править»',
  },
  'Э1.15': {
    cap: 'Статистика по регионам',
    view: () => <RegSum1_12 />,
  },
  'Э1.14': {
    cap: 'Редактор материала',
    view: () => (
      <>
        <Editor1_14 />
        <Editor1_14States />
      </>
    ),
    alt: () => <Editor1_14Phone />,
  },
};

export function Role01Board() {
  return <Board role={R01} screens={SCREENS} />;
}
