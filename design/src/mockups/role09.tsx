/* Роль 9 · Судья — макеты по флоу на новом слое (HeroUI) ✳ (30.08.2026).
   Содержание, коды экранов и переходы — прежние (см. `flows/09-sudya.md` и
   `flows/data/role09.ts`); меняется подача: судья стола работает за столом с
   планшета (TZ §6), и экраны собраны оболочкой TabletApp нового слоя
   `kit/hero/app` — крупный счёт, кнопки под палец, минимум элементов.

   Прежнее решение «макеты — десктопом» (18.08.2026) снимается ✳: оно
   держалось на том, что у старого слоя не было своей планшетной рамки и борд
   роли читался бы как из другой системы. У нового слоя рамка есть и она
   общая для всех ролей — теперь борд честно показывает устройство роли.

   Три мысли, которые макеты обязаны передать:
   1. главный экран роли — ввод счёта: под палец и скорость (TZ §6), режим
      ввода выбирает сам судья стола (по очкам / по партиям / итог напрямую);
   2. расписание живёт у главного судьи: у стола вопрос один — «пара пришла —
      начинаем?», очереди стола на экране нет;
   3. подтверждение результата — единственное необратимое действие судьи за
      столом: дальше правит только главный судья (TZ §6). */

import { useState, type ReactNode } from 'react';
import {
  Check, History, Pause, Radio, RefreshCw, Table2, Timer, Trophy, Undo2,
} from 'lucide-react';
import { Avatar, Button, Chip } from '@heroui/react';
import {
  A, Bar, DataTable, DisabledAction, EmptyBox, FormGrid, GameCells, Pill, Row, Rows,
  ScreenScope, TabletApp, TextInput,
  type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* История судейства и её баллы — общие со всеми судейскими ролями: рейтинг
   ведётся по одному Положению (TZ §7.2), и считать балл второй формулой
   нельзя — она разъедется с кабинетом судьи при первой правке Положения. */
import { tourPoints, type JudgeTour } from './judge';
/* Маршрут судейской роли начинается раньше входа: судья заводит себя сам
   (Э0.7), а роль в наряде ему выдают уже потом. Без этой колонки борд и карта
   начинались с «Вход», и откуда взялся человек, из них было не видно. */
import { Login0_1, SignUpJudge0_7, SignUpJudge0_7States } from './role00';

/* ── Роль: разделы и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    Пункты nav — те же два слова: по ним их находит карта флоу. */
const NAV9: [ReactNode, string][] = [
  [<Trophy size={15} key="t" />, 'Мои турниры'],
  [<Table2 size={15} key="s" />, 'Мой стол'],
];

const R09: RoleUI = {
  num: '9',
  title: 'Судья',
  person: { nm: 'Оралбай Е.', rl: 'Судья · стол 4', av: A(39) },
  brandName: 'Чемпионат Казахстана 2026',
  brandSub: 'Одиночный · олимпийская · г. Астана',
  badge: 'ИДЁТ',
  nav: NAV9,
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. */
type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const P = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

/** Разделы роли на планшете — переключателем под шапкой: сайдбара у планшета
    нет, а два раздела старого меню («Мои турниры», «Мой стол») остаются теми
    же словами. `data-nav` — крючок карты флоу. */
const SectionNav = ({ active }: { active: string }) => (
  <div className="flex gap-1 self-start rounded-lg bg-neutral-100 p-1">
    {NAV9.map(([icon, label]) => (
      <button
        key={label}
        type="button"
        data-nav
        aria-current={label === active || undefined}
        className={
          'flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium ' +
          (label === active ? 'bg-white text-blue-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')
        }
      >
        {icon}
        {label}
      </button>
    ))}
  </div>
);

/** Подзаголовок раздела внутри экрана. */
const SecT = ({ children }: { children: ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{children}</div>
);

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI.

    Своей ширины у кадра нет ✳ (приёмка 30.08.2026): фиксированные 560px были
    шире узкой колонки полки — кнопки и значки уезжали за край и налезали на
    соседние кадры, — а широкие кадры, наоборот, зажимали. Ширину задаёт сама
    колонка: скоуп — flex-элемент тела кадра и растягивается на неё.
    ⚠ Дупликация с role05.tsx. */
const Frag = ({ children }: { children: ReactNode }) => (
  <ScreenScope>
    <div>{children}</div>
  </ScreenScope>
);

/* ── данные экранов ──────────────────────────────────────────────── */

type Assign = { t: string; sub: string; st: string; cls: Cls };

const ASSIGN: Assign[] = [
  { t: 'Чемпионат Казахстана 2026', sub: 'г. Астана · 12–16 марта · судья стола 4', st: 'ИДЁТ', cls: 'live' },
  { t: 'Спартакиада школьников', sub: 'г. Шымкент · 9–12 апреля · секретарь', st: 'НАРЯД СОБРАН', cls: 'reg' },
  { t: 'Кубок акима Павлодарской области', sub: 'г. Павлодар · 24–25 апреля · судья стола 1', st: 'НАРЯД СОБРАН', cls: 'reg' },
  { t: 'Кубок Казахстана 2026', sub: 'г. Алматы · 18–22 февраля · заместитель главного судьи', st: 'ЗАВЕРШЁН', cls: 'done' },
  { t: 'Первенство РК до 19 лет', sub: 'г. Караганда · 27–30 января · судья стола 2', st: 'ЗАВЕРШЁН', cls: 'done' },
];

/* лента событий матча: розыгрыши, партии, служебные события, тайм-ауты и
   карточки. Карточки — свой тон ✳: жёлтая и красная это единственное, о чём
   спрашивают после матча, и искать их в ровном списке строк судья не должен.

   Тон значка — по типу события, а не по стороне игрока ✳ (приёмка
   30.08.2026): очко любого игрока — «+1», «−1» — только у отмены, закрытие
   партии — служебное. Иначе судья, ищущий отмены глазами, принимает чужое
   очко за отмену. */
type Ev = { at: string; t: string; s: string; tone: 'win' | 'loss' | 'flat' | 'y' | 'r' | 'to' };

const EVENTS: Ev[] = [
  { at: '15:47', t: 'Очко — Смагулов Алан', s: 'счёт в партии 4: 8 : 6', tone: 'win' },
  { at: '15:46', t: 'Жёлтая карточка — Токаев Марат', s: 'предупреждение · вынес судья стола', tone: 'y' },
  { at: '15:45', t: 'Тайм-аут — Смагулов Алан', s: 'использован · 1 минута · второй за матч не берётся', tone: 'to' },
  { at: '15:44', t: 'Пауза 1 минута', s: 'запрошена Токаевым М. · отмечена судьёй стола', tone: 'flat' },
  { at: '15:43', t: 'Отмена последнего очка', s: 'вернули 6 : 6 — очко записано не той стороне', tone: 'loss' },
  { at: '15:42', t: 'Очко — Токаев Марат', s: 'счёт в партии 4: 6 : 6', tone: 'win' },
  { at: '15:41', t: 'Смена подачи', s: 'подача перешла к Токаеву М. · автоматически по счёту', tone: 'flat' },
  { at: '15:39', t: 'Партия 3 закрыта — 11 : 7', s: 'счёт по партиям стал 2 : 1 в пользу Смагулова А.', tone: 'flat' },
  { at: '15:22', t: 'Смена сторон', s: 'по регламенту, после второй партии', tone: 'flat' },
  { at: '14:58', t: 'Матч начат', s: 'стол 4 · первая подача — Смагулов А.', tone: 'flat' },
];

/** История судейства судьи стола. Тип и формула балла общие с остальными
    судейскими ролями (`judge.tsx`): рейтинг у них один.

    Видно и главное отличие роли: коэффициент 1,5 судье стола даётся не за
    место в бригаде, а только за выезд — командировку на республиканские
    соревнования из своего региона (TZ §7.2). */
const JUDGE_TOURS9: JudgeTour[] = [
  { nm: 'Чемпионат Казахстана 2026', when: '12–16.03', city: 'Астана', kind: 'Республиканские', post: 'Судья стола', base: 3, k: 1.5 },
  { nm: 'Кубок Казахстана 2026', when: '18–22.02', city: 'Павлодар', kind: 'Республиканские', post: 'Судья стола', base: 3, k: 1 },
  { nm: 'Первенство Павлодара', when: '25.01', city: 'Павлодар', kind: 'Региональные', post: 'Судья стола', base: 1, k: 1 },
  { nm: 'Кубок Иртыша', when: '02–03.06', city: 'Павлодар', kind: 'Региональные', post: 'Судья стола', base: 1, k: 1, miss: true },
];

const num9 = (n: number) => (n < 0 ? '' : '+') + String(Math.round(n * 10) / 10).replace('.', ',');

/* ── Э9.1 · Мои турниры ──────────────────────────────────────────── */

export function Tours9_1() {
  /* Баллы считаются формулой кабинета (`tourPoints`), а не второй копией:
     сумма под списком — та же, что увидит судья в Э0.11. */
  const s1 = JUDGE_TOURS9.reduce((s, t) => s + tourPoints(t), 0);
  const played = JUDGE_TOURS9.filter((t) => !t.miss).length;
  return (
    /* Значка «ИДЁТ» в шапке нет ✳: экран про сезон целиком, а не про идущий
       турнир — значок стоит на экранах матча (Э9.2–Э9.5). */
    <TabletApp title="Мои турниры" sub="Оралбай Ержан · судья · сезон 2026">
      <SectionNav active="Мои турниры" />

      {/* Назначения — списком с волосяными линиями: карточками с просветом
          пять назначений занимали весь экран. Строка ведёт на мой стол. */}
      <SecT>Мои назначения</SecT>
      <Rows>
        {ASSIGN.map((a) => (
          <Row key={a.t} nm={a.t} sub={a.sub} pill={{ t: a.st, cls: a.cls }} to="Э9.2" />
        ))}
      </Rows>
      <div className="text-xs leading-relaxed text-neutral-500">
        Отсужено {played} турнира за сезон · баллы S1 {num9(s1)} — рейтинг судья смотрит в кабинете,
        а не здесь; судье стола коэффициент 1,5 идёт только за выезд (TZ §7.2)
      </div>

      {/* Открытых приёмов и подачи заявок здесь больше нет ✳ (18.08.2026): они
          уехали в кабинет судьи (Э0.9, Э0.10). Подача жила у роли судьи стола —
          то есть у человека, который уже назначен: попасть на турнир мог только
          тот, кто на турнире уже есть. Экран роли — про работу на турнире, а не
          про то, как на него попасть. */}
      <SecT>Куда подавать заявки</SecT>
      <Rows>
        <Row
          nm="Турниры и заявки на судейство"
          sub="Открытые приёмы, мои заявки и решения — в кабинете судьи"
          pill={{ t: '3 ПРИЁМА', cls: 'reg' }}
          to="Э0.9"
        />
      </Rows>
    </TabletApp>
  );
}

const Tours9_1States = () => (
  <States>
    <Shot tone="info" title="Назначений нет" text="Пустое состояние со списком открытых приёмов.">
      <Frag>
        <EmptyBox
          title="Назначений нет"
          text="Открыт приём заявок на два турнира — можно подать заявку на судейство."
        />
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Заявки на судейство или прямое назначение — не решено"
      text="⚠ 12.6: сохраняется ли конкурс заявок. От ответа зависит, есть ли на экране кнопка «Подать заявку»."
    >
      <Frag>
        <Rows>
          <Row nm="Конкурс заявок" sub="наше допущение — судья подаёт заявку сам" pill={{ t: 'СЕЙЧАС ТАК', cls: 'reg' }} />
          <Row nm="Прямое назначение" sub="если так — кнопки подачи не будет" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э9.2 · Мой стол ─────────────────────────────────────────────── */

export function Table9_2() {
  return (
    <TabletApp title="Мой стол 4" sub="Чемпионат Казахстана 2026 · день 2 · 13 марта" badge="ИДЁТ">
      <SectionNav active="Мой стол" />

      {/* Очереди стола на экране нет ✳ (18.08.2026): расписание строит главный
          судья, и оно живёт в его руках — у судьи стола оно ничего не решало, а
          место занимало больше, чем сам матч. За столом вопрос один: пара
          пришла — начинаем? Подписи «вызвана пара» тоже нет: на экране одна
          карточка и одна кнопка. */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {([
            { av: A(32), nm: 'Смагулов Алан', sub: 'Алматы · клуб «Алатау»' },
            { av: A(51), nm: 'Токаев Марат', sub: 'Астана · клуб «Барыс»' },
          ] as const).map((p, i) => (
            <div key={p.nm} className={'flex flex-col items-center gap-1.5 text-center' + (i === 1 ? ' order-3' : '')}>
              <Avatar size="lg">
                <Avatar.Image alt={p.nm} src={p.av} />
                <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <div className="text-lg font-bold tracking-tight">{p.nm}</div>
              <div className="text-xs text-neutral-500">{p.sub}</div>
            </div>
          ))}
          <span className="order-2 text-sm font-semibold tracking-widest text-neutral-300">VS</span>
        </div>
        {/* Регламент — тот же, что на вводе счёта (Э9.3) и в итоге (Э9.5):
            три экрана одного матча не должны рассказывать про разные матчи.
            Режим по очкам назван заранее — его включил главный судья. */}
        <div className="mt-5 rounded-lg bg-neutral-50 px-4 py-2.5 text-center text-[12.5px] text-neutral-500">
          1/8 финала · до 4 побед в партиях · режим ввода — по очкам
        </div>
      </div>

      {/* Одна кнопка ✳ — и размером в ладонь: за столом решение одно.
          Неявка бывает реже и не должна стоять рядом с главным действием: её
          место в состояниях экрана, когда игрок не пришёл. */}
      <Button variant="primary" className="h-16 w-full text-lg" data-to="Э9.3">
        <Radio size={18} /> Старт матча
      </Button>
    </TabletApp>
  );
}

const Table9_2States = () => (
  <States>
    <Shot
      tone="info"
      title="Матча нет — «стол свободен»"
      text="Вызов придёт от главного судьи: расписание в его руках, судья стола его не ведёт."
    >
      <Frag>
        <EmptyBox
          title="Стол свободен"
          text="Пары на столе сейчас нет. Когда главный судья вызовет следующую, она появится здесь вместе с кнопкой старта."
        />
      </Frag>
    </Shot>

    {/* Неявка ушла с главного экрана ✳: она бывает реже старта и не должна
        стоять рядом с ним — судья за столом жмёт «Старт» десятки раз за день,
        а неявку пару раз за турнир.

        Кадр во всю ширину полки ✳ (приёмка 30.08.2026): в половинной колонке
        значок «НЕ ЯВИЛСЯ» и кнопка «Отметить неявку» — то, ради чего кадр и
        заведён, — отжимали строку до узкого столбика текста. */}
    <Shot
      tone="warning"
      title="Игрок не пришёл — вместо старта неявка ✳"
      text="Кнопка появляется, когда пару вызвали, а игрока нет: решение о технической победе принимает главный судья (Э6.6)."
      wide
    >
      <Frag>
        <Rows>
          <Row
            nm="Токаев Марат"
            sub="вызван 14:20 · на столе не появился"
            pill={{ t: 'НЕ ЯВИЛСЯ', cls: 'bad' }}
            action="Отметить неявку"
          />
        </Rows>
        <div className="mt-3">
          <Bar>
            Неявка судьи по поданной заявке — минус балл в его рейтинге (TZ §7.2); неявка игрока —
            решение главного судьи о технической победе, судья стола только отмечает факт.
          </Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="На турнире включён режим по очкам"
      text="Об этом сказано в карточке матча заранее."
    >
      <Frag>
        <Rows>
          {/* Регламент тот же, что в карточке матча выше и на вводе счёта ✳:
              «до 3 побед» в кадре спорило с «до 4 побед» на самом экране. */}
          <Row nm={`Матч до ${WIN} побед в партиях`} sub="партия до 11 очков, разница 2" pill={{ t: 'ПО ОЧКАМ', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э9.3 · Ввод счёта — главный экран роли ──────────────────────── */

type Pl = { av: string; nm: string; city: string };
type Mark = { to: boolean; y: number; r: number };

/** Регламент матча: до скольких побед в партиях (TZ §5). Тот же, что назван на
    «Моём столе» (Э9.2) и по которому сложился итог на «Результат отправлен»
    (Э9.5) — иначе три экрана одного матча рассказывают про разные матчи. */
const WIN = 4;
const PL: [Pl, Pl] = [
  { av: A(32), nm: 'Смагулов Алан', city: 'Алматы · «Алатау»' },
  { av: A(51), nm: 'Токаев Марат', city: 'Астана · «Барыс»' },
];

/** Карточка нарушения — жёлтый или красный прямоугольник, как у судьи в руке:
    её ищут глазами по цвету, а не читают подпись. */
const CardIco = ({ c }: { c: 'y' | 'r' }) => (
  <i className={'inline-block h-3.5 w-2.5 rounded-sm ' + (c === 'y' ? 'bg-amber-400' : 'bg-red-500')} />
);

/** Отметки игрока — тайм-аут и карточки прямо на его половине табло ✳
    (комментарий федерации, 09.2026).

    Стоят у счёта, а не журналом сбоку: судья решает, выносить ли следующую
    карточку, глядя на игрока, — и в этот момент должен видеть, что у того уже
    есть. Тайм-аут гаснет использованным: второй раз за матч его не берут, и
    держать это в голове судье незачем. */
function Marks({ m, live, off, onTo, onCard, onUndo }: {
  m: Mark;
  /** Тайм-аут этого игрока идёт прямо сейчас. */
  live: boolean;
  /** Матч закрыт — отметки только читаются. */
  off?: boolean;
  onTo: () => void;
  onCard: (c: 'y' | 'r') => void;
  /** Снять последнюю отметку: карточку выносят пальцем по живому матчу, и
      промахнуться по соседней кнопке легко. */
  onUndo: (k: 'to' | 'y' | 'r') => void;
}) {
  /* Отметка — не одна кнопка, а пара: тело ставит, «×» снимает. Отмена
     появляется только у выставленной ✳: пока ничего не выписано, снимать
     нечего. Отдельной кнопкой, а не повторным тапом по телу, потому что
     повторный тап уже занят — вторая жёлтая за матч бывает. */
  const pill = (tone: string, on: boolean, label: ReactNode, add: () => void, k: 'to' | 'y' | 'r') => (
    <span className={'inline-flex items-stretch overflow-hidden rounded-lg border text-xs font-medium ' + tone}>
      {off ? (
        <span className="flex items-center gap-1.5 px-2.5 py-1.5">{label}</span>
      ) : (
        <button type="button" className="flex items-center gap-1.5 px-2.5 py-1.5" onClick={add}>
          {label}
        </button>
      )}
      {on && !off && (
        <button
          type="button"
          aria-label="снять"
          className="border-l border-neutral-200 px-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          onClick={() => onUndo(k)}
        >
          ×
        </button>
      )}
    </span>
  );
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {pill(
        live
          ? 'border-blue-300 bg-blue-50 text-blue-700'
          : m.to
            ? 'border-neutral-200 bg-neutral-100 text-neutral-400'
            : 'border-neutral-200 bg-white text-neutral-500',
        live || m.to,
        <><Timer size={13} />{live ? 'идёт' : m.to ? 'взят' : 'тайм-аут'}</>,
        onTo,
        'to',
      )}
      {pill(
        m.y > 0 ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-neutral-200 bg-white text-neutral-500',
        m.y > 0,
        <><CardIco c="y" />{m.y > 1 ? `× ${m.y}` : 'жёлтая'}</>,
        () => onCard('y'),
        'y',
      )}
      {pill(
        m.r > 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-neutral-200 bg-white text-neutral-500',
        m.r > 0,
        <><CardIco c="r" />{m.r > 1 ? `× ${m.r}` : 'красная'}</>,
        () => onCard('r'),
        'r',
      )}
    </div>
  );
}

/** Половина табло — один игрок: имя, огромный счёт и кнопка очка.

    Указателя подачи здесь нет ✳: судья за столом и так знает, кто подаёт, а на
    экране это была строка мелким шрифтом под именем — прочитать её с
    расстояния всё равно нельзя. Половины равны и цветом ничего не выделяется:
    единственное, что должно бросаться в глаза, — сами числа. */
function Half({ av, nm, city, pts, onPoint, off, marks }: {
  av: string;
  nm: string;
  city: string;
  pts: number;
  onPoint: () => void;
  /** Матч закрыт, пауза, тайм-аут или партия ждёт подтверждения — очки не начисляются. */
  off?: boolean;
  /** Ряд отметок под именем: тайм-аут и карточки. */
  marks: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <Avatar size="md">
        <Avatar.Image alt={nm} src={av} />
        <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
      <div className="text-lg font-bold tracking-tight">{nm}</div>
      <div className="text-xs text-neutral-500">{city}</div>
      {/* Ряд отметок встал между именем и счётом ✳: цифру он потеснил, и это
          правильный размен — число всё ещё читается с другого конца стола, а
          тайм-аут и карточки видно, не отводя глаз от счёта. */}
      {marks}
      <div className="text-[88px] font-bold leading-none tracking-tighter tabular-nums">{pts}</div>
      <Button
        variant={off ? 'outline' : 'primary'}
        isDisabled={off}
        className="h-14 w-full text-lg"
        onPress={onPoint}
      >
        +1 очко
      </Button>
    </div>
  );
}

/** Число счёта, которое вписывают ✳ (комментарий федерации, 09.2026).

    Степперы «−/+» отсюда убраны: чтобы поставить 3 : 1, судья жал плюс трижды,
    а чтобы записать партию 11 : 9 — одиннадцать раз. Это тот же поочковый
    подсчёт, от которого федерация просила уйти. Поле выглядит самим числом —
    рамка появляется под пальцем и в фокусе: на табло главное по-прежнему
    цифра, а не форма вокруг неё. */
function ScoreInput({ v, big, onSet }: {
  v: number;
  /** Крупное число полосы «счёт по партиям». */
  big?: boolean;
  onSet: (n: number) => void;
}) {
  return (
    <input
      className={
        'rounded-lg border border-transparent bg-transparent text-center font-bold tabular-nums tracking-tight outline-none hover:border-neutral-300 focus:border-blue-500 ' +
        (big ? 'w-24 text-5xl' : 'w-20 text-4xl')
      }
      value={v}
      inputMode="numeric"
      /* Две цифры и в счёте партий тоже ✳: счёт бывает двузначным, а поле, в
         которое не влезает то, что судья видит на столе, хуже отсутствующего. */
      maxLength={2}
      size={2}
      aria-label="счёт"
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 2);
        onSet(d === '' ? 0 : Number(d));
      }}
      /* Тап выделяет число целиком: судья вписывает новое, а не дописывает
         цифру к старому. */
      onFocus={(e) => e.target.select()}
    />
  );
}

/** Ввод по очкам (TZ §6.2): каждое очко отдельной кнопкой, счёт видно с
    расстояния, последнее действие отменяется. Режим открывает на турнире
    главный судья соревнований. */
function ByPoints9_3({ pts, sets, swap, paused, off, done, ready, over, marks, hand, won, onSet, onDropHand, onPoint, onUndo, onSwap, onPause, onKeep, onDone }: {
  pts: [number, number];
  sets: [number, number][];
  swap: boolean;
  paused: boolean;
  off: boolean;
  done: boolean;
  /** Партия доиграна и ждёт подтверждения. */
  ready: boolean;
  /** Матч сыгран по регламенту: результат можно подтверждать. */
  over: boolean;
  /** Ряд отметок игрока — по индексу половины. */
  marks: (i: 0 | 1) => ReactNode;
  /** Итог по партиям задан руками, а не набран из сыгранных партий. */
  hand: boolean;
  won: (i: 0 | 1) => number;
  onSet: (i: 0 | 1, n: number) => void;
  onDropHand: () => void;
  onPoint: (i: 0 | 1) => void;
  onUndo: () => void;
  onSwap: () => void;
  onPause: () => void;
  onKeep: () => void;
  onDone: () => void;
}) {
  /* Смена сторон меняет местами половины экрана, а не игроков: после смены
     сторон человек, сидевший слева, оказывается справа, и судья ищет его там,
     где видит. Счёт при этом остаётся своим. */
  const order: [0 | 1, 0 | 1] = swap ? [1, 0] : [0, 1];
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5">
        {order.map((i) => (
          <Half
            key={PL[i].nm}
            {...PL[i]}
            pts={pts[i]}
            off={off || ready}
            marks={marks(i)}
            onPoint={() => onPoint(i)}
          />
        ))}
      </div>

      {/* Счёт по партиям — один раз и по центру, и его вписывают прямо здесь ✳
          (комментарий федерации, 09.2026): «указать только итоговый счёт в
          партиях». Это третий, самый короткий путь — судья не ведёт ни очки,
          ни счёт каждой партии, а ставит 3 : 1 и подтверждает. */}
      <div
        className={
          'flex items-center justify-center gap-6 rounded-xl border px-4 py-3 ' +
          (hand ? 'border-amber-300 bg-amber-50' : 'border-neutral-200 bg-white')
        }
      >
        <ScoreInput big v={won(order[0])} onSet={(n) => onSet(order[0], n)} />
        <span className="flex flex-col items-center leading-tight">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Счёт по партиям
          </span>
          <span className={'text-[11px] ' + (hand ? 'font-medium text-amber-700' : 'text-neutral-400')}>
            {hand ? 'итог задан вручную' : 'впишите итог — партии заполнять не нужно'}
          </span>
        </span>
        <ScoreInput big v={won(order[1])} onSet={(n) => onSet(order[1], n)} />
      </div>

      {/* Сыгранные партии — как на табло: пара чисел столбиком, победная цифра
          тёмная. Номера нет: он читается по месту в ряду, а идущая партия
          видна по крупным числам выше.

          Задал итог руками — партии молчат ✳: показывать 11–9 под счётом,
          который набран не из них, значит врать. Вернуть счёт к партиям можно
          той же строкой. */}
      {hand ? (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-md bg-neutral-100 px-2.5 py-1.5 text-neutral-500">
            партии не заполнялись — записан итог матча
          </span>
          <button
            type="button"
            className="rounded-md px-2.5 py-1.5 font-medium text-blue-600 hover:bg-blue-50"
            onClick={onDropHand}
          >
            считать по партиям
          </button>
        </div>
      ) : sets.length ? (
        <div className="flex justify-center">
          <GameCells games={sets} />
        </div>
      ) : (
        <div className="text-center text-xs text-neutral-400">партий ещё нет</div>
      )}

      {/* Полоса управления живёт внутри ввода по очкам: отмена, смена сторон и
          пауза — про сам розыгрыш. На вкладке «По партиям» их нет, а после
          подтверждения матча нет вовсе: счёт стал итогом. */}
      {!done && (
        <div className="flex gap-2">
          <Button variant="outline" className="h-12 flex-1" onPress={onUndo}>
            <Undo2 size={15} /> Отменить последнее
          </Button>
          <Button variant="outline" className="h-12 flex-1" onPress={onSwap}>
            <RefreshCw size={15} /> Смена сторон
          </Button>
          <Button variant={paused ? 'primary' : 'outline'} className="h-12 flex-1" onPress={onPause}>
            <Pause size={15} /> {paused ? 'Продолжить' : 'Пауза'}
          </Button>
        </div>
      )}

      {/* Решение — внизу, под счётом: подтверждают то, на что смотрят.

          Партия доиграна — счёт держится на экране, пока судья его не
          подтвердит, и кнопка появляется только в этот момент. Пока она стоит,
          кнопки матча нет: главная одна. Два одинаково главных «подтвердить»
          рядом судья за столом выбирает не глядя, а подтвердить матч с
          незакрытой партией нельзя. */}
      {ready && !done && (
        <Button variant="primary" className="h-14 w-full text-base" onPress={onKeep}>
          <Check size={16} /> Подтвердить партию {sets.length + 1} · {pts[0]} : {pts[1]}
        </Button>
      )}
      {!ready && !done && over && (
        <Button variant="primary" className="h-14 w-full text-base" data-to="Э9.5" onPress={onDone}>
          <Check size={16} /> Подтвердить результат · {won(order[0])} : {won(order[1])}
        </Button>
      )}
      {/* Матч не доигран — на месте кнопки сказано, чего ждут ✳: пустое место
          читается как «сломалось», а серая кнопка — как «нажми ещё раз». */}
      {!ready && !done && !over && (
        <div className="rounded-lg bg-neutral-50 py-3 text-center text-[13px] text-neutral-500">
          Матч идёт: до {WIN} побед в партиях, сейчас {won(order[0])} : {won(order[1])}
        </div>
      )}
    </div>
  );
}

/** Ввод по партиям (TZ §6.1) — второй способ отсудить матч, а не просмотр ✳
    (комментарий федерации, 09.2026).

    Планшетов у федерации нет, а с телефона вести счёт по каждому очку и
    одновременно переворачивать настольный счётчик тяжело или невозможно — одна
    рука занята. Поэтому режим доступен всегда и выбирается самим судьёй стола;
    по очкам при этом не отменяется.

    Состояние общее с вводом по очкам: закрытые партии — из `sets`, идущая — из
    текущего счёта. Переключиться можно посреди матча, и ничего не теряется —
    иначе выбор пришлось бы делать до первого розыгрыша, вслепую. */
function BySets9_3({ sets, pts, done, over, marks, won, onSet, onKeep, onDone }: {
  sets: [number, number][];
  pts: [number, number];
  done: boolean;
  /** Матч сыгран по регламенту: результат можно подтверждать. */
  over: boolean;
  marks: (i: 0 | 1) => ReactNode;
  /** Партий выиграно — общий счётчик: из партий или из введённого руками итога. */
  won: (i: 0 | 1) => number;
  onSet: (i: 0 | 1, n: number) => void;
  onKeep: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Что теряется, когда ведут по партиям, сказано прямо на экране ✳:
          по этому столу нет ни прямого эфира, ни поочковой аналитики, ни
          наложения счёта на трансляцию (TZ §6.3). */}
      <Bar tone="warning">
        Матч ведут по партиям: судья вносит итог каждой партии. По этому столу нет прямого эфира и
        поочковой аналитики — счёт на трансляцию не накладывается.
      </Bar>

      {/* Счёт партии вписывают числом ✳: степпер требовал одиннадцати нажатий
          на партию — это тот же поочковый подсчёт, только медленнее. */}
      <div className="grid grid-cols-2 gap-3.5">
        {([0, 1] as const).map((i) => (
          <div key={PL[i].nm} className="flex flex-col items-center gap-2.5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex w-full items-center gap-2.5">
              <Avatar size="sm">
                <Avatar.Image alt={PL[i].nm} src={PL[i].av} />
                <Avatar.Fallback>{PL[i].nm.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13.5px] font-semibold">{PL[i].nm}</div>
                <div className="text-xs text-neutral-500">партий выиграно: {won(i)}</div>
              </div>
            </div>
            {marks(i)}
            <ScoreInput v={pts[i]} onSet={(n) => onSet(i, n)} />
            {/* Подпись под числом ✳: поле выглядит самим счётом, и без строки
                «впишите» на него не нажимают — ждут кнопок, которых больше нет. */}
            <div className="text-xs text-neutral-400">впишите счёт партии</div>
          </div>
        ))}
      </div>

      {/* Закрытые партии таблицей: идущая строка внизу читается из тех же
          чисел, что стоят в полях выше. Победитель партии выделен — по
          колонке сразу видно, кто как шёл. */}
      <DataTable
        cols={['Партия', PL[0].nm.split(' ')[0], PL[1].nm.split(' ')[0], 'Состояние']}
        grid="1fr 100px 100px 130px"
        rows={[
          ...sets.map(([a, b], i) => ({
            key: 'p' + i,
            cells: [
              <span key="n" className="font-medium">Партия {i + 1}</span>,
              <span key="a" className={'tabular-nums ' + (a > b ? 'font-semibold' : 'text-neutral-400')}>{a}</span>,
              <span key="b" className={'tabular-nums ' + (b > a ? 'font-semibold' : 'text-neutral-400')}>{b}</span>,
              <P key="s" t="СЫГРАНА" cls="live" />,
            ],
          })),
          ...(!done
            ? [{
              key: 'cur',
              cells: [
                <span key="n" className="font-medium">Партия {sets.length + 1}</span>,
                <span key="a" className="tabular-nums">{pts[0]}</span>,
                <span key="b" className="tabular-nums">{pts[1]}</span>,
                <P key="s" t="ИДЁТ" cls="wait" />,
              ],
            }]
            : []),
        ]}
      />

      {!done && (
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-12 flex-1" onPress={onKeep}>
            <Check size={15} /> Записать партию {sets.length + 1} · {pts[0]} : {pts[1]}
          </Button>
          {/* Результат подтверждают у доигранного матча ✳ — тот же порог, что
              и в режиме по очкам: экран один, регламент один. */}
          {over ? (
            <Button variant="primary" className="h-12 flex-1" data-to="Э9.5" onPress={onDone}>
              <Check size={15} /> Подтвердить результат · {won(0)} : {won(1)}
            </Button>
          ) : (
            <div className="flex-1 text-center text-[13px] text-neutral-500">
              До {WIN} побед в партиях · сейчас {won(0)} : {won(1)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Score9_3({ tab }: { tab?: string }) {
  /* Матч показан у развязки ✳: 3 : 2 по партиям и подача в шестой. Раньше на
     экране стояло 1 : 1, и «Подтвердить результат» уводило на Э9.5, где счёт
     4 : 2 и шесть партий, — два экрана одного матча показывали разные матчи.
     Теперь цепочка сходится: доиграть партию → подтвердить её → подтвердить
     результат, и на Э9.5 ровно то, что набралось. */
  const [pts, setPts] = useState<[number, number]>([10, 4]);
  const [sets, setSets] = useState<[number, number][]>([[11, 9], [9, 11], [11, 7], [8, 11], [11, 6]]);
  /* Что нажимали — для отмены последнего: отменяется именно последнее
     действие, а не «минус очко», ошибиться можно и стороной. */
  const [log, setLog] = useState<{ i: 0 | 1; closed?: [number, number] }[]>([]);
  const [swap, setSwap] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  /* Тайм-аут и карточки — по игроку (TZ §6.5): тайм-аут один за матч, карточки
     копятся. `to` — чей тайм-аут идёт прямо сейчас: пока идёт, очки не
     начисляются, как на паузе, но привязано к человеку. */
  const [mk, setMk] = useState<[Mark, Mark]>([
    { to: false, y: 0, r: 0 },
    { to: false, y: 0, r: 0 },
  ]);
  const [to, setTo] = useState<0 | 1 | null>(null);
  /* Итог по партиям, введённый прямо на полосе ✳ (комментарий федерации,
     09.2026): «указать только итоговый счёт в партиях». Пока `null`, счёт
     набирается из сыгранных партий, как раньше. */
  const [hand, setHand] = useState<[number, number] | null>(null);
  const off = paused || done || to !== null;

  /* Партия сыграна на 11 очках с разрывом в два — но сама собой не
     закрывается: счёт остаётся на экране, пока судья его не подтвердит.
     Обнулять числа в момент одиннадцатого очка нельзя — за столом в этот
     момент как раз смотрят на счёт, спорят и сверяются, а он уже пропал. */
  const ready = (pts[0] >= 11 || pts[1] >= 11) && Math.abs(pts[0] - pts[1]) >= 2;

  /* Партий выиграно: из сыгранных партий или из введённого руками итога. */
  const fromSets = (i: 0 | 1) => sets.filter(([a, b]) => (i === 0 ? a > b : b > a)).length;
  const won = (i: 0 | 1) => (hand ? hand[i] : fromSets(i));
  /* Матч сыгран, когда кто-то взял свои партии по регламенту ✳. До этого
     «Подтвердить результат» на экране нет вовсе: подтверждать нечего. */
  const over = won(0) >= WIN || won(1) >= WIN;
  /* Итог по партиям вписывают числом: пришло из поля, а не набралось шагами. */
  const setWon = (i: 0 | 1, n: number) => {
    if (done) return;
    const base: [number, number] = hand ?? [fromSets(0), fromSets(1)];
    const next: [number, number] = [base[0], base[1]];
    next[i] = n;
    setHand(next);
  };

  const point = (i: 0 | 1) => {
    const next: [number, number] = [pts[0], pts[1]];
    next[i] += 1;
    setPts(next);
    setLog([...log, { i }]);
  };
  const keep = () => {
    /* Записал партию — итог снова считается из партий ✳: судья вернулся к
       подробному вводу, и ручное число, набранное до этого, стало бы вторым
       источником правды. */
    setHand(null);
    setSets([...sets, pts]);
    setLog([...log, { i: 0, closed: pts }]);
    setPts([0, 0]);
  };
  const undo = () => {
    const last = log[log.length - 1];
    if (!last) return;
    if (last.closed) {
      setSets(sets.slice(0, -1));
      setPts(last.closed);
    } else {
      const back: [number, number] = [pts[0], pts[1]];
      back[last.i] -= 1;
      setPts(back);
    }
    setLog(log.slice(0, -1));
  };
  /* Ввод по партиям: счёт партии вписывают числом — 11, 9, 13. */
  const setPoint = (i: 0 | 1, n: number) => {
    if (done) return;
    const next: [number, number] = [pts[0], pts[1]];
    next[i] = n;
    setPts(next);
  };
  /* Тайм-аут: первый раз — берётся и идёт, повторное нажатие возвращает в
     игру. Взятый гаснет: второй раз за матч его не дают. */
  const timeout = (i: 0 | 1) => {
    if (done) return;
    if (to === i) { setTo(null); return; }
    if (mk[i].to) return;
    const next: [Mark, Mark] = [{ ...mk[0] }, { ...mk[1] }];
    next[i].to = true;
    setMk(next);
    setTo(i);
  };
  const card = (i: 0 | 1, c: 'y' | 'r') => {
    if (done) return;
    const next: [Mark, Mark] = [{ ...mk[0] }, { ...mk[1] }];
    next[i][c] += 1;
    setMk(next);
  };
  /* Снять последнюю отметку ✳: карточку выносят пальцем по живому матчу, и
     промахнуться по соседней кнопке легко. Тайм-аут снимается целиком — он
     один за матч, снимать в нём нечего, кроме самого факта. */
  const unmark = (i: 0 | 1, k: 'to' | 'y' | 'r') => {
    if (done) return;
    const next: [Mark, Mark] = [{ ...mk[0] }, { ...mk[1] }];
    if (k === 'to') {
      next[i].to = false;
      if (to === i) setTo(null);
    } else {
      next[i][k] = Math.max(0, next[i][k] - 1);
    }
    setMk(next);
  };
  const marks = (i: 0 | 1) => (
    <Marks
      m={mk[i]}
      live={to === i}
      off={done}
      onTo={() => timeout(i)}
      onCard={(c) => card(i, c)}
      onUndo={(k) => unmark(i, k)}
    />
  );

  return (
    <TabletApp
      title="Ввод счёта"
      sub={`Стол 4 · Смагулов А. — Токаев М. · 1/8 финала · до ${WIN} побед в партиях`}
      badge="ИДЁТ"
    >
      {/* В полосе над вкладками осталась одна «История матча» — справа, как
          второстепенное действие. Подтверждение результата уехало вниз, к
          счёту: подтверждают то, на что смотрят, а не то, что стоит в шапке.

          Индикатора связи здесь нет ✳: пока связь есть, сообщать нечего —
          работа без сети (TZ §6) показана отдельным кадром в состояниях. */}
      <div className="flex items-center justify-between gap-3">
        {to !== null ? (
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-blue-700">
            <Timer size={15} /> Тайм-аут · {PL[to].nm}
          </span>
        ) : (
          <span />
        )}
        <Button size="sm" variant="outline" data-to="Э9.4">
          <History size={14} /> История матча
        </Button>
      </div>

      {/* Два режима ввода, и выбирает судья стола ✳ (комментарий федерации,
          09.2026): по очкам режим открывает главный судья соревнований, по
          партиям доступен всегда. Счёт у вкладок общий, поэтому переключиться
          можно посреди матча — закрытые партии остаются закрытыми, идущая
          переезжает как есть. PageTabs не берём: его переключатель стоит с
          отступом веб-раздела, а здесь вкладки должны быть под палец. */}
      <ScoreTabs
        active={tab}
        points={
          <ByPoints9_3
            pts={pts}
            sets={sets}
            swap={swap}
            paused={paused}
            off={off}
            done={done}
            ready={ready}
            over={over}
            marks={marks}
            hand={hand !== null}
            won={won}
            onSet={setWon}
            onDropHand={() => setHand(null)}
            onPoint={point}
            onUndo={undo}
            onSwap={() => setSwap(!swap)}
            onPause={() => setPaused(!paused)}
            onKeep={keep}
            onDone={() => setDone(true)}
          />
        }
        bySets={
          <BySets9_3
            sets={sets}
            pts={pts}
            done={done}
            over={over}
            marks={marks}
            won={won}
            onSet={setPoint}
            onKeep={keep}
            onDone={() => setDone(true)}
          />
        }
      />
    </TabletApp>
  );
}

/** Вкладки режима ввода — касабельные, на всю ширину: у готового PageTabs
    кнопки под курсор, а здесь по ним попадают пальцем, не глядя. */
function ScoreTabs({ active, points, bySets }: { active?: string; points: ReactNode; bySets: ReactNode }) {
  const items: [string, ReactNode][] = [['По очкам', points], ['По партиям', bySets]];
  const [cur, setCur] = useState(active ?? items[0][0]);
  const hit = items.find(([t]) => t === cur) ?? items[0];
  return (
    <>
      <div data-seg className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1">
        {items.map(([t]) => (
          <button
            key={t}
            type="button"
            aria-selected={t === cur}
            className={
              'rounded-md py-2.5 text-sm font-medium ' +
              (t === cur ? 'on bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')
            }
            onClick={() => setCur(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {hit[1]}
    </>
  );
}

const Score9_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="Обрыв связи"
      text="Ввод продолжается локально, счётчик очереди растёт; после восстановления всё уходит на сервер."
    >
      <Frag>
        <Rows>
          <Row nm="Связи нет" sub="ввод продолжается на планшете" val="7 событий в очереди" pill={{ t: 'ЛОКАЛЬНО', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar>Счёт вести можно: судья стола — источник правды по матчу.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Расхождение после синхронизации"
      text="Приоритет у судьи стола — он видит игру."
    >
      <Frag>
        <Rows>
          <Row nm="На планшете" sub="11:9 · третья партия" pill={{ t: 'ПРИНЯТО', cls: 'live' }} />
          <Row nm="На сервере" sub="11:8 · пришло с другого устройства" pill={{ t: 'ОТКЛОНЕНО', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="warning" title="Подтверждение при обрыве" text="Результат уйдёт после синхронизации ✳.">
      <Frag>
        <Rows>
          <Row nm="Результат матча подтверждён" sub="уйдёт на сервер, когда появится связь" pill={{ t: 'В ОЧЕРЕДИ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>

    {/* Режим по партиям — не запасной вид, а второй способ отсудить матч ✳
        (комментарий федерации, 09.2026): планшетов нет, а с телефона поочковый
        счёт вести нечем — одна рука держит телефон, вторая переворачивает
        настольный счётчик. */}
    <Shot
      tone="info"
      title="Матч ведут по партиям ✳"
      text="Кнопок очка нет вовсе: на экране поля партий и предупреждение, что прямого эфира по этому столу не будет."
      wide
    >
      <Frag>
        <Rows>
          <Row nm="Партия 3" sub="судья вписывает итог числом и записывает партию" val="11 : 7" pill={{ t: 'ЗАПИСАНА', cls: 'live' }} />
          <Row nm="Прямого эфира по столу нет" sub="поочковой аналитики и наложения счёта на трансляцию — тоже" pill={{ t: 'БЕЗ ЭФИРА', cls: 'wait' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Обязателен ли поочковый ввод на трансляционных столах — федерация не сказала (вопрос 17.2).
          </Bar>
        </div>
      </Frag>
    </Shot>

    {/* Третий путь — итог напрямую (TZ §6.1): полоса счёта подсвечена, партии
        молчат, возврат к подробному вводу — той же строкой. */}
    <Shot
      tone="info"
      title="Итог записан напрямую ✳"
      text="Счёт по партиям подсвечен, партии не заполнялись: у матча есть результат и нет подробностей. Возврат к подробному вводу — строкой «считать по партиям»."
      wide
    >
      <Frag>
        <div className="flex items-center justify-center gap-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <span className="w-24 text-center text-5xl font-bold tabular-nums tracking-tight">3</span>
          <span className="flex flex-col items-center leading-tight">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Счёт по партиям</span>
            <span className="text-[11px] font-medium text-amber-700">итог задан вручную</span>
          </span>
          <span className="w-24 text-center text-5xl font-bold tabular-nums tracking-tight">1</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-md bg-neutral-100 px-2.5 py-1.5 text-neutral-500">
            партии не заполнялись — записан итог матча
          </span>
          <span className="rounded-md px-2.5 py-1.5 font-medium text-blue-600">считать по партиям</span>
        </div>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="У игрока жёлтая и потраченный тайм-аут ✳"
      text="Отметки стоят у имени и держатся до конца матча."
    >
      <Frag>
        {/* Тот же компонент отметок, что на табло, — в состоянии «уже есть»:
            кадр показывает ровно то, что судья видит между именем и счётом. */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-4">
          {([
            { nm: 'Смагулов Алан', m: { to: true, y: 0, r: 0 } },
            { nm: 'Токаев Марат', m: { to: false, y: 1, r: 0 } },
          ] as const).map((p) => (
            <div key={p.nm} className="flex items-center justify-between gap-3">
              <span className="text-[13.5px] font-semibold">{p.nm}</span>
              <Marks m={p.m} live={false} off onTo={() => {}} onCard={() => {}} onUndo={() => {}} />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Bar tone="warning">
            ⚠ Штрафные очки по ступеням карточек система не считает: судья карточку фиксирует (вопрос 17.1).
          </Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э9.4 · История матча ────────────────────────────────────────── */

/** Значок события: +1 · −1 · служебное; карточка нарисована карточкой, а
    тайм-аут — часами: оба события ищут глазами, а не читают подряд. */
const EvBadge = ({ tone }: { tone: Ev['tone'] }) => {
  if (tone === 'y' || tone === 'r') {
    return (
      <span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' + (tone === 'y' ? 'bg-amber-100' : 'bg-red-100')}>
        <CardIco c={tone} />
      </span>
    );
  }
  if (tone === 'to') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <Timer size={14} />
      </span>
    );
  }
  const cls =
    tone === 'win'
      ? 'bg-green-100 text-green-700'
      : tone === 'loss'
        ? 'bg-red-100 text-red-700'
        : 'bg-neutral-100 text-neutral-400';
  return (
    <span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ' + cls}>
      {tone === 'win' ? '+1' : tone === 'loss' ? '−1' : '·'}
    </span>
  );
};

export function Log9_4() {
  return (
    <TabletApp
      title="История матча"
      sub="Стол 4 · Смагулов А. — Токаев М. · каждое действие с автором и временем"
      badge="ИДЁТ"
      back={{ label: 'Ввод счёта', to: 'Э9.3' }}
    >
      {/* Подписи «Лента событий по времени» нет: экран так и называется
          историей матча, а лента — единственное, что на нём есть. Второй
          строки под названием тоже нет ✳: событие названо целиком в первой, а
          счёт после каждого розыгрыша пересказывал то, что и так видно на
          экране ввода. Строка отзывается под пальцем: ленту читают сверху
          вниз, и подсветка держит место. */}
      <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {EVENTS.map((e) => (
          <div key={e.at + e.t} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
            <EvBadge tone={e.tone} />
            <span className="flex-1 text-[13.5px] font-medium">{e.t}</span>
            <span className="text-xs tabular-nums text-neutral-400">{e.at}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-neutral-500">
        Только просмотр: исправление задним числом — через главного судью.
      </div>
    </TabletApp>
  );
}

/* ── Э9.5 · Результат отправлен ──────────────────────────────────── */

/** Партии подтверждённого матча — те же, что набрались на Э9.3. */
const SENT_GAMES: [number, number][] = [[11, 9], [9, 11], [11, 7], [8, 11], [11, 6], [11, 4]];

/** Что судья видит сразу после «Подтвердить результат».

    Отдельный экран, а не всплывающая полоска ✳: подтверждение результата —
    единственное необратимое действие судьи за столом (дальше правит только
    главный судья, TZ §6). Человеку нужно увидеть, что именно ушло и куда, — и
    увидеть это не полсекунды. Заодно экран отвечает на следующий вопрос: что
    теперь делать со столом.

    Код Э9.5 освободился: на нём стоял «мой рейтинг судьи», уехавший в кабинет
    (Э0.11). */
export function Sent9_5() {
  return (
    <TabletApp title="Результат отправлен" sub="Стол 4 · Смагулов А. — Токаев М. · 1/8 финала" badge="ИДЁТ">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm">
        <Chip color="success" size="sm">
          <Check size={13} className="mr-1" /> РЕЗУЛЬТАТ ПРИНЯТ
        </Chip>
        {/* Итог — тем же приёмом, что счёт партий на табло: цифра победителя
            тёмная, проигравшего серая. */}
        <div className="flex items-center gap-6">
          <span className="text-7xl font-bold tabular-nums tracking-tight">4</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Смагулов А. — Токаев М.
          </span>
          <span className="text-7xl font-bold tabular-nums tracking-tight text-neutral-400">2</span>
        </div>
        {/* Партии показаны целиком не для красоты ✳: увидеть ошибку надо
            сейчас — после подтверждения судья стола счёт уже не правит. */}
        <GameCells games={SENT_GAMES} />
        {/* Что именно ушло ✳: не только счёт. Карточки и тайм-ауты уходят
            вместе с результатом (TZ §6.5), и судья должен видеть, что они
            отправлены, — спрашивать о них будут после матча. */}
        <div className="max-w-md text-xs leading-relaxed text-neutral-500">
          Ушло главному судье и в базу: счёт, партии, карточки и тайм-ауты · сетка продвинулась ·
          15:58, отправил Оралбай Е.
        </div>
      </div>

      {/* Что дальше — прямо здесь: между матчами у судьи минуты, искать дорогу
          он не должен. Акцент один ✳ — «К моему столу»: это единственное, что
          он делает каждый раз. «История матча» и «Запросить правку» стоят
          рядом тихими: первая на просмотр, вторая бывает раз на сотню матчей.
          «Запросить правку» стоит здесь, а не только в состояниях: ошибку
          замечают на этом экране — на нём партии и показаны целиком. */}
      <div className="flex flex-col gap-2">
        <div className="text-center text-[12.5px] text-neutral-500">
          Следующая пара — 16:20 · вызов придёт от главного судьи
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" data-to="Э9.4">
            <History size={15} /> История матча
          </Button>
          <Button variant="ghost">
            <Undo2 size={15} /> Запросить правку
          </Button>
          <Button variant="primary" className="h-12" data-to="Э9.2">
            <Radio size={15} /> К моему столу
          </Button>
        </div>
      </div>

      <Bar>
        Исправить счёт после подтверждения судья стола уже не может: правка идёт через главного
        судью, с лимитом времени и записью в журнал (TZ §6). Поэтому экран и показывает партии
        целиком — увидеть ошибку надо сейчас, а не после.
      </Bar>
    </TabletApp>
  );
}

const Sent9_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Связи нет — результат в очереди ✳"
      text="Экран тот же, но сказано честно: результат уйдёт, когда появится сеть. Судья не ждёт у стола и не жмёт второй раз."
    >
      <Frag>
        <Rows>
          <Row
            nm="Результат матча подтверждён"
            sub="4 : 2 · уйдёт на сервер, когда появится связь"
            pill={{ t: 'В ОЧЕРЕДИ', cls: 'wait' }}
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="info"
      title="Стол свободен до следующего вызова"
      text="После отправки судья возвращается к столу: пары нет, пока главный судья не вызвал новую."
    >
      <Frag>
        <EmptyBox title="Стол свободен" text="Следующая пара по расписанию — 16:20. Вызов придёт от главного судьи." />
      </Frag>
    </Shot>

    {/* Матч, записанный итогом (TZ §6.1): партий у него нет, и экран не делает
        вид, что они были. */}
    <Shot
      tone="info"
      title="Матч записан итогом ✳"
      text="Судья вписал счёт по партиям, не заполняя партии: у матча есть результат и нет подробностей."
      wide
    >
      <Frag>
        <Rows>
          <Row nm="Смагулов А. — Токаев М." sub="итог по партиям, записан судьёй стола" val="4 : 2" pill={{ t: 'ПРИНЯТ', cls: 'live' }} />
          <Row nm="Партии не заполнялись" sub="ни счёта партий, ни розыгрышей — в протоколе матча печатать нечего ⚠ 17.5" pill={{ t: 'БЕЗ ПОДРОБНОСТЕЙ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="В матче были карточки ✳"
      text="Уходят главному судье вместе с результатом и остаются в истории матча."
    >
      <Frag>
        <Rows>
          <Row nm="Токаев Марат · жёлтая" sub="15:46 · вынес судья стола" pill={{ t: 'ОТПРАВЛЕНА', cls: 'live' }} />
          <Row nm="Дисциплинарный комитет" sub="⚠ заводит дело сам или карточка попадает туда автоматически — вопрос 15.4" pill={{ t: 'ОТКРЫТО', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Ошиблись в счёте — правит главный судья"
      text="Подтверждение необратимо для судьи стола (TZ §6): дальше только через главного, с записью в журнал."
    >
      <Frag>
        <Rows>
          <Row nm="Запросить правку" sub="уходит главному судье с указанием, что именно исправить" action="Запросить" />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э0.1 · Вход — полка состояний ───────────────────────────────── */

/** Полка состояний входа — своя у борда роли ✳ (приёмка 30.08.2026): экран
    общий (`role00`), но его полка оттуда не экспортируется, и без неё борд
    показывал только удачный путь. Подписи кадров — из `data/role00.ts` (Э0.1):
    три состояния и зона «Выбор контекста — если ролей несколько». */
const Login0_1States9 = () => (
  <States>
    <Shot
      tone="danger"
      title="Неверный логин или пароль"
      text="Ошибка под полем; поля не очищаются."
    >
      <Frag>
        <FormGrid>
          <TextInput label="Телефон или почта" value="+7 705 431 20 18" wide />
          <TextInput label="Пароль" value="••••••" bad wide />
        </FormGrid>
        <div className="mt-1.5 text-xs text-red-600">
          Неверный логин или пароль. Проверьте раскладку или восстановите пароль.
        </div>
        <div className="mt-3">
          <DisabledAction>Войти</DisabledAction>
        </div>
      </Frag>
    </Shot>

    {/* Зона данных, а не состояние: список ролей с областью каждой — выбор
        запоминается, переключатель остаётся в шапке. Пример области — из
        данных («Судья · Кубок РК · до 12.10»). */}
    <Shot
      tone="info"
      title="Выбор контекста — если ролей несколько ✳"
      text="Список ролей с областью каждой; выбор запоминается, переключатель остаётся в шапке."
    >
      <Frag>
        {/* Роль — в первой строке, область и срок — во второй ✳: в узком кадре
            полки склеенное «Судья стола · Чемпионат Казахстана 2026» упиралось
            в значок и резалось, а именно роль человек здесь и выбирает. */}
        <Rows>
          <Row
            nm="Судья стола"
            sub="Чемпионат Казахстана 2026 · стол 4 · до 16.03"
            pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
          />
          <Row nm="Судья" sub="Кубок РК · до 12.10" pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }} />
        </Rows>
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
            nm="Судья стола"
            sub="Чемпионат Казахстана 2026 · до 16.03"
            pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
          />
          <Row
            nm="Судья"
            sub="Открытие сезона 2026 · срок вышел 21.01.2026"
            pill={{ t: 'ИСТЕКЛА', cls: 'done' }}
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Аккаунт не активирован ✳"
      text="Приглашение отправлено, но пароль ещё не задан — стыкуется с Э1.10."
    >
      <Frag>
        <Rows>
          <Row
            nm="Аккаунт ждёт активации"
            sub="приглашение отправлено · пароль задаётся по ссылке из письма (Э1.10)"
            pill={{ t: 'НЕ АКТИВИРОВАН', cls: 'wait' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  /* Борд роли начинается со входа — как у всех ролей (flows/00): маршрут не
     должен обрываться на середине. Регистрация стоит следом: это путь ДО
     входа, и на карте она ветка входа, а не его корень. */
  'Э0.1': {
    cap: 'Вход',
    view: () => (
      <>
        <Login0_1 />
        <Login0_1States9 />
      </>
    ),
    next: '«Стать судьёй» на входе',
  },
  'Э0.7': {
    cap: 'Регистрация судьи',
    view: () => (
      <>
        <SignUpJudge0_7 />
        <SignUpJudge0_7States />
      </>
    ),
    next: 'вход под своей ролью',
  },
  'Э9.1': {
    cap: 'Мои турниры',
    view: () => (
      <>
        <Tours9_1 />
        <Tours9_1States />
      </>
    ),
    next: 'строка назначения',
  },
  'Э9.2': {
    cap: 'Мой стол',
    view: () => (
      <>
        <Table9_2 />
        <Table9_2States />
      </>
    ),
    next: 'принять вызов пары',
  },
  'Э9.3': {
    cap: 'Ввод счёта',
    view: () => (
      <>
        <Score9_3 />
        <Score9_3States />
      </>
    ),
    next: 'кнопка «история»',
  },
  'Э9.5': {
    cap: 'Результат отправлен',
    view: () => (
      <>
        <Sent9_5 />
        <Sent9_5States />
      </>
    ),
    next: 'лента событий матча',
  },
  'Э9.4': {
    cap: 'История матча',
    view: () => <Log9_4 />,
    next: 'кабинет судьи — заявки и рейтинг',
  },
};

export function Role09Board() {
  return <Board role={R09} screens={SCREENS} />;
}
