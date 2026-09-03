/* Роли 3 и 4 · Менеджеры-наблюдатели — макеты по флоу на новом слое (HeroUI) ✳
   (30.08.2026). Содержание, решения и переходы — прежние (см.
   `flows/03-04-menedzhery-nablyudateli.md`); меняется подача: оболочка WebApp
   и доменные компоненты `kit/hero/app` вместо старого макетного слоя.

   Правило, из которого следует весь дизайн роли: **ни одной кнопки, меняющей
   данные**. Экраны — те же, что у администратора Федерации (Э1.1, Э1.2, Э2.1),
   поэтому очередь, счётчики и строки списков берутся из `role01` теми же
   компонентами; отличие видно по полосе действий: остались только фильтр,
   поиск, выгрузка/печать и подписка. Недоступное действие не показывается
   вовсе — не серой кнопкой, а её отсутствием. */

import { useState, type ReactNode } from 'react';
import {
  BarChart3, Bell, CalendarDays, ClipboardList, Download, LayoutDashboard, Printer, Users,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  Bar,
  DataTable,
  EmptyBox,
  FilterSeg,
  Panel,
  PhoneRoleApp,
  Pill,
  Row,
  Rows,
  ScreenScope,
  SearchInput,
  StatTiles,
  WebApp,
  type RoleUI,
} from '@/shared/kit/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1, LoginPhone0_1 } from './role00';
/* Те же данные и строки, что у администратора Федерации (Э1.1, Э1.2) — здесь
   на чтение. Раньше список лежал здесь копией и разъехался с оригиналом: у
   ролей 3 и 4 «ближайшие старты» жили своей жизнью. Берём из role01. */
import { Attention, Btn, KPI, MONTHS_GEN, TodayRows, TourRow, UPCOMING } from './role01';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    `badge: false` — роль вне турнира, значка состояния в шапке нет.
    Меню — то же, что у администратора Федерации по составу модулей: роль
    видит всё, просто ничего не правит (пункты — из старого слоя дословно). */
const R0304: RoleUI = {
  num: '3 и 4',
  title: 'Менеджеры-наблюдатели',
  person: { nm: 'Тлеуова А.', rl: 'Менеджер · только чтение', av: AW(21) },
  brandName: 'Сезон 2026',
  badge: false,
  nav: [
    [<LayoutDashboard size={16} key="o" />, 'Обзор'],
    [<CalendarDays size={16} key="c" />, 'Календарь'],
    [<ClipboardList size={16} key="z" />, 'Заявки'],
    [<Users size={16} key="r" />, 'Реестры'],
    [<BarChart3 size={16} key="t" />, 'Рейтинги'],
    [<Bell size={16} key="p" />, 'Подписки'],
  ],
};

/* ── Общие мелочи роли ──────────────────────────────────────────── */

/* ⚠ Временная дупликация с role01/role05: P и Frag — общие мелочи нового
   слоя, но общего дома у них пока нет, а импортировать их из чужого roleNN
   нельзя. Когда мелочи переедут в kit/hero — заменить на общие. */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. */
type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/* ── Телефонный кадр: что меняется на 392 px ────────────────────── */

/* Полный адаптив ✳ (решение владельца, 30.08.2026): у каждого экрана роли есть
   второй формат. Наблюдатель — тот, кто смотрит на сезон не со своего рабочего
   места: из зала, из машины, с трибуны, — и телефон ему нужен ровно за тем же,
   зачем ноутбук. Права на узком экране те же: **ни одной кнопки, меняющей
   данные**, — недоступное действие не появляется и здесь.

   Обёртки ниже — переопределения кита под узкий кадр; сами компоненты кита
   остаются как есть.
   ⚠ Те же обёртки живут в role01, role05, role06 и role07 — когда телефонные
   кадры будут у всех ролей, им место в `kit/hero/app`. */

/** Плитки-счётчики на телефоне: тот же `StatTiles`, но в два столбца — четыре
    плитки в один ряд на 392 px не встают. */
const PhoneTiles = ({ children }: { children: ReactNode }) => (
  <div className="[&>div]:grid-flow-row [&>div]:grid-cols-2 [&>div]:gap-2">{children}</div>
);

/** Полоса переключателей на телефоне: не переносится рядами, а уезжает вбок. */
const Strip = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 mb-3 overflow-x-auto px-4 **:data-seg:flex-nowrap">{children}</div>
);

/** Очередь «Требует внимания» на телефоне ✳: компонент и данные те же — они
    живут у администратора Федерации (`role01`), — но три колонки строки встают
    друг под другом: «что», «кто решает» и «почему» рядом в 392 px не читаются.
    Правится только раскладка строки, поэтому обёртка, а не второй список. */
const PhoneQueue = ({ children }: { children: ReactNode }) => (
  <div className="**:data-row:grid-cols-1 **:data-row:gap-1 [&_[data-row]>span]:text-left">
    {children}
  </div>
);

/** Строка календаря на телефоне ✳: у десктопной (`TourRow` из role01) в ряд
    стоят название, судья, заявки и состояние — в 392 px это четыре обрезка.
    Данные те же (`UPCOMING`), но судья и заявки уходят второй строкой. */
const TourRowPhone = ({ t }: { t: (typeof UPCOMING)[number] }) => (
  <div data-to="Э1.3" data-row className="cursor-pointer px-4 py-2.5 leading-tight hover:bg-neutral-50">
    <div className="flex items-start justify-between gap-2">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium">{t.nm}</span>
        <span className="block text-xs text-neutral-500">
          {t.cat} · {t.city} · {t.d} {MONTHS_GEN[t.m]}
        </span>
      </span>
      <span className="shrink-0"><Pill t={t.st} color={PC[t.cls]} /></span>
    </div>
    <div className="mt-1 flex items-baseline justify-between gap-2 text-xs">
      {/* Судья не назначен — то же предупреждение, что в колонке на десктопе. */}
      <span className={t.judge ? 'text-neutral-500' : 'font-medium text-amber-700'}>
        {t.judge ? `судья ${t.judge}` : '— судьи нет'}
      </span>
      <span className="tabular-nums text-neutral-500">
        {t.teams
          ? `команд: муж ${t.teams.men[0]} · жен ${t.teams.women[0]}`
          : `заявок ${t.apps}`}
      </span>
    </div>
  </div>
);

/* ── Э3.1 · Обзорная панель ────────────────────────────────────── */

/** Обзорная панель: те же зоны, что на Панели Федерации (Э1.1), но без кнопок
    записи. Счётчики сезона ведут в модуль на чтение (Э3.2); очередь «Требует
    внимания» — та же, что у администратора, только без переходов
    (`act={false}`): смотреть можно, снять дело — нет.

    Проп `variant` старой адаптивной рамки сохранён ради истории «Адаптив»
    (role0304.stories): у нового слоя своей планшетной рамки веба пока нет. */
export function Dash3_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <WebApp
      role={R0304}
      nav="Обзор"
      title="Обзорная панель"
      hint="Кнопки «Завести соревнование» здесь нет: недоступное действие не показывается вовсе — не серой кнопкой, а её отсутствием."
      actions={
        /* Единственное действие роли-наблюдателя: выгрузка сводки ничего в
           системе не меняет. */
        <Button variant="outline">
          <Download size={14} /> Выгрузить сводку
        </Button>
      }
    >
      {/* Счётчики те же, что у администратора Федерации; каждый ведёт в
          список на чтение — единственный переход этого экрана. */}
      <StatTiles items={KPI} to="Э3.2" />

      {/* В раскрытом счётчике две строки, как на Э1.1: панель обязана
          помещаться на экран целиком. */}
      <Attention act={false} max={2} />

      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          строки турнира переносились и обе панели росли вдвое. Порядок тот же,
          что на Панели Федерации. Панель сама держит отступ снизу — обёртка не
          нужна. */}
      <>
        {/* TodayRows сам рисует рамку списка, поэтому панель с отступом,
            а не flush — иначе рамка в рамке. */}
        <Panel title="Сегодня идут">
          <TodayRows act={false} one />
        </Panel>
      </>
    </WebApp>
  );
}

/** Обзорная панель на телефоне: те же зоны и тот же порядок — счётчики сезона,
    очередь и списки. Кнопок, меняющих данные, нет и здесь: единственная —
    выгрузка сводки, и она стоит под очередью, а не в её ряду. */
const Dash3_1Phone = () => (
  <PhoneRoleApp
    role={R0304}
    nav="Обзор"
    title="Обзорная панель"
    actions={
      <Button variant="outline">
        <Download size={14} /> Выгрузить сводку
      </Button>
    }
  >
    {/* Плашка-правило вместо `hint` оболочки: у телефонной её нет, а само
        правило от формата не зависит. */}
    <Bar>
      Кнопки «Завести соревнование» здесь нет: недоступное действие не показывается вовсе — не
      серой кнопкой, а её отсутствием ✳.
    </Bar>

    <PhoneTiles><StatTiles items={KPI} to="Э3.2" /></PhoneTiles>

    <PhoneQueue><Attention act={false} max={2} /></PhoneQueue>

    <Panel title="Сегодня идут">
      <TodayRows act={false} one />
    </Panel>
  </PhoneRoleApp>
);

/* ── Э3.2 · Модули в режиме чтения ─────────────────────────────── */

const CATS3_2 = ['Все категории', 'Главный старт', 'Лига', 'ОРТ'];

/** Что открыто роли на чтение — 11 модулей по матрице ROLES.md. Состав каждого
    экрана описан у пишущей роли, здесь — только чтение; список стоит на
    экране, а не в документации: «полный доступ ко всем модулям» иначе
    оставался бы словами. */
const MODULES3_2: { nm: string; src: string; what: string }[] = [
  { nm: 'Календарь сезона', src: 'Э1.2', what: 'все категории, все состояния' },
  { nm: 'Карточка турнира', src: 'Э1.3', what: 'регламент, заявки, сетка, расписание, наряд, протокол, журнал турнира' },
  { nm: 'Заявки участников', src: 'Э6.2', what: 'состав заявок, решения судьи, причины отказов' },
  { nm: 'Заявки судей', src: 'Э5.2', what: 'заявившиеся, решение председателя ГСК' },
  { nm: 'Ход турнира', src: 'Э6.6', what: 'столы, счёт, задержки; без кнопок вызова' },
  { nm: 'Итоговый протокол', src: 'Э6.7', what: 'результаты, места; печать' },
  { nm: 'Реестры', src: 'Э1.5', what: 'спортсмены, судьи, тренеры, организации — без ролей и без выдачи' },
  { nm: 'Рейтинг игроков и судей', src: 'Э0.4 · Э5.5', what: 'таблицы, журнал начислений судей' },
  { nm: 'Взносы', src: 'Э2.1', what: 'состояния взносов, без отметки оплаты' },
  { nm: 'Команды Лиги и таблицы', src: 'Э13.3', what: 'дивизионы, составы, таблицы туров' },
  { nm: 'Заключения инспекции', src: 'Э10.4', what: 'готовые заключения' },
];

/** Взносы на чтение — три строки из Э2.1. Вынесены из экрана ✳: телефонный
    кадр показывает те же записи, а вторая копия с ними бы разъехалась. */
const FEES3_2: { av: string; nm: string; sub: string; pill: { t: string; cls: Cls } }[] = [
  { av: A(32), nm: 'Смагулов Алан', sub: 'Алматы · «Алатау»', pill: { t: 'ОПЛАЧЕН', cls: 'live' } },
  { av: A(22), nm: 'Жумабеков Расул', sub: 'Караганда · «Шахтёр»', pill: { t: 'НЕ ОПЛАЧЕН', cls: 'wait' } },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: 'Шымкент · «Достык»', pill: { t: 'НЕ ОПЛАЧЕН', cls: 'wait' } },
];

/** Отбор строк календаря: категория плюс поиск. Общий на оба формата ✳ — по
    одному и тому же фильтру телефон и ноутбук обязаны показывать одно. */
const readPick = (cat: string, q: string) => {
  const t = q.trim().toLowerCase();
  return UPCOMING.filter(
    (r) =>
      (cat === CATS3_2[0] || r.cat === cat) &&
      (!t || r.nm.toLowerCase().includes(t) || r.city.toLowerCase().includes(t)),
  );
};

/** Модули на чтение — на примере календаря и взносов. Фильтр и поиск рабочие:
    у роли нет ни одной кнопки, меняющей данные, но отбирать строки она
    обязана уметь — иначе «полный доступ» превращается в листание. */
export function Read3_2() {
  const [cat, setCat] = useState(CATS3_2[0]);
  const [q, setQ] = useState('');
  const tours = readPick(cat, q);
  return (
    <WebApp
      role={R0304}
      nav="Календарь"
      title="Календарь сезона · чтение"
      hint="Ни одной кнопки, меняющей данные: право на чтение и право на запись проверяются раздельно (ARCHITECTURE.md). Доступны фильтр, поиск, открытие карточек и выгрузка с печатью."
    >
      {/* Ряда счётчиков про сам режим чтения здесь больше нет ✳ (30.08.2026):
          главное содержимое экрана — списки, и он начинается со списков, а не
          с витрины над ними. То, что счётчики проговаривали («11 модулей»,
          «0 кнопок, меняющих данные»), сказано подсказкой экрана и описью
          доступа внизу. */}

      {/* Полоса действий наблюдателя целиком: отбор строк и вынос на бумагу.
          Кнопок решений здесь не было и нет. */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <FilterSeg items={CATS3_2} active={cat} onPick={setCat} />
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Название или город" className="w-56" />
          <Btn>
            <Download size={14} /> Выгрузить
          </Btn>
          <Btn>
            <Printer size={14} /> Печать
          </Btn>
        </div>
      </div>

      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): рядом два
          списка спорили, какой из них главный, а строки турниров переносились.
          Панель сама держит отступ снизу — обёртка не нужна. */}
      <>
        <Panel
          title="Календарь сезона · экран-источник Э1.2"
          extra={<span className="text-xs text-neutral-500">{tours.length} по фильтру</span>}
          flush
        >
          {tours.length ? (
            <div className="divide-y divide-neutral-100">
              {tours.slice(0, 4).map((r) => (
                <TourRow key={r.nm} t={r} judge />
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-[12.5px] text-neutral-500">
              По запросу «{q}» ничего нет — проверьте написание или снимите фильтр.
            </div>
          )}
        </Panel>

        <Panel title="Взносы · экран-источник Э2.1" flush>
          <div className="divide-y divide-neutral-100">
            {FEES3_2.map((f) => (
              <Row key={f.nm} av={f.av} nm={f.nm} sub={f.sub} pill={f.pill} />
            ))}
          </div>
          <div className="px-4 pb-3 pt-2 text-[11px] text-neutral-400">
            Отметки оплаты нет — её ставит экономист (Э2.1)
          </div>
        </Panel>
      </>

      {/* Весь объём доступа одним списком: какие модули открыты и что в них
          видно (матрица ROLES.md). Строки никуда не ведут — переходов у роли
          нет, это опись, а не меню. */}
      <Panel
        title="Доступно на чтение · 11 модулей"
        flush
      >
        <DataTable
          cols={['Модуль', 'Экран-источник', 'Что видно']}
          grid="1.2fr 120px 2fr"
          rows={MODULES3_2.map((m) => ({
            key: m.nm,
            cells: [
              <span key="n" className="font-medium">{m.nm}</span>,
              <span key="s" className="tabular-nums text-neutral-500">{m.src}</span>,
              <span key="w" className="text-neutral-500">{m.what}</span>,
            ],
          }))}
        />
      </Panel>
    </WebApp>
  );
}

/** Модули на чтение на телефоне: тот же отбор и те же списки. Полоса действий
    наблюдателя встаёт в два ряда — фильтр отдельной строкой, поиск с выгрузкой
    и печатью под ним; кнопок решений в ней по-прежнему нет.

    Опись доступа (11 модулей) на телефоне идёт строками, а не таблицей из трёх
    колонок: «что видно» в третьей колонке в 392 px превращалось бы в столбик
    из отдельных слов. */
const Read3_2Phone = () => {
  const [cat, setCat] = useState(CATS3_2[0]);
  const [q, setQ] = useState('');
  const tours = readPick(cat, q);
  return (
    <PhoneRoleApp
      role={R0304}
      nav="Календарь"
      title="Календарь сезона · чтение"
    >
      <Bar>
        Ни одной кнопки, меняющей данные: право на чтение и право на запись проверяются раздельно
        (ARCHITECTURE.md). Доступны фильтр, поиск, открытие карточек и выгрузка с печатью ✳.
      </Bar>

      <Strip><FilterSeg items={CATS3_2} active={cat} onPick={setCat} /></Strip>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Название или город" className="min-w-0 flex-1" />
        <Btn>
          <Download size={14} /> Выгрузить
        </Btn>
        <Btn>
          <Printer size={14} /> Печать
        </Btn>
      </div>

      <Panel
        title="Календарь сезона · экран-источник Э1.2"
        extra={<span className="text-xs text-neutral-500">{tours.length} по фильтру</span>}
        flush
      >
        {tours.length ? (
          <div className="divide-y divide-neutral-100">
            {tours.slice(0, 4).map((r) => (
              <TourRowPhone key={r.nm} t={r} />
            ))}
          </div>
        ) : (
          <div className="px-4 py-4 text-[12.5px] text-neutral-500">
            По запросу «{q}» ничего нет — проверьте написание или снимите фильтр.
          </div>
        )}
      </Panel>

      <Panel title="Взносы · экран-источник Э2.1" flush>
        <div className="divide-y divide-neutral-100">
          {FEES3_2.map((f) => (
            <Row key={f.nm} av={f.av} nm={f.nm} sub={f.sub} pill={f.pill} />
          ))}
        </div>
        <div className="px-4 pb-3 pt-2 text-[11px] text-neutral-400">
          Отметки оплаты нет — её ставит экономист (Э2.1)
        </div>
      </Panel>

      <Panel
        title="Доступно на чтение · 11 модулей"
        flush
      >
        <div className="divide-y divide-neutral-100">
          {MODULES3_2.map((m) => (
            <div key={m.nm} className="px-4 py-2.5 leading-tight">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium">{m.nm}</span>
                <span className="shrink-0 text-xs tabular-nums text-neutral-500">{m.src}</span>
              </div>
              <div className="mt-0.5 text-xs text-neutral-500">{m.what}</div>
            </div>
          ))}
        </div>
      </Panel>
    </PhoneRoleApp>
  );
};

const Read3_2States = () => (
  <States>
    <Shot
      tone="info"
      title="Пустые состояния — те же, что у экранов-источников"
      text="Свои у роли только права: пустой список выглядит так же, как у пишущей роли, — но без кнопки-действия внизу."
    >
      <Frag w={520}>
        <EmptyBox
          title="Взносов по фильтру нет"
          text="Пустое состояние модуль наследует у экрана-источника (Э2.1). У экономиста здесь стоит действие — у наблюдателя нет и его."
        />
      </Frag>
    </Shot>

    <Shot
      tone="success"
      title="Ни одной кнопки, меняющей данные"
      text="Ни «сохранить», ни «утвердить», ни «отклонить», ни отметки оплаты — их нет, а не «серые»."
      wide
    >
      <Frag w={640}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-neutral-500">Календарь сезона · чтение</span>
          <span className="flex items-center gap-2">
            <Btn>
              <Download size={14} /> Выгрузить
            </Btn>
            <Btn>
              <Printer size={14} /> Печать
            </Btn>
          </span>
        </div>
        <Rows>
          <Row nm="Кубок Республики Казахстан 2026" sub="Астана · 18–20 мая" pill={{ t: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">
            У пишущей роли в этой строке стоят «Править» и «Опубликовать». Здесь их нет вовсе:
            право на чтение и право на запись проверяются раздельно.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э3.3 · Подписки ───────────────────────────────────────────── */

type Sub = { nm: string; st: string; cls: Cls; next: string; on: boolean };

const SUBS: Sub[] = [
  { nm: 'Кубок Республики Казахстан 2026', st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg', next: 'публикация и приём заявок — 20 апреля', on: true },
  { nm: 'Первенство РК · 2010 г.р. и моложе', st: 'ЗАЯВКИ ИГРОКОВ', cls: 'live', next: 'закрытие приёма — 27 мая', on: true },
  { nm: 'Евразийская лига · 2-й тур', st: 'ИДЁТ', cls: 'live', next: 'день 2 из 3 · сыграно 34 матча из 60', on: true },
  { nm: 'ОРТ «Кубок Иртыша»', st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait', next: 'выбор главного судьи — 18 апреля', on: true },
  { nm: 'ОРТ «Шымкент Open»', st: 'ЧЕРНОВИК', cls: 'done', next: 'дата не назначена', on: false },
];

/** Что даёт подписка — три вида уведомлений. Вынесены из экрана: список один
    на оба формата. */
const NOTES3_3 = [
  { nm: 'Смена состояния', sub: 'публикация, начало игр, протокол' },
  { nm: 'Итоговый протокол', sub: 'как только протокол закрыт' },
  { nm: 'Отмена или перенос', sub: 'с причиной и новой датой' },
];

/** Подписки ✳ — наш экран, в документе федерации его нет. «Отписаться» —
    единственная кнопка роли, и она рабочая: меняет только собственные
    уведомления, а не турнир. */
export function Subs3_3() {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(SUBS.map((s) => [s.nm, s.on])),
  );
  const n = Object.values(on).filter(Boolean).length;
  return (
    <WebApp
      role={R0304}
      nav="Подписки"
      title="Мои подписки"
      sub="4 соревнования из 32"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-neutral-500">
          Отслеживается {n} из 32 соревнований сезона
        </span>
        <Btn>
          <Download size={14} /> Выгрузить список
        </Btn>
      </div>

      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): названия
          соревнований в узкой колонке переносились, а «какие уведомления
          приходят» — приписка к списку, а не вторая колонка. */}
      <>
        <Panel title="Отслеживаемые соревнования" flush>
          <div className="divide-y divide-neutral-100">
            {SUBS.map((s) => (
              <Row
                key={s.nm}
                nm={s.nm}
                sub={`ближайшее событие: ${s.next}`}
                pill={{ t: s.st, cls: s.cls }}
                action={on[s.nm] ? 'Отписаться' : 'Подписаться'}
                onAction={() => setOn({ ...on, [s.nm]: !on[s.nm] })}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Уведомления · Кубок РК 2026"
          extra={<Pill t="ПОДПИСКА ВКЛ" color={PC.live} />}
          flush
        >
          <div className="divide-y divide-neutral-100">
            {NOTES3_3.map((n2) => (
              <Row key={n2.nm} nm={n2.nm} sub={n2.sub} pill={{ t: 'ПРИХОДИТ', cls: 'live' }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-t border-neutral-100 px-4 py-2.5 text-[12.5px] text-neutral-500">
            <Bell size={13} /> Уведомления — всё, что даёт подписка
          </div>
        </Panel>
      </>
    </WebApp>
  );
}

/** Подписки на телефоне: тот же список и та же единственная кнопка роли —
    «Отписаться». Экран собран строками и на большом экране, поэтому меняется
    только полоса над списком: счётчик и выгрузка встают друг под другом. */
const Subs3_3Phone = () => {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(SUBS.map((s) => [s.nm, s.on])),
  );
  const n = Object.values(on).filter(Boolean).length;
  return (
    <PhoneRoleApp role={R0304} nav="Подписки" title="Мои подписки" sub="4 соревнования из 32">
      <div className="mb-4 flex flex-col gap-2">
        <span className="text-[12.5px] text-neutral-500">
          Отслеживается {n} из 32 соревнований сезона
        </span>
        <div>
          <Btn>
            <Download size={14} /> Выгрузить список
          </Btn>
        </div>
      </div>

      <Panel title="Отслеживаемые соревнования" flush>
        <div className="divide-y divide-neutral-100">
          {SUBS.map((s) => (
            /* Название, состояние и кнопка в 392 px в один ряд не встают:
               значок и «Отписаться» уходят под название вместе с ближайшим
               событием — тем, ради чего подписку и держат. */
            <div key={s.nm} className="px-4 py-2.5 leading-tight">
              <div className="text-[13.5px] font-medium">{s.nm}</div>
              <div className="mt-0.5 text-xs text-neutral-500">ближайшее событие: {s.next}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Pill t={s.st} color={PC[s.cls]} />
                <Button size="sm" variant="outline" onPress={() => setOn({ ...on, [s.nm]: !on[s.nm] })}>
                  {on[s.nm] ? 'Отписаться' : 'Подписаться'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Уведомления · Кубок РК 2026" extra={<Pill t="ПОДПИСКА ВКЛ" color={PC.live} />} flush>
        <div className="divide-y divide-neutral-100">
          {NOTES3_3.map((n2) => (
            <Row key={n2.nm} nm={n2.nm} sub={n2.sub} pill={{ t: 'ПРИХОДИТ', cls: 'live' }} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 border-t border-neutral-100 px-4 py-2.5 text-[12.5px] text-neutral-500">
          <Bell size={13} /> Уведомления — всё, что даёт подписка
        </div>
      </Panel>
    </PhoneRoleApp>
  );
};

const Subs3_3States = () => (
  <States>
    <Shot
      tone="danger"
      title="Права вмешаться в ход нет"
      text="Подписка даёт только уведомления; кнопок, меняющих турнир, на экране нет."
      wide
    >
      <Frag w={640}>
        <Rows>
          <Row
            nm="Кубок Республики Казахстан 2026"
            sub="подписка включена · уведомления о состоянии и протоколе"
            pill={{ t: 'ПОДПИСКА', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">
            «Отписаться» — единственная кнопка роли: она меняет только собственные уведомления, а
            не турнир.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд ролей ────────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.
    Коды, подписи и порядок — те же, что были: по ним сходятся flows/, данные
    роли и Storybook. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    /* Вход в приложении — тот же сценарий ИИН + код; кадр берётся из сквозных
       экранов (role00), а не рисуется вторым. */
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э3.1': {
    cap: 'Обзорная панель',
    view: () => <Dash3_1 />,
    alt: () => <Dash3_1Phone />,
    next: 'пункт меню модуля',
  },
  'Э3.2': {
    cap: 'Модули в режиме чтения',
    view: () => (
      <>
        <Read3_2 />
        <Read3_2States />
      </>
    ),
    alt: () => <Read3_2Phone />,
    next: '«Подписаться» в карточке',
  },
  'Э3.3': {
    cap: 'Подписки',
    view: () => (
      <>
        <Subs3_3 />
        <Subs3_3States />
      </>
    ),
    alt: () => <Subs3_3Phone />,
  },
};

export function Role0304Board() {
  return <Board role={R0304} screens={SCREENS} />;
}
