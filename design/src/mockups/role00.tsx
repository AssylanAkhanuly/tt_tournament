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
  ArrowRight, BarChart3, Bell, CalendarDays, Check, CheckCheck, ChevronDown, ChevronsUpDown, Gavel, History,
  LayoutDashboard, LogIn, LogOut, Newspaper, Play, Radio, RefreshCw, Scroll, ServerOff,
  ShieldCheck, Smartphone, Trophy, UserCog, UserPlus,
} from 'lucide-react';
import { Avatar, Button, Chip, InputOTP, REGEXP_ONLY_DIGITS } from '@heroui/react';
import {
  A, AW, BackLink, Bar, DataTable, DisabledAction, EmptyBox, Facts, FieldView, FormGrid,
  GameCells, Laptop, MatchCard, PageTabs, Panel, Phone, PhoneRoleApp, PickField, Pill, QuietAction,
  Row, Rows, ScreenScope, Separator, TextInput, WebApp,
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

/* ── Вход по ИИН и одноразовому коду ✳ (30.08.2026) ─────────────
   Решение владельца продукта: аутентификация идёт через **Smart Bridge** —
   человек вводит ИИН, подтверждает вход одноразовым кодом из SMS. Пароля в
   системе нет вовсе: его нечего задавать, менять, забывать и подбирать.
   Отсюда и весь набор ниже — поле ИИН и поле кода. Шкалы шагов нет ✳
   (31.08.2026, решение владельца продукта): полоса «1 ИИН — 2 код» убрана
   отовсюду, где стояла. */

/** Номер, на который уходит код, — всегда в маске: он привязан к ИИН и
    приходит вместе с ним, показывать его целиком до входа нельзя. */
const OTP_PHONE = '+7 7•• ••• 45 90';

/** ИИН для макетов: 12 цифр, первые шесть — дата рождения (Абаева Д.,
    14.03.1987). Числа на всех кадрах сходятся — это тот же человек, что в
    шапке и в профиле (Э0.2). */
const IIN_DEMO = '870314400123';


/** Поле ИИН — двенадцать цифр, набранных с документа.

    Не `TextInput` кита: ИИН набирают вслепую, сверяясь с удостоверением, и
    поэтому здесь крупный моноширинный кегль с разрядкой, счётчик «сколько из
    двенадцати» и подпись, что это за номер. Всё, кроме цифр, поле отбрасывает
    на вводе — пробелы и дефисы из скопированной строки не должны ронять форму.

    Поле управляемое, когда сверху передан `onChange` (так работает вход: по
    длине включается «Продолжить»), и живёт своим состоянием на полках
    состояний, где кадр статичен. */
function IinField({
  value = '',
  onChange,
  bad,
  note,
}: {
  value?: string;
  onChange?: (v: string) => void;
  /** Поле не проходит проверку: 12 цифр не набраны или ИИН не найден. */
  bad?: boolean;
  /** Подпись под полем: подсказка или текст ошибки. */
  note?: string;
}) {
  const [own, setOwn] = useState(value);
  const v = onChange ? value : own;
  const set = (next: string) => {
    const digits = next.replace(/\D/g, '').slice(0, 12);
    if (onChange) onChange(digits);
    else setOwn(digits);
  };
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-neutral-500">ИИН</span>
        <span className={'text-[11px] tabular-nums ' + (bad ? 'text-red-600' : 'text-neutral-400')}>
          {v.length} из 12
        </span>
      </span>
      <input
        aria-label="ИИН — индивидуальный идентификационный номер"
        inputMode="numeric"
        maxLength={12}
        placeholder="000000000000"
        className={
          'w-full rounded-lg border bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.28em] outline-none placeholder:text-neutral-300 focus:border-blue-500 ' +
          (bad ? 'border-red-400' : 'border-neutral-300')
        }
        value={v}
        onChange={(e) => set(e.target.value)}
      />
      {/* Подпись под полем — только когда это ошибка ✳ (01.09.2026): «что такое
          ИИН» человек знает и без нас, а счётчик «9 из 12» справа отвечает на
          единственный вопрос, который у поля бывает. */}
      {bad && note && <span className="text-xs leading-snug text-red-600">{note}</span>}
    </label>
  );
}

/** Шаг «код»: шесть цифр из SMS.

    Поле — `InputOTP` из HeroUI (композиционный: Group + Slot + Separator): он
    не портал, и на борде, где стоит полтора десятка экранов разом, ничего не
    накрывает.

    Обратный отсчёт нарисован числом, а не тикает: борд снимается скриншотом, и
    живой таймер давал бы каждый раз другой кадр. Состояние «отсчёт кончился,
    кнопка ожила» показано отдельным кадром на полке состояний. */
function CodeStep({
  value = '482913',
  bad,
  err,
  resend,
}: {
  value?: string;
  /** Код введён неверно: ячейки краснеют, набранное не стирается. */
  bad?: boolean;
  err?: string;
  /** Отсчёт кончился — «отправить снова» стало кнопкой. */
  resend?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5">
      <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3.5 py-2 text-[12.5px] text-neutral-700">
        <Smartphone size={14} className="shrink-0 text-neutral-500" />
        Код отправлен SMS на <b className="font-semibold tabular-nums">{OTP_PHONE}</b>
      </div>
      <InputOTP
        aria-label="Код подтверждения из SMS"
        /* Пустое поле выражается отсутствием значения, а не пустой строкой —
           так же, как в справочнике HeroUI (история «02 · Ввод»). */
        defaultValue={value || undefined}
        isInvalid={bad}
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
      >
        <InputOTP.Group>
          <InputOTP.Slot index={0} />
          <InputOTP.Slot index={1} />
          <InputOTP.Slot index={2} />
        </InputOTP.Group>
        <InputOTP.Separator />
        <InputOTP.Group>
          <InputOTP.Slot index={3} />
          <InputOTP.Slot index={4} />
          <InputOTP.Slot index={5} />
        </InputOTP.Group>
      </InputOTP>
      {err && <div className="text-center text-xs leading-snug text-red-600">{err}</div>}
      {resend ? (
        <button type="button" className="text-[12.5px] font-semibold text-blue-600 hover:underline">
          <RefreshCw size={13} className="mr-1 inline" /> Отправить код снова
        </button>
      ) : (
        <span className="text-[12.5px] text-neutral-500">
          Отправить код снова — через{' '}
          <b className="font-semibold tabular-nums text-neutral-700">0:47</b>
        </span>
      )}
    </div>
  );
}

/** Блок «из государственной базы»: ФИО, дата рождения и пол пришли по ИИН
    через Smart Bridge и здесь не правятся — в этом весь смысл интеграции.
    Показаны `FieldView`, потому что это значения, а не поля ввода. */
const FromState = ({
  fio,
  born,
  sex,
  iin = IIN_DEMO,
  one,
}: {
  fio: string;
  born: string;
  sex: string;
  iin?: string;
  /** Телефон ✳ (30.08.2026): поля в одну колонку и подпись панели короче. На
      392 px две колонки дают по 150 px — ни ФИО, ни дата в них не помещаются,
      а длинная подпись уезжает в три строки и отжимает значок Smart Bridge. */
  one?: boolean;
}) => (
  <Panel
    title="Из государственной базы по ИИН"
    sub={
      one
        ? 'Пришли через Smart Bridge — здесь не правятся'
        : 'ФИО, дата рождения и пол пришли через Smart Bridge — здесь они не правятся'
    }
    extra={
      <Chip color="success" size="sm" variant="soft">
        <ShieldCheck size={12} className="mr-1 inline" /> SMART BRIDGE
      </Chip>
    }
  >
    <FormGrid>
      <FieldView label="Фамилия, имя, отчество" value={fio} wide />
      <FieldView label="Дата рождения" value={born} wide={one} />
      <FieldView label="Пол" value={sex} wide={one} />
      <FieldView label="ИИН" value={iin} wide />
    </FormGrid>
  </Panel>
);

/** Согласие — обязательная отметка отдельной строкой, а не мелким текстом
    (решение из флоу Э0.5). Их теперь два ✳ (30.08.2026): к обработке данных
    добавилось согласие на запрос сведений из государственной базы — система
    тянет ФИО и дату рождения по чужому номеру, и спросить об этом обязана.
    Checkbox из @heroui/react в макетах не разрешён — нативная отметка. */
const Consent = ({ t, off, sub }: { t?: string; off?: boolean; sub?: string }) => (
  <label className="col-span-2 mt-1 flex items-start gap-2.5">
    <input type="checkbox" defaultChecked={!off} className="mt-0.5 size-4 shrink-0 accent-blue-600" />
    <span className="text-[12.5px] leading-snug text-neutral-700">
      {t ?? 'Согласие на обработку персональных данных'} ✳
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

/** Подпись в подвале титульных страниц — одна на оба формата. */
const AUTH_FOOT = 'Федерация настольного тенниса Республики Казахстан · цифровая платформа турниров';

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
      <div className="relative shrink-0 pb-5 text-center text-xs text-blue-200/80">{AUTH_FOOT}</div>
    </div>
  </Laptop>
);

/* ── Э0.1 · Вход ───────────────────────────────────────────────── */

/** Вход — два шага на одном экране ✳ (30.08.2026): ИИН → одноразовый код.

    Шаги переключаются по-настоящему, внутренним состоянием: это один экран в
    двух состояниях, а не два макета рядом. Пока не набраны все двенадцать
    цифр, «Продолжить» не нажимается — по ИИН система идёт в Smart Bridge, и
    ходить туда с недобранным номером незачем.

    «Забыли пароль» с экрана убрана: пароля в системе нет, восстанавливать
    нечего. Вместе с ней ушли и все состояния про подбор пароля. */
export function Login0_1() {
  const [step, setStep] = useState<1 | 2>(1);
  const [iin, setIin] = useState(IIN_DEMO);
  const ready = iin.length === 12;
  return (
    <AuthPage>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div>
          <div className="text-xl font-semibold tracking-tight">Вход в систему</div>
          <div className="mt-1 text-[12.5px] text-neutral-500">
            {step === 1
              ? 'По ИИН через Smart Bridge · пароля в системе нет'
              : 'Подтвердите вход кодом из SMS'}
          </div>
        </div>
      </div>

      {step === 1 ? (
        <>
          <IinField value={iin} onChange={setIin} />
          <Button
            className="mt-4 w-full"
            isDisabled={!ready}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      ) : (
        <>
          <CodeStep />
          <Button className="mt-4 w-full" variant="primary">
            <LogIn size={15} /> Войти
          </Button>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              className="text-[12.5px] font-semibold text-neutral-500 hover:underline"
              onClick={() => setStep(1)}
            >
              Ввести другой ИИН
            </button>
          </div>
        </>
      )}

      <div className="mt-4 flex justify-center">
        <Langs />
      </div>

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

/** Роль и человек в боковом меню ✳ (31.08.2026) — то место, откуда из системы
    выходят и где меняют рабочее место.

    Раньше это была одна кнопка справа в шапке: имя, фото, роль и переключение
    ролей — всё одним выпадающим меню. «Кто я» и «в какой роли я работаю»
    оказались одним вопросом, а они разные: у человека с двумя ролями смена
    рабочего места была спрятана за кликом по собственному фото. Теперь сверху
    меню роль, снизу человек.

    В ките (`chrome.tsx`) обе карточки закрыты по умолчанию, и на макете от них
    видно только строки: решения зон — «переключиться» и «выйти» — не показаны
    нигде. Врезка показывает обе раскрытыми.

    Выход живёт в карточке человека, а не отдельной кнопкой: система именная,
    каждое действие пишется в журнал с автором (TZ §12). Одним кликом по имени
    из системы не выходят — первый клик открывает меню, выход второй; сам
    «Выйти» отбит линией и краснеет под курсором, потому что необратим. */
const ProfileMenu0_1 = () => (
  <Frag w={560}>
    <div className="flex gap-4">
      {/* Боковое меню целиком: карточка роли сверху, разделы, человек снизу. */}
      <div className="flex w-[240px] shrink-0 flex-col rounded-xl border border-neutral-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-[12px] font-bold text-white">
            1
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[12.5px] font-semibold">Администратор Федерации</span>
            <span className="block truncate text-[11px] text-neutral-500">и ещё 1 роль</span>
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-neutral-400" />
        </div>

        {/* Раскрытый список ролей: галочка у текущей, у остальных — «перейти». */}
        <div className="mt-1.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Работать как
          </div>
          {(R00.roles ?? []).map((r, i) => {
            const t = typeof r === 'string' ? r : r.t;
            return (
              <div
                key={t}
                className={
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ' +
                  (i === 0 ? 'font-medium text-neutral-900' : 'text-neutral-700')
                }
              >
                <span className="w-4">{i === 0 && <Check size={14} className="text-blue-600" />}</span>
                <span className="min-w-0 flex-1 truncate">{t}</span>
                {i !== 0 && <span className="text-[11px] text-neutral-400">перейти</span>}
              </div>
            );
          })}
        </div>

        <div className="px-2 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Разделы
        </div>
        <div className="space-y-1 px-2 text-[13px] text-neutral-400">
          <div>Календарь</div>
          <div>Пользователи</div>
          <div>Новости</div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2">
          <Avatar size="sm">
            <Avatar.Image alt="Абаева Д." src={AW(44)} />
            <Avatar.Fallback>А</Avatar.Fallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[12.5px] font-semibold">Абаева Д.</span>
            <span className="block truncate text-[11px] text-neutral-500">d.abaeva@ttfrk.kz</span>
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-neutral-400" />
        </div>
      </div>

      {/* Меню карточки человека: открывается вверх, над самой карточкой. */}
      <div className="flex min-w-0 flex-1 flex-col justify-end">
        <div className="rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          <div className="px-2 pb-1 pt-1 text-[11px] uppercase tracking-wider text-neutral-400">
            Вы вошли как
          </div>
          <div className="px-2 pb-1.5 leading-tight">
            <div className="text-[12.5px] font-semibold">Абаева Динара Ерлановна</div>
            <div className="text-[11px] text-neutral-500">d.abaeva@ttfrk.kz</div>
          </div>
          <Separator className="my-1" />
          <button
            type="button"
            data-to="Э0.2"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-neutral-700 hover:bg-neutral-50"
          >
            <UserCog size={14} /> Мой профиль
          </button>
          <Separator className="my-1" />
          {/* Нарисован под курсором: «Выйти» отбит линией и краснеет. */}
          <button
            type="button"
            data-to="Э0.1"
            className="flex w-full items-center gap-2 rounded-lg bg-red-50 px-2 py-1.5 text-left text-[12.5px] font-medium text-red-600"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
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

/** Тот же вход в приложении: спортсмен — единственная роль с ним (TZ §10).

    Шаги те же и переключаются так же — вход один на сайт и приложение, и
    расходиться им нельзя. На телефоне у сценария есть даже преимущество: SMS
    с кодом приходит на то же устройство, с которого входят. */
export function LoginPhone0_1() {
  const [step, setStep] = useState<1 | 2>(1);
  const [iin, setIin] = useState(IIN_DEMO);
  return (
    <Phone>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-6 pb-6">
        <div className="mb-1 flex justify-center">
          <Brand size="lg" />
        </div>
        <div className="text-center text-xl font-bold tracking-tight">Вход</div>
        <p className="text-center text-[12.5px] leading-relaxed text-neutral-500">
          {step === 1
            ? 'По ИИН через Smart Bridge — тот же вход, что на сайте'
            : 'Код из SMS · приложение и сайт — одна учётная запись'}
        </p>

        {step === 1 ? (
          <>
            <IinField value={iin} onChange={setIin} />
            <Button
              className="mt-1 w-full"
              isDisabled={iin.length !== 12}
              variant="primary"
              onPress={() => setStep(2)}
            >
              Продолжить <ArrowRight size={15} />
            </Button>
          </>
        ) : (
          <>
            <CodeStep />
            <Button className="mt-1 w-full" variant="primary">
              <LogIn size={15} /> Войти
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-[12.5px] font-semibold text-neutral-500 hover:underline"
                onClick={() => setStep(1)}
              >
                Ввести другой ИИН
              </button>
            </div>
          </>
        )}
      </div>
    </Phone>
  );
}

/** Состояния входа переписаны под ИИН и код ✳ (30.08.2026).

    Старых парольных состояний здесь больше нет: «неверный логин или пароль»,
    «много неудачных попыток подряд» и «аккаунт не активирован» описывали
    схему, которой нет. Вместо них — то, что действительно может пойти не так
    на двух шагах: ИИН не набран или не найден, код не пришёл или неверен,
    срок кода вышел, попыток слишком много, Smart Bridge не отвечает. */
const Login0_1States = () => (
  <States>
    <Shot
      tone="danger"
      title="ИИН набран не полностью"
      text="«Продолжить» не нажимается: с недобранным номером в Smart Bridge ходить незачем."
    >
      <Frag w={420}>
        <IinField bad note="Нужны все 12 цифр — набрано 9" value="870314400" />
        <div className="mt-3">
          <DisabledAction>Продолжить</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="ИИН не найден"
      text="Smart Bridge ответил, что такого номера нет: цифры набраны, но не те."
    >
      <Frag w={420}>
        <IinField
          bad
          note="Такого ИИН в государственной базе нет. Проверьте цифры по удостоверению личности"
          value="870314400124"
        />
        <div className="mt-3">
          <DisabledAction>Продолжить</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Код неверный или не пришёл"
      text="Ячейки краснеют, набранное не стирается; рядом — «отправить снова», отсчёт уже кончился."
    >
      <Frag w={420}>
        <CodeStep
          bad
          resend
          err="Код не совпал. Проверьте последнюю SMS: коды из старых сообщений уже не работают"
          value="482910"
        />
        <div className="mt-3">
          <Bar>
            SMS не пришла — код отправляют заново на тот же номер. Другого номера у входа нет: он
            привязан к ИИН, а не выбирается на экране.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Срок кода вышел"
      text="Код одноразовый и живёт недолго; поле пустеет, вход начинается с нового кода."
    >
      <Frag w={420}>
        <CodeStep resend err="Срок кода вышел — запросите новый" value="" />
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Сколько именно живёт код — не решено: числа задаёт федерация вместе с оператором
            Smart Bridge, мы их не придумываем.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Слишком много попыток"
      text="Ввод кода закрывается на время; аккаунт при этом не блокируется — разблокировать некому."
      wide
    >
      <Frag>
        <Rows>
          <Row
            nm="Ввод кода закрыт ненадолго"
            sub="следующая попытка позже · администратор не нужен, ограничение снимается само"
            pill={{ t: 'ЖДЁМ', cls: 'wait' }}
          />
          <Row
            nm="Владельцу номера ушло уведомление"
            sub="кодом пробуют войти в чужой аккаунт — человек узнаёт об этом первым"
            pill={{ t: 'УВЕДОМЛЕН', cls: 'reg' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Сколько попыток и сколько ждать — не решено. Схема «без ручной разблокировки» задана
            федерацией (замечание 09.2026) и остаётся в силе: она не зависела от пароля.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Smart Bridge не отвечает"
      text="Вход невозможен целиком: своей проверки у системы нет, и подменить её нечем."
      wide
    >
      <Frag>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
          <ServerOff size={20} className="mt-0.5 shrink-0 text-red-600" />
          <div className="leading-snug">
            <div className="text-sm font-semibold text-red-900">
              Государственный сервис Smart Bridge временно недоступен
            </div>
            <div className="mt-1 text-[12.5px] text-red-900">
              Войти сейчас нельзя — ни по ИИН, ни как-то ещё: пароля в системе нет. Попробуйте
              через несколько минут. Публичная часть (Э0.4) при этом работает: результаты, счёт и
              расписание видны без входа.
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <QuietAction to="Э0.4">Смотреть без входа</QuietAction>
          <DisabledAction>Продолжить</DisabledAction>
        </div>
        <div className="mt-3">
          <Bar tone="warning">
            Это цена решения: единственный вход завязан на чужой сервис. Судье за столом в этот
            момент нужен уже открытый сеанс — счёт он ведёт и без сети (TZ §6), но войти заново не
            сможет.
          </Bar>
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
  </States>
);

/* ── Э0.2 · Свой профиль ───────────────────────────────────────── */

/** Шапка профиля: фото, ФИО и роль, в которой человек сейчас работает.
    Общая на веб и телефон ✳ (30.08.2026): два кадра одного экрана не имеют
    права показывать разного человека. */
const ProfileHead0_2 = () => (
  <div className="flex items-center gap-3.5">
    <Avatar size="lg">
      <Avatar.Image alt="Абаева Динара Ерлановна" src={AW(44)} />
      <Avatar.Fallback>А</Avatar.Fallback>
    </Avatar>
    <div className="min-w-0 leading-tight">
      <div className="text-[15px] font-semibold">Абаева Динара Ерлановна</div>
      {/* Какая роль сейчас — подписью под именем; переключается она в
          меню профиля в шапке, там же, где написана. */}
      <div className="mt-0.5 text-xs text-neutral-500">
        Администратор Федерации · система · бессрочно
      </div>
    </div>
  </div>
);

/** Строки панели «Вход»: чем человек входит, куда придёт код и как закрыть
    чужой сеанс. Данные общие на оба формата — список один. */
const LOGIN_ROWS0_2: {
  nm: string;
  sub: string;
  pill?: { t: string; cls: 'done' | 'reg' };
  action?: string;
}[] = [
  {
    nm: 'ИИН · •••• •••• 0123',
    sub: 'вход через Smart Bridge — государственный сервис проверяет, что это вы',
    pill: { t: 'НЕ МЕНЯЕТСЯ', cls: 'done' },
  },
  {
    nm: `Номер для кода · ${OTP_PHONE}`,
    sub: 'сюда приходит одноразовый код при каждом входе · номер привязан к ИИН, а не к профилю',
    pill: { t: 'ИЗ БАЗЫ', cls: 'reg' },
  },
  {
    nm: 'Выйти на всех устройствах',
    sub: 'закрывает все сеансы, кроме текущего: телефон остался в зале — вход по нему больше не работает',
    action: 'Выйти везде',
  },
];

/** Открытый вопрос про номер — текст один на оба формата. */
const PROFILE_WARN0_2 =
  '⚠ Совпадает ли номер для кода с контактным телефоном выше и что делать, если человек сменил ' +
  'сим-карту, — не решено: номер живёт в государственной базе, а не у нас, и менять его в профиле ' +
  'мы не можем.';

export function Profile0_2() {
  return (
    <WebApp
      role={R00}
      nav="Профиль"
      title="Мой профиль"
      sub="Контакты, язык интерфейса и вход"
      /* Возврат к работе ✳: на профиль и уведомления приходят из шапки, а не
         из меню, — и обратно из них не вело ничего. Пункта в сайдбаре у них
         нет по устройству (входы в шапке), так что выйти можно было только
         кнопкой браузера. Экран сквозной: возвращает на первый экран роли, под
         которой человек работает; в макете это панель Федерации. */
      back={{ label: 'К работе', to: 'Э1.1' }}
    >
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две
          колонки узкая нижняя панель висела в пустоте рядом со сжатым
          «Профилем». Панель сама держит отступ снизу, обёртка не нужна. */}
      <>
        <Panel title="Профиль">
          <div className="mb-4">
            <ProfileHead0_2 />
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

        {/* Панель «Безопасность» со «Сменить пароль» здесь стояла до 30.08.2026
            и больше смысла не имеет: пароля в системе нет — менять нечего.

            Что встало вместо неё. Панель отвечает на три вопроса, которые у
            человека действительно есть: чем я вхожу, куда придёт код и как
            закрыть чужой сеанс.
            - **ИИН** — маскированный, последние четыре цифры. Он не меняется и
              не редактируется: это идентификатор в государственной базе, а не
              наше поле. Показан, чтобы человек видел, под каким номером он в
              системе, — с двумя ИИН в семье это не праздный вопрос.
            - **Номер для кода** — тоже на чтение и тоже в маске: он привязан к
              ИИН на стороне государства, и «сменить номер» здесь было бы
              обманом — мы этого не умеем.
            - **«Выйти на всех устройствах»** — единственное настоящее действие
              панели и замена «сменить пароль» по смыслу: раньше человек менял
              пароль, чтобы выгнать чужого, теперь — закрывает сеансы. Стоит
              последней строкой, ниже двух неизменяемых: остальное здесь читают,
              а нажимают только это. */}
        <Panel title="Вход" sub="Пароля в системе нет: вход по ИИН и одноразовому коду ✳" flush>
          <div className="divide-y divide-neutral-100">
            {LOGIN_ROWS0_2.map((r) => (
              <Row key={r.nm} action={r.action} nm={r.nm} pill={r.pill} sub={r.sub} />
            ))}
          </div>
        </Panel>

        <Bar tone="warning">{PROFILE_WARN0_2}</Bar>
      </>
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

/** Строка ленты: значок типа вместо аватара — уведомление не про человека.

    `one` — телефон ✳ (30.08.2026): время и значок «НОВОЕ» уходят под текст.
    В строку на 392 px они не помещаются вместе с самим уведомлением: на текст
    оставалось 165 px, и от «Вы назначены главным судьёй» доезжало «Вы назна…».
    Заодно снимается обрезка — текст переносится целиком. */
const NRow = ({
  ic,
  t,
  s,
  when,
  unread,
  one,
}: {
  ic: ReactNode;
  t: string;
  s: string;
  when: string;
  unread?: boolean;
  one?: boolean;
}) => (
  <div
    data-row
    className={
      'flex w-full gap-3 px-4 py-2.5 hover:bg-neutral-50 ' + (one ? 'items-start' : 'items-center')
    }
  >
    <span
      className={
        'grid size-9 shrink-0 place-items-center rounded-lg ' +
        (unread ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-400')
      }
    >
      {ic}
    </span>
    <span className="min-w-0 flex-1 leading-tight">
      <span className={'block text-[13.5px] font-medium ' + (one ? '' : 'truncate')}>{t}</span>
      <span className={'block text-xs text-neutral-500 ' + (one ? '' : 'truncate')}>{s}</span>
      {one && (
        <span className="mt-1.5 flex items-center gap-2">
          <span className="text-xs text-neutral-400">{when}</span>
          {unread && <Pill t="НОВОЕ" color="accent" />}
        </span>
      )}
    </span>
    {!one && <span className="shrink-0 text-xs text-neutral-400">{when}</span>}
    {!one && unread && <Pill t="НОВОЕ" color="accent" />}
  </div>
);

/** Лента уведомлений: один список на оба формата — числа в шапке («3
    непрочитанных из 42») считаны по нему, и разойтись кадрам нельзя. */
const NOTES0_3: { ic: ReactNode; t: string; s: string; when: string; unread?: boolean }[] = [
  {
    ic: <Gavel size={17} />,
    t: 'Вы назначены главным судьёй',
    s: 'Кубок Республики Казахстан 2026 · решение председателя ГСК',
    when: 'сегодня, 09:20',
    unread: true,
  },
  {
    ic: <Radio size={17} />,
    t: 'Пара вызвана на стол 4',
    s: 'Смагулов А. — Ким Г. · Евразийская лига, 2-й тур',
    when: 'сегодня, 08:55',
    unread: true,
  },
  {
    ic: <Trophy size={17} />,
    t: 'Турнир перенесён',
    s: 'ОРТ «Кубок Иртыша» · 25 апреля → 16 мая · зал занят',
    when: 'вчера, 17:40',
    unread: true,
  },
  {
    ic: <Scroll size={17} />,
    t: 'Протокол утверждён',
    s: 'Открытие сезона 2026 · рейтинг пересчитан',
    when: '21.01.2026',
  },
  {
    ic: <BarChart3 size={17} />,
    t: 'Заявка принята',
    s: 'Первенство РК · 2010 г.р. и моложе',
    when: '19.01.2026',
  },
];

/** Требование зоны: уведомление не тупик — строка ведёт на свой экран. */
const NOTE_FOOT0_3 =
  'Строка ведёт на экран, о котором уведомление: заявка — в заявку, вызов — в матч, ' +
  'протокол — в протокол';

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
        {NOTES0_3.map((n) => (
          <NRow key={n.t} {...n} />
        ))}
      </Rows>
      <div className="mt-2 text-[11px] text-neutral-400">{NOTE_FOOT0_3}</div>
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

/** Разделы публичного сайта — один список на оба формата. */
const SITE_NAV = ['Главная', 'Календарь', 'Рейтинги', 'Новости'];

const SiteLink = ({ t, on }: { t: string; on: boolean }) => (
  <button
    type="button"
    aria-current={on || undefined}
    className={
      'shrink-0 rounded-lg px-2.5 py-1.5 ' +
      (on ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-50')
    }
  >
    {t}
  </button>
);

/** Шапка сайта: одна на главную и на страницу турнира — разделы, язык и
    «Войти». Общая нарочно: публичная часть — один сайт, и шапка не должна
    разъезжаться между двумя кадрами.

    `one` — телефон ✳ (30.08.2026): знак, язык и «Войти» первой строкой,
    разделы — второй, с прокруткой вбок. Нижней панели вкладок у публичной
    части нет и не будет: это сайт, а не приложение, и человек в него не
    входил. */
const SiteHead = ({ active, one }: { active: string; one?: boolean }) =>
  one ? (
    <div className="shrink-0 border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-2">
        <Brand size="sm" />
        <div className="flex-1" />
        <Langs />
        <Button size="sm" variant="primary" data-to="Э0.1">
          <LogIn size={14} /> Войти
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-1.5 text-[13px] font-medium">
        {SITE_NAV.map((t) => (
          <SiteLink key={t} on={t === active} t={t} />
        ))}
      </nav>
    </div>
  ) : (
    <div className="flex h-14 shrink-0 items-center gap-6 border-b border-neutral-200 bg-white px-6">
      <Brand />
      <nav className="flex items-center gap-1 text-[13px] font-medium">
        {SITE_NAV.map((t) => (
          <SiteLink key={t} on={t === active} t={t} />
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

/** «Ближайшие и текущие» — так зона и записана в данных: идущий турнир из
    блока живого счёта должен быть и в списке, иначе на его страницу с главной
    не попасть. Список общий на оба формата. */
const STARTS0_4: { nm: string; sub: string; pill: { t: string; cls: 'live' | 'reg' } }[] = [
  { nm: 'Евразийская лига 2026', sub: 'Командный турнир · Астана · 12–20 мая', pill: { t: 'ИДЁТ', cls: 'live' } },
  { nm: 'Кубок Республики Казахстан 2026', sub: 'Главный старт · Астана · 18–20 мая', pill: { t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' } },
  { nm: 'ОРТ «Кубок Иртыша»', sub: 'ОРТ · Павлодар · 25 апреля', pill: { t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' } },
  { nm: 'Первенство РК · 2010 г.р. и моложе', sub: 'Главный старт · Алматы · 3–5 июня', pill: { t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' } },
];

/** Лидеры рейтинга: те же трое, что играют в блоке живого счёта. */
const LEADERS0_4: { av: string; nm: string; sub: string; val: string }[] = [
  { av: A(32), nm: '1 · Смагулов Алан', sub: 'Алматы · «Алатау»', val: '2456' },
  { av: A(44), nm: '2 · Ким Георгий', sub: 'Астана · СКА', val: '2401' },
  { av: A(13), nm: '3 · Пак Сергей', sub: 'Павлодар · «Иртыш»', val: '2312' },
];

/** Новости — на трёх языках (TZ §3.1): у материала видно, на каких он вышел. */
const NEWS0_4: { nm: string; sub: string }[] = [
  { nm: 'Кубок Республики: приём заявок открыт', sub: '12.04.2026 · RU · KZ' },
  { nm: 'Итоги открытия сезона 2026', sub: '21.01.2026 · RU · KZ · EN' },
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
        {/* Карточки табло идут одна под другой ✳ (30.08.2026): в две колонки
            счёт по партиям сжимался вдвое, а ради него сюда и приходят.
            Внутри карточки игроки по-прежнему стоят по краям от счёта. */}
        <div className="mb-4 flex flex-col gap-3">
          {LIVE.map((m) => (
            <MatchCard key={m.tour} {...m} live />
          ))}
        </div>

        {/* Блоки — вертикальным потоком ✳ (30.08.2026), как в профиле (Э0.2):
            панель сама держит отступ снизу, обёртка-сетка не нужна. */}
        <>
          <Panel title="Ближайшие и текущие старты" flush>
            <div className="divide-y divide-neutral-100">
              {STARTS0_4.map((s) => (
                <Row key={s.nm} nm={s.nm} pill={s.pill} sub={s.sub} />
              ))}
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
              {LEADERS0_4.map((l) => (
                <Row key={l.nm} av={l.av} nm={l.nm} sub={l.sub} val={l.val} />
              ))}
            </div>
          </Panel>
        </>

        <Panel title="Новости" extra={<span className="text-xs text-neutral-500">на трёх языках</span>} flush>
          <div className="divide-y divide-neutral-100">
            {NEWS0_4.map((n) => (
              <Row key={n.nm} nm={n.nm} sub={n.sub} />
            ))}
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

        {/* Счёт и трансляция — блок под блоком ✳ (30.08.2026): узкая колонка
            трансляции резала табло, а вертикальным потоком оба блока читаются
            во всю ширину. */}
        <>
          <Panel title="Счёт в реальном времени" sub="обновляется сам — страницу перезагружать не нужно">
            <div className="flex flex-col gap-3">
              {LIVE.map((m) => (
                <MatchCard key={m.tour} {...m} live />
              ))}
            </div>
          </Panel>

          <Panel title="Трансляция" sub="смотреть можно без входа">
            {/* Окно трансляции ограничено по ширине: во всю ширину панели
                видео заняло бы половину экрана и утопило бы вкладки ниже. */}
            <div className="relative grid aspect-video max-w-xl place-items-center rounded-lg bg-neutral-900">
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
        </>

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

/** ИИН спортсмена для макетов: Оралбек Диас, 12.07.2009 — тот же человек, что
    в состояниях экрана и в реестре клуба «Алатау». */
const IIN_ATHLETE = '090712500318';

/** Регистрация спортсмена — три шага ✳ (30.08.2026): ИИН → код → анкета.

    Смысл интеграции виден именно здесь. Раньше человек набирал руками фамилию,
    имя, отчество, дату рождения и пол — то есть ровно те данные, по которым
    система потом искала совпадение с уже заведённой записью и всё равно не
    была уверена. Теперь их отдаёт государственная база по ИИН, и они не
    правятся: спорить с документом на форме регистрации незачем.

    Руками остаётся только то, чего в базе нет: контакты, город, клуб, разряд и
    согласия. Прежний довод «форма должна быть короткой, поэтому регион и клуб
    спросим потом» ✳ (он стоял здесь до 30.08.2026) больше не работает: блок
    «кто вы» теперь не стоит человеку ни одного поля, и место под спортивные
    вопросы освободилось. Клуб при этом остаётся заявкой, а не фактом:
    принадлежность по-прежнему подтверждает сам клуб (Э13.2). */
export function SignUp0_5() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [iin, setIin] = useState(IIN_ATHLETE);
  return (
    <AuthPage wide>
      <div className="mb-5 flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <div>
          <div className="text-xl font-semibold tracking-tight">Регистрация спортсмена</div>
          <div className="mt-1 text-[12.5px] text-neutral-500">
            {step === 3
              ? 'ФИО, дата рождения и пол пришли из государственной базы — руками только то, чего в ней нет'
              : 'По ИИН через Smart Bridge · пароль придумывать не нужно, его в системе нет'}
          </div>
        </div>
      </div>

      {step === 1 && (
        <>
          <IinField value={iin} onChange={setIin} />
          <div className="mt-3">
            <Bar>
              По ИИН система спросит государственную базу и заполнит за вас фамилию, имя, отчество,
              дату рождения и пол. Заново набирать их не придётся.
            </Bar>
          </div>
          <Button
            className="w-full"
            isDisabled={iin.length !== 12}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <CodeStep />
          <Button className="mt-4 w-full" variant="primary" onPress={() => setStep(3)}>
            Подтвердить <ArrowRight size={15} />
          </Button>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              className="text-[12.5px] font-semibold text-neutral-500 hover:underline"
              onClick={() => setStep(1)}
            >
              Ввести другой ИИН
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <FromState
            born="12.07.2009"
            fio="Оралбек Диас Ерланович"
            iin={IIN_ATHLETE}
            sex="мужской"
          />

          <FormGrid>
            <SecCap>Контакты</SecCap>
            <TextInput label="Телефон" placeholder="+7 ___ ___ __ __" />
            <TextInput label="Почта" placeholder="имя@домен" />
            {/* Спортивная часть — то, чего в государственной базе нет и быть не
                может: где человек живёт по спорту, в каком клубе играет и какой
                у него разряд. */}
            <SecCap>Спорт</SecCap>
            <PickField label="Город" value="Алматы" />
            <PickField label="Разряд" value="2 разряд" />
            <PickField label="Клуб — заявка, подтверждает сам клуб (Э13.2)" value="«Алатау» · Алматы" wide />
            <Consent sub="без него регистрация не проходит" />
            <Consent
              sub="без него ФИО и дату рождения по ИИН не запросить"
              t="Согласие на запрос сведений из государственной базы через Smart Bridge"
            />
          </FormGrid>

          {/* Что будет дальше — сказано на самом экране, а не в письме после
              (TZ §9.2), и до кнопки: человек читает это, пока решает жать. */}
          <div className="mt-4">
            <Bar>
              Профиль откроется сразу. До оплаты годового взноса заявки на турниры со взносом не
              проходят (TZ §9.2) — оплата в своём кабинете.
            </Bar>
          </div>

          <Button className="w-full" variant="primary">
            <UserPlus size={15} /> Зарегистрироваться
          </Button>
        </>
      )}

      <div className="flex justify-center">
        <ALink to="Э0.1">Уже есть аккаунт — войти</ALink>
      </div>
    </AuthPage>
  );
}

export const SignUp0_5States = () => (
  <States>
    <Shot
      tone="danger"
      title="ИИН уже зарегистрирован"
      text="Аккаунт по этому ИИН есть: второго не заводим, человек идёт на вход."
    >
      <Frag>
        <Rows>
          <Row
            nm="Оралбек Диас Ерланович"
            sub="аккаунт создан 03.02.2026 · вход по этому же ИИН"
            pill={{ t: 'УЖЕ В СИСТЕМЕ', cls: 'done' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            ИИН один на человека, поэтому и аккаунт один: спорить не о чем. Забыть его нельзя — он
            в удостоверении личности, а пароля, который забывают, в системе нет.
          </Bar>
          <Button data-to="Э0.1" variant="primary">
            <LogIn size={15} /> Войти
          </Button>
        </div>
      </Frag>
    </Shot>

    {/* Прежнее состояние «найден похожий человек» ✳ переписано (30.08.2026):
        похожесть искали по ФИО и году рождения, и решение оставляли человеку.
        По ИИН совпадение точное — это тот же человек, а не похожий, и
        связывание перестало быть догадкой. */}
    <Shot
      tone="warning"
      title="Запись уже завёл клуб — связываем по ИИН ✳"
      text="Совпадение точное, а не «похожий человек»: ИИН один. Рейтинг и история достаются человеку."
    >
      <Frag>
        <Rows>
          <Row
            nm="Оралбек Диас · 2009 · Алматы"
            sub="завёл клуб «Алатау», 03.02.2026 · рейтинг 2042 · без входа в систему"
            pill={{ t: 'СОВПАЛ ИИН', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">
            Карточка была, входа не было. Регистрация не создаёт вторую запись, а даёт человеку
            вход в свою: рейтинг 2042 и история матчей остаются на месте.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Согласия не отмечены" text="Их два, и обе отметки обязательны: кнопка неактивна.">
      <Frag w={420}>
        <FormGrid>
          <Consent off sub="без него регистрация не проходит" />
          <Consent
            off
            sub="без него ФИО и дату рождения по ИИН не запросить"
            t="Согласие на запрос сведений из государственной базы через Smart Bridge"
          />
        </FormGrid>
        <div className="mt-3">
          <DisabledAction>Зарегистрироваться</DisabledAction>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ Кому нечем войти"
      text="Два случая, которые новый вход не покрывает. Ответов у нас нет — вопрос к федерации."
      wide
    >
      <Frag>
        <Rows>
          <Row
            nm="Иностранец без ИИН"
            sub="легионер клуба, гость международного турнира, тренер сборной — в государственной базе РК их нет"
            pill={{ t: 'ВОПРОС', cls: 'bad' }}
          />
          <Row
            nm="Ребёнок младше 14 лет"
            sub="ИИН у него есть с рождения, а телефона для кода может не быть — кто входит за него"
            pill={{ t: 'ВОПРОС', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Первенство РК «2010 г.р. и моложе» — турнир для тех, кому и двенадцати нет. Пока
            вопрос открыт, мы не рисуем ни «вход за ребёнка родителем», ни «регистрацию по
            паспорту»: и то и другое — отдельное решение федерации, а не наша догадка.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.10 — чья запись, если человека уже завели"
      text="ИИН сделал сверку точной, но чья запись — по-прежнему не решено."
      wide
    >
      <Frag>
        <Bar>
          Три пути в реестр: человек сам, клуб, федерация. Кого считать владельцем записи и что
          происходит с рейтингом и историей при связывании — вопрос к федерации. Дубль молча не
          создаём; теперь его и создать труднее — ИИН совпадёт.
        </Bar>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.6 · Принятие приглашения ───────────────────────────────── */

/** ИИН приглашённого: Нұрланұлы Алихан, 14.05.2011 — тот же, кого клуб
    «Алатау» завёл у себя в составе (Э13.2). */
const IIN_INVITED = '110514500742';

/** Вторая половина приглашения: то, что видит человек, открыв ссылку.

    Аккаунт за человека не заводит никто — ни клуб (Э13.2), ни федерация
    (Э1.10). Они выпускают одноразовую ссылку, а человек подтверждает себя по
    ней сам. До этого шага учётной записи нет — есть только карточка со значком
    «приглашён».

    Пароля здесь больше не задают ✳ (30.08.2026). Раньше пароль был
    единственным полем ввода и заодно единственным доказательством, что ссылку
    открыл тот, кому её послали: кто угодно, получив пересланную ссылку, заводил
    себе чужую карточку. Теперь человек подтверждает себя ИИН и кодом — то есть
    ровно так же, как входит потом. Приглашение перестало быть отдельным
    способом попасть в систему и стало тем, чем оно и было: приглашением.

    Отсюда и третий шаг: данные клуба показываются рядом с данными
    государственной базы. Клубные — по-прежнему на чтение (их заполнил
    приглашающий, и правка превратила бы приглашение во вторую форму
    регистрации), а расхождение ФИО — отдельное состояние: значит, ссылку
    открыл не тот человек либо клуб ошибся в карточке. */
export function Accept0_6() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [iin, setIin] = useState(IIN_INVITED);
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

      {step === 1 && (
        <>
          <IinField value={iin} onChange={setIin} />
          <div className="mt-3">
            <Bar>
              Ссылку могли переслать кому угодно, поэтому она сама по себе никого не пускает:
              подтвердите, что вы — тот, кого приглашали. Пароль придумывать не нужно, его в
              системе нет.
            </Bar>
          </div>
          <Button
            className="w-full"
            isDisabled={iin.length !== 12}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <CodeStep />
          <Button className="mt-4 w-full" variant="primary" onPress={() => setStep(3)}>
            Подтвердить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <FromState
            born="14.05.2011"
            fio="Нұрланұлы Алихан"
            iin={IIN_INVITED}
            sex="мужской"
          />

          <Panel title="Что о вас указал клуб" sub="На чтение: это заполнил приглашающий, а не вы">
            <FormGrid>
              <FieldView label="Фамилия, имя" value="Нұрланұлы Алихан" />
              <FieldView label="Дата рождения" value="14.05.2011" />
              <FieldView label="Разряд" value="2 разряд" />
              <FieldView label="Клуб" value="«Алатау» · г. Алматы" />
            </FormGrid>
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-green-700">
              <Check size={14} /> ФИО и дата рождения сошлись с государственной базой
            </div>
          </Panel>

          <FormGrid>
            <Consent />
            <Consent
              t="Согласие на запрос сведений из государственной базы через Smart Bridge"
            />
          </FormGrid>

          <Button className="mt-4 w-full" variant="primary">
            <LogIn size={15} /> Принять приглашение и войти
          </Button>
        </>
      )}

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
            sub="принял приглашение 16.04 · подтвердил себя ИИН и кодом"
            pill={{ t: 'В КЛУБЕ', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">
            Клуб видит только факт принятия. Входа в чужой аккаунт у него нет и быть не может: код
            уходит на номер человека, а не клубу.
          </Bar>
        </div>
      </Frag>
    </Shot>

    {/* Новое состояние ✳ (30.08.2026): раньше сверять было не с чем — клуб
        писал ФИО от руки, и никто не знал, верно ли. Теперь рядом лежат две
        записи, и расхождение видно сразу. */}
    <Shot
      tone="danger"
      title="ФИО из базы расходится с тем, что указал клуб ✳"
      text="Дальше не идём: либо ссылку открыл не тот человек, либо клуб ошибся в карточке."
      wide
    >
      <Frag>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Указал клуб
            </div>
            <div className="mt-1 text-sm font-semibold">Нұрланұлы Алихан</div>
            <div className="text-xs text-neutral-500">14.05.2011</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
              Государственная база по вашему ИИН
            </div>
            <div className="mt-1 text-sm font-semibold text-red-900">Нұрланұлы Ерасыл</div>
            <div className="text-xs text-red-800">03.09.2010</div>
          </div>
        </div>
        <div className="mt-3">
          <Bar tone="danger">
            Приглашение не принимается. Два пути: это чужая ссылка — «это не я», она гаснет и
            пригласившему уходит уведомление; либо клуб ошибся в имени — он правит карточку и
            выпускает ссылку заново.
          </Bar>
          <div className="flex items-center gap-2">
            <Button variant="outline">Это не я</Button>
            <DisabledAction>Принять приглашение и войти</DisabledAction>
          </div>
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
            sub="дальше — обычный вход по ИИН и коду"
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

/** ИИН судьи для макетов: Оралбай Ержан, 03.11.1988 — тот же человек, что в
    состояниях экрана и в реестре судей. */
const IIN_JUDGE = '881103300417';

/** Судья заводит себя сам — как спортсмен (Э0.5), но категорию себе не ставит.

    Так записано в нашем предположении о том, как люди попадают в систему
    (QUESTIONS 9.1): «судьи — аккаунт заводят сами, но роль и категорию
    присваивает коллегия/федерация по удостоверению». До этого экрана судей
    заводила только федерация приглашением (Э1.10), и реестр судей наполнялся
    вручную — а председателю ГСК некого было назначать, кроме тех, кого успели
    завести.

    Шаги те же три, что у спортсмена ✳ (30.08.2026): ИИН → код → анкета. ФИО,
    дата рождения и пол приходят из государственной базы и не правятся; руками
    судья вводит контакты и регион.

    - **Категории в форме нет вовсе.** Ни селектора, ни загрузки удостоверения:
      селектор отдал бы «высшую национальную» любому, кто её выбрал, а файл на
      входе — лишний шаг, когда документа может не быть под рукой. Категорию
      проставляет коллегия по документу, а сам документ судья загружает у себя в
      кабинете — там же, где документы на S3 и S4 (Э6.10, Э9.5), и по тому же
      правилу (TZ §7.2). Smart Bridge здесь не помогает и помочь не может:
      судейская категория — документ федерации, а не государства.
    - **Регион в форме теперь есть** ✳. Раньше его не спрашивали, потому что
      форму берегли от лишних полей; блок «кто вы» освободил четыре поля, и
      регион встал на их место — он нужен для коэффициента 1,5 за выезд (§7.2).

    Окраска своя (янтарная полоса и значок): формы спортсмена и судьи похожи
    как две капли, а заголовок читают уже после того, как начали заполнять.
    Вход не окрашивается — он один на всех (QUESTIONS 9.5).

    ⚠ 9.2 — сам ли регистрируется судья, федерация не ответила. Экран стоит на
    нашем предположении, и это написано прямо на нём. */
export function SignUpJudge0_7() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [iin, setIin] = useState(IIN_JUDGE);
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

      {step === 1 && (
        <>
          <IinField value={iin} onChange={setIin} />
          <div className="mt-3">
            <Bar>
              По ИИН система спросит государственную базу и заполнит за вас фамилию, имя, отчество
              и дату рождения. Пароль придумывать не нужно — его в системе нет.
            </Bar>
          </div>
          <Button
            className="w-full"
            isDisabled={iin.length !== 12}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <CodeStep />
          <Button className="mt-4 w-full" variant="primary" onPress={() => setStep(3)}>
            Подтвердить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 3 && (
        <>
          <FromState
            born="03.11.1988"
            fio="Оралбай Ержан Маратович"
            iin={IIN_JUDGE}
            sex="мужской"
          />

          <FormGrid>
            <SecCap>Контакты</SecCap>
            <TextInput label="Телефон" placeholder="+7 ___ ___ __ __" />
            <TextInput label="Почта" placeholder="имя@домен" />
            <SecCap>Где судите</SecCap>
            <PickField label="Регион — от него зависит коэффициент за выезд (§7.2)" value="Павлодарская область" wide />
            <Consent />
            <Consent
              t="Согласие на запрос сведений из государственной базы через Smart Bridge"
            />
          </FormGrid>

          {/* Чего в форме нет и что дальше — сказано на самой форме и до
              кнопки: судья не должен искать, почему у него не спросили
              категорию, уже нажав «зарегистрироваться». */}
          <div className="mt-4">
            <Bar tone="warning">
              Категории в форме нет и не будет: её проставит коллегия по удостоверению (Э5.6) —
              документ загрузите потом в своём кабинете. Государственная база тут не поможет:
              категория судьи — документ федерации, а не государства. До подтверждения запись в
              реестре стоит с пометкой «ждёт подтверждения»: S2 не начисляется, в наряд не
              назначают.
            </Bar>
          </div>

          <Button className="w-full" variant="primary">
            <Gavel size={15} /> Зарегистрироваться судьёй
          </Button>
        </>
      )}

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

    {/* Прежнее «найден похожий человек» ✳ отсюда убрано (30.08.2026): судью
        искали по ФИО и году рождения, и человеку предлагали решить, он это или
        не он. По ИИН вопрос не стоит — совпадение точное, связывание
        происходит само и объявляется, а не спрашивается. */}
    <Shot
      tone="info"
      title="Этот ИИН уже в системе — спортсменом ✳"
      text="Один человек — один аккаунт (QUESTIONS 9.5): судейская роль добавляется к существующему, второй регистрации нет."
    >
      <Frag>
        <Rows>
          <Row
            nm="Байжанов Ерасыл"
            sub="спортсмен клуба «Алатау» · тот же ИИН · просит роль судьи"
            pill={{ t: 'РОЛЬ ДОБАВЛЯЕТСЯ', cls: 'reg' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar tone="success">
            Раньше здесь спрашивали «это вы?» и надеялись на честный ответ. ИИН отвечает сам:
            второй карточки не появляется, вход остаётся один, в шапке добавляется вторая роль.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Судья уже в реестре, но входа у него не было ✳"
      text="Коллегия завела карточку с категорией; регистрация даёт человеку вход в неё, а не вторую запись."
    >
      <Frag>
        <Rows>
          <Row
            nm="Оралбай Ержан · 1988 · Павлодар"
            sub="в реестре судей с 12.01.2024 · первая категория · совпал ИИН"
            pill={{ t: 'СОВПАЛ ИИН', cls: 'live' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Категория и оценка сохраняются: их ставила коллегия, и регистрация их не трогает.
            Человек получает вход в свою запись — «ждёт подтверждения» ему не выставляют.
          </Bar>
        </div>
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

/* ── Второй формат: те же экраны на телефоне ────────────────────── */

/* Полный адаптив ✳ (30.08.2026, решение владельца «все экраны в обоих»).

   Сквозные экраны — самый очевидный случай: вход, регистрация и публичный сайт
   с телефона открывают чаще, чем с ноутбука. Спортсмен заводит себя стоя в
   зале, приглашённый открывает ссылку из мессенджера на том же телефоне, куда
   придёт код, а результаты смотрят с трибуны. Профиль и уведомления — обычные
   экраны роли: их видит любая из четырнадцати ролей, и телефон у них такой же
   общий, как сам экран.

   Содержание то же и из тех же данных (`LIVE`, `STARTS0_4`, `LEADERS0_4`,
   `NEWS0_4`, `NOTES0_3`, `LOGIN_ROWS0_2`, `CLUBS`, `SCHED`, `RESULTS`,
   `PLAYOFF`), меняется раскладка:

   - экраны роли (Э0.2, Э0.3): `WebApp` → `PhoneRoleApp` — нижние вкладки она
     строит из тех же `R00.nav`, что рисуют сайдбар;
   - титульные страницы (Э0.5, Э0.6, Э0.7): `AuthPage` → `AuthPhone` — рамка
     `Phone` без нижних вкладок: человек ещё не вошёл, разделов у него нет;
   - публичный сайт (Э0.4): рамка `Phone` со своей шапкой сайта, тоже без
     вкладок — это сайт, а не приложение;
   - формы: `FormGrid` в одну колонку (`wide` каждому полю);
   - таблицы (`DataTable`) → строки `Rows`/`Row`;
   - карточка табло (`MatchCard`) → то же табло сверху вниз (`LiveRowPhone`).

   Шесть ячеек `InputOTP` на 392 px помещаются без правки: слоты в нём
   `flex-1`, и два блока по три с разделителем занимают около 290 px из 350
   доступных — уменьшать ячейку не пришлось.

   Состояния экрана во втором формате не повторяем: они показаны один раз, на
   полке `States` под основным макетом. */

/** Титульная страница на телефоне: та же карточка, что в вебе, но во весь
    экран.

    Синего фона знака ФНТ здесь нет: на 392 px карточка занимает экран целиком,
    и «фон» превратился бы в четыре синих полоски по краям — фирменным остаётся
    знак в шапке. `judge` — та же янтарная отбивка, что у формы судьи в вебе:
    формы спортсмена и судьи похожи как две капли, а заголовок читают уже
    после того, как начали заполнять. */
const AuthPhone = ({ judge, children }: { judge?: boolean; children: ReactNode }) => (
  <Phone>
    {judge && <div className="h-1 shrink-0 bg-amber-500" />}
    <div className="min-h-0 flex-1 overflow-auto px-5 pb-4 pt-3">{children}</div>
    <div className="shrink-0 px-5 text-center text-[11px] leading-snug text-neutral-400">
      {AUTH_FOOT}
    </div>
  </Phone>
);

/** Шапка титульной страницы на телефоне: знак, заголовок и пояснение. */
const AuthPhoneHead = ({ chip, title, sub }: { chip?: ReactNode; title: string; sub: string }) => (
  <div className="mb-4 flex flex-col items-center gap-2 text-center">
    <Brand size="lg" />
    {chip}
    <div>
      <div className="text-lg font-semibold leading-tight tracking-tight">{title}</div>
      <div className="mt-1 text-[12.5px] leading-snug text-neutral-500">{sub}</div>
    </div>
  </div>
);

/** Шаг «код» на телефоне вместе с кнопкой и возвратом к вводу ИИН: он одинаков
    во всех трёх формах, и три копии разъехались бы на первой же правке. */
const CodeStepPhone = ({ label, onBack }: { label: string; onBack: () => void }) => (
  <>
    <CodeStep />
    <Button className="mt-4 w-full" variant="primary">
      {label}
      <ArrowRight size={15} />
    </Button>
    <div className="mt-2 text-center">
      <button
        type="button"
        className="text-[12.5px] font-semibold text-neutral-500 hover:underline"
        onClick={onBack}
      >
        Ввести другой ИИН
      </button>
    </div>
  </>
);

/* ── Э0.5 · Регистрация спортсмена на телефоне ──────────────────── */

/** Те же три шага, что в вебе: ИИН → код → анкета. На телефоне у сценария есть
    преимущество — SMS приходит на то же устройство, с которого регистрируются.
    Подпись шага короче («Код» вместо «Кода из SMS»): три подписи делят 350 px,
    и длинная встаёт в две строки. */
export function SignUp0_5Phone() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [iin, setIin] = useState(IIN_ATHLETE);
  return (
    <AuthPhone>
      <AuthPhoneHead
        sub={
          step === 3
            ? 'ФИО, дата рождения и пол пришли из государственной базы — руками только то, чего в ней нет'
            : 'По ИИН через Smart Bridge · пароль придумывать не нужно, его в системе нет'
        }
        title="Регистрация спортсмена"
      />

      {step === 1 && (
        <>
          <IinField value={iin} onChange={setIin} />
          <div className="mt-3">
            <Bar>
              По ИИН система спросит государственную базу и заполнит за вас фамилию, имя, отчество,
              дату рождения и пол. Заново набирать их не придётся.
            </Bar>
          </div>
          <Button
            className="w-full"
            isDisabled={iin.length !== 12}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 2 && <CodeStepPhone label="Подтвердить" onBack={() => setStep(1)} />}

      {step === 3 && (
        <>
          <FromState one born="12.07.2009" fio="Оралбек Диас Ерланович" iin={IIN_ATHLETE} sex="мужской" />

          <FormGrid>
            <SecCap>Контакты</SecCap>
            <TextInput wide label="Телефон" placeholder="+7 ___ ___ __ __" />
            <TextInput wide label="Почта" placeholder="имя@домен" />
            <SecCap>Спорт</SecCap>
            <PickField wide label="Город" value="Алматы" />
            <PickField wide label="Разряд" value="2 разряд" />
            <PickField wide label="Клуб — заявка, подтверждает сам клуб (Э13.2)" value="«Алатау» · Алматы" />
            <Consent sub="без него регистрация не проходит" />
            <Consent
              sub="без него ФИО и дату рождения по ИИН не запросить"
              t="Согласие на запрос сведений из государственной базы через Smart Bridge"
            />
          </FormGrid>

          <div className="mt-4">
            <Bar>
              Профиль откроется сразу. До оплаты годового взноса заявки на турниры со взносом не
              проходят (TZ §9.2) — оплата в своём кабинете.
            </Bar>
          </div>

          <Button className="w-full" variant="primary">
            <UserPlus size={15} /> Зарегистрироваться
          </Button>
        </>
      )}

      <div className="mt-4 flex justify-center">
        <ALink to="Э0.1">Уже есть аккаунт — войти</ALink>
      </div>
    </AuthPhone>
  );
}

/* ── Э0.6 · Принятие приглашения на телефоне ────────────────────── */

/** Самый частый способ открыть приглашение — ссылка из мессенджера, то есть
    как раз телефон. Три шага те же: ИИН → код → сверка данных клуба с
    государственной базой. */
export function Accept0_6Phone() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [iin, setIin] = useState(IIN_INVITED);
  return (
    <AuthPhone>
      <AuthPhoneHead
        sub="Пригласил Досжан Мади · администратор клуба"
        title="Клуб «Алатау» приглашает вас в систему ФНТ РК"
      />

      {step === 1 && (
        <>
          <IinField value={iin} onChange={setIin} />
          <div className="mt-3">
            <Bar>
              Ссылку могли переслать кому угодно, поэтому она сама по себе никого не пускает:
              подтвердите, что вы — тот, кого приглашали. Пароль придумывать не нужно, его в
              системе нет.
            </Bar>
          </div>
          <Button
            className="w-full"
            isDisabled={iin.length !== 12}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 2 && <CodeStepPhone label="Подтвердить" onBack={() => setStep(1)} />}

      {step === 3 && (
        <>
          <FromState one born="14.05.2011" fio="Нұрланұлы Алихан" iin={IIN_INVITED} sex="мужской" />

          <Panel title="Что о вас указал клуб" sub="На чтение: это заполнил приглашающий, а не вы">
            <FormGrid>
              <FieldView wide label="Фамилия, имя" value="Нұрланұлы Алихан" />
              <FieldView wide label="Дата рождения" value="14.05.2011" />
              <FieldView wide label="Разряд" value="2 разряд" />
              <FieldView wide label="Клуб" value="«Алатау» · г. Алматы" />
            </FormGrid>
            <div className="mt-3 flex items-start gap-2 text-[12.5px] leading-snug text-green-700">
              <Check size={14} className="mt-0.5 shrink-0" /> ФИО и дата рождения сошлись с
              государственной базой
            </div>
          </Panel>

          <FormGrid>
            <Consent />
            <Consent t="Согласие на запрос сведений из государственной базы через Smart Bridge" />
          </FormGrid>

          <Button className="mt-4 w-full" variant="primary">
            <LogIn size={15} /> Принять приглашение и войти
          </Button>
        </>
      )}

      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <span className="text-xs text-neutral-500">Ссылка одноразовая и действует до 22.04.2026</span>
        <ALink muted>Это не я</ALink>
      </div>
    </AuthPhone>
  );
}

/* ── Э0.7 · Регистрация судьи на телефоне ───────────────────────── */

/** Судья заводит себя сам — категорию по-прежнему проставляет коллегия, и в
    форме её нет ни на одном формате. Экспортируется: кабинет судьи (role00j)
    открывается этим же экраном и ставит его вторым форматом своей колонки. */
export function SignUpJudge0_7Phone() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [iin, setIin] = useState(IIN_JUDGE);
  return (
    <AuthPhone judge>
      <AuthPhoneHead
        chip={
          <Chip color="warning" size="sm" variant="soft">
            <Gavel size={12} className="mr-1 inline" /> СУДЕЙСКАЯ КОЛЛЕГИЯ
          </Chip>
        }
        sub="Аккаунт вы заводите сами · категорию проставляет коллегия по удостоверению"
        title="Регистрация судьи"
      />

      {step === 1 && (
        <>
          <IinField value={iin} onChange={setIin} />
          <div className="mt-3">
            <Bar>
              По ИИН система спросит государственную базу и заполнит за вас фамилию, имя, отчество
              и дату рождения. Пароль придумывать не нужно — его в системе нет.
            </Bar>
          </div>
          <Button
            className="w-full"
            isDisabled={iin.length !== 12}
            variant="primary"
            onPress={() => setStep(2)}
          >
            Продолжить <ArrowRight size={15} />
          </Button>
        </>
      )}

      {step === 2 && <CodeStepPhone label="Подтвердить" onBack={() => setStep(1)} />}

      {step === 3 && (
        <>
          <FromState one born="03.11.1988" fio="Оралбай Ержан Маратович" iin={IIN_JUDGE} sex="мужской" />

          <FormGrid>
            <SecCap>Контакты</SecCap>
            <TextInput wide label="Телефон" placeholder="+7 ___ ___ __ __" />
            <TextInput wide label="Почта" placeholder="имя@домен" />
            <SecCap>Где судите</SecCap>
            <PickField
              wide
              label="Регион — от него зависит коэффициент за выезд (§7.2)"
              value="Павлодарская область"
            />
            <Consent />
            <Consent t="Согласие на запрос сведений из государственной базы через Smart Bridge" />
          </FormGrid>

          <div className="mt-4">
            <Bar tone="warning">
              Категории в форме нет и не будет: её проставит коллегия по удостоверению (Э5.6) —
              документ загрузите потом в своём кабинете. Государственная база тут не поможет:
              категория судьи — документ федерации, а не государства. До подтверждения запись в
              реестре стоит с пометкой «ждёт подтверждения»: S2 не начисляется, в наряд не
              назначают.
            </Bar>
          </div>

          <Button className="w-full" variant="primary">
            <Gavel size={15} /> Зарегистрироваться судьёй
          </Button>
        </>
      )}

      <div className="mt-4 flex justify-center">
        <ALink to="Э0.1">Уже есть аккаунт — войти</ALink>
      </div>
    </AuthPhone>
  );
}

/* ── Э0.2 · Свой профиль на телефоне ────────────────────────────── */

/** Обычный экран роли: оболочка `PhoneRoleApp` со вкладками из `R00.nav`.
    Активного раздела в них нет — как и в сайдбаре веба: на профиль приходят из
    шапки, а не из меню, и подсвечивать нечего. Возврат «К работе» поэтому и
    здесь остаётся единственным выходом. */
const Profile0_2Phone = () => (
  <PhoneRoleApp
    role={R00}
    nav="Профиль"
    title="Мой профиль"
    sub="Контакты, язык интерфейса и вход"
    back={{ label: 'К работе', to: 'Э1.1' }}
  >
    <Panel title="Профиль">
      <div className="mb-4">
        <ProfileHead0_2 />
      </div>
      <FormGrid>
        <TextInput wide label="Телефон" value="+7 701 220 45 90" />
        <TextInput wide label="Почта" value="d.abaeva@ttfrk.kz" />
      </FormGrid>
      {/* Язык и «Сохранить» — друг под другом: в строку они помещаются только
          на десктопе, а кнопка во всю ширину на телефоне ещё и попадает под
          большой палец. */}
      <div className="mt-4">
        <div className="text-xs font-medium text-neutral-500">Язык интерфейса</div>
        <div className="mt-1"><Langs /></div>
        <div className="mt-1.5 text-xs leading-snug text-neutral-500">
          Письма и уведомления приходят на нём же
        </div>
        <Button className="mt-3 w-full" size="sm" variant="primary">Сохранить</Button>
      </div>
    </Panel>

    <Panel title="Вход" sub="Пароля в системе нет: вход по ИИН и одноразовому коду ✳" flush>
      <div className="divide-y divide-neutral-100">
        {LOGIN_ROWS0_2.map((r) => (
          <Row key={r.nm} action={r.action} nm={r.nm} pill={r.pill} sub={r.sub} />
        ))}
      </div>
    </Panel>

    <Bar tone="warning">{PROFILE_WARN0_2}</Bar>
  </PhoneRoleApp>
);

/* ── Э0.3 · Уведомления на телефоне ─────────────────────────────── */

/** Тот же список и те же числа. Полоса «факты + кнопка» разведена по строкам:
    «Отметить все прочитанными» рядом с тремя счётчиками на 392 px не встаёт. */
const Notif0_3Phone = () => (
  <PhoneRoleApp
    role={R00}
    nav="Уведомления"
    title="Уведомления"
    sub="3 непрочитанных из 42"
    back={{ label: 'К работе', to: 'Э1.1' }}
  >
    <div className="mb-3 flex flex-col gap-2">
      <Facts
        items={[
          { k: 'непрочитанных', v: '3', hot: true },
          { k: 'всего', v: '42' },
          { k: 'период', v: '7 дней' },
        ]}
      />
      <Button className="w-full" size="sm" variant="outline">
        <CheckCheck size={14} /> Отметить все прочитанными
      </Button>
    </div>
    <Rows>
      {NOTES0_3.map((n) => (
        <NRow key={n.t} {...n} one />
      ))}
    </Rows>
    <div className="mt-2 text-[11px] leading-snug text-neutral-400">{NOTE_FOOT0_3}</div>
  </PhoneRoleApp>
);

/* ── Э0.4 · Публичные страницы на телефоне ──────────────────────── */

/** Матч в реальном времени на телефоне: то же табло, но сверху вниз.

    `MatchCard` кита ставит игроков по краям от крупного счёта — двум фамилиям
    с фото и счёту в одну строку нужно около 380 px, а в кадре их 330, и
    карточка уезжает за край. Данные те же (`LIVE`), меняется раскладка: игрок —
    строка со своим числом, партии и примечание под обоими. Счёт «2 : 1»
    разобран по игрокам: два числа у двух фамилий читаются быстрее, чем одно
    выражение посередине. */
const LiveRowPhone = ({ m }: { m: LiveMatch }) => {
  const [a, b] = m.score.split(':').map((s) => s.trim());
  const sides = [
    { p: m.home, v: a },
    { p: m.away, v: b },
  ];
  return (
    <div data-row className="rounded-xl border border-green-200 bg-white p-3.5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs leading-snug text-neutral-500">{m.tour}</span>
        <Chip color="success" size="sm">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" /> ИДЁТ
        </Chip>
      </div>
      {sides.map(({ p, v }) => (
        <div key={p.nm} className="flex items-center gap-2.5 py-1">
          <Avatar size="sm">
            <Avatar.Image alt={p.nm} src={p.av} />
            <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-semibold">{p.nm}</span>
            <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
          </span>
          <span className="text-xl font-bold tabular-nums">{v}</span>
        </div>
      ))}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <GameCells games={m.games} />
        <span className="text-right text-xs leading-snug text-neutral-500">{m.note}</span>
      </div>
    </div>
  );
};

/** Главная сайта на телефоне: те же четыре блока одной колонкой. */
const Public0_4Phone = () => (
  <Phone>
    <SiteHead one active="Главная" />
    <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 px-4 pb-4 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight">Идут сейчас</h2>
        <Pill t="В РЕАЛЬНОМ ВРЕМЕНИ" color="success" />
      </div>
      <div className="mb-4 flex flex-col gap-3">
        {LIVE.map((m) => (
          <LiveRowPhone key={m.tour} m={m} />
        ))}
      </div>

      <Panel title="Ближайшие и текущие старты" flush>
        <div className="divide-y divide-neutral-100">
          {STARTS0_4.map((s) => (
            <Row key={s.nm} nm={s.nm} pill={s.pill} sub={s.sub} />
          ))}
        </div>
      </Panel>

      {/* Подпись «весь рейтинг — игроки и судьи» переехала из правого края
          заголовка под название: в 328 px она отжимала само название панели. */}
      <Panel title="Лидеры рейтинга" sub="весь рейтинг — игроки и судьи" flush>
        <div className="divide-y divide-neutral-100">
          {LEADERS0_4.map((l) => (
            <Row key={l.nm} av={l.av} nm={l.nm} sub={l.sub} val={l.val} />
          ))}
        </div>
      </Panel>

      <Panel title="Новости" sub="на трёх языках" flush>
        <div className="divide-y divide-neutral-100">
          {NEWS0_4.map((n) => (
            <Row key={n.nm} nm={n.nm} sub={n.sub} />
          ))}
        </div>
      </Panel>
    </div>
  </Phone>
);

/** Страница турнира на телефоне — вторая половина публичной части.

    Порядок тот же, что в вебе: счёт и трансляция выше вкладок, потому что на
    страницу идущего турнира приходят ради того, что происходит прямо сейчас.
    Вкладки те же четыре; таблицы расписания и результатов развёрнуты строками —
    четыре колонки на 328 px сжимаются до нечитаемых. */
const Tournament0_4Phone = () => (
  <Phone>
    <SiteHead one active="Календарь" />
    <div className="min-h-0 flex-1 overflow-auto bg-neutral-50 px-4 pb-4 pt-3">
      <BackLink label="Календарь ФНТ РК" to="Э0.4" />
      <div className="mb-3 mt-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold leading-tight tracking-tight">
            Евразийская лига 2026
          </h1>
          <p className="mt-0.5 text-xs leading-snug text-neutral-500">
            Командный турнир · 4 клуба · Астана · 12–20 мая · круговой этап, 2-й тур из трёх
          </p>
        </div>
        <Pill t="ИДЁТ" color="success" />
      </div>

      <Panel title="Счёт в реальном времени" sub="обновляется сам — страницу перезагружать не нужно">
        <div className="flex flex-col gap-3">
          {LIVE.map((m) => (
            <LiveRowPhone key={m.tour} m={m} />
          ))}
        </div>
      </Panel>

      <Panel title="Трансляция" sub="смотреть можно без входа">
        {/* Ширину окну здесь не ограничиваем: на телефоне видео и так узкое, а
            `max-w-xl` веба оставил бы поля по краям. */}
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
                flush
              >
                {/* Круги друг под другом, а не колонками: две колонки на 328 px
                    дают по 150 px, и название клуба в паре не помещается. */}
                {PLAYOFF.map((col) => (
                  <div key={col.round} className="border-t border-neutral-100 px-4 py-3 first:border-t-0">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {col.round}
                    </div>
                    <div className="flex flex-col gap-2">
                      {col.pairs.map((p) => (
                        <div key={p.key} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
              </Panel>
            ),
          },
          {
            t: 'Расписание',
            view: (
              <Panel title="Расписание" sub="время и столы; встречи второго тура идут прямо сейчас" flush>
                <div className="divide-y divide-neutral-100">
                  {SCHED.map((s) => (
                    <Row
                      key={s.key}
                      nm={s.pair}
                      pill={s.live ? { t: 'ИДЁТ', cls: 'live' } : undefined}
                      sub={`${s.when} · ${s.tables} · ${s.round}`}
                    />
                  ))}
                </div>
              </Panel>
            ),
          },
          {
            t: 'Результаты',
            view: (
              <Panel title="Результаты · первый тур сыгран" sub="показаны две личные встречи из шести" flush>
                <div className="divide-y divide-neutral-100">
                  {RESULTS.map((r) => (
                    <div key={r.key} className="px-4 py-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 text-[13.5px] font-medium">{r.pair}</span>
                        <span className="shrink-0 text-[15px] font-semibold tabular-nums">{r.score}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">1-й тур</div>
                      <div className="mt-2">
                        <GameCells games={r.games} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ),
          },
        ]}
      />
    </div>
  </Phone>
);

/* ── Борд сквозных экранов ─────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => (
      <>
        <Login0_1 />
        <Also cap="Роль и человек в боковом меню ✳ — откуда сюда выходят">
          <ProfileMenu0_1 />
        </Also>
        <Login0_1States />
      </>
    ),
    /* Телефонный вход стоял в файле экспортом, но на борде не показывался
       ✳ (30.08.2026). Со сценарием ИИН + код это важнее прежнего: SMS приходит
       на то же устройство, с которого входят. Шаги те же два — экран один на
       сайт и приложение, и расходиться им нельзя. */
    alt: () => <LoginPhone0_1 />,
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
    alt: () => <SignUp0_5Phone />,
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
    alt: () => <SignUpJudge0_7Phone />,
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
    alt: () => <Accept0_6Phone />,
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
    alt: () => <Profile0_2Phone />,
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
    alt: () => <Notif0_3Phone />,
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
    /* Публичная часть — это две страницы одного экрана, и во втором формате
       они тоже идут парой: главная и страница турнира. Показать на телефоне
       только главную значило бы потерять счёт, трансляцию и вкладки — то, ради
       чего с трибуны и открывают сайт. */
    alt: () => (
      <div className="flex flex-wrap items-start justify-center gap-6">
        <Public0_4Phone />
        <Tournament0_4Phone />
      </div>
    ),
  },
};

export function Role00Board() {
  return <Board role={R00} screens={SCREENS} />;
}
