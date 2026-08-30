/* Сквозные экраны — есть у каждой роли. Э0.1–Э0.7 — на новом слое (HeroUI)
   ✳ (30.08.2026). Содержание, коды и переходы — прежние
   (см. `flows/00-obshchie-ekrany.md`); меняется подача: оболочка WebApp,
   рамки Laptop/Phone и доменные компоненты `kit/hero/app` вместо старого
   макетного слоя.

   Это не роль, а общая часть системы. Держим её макетами по той же схеме, что
   и роли, ради одного: маршрут любой роли начинается со входа, и борд роли
   открывается им же — сценарий не должен начинаться с середины.

   Поэтому `Login0_1` экспортируется: борды ролей ставят его первой колонкой,
   а требование к экрану карточка узла берёт из данных сквозных экранов
   (`data/role00.ts`) — дублировать вход в четырнадцати файлах не нужно.
   Страница входа — лицо системы, отсюда и подача: центральная карточка на
   фирменном синем фоне знака ФНТ. */

import { useState, type ReactNode } from 'react';
import {
  BarChart3, Bell, CalendarDays, Check, CheckCheck, ChevronDown, Gavel, History, KeyRound,
  LayoutDashboard, LogIn, LogOut, Newspaper, Play, Radio, Scroll, Trophy, UserCog, UserPlus,
} from 'lucide-react';
import { Avatar, Button, Chip } from '@heroui/react';
import {
  A, AW, BackLink, Bar, DataTable, DisabledAction, EmptyBox, Facts, FieldView, FormGrid,
  GameCells, Laptop, MatchCard, PageTabs, Panel, Phone, PickField, Pill, QuietAction, Row, Rows,
  ScreenScope, Separator, TextInput, WebApp,
  type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Also, Board, Shot, States, type ScreenMap } from './shell';
/* Бренд — общий примитив: тот же знак, что в шапке нового слоя (chrome.tsx). */
import { Brand } from '../ui';

/* ── Роль-оболочка сквозных экранов ─────────────────────────────── */

/** Профиль и уведомления показываем в оболочке администратора Федерации: она
    ничем не отличается от чужой — в том и смысл, что эти экраны у всех ролей
    одинаковые. Данные — те же, что в старом слое (`roles.tsx`), тип — из
    нового; `roles` заполнен, чтобы меню профиля показывало переключение —
    действие Э0.2 «переключение роли» живёт именно там. */
const R00: RoleUI = {
  num: '0',
  title: 'Сквозные экраны',
  person: { nm: 'Абаева Д.', rl: 'Администратор Федерации', av: AW(44) },
  brandName: 'Сезон 2026',
  brandSub: 'Календарь ФНТ РК · 8 главных стартов',
  /* Сквозные экраны — вне турнира: значка «ИДЁТ» в шапке нет. */
  badge: false,
  nav: [
    [<LayoutDashboard size={16} key="p" />, 'Панель'],
    [<CalendarDays size={16} key="c" />, 'Календарь'],
    [<UserCog size={16} key="u" />, 'Пользователи'],
    [<History size={16} key="j" />, 'Журнал'],
    [<Newspaper size={16} key="n" />, 'Новости'],
  ],
  roles: ['Администратор Федерации', 'Менеджер · только чтение'],
};

/* ── Мелочи, общие для экранов ──────────────────────────────────── */

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/** Язык интерфейса переключается прямо на входе: до входа человек не может
    поменять его в профиле, а система трёхъязычная (TZ §3.1). Свой маленький
    переключатель, а не FilterSeg: в подвале карточки нужен кегль мельче. */
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

/** Ссылка-действие внутри карточки входа: переходы борд ловит по `data-to`. */
const ALink = ({ to, muted, children }: { to?: string; muted?: boolean; children: ReactNode }) => (
  <button
    type="button"
    data-to={to}
    className={
      'text-[12.5px] font-semibold hover:underline ' + (muted ? 'text-neutral-500' : 'text-blue-600')
    }
  >
    {children}
  </button>
);

/** Пароль со «показать»: доменного поля с суффиксом в ките нет, поэтому поле
    собрано нативным вводом — тем же приёмом, что DateInput нового слоя. */
function PassInput({
  label = 'Пароль',
  value = '••••••••••',
  error,
}: {
  label?: string;
  value?: string;
  /** Текст ошибки под полем: поле краснеет, введённое не очищается. */
  error?: string;
}) {
  const [v, setV] = useState(value);
  return (
    <label className="col-span-2 flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <span
        className={
          'flex items-center rounded-lg border bg-white focus-within:border-blue-500 ' +
          (error ? 'border-red-400' : 'border-neutral-300')
        }
      >
        <KeyRound size={14} className="ml-3 shrink-0 text-neutral-400" />
        <input
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-neutral-400"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
        <button type="button" className="px-3 text-xs font-medium text-blue-600">
          показать
        </button>
      </span>
      {error && <span className="text-xs leading-snug text-red-600">{error}</span>}
    </label>
  );
}

/** Согласие на обработку персональных данных — обязательная отметка отдельной
    строкой, а не мелким текстом (решение из флоу Э0.5). Checkbox из
    @heroui/react в макетах не разрешён — нативная отметка с акцентом токеном
    Tailwind. */
const Consent = ({ off, sub }: { off?: boolean; sub?: string }) => (
  <label className="col-span-2 mt-1 flex items-start gap-2.5">
    <input type="checkbox" defaultChecked={!off} className="mt-0.5 size-4 shrink-0 accent-blue-600" />
    <span className="text-[12.5px] leading-snug text-neutral-700">
      Согласие на обработку персональных данных ✳
      {sub && <span className="block text-xs text-neutral-500">{sub}</span>}
    </span>
  </label>
);

/** Подзаголовок группы полей внутри формы регистрации: зоны из флоу («Кто вы»,
    «Контакты и вход») видны на самом экране, а не только в карточке узла. */
const SecCap = ({ children }: { children: ReactNode }) => (
  <div className="col-span-2 mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 first:mt-0">
    {children}
  </div>
);

/* ── Оболочка страниц без входа ─────────────────────────────────── */

/** Титульная страница: до входа ни сайдбара, ни профиля — карточка по центру
    на фирменном синем. Синий — цвет знака ФНТ; кольца на фоне — намёк на мяч,
    нарисованы рамками, без картинок. `judge` — своя окраска формы судьи:
    формы похожи как две капли, и заголовок читают уже после того, как начали
    заполнять; сам вход не окрашивается — он один на всех. */
const AuthPage = ({
  wide,
  judge,
  children,
}: {
  wide?: boolean;
  judge?: boolean;
  children: ReactNode;
}) => (
  <Laptop>
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-linear-to-br from-blue-800 via-blue-900 to-blue-950">
      <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full border-[30px] border-blue-700/40" />
      <div className="pointer-events-none absolute -bottom-36 -right-20 h-[440px] w-[440px] rounded-full border-[38px] border-blue-700/30" />
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-8">
        <div
          className={
            'my-auto rounded-2xl bg-white p-7 shadow-2xl ' +
            (wide ? 'w-[560px]' : 'w-[400px]') +
            (judge ? ' border-t-4 border-t-amber-500' : '')
          }
        >
          {children}
        </div>
      </div>
      <div className="relative shrink-0 pb-5 text-center text-xs text-blue-200/80">
        Федерация настольного тенниса Республики Казахстан · цифровая платформа турниров
      </div>
    </div>
  </Laptop>
);

/* ── Э0.1 · Вход ───────────────────────────────────────────────── */

export function Login0_1() {
  return (
    <AuthPage>
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div>
          <div className="text-xl font-semibold tracking-tight">Вход в систему</div>
          <div className="mt-1 text-[12.5px] text-neutral-500">
            Один аккаунт на все роли — сайт и приложение
          </div>
        </div>
      </div>

      <FormGrid>
        <TextInput label="Телефон или почта" value="+7 705 431 20 18" wide />
        <PassInput />
      </FormGrid>

      <div className="mt-3 flex items-center justify-between">
        <ALink>Забыли пароль</ALink>
        <Langs />
      </div>

      <Button variant="primary" className="mt-4 w-full">
        <LogIn size={15} /> Войти
      </Button>

      {/* Два пути завести себя самому: спортсмен и судья (⚠ 9.2 — про судью
          федерация не ответила, экран стоит на нашем предположении). */}
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-4">
        <span className="text-[12.5px] text-neutral-500">Впервые здесь?</span>
        <ALink to="Э0.5">Зарегистрироваться</ALink>
        <span className="text-neutral-300">·</span>
        <ALink to="Э0.7">Стать судьёй</ALink>
      </div>
    </AuthPage>
  );
}

/** Следующий шаг, если ролей несколько: выбор контекста (✳ наше решение). */
export function Context0_1() {
  return (
    <AuthPage wide>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div>
          <div className="text-xl font-semibold tracking-tight">С какой ролью войти</div>
          <div className="mt-1 text-[12.5px] text-neutral-500">
            Выбор запоминается · переключатель остаётся в шапке
          </div>
        </div>
      </div>
      <Rows>
        <Row
          nm="Судья · Кубок Республики Казахстан 2026"
          sub="выдала Абаева Д., 10.04.2026 · до 20.05.2026"
          pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
        />
        <Row
          nm="Судья стола · стол 4"
          sub="выдал Оспанов Т., 15.04.2026 · до 20.05.2026"
          pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
        />
        <Row
          nm="Спортсмен"
          sub="своя карточка, рейтинг, заявки на турниры"
          pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
        />
      </Rows>
    </AuthPage>
  );
}

/** Меню профиля в шапке ✳ — то место, откуда из системы выходят.

    В ките (`chrome.tsx`) меню закрыто по умолчанию, и на макете от него видно
    только имя с фотографией: решение зоны — «кто я» и «выйти» в одном месте —
    не показано нигде. Врезка показывает то же меню открытым.

    Выход живёт здесь, а не отдельной кнопкой: система именная, каждое действие
    пишется в журнал с автором (TZ §12). Одним кликом по имени из системы не
    выходят — первый клик открывает меню, выход второй; сам «Выйти» отбит
    линией и краснеет под курсором, потому что необратим. */
const ProfileMenu0_1 = () => (
  <Frag w={520}>
    {/* Правый край шапки — он одинаков на каждом экране системы. */}
    <div className="flex items-center gap-2 rounded-t-xl border border-neutral-200 bg-white px-4 py-2.5">
      <span className="mr-auto text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Шапка — на каждом экране
      </span>
      <div className="relative grid size-9 place-items-center rounded-full text-neutral-600">
        <Bell size={17} />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
      </div>
      <div className="flex items-center gap-2.5 rounded-full bg-neutral-100 py-1 pl-1 pr-2.5">
        <Avatar size="sm">
          <Avatar.Image alt="Абаева Д." src={AW(44)} />
          <Avatar.Fallback>А</Avatar.Fallback>
        </Avatar>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">Абаева Д.</div>
          <div className="text-[11px] text-neutral-500">Администратор Федерации</div>
        </div>
        <ChevronDown size={14} className="text-neutral-400" />
      </div>
    </div>

    {/* Меню под кнопкой: первый клик по имени открывает его, а не выходит. */}
    <div className="flex justify-end rounded-b-xl border-x border-b border-neutral-200 bg-neutral-50 px-4 pb-4 pt-2">
      <div className="w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
        <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Вы вошли как
        </div>
        <div className="px-2.5 pb-2 leading-tight">
          <div className="text-[13px] font-semibold">Абаева Динара Ерлановна</div>
          <div className="text-[11px] text-neutral-500">d.abaeva@ttfrk.kz</div>
        </div>
        <Separator className="my-1" />
        <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Мои роли
        </div>
        {(R00.roles ?? []).map((r, i) => (
          <div key={r} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm">
            <span className="w-4">{i === 0 && <Check size={14} className="text-blue-600" />}</span>
            {r}
          </div>
        ))}
        <Separator className="my-1" />
        <button
          type="button"
          data-to="Э0.2"
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <UserCog size={14} /> Мой профиль
        </button>
        <Separator className="my-1" />
        {/* Нарисован под курсором: «Выйти» отбит линией и краснеет. */}
        <button
          type="button"
          data-to="Э0.1"
          className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-left text-sm font-medium text-red-600"
        >
          <LogOut size={14} /> Выйти
        </button>
      </div>
    </div>

    <div className="mt-3">
      <Bar tone="warning">
        ⚠ Что делать с незавершённой работой при выходе — не решено: у судьи бывает неотправленный
        счёт (TZ §6).
      </Bar>
    </div>
  </Frag>
);

/** Тот же вход в приложении: спортсмен — единственная роль с ним (TZ §10). */
export function LoginPhone0_1() {
  return (
    <Phone>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3.5 px-6 pb-6">
        <div className="mb-1 flex justify-center">
          <Brand size="lg" />
        </div>
        <div className="text-center text-xl font-bold tracking-tight">Вход</div>
        <p className="text-center text-[12.5px] leading-relaxed text-neutral-500">
          Тот же логин, что на сайте: приложение и сайт — одна учётная запись
        </p>
        <FormGrid>
          <TextInput label="Телефон" value="+7 705 431 20 18" wide />
          <PassInput value="••••••••" />
        </FormGrid>
        <Button variant="primary" className="mt-1 w-full">
          <LogIn size={15} /> Войти
        </Button>
        <div className="text-center">
          <ALink>Забыли пароль</ALink>
        </div>
      </div>
    </Phone>
  );
}

const Login0_1States = () => (
  <States>
    {/* Счётчика попыток до блокировки здесь больше нет ✳ (замечание федерации,
        09.2026): блокировка аккаунта усложняет вход и заводит администратора в
        цикл — кто-то должен следить за блокировками и разблокировать людей.
        Защита от перебора осталась, но снимается сама: растёт задержка между
        попытками, при серии владельцу уходит письмо. Человеку на экране
        сообщают то, что ему нужно знать, — что пароль неверный. */}
    <Shot
      tone="danger"
      title="Неверный логин или пароль"
      text="Ошибка под полем; поля не очищаются, счётчика попыток нет ✳."
    >
      <Frag w={420}>
        <FormGrid>
          <TextInput label="Телефон или почта" value="+7 705 431 20 18" wide />
          <PassInput
            value="••••••"
            error="Неверный логин или пароль. Проверьте раскладку или восстановите пароль"
          />
        </FormGrid>
        <div className="mt-3">
          <DisabledAction>Войти</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Много неудачных попыток подряд ✳"
      text="Аккаунт не блокируется: растёт задержка между попытками и снимается сама — администратор не нужен."
    >
      <Frag>
        <Rows>
          <Row
            nm="Вход не закрыт"
            sub="следующая попытка через несколько секунд · разблокировка не требуется"
            pill={{ t: 'ЖДЁМ', cls: 'wait' }}
          />
          <Row
            nm="Владельцу ушло письмо"
            sub="кто-то подбирает пароль — можно сменить его или включить вход по ссылке"
            pill={{ t: 'УВЕДОМЛЕН', cls: 'reg' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Числа — с какой попытки растёт задержка и до скольких секунд — наш проект (TZ §12):
            сама схема «без ручной разблокировки» задана федерацией.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Роль истекла"
      text="Роли нет в списке контекстов, история действий человека сохраняется."
    >
      <Frag>
        <Rows>
          <Row nm="Спортсмен" sub="бессрочно" pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }} />
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

/* ── Э0.2 · Свой профиль ───────────────────────────────────────── */

export function Profile0_2() {
  return (
    <WebApp
      role={R00}
      nav="Профиль"
      title="Мой профиль"
      sub="Контакты, язык интерфейса и пароль"
      /* Возврат к работе ✳: на профиль и уведомления приходят из шапки, а не
         из меню, — и обратно из них не вело ничего. Пункта в сайдбаре у них
         нет по устройству (входы в шапке), так что выйти можно было только
         кнопкой браузера. Экран сквозной: возвращает на первый экран роли, под
         которой человек работает; в макете это панель Федерации. */
      back={{ label: 'К работе', to: 'Э1.1' }}
    >
      <div className="grid grid-cols-[1.6fr_1fr] items-start gap-4">
        <Panel title="Профиль">
          <div className="mb-4 flex items-center gap-3.5">
            <Avatar size="lg">
              <Avatar.Image alt="Абаева Динара Ерлановна" src={AW(44)} />
              <Avatar.Fallback>А</Avatar.Fallback>
            </Avatar>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold">Абаева Динара Ерлановна</div>
              {/* Какая роль сейчас — подписью под именем; переключается она в
                  меню профиля в шапке, там же, где написана. */}
              <div className="mt-0.5 text-xs text-neutral-500">
                Администратор Федерации · система · бессрочно
              </div>
            </div>
          </div>
          <FormGrid>
            <TextInput label="Телефон" value="+7 701 220 45 90" />
            <TextInput label="Почта" value="d.abaeva@ttfrk.kz" />
          </FormGrid>
          {/* Язык живёт здесь и только здесь ✳: раньше справа стояла ещё
              карточка «Язык интерфейса» с чипом «ВЫБРАН» — два контрола спорили,
              какой главный. По данным роли язык — пункт зоны «Профиль», поэтому
              остался переключатель, а подпись карточки переехала под него. */}
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-neutral-500">Язык интерфейса</div>
              <div className="mt-1"><Langs /></div>
              <div className="mt-1.5 text-xs leading-snug text-neutral-500">
                Письма и уведомления приходят на нём же
              </div>
            </div>
            <Button size="sm" variant="primary">Сохранить</Button>
          </div>
        </Panel>

        {/* Блока про роль здесь нет: какая роль сейчас — подписью под именем, а
            переключают её там, где она написана, — в меню профиля в шапке.
            Списка своих ролей тоже нет: он был на чтение и ничего не решал. Кто
            роль выдал и до какого срока — в карточке пользователя у
            администратора Федерации (Э1.5). */}
        <Panel title="Безопасность" flush>
          <Row nm="Пароль" sub="изменён 02.02.2026" action="Сменить пароль" />
        </Panel>
      </div>
    </WebApp>
  );
}

const Profile0_2States = () => (
  <States>
    <Shot tone="info" title="Роль одна ✳" text="Раздела переключения в меню профиля нет: выбирать не из чего.">
      <Frag>
        <Rows>
          <Row nm="Спортсмен" sub="система · бессрочно" pill={{ t: 'СЕЙЧАС', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Роль истекла ✳"
      text="Из переключателя в шапке пропадает, доступ по ней закрыт. Срок и кто выдал — в карточке пользователя (Э1.5)."
    >
      <Frag>
        <Rows>
          <Row
            nm="Судья · Открытие сезона 2026"
            sub="роль закончилась 21.01.2026"
            pill={{ t: 'ИСТЕКЛА', cls: 'done' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>Записи журнала сохраняются: видно, что человек делал, пока роль действовала.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.3 · Уведомления ────────────────────────────────────────── */

/** Строка ленты: значок типа вместо аватара — уведомление не про человека. */
const NRow = ({
  ic,
  t,
  s,
  when,
  unread,
}: {
  ic: ReactNode;
  t: string;
  s: string;
  when: string;
  unread?: boolean;
}) => (
  <div data-row className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
    <span
      className={
        'grid size-9 shrink-0 place-items-center rounded-lg ' +
        (unread ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-400')
      }
    >
      {ic}
    </span>
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{t}</span>
      <span className="block truncate text-xs text-neutral-500">{s}</span>
    </span>
    <span className="shrink-0 text-xs text-neutral-400">{when}</span>
    {unread && <Pill t="НОВОЕ" color="accent" />}
  </div>
);

export function Notif0_3() {
  return (
    <WebApp
      role={R00}
      nav="Уведомления"
      title="Уведомления"
      sub="3 непрочитанных из 42"
      /* Тот же возврат, что и у профиля ✳: вход в шапке, значит и выход должен
         быть на экране, а не в кнопке браузера. */
      back={{ label: 'К работе', to: 'Э1.1' }}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <Facts
          items={[
            { k: 'непрочитанных', v: '3', hot: true },
            { k: 'всего', v: '42' },
            { k: 'период', v: '7 дней' },
          ]}
        />
        <Button size="sm" variant="outline">
          <CheckCheck size={14} /> Отметить все прочитанными
        </Button>
      </div>
      <Rows>
        <NRow
          unread
          ic={<Gavel size={17} />}
          t="Вы назначены главным судьёй"
          s="Кубок Республики Казахстан 2026 · решение председателя ГСК"
          when="сегодня, 09:20"
        />
        <NRow
          unread
          ic={<Radio size={17} />}
          t="Пара вызвана на стол 4"
          s="Смагулов А. — Ким Г. · Евразийская лига, 2-й тур"
          when="сегодня, 08:55"
        />
        <NRow
          unread
          ic={<Trophy size={17} />}
          t="Турнир перенесён"
          s="ОРТ «Кубок Иртыша» · 25 апреля → 16 мая · зал занят"
          when="вчера, 17:40"
        />
        <NRow
          ic={<Scroll size={17} />}
          t="Протокол утверждён"
          s="Открытие сезона 2026 · рейтинг пересчитан"
          when="21.01.2026"
        />
        <NRow
          ic={<BarChart3 size={17} />}
          t="Заявка принята"
          s="Первенство РК · 2010 г.р. и моложе"
          when="19.01.2026"
        />
      </Rows>
      {/* Требование зоны: уведомление не тупик — строка ведёт на свой экран. */}
      <div className="mt-2 text-[11px] text-neutral-400">
        Строка ведёт на экран, о котором уведомление: заявка — в заявку, вызов — в матч, протокол — в протокол
      </div>
    </WebApp>
  );
}

/** Лента последних — те же три верхних события, что в списке ниже: числа на
    двух кадрах обязаны сходиться. */
const FEED = [
  { t: 'Вы назначены главным судьёй', s: 'Кубок Республики Казахстан 2026', at: '09:20' },
  { t: 'Пара вызвана на стол 4', s: 'Смагулов А. — Ким Г.', at: '08:55' },
  { t: 'Турнир перенесён', s: 'ОРТ «Кубок Иртыша» · 25 апреля → 16 мая', at: 'вчера' },
];

/** Лента последних под колокольчиком ✳ — зона, откуда на этот экран приходят.

    В ките (`chrome.tsx`) лента закрыта по умолчанию, и на макете от неё видно
    только значок со счётчиком: зона не показана нигде. Врезка показывает её
    открытой. Колокольчик, который умеет только считать непрочитанные,
    заставляет искать событие руками — поэтому под ним сразу лежат последние
    события, а «все уведомления» ведут сюда. */
const BellFeed0_3 = () => (
  <Frag w={520}>
    <div className="flex items-center gap-2 rounded-t-xl border border-neutral-200 bg-white px-4 py-2.5">
      <span className="mr-auto text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Шапка — на каждом экране
      </span>
      <span className="relative grid size-9 place-items-center rounded-full bg-neutral-100 text-neutral-700">
        <Bell size={17} />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
      </span>
    </div>

    <div className="flex justify-end rounded-b-xl border-x border-b border-neutral-200 bg-neutral-50 px-4 pb-4 pt-2">
      <div className="w-80 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
        <div className="flex items-baseline justify-between px-2.5 pb-1.5 pt-2">
          <span className="text-sm font-semibold">Уведомления</span>
          <span className="text-xs text-neutral-500">3 непрочитанных</span>
        </div>
        {FEED.map((n) => (
          <div
            key={n.t}
            className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-neutral-50"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-medium">{n.t}</span>
              <span className="block text-xs text-neutral-500">{n.s}</span>
            </span>
            <span className="shrink-0 text-xs text-neutral-400">{n.at}</span>
          </div>
        ))}
        <Separator className="my-1" />
        <button
          type="button"
          data-to="Э0.3"
          className="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-blue-600 hover:bg-neutral-50"
        >
          Все уведомления
        </button>
      </div>
    </div>

    <div className="mt-3">
      <Bar>
        Каждое событие ведёт на свой экран: заявка — в заявку, вызов — в матч, протокол — в
        протокол. Внизу — «все уведомления»: это и есть текущий экран.
      </Bar>
    </div>
  </Frag>
);

const Notif0_3States = () => (
  <States>
    <Shot tone="info" title="Непрочитанных нет ✳" text="Пустая лента с подписью, что новые появятся здесь.">
      <Frag>
        <EmptyBox title="Всё разобрано" text="0 непрочитанных. Новые уведомления появятся здесь и счётчиком в шапке." />
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 11 — куда приходят уведомления ролям без приложения"
      text="Браузер, почта или SMS и можно ли их отключать — не решено."
    >
      <Frag>
        <Rows>
          <Row nm="В системе" sub="лента и счётчик в шапке" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
          <Row nm="Приложение" sub="есть только у спортсмена" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
          <Row nm="Почта / SMS / браузер" sub="для остальных тринадцати ролей" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.4 · Публичные страницы ─────────────────────────────────── */

/** Шапка сайта: одна на главную и на страницу турнира — разделы, язык и
    «Войти». Общая нарочно: публичная часть — один сайт, и шапка не должна
    разъезжаться между двумя кадрами. */
const SiteHead = ({ active }: { active: string }) => (
  <div className="flex h-14 shrink-0 items-center gap-6 border-b border-neutral-200 bg-white px-6">
    <Brand />
    <nav className="flex items-center gap-1 text-[13px] font-medium">
      {['Главная', 'Календарь', 'Рейтинги', 'Новости'].map((t) => (
        <button
          key={t}
          type="button"
          aria-current={t === active || undefined}
          className={
            'rounded-lg px-2.5 py-1.5 ' +
            (t === active ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-50')
          }
        >
          {t}
        </button>
      ))}
    </nav>
    <div className="flex-1" />
    <Langs />
    <Button size="sm" variant="primary" data-to="Э0.1">
      <LogIn size={14} /> Войти
    </Button>
  </div>
);

type LiveMatch = {
  tour: string;
  home: { nm: string; av: string; sub: string };
  away: { nm: string; av: string; sub: string };
  score: string;
  games: ReadonlyArray<readonly [number, number]>;
  note: string;
};

/** Матчи в реальном времени — одни и те же на главной и на странице турнира:
    два кадра одного сайта не имеют права показывать разные числа.

    Четвёртая партия не доиграна: счёт в ней меньше 11 — при 11:8 партия была
    бы закончена, матч стал бы 3:1 и значок «ИДЁТ» врал. */
const LIVE: LiveMatch[] = [
  {
    tour: 'Евразийская лига, 2-й тур · стол 1 · трансляция',
    home: { nm: 'Смагулов Алан', av: A(32), sub: 'Алматы · «Алатау»' },
    away: { nm: 'Ким Георгий', av: A(44), sub: 'Астана · СКА' },
    score: '2 : 1',
    games: [[11, 8], [9, 11], [11, 6], [9, 8]],
    note: 'идёт 4-я партия · 9:8',
  },
  {
    tour: 'Евразийская лига, 2-й тур · стол 3',
    home: { nm: 'Ерлан Бекзат', av: A(75), sub: 'Шымкент · «Жетісу»' },
    away: { nm: 'Пак Сергей', av: A(13), sub: 'Павлодар · «Иртыш»' },
    score: '0 : 1',
    games: [[7, 11], [6, 9]],
    note: 'идёт 2-я партия · 6:9',
  },
];

/** Публичная часть — не система, а сайт: своя шапка с разделами и «Войти»,
    без сайдбара и профиля. Роли нет — это отсутствие роли (TZ §3). */
export function Public0_4() {
  return (
    <Laptop>
      <SiteHead active="Главная" />

      <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 p-6">
        {/* Матчи в реальном времени — первым блоком и карточками табло: счёт по
            партиям как на табло, а не строкой в таблице. */}
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight">Идут сейчас</h2>
          <Pill t="В РЕАЛЬНОМ ВРЕМЕНИ" color="success" />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          {LIVE.map((m) => (
            <MatchCard key={m.tour} {...m} live />
          ))}
        </div>

        <div className="grid grid-cols-2 items-start gap-4">
          {/* «Ближайшие и текущие» — так зона и записана в данных: идущий
              турнир из блока выше должен быть и в списке, иначе на его
              страницу с главной не попасть. */}
          <Panel title="Ближайшие и текущие старты" flush>
            <div className="divide-y divide-neutral-100">
              <Row
                nm="Евразийская лига 2026"
                sub="Командный турнир · Астана · 12–20 мая"
                pill={{ t: 'ИДЁТ', cls: 'live' }}
              />
              <Row
                nm="Кубок Республики Казахстан 2026"
                sub="Главный старт · Астана · 18–20 мая"
                pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }}
              />
              <Row
                nm="ОРТ «Кубок Иртыша»"
                sub="ОРТ · Павлодар · 25 апреля"
                pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }}
              />
              <Row
                nm="Первенство РК · 2010 г.р. и моложе"
                sub="Главный старт · Алматы · 3–5 июня"
                pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }}
              />
            </div>
          </Panel>

          <Panel
            title="Лидеры рейтинга"
            /* Публичные таблицы целиком — в «Рейтингах»: игроки с фильтрами
               постранично до 500 строк и рейтинг судей (TZ §7.2). */
            extra={<span className="text-xs text-neutral-500">весь рейтинг — игроки и судьи</span>}
            flush
          >
            <div className="divide-y divide-neutral-100">
              <Row av={A(32)} nm="1 · Смагулов Алан" sub="Алматы · «Алатау»" val="2456" />
              <Row av={A(44)} nm="2 · Ким Георгий" sub="Астана · СКА" val="2401" />
              <Row av={A(13)} nm="3 · Пак Сергей" sub="Павлодар · «Иртыш»" val="2312" />
            </div>
          </Panel>
        </div>

        <Panel title="Новости" extra={<span className="text-xs text-neutral-500">на трёх языках</span>} flush>
          <div className="divide-y divide-neutral-100">
            <Row nm="Кубок Республики: приём заявок открыт" sub="12.04.2026 · RU · KZ" />
            <Row nm="Итоги открытия сезона 2026" sub="21.01.2026 · RU · KZ · EN" />
          </div>
        </Panel>
      </div>
    </Laptop>
  );
}

/* ── Э0.4 · Страница турнира (вторая половина публичной части) ──── */

/** Состав, сетка, расписание и результаты — четыре вкладки страницы турнира.
    Клубы и игроки — те же, что на главной: другого списка людей в публичной
    части не бывает. */
const CLUBS = [
  {
    nm: '«Алатау» · Алматы',
    sub: 'Смагулов Алан, Оралбек Диас, Байжанов Ерасыл, Нұрланұлы Алихан и ещё двое',
  },
  { nm: 'СКА · Астана', sub: 'Ким Георгий и ещё пятеро' },
  { nm: '«Жетісу» · Шымкент', sub: 'Ерлан Бекзат и ещё пятеро' },
  { nm: '«Иртыш» · Павлодар', sub: 'Пак Сергей и ещё пятеро' },
];

/** Круговой этап на четыре клуба — три тура. Первый сыгран, второй идёт прямо
    сейчас (его встречи и стоят в «Счёте в реальном времени»), третий впереди. */
const SCHED: { key: string; when: string; tables: string; pair: string; round: string; live?: boolean }[] = [
  { key: 's1', when: 'сегодня, 13:00', tables: 'столы 1–3', pair: '«Алатау» — СКА', round: '2-й тур', live: true },
  { key: 's2', when: 'сегодня, 13:00', tables: 'столы 4–6', pair: '«Жетісу» — «Иртыш»', round: '2-й тур', live: true },
  { key: 's3', when: '20 мая, 11:00', tables: 'столы 1–3', pair: '«Алатау» — «Иртыш»', round: '3-й тур' },
  { key: 's4', when: '20 мая, 11:00', tables: 'столы 4–6', pair: 'СКА — «Жетісу»', round: '3-й тур' },
];

/** Сыгранные личные встречи первого тура: «Алатау» — «Жетісу» и СКА —
    «Иртыш». Счёт по партиям сходится с итогом матча. */
const RESULTS: { key: string; pair: string; score: string; games: ReadonlyArray<readonly [number, number]> }[] = [
  { key: 'r1', pair: 'Смагулов Алан — Ерлан Бекзат', score: '3 : 1', games: [[11, 7], [9, 11], [11, 8], [11, 6]] },
  { key: 'r2', pair: 'Ким Георгий — Пак Сергей', score: '3 : 0', games: [[11, 5], [11, 9], [12, 10]] },
];

/** Сетка плей-офф: круговой этап расставляет клубы, дальше играют на вылет.
    Пары показаны по нынешнему положению и подписаны местами — после третьего
    тура клубы в них могут поменяться, и об этом сказано на самой панели. */
const PLAYOFF: { round: string; pairs: { key: string; a: string; b: string; note: string }[] }[] = [
  {
    round: '1/2 финала',
    pairs: [
      { key: 'p1', a: '«Алатау» · Алматы', b: '«Иртыш» · Павлодар', note: '1-е место — 4-е место' },
      { key: 'p2', a: 'СКА · Астана', b: '«Жетісу» · Шымкент', note: '2-е место — 3-е место' },
    ],
  },
  {
    round: 'Финал',
    pairs: [
      { key: 'p3', a: 'победитель первой пары', b: 'победитель второй пары', note: '20 мая, 17:00' },
    ],
  },
];

/** Публичная страница турнира — то, куда ведёт строка турнира с главной.

    Зона данных перечисляет шесть вещей: состав, сетка, расписание, результаты,
    счёт в реальном времени и трансляция. Первые четыре — вкладками, две
    последние стоят выше: на страницу идущего турнира приходят ради того, что
    происходит прямо сейчас, а не ради списка составов. */
export function Tournament0_4() {
  return (
    <Laptop>
      <SiteHead active="Календарь" />

      <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 p-6">
        <BackLink label="Календарь ФНТ РК" to="Э0.4" />
        <div className="mb-4 mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Евразийская лига 2026</h1>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Командный турнир · 4 клуба · Астана · 12–20 мая · круговой этап, 2-й тур из трёх
            </p>
          </div>
          <Pill t="ИДЁТ" color="success" />
        </div>

        <div className="grid grid-cols-[1fr_340px] items-start gap-4">
          <Panel title="Счёт в реальном времени" sub="обновляется сам — страницу перезагружать не нужно">
            <div className="flex flex-col gap-3">
              {LIVE.map((m) => (
                <MatchCard key={m.tour} {...m} live />
              ))}
            </div>
          </Panel>

          <Panel title="Трансляция" sub="смотреть можно без входа">
            <div className="relative grid aspect-video place-items-center rounded-lg bg-neutral-900">
              <span className="grid size-12 place-items-center rounded-full bg-white/90 text-neutral-900">
                <Play size={20} />
              </span>
              <span className="absolute left-3 top-3">
                <Pill t="В ЭФИРЕ" color="danger" />
              </span>
            </div>
            <div className="mt-3 text-[13px] font-medium">Смагулов Алан — Ким Георгий</div>
            <div className="mt-0.5 text-xs text-neutral-500">2-й тур · «Алатау» — СКА · стол 1</div>
          </Panel>
        </div>

        <PageTabs
          items={[
            {
              t: 'Состав',
              view: (
                <Panel title="Состав · 4 клуба, 24 игрока" flush>
                  <div className="divide-y divide-neutral-100">
                    {CLUBS.map((c) => (
                      <Row key={c.nm} nm={c.nm} sub={c.sub} val="6 игроков" />
                    ))}
                  </div>
                </Panel>
              ),
            },
            {
              t: 'Сетка',
              view: (
                <Panel
                  title="Сетка плей-офф"
                  sub="пары закрепятся после третьего тура: первый играет с четвёртым, второй с третьим"
                >
                  <div className="flex gap-6">
                    {PLAYOFF.map((col) => (
                      <div key={col.round} className="flex flex-1 flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                          {col.round}
                        </div>
                        <div className="flex flex-1 flex-col justify-around gap-4">
                          {col.pairs.map((p) => (
                            <div
                              key={p.key}
                              className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
                            >
                              <div className="border-b border-neutral-100 px-3 py-2 text-[13px] font-medium">
                                {p.a}
                              </div>
                              <div className="px-3 py-2 text-[13px] font-medium">{p.b}</div>
                              <div className="border-t border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500">
                                {p.note}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              ),
            },
            {
              t: 'Расписание',
              view: (
                <Panel title="Расписание" sub="время и столы; встречи второго тура идут прямо сейчас" flush>
                  <DataTable
                    cols={['Когда', 'Столы', 'Встреча', 'Тур']}
                    grid="150px 110px 1fr 180px"
                    rows={SCHED.map((s) => ({
                      key: s.key,
                      cells: [
                        s.when,
                        <span className="text-neutral-600">{s.tables}</span>,
                        <span className="font-medium">{s.pair}</span>,
                        s.live ? (
                          <span className="flex items-center gap-2">
                            {s.round} <Pill t="ИДЁТ" color="success" />
                          </span>
                        ) : (
                          <span className="text-neutral-600">{s.round}</span>
                        ),
                      ],
                    }))}
                  />
                </Panel>
              ),
            },
            {
              t: 'Результаты',
              view: (
                <Panel title="Результаты · первый тур сыгран" sub="показаны две личные встречи из шести" flush>
                  <DataTable
                    cols={['Тур', 'Матч', 'Счёт', 'Партии']}
                    grid="110px 1fr 70px 210px"
                    rows={RESULTS.map((r) => ({
                      key: r.key,
                      cells: [
                        <span className="text-neutral-600">1-й тур</span>,
                        <span className="font-medium">{r.pair}</span>,
                        <span className="font-semibold tabular-nums">{r.score}</span>,
                        <GameCells games={r.games} />,
                      ],
                    }))}
                  />
                </Panel>
              ),
            },
          ]}
        />
      </div>
    </Laptop>
  );
}

const Public0_4States = () => (
  <States>
    <Shot tone="info" title="Действие требует входа ✳" text="Заявка, счёт, правка — любое действие ведёт на экран входа.">
      <Frag>
        <Rows>
          <Row
            nm="Кубок Республики Казахстан 2026"
            sub="приём заявок до 10 мая"
            pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Чтобы подать заявку, нужно войти: смотреть можно всем, делать — только под своей ролью.
          </Bar>
          <Button variant="primary">
            <LogIn size={15} /> Войти и подать заявку
          </Button>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.9 — открыта ли публичная часть без входа"
      text="Подтвердить у федерации: мы исходим из того, что открыта."
    >
      <Frag>
        <Rows>
          <Row
            nm="Результаты, рейтинги, расписание"
            sub="наше допущение — видно всем"
            pill={{ t: 'БЕЗ ВХОДА', cls: 'live' }}
          />
          <Row
            nm="Персональные данные игроков"
            sub="что именно показываем в публичном профиле"
            pill={{ t: 'ВОПРОС', cls: 'bad' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.5 · Регистрация спортсмена ─────────────────────────────── */

export function SignUp0_5() {
  return (
    <AuthPage wide>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div>
          <div className="text-xl font-semibold tracking-tight">Регистрация спортсмена</div>
          {/* Региона и клуба в форме нет ✳: и то и другое указывается в профиле
              (Э14.7), принадлежность подтверждает сам клуб (Э13.2). */}
          <div className="mt-1 text-[12.5px] text-neutral-500">
            Форма короткая нарочно: регион и клуб укажете потом в профиле
          </div>
        </div>
      </div>

      <FormGrid>
        {/* По этим полям система ищет совпадение с уже заведённой записью. */}
        <SecCap>Кто вы</SecCap>
        <TextInput label="Фамилия" placeholder="Оралбек" />
        <TextInput label="Имя, отчество" placeholder="Диас Ерланович" />
        {/* Дата — поле с форматтером дд.мм.гггг ✳, а не календарь браузера:
            свою дату рождения набирают, а не ищут по месяцам. */}
        <TextInput label="Дата рождения" placeholder="дд.мм.гггг" />
        <PickField label="Пол" value="мужской" />
        <SecCap>Контакты и вход</SecCap>
        <TextInput label="Телефон" placeholder="+7 ___ ___ __ __" />
        <TextInput label="Почта" placeholder="имя@домен" />
        <TextInput label="Пароль" placeholder="не короче 8 знаков" wide />
        <Consent />
      </FormGrid>

      <Button variant="primary" className="mt-4 w-full">
        <UserPlus size={15} /> Зарегистрироваться
      </Button>

      {/* Что будет дальше — сказано до кнопки, а не в письме после (TZ §9.2). */}
      <div className="mt-4">
        <Bar>
          Профиль откроется сразу. До оплаты годового взноса заявки на турниры со взносом не
          проходят (TZ §9.2) — оплата в своём кабинете.
        </Bar>
      </div>
      <div className="flex justify-center">
        <ALink to="Э0.1">Уже есть аккаунт — войти</ALink>
      </div>
    </AuthPage>
  );
}

export const SignUp0_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Найден похожий человек ✳"
      text="Предложение связать с существующей записью, а не заводить второго."
    >
      <Frag>
        <Rows>
          <Row
            nm="Оралбек Диас · 2009 · Алматы"
            sub="завёл клуб «Алатау», 03.02.2026 · рейтинг 2042"
            pill={{ t: 'СОВПАДЕНИЕ', cls: 'wait' }}
          />
        </Rows>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline">Связать с этой записью</Button>
          <QuietAction>Это не я</QuietAction>
        </div>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Согласие не отмечено" text="Кнопка неактивна.">
      <Frag w={420}>
        <FormGrid>
          <Consent off sub="без него регистрация не проходит" />
        </FormGrid>
        <div className="mt-3">
          <DisabledAction>Зарегистрироваться</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.10 — чья запись, если человека уже завели"
      text="Как самостоятельная регистрация сходится с записью клуба или федерации — не решено."
      wide
    >
      <Frag>
        <Bar>
          Три пути в реестр: человек сам, клуб, федерация. Кто «владелец» записи и что происходит с
          рейтингом и историей при связывании — вопрос к федерации. Дубль молча не создаём.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.6 · Принятие приглашения ───────────────────────────────── */

/** Вторая половина приглашения: то, что видит человек, открыв ссылку.

    Аккаунт за человека не заводит никто — ни клуб (Э13.2), ни федерация
    (Э1.10). Они выпускают одноразовую ссылку, а пароль человек задаёт себе
    здесь: система его не знает и не хранит, и пересылать его в мессенджере
    некому. До этого шага учётной записи нет — есть только карточка со
    значком «приглашён».

    Данные показаны на чтение, а не полями: их заполнил тот, кто приглашает, и
    правка тут превратила бы приглашение во вторую форму регистрации. Если
    данные чужие — «это не я», и ссылка гаснет. */
export function Accept0_6() {
  return (
    <AuthPage wide>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div>
          <div className="text-xl font-semibold tracking-tight">
            Клуб «Алатау» приглашает вас в систему ФНТ РК
          </div>
          <div className="mt-1 text-[12.5px] text-neutral-500">
            Пригласил Досжан Мади · администратор клуба
          </div>
        </div>
      </div>

      <Panel title="Что о вас указал клуб">
        <FormGrid>
          <FieldView label="Фамилия, имя" value="Нұрланұлы Алихан" />
          <FieldView label="Дата рождения" value="14.05.2011" />
          <FieldView label="Разряд" value="2 разряд" />
          <FieldView label="Клуб" value="«Алатау» · г. Алматы" />
        </FormGrid>
      </Panel>

      {/* Пароль — единственное поле ввода на экране: всё остальное уже
          заполнено за человека, и придумывать себе он должен только доступ. */}
      <FormGrid>
        <TextInput label="Придумайте пароль" placeholder="не короче 8 знаков" wide />
        <Consent />
      </FormGrid>

      <Button variant="primary" className="mt-4 w-full">
        <LogIn size={15} /> Принять приглашение и войти
      </Button>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Ссылка одноразовая и действует до 22.04.2026</span>
        <ALink muted>Это не я</ALink>
      </div>
    </AuthPage>
  );
}

export const Accept0_6States = () => (
  <States>
    <Shot tone="success" title="Приняли — человек в системе" text="Аккаунт появился в этот момент, а не когда его приглашали.">
      <Frag>
        <Rows>
          <Row
            nm="Нұрланұлы Алихан"
            sub="принял приглашение 16.04 · пароль задан им самим"
            pill={{ t: 'В КЛУБЕ', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">Клуб видит только факт принятия. Пароля он не знает и сменить его не может.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Срок ссылки вышел ✳" text="Семь дней прошли: войти по ней нельзя, нужна новая.">
      <Frag>
        <Bar tone="danger">
          Ссылка выпущена 02.04.2026, срок вышел 09.04.2026. Попросите пригласившего выпустить
          новую — старая не работает даже у того, кто её открыл.
        </Bar>
        <DisabledAction>Принять приглашение и войти</DisabledAction>
      </Frag>
    </Shot>

    <Shot tone="warning" title="Ссылкой уже воспользовались ✳" text="Одноразовая: второй раз по ней не входят.">
      <Frag>
        <Rows>
          <Row
            nm="Приглашение принято 12.04"
            sub="дальше — обычный вход по телефону или почте"
            pill={{ t: 'ИСПОЛЬЗОВАНА', cls: 'done' }}
          />
        </Rows>
        <div className="mt-3">
          <Button variant="primary" data-to="Э0.1">
            <LogIn size={15} /> Войти
          </Button>
        </div>
      </Frag>
    </Shot>

    <Shot tone="warning" title="«Это не я» ✳" text="Ссылка гаснет, пригласившему уходит уведомление — данные чужие.">
      <Frag>
        <Rows>
          <Row
            nm="Приглашение отклонено"
            sub="уведомление ушло клубу «Алатау» · 16.04"
            pill={{ t: 'ОТКЛОНЕНО', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Так ловятся ошибки в контакте: письмо ушло не тому человеку, и он говорит об этом сам,
            а не молча заводит себе чужую карточку.
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.7 · Регистрация судьи ✳ ────────────────────────────────── */

/** Судья заводит себя сам — как спортсмен (Э0.5), но категорию себе не ставит.

    Так записано в нашем предположении о том, как люди попадают в систему
    (QUESTIONS 9.1): «судьи — аккаунт заводят сами, но роль и категорию
    присваивает коллегия/федерация по удостоверению». До этого экрана судей
    заводила только федерация приглашением (Э1.10), и реестр судей наполнялся
    вручную — а председателю ГСК некого было назначать, кроме тех, кого успели
    завести.

    Форма — только то, без чего аккаунта не завести: имя, дата рождения,
    контакты и пароль. Ровно как у спортсмена (Э0.5), и по той же причине: на
    входе человек заполняет минимум, остальное система узнаёт позже.

    - **Категории в форме нет вовсе.** Ни селектора, ни загрузки удостоверения:
      селектор отдал бы «высшую национальную» любому, кто её выбрал, а файл на
      входе — лишний шаг, когда документа может не быть под рукой. Категорию
      проставляет коллегия по документу, а сам документ судья загружает у себя в
      кабинете — там же, где документы на S3 и S4 (Э6.10, Э9.5), и по тому же
      правилу (TZ §7.2).
    - **Региона в форме тоже нет.** Он нужен для коэффициента 1,5 за выезд
      (§7.2), но выясняется не на входе: как и у спортсмена, регион указывается
      в профиле — до первого судейства время есть.

    Окраска своя (янтарная полоса и значок): формы спортсмена и судьи похожи
    как две капли, а заголовок читают уже после того, как начали заполнять.
    Вход не окрашивается — он один на всех (QUESTIONS 9.5).

    ⚠ 9.2 — сам ли регистрируется судья, федерация не ответила. Экран стоит на
    нашем предположении, и это написано прямо на нём. */
export function SignUpJudge0_7() {
  return (
    <AuthPage wide judge>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div className="flex flex-col items-center gap-1.5">
          <Chip color="warning" size="sm" variant="soft">
            <Gavel size={12} className="mr-1 inline" /> СУДЕЙСКАЯ КОЛЛЕГИЯ
          </Chip>
          <div className="text-xl font-semibold tracking-tight">Регистрация судьи</div>
          <div className="text-[12.5px] text-neutral-500">
            Аккаунт вы заводите сами · категорию проставляет коллегия по удостоверению
          </div>
        </div>
      </div>

      <FormGrid>
        <SecCap>Кто вы</SecCap>
        <TextInput label="Фамилия" placeholder="Оралбай" />
        <TextInput label="Имя, отчество" placeholder="Ержан Маратович" />
        <TextInput label="Дата рождения" placeholder="дд.мм.гггг" />
        <SecCap>Контакты и вход</SecCap>
        <TextInput label="Телефон" placeholder="+7 ___ ___ __ __" />
        <TextInput label="Почта" placeholder="имя@домен" />
        <TextInput label="Пароль" placeholder="не короче 8 знаков" wide />
        <Consent />
      </FormGrid>

      <Button variant="primary" className="mt-4 w-full">
        <Gavel size={15} /> Зарегистрироваться судьёй
      </Button>

      {/* Чего в форме нет и что дальше — сказано на самой форме: судья не
          должен искать, почему у него не спросили категорию. */}
      <div className="mt-4">
        <Bar tone="warning">
          Категории и региона в форме нет: категорию проставит коллегия по удостоверению (Э5.6) —
          документ загрузите потом в своём кабинете, регион — в профиле. До подтверждения запись в
          реестре стоит с пометкой «ждёт подтверждения»: S2 не начисляется, в наряд не назначают.
        </Bar>
      </div>
      <div className="flex justify-center">
        <ALink to="Э0.1">Уже есть аккаунт — войти</ALink>
      </div>
    </AuthPage>
  );
}

export const SignUpJudge0_7States = () => (
  <States>
    <Shot
      tone="warning"
      title="Сразу после регистрации — без категории ✳"
      text="Аккаунт создаётся, но в реестре судья стоит без категории: S2 не начисляется и в наряд его не назначают, пока коллегия не увидит удостоверение."
      wide
    >
      <Frag>
        <Rows>
          <Row
            nm="Оралбай Ержан · Павлодар"
            sub="регистрация 18.08 · удостоверение ещё не загружено"
            pill={{ t: 'БЕЗ КАТЕГОРИИ', cls: 'wait' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Документ судья загружает у себя в кабинете, там же, где документы на S3 и S4 — форму
            регистрации им не нагружаем: удостоверения может не быть под рукой, а вход в систему
            из-за этого откладывать незачем. Категорию с его слов при этом не ставят: от неё зависят
            баллы и назначения.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Найден похожий человек ✳"
      text="То же правило, что при регистрации спортсмена: связываем с существующей записью, а не заводим вторую."
    >
      <Frag>
        <Rows>
          <Row
            nm="Оралбай Ержан · 1988 · Павлодар"
            sub="в реестре судей с 12.01.2024 · судья первой категории"
            pill={{ t: 'СОВПАДЕНИЕ', cls: 'wait' }}
          />
        </Rows>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline">Связать с этой записью</Button>
          <QuietAction>Это не я</QuietAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Он уже в системе спортсменом ✳"
      text="Один человек — один аккаунт (QUESTIONS 9.5): судейская роль добавляется к существующему, второй регистрации нет."
    >
      <Frag>
        <Rows>
          <Row
            nm="Байжанов Ерасыл"
            sub="спортсмен клуба «Алатау» · просит роль судьи"
            pill={{ t: 'РОЛЬ ДОБАВЛЯЕТСЯ', cls: 'reg' }}
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="⚠ 9.2 — сам ли регистрируется судья"
      text="Экран стоит на нашем предположении, а не на ответе федерации."
      wide
    >
      <Frag>
        <Bar>
          Судья — это квалификация с категорией и оценкой (TZ §7.2). Мы исходим из того, что аккаунт
          он заводит сам, а категорию и роль присваивает коллегия по удостоверению (QUESTIONS 9.1).
          Если федерация скажет «судей заводит только федерация» — экран убирается, и остаётся
          приглашение (Э1.10), а реестр наполняется вручную.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд сквозных экранов ─────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => (
      <>
        <Login0_1 />
        <Also cap="Следующий шаг, если ролей несколько ✳">
          <Context0_1 />
        </Also>
        <Also cap="Меню профиля в шапке ✳ — откуда сюда выходят">
          <ProfileMenu0_1 />
        </Also>
        <Login0_1States />
      </>
    ),
    next: 'имя и фото в шапке',
  },
  'Э0.5': {
    cap: 'Регистрация спортсмена',
    view: () => (
      <>
        <SignUp0_5 />
        <SignUp0_5States />
      </>
    ),
    next: 'регистрация судьи ✳',
  },
  'Э0.7': {
    cap: 'Регистрация судьи',
    view: () => (
      <>
        <SignUpJudge0_7 />
        <SignUpJudge0_7States />
      </>
    ),
    next: 'ссылка приглашения',
  },
  'Э0.6': {
    cap: 'Принятие приглашения',
    view: () => (
      <>
        <Accept0_6 />
        <Accept0_6States />
      </>
    ),
    next: 'свой профиль',
  },
  'Э0.2': {
    cap: 'Свой профиль',
    view: () => (
      <>
        <Profile0_2 />
        <Profile0_2States />
      </>
    ),
    next: 'счётчик в шапке',
  },
  'Э0.3': {
    cap: 'Уведомления',
    view: () => (
      <>
        <Notif0_3 />
        <Also cap="Лента последних — под колокольчиком ✳">
          <BellFeed0_3 />
        </Also>
        <Notif0_3States />
      </>
    ),
    next: 'выход — обратно на сайт',
  },
  'Э0.4': {
    cap: 'Публичные страницы',
    view: () => (
      <>
        <Public0_4 />
        <Also cap="Страница турнира — куда ведёт строка турнира">
          <Tournament0_4 />
        </Also>
        <Public0_4States />
      </>
    ),
  },
};

export function Role00Board() {
  return <Board role={R00} screens={SCREENS} />;
}
