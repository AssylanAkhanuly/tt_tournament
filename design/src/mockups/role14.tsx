/* Роль 14 · Спортсмен — макеты по флоу на новом слое (HeroUI) ✳ (30.08.2026).
   Содержание, коды экранов и переходы — прежние (см. `flows/14-sportsmen.md`);
   меняется подача: роль единственная живёт в телефоне (TZ §10), поэтому каждый
   узел флоу собран оболочкой PhoneApp нового слоя `kit/hero/app`, а не
   десктопом со вкладкой «то же на телефоне».

   Три правила, которые макеты обязаны показывать:
   1. счёт своего матча спортсмен не вводит и не подтверждает — его ведёт судья
      стола (экран Э14.5 только показывает);
   2. заявиться сам спортсмен может только на открытый республиканский турнир
      (§8.2) — на главные старты подаёт старший тренер региона, в Лигу — клуб;
   3. взнос оплачивается картой на странице банка (§9.2), и состояние ставит
      серверное подтверждение банка, а не возврат в приложение. */

import { Fragment, useState, type ReactNode } from 'react';
import {
  ArrowUpDown, BarChart3, CalendarDays, Check, ChevronRight, CreditCard, Download,
  LayoutDashboard, Lock, Newspaper, Receipt, Send, Timer, Trophy, User, X,
} from 'lucide-react';
import { Avatar, Button, Chip } from '@heroui/react';
import {
  A, BackLink, Bar, DataTable, dateWords, DayList, DisabledAction, EmptyBox, FieldView,
  FileDrop, FilterSeg, FormGrid, GameCells, KV, MiniMonth, PageTabs, Pager, Panel, Phone,
  PhoneApp, Pill, PrimaryAction, QuietAction, Row, Rows, ScreenScope, SearchInput, TextInput,
  type CalEvent, type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* Графики настоящие (Chart.js): нарисованная ломаная не отвечает на вопросы,
   которые задают графику. Холст обёрнут в Panel нового слоя. */
import { ChartBox, soft, token } from './chart';
/* Сетка — настоящий компонент фронта: вторая нарисованная сетка разошлась бы
   с той, что увидят в продукте. */
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { ME_ID, MY_GROUP, OTHER_GROUPS, myBracket, playoffBracket } from './myBracket';
import { Login0_1, SignUp0_5, SignUp0_5States } from './role00';

/* ── Роль: вкладки телефона и подпись профиля ────────────────────── */

/* Спортсмен макета — Ким Георгий (тот же, что в реестрах ролей 2 и 12). */
const ME = A(44);

/** Нижние вкладки приложения — те же пункты и те же слова, что были в nav
    старого файла: по подписи их находит карта флоу («меню „Календарь“» и т.д.).
    Шесть пунктов на телефоне тесно, но честно: у роли шесть разделов. */
const TABS: [ReactNode, string][] = [
  [<LayoutDashboard size={17} key="h" />, 'Главная'],
  [<CalendarDays size={17} key="c" />, 'Календарь'],
  [<Timer size={17} key="t" />, 'Мой турнир'],
  [<BarChart3 size={17} key="a" />, 'Аналитика'],
  [<Newspaper size={17} key="n" />, 'Новости'],
  [<User size={17} key="p" />, 'Профиль'],
];

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    Роль вне турнирного контура федерации, значка состояния нет. */
const R14: RoleUI = {
  num: '14',
  title: 'Спортсмен',
  person: { nm: 'Ким Г.', rl: 'Спортсмен · рейтинг 2456', av: ME },
  brandName: 'Мой профиль',
  brandSub: 'Сайт и приложение',
  badge: false,
  nav: TABS,
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    (и коллбэки `mark` у чужих ролей) переносятся без переписывания. */
const PC: Record<string, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const P = ({ t, cls }: { t: string; cls: string }) => <Pill t={t} color={PC[cls] ?? 'default'} />;

/** Оболочка экрана роли: телефон с нижними вкладками.

    Содержимое обёрнуто в один нерастяжимый столбец, и это не украшение.
    Тело `PhoneApp` — колонка флексов с прокруткой, а у флекс-элемента, которому
    задан `overflow: hidden` (а это каждая `Panel`, `Rows` и карточка с
    обложкой), минимальная высота равна нулю: вместо прокрутки экран сжимал
    карточки в полосы — у профиля от визитки оставалась синяя полоска, у
    аналитики от графика полсантиметра, а кнопка «Подать заявку» исчезала
    вместе с подвалом своей карточки. Обёртка со `shrink-0` возвращает блокам
    их настоящую высоту, а экрану — честную прокрутку. */
const Ph = ({ tab, center, children }: { tab: string; center?: boolean; children: ReactNode }) => (
  <PhoneApp brand="Спортсмен" tabs={TABS} active={tab} center={center}>
    <div className="flex shrink-0 flex-col gap-3.5">{children}</div>
  </PhoneApp>
);

/** Заголовок экрана на телефоне: шапки-полосы у PhoneApp нет намеренно —
    место дорогое, и первым идёт заголовок содержимого. */
const PageT = ({ t, sub }: { t: string; sub?: string }) => (
  <div className="leading-tight">
    <div className="text-[19px] font-bold tracking-tight">{t}</div>
    {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
  </div>
);

/** Подзаголовок раздела внутри экрана. */
const SecT = ({ extra, children }: { extra?: ReactNode; children: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{children}</span>
    {extra}
  </div>
);

/** Хроника шагов: у шагов заявки и кругов сетки есть порядок и есть место,
    где мы сейчас, — список с плашками «ЖДЁМ / ПОТОМ» этого не показывал. */
type Step = { t: string; ss: string; at: string; done?: boolean; now?: boolean };
const Steps = ({ items }: { items: Step[] }) => (
  <div className="flex flex-col">
    {items.map((s, i) => (
      <div key={s.t} className="relative flex gap-3 pb-3.5 last:pb-0">
        {i < items.length - 1 && <span className="absolute left-[4.5px] top-4 h-full w-px bg-neutral-200" />}
        <span
          className={
            'relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full ' +
            (s.now
              ? 'bg-blue-600 ring-4 ring-blue-100'
              : s.done
                ? 'bg-green-600'
                : 'border border-neutral-300 bg-white')
          }
        />
        <span className="min-w-0 flex-1 leading-tight">
          <span className={'block text-[13px] ' + (s.now ? 'font-semibold' : 'font-medium')}>{s.t}</span>
          <span className="block text-xs text-neutral-500">{s.ss}</span>
        </span>
        <span className={'shrink-0 text-xs tabular-nums ' + (s.now ? 'font-semibold text-blue-700' : 'text-neutral-500')}>
          {s.at}
        </span>
      </div>
    ))}
  </div>
);

/** Таблица с «живыми» строками — как в role05. ⚠ Временная дупликация Sheet/Th:
    когда общих экранов наберётся больше, поднять в kit/hero/app. */
const Sheet = ({ cols, grid, children }: { cols: ReactNode[]; grid: string; children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <div
      className="grid items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400"
      style={{ gridTemplateColumns: grid }}
    >
      {cols.map((c, i) => <span key={i} className="min-w-0">{c}</span>)}
    </div>
    <div className="divide-y divide-neutral-100">{children}</div>
  </div>
);

/** Заголовок сортируемого столбца: в составе на 128 человек сортируют. */
const Th = ({ t, on, onClick }: { t: string; on: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={'flex items-center gap-1 text-left ' + (on ? 'text-neutral-700' : 'hover:text-neutral-600')}
  >
    {t}
    {on && <ArrowUpDown size={10} />}
  </button>
);

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. Ширина телефонная, но не шире
    самого кадра: колонка полки уже фрагмента, и фиксированная ширина вылезала
    на соседний кадр — кнопка «Принять» ложилась поверх чужой карточки. */
const Frag = ({ w = 344, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w, maxWidth: '100%' }}>{children}</div>
  </ScreenScope>
);

/* Новости федерации — те же материалы, что публикует администратор (Э1.8), и
   те же, что на публичном сайте: своей редакции у спортсмена нет. Поля — те,
   что реально приходят из админки: рубрика, дата, автор, лид, время чтения.
   «Лайков» и «комментариев» в системе нет — в макете их не выдумываем. */
const NEWS = [
  {
    nm: 'Календарь сезона 2026 опубликован',
    sub: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров.',
    at: '15 апреля',
    tag: 'КАЛЕНДАРЬ',
    by: 'Пресс-служба ФНТ РК',
    read: '3 мин',
  },
  {
    nm: 'Годовой взнос: срок до 31 марта',
    sub: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта',
    tag: 'ВЗНОСЫ',
    by: 'Исполком',
    read: '2 мин',
  },
  {
    nm: 'Положение о рейтинге: что изменилось',
    sub: 'Коэффициенты турниров и правило пересчёта после главных стартов.',
    at: '19 февраля',
    tag: 'РЕЙТИНГ',
    by: 'Судейская коллегия',
    read: '5 мин',
  },
  {
    nm: 'Итоги Кубка Казахстана 2026',
    sub: 'Результаты, призёры и разбор финала: Смагулов — Ким 4:2.',
    at: '24 февраля',
    tag: 'РЕЗУЛЬТАТЫ',
    by: 'Пресс-служба ФНТ РК',
    read: '4 мин',
  },
];

/* ── Э14.1 · Главная ───────────────────────────────────────────── */

/** Главная: рейтинг, «сейчас играю», ближайший турнир и лента.

    Проп `variant` старой адаптивной рамки сохранён ради истории «Адаптив»:
    у нового слоя своей планшетной рамки пока нет, экран один. */
export function Home14_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <Ph tab="Главная">
      {/* Рейтинг — первым и единственным акцентом: за ним на главную и
          приходят. Синее поле — след выбранного федерацией облика Г-2. */}
      <div className="rounded-xl bg-blue-950 px-4 py-3.5 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">
          Мой рейтинг · сезон 2026
        </div>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-4xl font-bold tabular-nums tracking-tight">2456</span>
          <span className="text-sm font-semibold text-green-400">+8 за турнир</span>
        </div>
        <div className="mt-0.5 text-xs text-blue-200">7-е место в РК · КМС · СКА, Астана</div>
      </div>

      {/* Сейчас играю: во время турнира — соперник, стол, время; карточка
          целиком ведёт в мой турнир и матч. */}
      <div>
        <SecT>Сейчас играю</SecT>
        <button
          type="button"
          data-to="Э14.5"
          className="mt-1.5 w-full rounded-xl border border-green-200 bg-white p-3.5 text-left shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">Кубок Алматы 2026 · 1/8 финала</span>
            <Chip color="success" size="sm">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" /> ИДЁТ
            </Chip>
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <Avatar size="sm">
              <Avatar.Image alt="Жумабеков Расул" src={A(22)} />
              <Avatar.Fallback>Ж</Avatar.Fallback>
            </Avatar>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13.5px] font-semibold">Жумабеков Расул</span>
              <span className="block text-xs text-neutral-500">стол 5 · 14:20 · рейтинг 2312</span>
            </span>
            <span className="text-2xl font-bold tabular-nums">2:1</span>
          </div>
        </button>
      </div>

      {/* Ближайший турнир: название, даты и состояние моей заявки — строка
          ведёт в саму заявку. */}
      <div>
        <SecT>Ближайший турнир</SecT>
        <div className="mt-1.5">
          <Rows>
            <Row
              nm="Кубок Алматы 2026"
              sub="ОРТ · Алматы · 12–14.09"
              pill={{ t: 'НА РАССМОТРЕНИИ', cls: 'wait' }}
              to="Э14.4"
            />
          </Rows>
        </div>
      </div>

      {/* Лента: уведомления §10.1 — каждое открывает свой экран. */}
      <div>
        <SecT>Лента</SecT>
        <div className="mt-1.5">
          <Rows>
            <Row nm="Пара вызвана на стол 5" sub="Кубок Алматы · 1/8 финала · 2 мин назад" pill={{ t: 'ВЫЗОВ', cls: 'live' }} to="Э14.5" />
            <Row nm="Заявка принята" sub="Чемпионат Астаны · подал тренер · 1 ч назад" to="Э14.4" />
            <Row nm="Рейтинг пересчитан" sub="Первенство до 23 лет завершено · −12 · вчера" to="Э14.6" />
            <Row nm="Турнир перенесён" sub="ОРТ «Кубок Иртыша» — новые даты 26–28.10 · вчера" to="Э14.2" />
          </Rows>
        </div>
      </div>

      {/* Новости — две последние, те же материалы, что на публичном сайте. */}
      <div>
        <SecT
          extra={
            <button type="button" data-to="Э14.13" className="text-xs font-medium text-blue-600">
              Все новости
            </button>
          }
        >
          Новости федерации
        </SecT>
        <div className="mt-1.5">
          <Rows>
            {NEWS.slice(0, 2).map((n) => (
              <Row key={n.nm} nm={n.nm} sub={`${n.tag} · ${n.at} · ${n.read}`} to="Э14.13" />
            ))}
          </Rows>
        </div>
      </div>
    </Ph>
  );
}

const Home14_1States = () => (
  <States>
    <Shot tone="info" title="Ближайшего турнира нет" text="Вместо карточки турнира — подводка к календарю." wide>
      <Frag>
        <EmptyBox title="Заявок нет" text="Ближайшие открытые ОРТ — в календаре." />
      </Frag>
    </Shot>

    <Shot tone="info" title="Турнир идёт" text="Появляется блок «Сейчас играю»: соперник, стол, время." wide>
      <Frag>
        <Rows>
          <Row av={A(22)} nm="Стол 5 · сейчас" sub="соперник Жумабеков Р. · 1/8 финала" pill={{ t: 'ИДЁТ', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.2 · Календарь ─────────────────────────────────────────── */

/** Открытые ОРТ — куда заявляюсь сам. Условия допуска стоят прямо в карточке,
    и непроходящее сказано до подачи, а не в отказе после. */
const OPEN14_2 = [
  {
    nm: 'Кубок Алматы 2026',
    mt: 'Алматы · 12–14.09 · приём заявок до 05.09',
    rule: 'Возраст без границы · ценз от 1800 — ваш 2456 проходит · взнос оплачен · нужна медсправка',
    tone: 'ok' as const,
  },
  {
    nm: 'Мангистау кап 2026',
    mt: 'Актау · 03–05.10 · приём заявок до 25.09',
    rule: 'Ценз по рейтингу от 2600. Ваш рейтинг 2456 не проходит — заявиться нельзя',
    tone: 'no' as const,
  },
  {
    nm: 'ОРТ «Шымкент Open»',
    mt: 'Шымкент · 08–10.05 · приём откроется 20.04',
    rule: 'Приём заявок ещё не открыт — кнопка появится вместе с ним',
    tone: 'wait' as const,
  },
];

/** Мои турниры — включая те, куда заявили регион или клуб: у них своей кнопки
    «заявиться» нет и не будет (§8.2). */
const MINE14_2: {
  nm: string;
  sub: string;
  pill: { t: string; cls: 'live' | 'wait' | 'bad' | 'reg' | 'done' };
  /** Переход есть только у своей заявки: чужие составы спортсмен не открывает. */
  to?: string;
}[] = [
  { nm: 'Кубок Алматы 2026', sub: 'заявился сам · одиночный · на рассмотрении', pill: { t: 'НА РАССМОТРЕНИИ', cls: 'wait' as const }, to: 'Э14.4' },
  { nm: 'Чемпионат Республики Казахстан', sub: 'Астана · 18–22.09 · состав подаёт старший тренер региона', pill: { t: 'ЗАЯВИЛ РЕГИОН', cls: 'reg' as const } },
  { nm: 'Евразийская лига · 3-й тур', sub: 'Шымкент · 16–18.05 · заявил клуб · состав «СКА», мужская 2 лига', pill: { t: 'ЗАЯВИЛ КЛУБ', cls: 'reg' as const } },
];

const CAL_TABS = ['Куда могу заявиться', 'Мои турниры'];

/* «Сегодня» экрана — 5 сентября: приём на Кубок Алматы идёт до 05.09, заявка
   подана 02.09 и ждёт решения (хроника Э14.4). День задан данными, а не часами
   машины: макет обязан выглядеть одинаково у всех. */
const TODAY14_2 = '2026-09-05';

/** Событие календаря спортсмена. Своё поле одно — `at`: что стоит в колонке
    времени списка дня. У подачи заявки время известно, у турнира его нет —
    турнир занимает день целиком. */
type CalRow = CalEvent & { at?: string };

/* Месяц сезона: те же даты, что в карточках и строках ниже, — новых турниров
   тут не заводится. Кубок Алматы и Мангистау кап пришли из «Куда могу
   заявиться», чемпионат республики — из «Моих турниров», подача заявки и
   закрытие приёма — из хроники моей заявки (Э14.4).

   Тон говорит, моё это или нет: синий — мой турнир, жёлтый — срок, который
   может кончиться, зелёный — что уже сделано, серый — старт, куда заявляюсь
   не я (или не могу вовсе). */
const SEASON14_2: CalRow[] = [
  {
    id: 'c1', nm: 'Заявка подана', from: '2026-09-02', tone: 'success', at: '19:40',
    sub: 'Кубок Алматы 2026 · ждём решения главного судьи', to: 'Э14.4',
  },
  {
    id: 'c2', nm: 'Приём заявок закрывается', from: '2026-09-05', tone: 'warning',
    sub: 'Кубок Алматы 2026 · дальше жеребьёвка', to: 'Э14.4',
  },
  {
    id: 'c3', nm: 'Кубок Алматы 2026', from: '2026-09-12', till: '2026-09-14', tone: 'accent',
    sub: 'ОРТ · Алматы · моя заявка на рассмотрении', to: 'Э14.4',
  },
  {
    id: 'c4', nm: 'Чемпионат Республики Казахстан', from: '2026-09-18', till: '2026-09-22',
    tone: 'neutral', sub: 'Астана · состав подаёт старший тренер региона',
  },
  {
    id: 'c5', nm: 'Мангистау кап 2026', from: '2026-10-03', till: '2026-10-05', tone: 'neutral',
    sub: 'Актау · ценз от 2600 — ваш рейтинг не проходит',
  },
];

export function Calendar14_2(_props: { variant?: 'desktop' | 'land' } = {}) {
  const [tab, setTab] = useState(CAL_TABS[0]);
  /* День выбирается по-настоящему: точка под числом говорит только «в этот день
     что-то есть», а что именно — отвечает список под месяцем. */
  const [day, setDay] = useState(TODAY14_2);
  /* Многодневный турнир попадает в каждый свой день, поэтому сравниваем с
     интервалом, а не с датой начала. Даты — строки ГГГГ-ММ-ДД, они сравниваются
     как есть, без арифметики дат. */
  const dayEvents = SEASON14_2.filter((e) => day >= e.from && day <= (e.till ?? e.from));

  return (
    <Ph tab="Календарь">
      <PageT t="Календарь" sub="Сезон 2026 · открытые приёмы и мои турниры" />

      {/* Месяц — мини-календарём, а не полной сеткой: в 360 точках ширины
          клетка месяца теряет подпись, и от турнира остаётся полоска без имени.
          Здесь месяц отвечает на «когда всё это», а списки ниже — на «что и на
          каких условиях». */}
      <div className="flex justify-center rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <MiniMonth
          month={TODAY14_2}
          today={TODAY14_2}
          selected={day}
          events={SEASON14_2}
          onPick={setDay}
        />
      </div>
      <DayList
        title={day === TODAY14_2 ? `Сегодня, ${dateWords(day)}` : dateWords(day)}
        items={dayEvents.map((e) => ({
          id: e.id,
          t: e.at ?? 'весь день',
          nm: e.nm,
          sub: e.sub,
          tone: e.tone,
          to: e.to,
        }))}
      />

      <FilterSeg items={CAL_TABS} active={tab} onPick={setTab} />

      {tab === CAL_TABS[0] ? (
        <>
          {OPEN14_2.map((t) => (
            <div key={t.nm} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
              <Pill t="ОТКРЫТЫЙ РЕСПУБЛИКАНСКИЙ" color="accent" />
              <div className="mt-1.5 text-[15px] font-semibold leading-tight">{t.nm}</div>
              <div className="mt-0.5 text-xs text-neutral-500">{t.mt}</div>
              {/* Условия допуска: проверяет система, а не человек. Непроходящий
                  ценз — красным до подачи. */}
              <div
                className={
                  'mt-2.5 rounded-lg px-3 py-2 text-[12px] leading-relaxed ' +
                  (t.tone === 'no'
                    ? 'bg-red-50 text-red-800'
                    : t.tone === 'wait'
                      ? 'bg-neutral-50 text-neutral-600'
                      : 'bg-green-50 text-green-900')
                }
              >
                {t.rule}
              </div>
              {t.tone === 'ok' && (
                <div className="mt-2.5">
                  <PrimaryAction to="Э14.3">Заявиться</PrimaryAction>
                </div>
              )}
            </div>
          ))}
          <Bar>
            Стартов, куда состав подаёт регион или клуб, в этом списке нет — они на вкладке
            «Мои турниры».
          </Bar>
        </>
      ) : (
        <>
          <Rows>
            {MINE14_2.map((r) => (
              <Row key={r.nm} nm={r.nm} sub={r.sub} pill={r.pill} to={r.to} />
            ))}
          </Rows>
          <Bar>
            Кто заявил, видно в строке: сам — открывается моя заявка, регион и клуб — состав
            подают они, у спортсмена тут только просмотр.
          </Bar>
        </>
      )}
    </Ph>
  );
}

const Calendar14_2States = () => (
  <States>
    <Shot tone="info" title="Приём не открыт / закрыт" text="Кнопка заменена сроком." wide>
      <Frag>
        <Rows>
          <Row nm="ОРТ «Шымкент Open»" sub="приём откроется 20.04" pill={{ t: 'ЖДЁМ', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="warning" title="Взнос не оплачен, а турнир его требует" text="Кнопка с предупреждением — ⚠ 6.1." wide>
      <Frag>
        <Rows>
          <Row nm="Кубок Алматы 2026" sub="нужен годовой взнос федерации" pill={{ t: 'ВЗНОС НЕ ОПЛАЧЕН', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Заявку подать можно, но допуск может не пройти — решение федерации не получено.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Открытых приёмов нет ✳"
      text="Пустой список с подсказкой, когда откроется ближайший."
      wide
    >
      <Frag w={430}>
        <EmptyBox
          title="Сейчас заявиться некуда"
          text="Ближайший открытый приём — ОРТ «Шымкент Open», с 20 апреля. Турниры, куда вас заявляют регион или клуб, остаются на вкладке «Мои турниры»."
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.3 · Заявка на ОРТ ─────────────────────────────────────── */

/* Условия допуска: их проверяет система, а не человек. `need: false` — условие
   у этого турнира не выставлено (ценз по рейтингу): это не «провалено» и не
   «пройдено», поэтому строка серая. */
const TERMS14_3 = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', need: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', need: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', need: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', need: false },
];

export function Apply14_3() {
  return (
    <Ph tab="Календарь">
      <BackLink label="Календарь сезона" to="Э14.2" />
      {/* Бланк начинается не со слова «Заявка», а с того, на какой турнир и до
          какого числа принимают: срок — единственное, что может кончиться. */}
      <div className="flex items-start justify-between gap-3">
        <PageT t="Кубок Алматы 2026" sub="ОРТ · Алматы · 12–14 сентября" />
        <div className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1.5 text-right">
          <div className="text-[15px] font-bold leading-none text-amber-700">до 05.09</div>
          <div className="mt-0.5 text-[10px] text-amber-700/80">приём заявок</div>
        </div>
      </div>

      {/* Бланк — одна карточка: разряды, документы и отправка. Разными
          карточками они были, пока экран не мерили телефоном: три шапки съедали
          полторы сотни точек, и кнопка «Подать заявку» вместе с загрузкой
          справки уезжала за нижний край — на экране заявки не было видно, чем
          её подают. */}
      <Panel title="Заявка" sub="разряды и документы этого турнира" flush>
        <div className="divide-y divide-neutral-100">
          {/* Выбор — статичная строка «значение + шеврон», без портала:
              выпадающий список одного экрана на борде накрыл бы соседние. */}
          <div className="px-4 py-2.5"><FormGrid>
            <FieldPick k="Разряд" v="Одиночный" />
            <FieldPick k="Возрастная группа" v="Взрослые" />
            <FieldPick k="Парный разряд ✳" v="партнёр не выбран" quiet />
          </FormGrid></div>
        </div>
        {/* Документы: загрузка есть, только если у турнира выставлен флаг. */}
        <div className="border-t border-neutral-100 px-4 pb-3 pt-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Документы · нужна медицинская справка
          </div>
          <FileDrop label="Медицинская справка" hint="PDF или фото · до 10 МБ" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <span className="text-[11.5px] leading-tight text-neutral-500">
            Решение принимает главный судья турнира
          </span>
          <Button variant="primary" data-to="Э14.4">
            <Send size={14} /> Подать заявку
          </Button>
        </div>
      </Panel>

      <Panel title="Условия допуска" sub="проверено системой" flush>
        <div className="divide-y divide-neutral-100">
          {TERMS14_3.map((t) => (
            <div key={t.nm} className={'flex items-center gap-2.5 px-4 py-1.5' + (t.need ? '' : ' opacity-55')}>
              <span
                className={
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full ' +
                  (t.need ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400')
                }
              >
                {t.need ? <Check size={12} /> : <X size={12} />}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px] font-medium">{t.nm}</span>
                <span className="block text-xs text-neutral-500">{t.ss}</span>
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Bar>
        Тренер может подать заявку за вас (§8.2) — тогда в «Моей заявке» видно, кто подал.
      </Bar>
    </Ph>
  );
}

/** Поле-выбор бланка: подпись слева, значение и шеврон справа — телефонная
    форма читается значениями, серые коробки их прятали. */
const FieldPick = ({ k, v, quiet }: { k: string; v: string; quiet?: boolean }) => (
  <div className="col-span-2 flex items-center justify-between gap-3 py-1">
    <span className="text-[13px] text-neutral-500">{k}</span>
    <span className={'flex items-center gap-1 text-[13.5px] font-medium ' + (quiet ? 'text-neutral-400' : '')}>
      {v}
      <ChevronRight size={15} className="text-neutral-300" />
    </span>
  </div>
);

const Apply14_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="Пара — подтверждение вторым игроком"
      text="⚠ Не описано, как именно партнёр подтверждает пару; дальше не проектируем."
      wide
    >
      <Frag w={430}>
        <Rows>
          <Row nm="Парный разряд · Пак С." sub="ждём подтверждения партнёра" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.4 · Моя заявка ────────────────────────────────────────── */

/* Шаги заявки. `done` — уже случилось, `now` — то, чего ждём прямо сейчас. */
const STEPS14_4: Step[] = [
  { t: 'Заявка подана', ss: 'вами, через календарь сезона', at: '02.09, 19:40', done: true },
  { t: 'Решение главного судьи', ss: 'придёт уведомлением', at: 'ждём', now: true },
  { t: 'Жеребьёвка', ss: 'после закрытия приёма', at: '05.09' },
  { t: 'Вызов на стол', ss: 'в день игры, уведомлением', at: '12.09' },
];

export function MyApp14_4() {
  return (
    <Ph tab="Календарь">
      <BackLink label="Календарь сезона" to="Э14.2" />
      {/* На этот экран приходят с одним вопросом — «что с моей заявкой», поэтому
          состояние набрано крупно, а турнир ушёл в подстрочник. */}
      <div className="flex items-start justify-between gap-3">
        <div className="leading-tight">
          <div className="flex items-center gap-2 text-[19px] font-bold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            На рассмотрении
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Кубок Алматы 2026 · подана 02.09.2026, 19:40
          </div>
        </div>
        {/* Пока приём открыт, отзыв — единственное действие экрана. */}
        <QuietAction>Отозвать заявку</QuietAction>
      </div>

      <Panel title="Что уже было и что дальше" sub="даты появляются, когда шаг случится">
        <Steps items={STEPS14_4} />
      </Panel>

      <Panel title="Заявка" flush>
        <div className="px-4 py-1">
          <KV
            items={[
              ['Турнир', 'Кубок Алматы 2026 · ОРТ'],
              ['Разряд', 'Одиночный'],
              ['Возрастная группа', 'Взрослые'],
              ['Кем подана', 'вами'],
            ]}
          />
        </div>
      </Panel>

      {/* Кем подана — сам или тренер: у заявок это видно строкой. */}
      <div>
        <SecT>Другие заявки сезона</SecT>
        <div className="mt-1.5">
          <Rows>
            <Row nm="Чемпионат Астаны 2026" sub="подана 12.08 · тренером Оспановым Т. · одиночный" pill={{ t: 'ПРИНЯТА', cls: 'live' }} />
            <Row nm="Кубок Тараза 2026" sub="«справка не того образца — нужен допуск к соревнованиям»" pill={{ t: 'ОТКЛОНЕНА', cls: 'bad' }} action="Исправить" actionTo="Э14.3" />
          </Rows>
        </div>
      </div>
    </Ph>
  );
}

const MyApp14_4States = () => (
  <States>
    <Shot tone="danger" title="Заявка отклонена" text="Причина — текст судьи, видна сразу; пока приём открыт можно исправить и подать снова." wide>
      <Frag>
        <Rows>
          <Row nm="ОРТ «Кубок Иртыша»" sub="«нет медицинского допуска»" pill={{ t: 'ОТКЛОНЕНА', cls: 'bad' }} />
        </Rows>
        <div className="mt-3">
          <PrimaryAction to="Э14.3">Исправить и подать снова</PrimaryAction>
        </div>
      </Frag>
    </Shot>

    <Shot tone="success" title="Заявка принята" text="Дальше — вызов на стол уведомлением, экран матча (Э14.5)." wide>
      <Frag>
        <Rows>
          <Row nm="Кубок Алматы 2026" sub="принята 03.09 · ждите жеребьёвку" pill={{ t: 'ПРИНЯТА', cls: 'live' }} to="Э14.5" />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.5 · Мой турнир и мой матч ─────────────────────────────── */

/* Экран турнира — вкладки: свой матч, участники, (группы) и сетка. Сетке нужен
   весь экран (её и на фронте так смотрят), поэтому это отдельная вкладка. */
const TABS14_5 = ['Мой матч', 'Участники', 'Сетка'];

/* Участники турнира: посев, рейтинг, регион и клуб. Список большой (128 на
   главном старте) — таблица с поиском, сортировкой и страницами по 30. */
export type Ply14 = { s: number; nm: string; city: string; club: string; r: number; me?: boolean; foe?: boolean };

const SURNAMES = [
  'Смагулов', 'Ким', 'Токаев', 'Жумабеков', 'Пак', 'Гладун', 'Оспанов', 'Байжанов',
  'Абиш', 'Сериков', 'Цой', 'Ли', 'Мурат', 'Асан', 'Бекзат', 'Кайрат',
  'Нурлан', 'Тлеу', 'Садык', 'Жанибек', 'Алтай', 'Ерасыл', 'Мади', 'Арман',
];
const FIRSTS = ['Алан', 'Георгий', 'Марат', 'Расул', 'Сергей', 'Игорь', 'Тимур', 'Ерасыл', 'Данияр', 'Асхат'];
const CITIES: [string, string][] = [
  ['Астана', 'СКА'], ['Алматы', '«Алатау»'], ['Шымкент', '«Жетісу»'], ['Караганда', '«Шахтёр»'],
  ['Павлодар', '«Иртыш»'], ['Актобе', '«Актобе»'], ['Тараз', 'без клуба'], ['Костанай', '«Тобол»'],
];

/** 128 участников: посев по рейтингу, рейтинг убывает от первого номера.
    Фамилия и имя не повторяются парами — иначе в списке появляется второй
    «Ким Георгий», и непонятно, кто из них ты.

    Экспортируется: состав участников у всех ролей один и тот же, и клуб (Э13.9)
    строит из него свой срез — участников по клубам. Второй такой же список для
    другой роли — это два состава одного турнира, которые разъедутся. */
export const PLAYERS: Ply14[] = Array.from({ length: 128 }, (_, i) => {
  const [city, club] = CITIES[i % CITIES.length];
  /* Имя не идёт следом за фамилией ровным шагом: иначе двадцать четыре строки
     подряд оказывались «… Алан», и список читался как сгенерированный. Пара
     «фамилия + имя» при этом не повторяется — цикл длиннее списка. */
  const nm = `${SURNAMES[i % SURNAMES.length]} ${FIRSTS[(i * 7 + Math.floor(i / SURNAMES.length)) % FIRSTS.length]}`;
  return { s: i + 1, nm, city, club, r: 2612 - i * 7 - (i % 5) };
});
PLAYERS[1] = { ...PLAYERS[1], nm: 'Ким Георгий', city: 'Астана', club: 'СКА', r: 2456, me: true };
PLAYERS[3] = { ...PLAYERS[3], nm: 'Жумабеков Расул', city: 'Алматы', club: '«Алатау»', r: 2312, foe: true };

const PER_PAGE = 30;
/** Колонки таблицы участников: по каким сортируют. */
const COLS14: { k: 's' | 'nm' | 'club' | 'r'; t: string }[] = [
  { k: 's', t: '№ посева' },
  { k: 'nm', t: 'Участник' },
  { k: 'club', t: 'Регион и клуб' },
  { k: 'r', t: 'Рейтинг' },
];

/** Сетка колонок состава: последняя — под значок «ВЫ / ВАШ СОПЕРНИК», ширина
    по содержимому, чтобы телефонная ширина не резала фамилии. */
const PL_GRID = '2.6rem minmax(0,1.6fr) minmax(0,1.2fr) 3.2rem auto';

/** Вкладка «Участники»: таблица состава — поиск, сортировка, страницы по 30.

    Компонент общий: список участников турнира у всех ролей один, разный только
    срез «мои» — федерация помечает сеяных (Э1.3), клуб и регион своих (Э13.9,
    Э12.5), спортсмен себя и соперника. */
export function Players14_5({
  mark,
  list = PLAYERS,
}: {
  mark?: (p: Ply14) => { t: string; cls: string } | undefined;
  /** Чей состав показываем: у турнира федерации в составе принятые, а не все. */
  list?: Ply14[];
} = {}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS14)[number]['k']; up: boolean }>({ k: 's', up: true });
  const [page, setPage] = useState(0);

  /* Кого подсвечивать строкой: спортсмену — себя, чужим ролям — их срез. */
  const hit = (p: Ply14) => (mark ? Boolean(mark(p)) : Boolean(p.me));

  const found = list.filter((p) => {
    const t = q.trim().toLowerCase();
    return !t || p.nm.toLowerCase().includes(t) || p.club.toLowerCase().includes(t) || p.city.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const v = k === 'nm' || k === 'club' ? String(a[k]).localeCompare(String(b[k]), 'ru') : Number(a[k]) - Number(b[k]);
    return sort.up ? v : -v;
  });
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);

  return (
    <>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <SearchInput
          value={q}
          onChange={(v) => { setQ(v); setPage(0); }}
          placeholder="Фамилия, клуб или регион"
          className="min-w-0 flex-1"
        />
        <span className="shrink-0 text-[11.5px] text-neutral-500">
          {rows.length === list.length ? `${list.length} участников` : `найдено ${rows.length} из ${list.length}`}
        </span>
      </div>

      <Sheet
        grid={PL_GRID}
        cols={COLS14.map((c) => (
          <Th
            key={c.k}
            t={c.t}
            on={sort.k === c.k}
            onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
          />
        )).concat(<span key="mk" />)}
      >
        {shown.map((p) => {
          const m = mark ? mark(p) : undefined;
          return (
            <div
              key={p.s}
              data-row
              className={
                'grid items-center gap-2 px-3 py-2 text-[13px] ' +
                (hit(p) ? 'bg-blue-50/60' : 'hover:bg-neutral-50')
              }
              style={{ gridTemplateColumns: PL_GRID }}
            >
              <span className="tabular-nums text-neutral-500">{p.s}</span>
              <span className="truncate font-medium">{p.nm}</span>
              <span className="truncate text-neutral-500">{p.city} · {p.club}</span>
              <span className="tabular-nums">{p.r}</span>
              <span className="flex justify-end">
                {mark ? (
                  m && <P t={m.t} cls={m.cls} />
                ) : (
                  <>
                    {p.me && <P t="ВЫ" cls="reg" />}
                    {p.foe && <P t="ВАШ СОПЕРНИК" cls="live" />}
                  </>
                )}
              </span>
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="px-4 py-4 text-[12.5px] text-neutral-500">
            По запросу «{q}» никого нет — проверьте написание фамилии.
          </div>
        )}
      </Sheet>

      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-[11.5px] text-neutral-500">
          {rows.length ? `${cur * PER_PAGE + 1}–${cur * PER_PAGE + shown.length} из ${rows.length}` : '0 из 0'}
        </span>
        <Pager page={cur} pages={pages} onPick={setPage} />
      </div>
    </>
  );
}

/** Вкладка «Кто приехал»: участники, собранные по клубам или по регионам.

    Отвечает на вопрос, который возникает раньше сетки: кто вообще приехал.
    Один компонент на две роли, разный только срез: клуб смотрит по клубам
    (Э13.9), старший тренер региона — по регионам (Э12.5). Свой стоит первым и
    раскрыт, и внутри у него `ours` — те же люди со своим состоянием, что на
    соседней вкладке «Наши»: один срез в двух местах обязан совпадать. */
export function Squads14_5({
  by,
  our,
  ours,
  title,
}: {
  /** По чему собираем: клуб или регион участника. */
  by: 'club' | 'city';
  /** Свой клуб или регион — он первым и раскрытым. */
  our: string;
  /** Чем раскрывается свой: готовые строки со состоянием. */
  ours: { key: string; av?: string; nm: string; sub: string; pill?: { t: string; cls: 'live' | 'wait' | 'bad' | 'reg' | 'done' } }[];
  title: string;
}) {
  const [open, setOpen] = useState<string | null>(our);

  const groups = Object.values(
    PLAYERS.reduce<Record<string, { nm: string; note: string; men: Ply14[] }>>((acc, p) => {
      const k = p[by];
      (acc[k] ??= { nm: k, note: by === 'club' ? p.city : p.club, men: [] }).men.push(p);
      return acc;
    }, {}),
  ).sort((a, b) => (a.nm === our ? -1 : b.nm === our ? 1 : b.men.length - a.men.length));

  return (
    <Panel
      title={`${title} · ${groups.length}`}
      extra={<span className="text-xs text-neutral-500">строка раскрывает участников</span>}
      flush
    >
      <div className="divide-y divide-neutral-100">
        {groups.map((g) => {
          const mine = g.nm === our;
          const on = g.nm === open;
          const n = mine ? ours.length : g.men.length;
          /* Лучший посев — единственное число, которое здесь честно: результаты
             ведёт судья, и до конца турнира их нет вовсе. */
          const best = Math.min(...g.men.map((m) => m.s));
          const pick = () => setOpen(on ? null : g.nm);
          return (
            <Fragment key={g.nm}>
              <Row
                nm={g.nm === 'без клуба' ? 'Без клуба' : g.nm}
                sub={mine ? 'наши на этом турнире' : `лучший посев ${best}`}
                val={`${n} участников`}
                pill={mine ? { t: by === 'club' ? 'НАШ КЛУБ' : 'НАШ РЕГИОН', cls: 'reg' } : undefined}
                on={on}
                onSelect={pick}
                action={on ? 'Свернуть' : 'Показать'}
                onAction={pick}
              />
              {on && (
                <div className="divide-y divide-neutral-100 bg-neutral-50/70 pl-4">
                  {mine
                    ? ours.map((o) => <Row key={o.key} av={o.av} nm={o.nm} sub={o.sub} pill={o.pill} />)
                    : g.men.slice(0, 4).map((m) => <Row key={m.s} nm={`${m.s} · ${m.nm}`} sub={`рейтинг ${m.r}`} />)}
                  {!mine && (
                    <div className="px-4 py-2 text-[11.5px] text-neutral-500">
                      Показаны 4 из {g.men.length} · весь состав — на вкладке «Участники»
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

/* Мой путь по сетке — хроника, а не список: у кругов есть порядок, и важно,
   в каком из них мы сейчас. */
const PATH14_5: Step[] = [
  { t: '1/16 финала', ss: 'Оралбек Диас', at: '4 : 1', done: true },
  { t: '1/8 финала', ss: 'Жумабеков Расул · идёт', at: '2 : 1', now: true },
  { t: '1/4 финала', ss: 'соперник определится после 1/8', at: '—' },
];

/** Вкладка «Мой матч»: счёт как на табло — крупные числа друг напротив друга,
    в этой форме счёт читают в зале и в протоколе. */
const MyMatch14_5 = () => (
  <>
    <Panel title="Мой матч" sub="счёт ведёт судья стола — вводить и подтверждать его не нужно" flush>
      <div className="divide-y divide-neutral-100">
        {[
          { av: ME, nm: 'Ким Георгий', ss: 'рейтинг 2456 · вы', d: 2 },
          { av: A(22), nm: 'Жумабеков Расул', ss: 'рейтинг 2312 · Шымкент, «Жетісу»', d: 1 },
        ].map((p) => (
          <div key={p.nm} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar size="md">
              <Avatar.Image alt={p.nm} src={p.av} />
              <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
            </Avatar>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[14px] font-semibold">{p.nm}</span>
              <span className="block text-xs text-neutral-500">{p.ss}</span>
            </span>
            <span className="text-4xl font-bold tabular-nums tracking-tight">{p.d}</span>
          </div>
        ))}
      </div>
      {/* Партии сыгранные — ячейками табло, идущая — словами: у неё ещё нет
          победителя, и красить её как сыгранную нельзя. */}
      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
        <GameCells games={[[11, 7], [9, 11], [11, 8]]} />
        <span className="text-xs font-medium text-green-700">4-я партия · 6:4</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-2">
        <span className="text-[11.5px] text-neutral-500">Стол 5 · 1/8 финала · личные встречи 4–1 в вашу пользу</span>
        <P t="ИДЁТ" cls="live" />
      </div>
    </Panel>

    <Panel title="Мой путь по сетке">
      <Steps items={PATH14_5} />
    </Panel>
  </>
);

/** Вкладка «Сетка»: сетку рисует тот же компонент, что и на фронте. Холст
    светлый и мои матчи подсвечены (решение 25.08.2026): тёмный холст посреди
    светлого экрана читался чужой врезкой. */
const Bracket14_5 = () => (
  <div className="relative h-[560px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
    <div className="absolute inset-0 [&>div]:h-full!">
      <BracketFlow bracket={myBracket} minZoom={0.15} fitPadding={0.06} tone="light" minePlayerId={ME_ID} />
    </div>
  </div>
);

/** Вкладка «Группы» — только у формата «групповой этап с плей-офф» (TZ §5.1).
    Спортсмену тут важно одно: выхожу я из группы или нет — «выходит / выбыл»
    стоит в строке, а не считается в уме. */
const Groups14_5 = () => (
  <>
    <Panel title="Моя группа · A" extra={<P t="ВЫХОДЯТ ДВОЕ" cls="reg" />} flush>
      <DataTable
        cols={['№', 'Игрок', 'Матчи', 'Партии', '']}
        grid="1.4rem minmax(0,1.5fr) 3.2rem 3.2rem auto"
        rows={MY_GROUP.map((g) => ({
          key: g.nm,
          on: g.me,
          cells: [
            <b key="p" className="tabular-nums">{g.place}</b>,
            <span key="n" className={'truncate ' + (g.me ? 'font-semibold' : 'font-medium')}>
              {g.nm}{g.me ? ' · вы' : ''}
            </span>,
            <span key="w" className="tabular-nums text-neutral-600">{g.wl}</span>,
            <span key="s" className="tabular-nums text-neutral-600">{g.sets}</span>,
            <span key="o" className="flex justify-end">
              {g.out ? <P t="В ПЛЕЙ-ОФФ" cls="live" /> : <P t="ВЫБЫЛ" cls="done" />}
            </span>,
          ],
        }))}
      />
      <div className="px-4 py-2 text-[11.5px] text-neutral-500">
        Группа сыграна · дальше — плей-офф на вкладке «Сетка»
      </div>
    </Panel>

    <Panel title="Остальные группы · 8" flush>
      <div className="divide-y divide-neutral-100">
        {OTHER_GROUPS.map((g) => (
          <Row key={g.nm} nm={g.nm} sub={g.sub} val={g.out} />
        ))}
      </div>
    </Panel>
  </>
);

/** Плей-офф после групп: сетка короче, и в неё попадают вышедшие из групп. */
const Playoff14_5 = () => (
  <div className="relative h-[560px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
    <div className="absolute inset-0 [&>div]:h-full!">
      <BracketFlow bracket={playoffBracket} minZoom={0.15} fitPadding={0.06} tone="light" minePlayerId={ME_ID} />
    </div>
  </div>
);

/** Экран турнира. `tab` — с какой вкладки открыт: борд и карта флоу показывают
    вкладки открытыми. `groups` — формат с групповым этапом: добавляется
    вкладка «Группы», а «Сетка» показывает плей-офф из вышедших. */
export function Match14_5({ tab, groups }: { tab?: string; groups?: boolean }) {
  return (
    <Ph tab="Мой турнир">
      <PageT
        t="Кубок Алматы 2026"
        sub={groups ? 'Группы и плей-офф · группа A · стол 5' : '1/8 финала · стол 5'}
      />
      <div>
        <PageTabs
          active={tab}
          items={[
            { t: TABS14_5[0], view: <MyMatch14_5 /> },
            { t: TABS14_5[1], view: <Players14_5 /> },
            ...(groups ? [{ t: 'Группы', view: <Groups14_5 /> }] : []),
            { t: TABS14_5[2], view: groups ? <Playoff14_5 /> : <Bracket14_5 /> },
          ]}
        />
      </div>
    </Ph>
  );
}

const Match14_5States = () => (
  <States>
    <Shot tone="danger" title="Счёт своего матча спортсмен не вводит" text="Счёт ведёт судья на столе; спортсмен его не вводит и не подтверждает." wide>
      <Frag>
        <Rows>
          <Row nm="Счёт матча" sub="ведёт судья стола" pill={{ t: 'ТОЛЬКО СМОТРИМ', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="success" title="Вас вызвали" text="«Подойдите к столу N» — после вызова главным судьёй." wide>
      <Frag>
        <Rows>
          <Row nm="Подойдите к столу 5" sub="вызвал главный судья · сейчас" pill={{ t: 'ВЫЗОВ', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Турнир завершён"
      text="Тот же экран открывается строкой турнира из аналитики: сетка на чтение, мои матчи, дельта рейтинга."
      wide
    >
      <Frag w={430}>
        <Rows>
          <Row nm="1/16 финала" sub="Оралбек Д. · 4:1" val="+11" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
          <Row nm="1/8 финала" sub="Жумабеков Р. · 2:4" val="−3" pill={{ t: 'ПОРАЖЕНИЕ', cls: 'bad' }} />
          <Row nm="Итог турнира" sub="1/8 финала · рейтинг пересчитан 15.09" val="+8" pill={{ t: 'ЗАВЕРШЁН', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    {/* Четвёртое состояние из данных роли: у формата с группами вкладок не три,
        а четыре. В макете турнир олимпийский, поэтому таблицу своей группы
        показываем кадром — иначе решение живёт только текстом. */}
    <Shot
      tone="info"
      title="Групповой этап с плей-офф"
      text="Появляется вкладка «Группы»: таблица своей группы и остальные группы, а «Сетка» показывает плей-офф из вышедших."
      wide
    >
      <Frag w={430}>
        <Rows>
          {MY_GROUP.map((g) => (
            <Row
              key={g.nm}
              nm={`${g.place} · ${g.nm}${g.me ? ' · вы' : ''}`}
              sub={`матчи ${g.wl} · партии ${g.sets}`}
              pill={g.out ? { t: 'В ПЛЕЙ-ОФФ', cls: 'live' } : { t: 'ВЫБЫЛ', cls: 'done' }}
            />
          ))}
        </Rows>
        <div className="mt-3">
          <Bar>Пока группа не сыграна, в сетке вместо имён стоят места в группах.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.6 · Аналитика ─────────────────────────────────────────── */

/** Турнир, который спортсмен сыграл: где закончил, что получил в рейтинг и с
    каким рейтингом ушёл. `r` — рейтинг **после** турнира: из него и строится
    кривая. */
type Played = {
  nm: string;
  cat: string;
  d: string;
  /** Где закончил: стадия или место. */
  stage: string;
  w: number;
  l: number;
  /** Дельта рейтинга за турнир. */
  dr: number;
  r: number;
};

const PLAYED: Played[] = [
  { nm: 'Открытие сезона 2026', cat: 'ОРТ · Астана', d: '19.01', stage: '1/4 финала', w: 3, l: 1, dr: 22, r: 2410 },
  { nm: 'Чемпионат Казахстана 2026', cat: 'Главный старт · Астана', d: '20.05', stage: '1/8 финала', w: 2, l: 1, dr: -6, r: 2404 },
  { nm: 'Кубок Сарыарки 2026', cat: 'ОРТ · Караганда', d: '14.06', stage: 'полуфинал', w: 4, l: 1, dr: 18, r: 2422 },
  { nm: 'Евразийская лига, 2-й тур', cat: 'Лига · Алматы', d: '11.07', stage: 'команда 3-я', w: 2, l: 2, dr: 4, r: 2426 },
  { nm: 'Первенство РК до 23 лет', cat: 'Главный старт · Шымкент', d: '02.08', stage: '1/16 финала', w: 1, l: 1, dr: -12, r: 2414 },
  { nm: 'Кубок Алматы 2026', cat: 'ОРТ · Алматы', d: '14.09', stage: '1/8 финала', w: 2, l: 1, dr: 8, r: 2422 },
  { nm: 'ОРТ «Кубок Иртыша»', cat: 'ОРТ · Павлодар', d: '26.10', stage: 'финал', w: 5, l: 1, dr: 34, r: 2456 },
];

/** Личная встреча с одним соперником: сколько играли, кто сколько взял, что
    было в последний раз. Данные сходятся с историей турниров: сумма встреч по
    соперникам равна числу сыгранных матчей сезона. */
type Foe = {
  av: string;
  nm: string;
  club: string;
  /** Рейтинг соперника — по нему видно, вровень играем или нет. */
  r: number;
  w: number;
  l: number;
  /** Партии: выиграно — проиграно. */
  sets: [number, number];
  last: string;
  lastWin: boolean;
};

const FOES: Foe[] = [
  { av: A(32), nm: 'Смагулов Алан', club: 'Алматы · «Алатау»', r: 2612, w: 1, l: 2, sets: [5, 9], last: 'Кубок Иртыша, финал · 1:4', lastWin: false },
  { av: A(22), nm: 'Жумабеков Расул', club: 'Алматы · «Алатау»', r: 2312, w: 4, l: 1, sets: [17, 8], last: 'Кубок Алматы, 1/8 · 4:2', lastWin: true },
  { av: A(51), nm: 'Токаев Марат', club: 'Шымкент · «Жетісу»', r: 2596, w: 3, l: 2, sets: [15, 12], last: 'Первенство до 23, 1/16 · 2:4', lastWin: false },
  { av: A(13), nm: 'Пак Сергей', club: 'Павлодар · «Иртыш»', r: 2580, w: 3, l: 1, sets: [13, 8], last: 'Кубок Сарыарки, 1/2 · 4:1', lastWin: true },
  { av: A(19), nm: 'Цой Виктор', club: 'Караганда · «Шахтёр»', r: 2542, w: 4, l: 0, sets: [16, 5], last: 'Открытие сезона, 1/4 · 4:0', lastWin: true },
  { av: A(60), nm: 'Сериков Нурлан', club: 'Астана · СКА', r: 2545, w: 4, l: 2, sets: [18, 13], last: 'Лига, 2-й тур · 2:3', lastWin: false },
];

/* Сходимость: 19 побед и 8 поражений — это и сумма по соперникам, и сумма по
   турнирам выше, и те самые 27 матчей сезона в подзаголовке экрана. Числа на
   одном экране, которые не сходятся между собой, читаются как ошибка данных. */

/** Кривая рейтинга по сыгранным турнирам. Линия, а не столбики: рейтинг —
    непрерывная величина, и вопрос к ней «куда идёт», а не «сколько за раз». */
const RatingChart = () => (
  <ChartBox
    height={180}
    label="Динамика рейтинга по турнирам сезона"
    make={(el) => ({
      type: 'line',
      data: {
        labels: PLAYED.map((t) => t.d),
        datasets: [
          {
            label: 'Рейтинг',
            data: PLAYED.map((t) => t.r),
            borderColor: token('--c-accent', el),
            backgroundColor: soft('--c-accent', 18, el),
            pointBackgroundColor: PLAYED.map((t) =>
              t.dr >= 0 ? token('--c-success', el) : token('--c-danger', el),
            ),
            pointBorderColor: token('--c-panel', el),
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              /* В подсказке — сам турнир и его дельта: по одной дате человек
                 не вспомнит, что было 11 июля. */
              title: (i) => PLAYED[i[0].dataIndex].nm,
              label: (i) => {
                const t = PLAYED[i.dataIndex];
                return `${t.r} · ${t.dr >= 0 ? '+' : ''}${t.dr} · ${t.stage}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), font: { size: 10 } },
          },
          y: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), font: { size: 10 } },
          },
        },
      },
    })}
  />
);

/** Личные встречи столбиками: победы и поражения по каждому сопернику в одной
    полосе. Горизонтально — подписи это фамилии, вертикаль их ставила бы боком. */
const FoesChart = () => (
  <ChartBox
    height={200}
    label="Личные встречи: победы и поражения по каждому сопернику"
    make={(el) => ({
      type: 'bar',
      data: {
        labels: FOES.map((f) => f.nm.split(' ')[0]),
        datasets: [
          { label: 'Победы', data: FOES.map((f) => f.w), backgroundColor: token('--c-success', el), borderWidth: 0 },
          { label: 'Поражения', data: FOES.map((f) => f.l), backgroundColor: soft('--c-danger', 70, el), borderWidth: 0 },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: token('--c-muted', el), boxWidth: 10, font: { size: 10 } },
          },
          tooltip: {
            callbacks: {
              afterBody: (i) => {
                const f = FOES[i[0].dataIndex];
                return `партии ${f.sets[0]}:${f.sets[1]} · последняя — ${f.last}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), stepSize: 1, font: { size: 10 } },
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { color: token('--c-muted', el), font: { size: 10 } },
          },
        },
      },
    })}
  />
);

/** История турниров: где играл, чем кончил и что это дало рейтингу. Строка
    открывает тот же экран, что и по ходу игры (Э14.5), но завершённый. */
const HISTORY_COLS = ['Турнир', 'Дата', 'Где закончил', 'В–П', 'Рейтинг'];

const History14_6 = () => (
  <DataTable
    cols={HISTORY_COLS}
    grid="minmax(0,1.4fr) 2.6rem minmax(0,1.1fr) 2.2rem 3.4rem"
    rows={[...PLAYED].reverse().map((t) => ({
      key: t.nm,
      to: 'Э14.5',
      cells: [
        <span key="n" className="block min-w-0 leading-tight">
          <span className="block truncate font-medium">{t.nm}</span>
          <span className="block truncate text-[11px] text-neutral-500">{t.cat}</span>
        </span>,
        <span key="d" className="block tabular-nums text-neutral-600">{t.d}</span>,
        /* `block` не украшение: у строчного элемента `overflow: hidden` не
           действует, и «1/16 финала» налезала на соседний столбец «В–П» вместо
           многоточия. */
        <span key="s" className="block truncate text-neutral-600">{t.stage}</span>,
        <span key="w" className="block tabular-nums text-neutral-600">{t.w}–{t.l}</span>,
        <span key="r" className="leading-tight">
          <b className={'block tabular-nums ' + (t.dr >= 0 ? 'text-green-700' : 'text-red-600')}>
            {t.dr >= 0 ? '+' : ''}{t.dr}
          </b>
          <span className="block text-[11px] tabular-nums text-neutral-500">{t.r}</span>
        </span>,
      ],
    }))}
  />
);

/** Личные встречи списком под графиком: график отвечает «с кем как», список —
    «что именно было». Баланс — единственное цветное в строке: он и есть ответ. */
const Foes14_6 = () => (
  <div className="divide-y divide-neutral-100">
    {FOES.map((f) => (
      <div key={f.nm} className="flex items-center gap-2.5 px-4 py-2.5">
        <Avatar size="sm">
          <Avatar.Image alt={f.nm} src={f.av} />
          <Avatar.Fallback>{f.nm.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-medium">{f.nm}</span>
          <span className="block truncate text-[11px] text-neutral-500">
            {f.club} · рейтинг {f.r} · партии {f.sets[0]}:{f.sets[1]} · {f.last}
          </span>
        </span>
        <span
          className={
            'text-lg font-bold tabular-nums ' +
            (f.w > f.l ? 'text-green-700' : f.w === f.l ? '' : 'text-red-600')
          }
        >
          {f.w}–{f.l}
        </span>
      </div>
    ))}
  </div>
);

/** Аналитика: за ней приходят с вопросом «сколько у меня сейчас» — ответ
    число, а не слово «Аналитика». Блоки идут сверху вниз ✳: каждому нужна вся
    ширина телефона. */
export function Stats14_6() {
  return (
    <Ph tab="Аналитика">
      <div className="rounded-xl bg-blue-950 px-4 py-3.5 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">
          Мой рейтинг · сезон 2026
        </div>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-4xl font-bold tabular-nums tracking-tight">2456</span>
          <span className="text-sm font-semibold text-green-400">+68 за сезон</span>
        </div>
        <div className="mt-0.5 text-xs text-blue-200">7-е место в РК · 70% побед · 7 турниров · 27 матчей</div>
      </div>

      <Panel title="Динамика рейтинга" sub="зелёная точка — турнир в плюс, красная — в минус · 2388 → 2456">
        <RatingChart />
      </Panel>

      <div>
        <SecT>История турниров · строка открывает мою сетку</SecT>
        <div className="mt-1.5">
          <History14_6 />
        </div>
      </div>

      <Panel title="Личные встречи" sub="соперник появляется после первой сыгранной встречи" flush>
        <div className="p-4 pb-2">
          <FoesChart />
        </div>
        <Foes14_6 />
      </Panel>

      <Panel title="Расширенная аналитика" extra={<P t="ПЛАТНАЯ" cls="reg" />}>
        <p className="text-[12.5px] leading-relaxed text-neutral-600">
          Длина розыгрышей и ход партий — считается по вводу счёта по очкам, если судья вёл матч
          по очкам.
        </p>
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Состав расширенной аналитики и её оплата не зафиксированы (§10) — до решения
            федерации кнопка выключена. Всё, что выше, — базовая, она не платная.
          </Bar>
        </div>
        <DisabledAction>Подключить расширенную</DisabledAction>
      </Panel>
    </Ph>
  );
}

const Stats14_6States = () => (
  <States>
    <Shot
      tone="info"
      title="Сезон только начался"
      text="Один турнир — кривой ещё нет, есть точка: график появляется со второго турнира."
      wide
    >
      <Frag w={430}>
        <Rows>
          <Row nm="Открытие сезона 2026" sub="ОРТ · Астана · 19.01 · 1/4 финала" val="+22" pill={{ t: 'ЕДИНСТВЕННЫЙ', cls: 'reg' }} />
        </Rows>
        <div className="mt-3">
          <Bar>Личных встреч тоже пока нет: соперник появляется в списке после первой сыгранной с ним встречи.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Расширенная аналитика — заглушка"
      text="Состав расширенной аналитики и её оплата не зафиксированы; до решения не проектируем."
      wide
    >
      <Frag>
        <EmptyBox title="Расширенная аналитика" text="⚠ Что в неё входит и платная ли она — решения федерации нет." />
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.7 · Мой профиль ───────────────────────────────────────── */

/** Выбран вариант **Д «Личный кабинет»** (29.08.2026, `flows/14-sportsmen.md`):
    профиль — хаб. Портрет, чипы «рейтинг / место / разряд», дальше входы в
    разделы; состояния, из-за которых экран открывают, — неоплаченный взнос и
    неподтверждённая личность — покрашены прямо в строках списка. Паспортные
    поля ушли за пункт «Личные данные» — это цена варианта, записана во флоу. */
export function Profile14_7(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <Ph tab="Профиль">
      {/* Шапка-визитка: кто я и мои три числа. */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-16 bg-linear-to-r from-blue-950 via-blue-900 to-blue-700" />
        <div className="-mt-7 px-4 pb-3.5">
          <Avatar size="lg" className="ring-4 ring-white">
            <Avatar.Image alt="Ким Георгий" src={ME} />
            <Avatar.Fallback>К</Avatar.Fallback>
          </Avatar>
          <div className="mt-1.5 text-[17px] font-bold leading-tight">Ким Георгий</div>
          <div className="text-xs text-neutral-500">2003 г.р. · г. Астана · клуб СКА, подтверждён 12.01.2026</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill t="РЕЙТИНГ 2456" color="accent" />
            <Pill t="7-Е В РК" color="default" />
            <Pill t="КМС" color="default" />
          </div>
        </div>
      </div>

      {/* Годовой взнос — то, из-за чего профиль открывают чаще всего. */}
      <Panel title="Годовой взнос" flush>
        <div className="divide-y divide-neutral-100">
          <Row nm="Взнос 2026 · ₸ 10 000" sub="оплачен картой 14.01.2026 · Halyk ePay" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
          <Row nm="Взнос 2027 · ₸ 10 000" sub="приём открыт с 01.01.2027" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-2.5">
          <span className="text-[11.5px] leading-tight text-neutral-500">
            Оплата на странице банка · состояние видно и вашему тренеру
          </span>
          <Button variant="primary" size="sm" data-to="Э14.8">
            <CreditCard size={14} /> Оплатить картой
          </Button>
        </div>
      </Panel>

      {/* Входы в разделы: строки-хабы, состояние — прямо в строке. */}
      <div>
        <SecT>Мои данные и настройки</SecT>
        <div className="mt-1.5">
          <Rows>
            <Row nm="Личные данные" sub="телефон +7 705 118 44 03 · g.kim@mail.kz" action="Изменить" actionTo="Э14.9" />
            <Row nm="Тренер и разряд" sub="Оспанов Тимур · КМС, присвоен 11.2024" />
            <Row nm="Подтверждение личности" sub="удостоверение проверено при регистрации" pill={{ t: 'ПОДТВЕРЖДЕНО', cls: 'live' }} />
            <Row nm="История платежей" sub="все взносы по сезонам и квитанции" to="Э14.12" />
            <Row nm="Аналитика сезона" sub="рейтинг, турниры и личные встречи" to="Э14.6" />
            <Row nm="Пароль" sub="менялся 12.03.2026" />
            <Row nm="Язык интерфейса" sub="Русский · на нём же приходят письма" />
            <Row nm="Уведомления" sub="вызов на стол, решения по заявкам, рейтинг" pill={{ t: 'ВКЛ', cls: 'reg' }} />
          </Rows>
        </div>
      </div>

      <Bar>
        Взнос требуется на главных стартах и там, где организатор включил требование. Клуб и
        регион меняются не здесь: в клуб зовёт его администратор, в регион — старший тренер.
      </Bar>
    </Ph>
  );
}

const Profile14_7States = () => (
  <States>
    <Shot tone="success" title="Оплачено" text="Состояние меняется само, по подтверждению банка, и видно также тренеру." wide>
      <Frag>
        <Rows>
          <Row nm="Взнос 2026" sub="оплачен картой 14.01" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="info" title="Ждём подтверждения банка" text="«Платёж обрабатывается»: вкладку держать не нужно." wide>
      <Frag>
        <Rows>
          <Row nm="Платёж отправлен" sub="Halyk ePay · обрабатывается" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Оплата не прошла" text="Причина от банка и кнопка повторить." wide>
      <Frag>
        <Rows>
          <Row nm="Платёж отклонён" sub="банк: недостаточно средств" pill={{ t: 'НЕ ПРОШЛА', cls: 'bad' }} action="Повторить" />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="info" title="Клуб зовёт к себе" text="Приглашение ждёт ответа: до принятия в профиле прежний клуб." wide>
      <Frag>
        <Rows>
          <Row nm="СКА · Астана" sub="клуб «Алатау» · Алматы пригласил 14.02" pill={{ t: 'ЖДЁТ ВАС', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.8 · Оплата взноса картой ──────────────────────────────── */

/** Страница банка: наша оболочка сюда не приходит — человек ушёл на ePay.
    Форму рисует банк, поэтому макет условный: важно, что происходит до и
    после, а не как выглядят поля карты. */
const BankPage = ({ children }: { children: ReactNode }) => (
  <Phone>
    <div className="flex items-center justify-between px-5 py-2 text-[11.5px] text-neutral-500">
      <span className="flex items-center gap-1.5">
        <Lock size={12} /> epay.homebank.kz
      </span>
      <span>Halyk Bank · ePay</span>
    </div>
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-3.5 overflow-auto bg-neutral-50 px-4 py-4">
      {children}
    </div>
  </Phone>
);

export function Pay14_8() {
  return (
    <BankPage>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="text-[16px] font-bold leading-tight">Оплата картой</div>
        <div className="mt-0.5 text-xs text-neutral-500">
          Федерация настольного тенниса РК · годовой взнос 2026
        </div>

        <div className="mt-3 flex items-baseline justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
          <span className="text-[12.5px] text-neutral-500">К оплате · заказ 100416</span>
          <b className="text-lg font-bold tabular-nums">₸ 10 000</b>
        </div>

        <div className="mt-3.5">
          <FormGrid>
            <TextInput label="Номер карты" value="4400 43•• •••• 1234" wide />
            <FieldView label="Срок" value="09 / 28" />
            <TextInput label="CVC" value="•••" />
            <TextInput label="Держатель карты" value="GEORGIY KIM" wide />
          </FormGrid>
        </div>

        {/* Кнопка банка ведёт на нашу страницу возврата: успех — Э14.10,
            отказ и отмена — Э14.11. */}
        <div className="mt-4">
          <Button variant="primary" className="w-full" data-to="Э14.10">
            <CreditCard size={15} /> Оплатить ₸ 10 000
          </Button>
        </div>
        <div className="mt-2.5 flex items-start justify-between gap-3">
          <span className="text-[11px] leading-snug text-neutral-500">
            Форму и 3-D Secure показывает банк — номер карты в систему федерации не попадает
          </span>
          <button type="button" data-to="Э14.11" className="shrink-0 text-[12.5px] font-semibold text-blue-600">
            Отмена
          </button>
        </div>
      </div>
    </BankPage>
  );
}

const Pay14_8States = () => (
  <States>
    <Shot tone="info" title="3-D Secure" text="Поле кода от банка." wide>
      <Frag>
        <Rows>
          <Row nm="Код из SMS банка" sub="отправлен на +7 705 •• •• 03" val="• • • •" pill={{ t: 'ЖДЁМ КОД', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar>Этот шаг тоже у банка: мы не видим ни кода, ни номера карты.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Оплата отклонена" text="Причина от банка и «повторить»." wide>
      <Frag>
        <Rows>
          <Row nm="Платёж отклонён" sub="банк: недостаточно средств" pill={{ t: 'НЕ ПРОШЛА', cls: 'bad' }} action="Повторить" />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="success"
      title="Человек закрыл вкладку ✳"
      text="Возврата не было, но взнос станет оплаченным по подтверждению банка."
      wide
    >
      <Frag w={430}>
        <Rows>
          <Row nm="Взнос 2026" sub="подтверждение банка пришло на сервер · возврата в браузере не было" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">
            Состояние ставит серверное сообщение банка, а не возврат в приложение — держать
            вкладку открытой не нужно.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.10 · Оплата прошла · Э14.11 · Оплата не прошла ────────── */

/** Страница возврата: банк отправил человека обратно к нам, и первое, что он
    должен увидеть, — прошёл платёж или нет. Ответ стоит один посреди экрана:
    из банка возвращаются с этим вопросом и ни с каким другим. */
const Result14 = ({
  ok,
  title,
  lead,
  facts,
  action,
  note,
}: {
  ok: boolean;
  title: string;
  lead: string;
  facts: [string, string][];
  action: { t: string; to: string; icon: ReactNode };
  note: string;
}) => (
  <Ph tab="Профиль" center>
    <div className="flex flex-col items-center text-center">
      <span
        className={
          'flex h-16 w-16 items-center justify-center rounded-full ' +
          (ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')
        }
      >
        {ok ? <Check size={30} /> : <X size={30} />}
      </span>
      <div className="mt-3 text-[22px] font-bold tracking-tight">{title}</div>
      <p className="mt-1 max-w-[290px] text-[13px] leading-snug text-neutral-600">{lead}</p>
    </div>

    <Panel flush>
      <div className="px-4 py-1">
        <KV items={facts} />
      </div>
    </Panel>

    <div className="flex flex-col items-stretch gap-2">
      <Button variant="primary" className="w-full" data-to={action.to}>
        {action.icon} {action.t}
      </Button>
      <QuietAction to="Э14.7">В профиль</QuietAction>
    </div>
    <p className="text-center text-[11px] leading-snug text-neutral-400">{note}</p>
  </Ph>
);

export function Paid14_10() {
  return (
    <Result14
      ok
      title="Оплата прошла"
      lead="Годовой взнос 2026 оплачен — заявки на турниры со взносом теперь проходят."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Номер заказа', '100416'],
        ['Когда', '14.01.2026, 10:42'],
        ['Карта', '•••• 1234 · Halyk ePay'],
        ['Взнос действует', 'до 31.03.2027'],
      ]}
      action={{ t: 'К турнирам', to: 'Э14.2', icon: <Trophy size={15} /> }}
      note="Квитанцию присылает банк на почту. Отметка об оплате видна тренеру и в реестре — ставить её вручную никому не нужно."
    />
  );
}

const Paid14_10States = () => (
  <States>
    <Shot tone="info" title="Банк ещё подтверждает" text="Возврат пришёл раньше подтверждения — редко, но бывает." wide>
      <Frag>
        <Rows>
          <Row nm="Платёж отправлен" sub="Halyk ePay · обрабатывается" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar>Страница сама обновится: держать её открытой не нужно.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="success" title="Взнос уже был оплачен" text="Повторный платёж не проходит: система его не создаёт." wide>
      <Frag>
        <Rows>
          <Row nm="Взнос 2026" sub="оплачен 14.01, картой •••• 1234" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

export function Declined14_11() {
  return (
    <Result14
      ok={false}
      title="Оплата не прошла"
      lead="Банк отклонил платёж: недостаточно средств на карте."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Номер заказа', '100416'],
        ['Когда', '14.01.2026, 10:44'],
        ['Деньги', 'не списаны'],
        ['Взнос', 'остался неоплаченным'],
      ]}
      action={{ t: 'Повторить оплату', to: 'Э14.8', icon: <CreditCard size={15} /> }}
      note="Причину пишет банк — мы её только показываем. Ни номера карты, ни кода из SMS у нас нет; можно повторить или заплатить другой картой."
    />
  );
}

const Declined14_11States = () => (
  <States>
    <Shot tone="warning" title="Человек нажал «Отмена» у банка" text="Та же страница, причина другая — платёж не начинался." wide>
      <Frag>
        <Rows>
          <Row nm="Оплата отменена" sub="возврат с платёжной страницы банка" pill={{ t: 'ОТМЕНЕНА', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Банк не отвечает ✳" text="Состояние неизвестно: проверяем сами, деньги не теряются." wide>
      <Frag>
        <Rows>
          <Row nm="Ответа от банка нет" sub="проверим состояние платежа и обновим сами" pill={{ t: 'ПРОВЕРЯЕМ', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">
            Если деньги списались, взнос станет оплаченным без участия человека — по сверке с банком.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.13 · Новости федерации ────────────────────────────────── */

/** Карточка ленты: вся целиком — переход в материал (Э14.14). Поля те же, что
    приходят из админки: рубрика, дата, заголовок, лид, автор и время чтения.

    Обложка стоит слева квадратом, а не полосой над текстом: полосой карточка
    вырастала до двухсот точек, три таких в телефон не помещались, и у нижних
    лид резался кромкой вместе с датой. Квадрат оставляет обложку на месте,
    а карточку укладывает в сто с небольшим. */
const NewsCard = ({ n }: { n: (typeof NEWS)[number] }) => (
  <button
    type="button"
    data-to="Э14.14"
    className="flex w-full items-start gap-3 overflow-hidden rounded-xl border border-neutral-200 bg-white p-2.5 text-left shadow-sm"
  >
    <span className="h-20 w-20 shrink-0 rounded-lg bg-linear-to-tr from-blue-950 via-blue-900 to-blue-700" />
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block text-[10px] font-semibold tracking-wider text-blue-700">{n.tag}</span>
      <span className="mt-0.5 block text-[14px] font-semibold leading-snug">{n.nm}</span>
      {/* Лид обрезается целыми строками, а не кромкой карточки: обрыв по высоте
          резал буквы пополам и уносил с собой дату, которая по требованию есть
          на каждой карточке. */}
      <span
        className="mt-1 block text-[12px] leading-snug text-neutral-500"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {n.sub}
      </span>
      <span className="mt-1 block text-[11px] text-neutral-400">
        {n.at} 2026 · {n.by} · {n.read}
      </span>
    </span>
  </button>
);

/** Лента: первый материал — крупной карточкой с заголовком поверх обложки,
    главное за неделю не должно теряться среди одинаковых плиток. */
export function News14_13() {
  return (
    <Ph tab="Новости">
      <button
        type="button"
        data-to="Э14.14"
        className="relative w-full overflow-hidden rounded-xl text-left shadow-sm"
      >
        <div className="h-40 bg-linear-to-tr from-blue-950 via-blue-900 to-blue-600" />
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-neutral-950/80 via-neutral-950/30 to-transparent p-4">
          <span className="mb-1.5 w-fit rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            {NEWS[0].tag}
          </span>
          <h3 className="text-[18px] font-bold leading-tight text-white">{NEWS[0].nm}</h3>
          <p className="mt-1 text-[12px] leading-snug text-white/75">{NEWS[0].sub}</p>
          <div className="mt-1.5 text-[10.5px] text-white/60">
            {NEWS[0].at} 2026 · {NEWS[0].by} · {NEWS[0].read}
          </div>
        </div>
      </button>

      {NEWS.slice(1).map((n) => (
        <NewsCard key={n.nm} n={n} />
      ))}
      <QuietAction>Показать ещё</QuietAction>
    </Ph>
  );
}

const News14_13States = () => (
  <States>
    <Shot tone="info" title="Новостей нет" text="Федерация ничего не публиковала — лента пустая, а не сломанная." wide>
      <Frag>
        <EmptyBox title="Пока новостей нет" text="Здесь появятся объявления федерации, положения и итоги турниров." />
      </Frag>
    </Shot>

    <Shot tone="warning" title="Обложки у материала нет" text="Редакция не приложила картинку — карточка живёт без неё." wide>
      <Frag>
        <Rows>
          <Row nm="Изменения в положении о соревнованиях" sub="12 марта · без обложки" pill={{ t: 'ПОЛОЖЕНИЕ', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.14 · Новость ──────────────────────────────────────────── */

/** Сам материал: лента остаётся за спиной — возврат стоит над заголовком.
    Внизу — соседние материалы: прочитал одно, читают следующее. */
export function Article14_14() {
  return (
    <Ph tab="Новости">
      <BackLink label="Все новости" to="Э14.13" />
      {/* Заголовок стоит поверх обложки — там, где у материала титул. */}
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <div className="h-40 bg-linear-to-tr from-blue-950 via-blue-900 to-blue-600" />
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-neutral-950/80 via-neutral-950/30 to-transparent p-4">
          <span className="mb-1.5 w-fit rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            КАЛЕНДАРЬ
          </span>
          <h3 className="text-[18px] font-bold leading-tight text-white">
            Календарь сезона 2026 опубликован
          </h3>
          <div className="mt-1.5 text-[10.5px] text-white/60">
            15 апреля 2026 · Пресс-служба ФНТ РК · 3 мин чтения
          </div>
        </div>
      </div>
      <div className="text-[10.5px] text-neutral-400">
        Фото: пресс-служба ФНТ РК, Кубок Казахстана 2026
      </div>

      <article className="flex flex-col gap-2.5">
        <p className="text-[14px] font-medium leading-relaxed">
          В сезоне 2026 года — восемь главных стартов, четыре тура Евразийской лиги и двадцать
          открытых республиканских турниров.
        </p>
        <p className="text-[13px] leading-relaxed text-neutral-700">
          Приём заявок на ОРТ открывается за месяц до старта: заявляется спортсмен сам. На главные
          старты состав подаёт старший тренер региона, в лигу команду заявляет клуб — кнопки
          «заявиться» у них в календаре нет.
        </p>
        <h3 className="mt-1 text-[14.5px] font-semibold">Что изменилось для спортсменов</h3>
        {/* Три пункта в одну строку каждый: на телефоне текст статьи занимает
            весь экран, и «Ссылка по делу» с соседними материалами уходила за
            нижний край — а без неё новость становится тупиком. */}
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed text-neutral-700">
          <li>Приём заявок на ОРТ — за месяц, а не за две недели.</li>
          <li>Первенства — по правилу «год рождения и моложе».</li>
          <li>Годовой взнос за 2026 год — до 31 марта.</li>
        </ul>
      </article>

      {/* Новость почти всегда про что-то, что в системе есть: календарь,
          турнир, взнос. Ссылка ведёт туда — иначе человек ищет руками. */}
      <Rows>
        <Row nm="Календарь сезона" sub="все старты с датами, городами и сроками приёма" to="Э14.2" />
        <Row nm="Годовой взнос 2026" sub="оплатить картой до 31 марта" to="Э14.7" />
      </Rows>

      <div className="flex flex-wrap gap-1.5">
        {['календарь 2026', 'ОРТ', 'Евразийская лига', 'взносы'].map((t) => (
          <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-600">
            {t}
          </span>
        ))}
      </div>

      <div>
        <SecT>Читайте дальше</SecT>
        <div className="mt-1.5 flex flex-col gap-3">
          {NEWS.slice(1, 3).map((n) => (
            <NewsCard key={n.nm} n={n} />
          ))}
        </div>
      </div>
    </Ph>
  );
}

const Article14_14States = () => (
  <States>
    <Shot tone="info" title="Материал на трёх языках ✳" text="Читается на языке интерфейса; нет перевода — показываем русский с пометкой." wide>
      <Frag>
        <Rows>
          <Row nm="Положение о рейтинге" sub="есть RU · KZ · перевода на EN нет" pill={{ t: 'RU · KZ', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="warning" title="Обложки у материала нет" text="Редакция не приложила картинку — материал читается без неё." wide>
      <Frag>
        <Rows>
          <Row nm="Изменения в положении о соревнованиях" sub="12 марта · без обложки" pill={{ t: 'ПОЛОЖЕНИЕ', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Новость сняли с публикации ✳" text="Ссылку прислали, а материала уже нет." wide>
      <Frag>
        <EmptyBox title="Материал недоступен" text="Новость снята с публикации. Вернитесь к ленте — остальные на месте." />
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.12 · История платежей и квитанция ─────────────────────── */

/** Платежи спортсмена: за что и когда платил, чем закончилось. Взнос платят
    раз в год, но платёж бывает неудачным, повторным и возвращённым — и на
    вопрос «я же платил» отвечает не память, а эта страница. */
const PAYMENTS = [
  { nm: 'Годовой взнос 2026', at: '14.01.2026, 10:42', sum: '₸ 10 000', st: 'ОПЛАЧЕН', cls: 'live', card: '•••• 1234', ok: true },
  { nm: 'Годовой взнос 2026 · попытка', at: '14.01.2026, 10:44', sum: '₸ 10 000', st: 'НЕ ПРОШЛА', cls: 'bad', card: '•••• 7788', ok: false },
  { nm: 'Годовой взнос 2025', at: '09.02.2025, 18:05', sum: '₸ 8 000', st: 'ОПЛАЧЕН', cls: 'live', card: '•••• 1234', ok: true },
  /* Оплата мимо системы: квитанции у строки нет — документ выдавала не она. */
  { nm: 'Годовой взнос 2024', at: '21.01.2024, 12:31', sum: '₸ 8 000', st: 'ОПЛАЧЕН', cls: 'live', card: 'наличными · отметил экономист', ok: false },
];

export function History14_12() {
  return (
    <Ph tab="Профиль">
      <BackLink label="Профиль" to="Э14.7" />
      {/* На этот экран приходят с вопросом «я же платил» — отвечает сумма,
          а не заголовок «История платежей». */}
      <div className="leading-tight">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Оплачено взносов за три сезона
        </div>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="text-3xl font-bold tabular-nums tracking-tight">₸ 26 000</span>
          <span className="text-xs text-neutral-500">последний — 14.01.2026</span>
        </div>
        <div className="mt-0.5 text-xs text-neutral-500">три платежа прошли, одна попытка не прошла</div>
      </div>

      <Panel
        title="Платежи"
        sub="неудачные попытки тоже видны: по ним понятно, что деньги не списаны"
        flush
      >
        {/* Строка в две ступени, а не в одну: на телефоне значок и «Квитанция»
            съедали ширину названия, и от «Годового взноса 2026» оставалось
            «Годо…» — за какой год платили, прочитать было нельзя. Наверху то,
            что отвечает на вопрос («за что и сколько»), внизу — чем и когда
            платили, состояние и квитанция. */}
        <div className="divide-y divide-neutral-100">
          {PAYMENTS.map((p) => (
            <div key={p.at} className="px-4 py-2.5">
              <div className="flex items-baseline gap-2.5">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.nm}</span>
                <b className="shrink-0 text-[13.5px] font-semibold tabular-nums">{p.sum}</b>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-500">
                  {p.at} · {p.card}
                </span>
                <P t={p.st} cls={p.cls} />
                {p.ok && (
                  <Button size="sm" variant="outline">
                    <Receipt size={13} /> Квитанция
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Квитанция — то, что человек несёт в бухгалтерию клуба или школы.
          Собираем её мы: у банка это письмо, а не документ федерации. Поэтому
          она набрана бумагой — получатель, сумма строкой, реквизиты парами.
          «Скачать PDF» при этом стоит в шапке карточки, а не под реквизитами:
          на телефоне список платежей занимает экран целиком, и кнопка под
          бумагой оказывалась ниже видимой части — квитанцию было нечем взять. */}
      <Panel
        title="Квитанция"
        sub="годовой взнос 2026"
        extra={
          <Button variant="primary" size="sm">
            <Download size={14} /> Скачать PDF
          </Button>
        }
      >
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">Получатель</div>
        <div className="mt-0.5 text-[13.5px] font-semibold">ОЮЛ «Федерация настольного тенниса РК»</div>

        <div className="mt-3 flex items-baseline justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2.5">
          <span className="min-w-0 text-[11.5px] leading-snug text-neutral-500">
            Годовой взнос 2026 · Ким Георгий, 14.06.2003
          </span>
          <b className="shrink-0 text-lg font-bold tabular-nums">₸ 10 000</b>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {([
            ['Номер заказа', '100416'],
            ['Когда', '14.01.2026, 10:42'],
            ['Способ', 'карта •••• 1234'],
            ['Через', 'Halyk ePay'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="leading-tight">
              <div className="text-[10.5px] text-neutral-400">{k}</div>
              <div className="text-[13px] font-medium">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <QuietAction>Отправить на почту</QuietAction>
        </div>
      </Panel>
    </Ph>
  );
}

const History14_12States = () => (
  <States>
    <Shot tone="info" title="Платежей ещё не было" text="Первый сезон: взнос не выставлялся или не оплачивался." wide>
      <Frag>
        <EmptyBox title="Платежей пока нет" text="Здесь появятся все взносы: когда, сколько и чем закончился платёж." />
      </Frag>
    </Shot>

    <Shot tone="warning" title="Оплату отметил экономист" text="Платёж прошёл мимо системы — квитанции банка нет." wide>
      <Frag>
        <Rows>
          <Row nm="Годовой взнос 2024" sub="наличными · отметил экономист, основание — квитанция № 4471" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
        </Rows>
        <div className="mt-3">
          <Bar>Кнопки «квитанция» у такой строки нет: документ выдавала не система.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Возврат платежа ✳" text="Экономист снял отметку — в истории это отдельная строка." wide>
      <Frag>
        <Rows>
          <Row nm="Годовой взнос 2026 · возврат" sub="снял Сериков Н., причина: «оплатил дважды» · 16.01" pill={{ t: 'ВОЗВРАТ', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э14.9 · Изменение данных ──────────────────────────────────── */

/** Телефон и почта — свои: человек меняет их сам.

    Клуб и регион спортсмен не выбирает вообще (решение от 17.08.2026). Это не
    его утверждение о себе, а принадлежность к чужой организации: в клуб зовёт
    администратор клуба (Э13.2), в регион — старший тренер региона (Э12.6).
    Самозаявки «хочу в этот клуб» нет — иначе к любому клубу приписался бы кто
    угодно, а разбирал бы это кто-то другой. */
export function Edit14_9() {
  return (
    <Ph tab="Профиль">
      <BackLink label="Профиль" to="Э14.7" />
      <PageT
        t="Телефон и почта"
        sub="Всё остальное меняется не здесь: в клуб зовёт администратор клуба, в регион — старший тренер"
      />

      <Panel title="Контакты" sub="сохраняются сразу">
        <FormGrid>
          <TextInput label="Телефон" value="+7 705 118 44 03" wide />
          <TextInput label="Почта" value="g.kim@mail.kz" wide />
        </FormGrid>
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <span className="text-[11.5px] leading-tight text-neutral-500">
            На почту приходят решения судьи и уведомления о вызове
          </span>
          <PrimaryAction to="Э14.7">Сохранить</PrimaryAction>
        </div>
      </Panel>

      <Panel title="Клуб и регион" sub="здесь не меняются">
        <FormGrid>
          <FieldView label="Клуб" value="СКА · Астана · с 12.01.2026" wide />
          <FieldView label="Регион" value="г. Астана" wide />
        </FormGrid>
        <div className="mt-3.5">
          <Bar>
            В клуб зовёт его администратор, в регион — старший тренер. Придёт приглашение — оно
            появится уведомлением, и решение будет за вами: принять или нет.
          </Bar>
        </div>
      </Panel>
    </Ph>
  );
}

const Edit14_9States = () => (
  <States>
    <Shot tone="info" title="Пришло приглашение в клуб" text="Решает спортсмен: приглашение можно принять или отклонить." wide>
      <Frag>
        <Rows>
          <Row
            nm="Клуб «Алатау» · Алматы"
            sub="пригласил Досжан М., 14.02 · сейчас вы в СКА · Астана"
            pill={{ t: 'ЖДЁТ ВАС', cls: 'wait' }}
            action="Принять"
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Пока не приняли, в профиле остаётся прежний клуб. Отказ ничего не меняет и клубу виден.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="success" title="Приглашение принято" text="Новый клуб в профиле, прежний — в истории." wide>
      <Frag>
        <Rows>
          <Row nm="«Алатау» · Алматы" sub="перешли 16.02" pill={{ t: 'МОЙ КЛУБ', cls: 'live' }} />
          <Row nm="СКА · Астана" sub="до 16.02.2026" pill={{ t: 'В ИСТОРИИ', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="info" title="Клуба нет" text="Так бывает: спортсмен тренируется сам. Заявиться на ОРТ это не мешает." wide>
      <Frag>
        <Rows>
          <Row nm="Без клуба" sub="в регионе г. Астана · пригласить может любой клуб" pill={{ t: 'БЕЗ КЛУБА', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.11 — прежний клуб"
      text="Нужно ли его согласие на уход и что с местом в заявках и составах — не решено."
      wide
    >
      <Frag w={430}>
        <Bar tone="warning">
          Рисуем только приглашение принимающим клубом. Уходит ли спортсмен из уже поданных заявок
          и составов команд прежнего клуба сразу или доигрывает сезон — вопрос к федерации.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Экраны роли ───────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.
    Роль единственная, где сайт и приложение равноценны (TZ §10), и телефон
    для неё рисовался первым — теперь каждый узел маршрута и есть телефонный
    экран, отдельного раздела «приложение» больше нет. */
export const SCREENS: ScreenMap = {
  'Э0.1': { cap: 'Вход', view: () => <Login0_1 />, next: '«Зарегистрироваться»' },
  'Э0.5': {
    cap: 'Регистрация спортсмена',
    view: () => (
      <>
        <SignUp0_5 />
        <SignUp0_5States />
      </>
    ),
    next: 'зарегистрировался — своя Главная',
  },
  'Э14.1': {
    cap: 'Главная',
    view: () => (
      <>
        <Home14_1 />
        <Home14_1States />
      </>
    ),
    next: 'пункт «Календарь»',
  },
  'Э14.2': {
    cap: 'Календарь',
    view: () => (
      <>
        <Calendar14_2 />
        <Calendar14_2States />
      </>
    ),
    next: '«Заявиться» на ОРТ',
  },
  'Э14.3': {
    cap: 'Заявка на ОРТ',
    view: () => (
      <>
        <Apply14_3 />
        <Apply14_3States />
      </>
    ),
    next: '«Подать заявку»',
  },
  'Э14.4': {
    cap: 'Моя заявка',
    view: () => (
      <>
        <MyApp14_4 />
        <MyApp14_4States />
      </>
    ),
    next: 'заявка принята',
  },
  'Э14.5': {
    cap: 'Мой турнир и мой матч',
    /* Узел вкладки на карте открывает экран сразу на ней. «Группы» бывают не у
       каждого турнира, поэтому для них показываем турнир с групповым этапом —
       иначе вкладки, о которой спрашивают, на экране просто нет. */
    tabView: (tab) => <Match14_5 tab={tab} groups={tab === 'Группы'} />,
    view: () => (
      <>
        <Match14_5 />
        <Match14_5States />
      </>
    ),
    next: 'пункт «Аналитика»',
  },
  'Э14.6': {
    cap: 'Аналитика',
    view: () => (
      <>
        <Stats14_6 />
        <Stats14_6States />
      </>
    ),
    next: 'пункт «Профиль»',
  },
  'Э14.7': {
    cap: 'Мой профиль',
    view: () => (
      <>
        <Profile14_7 />
        <Profile14_7States />
      </>
    ),
    next: '«Оплатить картой»',
  },
  'Э14.8': {
    cap: 'Оплата взноса картой',
    view: () => (
      <>
        <Pay14_8 />
        <Pay14_8States />
      </>
    ),
    next: 'банк вернул человека к нам',
  },
  'Э14.10': {
    cap: 'Взнос оплачен',
    view: () => (
      <>
        <Paid14_10 />
        <Paid14_10States />
      </>
    ),
  },
  'Э14.11': {
    cap: 'Оплата не прошла',
    view: () => (
      <>
        <Declined14_11 />
        <Declined14_11States />
      </>
    ),
  },
  'Э14.13': {
    cap: 'Новости',
    view: () => (
      <>
        <News14_13 />
        <News14_13States />
      </>
    ),
    next: 'карточка новости',
  },
  'Э14.14': {
    cap: 'Новость',
    view: () => (
      <>
        <Article14_14 />
        <Article14_14States />
      </>
    ),
  },
  'Э14.12': {
    cap: 'История платежей и квитанция',
    view: () => (
      <>
        <History14_12 />
        <History14_12States />
      </>
    ),
  },
  'Э14.9': {
    cap: 'Изменение данных',
    view: () => (
      <>
        <Edit14_9 />
        <Edit14_9States />
      </>
    ),
  },
};

export function Role14Board() {
  return <Board role={R14} screens={SCREENS} />;
}
