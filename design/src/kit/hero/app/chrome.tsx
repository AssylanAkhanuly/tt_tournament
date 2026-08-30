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
import { ArrowLeft, Bell, Check, ChevronDown, LogOut, MoreHorizontal, User } from 'lucide-react';
import { Avatar, Chip, Separator } from '@heroui/react';
import { Brand } from '../../../ui';
import { Laptop, Phone, Tablet } from './frame';

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
  roles?: string[];
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

/* Меню профиля. Выход живёт здесь, а не отдельной кнопкой: система именная,
   каждое действие пишется в журнал с автором (TZ §12), поэтому «кто я» и
   «выйти» — одно место. Роли переключаются тут же. */
const ProfileMenu = ({ person, roles }: { person: Person; roles?: string[] }) => {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(person.rl);
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 hover:bg-neutral-100"
        onClick={() => setOpen(!open)}
      >
        <Avatar size="sm">
          <Avatar.Image alt={person.nm} src={person.av} />
          <Avatar.Fallback>{person.nm.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-semibold">{person.nm}</span>
          <span className="block text-[11px] text-neutral-500">{cur}</span>
        </span>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          {/* «Вы вошли как» — первым: система именная, и человек должен видеть,
              под каким аккаунтом работает, до того как что-то нажмёт (TZ §12). */}
          <div className="px-2.5 pb-2 pt-2 leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-neutral-400">Вы вошли как</div>
            <div className="mt-0.5 text-[13px] font-semibold">{person.nm}</div>
            {person.email && <div className="text-[11.5px] text-neutral-500">{person.email}</div>}
          </div>
          <Separator className="my-1" />
          {roles && roles.length > 1 && (
            <>
              <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Мои роли
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => setCur(r)}
                >
                  <span className="w-4">{r === cur && <Check size={14} className="text-blue-600" />}</span>
                  {r}
                </button>
              ))}
              <Separator className="my-1" />
            </>
          )}
          <button
            type="button"
            data-to="Э0.2"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          >
            <User size={14} /> Мой профиль
          </button>
          {/* Выход отбит линией и красный: случайный выход посреди турнира
              стоит дороже лишнего клика, и на него нельзя попасть по инерции. */}
          <Separator className="my-1" />
          <button
            type="button"
            data-to="Э0.1"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      )}
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
  children,
}: {
  role: RoleUI;
  /** Активный пункт сайдбара. */
  nav: string;
  title: string;
  sub?: string;
  back?: { label: string; to?: string };
  /** Плашка-правило под заголовком: почему экран устроен так. */
  hint?: string;
  /** Правая колонка экрана ✳ (30.08.2026): то, за чем следят, пока работают в
      основной области — идущие матчи и очередь пар на «ходе турнира». Такое
      блоком в общем потоке не годится: за ним надо смотреть постоянно, а не
      доскроллив до низа. Это единственное исключение из правила «блоки идут
      один под другим»: правая колонка — не второй блок, а наблюдение. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Laptop>
      {/* Шапка: бренд · название продукта/турнира · состояние · профиль. */}
      <div className="flex h-14 shrink-0 items-center gap-3.5 border-b border-neutral-200 bg-white px-5">
        <Brand size="sm" />
        <Separator orientation="vertical" className="h-6" />
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold">{role.brandName ?? 'Чемпионат Казахстана 2026'}</div>
          <div className="text-[11px] text-neutral-500">{role.brandSub ?? 'Одиночный · олимпийская · г. Астана'}</div>
        </div>
        {role.badge !== false && (
          <Chip color="success" size="sm">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
            {role.badge ?? 'ИДЁТ'}
          </Chip>
        )}
        <div className="flex-1" />
        <BellMenu />
        <ProfileMenu person={role.person} roles={role.roles} />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Сайдбар: разделы роли. `data-nav` — крючок карты флоу. */}
        <div className="flex w-[212px] shrink-0 flex-col gap-0.5 border-r border-neutral-200 bg-white px-3 py-4">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {role.title}
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
        </div>

        {/* Рабочая область: заголовок и содержимое на сером холсте. */}
        <div className="flex min-w-0 flex-1 flex-col bg-neutral-50">
          <div className="shrink-0 px-6 pb-4 pt-5">
            {back && <BackLink label={back.label} to={back.to} />}
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {sub && <p className="mt-0.5 text-[13px] text-neutral-500">{sub}</p>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
            {hint && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-blue-900">
                {hint}
              </div>
            )}
            {children}
          </div>
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

/** Планшетная оболочка: судья за столом. Сайдбара нет — только шапка. */
export function TabletApp({
  title,
  sub,
  badge,
  back,
  center,
  children,
}: {
  title: string;
  sub?: string;
  badge?: string;
  back?: { label: string; to?: string };
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <Tablet>
      <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-5 py-3.5">
        <Brand size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[15px] font-semibold">{title}</div>
          {sub && <div className="truncate text-xs text-neutral-500">{sub}</div>}
        </div>
        {badge && (
          <Chip color="success" size="sm">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
            {badge}
          </Chip>
        )}
      </div>
      <div className={'flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5' + (center ? ' justify-center' : '')}>
        {back && <BackLink label={back.label} to={back.to} />}
        {children}
      </div>
    </Tablet>
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
  children,
}: {
  role: RoleUI;
  nav: string;
  title: string;
  sub?: string;
  back?: { label: string; to?: string };
  /** Плашка-правило под заголовком — та же, что у `WebApp`: у экрана одно
      объяснение на оба формата, и на телефоне оно не должно пропадать. */
  hint?: string;
  children: ReactNode;
}) {
  const items = role.nav;
  let shown = items.slice(0, 4);
  const rest = items.slice(4);
  if (rest.length && !shown.some(([, l]) => l === nav)) {
    const cur = items.find(([, l]) => l === nav);
    if (cur) shown = [...shown.slice(0, 3), cur];
  }
  const tabs: [ReactNode, string][] = rest.length
    ? [...shown, [<MoreHorizontal size={17} key="more" />, 'Ещё']]
    : shown;

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

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-3">
        <div className="pb-3 pt-1">
          {back && <BackLink label={back.label} to={back.to} />}
          <h1 className="text-[19px] font-semibold leading-tight tracking-tight">{title}</h1>
          {sub && <p className="mt-0.5 text-[12.5px] leading-snug text-neutral-500">{sub}</p>}
        </div>
        {hint && (
          <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] leading-relaxed text-blue-900">
            {hint}
          </div>
        )}
        {children}
      </div>

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
