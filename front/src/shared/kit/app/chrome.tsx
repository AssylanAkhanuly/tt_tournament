/* Оболочки приложения нового слоя (HeroUI) ✳ (30.08.2026).

   Один каркас на все веб-роли: верхняя панель (бренд · турнир · состояние ·
   уведомления · профиль), сайдбар и рабочая область с заголовком. Поведение
   перенесено из старой оболочки Desk — колокольчик открывает ленту, профиль
   меню с ролями и выходом, — а подача новая: HeroUI, светлая тема.

   Крючки карты флоу:
   - пункт сайдбара несёт `data-nav` — карта находит его по подписи и уводит на
     экран раздела;
   - строки уведомлений несут `data-to` — переход в ленту (Э0.3);
   - возврат «← …» над заголовком несёт `data-to` экрана-родителя. */

import { useState, type ReactNode } from 'react';
import { ArrowLeft, Bell, Check, ChevronDown, ChevronsUpDown, LogOut, MoreHorizontal, User } from 'lucide-react';
import { Avatar, Chip, Separator } from '@heroui/react';
import { Brand } from '../brand';
import { Laptop, Phone } from './frame';

/** Кто «сидит» за экраном роли — подпись профиля в шапке.
    `email` показывается в меню профиля строкой «Вы вошли как»: у ролей, где
    его не задали, остаётся только имя. */
export type Person = { nm: string; rl: string; av: string; email?: string };

/** Роль в макетах нового слоя: та же форма, что у старого `RoleUI`, — данные
    ролей переносятся без переписывания. */
export type RoleUI = {
  num: string;
  title: string;
  person: Person;
  nav: [ReactNode, string][];
  brandName?: string;
  brandSub?: string;
  /** Значок состояния в шапке; `false` — роль вне турнира, значка нет. */
  badge?: string | false;
  /** Другие роли этого же человека ✳ (31.08.2026). Один человек — один аккаунт
      (QUESTIONS 9.5): судейская роль добавляется к существующей, второй записи
      не заводится. Значит в шапке нужен не только «кто я», но и «в какой роли
      я сейчас работаю» и переход в другую — иначе человек с двумя ролями
      вынужден выходить и входить заново.

      Строкой — название роли; парой `{ t, to }` — ещё и экран, на который
      роль открывается (кабинет судьи, главная спортсмена). */
  roles?: (string | { t: string; to?: string })[];
};

/* Лента последних уведомлений в шапке (перечень — TZ §10.1). Набор общий на
   все роли: проверяем поведение, а не персональный список. */
const NOTES: { t: string; s: string; at: string }[] = [
  { t: 'Заявка принята', s: 'Кубок Алматы 2026 · решение главного судьи', at: '10:42' },
  { t: 'Пара вызвана на стол', s: 'стол 5 · 1/8 финала', at: '09:15' },
  { t: 'Рейтинг пересчитан', s: 'турнир завершён · +8', at: 'вчера' },
];

const BellMenu = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
        onClick={() => setOpen(!open)}
      >
        <Bell size={17} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-80 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          <div className="flex items-baseline justify-between px-2.5 pb-1.5 pt-2">
            <span className="text-sm font-semibold">Уведомления</span>
            <span className="text-xs text-neutral-500">3 непрочитанных</span>
          </div>
          {NOTES.map((n) => (
            <button
              key={n.t}
              type="button"
              data-to="Э0.3"
              className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-neutral-50"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{n.t}</span>
                <span className="block truncate text-xs text-neutral-500">{n.s}</span>
              </span>
              <span className="text-xs text-neutral-400">{n.at}</span>
            </button>
          ))}
          <Separator className="my-1" />
          <button
            type="button"
            data-to="Э0.3"
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-blue-600 hover:bg-neutral-50"
          >
            Все уведомления
          </button>
        </div>
      )}
    </div>
  );
};


/* ── Боковое меню: карточка роли сверху, карточка человека снизу ──────
   Решение от 31.08.2026. Раньше и то и другое жило одной кнопкой в шапке
   справа: имя, фото, роль и переключение ролей — всё в выпадающем меню, куда
   надо было догадаться зайти. У человека с двумя ролями (QUESTIONS 9.5: один
   человек — один аккаунт) это значило, что смена рабочего места спрятана за
   кликом по своему фото.

   Теперь так же, как в рабочих системах: сверху бокового меню — в какой роли
   работаешь (и переключение), снизу — кто ты (профиль и выход). Между ними
   разделы. Шапка остаётся про турнир и уведомления. */

/** Верхняя карточка бокового меню: роль, в которой человек сейчас работает.
    Стрелки вверх-вниз — обещание переключения; у человека с одной ролью
    карточка не кликается и стрелок нет. */
const SideRole = ({ role }: { role: RoleUI }) => {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(role.title);
  const list = (role.roles ?? []).map((r) => (typeof r === 'string' ? { t: r, to: undefined } : r));
  const many = list.length > 1;
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={many ? open : undefined}
        onClick={many ? () => setOpen(!open) : undefined}
        className={
          'flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-left ' +
          (many ? 'hover:bg-neutral-50' : 'cursor-default')
        }
      >
        {/* Знак роли — иконка, а не номер ✳ (04.09.2026): «1» человеку не
            говорит ничего, номер роли живёт в наших документах, а не у него в
            голове. Берём иконку первого раздела роли: она уже подобрана под то,
            чем эта роль занимается, и второй раз выбирать её не нужно. */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white [&_svg]:h-4 [&_svg]:w-4">
          {role.nav?.[0]?.[0] ?? <span className="text-[12px] font-bold">{role.num}</span>}
        </span>
        {/* У одной роли второй строки нет ✳ (04.09.2026): «единственная роль»
            — рассказ о самом себе, а не факт о человеке, и отсутствующая
            стрелка говорит то же самое молча. Освободившуюся строку забирает
            название роли: оно длинное и в одну строку не помещалось. */}
        <span className="min-w-0 flex-1 leading-tight">
          <span
            className={
              'block text-[12.5px] font-semibold ' + (many ? 'truncate' : 'line-clamp-2')
            }
          >
            {cur}
          </span>
          {many && (
            <span className="block truncate text-[11px] text-neutral-500">
              и ещё {list.length - 1} роль
            </span>
          )}
        </span>
        {many && <ChevronsUpDown size={14} className="shrink-0 text-neutral-400" />}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[52px] z-30 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Работать как
          </div>
          {list.map((r) => (
            <button
              key={r.t}
              type="button"
              data-to={r.t === cur ? undefined : r.to}
              className={
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] ' +
                (r.t === cur ? 'font-medium text-neutral-900' : 'text-neutral-700 hover:bg-neutral-50')
              }
              onClick={() => {
                setCur(r.t);
                setOpen(false);
              }}
            >
              <span className="w-4">{r.t === cur && <Check size={14} className="text-blue-600" />}</span>
              <span className="min-w-0 flex-1 truncate">{r.t}</span>
              {r.t !== cur && <span className="text-[11px] text-neutral-400">перейти</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Нижняя карточка бокового меню: кто вошёл. Профиль и выход — здесь же:
    выход отбит линией и красный, случайный выход посреди турнира стоит
    дороже лишнего клика. */
const SidePerson = ({ person }: { person: Person }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-[52px] left-0 right-0 z-30 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          <div className="px-2 pb-1 pt-1 text-[11px] uppercase tracking-wider text-neutral-400">Вы вошли как</div>
          <div className="truncate px-2 pb-1.5 text-[12.5px] font-semibold">{person.nm}</div>
          <Separator className="my-1" />
          <button
            type="button"
            data-to="Э0.2"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-neutral-700 hover:bg-neutral-50"
          >
            <User size={14} /> Мой профиль
          </button>
          <Separator className="my-1" />
          <button
            type="button"
            data-to="Э0.1"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-red-600 hover:bg-red-50"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-left hover:bg-neutral-50"
      >
        <Avatar size="sm">
          <Avatar.Image alt={person.nm} src={person.av} />
          <Avatar.Fallback>{person.nm.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[12.5px] font-semibold">{person.nm}</span>
          {/* Роль под именем не повторяем: она уже стоит карточкой сверху. Здесь
              ответ на «кто я», а не «в какой я роли». */}
          <span className="block truncate text-[11px] text-neutral-500">
            {person.email ?? 'профиль и выход'}
          </span>
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-neutral-400" />
      </button>
    </div>
  );
};

/** Возврат над заголовком — у экранов, куда приходят из списка. */
export const BackLink = ({ label, to }: { label: string; to?: string }) => (
  <button
    type="button"
    data-to={to}
    className="mb-1 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
  >
    <ArrowLeft size={13} /> {label}
  </button>
);

/** Веб-оболочка роли: ноутбук, шапка, сайдбар, рабочая область. */
export function WebApp({
  role,
  nav,
  title,
  sub,
  back,
  hint,
  aside,
  actions,
  children,
}: {
  role: RoleUI;
  /** Активный пункт сайдбара. */
  nav: string;
  title: string;
  sub?: string;
  back?: { label: string; to?: string };
  /** ⚠ Больше не рисуется ✳ (01.09.2026): правило под заголовком читалось как
      шум над работой. Проп оставлен, чтобы не править двенадцать экранов. */
  hint?: string;
  /** Правая колонка экрана ✳ (30.08.2026): то, за чем следят, пока работают в
      основной области — идущие матчи и очередь пар на «ходе турнира». Такое
      блоком в общем потоке не годится: за ним надо смотреть постоянно, а не
      доскроллив до низа. Это единственное исключение из правила «блоки идут
      один под другим»: правая колонка — не второй блок, а наблюдение. */
  aside?: ReactNode;
  /** Главные кнопки экрана ✳ (03.09.2026): «Подтвердить результат», «Отправить
      заключение», «Принять состав». Прилипают к низу рабочей области, а не
      стоят в потоке: до них дотягиваются в любой момент, не доскроллив до
      конца. В потоке главное действие находилось только после прокрутки — на
      длинном экране это значит «не находилось». */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Laptop>
      {/* Шапка: бренд · название продукта/турнира · состояние · профиль. */}
      <div className="flex h-14 shrink-0 items-center gap-3.5 border-b border-neutral-200 bg-white px-5">
        <Brand size="sm" />
        <Separator orientation="vertical" className="h-6" />
        {/* Вторая строка в шапке — только факт о том, что открыто (турнир,
            сезон, клуб). Пересказ разделов меню («заявки · рейтинг · документы»)
            отсюда убран ✳: он повторял сайдбар и ничего не добавлял. Нет
            факта — нет и строки, подставлять умолчание незачем. */}
        <div className="leading-tight">
          {role.brandName && <div className="text-[13.5px] font-semibold">{role.brandName}</div>}
          {role.brandSub && <div className="text-[11px] text-neutral-500">{role.brandSub}</div>}
        </div>
        {role.badge !== false && (
          <Chip color="success" size="sm">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
            {role.badge ?? 'ИДЁТ'}
          </Chip>
        )}
        <div className="flex-1" />
        <BellMenu />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Сайдбар: роль сверху, разделы, человек снизу. `data-nav` — крючок
            карты флоу. */}
        <div className="flex w-[240px] shrink-0 flex-col border-r border-neutral-200 bg-white px-3 py-3">
          <SideRole role={role} />
          <div className="px-2 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Разделы
          </div>
          {role.nav.map(([icon, label]) => (
            <button
              key={label}
              type="button"
              data-nav
              aria-current={label === nav || undefined}
              className={
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium ' +
                (label === nav
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900')
              }
            >
              <span className={label === nav ? 'text-blue-600' : 'text-neutral-400'}>{icon}</span>
              {label}
            </button>
          ))}
          {/* Карточка человека прижата к низу: она не пункт меню, а ответ на
              «под кем я работаю», и место у неё постоянное. */}
          <div className="mt-auto pt-3">
            <SidePerson person={role.person} />
          </div>
        </div>

        {/* Рабочая область: заголовок и содержимое на сером холсте.

            Заголовок прокручивается вместе с содержимым ✳ (03.09.2026): он
            отвечает на вопрос «куда я попал», а его задают один раз — при входе
            на экран. Прибитый к верху, он всю остальную работу занимал место и
            отбирал высоту у таблиц. Прибито теперь то, к чему возвращаются
            постоянно, — полоса главных действий внизу. */}
        <div className="flex min-w-0 flex-1 flex-col bg-neutral-50">
          <div className="flex min-h-0 flex-1 flex-col overflow-auto px-6 pb-6 [--kit-gut:1.5rem] [--kit-gutb:1.5rem]">
            <div className="pb-4 pt-5">
              {back && <BackLink label={back.label} to={back.to} />}
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {sub && <p className="mt-0.5 text-[13px] text-neutral-500">{sub}</p>}
            </div>
            {children}
          </div>
          {actions && (
            <div className="kit-actions flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 bg-white px-6 py-3">
              {actions}
            </div>
          )}
        </div>

        {/* Правая колонка наблюдения: свой скролл, чтобы очередь не уезжала
            вместе с рабочей областью. Холст тот же серый — колонка отбита
            линией, а не другим фоном: это часть экрана, а не чужая панель. */}
        {aside && (
          <aside className="min-h-0 w-[324px] shrink-0 overflow-auto border-l border-neutral-200 bg-neutral-50 px-4 pb-6 pt-5">
            {aside}
          </aside>
        )}
      </div>
    </Laptop>
  );
}

/** Телефонная оболочка роли ✳ (30.08.2026): тот же экран, что на десктопе, но
    в телефоне.

    Вкладки строятся из разделов роли (`role.nav`), а не пишутся руками: иначе
    у семнадцати ролей появится семнадцать разных нижних панелей. Больше пяти
    вкладок на 392 px не помещается — лишние сворачиваются в «Ещё», а активный
    раздел, если он попал под свёртку, показывается вместо четвёртой вкладки:
    человек должен видеть, где он находится. */
export function PhoneRoleApp({
  role,
  nav,
  title,
  sub,
  back,
  hint,
  actions,
  children,
}: {
  role: RoleUI;
  nav: string;
  title: string;
  sub?: string;
  back?: { label: string; to?: string };
  /** ⚠ Больше не рисуется ✳ (01.09.2026), см. `WebApp`. */
  hint?: string;
  /** Главные кнопки экрана ✳ (03.09.2026): прилипают к низу, над вкладками. На
      телефоне это важнее, чем на десктопе: экран короткий, и кнопка в потоке
      уезжает за первым же списком. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  /* Кнопок в полосе не больше четырёх ✳ (31.08.2026, решение владельца
     продукта). Пять и больше — это уже не полоса разделов, а список: подписи
     ужимаются до нечитаемых, палец промахивается, и «Ещё» теряется среди
     равных ему по виду соседей. Поэтому четыре: три раздела и «Ещё», а при
     ровно четырёх разделах — все четыре без «Ещё».

     Открытый раздел в полосе всегда есть, даже если он из «Ещё»: иначе полоса
     показывает четыре чужих названия и ни одного своего — человек не понимает,
     где он. Такой раздел встаёт третьим, вытесняя предыдущего. */
  const MAX = 4;
  const items = role.nav;
  const fits = items.length <= MAX;
  let shown = items.slice(0, fits ? MAX : MAX - 1);
  if (!fits && !shown.some(([, l]) => l === nav)) {
    const cur = items.find(([, l]) => l === nav);
    if (cur) shown = [...shown.slice(0, MAX - 2), cur];
  }
  const tabs: [ReactNode, string][] = fits
    ? shown
    : [...shown, [<MoreHorizontal size={17} key="more" />, 'Ещё']];

  return (
    <Phone>
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
        <Brand size="sm" sub={role.brandName} />
        <div className="flex items-center gap-1">
          {role.badge !== false && (
            <Chip color="success" size="sm">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
              {role.badge ?? 'ИДЁТ'}
            </Chip>
          )}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-3 [--kit-gut:1rem] [--kit-gutb:0.75rem]">
        <div className="pb-3 pt-1">
          {back && <BackLink label={back.label} to={back.to} />}
          <h1 className="text-[19px] font-semibold leading-tight tracking-tight">{title}</h1>
          {sub && <p className="mt-0.5 text-[12.5px] leading-snug text-neutral-500">{sub}</p>}
        </div>
        {children}
      </div>

      {actions && (
        <div className="kit-actions flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-4 py-2.5 [&>*]:flex-1">
          {actions}
        </div>
      )}

      <div className="flex shrink-0 items-stretch justify-around border-t border-neutral-200 bg-white px-1 pt-1">
        {tabs.map(([icon, label]) => (
          <button
            key={label}
            type="button"
            data-nav
            aria-current={label === nav || undefined}
            className={
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium ' +
              (label === nav ? 'text-blue-600' : 'text-neutral-400')
            }
          >
            {icon}
            <span className="max-w-full truncate px-0.5">{label}</span>
          </button>
        ))}
      </div>
    </Phone>
  );
}

/** Телефонная оболочка: приложение спортсмена. Нижние вкладки несут
    `data-nav` — карта флоу уводит по разделам. */
export function PhoneApp({
  brand,
  tabs,
  active,
  center,
  children,
}: {
  brand?: string;
  tabs: [ReactNode, string][];
  active: string;
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <Phone>
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <Brand size="sm" sub={brand} />
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
      <div className={'flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto px-4 pb-3 pt-1' + (center ? ' justify-center' : '')}>
        {children}
      </div>
      <div className="flex shrink-0 items-stretch justify-around border-t border-neutral-200 bg-white px-1 pt-1">
        {tabs.map(([icon, label]) => (
          <button
            key={label}
            type="button"
            data-nav
            aria-current={label === active || undefined}
            className={
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium ' +
              (label === active ? 'text-blue-600' : 'text-neutral-400')
            }
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </Phone>
  );
}
