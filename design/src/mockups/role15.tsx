/* Роль 15 · Председатель судейской коллегии региона — макеты по флоу на новом
   слое (HeroUI) ✳ (30.08.2026). Содержание, переходы и коды экранов — прежние
   (см. `flows/15-pred-sk-regiona.md`); меняется подача: оболочка WebApp и
   доменные компоненты `kit/hero/app` вместо старого макетного слоя.

   Роль добавлена замечанием федерации (09.2026): «с судьями своих регионов
   работали они, дать им доступ на уровне их регионов, при этом доступ к их
   региону был и у ПГСК». Отсюда главная особенность макетов: везде видно, что
   это **свой регион**, а не вся страна, — счётчики региона, таблица только
   своих судей, ссылка в общий рейтинг отдельной строкой.

   Второй формат ✳ (30.08.2026, решение владельца продукта «все экраны в
   обоих»): у каждого экрана есть телефонный кадр (`*Ph`), и на борде он стоит
   врезкой под десктопным. Председатель работает с ноутбука, но наряд
   досбирывают в зале, а «кто из моих где» спрашивают по дороге. Данные у
   форматов общие: таблицы и строки читают один и тот же массив, а правила
   (допуск судьи, балл за старт) считаются одним выражением — иначе два кадра
   одного экрана разъедутся. */

import { useState, type ReactNode } from 'react';
import {
  CalendarDays, ClipboardList, Gavel, GraduationCap, ListChecks, Scale, Send, Undo2, UserPlus, X,
} from 'lucide-react';
import { Avatar, Button, Meter } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  Bar,
  EmptyBox,
  FileDrop,
  FormGrid,
  InlineDialog,
  PhoneRoleApp,
  PickField,
  Pill,
  Panel,
  Row,
  Rows,
  ScreenScope,
  TextInput,
  WebApp,
  type RoleUI,
  Sheet,
} from '@/shared/kit/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* Карточка судьи — общая с ролями 5, 9 и рейтингом судей: она одна на всю
   систему (Э0.13), второй карточки на того же человека быть не должно.
   `tourPoints` — оттуда же: балл за старт считается в одном месте, и
   телефонный кадр карточки считает его тем же способом, что широкий. */
import { JudgeCard, tourPoints, type JudgeMe, type JudgeTour } from './judge';
import { Login0_1, LoginPhone0_1 } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    До этой роли срез доступа был либо «своё», либо весь уровень системы; здесь
    он географический — регион. В бренде оболочки поэтому стоит регион, а не
    сезон: председатель всё время работает в одном и том же участке. */
const R15: RoleUI = {
  num: '15',
  title: 'Председатель СК региона',
  person: { nm: 'Сейтқали А.', rl: 'Председатель СК · Павлодар', av: A(64) },
  brandName: 'Судейская коллегия · Павлодар',
  badge: false,
  nav: [
    [<Gavel size={16} key="s" />, 'Судьи региона'],
    [<ClipboardList size={16} key="n" />, 'Наряды региона'],
    [<Scale size={16} key="p" />, 'Начисления'],
  ],
  /* Должность в наряде держит человек с судейской квалификацией ✳: срок
     аттестации и рейтинг у него живут в кабинете судьи, и попадать туда он
     должен отсюда, а не вторым входом. */
  roles: ['Председатель СК региона', { t: 'Судья · вне турнира', to: 'Э0.8' }],
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. ⚠ Дупликация с role05.tsx. */
type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const P = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;


/** Заголовок числовой колонки — по правому краю, как и сами числа. */
const Th = ({ children }: { children: ReactNode }) => <span className="block text-right">{children}</span>;

/** Сноска под таблицей в панели flush: правило, из-за которого экран такой. */
const Foot = (_: { children: ReactNode }) => null;

/** Мелкая подпись в правом краю заголовка панели. */
const Cap = (_: { children: ReactNode }) => null;

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. ⚠ Дупликация с role05.tsx.
    Ширина — желаемая, а не жёсткая ✳: `maxWidth: 100%` держит кадр в колонке
    полки, если колонка уже 560 px, иначе содержимое уезжает под соседний кадр
    и режется его краем. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w, maxWidth: '100%' }}>{children}</div>
  </ScreenScope>
);

const num = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/* ── Второй формат роли: тот же экран на телефоне ────────────────── */

/** Оболочка того же экрана в телефоне ✳ (30.08.2026, решение владельца
    продукта: «все экраны в обоих»).

    Председатель работает с ноутбука, но не всегда за столом: наряд досбирывают
    в зале, а «кто из моих где» спрашивают по дороге. Разделы — те же три и
    теми же словами (`R15.nav`): вкладки строит сама оболочка, и подписи
    вкладки со строкой сайдбара обязаны совпадать — по ним карта флоу находит
    переходы.

    Что меняется на 392 px: таблицы становятся строками (имя + главное значение
    + состояние, остальное подписью), ряды «фильтр + поиск + кнопка» встают друг
    под другом, поля формы идут в одну колонку. Что не меняется: содержание и
    все переходы. */
const Ph15 = ({
  nav,
  title,
  sub,
  back,
  children,
}: {
  nav: string;
  title: string;
  sub?: string;
  back?: { label: string; to?: string };
  children: ReactNode;
}) => (
  <PhoneRoleApp role={R15} nav={nav} title={title} sub={sub} back={back}>
    {children}
  </PhoneRoleApp>
);

/** Диалог на телефоне — во всю ширину, снизу ✳ (30.08.2026).

    ⚠ Дупликация с role16.tsx (и повод поднять в `kit/hero/app`, когда таких
    экранов наберётся больше): `InlineDialog` нового слоя прибит к 520 точкам —
    это ширина ноутбука, и в 392 px он не помещается вовсе. На телефоне диалог
    занимает всю ширину и приходит снизу: там его и ждут, и оттуда до него
    достаёт большой палец. */
const PhoneDialog = ({
  title,
  sub,
  to,
  foot,
  onClose,
  children,
}: {
  title: string;
  sub?: string;
  /** Экран позади диалога — туда ведёт крестик. */
  to?: string;
  foot?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
}) => (
  <div className="absolute inset-0 z-40 flex flex-col justify-end bg-neutral-900/40">
    <div className="flex max-h-[88%] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3.5">
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">{title}</div>
          {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
        </div>
        <button
          type="button"
          data-to={to}
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400"
        >
          <X size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-3">{children}</div>
      {foot && (
        <div className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-3">{foot}</div>
      )}
    </div>
  </div>
);

/* ── Судьи региона: данные ──────────────────────────────────────── */

type Reg = {
  nm: string;
  av: string;
  cat: string;
  /** Кто проставил категорию: её даёт коллегия по удостоверению, а не регион. */
  by: string;
  /** Аттестация действует до; `null` — категория ещё не подтверждена. */
  att: string | null;
  /** Дней до конца срока; отрицательное — просрочена. */
  left: number | null;
  r: number;
  pl: number;
  /** Где сейчас: наряд или свободен. */
  duty: string;
};

const REGION: Reg[] = [
  { nm: 'Оралбай Ержан', av: A(39), cat: 'Первая категория', by: 'коллегия ФНТ РК · 2024', att: '14.11.2026', left: 78, r: 9, pl: 24, duty: 'Кубок РК · выезд' },
  { nm: 'Дәулет Жасұлан', av: A(75), cat: 'Национальная', by: 'коллегия ФНТ РК · 2023', att: '02.10.2026', left: 35, r: 14.5, pl: 11, duty: 'свободен' },
  { nm: 'Аманжол Нұрлан', av: A(53), cat: 'Первая категория', by: 'коллегия ФНТ РК · 2025', att: '19.09.2026', left: 22, r: 7, pl: 33, duty: 'Первенство Павлодара' },
  { nm: 'Жақсылық Бекзат', av: A(13), cat: 'Вторая категория', by: 'коллегия ФНТ РК · 2025', att: '30.08.2026', left: 2, r: 4, pl: 58, duty: 'свободен' },
  { nm: 'Сәрсенов Аян', av: A(23), cat: 'Вторая категория', by: 'коллегия ФНТ РК · 2024', att: '11.07.2026', left: -48, r: 3, pl: 71, duty: 'свободен' },
  { nm: 'Тлеуова Аружан', av: AW(21), cat: '—', by: 'удостоверение у коллегии (Э5.6)', att: null, left: null, r: 0, pl: 0, duty: 'свободен' },
];

/* ── Э15.1 · Судьи региона ──────────────────────────────────────── */

const REG_GRID = 'minmax(0,1.9fr) minmax(0,1.5fr) minmax(0,1.3fr) 48px 56px 128px';

/** Допуск судьи одним выражением — одно на оба формата: просроченная
    аттестация, истекающая и неподтверждённая категория считаются в одном месте,
    иначе таблица и список строк разойдутся на первой же правке правила. */
const access15 = (j: Reg) => {
  const over = j.left !== null && j.left < 0;
  const soon = j.left !== null && j.left >= 0 && j.left <= 30;
  const wait = j.att === null;
  return {
    over,
    soon,
    wait,
    pill: {
      t: wait ? 'ЖДЁТ КАТЕГОРИИ' : over ? 'НЕ ДОПУЩЕН' : 'ДОПУЩЕН',
      cls: (wait ? 'wait' : over ? 'bad' : 'live') as Cls,
    },
    /** Срок словами: на телефоне колонки «Аттестация до» нет, и срок уходит
        в подпись строки — но остаётся тем же сроком. */
    att: wait
      ? 'категория не подтверждена'
      : over
        ? `аттестация просрочена ${-(j.left as number)} дн. назад`
        : soon
          ? `аттестация до ${j.att} — осталось ${j.left} дн.`
          : `аттестация до ${j.att}`,
  };
};

/** Сноска реестра: экран показывает свой срез. Текст один на оба формата — на
    десктопе он стоит подвалом таблицы, на телефоне плашкой под списком. */
const Foot15_1 = () => (
  <>
    Экран показывает свой срез, а не весь реестр: судей в стране больше, и они — в общем
    рейтинге судей (Э0.12)
  </>
);

/** Бланк приглашения — один на оба формата: на десктопе он лежит в
    `InlineDialog`, на телефоне в нижнем листе, а поля и правило одни и те же. */
const InviteForm15_1 = ({ wide }: { wide?: boolean }) => (
  <>
    <FormGrid>
      <TextInput label="Фамилия и имя" value="Есенов Алишер" wide />
      <TextInput label="Телефон" value="+7 705 481-22-14" wide={wide} />
      <PickField label="Город" value="Павлодар" wide={wide} />
    </FormGrid>
    <div className="mt-3">
      <Bar>
        Категорию приглашение не даёт ✳: её по-прежнему проставляет судейская коллегия по
        удостоверению. До подтверждения судья числится «ждёт категории» и в наряд не ставится.
      </Bar>
    </div>
  </>
);

export function Judges15_1() {
  const [invite, setInvite] = useState(false);
  return (
    <WebApp
      role={R15}
      nav="Судьи региона"
      title="Судьи региона"
    >
      {/* Плиток-счётчиков над таблицей больше нет ✳ (30.08.2026): экран — реестр
          судей региона, и четыре плитки повторяли то, что и так стоит в самих
          строках, — категорию, срок аттестации, наряд. Просроченная аттестация
          видна подсветкой строки, а не числом «2» над таблицей. */}

      {/* Акцент полосы один — приглашение: то, ради чего председатель сюда и
          заходит. Общий рейтинг он смотрит редко — тихой кнопкой. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-neutral-500">
          Свой регион · чужие судьи видны в общем рейтинге, но не здесь
        </span>
        <span className="flex items-center gap-2">
          <Button variant="ghost" data-to="Э0.12">
            <ListChecks size={14} /> Рейтинг судей
          </Button>
          <Button variant="primary" onPress={() => setInvite(true)}>
            <UserPlus size={15} /> Пригласить судью
          </Button>
        </span>
      </div>

      <Panel
        title="Судьи Павлодарской области"
        extra={<Cap>категорию проставляет коллегия — регион приглашает и ведёт</Cap>}
        flush
      >
        <Sheet
          grid={REG_GRID}
          cols={[
            'Судья',
            'Категория и кто подтвердил',
            'Аттестация до',
            <Th key="r">R</Th>,
            <Th key="pl">Место</Th>,
            'Допуск',
          ]}
        >
          {REGION.map((j) => {
            /* Просроченная аттестация подкрашена ✳: такого судью в наряд не
               ставят, и видно это должно быть до того, как его туда поставили,
               а не после. Истекающая — жёлтым: ещё можно успеть. */
            const { over, soon, wait, pill } = access15(j);
            return (
              <button
                key={j.nm}
                type="button"
                data-to="Э15.2"
                data-row
                className={
                  'grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] ' +
                  (over ? 'bg-red-50/50 hover:bg-red-50' : soon ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-neutral-50')
                }
                style={{ gridTemplateColumns: REG_GRID }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm">
                    <Avatar.Image alt={j.nm} src={j.av} />
                    <Avatar.Fallback>{j.nm.slice(0, 1)}</Avatar.Fallback>
                  </Avatar>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13.5px] font-medium">{j.nm}</span>
                    <span className="block truncate text-xs text-neutral-500">{j.duty}</span>
                  </span>
                </span>
                <span className="min-w-0 leading-tight text-neutral-700">
                  {j.cat}
                  <span className="block truncate text-[11px] text-neutral-400">{j.by}</span>
                </span>
                <span className={'leading-tight ' + (over ? 'font-medium text-red-600' : soon ? 'font-medium text-amber-700' : 'text-neutral-600')}>
                  {j.att ?? 'не подтверждена'}
                  {over && <span className="block text-[11px]">просрочена {-(j.left as number)} дн. назад</span>}
                  {soon && <span className="block text-[11px]">осталось {j.left} дн.</span>}
                </span>
                <span className="text-right font-semibold tabular-nums">{j.r ? num(j.r) : '—'}</span>
                <span className="text-right tabular-nums text-neutral-600">{j.pl ? '№' + j.pl : '—'}</span>
                <span>
                  <P t={pill.t} cls={pill.cls} />
                </span>
              </button>
            );
          })}
        </Sheet>
        {/* Чужой регион — отдельной строкой ✳: так видно, что экран показывает
            свой срез, а не весь реестр. Иначе председатель считает, что судей
            в стране столько же, сколько у него. */}
        <Foot><Foot15_1 /></Foot>
      </Panel>

      {invite && (
        <InlineDialog
          title="Пригласить судью"
          sub="Приглашение добавляет человека в реестр региона"
          to="Э15.1"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">Приглашение уйдёт по СМС</span>
              <Button variant="ghost" onPress={() => setInvite(false)}>Закрыть</Button>
              <Button variant="primary" onPress={() => setInvite(false)}>Пригласить</Button>
            </>
          }
        >
          <InviteForm15_1 />
        </InlineDialog>
      )}
    </WebApp>
  );
}

/** Тот же реестр на телефоне ✳ (30.08.2026).

    Таблица из шести колонок в 392 px не живёт: категорию с тем, кто её
    подтвердил, срок аттестации, R, место и допуск одновременно показать нечем.
    Строка отвечает на тот же вопрос иначе: имя, главное число (R) и состояние
    допуска — в строке, всё остальное подписью под именем. Срок аттестации при
    этом не пропадает и не перестаёт гореть: он считается тем же `access15`,
    что и колонка на десктопе.

    Ряд «рейтинг судей + пригласить» разъехался в две кнопки друг под другом —
    в одну строку они на телефоне не встают, а приглашение остаётся главным
    действием и стоит первым. */
export function Judges15_1Ph() {
  const [invite, setInvite] = useState(false);
  return (
    <Ph15 nav="Судьи региона" title="Судьи региона" sub="Павлодарская область · сезон 2026">
      <div className="mb-3 flex flex-col gap-2">
        <Button variant="primary" className="w-full" onPress={() => setInvite(true)}>
          <UserPlus size={15} /> Пригласить судью
        </Button>
        <Button variant="ghost" className="w-full" data-to="Э0.12">
          <ListChecks size={14} /> Рейтинг судей
        </Button>
      </div>

      <div className="mb-4">
        <Rows>
          {REGION.map((j) => {
            const a = access15(j);
            return (
              <Row
                key={j.nm}
                av={j.av}
                to="Э15.2"
                nm={j.nm}
                sub={`${j.cat} · ${a.att} · ${j.duty}`}
                val={j.r ? num(j.r) : '—'}
                pill={a.pill}
              />
            );
          })}
        </Rows>
      </div>

      <Bar><Foot15_1 /></Bar>

      {invite && (
        <PhoneDialog
          title="Пригласить судью"
          sub="Приглашение уйдёт по СМС и добавит человека в реестр региона"
          to="Э15.1"
          onClose={() => setInvite(false)}
          foot={
            <>
              <Button variant="primary" className="w-full" onPress={() => setInvite(false)}>Пригласить</Button>
              <Button variant="ghost" className="w-full" onPress={() => setInvite(false)}>Закрыть</Button>
            </>
          }
        >
          <InviteForm15_1 wide />
        </PhoneDialog>
      )}
    </Ph15>
  );
}

const Judges15_1States = () => (
  <States>
    <Shot
      tone="warning"
      title="У судьи истекает аттестация"
      text="Строка подсвечена, действие ведёт на аттестацию — в наряд такого не ставят."
    >
      <Frag>
        <Rows>
          <Row nm="Жақсылық Бекзат" sub="аттестация до 30.08.2026 — осталось 2 дня" pill={{ t: 'ИСТЕКАЕТ', cls: 'wait' }} action="На аттестацию" actionTo="Э5.13" />
          <Row nm="Сәрсенов Аян" sub="аттестация просрочена 48 дней назад" pill={{ t: 'НЕ ДОПУЩЕН', cls: 'bad' }} action="На аттестацию" actionTo="Э5.13" />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="info" title="Регион пуст" text="Приглашений ещё не было.">
      <Frag>
        <EmptyBox
          title="В реестре региона никого нет"
          text="Пригласите судью — категорию по удостоверению проставит коллегия."
          action={<Button variant="primary"><UserPlus size={15} /> Пригласить судью</Button>}
        />
      </Frag>
    </Shot>
  </States>
);

/* ── Э15.2 · Карточка судьи региона ─────────────────────────────── */

/* Та же карточка, что видят все (Э0.13), плюс полоса действий региона ✳.
   Второй карточки на того же человека быть не должно: рейтинг, история
   судейства и категория считаются одинаково и разъедутся на первой же правке
   Положения. */
const CARD: JudgeMe = { nm: 'Дәулет Жасұлан', cat: 'Национальная категория', region: 'Павлодар', pl: 11, s1: 7.5, s2: 4, s3: 3, s4: 0 };
const CARD_TOURS: JudgeTour[] = [
  { nm: 'Первенство Павлодарской области', when: '18–19.05', city: 'Павлодар', kind: 'Региональные', post: 'Главный судья', base: 1, k: 1.5 },
  { nm: 'Кубок Казахстана 2026', when: '18–22.02', city: 'Астана', kind: 'Республиканские', post: 'Судья стола', base: 3, k: 1.5 },
  { nm: 'Первенство Павлодара', when: '25.01', city: 'Павлодар', kind: 'Региональные', post: 'Судья стола', base: 1, k: 1 },
];

export function Card15_2() {
  return (
    <WebApp
      role={R15}
      nav="Судьи региона"
      title="Карточка судьи региона"
      back={{ label: 'Судьи региона', to: 'Э15.1' }}
    >
      {/* Полоса действий региона — над карточкой ✳: карточка одна на всю
          систему и читается всеми, а действия по ней есть только у своего
          региона. Акцент полосы один — наряд: остальное реже. */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-neutral-500">
          Ваш судья: наряд, аттестация и документы — ваши; рейтинг считает система
        </span>
        <span className="flex items-center gap-2">
          <Button variant="ghost" data-to="Э15.4">
            <Send size={14} /> Внести документ на S3 / S4
          </Button>
          <Button variant="ghost">
            <GraduationCap size={14} /> Отправить на аттестацию
          </Button>
          <Button variant="primary" data-to="Э15.3">
            <CalendarDays size={15} /> Поставить в наряд
          </Button>
        </span>
      </div>

      <JudgeCard me={CARD} tours={CARD_TOURS} />
    </WebApp>
  );
}

/** Та же карточка на телефоне ✳ (30.08.2026).

    Общую `JudgeCard` (Э0.13) здесь не переписываем и не ужимаем: она одна на
    всю систему, и телефонная её копия разъехалась бы с широкой на первой же
    правке Положения. Вместо этого из тех же данных (`CARD`, `CARD_TOURS`)
    собран компактный кадр: кто это, балл и его слагаемые, история судейства с
    тем же `tourPoints`.

    Второй формат тут честно показывает меньше: паспортная часть карточки
    (кто подтвердил категорию, с какого года в реестре), пояснения к S1–S4 и
    зачёт по Положению остаются в полной карточке — на 392 px они вытеснили бы
    то, за чем на карточку и приходят с телефона: балл и наряд. Об этом сказано
    плашкой, а не умолчанием. */
export function Card15_2Ph() {
  const r = CARD.s1 + CARD.s2 + CARD.s3 + CARD.s4;
  return (
    <Ph15
      nav="Судьи региона"
      title="Карточка судьи региона"
      back={{ label: 'Судьи региона', to: 'Э15.1' }}
    >
      {/* Действия региона — первым: с телефона на карточку заходят, чтобы
          поставить судью в наряд, а не читать её. Акцент один. */}
      <div className="mb-3 flex flex-col gap-2">
        <Button variant="primary" className="w-full" data-to="Э15.3">
          <CalendarDays size={15} /> Поставить в наряд
        </Button>
        <Button variant="ghost" className="w-full" data-to="Э15.4">
          <Send size={14} /> Внести документ на S3 / S4
        </Button>
        <Button variant="ghost" className="w-full">
          <GraduationCap size={14} /> Отправить на аттестацию
        </Button>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar size="lg">
            <Avatar.Fallback>{CARD.nm.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[15px] font-semibold">{CARD.nm}</span>
            <span className="block text-xs text-neutral-500">{CARD.cat} · регион учёта {CARD.region}</span>
          </span>
        </div>
        <div className="flex items-baseline gap-3 border-t border-neutral-100 px-4 py-3">
          <span className="text-3xl font-bold tabular-nums tracking-tight">{num(r)}</span>
          <span className="text-xs leading-tight text-neutral-500">
            балл R за сезон · №{CARD.pl} в рейтинге судей
          </span>
        </div>
      </div>

      {/* Слагаемые — четырьмя числами: подписи к ним («что такое S3») живут в
          полной карточке, а здесь важно, чего не хватает. */}
      <Panel title="Из чего собрался балл" sub="разбор с пояснениями — в полной карточке" flush>
        <div className="grid grid-cols-4 divide-x divide-neutral-100">
          {([['S1', CARD.s1], ['S2', CARD.s2], ['S3', CARD.s3], ['S4', CARD.s4]] as const).map(([k, v]) => (
            <div key={k} className="px-2 py-2.5 text-center">
              <div className={'text-[17px] font-semibold tabular-nums ' + (v === 0 ? 'text-neutral-400' : '')}>
                {num(v)}
              </div>
              <div className="mt-0.5 text-[11px] text-neutral-500">{k}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={'История судейства · ' + CARD_TOURS.length} sub="кем был на старте и какой коэффициент" flush>
        <div className="divide-y divide-neutral-100">
          {CARD_TOURS.map((t) => {
            const pts = tourPoints(t);
            return (
              <Row
                key={t.nm + t.when}
                nm={t.nm}
                sub={`${t.when} · ${t.city} · ${t.post} · ${t.k === 1 ? 'без коэффициента' : '× ' + num(t.k)}`}
                val={(pts < 0 ? '' : '+') + num(pts)}
              />
            );
          })}
        </div>
      </Panel>

      <Bar>
        Карточку никто не заполняет руками: она собирается из турниров, нарядов и подтверждённых
        документов. На телефоне показано главное — балл, слагаемые и история судейства; паспортная
        часть и зачёт по Положению остаются в полной карточке.
      </Bar>
    </Ph15>
  );
}

const Card15_2States = () => (
  <States>
    <Shot
      tone="info"
      title="Судья из чужого региона"
      text="Карточка открыта — рейтинг-лист общий, — но действий нет: он не ваш."
    >
      <Frag>
        <Rows>
          {/* Подпись укорочена ✳: в кадре она стоит вплотную к значку «ЧУЖОЙ
              РЕГИОН», и длинное начало («карточка на чтение:») выдавливало
              хвост «ведёт его регион» — то есть весь смысл строки. Что
              карточка на чтение, сказано заголовком кадра. */}
          <Row nm="Пак Сергей · Шымкент" sub="наряд, аттестацию и документы ведёт его регион" pill={{ t: 'ЧУЖОЙ РЕГИОН', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Категория ждёт подтверждения"
      text="В наряд такой судья не ставится — сначала удостоверение и коллегия."
    >
      <Frag>
        <Rows>
          <Row nm="Тлеуова Аружан" sub="удостоверение у коллегии (Э5.6) · S2 не начисляется" pill={{ t: 'ЖДЁТ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э15.3 · Наряды региона ─────────────────────────────────────── */

type Start = { nm: string; when: string; city: string; reg: boolean; need: number; got: number; who: string };

const STARTS: Start[] = [
  { nm: 'Первенство Павлодарской области', when: '12–14.09', city: 'Павлодар', reg: true, need: 8, got: 6, who: 'гл. судья Дәулет Ж. · секретарь Аманжол Н.' },
  { nm: 'Турнир памяти Мусина', when: '28.09', city: 'Экибастуз', reg: true, need: 4, got: 4, who: 'гл. судья Аманжол Н.' },
  { nm: 'Открытое первенство области до 15 лет', when: '19.10', city: 'Павлодар', reg: true, need: 6, got: 1, who: 'наряд не собран' },
  /* «От вас» стоит первым ✳: республиканская строка на экране региона живёт
     ради одного факта — кто из своих судей туда уехал (от выезда зависит
     коэффициент 1,5, TZ §7.2). Когда фраза начиналась с «наряд собирает
     председатель ГСК», обрезка колонки съедала именно имя. */
  { nm: 'Кубок Казахстана 2026', when: '18–22.02', city: 'Астана', reg: false, need: 0, got: 0, who: 'от вас: Оралбай Е. · наряд собирает председатель ГСК' },
];

/** Наряд выбранного старта: место в бригаде и кто на нём. Судей столов по
    именам показываем только там, где решение ещё принимается; в собранных
    нарядах поимённое распределение по столам — дело главного судьи (Э6.5). */
type Slot = { post: string; nm?: string };
const CREWS: Record<string, Slot[]> = {
  'Первенство Павлодарской области': [
    { post: 'Главный судья', nm: 'Дәулет Жасұлан' },
    { post: 'Главный секретарь', nm: 'Аманжол Нұрлан' },
    { post: 'Судьи столов · 4 из 6', nm: '4 назначены' },
    { post: 'Судьи столов · ещё 2 места' },
  ],
  'Турнир памяти Мусина': [
    { post: 'Главный судья', nm: 'Аманжол Нұрлан' },
    { post: 'Главный секретарь', nm: 'Дәулет Жасұлан' },
    { post: 'Судьи столов · 2 из 2', nm: '2 назначены' },
  ],
  'Открытое первенство области до 15 лет': [
    { post: 'Главный судья' },
    { post: 'Главный секретарь' },
    { post: 'Судья стола', nm: 'Дәулет Жасұлан' },
    { post: 'Судьи столов · ещё 3 места' },
  ],
};

/** Сноска наряда: столы распределяет главный судья, а не регион. Один текст на
    оба формата. */
const Foot15_3 = () => (
  <>
    Столы между судьями распределяет главный судья на этапе системы проведения — здесь
    только состав бригады
  </>
);

/** Правило экрана: республиканский наряд собирает председатель ГСК. */
const Rule15_3 = () => (
  <Bar>
    Республиканский наряд собирает председатель ГСК — здесь он только виден: от выезда судьи
    зависит коэффициент 1,5 в его рейтинге (TZ §7.2).
  </Bar>
);

export function Duty15_3() {
  const [pick, setPick] = useState<string | null>(STARTS[2].nm);
  const cur = STARTS.find((t) => t.nm === pick);
  return (
    <WebApp
      role={R15}
      nav="Наряды региона"
      title="Наряды региона"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-neutral-500">
          {pick ? `Выбран старт: ${pick}` : 'Выберите старт, чтобы собрать наряд'}
        </span>
        {/* Добор — из своего реестра ✳: чужого региона в списке нет, поэтому
            кнопка ведёт в Э15.1, а не в общий реестр судей. */}
        <Button variant="primary" data-to="Э15.1">
          <UserPlus size={15} /> Добавить судью в наряд
        </Button>
      </div>

      <Panel title="Старты сезона" extra={<Cap>республиканские — на чтение</Cap>} flush>
        <div className="divide-y divide-neutral-100">
          {STARTS.map((t) => (
            /* Республиканский старт приглушён ✳, но со счётов не снят: от
               выезда судьи в чужой регион зависит коэффициент 1,5 (TZ §7.2),
               и председателю надо видеть, кто из его судей туда уехал. */
            <button
              key={t.nm}
              type="button"
              data-row
              data-on={pick === t.nm ? '' : undefined}
              onClick={t.reg ? () => setPick(pick === t.nm ? null : t.nm) : undefined}
              className={
                'grid w-full grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_64px_150px] items-center gap-3 px-4 py-2.5 text-left ' +
                (!t.reg ? 'cursor-default opacity-60' : '')
              }
            >
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13.5px] font-medium">{t.nm}</span>
                <span className="block truncate text-xs text-neutral-500">{t.when} · {t.city}</span>
              </span>
              {/* Колонка «кто в наряде» переносится, а не режется ✳: у
                  республиканской строки она длиннее прочих, и однострочный
                  truncate отрезал ей хвост. Имя своего судьи стоит в начале
                  фразы (см. STARTS) — под обрезку оно не попадает в любом
                  случае, а перенос показывает строку целиком. */}
              <span className="min-w-0 text-xs leading-snug text-neutral-500">{t.who}</span>
              <span className={'text-right text-[13px] font-medium tabular-nums ' + (t.reg && t.got < t.need ? 'text-amber-700' : 'text-neutral-700')}>
                {t.reg ? `${t.got} / ${t.need}` : ''}
              </span>
              <span className="text-right">
                <P
                  t={t.reg ? (t.got >= t.need ? 'НАРЯД СОБРАН' : 'НЕ СОБРАН') : 'РЕСПУБЛИКАНСКИЙ'}
                  cls={t.reg ? (t.got >= t.need ? 'live' : 'bad') : 'done'}
                />
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {cur && (
        <Panel
          title={'Наряд: ' + cur.nm}
          sub={`${cur.when} · ${cur.city}`}
          extra={
            /* Уровень, а не процесс: сколько мест бригады закрыто. */
            <Meter aria-label="Мест закрыто" maxValue={cur.need} value={cur.got} className="flex w-56 flex-col gap-1">
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
              <Meter.Output>{cur.got} из {cur.need} мест закрыто</Meter.Output>
            </Meter>
          }
          flush
        >
          <div className="divide-y divide-neutral-100">
            {(CREWS[cur.nm] ?? []).map((s) => (
              <div key={s.post} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-xs text-neutral-500">{s.post}</span>
                  <span className={'block truncate text-[13.5px] font-medium ' + (s.nm ? '' : 'text-amber-700')}>
                    {s.nm ?? 'не назначен'}
                  </span>
                </span>
                {/* Снять можно до начала старта — место освобождается. Кнопки
                    добора у пустых мест нет ✳: главное действие экрана одно и
                    стоит сверху, три одинаковые кнопки в соседних строках
                    спорили бы с ним. */}
                {s.nm && (
                  <Button size="sm" variant="ghost">
                    <Undo2 size={14} /> Снять из наряда
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Foot><Foot15_3 /></Foot>
        </Panel>
      )}

      <Rule15_3 />
    </WebApp>
  );
}

/** Те же наряды на телефоне ✳ (30.08.2026).

    Наряд досбирывают не за столом: судья отказался утром, и место закрывают из
    зала. Поэтому экран на телефоне тот же и с теми же действиями — старт
    выбирается строкой, состав бригады раскрывается под ним.

    Таблица стартов становится строками: название и даты — в строке, «сколько из
    скольких» главным значением, состояние значком. Уровень закрытых мест
    остаётся тем же `Meter`, но встаёт в тело панели во всю ширину: в заголовке
    на 392 px ему места нет. */
export function Duty15_3Ph() {
  const [pick, setPick] = useState<string | null>(STARTS[2].nm);
  const cur = STARTS.find((t) => t.nm === pick);
  return (
    <Ph15 nav="Наряды региона" title="Наряды региона" sub="Павлодарская область · сезон 2026">
      <div className="mb-3">
        <Button variant="primary" className="w-full" data-to="Э15.1">
          <UserPlus size={15} /> Добавить судью в наряд
        </Button>
      </div>

      <Panel title="Старты сезона" sub="республиканские — на чтение" flush>
        <div className="divide-y divide-neutral-100">
          {STARTS.map((t) => (
            <Row
              key={t.nm}
              nm={t.nm}
              sub={`${t.when} · ${t.city} · ${t.who}`}
              val={t.reg ? `${t.got} / ${t.need}` : undefined}
              pill={{
                t: t.reg ? (t.got >= t.need ? 'НАРЯД СОБРАН' : 'НЕ СОБРАН') : 'РЕСПУБЛИКАНСКИЙ',
                cls: t.reg ? (t.got >= t.need ? 'live' : 'bad') : 'done',
              }}
              on={pick === t.nm}
              onSelect={t.reg ? () => setPick(pick === t.nm ? null : t.nm) : undefined}
            />
          ))}
        </div>
      </Panel>

      {cur && (
        <Panel title={'Наряд: ' + cur.nm} sub={`${cur.when} · ${cur.city}`} flush>
          <div className="border-b border-neutral-100 px-4 py-2.5">
            <Meter aria-label="Мест закрыто" maxValue={cur.need} value={cur.got} className="flex w-full flex-col gap-1">
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
              <Meter.Output>{cur.got} из {cur.need} мест закрыто</Meter.Output>
            </Meter>
          </div>
          <div className="divide-y divide-neutral-100">
            {(CREWS[cur.nm] ?? []).map((s) => (
              <div key={s.post} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-xs text-neutral-500">{s.post}</span>
                  <span className={'block truncate text-[13.5px] font-medium ' + (s.nm ? '' : 'text-amber-700')}>
                    {s.nm ?? 'не назначен'}
                  </span>
                </span>
                {s.nm && (
                  <Button size="sm" variant="ghost">
                    <Undo2 size={14} /> Снять
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Foot><Foot15_3 /></Foot>
        </Panel>
      )}

      <Rule15_3 />
    </Ph15>
  );
}

const Duty15_3States = () => (
  <States>
    <Shot tone="warning" title="Наряд не закрыт до старта" text="Видно, сколько мест осталось и до какого числа.">
      <Frag>
        <Rows>
          <Row nm="Открытое первенство области до 15 лет · 19.10" sub="закрыто 1 место из 6 · до старта 22 дня" val="1 / 6" pill={{ t: 'НЕ СОБРАН', cls: 'bad' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            Матч не стартует без судьи на столе (TZ §4.7) — незакрытый наряд это не формальность.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="info" title="Судья уехал на республиканский старт" text="Виден как занятый: его наряд собрал ГСК.">
      <Frag>
        <Rows>
          <Row nm="Оралбай Ержан" sub="Кубок Казахстана, Астана · 18–22.02 · коэффициент 1,5 за выезд" pill={{ t: 'ЗАНЯТ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э15.4 · Начисления региона ─────────────────────────────────── */

/** Документ на S3/S4: зона данных требует пять вещей — документ, судью,
    категорию начисления, состояние и балл, — поэтому таблица, а не строки
    списка: балл и категория читаются колонками сверху вниз. */
type Doc15 = {
  doc: string;
  sub: string;
  who: string;
  cat: 'S3' | 'S4';
  /** Балл: принятый — число, остальным — что подсказывает Положение. */
  pts: string;
  st: string;
  cls: Cls;
  draft?: boolean;
};

const DOCS15: Doc15[] = [
  { doc: 'Семинар судей области', sub: 'подан 12.06.2026', who: 'Дәулет Жасұлан', cat: 'S3', pts: '+3', st: 'ПРИНЯТ', cls: 'live' },
  { doc: 'Работа в коллегии области, 6 месяцев', sub: 'подан 01.07.2026 · у рейтинговой комиссии', who: 'Аманжол Нұрлан', cat: 'S4', pts: '2', st: 'НА ПРОВЕРКЕ', cls: 'wait' },
  { doc: 'Благодарность акимата', sub: 'добавлен 18.08.2026 · ещё не подан', who: 'Жақсылық Бекзат', cat: 'S4', pts: '2', st: 'ЧЕРНОВИК', cls: 'reg', draft: true },
  { doc: 'Протокол теста аттестации', sub: 'отклонён 27.02.2026 — «скан не читается»', who: 'Сәрсенов Аян', cat: 'S3', pts: '—', st: 'ОТКЛОНЁН', cls: 'bad' },
];

const DOC_GRID = 'minmax(0,1.9fr) minmax(0,1fr) 44px 48px 116px 208px';

/** Сноска начислений: начисляет не регион. Один текст на оба формата. */
const Foot15_4 = () => (
  <>
    Начисляет не регион, а рейтинговая комиссия: регион подаёт документ, подтверждает
    председатель ГСК (TZ §7.2). Иначе балл судьи зависел бы от того, в каком регионе он
    состоит
  </>
);

/** Бланк подачи документа — один на оба формата: на десктопе он в
    `InlineDialog`, на телефоне в нижнем листе, поля те же. */
const DocForm15_4 = ({ wide }: { wide?: boolean }) => (
  <FormGrid>
    <PickField label="Судья" value="Дәулет Жасұлан" wide={wide} />
    <PickField label="Категория начисления" value="S3 · повышение квалификации" wide={wide} />
    <TextInput label="Документ" value="Сертификат семинара судей области" wide />
    <FileDrop label="Скан документа" hint="PDF или JPG · до 10 МБ" />
  </FormGrid>
);

export function Points15_4() {
  const [submit, setSubmit] = useState(false);
  return (
    <WebApp
      role={R15}
      nav="Начисления"
      title="Начисления региона"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        {/* Начисляет не регион ✳: регион подаёт, подтверждает председатель ГСК
            (TZ §7.2) — это сказано прямо в полосе действия. */}
        <span className="text-[12.5px] text-neutral-500">
          Регион подаёт — подтверждает рейтинговая комиссия (председатель ГСК)
        </span>
        <Button variant="primary" onPress={() => setSubmit(true)}>
          <Send size={15} /> Подать документ
        </Button>
      </div>

      <Panel title="Документы региона" extra={<Cap>S1 и S2 система считает сама</Cap>} flush>
        <Sheet
          grid={DOC_GRID}
          cols={['Документ', 'Судья', 'Кат.', <Th key="p">Балл</Th>, 'Состояние', '']}
        >
          {DOCS15.map((d) => (
            <div key={d.doc} className="grid items-center gap-3 px-4 py-2.5 text-[13px]" style={{ gridTemplateColumns: DOC_GRID }}>
              <span className="min-w-0 leading-tight">
                <span className="block truncate font-medium">{d.doc}</span>
                <span className="block truncate text-xs text-neutral-500">{d.sub}</span>
              </span>
              <span className="truncate text-neutral-600">{d.who}</span>
              <span className="text-neutral-600">{d.cat}</span>
              <span className={'text-right font-semibold tabular-nums ' + (d.cls === 'live' ? 'text-green-700' : 'text-neutral-500')}>
                {d.pts}
              </span>
              <span><P t={d.st} cls={d.cls} /></span>
              <span className="flex items-center justify-end gap-1.5">
                {/* Черновик живёт у региона: его можно подать, а можно отозвать —
                    пока документ не подан, комиссия его не видит. */}
                {d.draft && (
                  <>
                    <Button size="sm" variant="outline">Подать</Button>
                    <Button size="sm" variant="ghost">
                      <Undo2 size={13} /> Отозвать черновик
                    </Button>
                  </>
                )}
              </span>
            </div>
          ))}
        </Sheet>
        <Foot><Foot15_4 /></Foot>
      </Panel>

      {submit && (
        <InlineDialog
          title="Подать документ"
          sub="Уйдёт рейтинговой комиссии — подтверждает председатель ГСК"
          to="Э15.4"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">Балл подсказывает Положение</span>
              <Button variant="ghost" onPress={() => setSubmit(false)}>Закрыть</Button>
              <Button variant="primary" onPress={() => setSubmit(false)}>Подать</Button>
            </>
          }
        >
          <DocForm15_4 />
        </InlineDialog>
      )}
    </WebApp>
  );
}

/** Те же начисления на телефоне ✳ (30.08.2026).

    Таблица из шести колонок становится строками: документ и судья — в строке,
    балл главным значением, состояние значком, категория начисления (S3 или S4)
    уходит в подпись. Скан документа с телефона и подают: там его и снимают
    камерой, поэтому бланк на телефоне не урезан — те же четыре поля.

    Второй формат показывает меньше в одном месте: у черновика остаётся кнопка
    «Подать», а «Отозвать черновик» — нет. В строке телефона помещается одно
    действие, и это должно быть то, ради которого черновик заводили; отзыв
    остаётся на широком экране. */
export function Points15_4Ph() {
  const [submit, setSubmit] = useState(false);
  return (
    <Ph15 nav="Начисления" title="Начисления региона" sub="Павлодарская область · S3 и S4 по своим судьям">
      <div className="mb-3">
        <Button variant="primary" className="w-full" onPress={() => setSubmit(true)}>
          <Send size={15} /> Подать документ
        </Button>
      </div>

      <Panel title="Документы региона" sub="S1 и S2 система считает сама" flush>
        <div className="divide-y divide-neutral-100">
          {DOCS15.map((d) => (
            <Row
              key={d.doc}
              nm={d.doc}
              sub={`${d.who} · ${d.cat} · ${d.sub}`}
              val={d.pts}
              pill={{ t: d.st, cls: d.cls }}
              action={d.draft ? 'Подать' : undefined}
            />
          ))}
        </div>
        <Foot><Foot15_4 /></Foot>
      </Panel>

      {submit && (
        <PhoneDialog
          title="Подать документ"
          sub="Уйдёт рейтинговой комиссии — балл подсказывает Положение"
          to="Э15.4"
          onClose={() => setSubmit(false)}
          foot={
            <>
              <Button variant="primary" className="w-full" onPress={() => setSubmit(false)}>Подать</Button>
              <Button variant="ghost" className="w-full" onPress={() => setSubmit(false)}>Закрыть</Button>
            </>
          }
        >
          <DocForm15_4 wide />
        </PhoneDialog>
      )}
    </Ph15>
  );
}

const Points15_4States = () => (
  <States>
    <Shot tone="warning" title="Документ отклонён с причиной" text="Можно донести и подать снова.">
      <Frag>
        <Rows>
          <Row nm="Протокол теста аттестации · Сәрсенов А." sub="«скан не читается» · 27.02.2026" pill={{ t: 'ОТКЛОНЁН', cls: 'bad' }} action="Подать снова" />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Сколько баллов даёт сама работа председателя ⚠"
      text="В Положении о рейтинге такой строки нет — вопрос 15.5."
    >
      <Frag>
        <Rows>
          <Row nm="Работа председателем региональной коллегии" sub="федерация назвала это «доп. баллами», числа не назвала" pill={{ t: 'ВОПРОС 15.5', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд роли: экраны маршрута подряд ──────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.
    Коды, подписи и порядок — те же, что были: по ним сходятся flows/, данные
    роли и Storybook.

    У каждого экрана есть `alt` — тот же экран во втором формате ✳ (30.08.2026,
    решение владельца продукта «все экраны в обоих»): роль десктопная, второй
    кадр телефонный. Состояния (`States`) во втором формате не повторяются:
    состояние экрана — про ситуацию, а не про устройство. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    alt: () => <LoginPhone0_1 />,
    next: 'судьи своего региона',
  },
  'Э15.1': {
    cap: 'Судьи региона',
    view: () => (<><Judges15_1 /><Judges15_1States /></>),
    alt: () => <Judges15_1Ph />,
    next: 'строка судьи',
  },
  'Э15.2': {
    cap: 'Карточка судьи региона',
    view: () => (<><Card15_2 /><Card15_2States /></>),
    alt: () => <Card15_2Ph />,
    next: 'поставить в наряд',
  },
  'Э15.3': {
    cap: 'Наряды региона',
    view: () => (<><Duty15_3 /><Duty15_3States /></>),
    alt: () => <Duty15_3Ph />,
    next: 'документы на баллы',
  },
  'Э15.4': {
    cap: 'Начисления региона',
    view: () => (<><Points15_4 /><Points15_4States /></>),
    alt: () => <Points15_4Ph />,
  },
};

export function Role15Board() {
  return <Board role={R15} screens={SCREENS} />;
}
