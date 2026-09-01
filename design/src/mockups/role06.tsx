/* Роль 6 · Главный судья соревнований — макеты по флоу на новом слое (HeroUI)
   ✳ (30.08.2026). Содержание, решения и переходы — прежние (см.
   `flows/06-glavnyy-sudya.md`); меняется подача: оболочка WebApp и доменные
   компоненты `kit/hero/app` вместо старого макетного слоя.

   Роль ключевая, и маршрут у неё — это жизненный цикл турнира (§4.3). Поэтому
   значок состояния в шапке меняется от экрана к экрану: «Приём заявок» →
   «Система проведения» → «Идёт» → «Итоговый протокол». Читать борд слева
   направо = смотреть, как турнир проходит свои состояния.

   Блоки, которые заместитель (роль 8) видит один в один, отсюда
   экспортируются: шкала состояний, строка «что требуется», карта столов,
   живые матчи и очередь пар. */

import { useState, type ReactNode } from 'react';
import {
  Ban, CalendarDays, Check, ChevronRight, ClipboardList, Grid3x3, LayoutDashboard, Lock, Pencil,
  Printer, Radio, Scroll, Shield, Shuffle, Timer, X,
} from 'lucide-react';
import { Avatar, Button, Chip } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  Bar,
  DataTable,
  DisabledAction,
  EmptyBox,
  FieldView,
  FilterSeg,
  FormGrid,
  GameCells,
  InlineDialog,
  MatchCard,
  PageTabs,
  Panel,
  PhoneRoleApp,
  Pill,
  PrimaryAction,
  QuietAction,
  Row,
  Rows,
  ScreenScope,
  StatTiles,
  TextInput,
  TimeGrid,
  WebApp,
  type RoleUI,
  type SlotEvent,
  Sheet,
  Segmented,
} from '@/shared/kit/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* Сетка — настоящий компонент фронта, как и в прежнем слое: вторая
   нарисованная сетка разошлась бы с той, что увидят в продукте. */
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { makeBigBracket } from '../bigBracket';
/* Маршрут судейской роли начинается раньше входа: судья заводит себя сам
   (Э0.7), а роль в наряде ему выдают уже потом. Без этой колонки борд и карта
   начинались с «Вход», и откуда взялся человек, из них было не видно. */
import {
  Login0_1, LoginPhone0_1, SignUpJudge0_7, SignUpJudge0_7States, SignUpJudge0_7Phone,
} from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    Подписи пунктов те же слова: по ним карта флоу находит переходы. */
const R06: RoleUI = {
  num: '6',
  title: 'Главный судья соревнований',
  person: { nm: 'Оспанов Т.', rl: 'Главный судья турнира', av: A(76) },
  brandName: 'Чемпионат Казахстана 2026',
  brandSub: 'Одиночный · олимпийская · г. Астана',
  badge: 'ИДЁТ',
  nav: [
    [<LayoutDashboard size={16} key="t" />, 'Мой турнир'],
    [<ClipboardList size={16} key="b" />, 'Заявки'],
    [<Grid3x3 size={16} key="g" />, 'Сетка'],
    [<CalendarDays size={16} key="s" />, 'Расписание'],
    [<Shield size={16} key="j" />, 'Судьи на столах'],
    [<Timer size={16} key="l" />, 'Ход турнира'],
    [<Scroll size={16} key="p" />, 'Протокол'],
  ],
  /* Должность в наряде держит человек с судейской квалификацией ✳: срок
     аттестации и рейтинг у него живут в кабинете судьи, и попадать туда он
     должен отсюда, а не вторым входом. */
  roles: ['Главный судья соревнований', { t: 'Судья · вне турнира', to: 'Э0.8' }],
};

/** Значок состояния в шапке: на каждом экране турнир в своём состоянии (§4.3). */
const at = (badge: string): RoleUI => ({ ...R06, badge });

/* ── Люди турнира ───────────────────────────────────────────────── */

const P = {
  kim: A(44), tok: A(51), gla: A(56), bai: A(85), mur: A(93),
  dos: A(45), ahm: A(67), sar: A(23), sat: A(64), nur: A(53),
  tle: AW(21), ora: AW(65), osp: A(76),
  pak: A(13), erl: A(75),   // судьи столов
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Тона значков старого словаря → цвета `Pill` нового слоя: данные экранов
    переносятся без переписывания. */
type Cls = 'live' | 'wait' | 'bad' | 'reg' | 'done';
const PC: Record<Cls, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
  live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default',
};
const Pl = ({ t, cls }: { t: string; cls: Cls }) => <Pill t={t} color={PC[cls]} />;

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/** Подзаголовок раздела внутри панели: журнал протокола, свободные судьи. */
const Sec = ({ children }: { children: ReactNode }) => (
  <div className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 first:mt-0">
    {children}
  </div>
);


/* ── Телефонный кадр: что меняется на 392 px ────────────────────── */

/* Полный адаптив ✳ (решение владельца, 30.08.2026): у каждого экрана роли есть
   второй формат. Главный судья ходит между столами, и телефон ему не запасной
   вариант, а основное место работы в зале — поэтому телефонный кадр берёт те же
   данные, что десктопный, и отличается только раскладкой.

   Мелочи ниже — переопределения кита под узкий кадр. Компоненты кита при этом
   остаются как есть: на десктопе их вызывают полтора десятка экранов, и менять
   ширины ради телефона нельзя.
   ⚠ Те же три обёртки живут в role07 — когда телефонные кадры появятся у всех
   ролей, им место в `kit/hero/app`. */

/** Плитки-счётчики на телефоне: тот же `StatTiles`, но в два столбца — в один
    ряд на 392 px влезает от силы одна плитка. */
const PhoneTiles = ({ children }: { children: ReactNode }) => (
  <div className="[&>div]:grid-flow-row [&>div]:grid-cols-2 [&>div]:gap-2">{children}</div>
);

/** Полоса переключателей на телефоне: не переносится рядами, а уезжает вбок.
    Подписи вроде «Отклонены судьёй · 3» встают на 392 px в несколько рядов и
    съедают экран раньше, чем начинается содержимое. */
const Strip = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 mb-3 overflow-x-auto px-4 **:data-seg:flex-nowrap">{children}</div>
);

/** Главное действие во всю ширину кадра: на телефоне кнопка занимает строку. */
const Wide = ({ children }: { children: ReactNode }) => (
  <div className="[&>button]:w-full">{children}</div>
);

/** Диалог во всю ширину кадра: у кита ширина прибита под десктоп (520 px), и в
    392 px он вылезал бы за края. Сам диалог тот же — меняются только поля. */
const PhoneDialog = ({ children }: { children: ReactNode }) => (
  <div className="[&>div>div]:w-full [&>div]:p-4">{children}</div>
);

/** Плитки экрана: один набор чисел на оба формата. */
type Tile = { v: string; k: string; tone?: 'g' | 'a' | 'b'; to?: string };

/* ── Общее с ролью 8 (заместитель видит те же блоки) ────────────── */

/** Восемь состояний турнира: пройденные — галочкой, текущее — заливкой. */
const STAGES = [
  'Черновик', 'Приём заявок судей', 'Судья назначен', 'Приём заявок игроков',
  'Система проведения', 'Идёт', 'Итоговый протокол', 'Завершён',
];

export function Stages({ cur }: { cur: string }) {
  const now = STAGES.indexOf(cur);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1">
      {STAGES.map((s, i) => (
        <span
          key={s}
          className={
            'flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium ' +
            (i === now
              ? 'bg-white text-neutral-900 shadow-sm'
              : i < now
                ? 'text-green-700'
                : 'text-neutral-400')
          }
        >
          {i < now && <Check size={12} />}
          {s}
        </span>
      ))}
    </div>
  );
}

/** Строка зоны «что сейчас требуется»: ссылка на экран, который закрывает долг. */
export type Need = { ic: ReactNode; t: string; s: string; p: string; cls: 'live' | 'wait' | 'bad' | 'reg' };

export function NeedRow({ n, read }: { n: Need; read?: boolean }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        {n.ic}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-medium">{n.t}</span>
        <span className="block text-xs text-neutral-500">{n.s}</span>
      </span>
      <Pill t={n.p} color={PC[n.cls]} />
      {read ? (
        /* У заместителя без переданной смены — только чтение (роль 8). */
        <Chip className="whitespace-nowrap" color="accent" size="sm" variant="primary">
          <Lock size={10} className="mr-1" /> ЧТЕНИЕ
        </Chip>
      ) : (
        <Button size="sm" variant="outline">
          Открыть <ChevronRight size={13} />
        </Button>
      )}
    </div>
  );
}

/** Карта столов: счёт в реальном времени, свободные и заблокированные столы. */
/* Счёт по партиям у идущего матча: партий до 3 из 5 (Э6.3), поэтому третья
   выигранная партия матч заканчивает — на карте столов, где все матчи идут,
   «3 : 1» и «3 : 2» стоять не может. */
const SCORES = ['2 : 1', '1 : 1', '0 : 2', '2 : 2', '1 : 0', '2 : 2', '0 : 1', '1 : 2', '2 : 0', '1 : 2', '2 : 1', '0 : 0'];
const BUSY = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14];

/** Сколько столов в ряду: пять на десктопе, два на телефоне ✳ (30.08.2026).
    Карточка со счётом в 392 px в пять колонок нечитаема, а сам зал на телефоне
    и есть главное, ради чего судья достаёт телефон, — режется раскладка, а не
    содержание. Проп необязательный: вызовы у заместителя (role08) не меняются. */
const MAP_COLS = { 2: 'grid-cols-2', 4: 'grid-cols-4', 5: 'grid-cols-5' } as const;

export function TableMap({ cols = 5 }: { cols?: keyof typeof MAP_COLS }) {
  return (
    <div className={'mb-4 grid gap-2 ' + MAP_COLS[cols]}>
      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
        /* стол без судьи матчи не принимает (§4.7); задержка старта — подсветкой */
        if (n === 7) {
          return (
            <div key={n} className="rounded-lg border border-red-300 bg-red-50 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                Стол {n} <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-red-600">нет судьи</div>
            </div>
          );
        }
        if (n === 11) {
          return (
            <div key={n} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                Стол {n} <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-amber-700">задержка 12 мин</div>
            </div>
          );
        }
        const b = BUSY.indexOf(n);
        return b >= 0 ? (
          <div key={n} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
              Стол {n} <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
            <div className="mt-0.5 text-lg font-bold tabular-nums leading-tight tracking-tight">{SCORES[b]}</div>
          </div>
        ) : (
          <div key={n} className="rounded-lg border border-dashed border-neutral-300 px-3 py-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
              Стол {n} <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            </div>
            <div className="mt-0.5 text-lg font-medium leading-tight text-neutral-300">—</div>
          </div>
        );
      })}
    </div>
  );
}

/* Идущие матчи живут в правой колонке экрана (324 px), а карточка матча из
   кита рассчитана на широкую область: там игроки стоят по краям от крупного
   счёта, и в узкой колонке счёт ломался на три строки, а фамилия гостя
   вылезала за край. В колонке тот же матч читается списком, как на табло
   трансляции: строка игрока — справа его партии, ниже счёт по партиям. */
type LiveRow = {
  table: string;
  note: string;
  home: { nm: string; av: string; sub: string; s: number };
  away: { nm: string; av: string; sub: string; s: number };
  games: ReadonlyArray<readonly [number, number]>;
};

const LIVE6: LiveRow[] = [
  {
    table: 'СТОЛ 3 · ЭФИР',
    note: '4-я партия · 7 : 5',
    home: { nm: 'Ким Г.', av: P.kim, sub: 'СКА · Астана', s: 2 },
    away: { nm: 'Токаев М.', av: P.tok, sub: 'Шымкент', s: 1 },
    games: [[11, 8], [9, 11], [11, 6]],
  },
  {
    table: 'СТОЛ 1 · идёт 24 мин',
    note: '3-я партия · 2 : 2',
    home: { nm: 'Гладун И.', av: P.gla, sub: 'Тараз', s: 1 },
    away: { nm: 'Байжанов А.', av: P.bai, sub: '«Алатау» · Алматы', s: 1 },
    games: [[11, 7], [8, 11]],
  },
];

/** Матчи, которые идут прямо сейчас: табло стола списком. Счёт обновляется сам. */
export function LiveCards() {
  const side = (p: LiveRow['home'], win: boolean) => (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        <Avatar.Image alt={p.nm} src={p.av} />
        <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
      <span className="min-w-0 flex-1 leading-tight">
        <span className={'block truncate text-[13px] ' + (win ? 'font-semibold' : 'font-medium')}>{p.nm}</span>
        <span className="block truncate text-[11px] text-neutral-500">{p.sub}</span>
      </span>
      <span className={'text-[15px] tabular-nums ' + (win ? 'font-bold' : 'font-medium text-neutral-400')}>
        {p.s}
      </span>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      {LIVE6.map((m) => (
        <div key={m.table} className="rounded-xl border border-green-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {m.table}
            </span>
            <Pl t="ИДЁТ" cls="live" />
          </div>
          <div className="flex flex-col gap-1.5">
            {side(m.home, m.home.s > m.away.s)}
            {side(m.away, m.away.s > m.home.s)}
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <GameCells games={m.games} />
            <span className="shrink-0 text-[11px] text-neutral-500">{m.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const QUEUE = [
  { a: P.mur, b: P.ahm, r: 'Мұрат Е. — Ахметов Д.', s: '1/16 · стол 7 · 13:20' },
  { a: P.sat, b: P.nur, r: 'Сәтбаев Е. — Нұрғали А.', s: '1/16 · стол 11 · 13:30' },
  { a: P.tle, b: P.ora, r: 'Тлеуова А. — Оралова М.', s: '1/16 · стол 12 · 13:40' },
];

/** Очередь ожидающих пар: кто играет следующим и куда его вызывать. */
export function QueuePanel() {
  return (
    <Panel title="Очередь пар" extra={<Pill t="8 ЖДУТ СТОЛА" color="warning" />} flush>
      <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Ожидают вызова
      </div>
      <div className="divide-y divide-neutral-100">
        {QUEUE.map((q) => (
          <div key={q.r} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex -space-x-2.5">
              <Avatar size="sm" className="ring-2 ring-white">
                <Avatar.Image alt="" src={q.a} />
                <Avatar.Fallback>{q.r.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <Avatar size="sm" className="ring-2 ring-white">
                <Avatar.Image alt="" src={q.b} />
                <Avatar.Fallback>{q.r.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13.5px] font-medium">{q.r}</span>
              <span className="block text-xs text-neutral-500">{q.s}</span>
            </span>
            <Button size="sm" variant="outline">Вызвать</Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Заявки: авто-проверки и состав ─────────────────────────────── */

/** Четыре авто-проверки допуска: у непроходящих — красная пометка. */

/** Игрок в заявке. `v` — четыре авто-проверки; `auto` — заявку отклонила
    система, не дожидаясь судьи, и почему.

    **Заявка разбирается автоматически** ✳ (комментарий федерации, 09.2026):
    взнос, документы и возраст — величины проверяемые, спорить в них не о чем.
    Если игрок по ним не проходит, система отклоняет заявку сама и **сразу
    говорит игроку причину**. Раньше он ждал решения судьи, чтобы узнать то,
    что известно в момент подачи, — и часто узнавал уже после закрытия приёма.

    Судье остаётся то, что решается человеком: квота региона, спорный документ,
    заявка не по формату. */
type Ply = {
  av: string;
  nm: string;
  sub: string;
  p: string;
  cls: 'live' | 'bad' | 'wait';
};

const SQUAD: Ply[] = [
  { av: P.kim, nm: 'Ким Георгий', sub: '2003 г.р. · «Алатау» · рейтинг 2401', p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.tok, nm: 'Токаев Марат', sub: '2005 г.р. · «Алатау» · рейтинг 2350', p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.ahm, nm: 'Ахметов Дархан', sub: '2006 г.р. · «Алатау» · рейтинг 2120', p: 'ДОПУЩЕН', cls: 'live' },
  { av: P.osp, nm: 'Оспанов Тимур', sub: '1979 г.р. · ветеран · рейтинг 2210', p: 'ДОПУЩЕН · ВЕТЕРАН', cls: 'live' },
];

/** Возрастной ценз работает в одну сторону ✳ (комментарий федерации, 09.2026):
    **ветеран вправе играть в категории моложе себя, обратное запрещено**. Тот,
    кто младше нижней границы, не допускается никогда — ни автоматически, ни
    решением судьи.

    ⚠ Как это ложится на юношеские старты («до 19 лет»), где есть верхняя
    граница, федерация не сказала: ветеран под неё очевидно не подходит.
    Уточнить. */
const AGE_RULE =
  'Ветеран играет в категории моложе себя — это разрешено. Младше нижней границы не допускается никто.';

/** Игрок в составе на телефоне: значок допуска не влезает в строку рядом с
    фамилией, поэтому стоит под ней. */
const PhonePly = ({ p }: { p: Ply }) => (
  <div className="flex items-start gap-3 px-4 py-2.5">
    <Avatar size="sm">
      <Avatar.Image alt={p.nm} src={p.av} />
      <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
    </Avatar>
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{p.nm}</span>
      <span className="block text-xs text-neutral-500">{p.sub}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-2">
        <Pl t={p.p} cls={p.cls} />
      </span>
    </span>
  </div>
);

/* ── Э6.1 · Мой турнир ──────────────────────────────────────────── */

/** Пульт турнира стал списком тех, кто подался ✳ (19.08.2026). До этого он был
    панелью: шкала из восьми состояний, пять плиток, очередь «что сейчас
    требуется» и условия допуска — четыре разных блока, и ни один не отвечал
    на главный вопрос судьи в приёме заявок: **кто подался**. Шкалу состояний
    убрали совсем: состояние написано в шапке турнира и повторять его рядом
    незачем. Проп `variant` старой адаптивной рамки сохранён ради истории
    «Адаптив»: у нового слоя своей планшетной рамки веба пока нет. */
/** Карточка соревнования ✳ (комментарий федерации, 09.2026): те же величины,
    что видит председатель ГСК (Э5.10), — размер старта, от которого зависит всё
    остальное. Один набор на оба формата. */
const TILES6_1: Tile[] = [
  { v: '128 / 112', k: 'Заявок подано / принято' },
  { v: '14', k: 'Регионов' },
  { v: '2', k: 'Разряда · одиночный, парный' },
  { v: '14', k: 'Судей в наряде' },
  { v: '20', k: 'Столов в зале' },
  { v: '12.03', k: 'Приём закрывается', tone: 'a' },
];

export function Tournament6_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <WebApp
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Мой турнир"
      title="Чемпионат Казахстана 2026"
      sub="Главный республиканский старт · одиночный · г. Астана · 12–14 марта"
    >
      <StatTiles items={TILES6_1} />

      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-neutral-500">
          Кто подался · <b className="text-neutral-800">8</b> заявок ждут решения — все игроки в них прошли допуск
        </span>
        <div className="flex items-center gap-2">
          <QuietAction>Условия допуска</QuietAction>
          <Button variant="primary" data-to="Э6.2">
            <ClipboardList size={15} /> Разобрать заявки
          </Button>
        </div>
      </div>

      {/* Тот же состав и те же авто-проверки, что на экране заявок (Э6.2): один
          список, а не два — второй разъехался бы с первым на первом же решении.
          Здесь он на чтение, решают на Э6.2. */}
      <Rows>
        {SQUAD.map((p) => (
          <div key={p.nm} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar size="sm">
              <Avatar.Image alt={p.nm} src={p.av} />
              <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
            </Avatar>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13.5px] font-medium">{p.nm}</span>
              <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
            </span>
            <Pl t={p.p} cls={p.cls} />
          </div>
        ))}
      </Rows>

      <div className="mt-3 text-[12.5px] text-neutral-500">
        Показаны последние 4 из 128 заявок · весь список с решениями — на «Заявках»
      </div>
    </WebApp>
  );
}

/** Э6.1 на телефоне: те же числа и тот же список подавшихся.
    Четыре галочки авто-проверок колонками в 392 px не помещаются — что именно
    не прошло, написано под фамилией словами. */
export function Tournament6_1Phone() {
  return (
    <PhoneRoleApp
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Мой турнир"
      title="Чемпионат Казахстана 2026"
      sub="Одиночный · г. Астана · 12–14 марта"
    >
      <PhoneTiles>
        <StatTiles items={TILES6_1} />
      </PhoneTiles>

      <Button className="mb-4 w-full" variant="primary" data-to="Э6.2">
        <ClipboardList size={15} /> Разобрать заявки · 8
      </Button>

      <div className="mb-2 text-[12.5px] text-neutral-500">
        Кто подался · <b className="text-neutral-800">8</b> заявок ждут решения, в трёх игроки не
        проходят допуск
      </div>
      <Rows>
        {SQUAD.map((p) => <PhonePly key={p.nm} p={p} />)}
      </Rows>
      <div className="mt-3 text-[12.5px] text-neutral-500">
        Показаны последние 4 из 128 заявок · весь список с решениями — на «Заявках»
      </div>
    </PhoneRoleApp>
  );
}

const Tournament6_1States = () => (
  <States>
    <Shot tone="info" title="Состояние «Приём заявок игроков»" text="«N заявок ждут решения» со ссылкой на Э6.2.">
      <Frag>
        <Rows>
          <Row nm="8 заявок ждут решения" sub="Э6.2 · приём открыт до 12.03, 18:00" pill={{ t: 'СРОЧНО', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="info" title="Состояние «Система проведения»" text="«Сетка не собрана», «на 2 столах нет судьи» — ссылки на Э6.3 и Э6.5.">
      <Frag>
        <Rows>
          <Row nm="Сетка не собрана" sub="Э6.3 · состав закрыт, можно строить" pill={{ t: 'ПОРА', cls: 'wait' }} />
          <Row nm="На 2 столах нет судьи" sub="Э6.5 · матч не стартует без судьи" pill={{ t: 'ДО СТАРТА', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="info" title="Состояние «Идёт»" text="«3 пары ждут стола» — ссылка на Э6.6.">
      <Frag>
        <Rows>
          <Row nm="3 пары ждут стола" sub="Э6.6 · свободных столов нет" pill={{ t: 'ОЧЕРЕДЬ', cls: 'reg' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.2 · Заявки участников ───────────────────────────────────── */

const BIDS = [
  { nm: 'Сборная Алматы · 4 игрока', sub: 'Смагулов А. · 09.03, 11:20', who: 'РЕГИОН', on: true },
  { nm: 'Сборная Караганды · 3 игрока', sub: 'Ахметов К. · 09.03, 14:05', who: 'РЕГИОН' },
  { nm: 'Сборная Шымкента · 3 игрока', sub: 'Ержанов Д. · 10.03, 09:40', who: 'РЕГИОН' },
  { nm: 'Сборная Павлодара · 2 игрока', sub: 'Сейтқали А. · 10.03, 18:12', who: 'РЕГИОН' },
  { nm: 'Сборная Тараза · 2 игрока', sub: 'Бектұров Р. · 11.03, 08:30', who: 'РЕГИОН' },
];

/* Решённые заявки: вкладки «Приняты», «Отклонены» и «Отозваны» — то же
   соревнование, но заявки, по которым решение уже есть. Судье они нужны, чтобы
   свериться, кого он допустил и по какой причине отказал: причина отказа видна
   заявителю, и спорят потом именно о ней. */
const DECIDED: Record<string, { nm: string; sub: string; p: string; cls: 'live' | 'bad' | 'done' }[]> = {
  Приняты: [
    { nm: 'Сборная Астаны · 8 игроков', sub: 'Мукашев Б. · принята 08.03, 12:40', p: 'ПРИНЯТА', cls: 'live' },
    { nm: 'Сборная Актобе · 5 игроков', sub: 'Ержанов Д. · принята 08.03, 16:05', p: 'ПРИНЯТА', cls: 'live' },
    { nm: 'Сборная Костаная · 6 игроков', sub: 'Сейтқали А. · принята 09.03, 09:15', p: 'ПРИНЯТА', cls: 'live' },
  ],
  'Отклонены судьёй': [
    { nm: 'Сборная Тараза · 3 игрока', sub: 'причина: «состав подан после закрытия приёма» · 12.03', p: 'ОТКЛОНЕНА', cls: 'bad' },
  ],
  Отозваны: [
    { nm: 'Сборная Уральска · 5 игроков', sub: 'отозвал старший тренер региона · 10.03', p: 'ОТОЗВАНА', cls: 'done' },
  ],
};

const DecidedBids = ({ kind }: { kind: string }) => {
  const auto = false;
  return (
    <Panel
      title={`${kind} · ${DECIDED[kind].length}`}
      extra={
        <span className="text-xs text-neutral-500">
          {auto ? 'игроки уведомлены в момент подачи' : 'решение уже принято, состав не меняется'}
        </span>
      }
    >
      <Rows>
        {DECIDED[kind].map((b) => (
          <Row key={b.nm} nm={b.nm} sub={b.sub} pill={{ t: b.p, cls: b.cls }} />
        ))}
      </Rows>
      {auto && (
        <div className="mt-4">
          <Bar>
            Судья этих заявок не разбирал: взнос, документы и возраст проверяются в момент подачи,
            и игрок узнаёт причину сразу, а не после закрытия приёма ✳. Пока приём открыт, он
            может донести документ и подать заново.
          </Bar>
        </div>
      )}
    </Panel>
  );
};

/** Склонение по числу: «1 игрок», «2 игрока», «5 игроков». Строка с числом
    попадается в каждой второй сводке, и «без 1 игроков» выдаёт макет за
    заглушку. */
const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

/** Вкладка «Ждут решения»: сверху очередь заявок, под ней состав выбранной.

    Очередь рабочая ✳: строка выбирается, и её состав раскрывается ниже.
    Раньше она была на чтение, а разбирать можно было только ту заявку, что
    открыли по умолчанию, — то есть очередь показывала работу, которую нельзя
    было делать. */
const BIDS_SQUADS: Record<string, Ply[]> = {
  'Сборная Алматы': SQUAD,
  'Сборная Караганды': [SQUAD[0], SQUAD[1], SQUAD[2]],
  'Сборная Шымкента': [SQUAD[0], SQUAD[2], SQUAD[3]],
  'Сборная Павлодара': [SQUAD[1], SQUAD[3]],
  'Сборная Тараза': [SQUAD[2], SQUAD[0]],
};

/* Колонке «Состояние» — 180px: пилюля «ДОПУЩЕН · ВЕТЕРАН» должна помещаться
   целиком, обрезанный краем панели значок читался как дефект. */
const SQUAD_GRID = '1fr 180px';

const Waiting6_2 = () => {
  const [cur, setCur] = useState(BIDS[0].nm);
  /* Решения по заявкам: имя заявки → что с ней. Разобранная не исчезает из
     очереди, а получает пометку — иначе не видно, что уже сделано. */
  const [done, setDone] = useState<Record<string, 'ok' | 'no'>>({});
  /* Кого из состава выбрали. Строка игрока открывает его: по одному человеку и
     решают, кого исключить, — заявка целиком принимается или отклоняется, но
     спорный игрок в ней обычно один. */
  const [pick, setPick] = useState<string | null>(null);
  /* Исключённые из состава: заявку принимают без них. */
  const [out, setOut] = useState<string[]>([]);

  const bid = BIDS.find((b) => b.nm === cur)!;
  const squad = BIDS_SQUADS[bid.nm.split(' · ')[0]] ?? SQUAD;
  const verdict = done[cur];
  const one = squad.find((x) => x.nm === pick);

  return (
    /* Блоки идут один под другим во всю ширину ✳ (30.08.2026): очередь заявок
       стоит первой — с неё начинают, — а состав выбранной заявки раскрывается
       под ней. В двух колонках очередь отжимала таблицу состава до колонки, где
       фамилия не помещалась. Панель сама держит отступ снизу, обёртка не нужна. */
    <>
      <Panel title="Ждут решения" extra={<Pill t={String(BIDS.length)} color="warning" />} flush>
        <div className="divide-y divide-neutral-100">
          {BIDS.map((b) => (
            <Row
              key={b.nm}
              nm={b.nm}
              sub={b.sub}
              pill={
                done[b.nm] === 'ok'
                  ? { t: 'ПРИНЯТА', cls: 'live' }
                  : done[b.nm] === 'no'
                    ? { t: 'ОТКЛОНЕНА', cls: 'bad' }
                    : { t: b.who, cls: 'reg' }
              }
              on={b.nm === cur}
              onSelect={() => { setCur(b.nm); setPick(null); }}
            />
          ))}
        </div>
        <div className="px-4 pb-1 pt-3">
          <Bar>Строка открывает состав заявки ниже — разбирают их подряд, сверху вниз.</Bar>
        </div>
      </Panel>

      <Panel
        /* Заголовок короткий ✳: кто подал — подписью под названием, это
           уточнение, а не заголовок. */
        title={bid.nm}
        sub={`${bid.who.toLowerCase() === 'регион' ? 'Заявка региона' : bid.who} · подал ${bid.sub}`}
        extra={
          <span className="flex items-center gap-2">
            {/* Исключённые — пометкой в шапке ✳: она меняет то, что произойдёт
                по «Принять состав». */}
            {out.length > 0 && !verdict && (
              <Pl t={`${out.length} ${plural(out.length, 'ИСКЛЮЧЁН', 'ИСКЛЮЧЕНО', 'ИСКЛЮЧЕНО')}`} cls="bad" />
            )}
            <Pl
              t={verdict === 'ok' ? 'СОСТАВ ПРИНЯТ' : verdict === 'no' ? 'ЗАЯВКА ОТКЛОНЕНА' : 'ЖДЁТ РЕШЕНИЯ'}
              cls={verdict === 'ok' ? 'live' : verdict === 'no' ? 'bad' : 'wait'}
            />
          </span>
        }
      >
        {/* Список игроков таблицей ✳: игрок и состояние. Колонки «не пройдено»
            здесь больше нет — и непроходящих строк тоже ✳ (31.08.2026, решение
            владельца продукта). Кто не проходит по взносу, документам или
            возрасту, до судьи не доходит вовсе: система отвечает заявителю в
            момент подачи и уведомляет игрока сама. Показывать судье тех, по
            кому он ничего не решает, значило дать ему работу, которой нет. */}
        <Sheet grid={SQUAD_GRID} cols={['Игрок', 'Состояние']}>
          {squad.map((pl) => {
            const excluded = out.includes(pl.nm);
            return (
              <div
                key={pl.nm}
                role="button"
                tabIndex={0}
                onClick={() => setPick(pl.nm === pick ? null : pl.nm)}
                data-on={pl.nm === pick ? '' : undefined}
                className={
                  'grid cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] ' +
                  (excluded ? 'opacity-55' : '')
                }
                style={{ gridTemplateColumns: SQUAD_GRID }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm">
                    <Avatar.Image alt={pl.nm} src={pl.av} />
                    <Avatar.Fallback>{pl.nm.slice(0, 1)}</Avatar.Fallback>
                  </Avatar>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13.5px] font-medium">{pl.nm}</span>
                    <span className="block text-xs text-neutral-500">{pl.sub}</span>
                  </span>
                </span>
                <span>
                  <Pl t={excluded ? 'ИСКЛЮЧЁН' : pl.p} cls={excluded ? 'bad' : pl.cls} />
                </span>
              </div>
            );
          })}
        </Sheet>

        {/* Выбранный игрок — решение по одному человеку: исключить его дешевле,
            чем возвращать весь состав. */}
        {one && !verdict && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2">
            <span className="text-[12.5px] text-neutral-600">
              {one.nm} · {out.includes(one.nm) ? 'исключён из состава' : 'проходит допуск'}
            </span>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setOut(out.includes(one.nm) ? out.filter((x) => x !== one.nm) : [...out, one.nm])}
            >
              {out.includes(one.nm) ? 'Вернуть в состав' : 'Исключить из состава'}
            </Button>
          </div>
        )}

        {verdict ? (
          <div className="mt-3">
            <Bar tone={verdict === 'ok' ? 'success' : 'warning'}>
              {verdict === 'ok'
                ? `Состав принят${out.length ? ` без ${out.length} ${plural(out.length, 'игрока', 'игроков', 'игроков')}` : ''}. Заявитель уведомлён, участники попадают в состав турнира.`
                : 'Заявка отклонена с причиной. Причина ушла заявителю — он может исправить и подать снова, пока приём открыт.'}
            </Bar>
            <QuietAction
              onPress={() => {
                const next = { ...done };
                delete next[cur];
                setDone(next);
              }}
            >
              Вернуть заявку в очередь
            </QuietAction>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              data-to="Э6.8"
              onPress={() => { setDone({ ...done, [cur]: 'no' }); setPick(null); }}
            >
              Отклонить заявку с причиной
            </Button>
            {/* Кнопка говорит, что именно сделает ✳: «принять состав» и «принять
                состав без двоих» — разные решения, и разница должна стоять на
                самой кнопке, а не подписью сбоку. */}
            <Button
              variant="primary"
              onPress={() => { setDone({ ...done, [cur]: 'ok' }); setPick(null); }}
            >
              <Check size={14} />
              {out.length
                ? `Принять состав без ${out.length} ${plural(out.length, 'игрока', 'игроков', 'игроков')}`
                : 'Принять состав'}
            </Button>
          </div>
        )}
        <div className="mt-4">
          <Bar>{AGE_RULE}</Bar>
        </div>
      </Panel>
    </>
  );
};

/** Вкладки экрана заявок: подпись и то, какие решённые заявки под ней. Один
    набор на оба формата — на десктопе `PageTabs`, на телефоне полоса, которая
    уезжает вбок. Без `kind` — очередь тех, кого ещё разбирают.

    Вкладки «Отклонены системой» здесь нет ✳ (31.08.2026, решение владельца
    продукта): заявка, не прошедшая по взносу, документам или возрасту, к судье
    не попадает вовсе — система отвечает заявителю в момент подачи. На экране
    судьи остаётся то, что решает человек. */
const BID_TABS: { t: string; kind?: string }[] = [
  { t: 'Ждут решения · 8' },
  { t: 'Приняты · 104', kind: 'Приняты' },
  { t: 'Отклонены судьёй · 3', kind: 'Отклонены судьёй' },
  { t: 'Отозваны · 4', kind: 'Отозваны' },
];

export function Bids6_2({ tab }: { tab?: string }) {
  return (
    <WebApp
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Заявки"
      title="Заявки участников"
      sub="Заявка № 14 · 4 игрока"
    >
      <PageTabs
        active={tab}
        items={BID_TABS.map((b) => ({
          t: b.t,
          view: b.kind ? <DecidedBids kind={b.kind} /> : <Waiting6_2 />,
        }))}
      />
    </WebApp>
  );
}

/** Э6.2 на телефоне: очередь заявок, состав выбранной и решение по ней.
    Таблица состава (игрок · не пройдено · состояние) в 392 px в три колонки не
    ложится — те же три величины стоят в строке одна под другой. Исключение
    отдельного игрока из состава остаётся десктопным: это разбор спорной
    заявки за столом, а не работа на ходу. */
const Waiting6_2Phone = () => {
  const [cur, setCur] = useState(BIDS[0].nm);
  const [done, setDone] = useState<Record<string, 'ok' | 'no'>>({});
  const bid = BIDS.find((b) => b.nm === cur)!;
  const squad = BIDS_SQUADS[bid.nm.split(' · ')[0]] ?? SQUAD;
  const verdict = done[cur];
  return (
    <>
      <Panel title="Ждут решения" extra={<Pill t={String(BIDS.length)} color="warning" />} flush>
        <div className="divide-y divide-neutral-100">
          {BIDS.map((b) => (
            <Row
              key={b.nm}
              nm={b.nm}
              sub={b.sub}
              pill={
                done[b.nm] === 'ok'
                  ? { t: 'ПРИНЯТА', cls: 'live' }
                  : done[b.nm] === 'no'
                    ? { t: 'ОТКЛОНЕНА', cls: 'bad' }
                    : { t: b.who, cls: 'reg' }
              }
              on={b.nm === cur}
              onSelect={() => setCur(b.nm)}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title={bid.nm}
        sub={`${bid.who.toLowerCase() === 'регион' ? 'Заявка региона' : bid.who} · подал ${bid.sub}`}
        extra={
          /* Слова те же, что на десктопе: «состав принят» и «заявка отклонена» —
             разные решения, и сокращать их до одного слова нельзя. */
          <Pl
            t={verdict === 'ok' ? 'СОСТАВ ПРИНЯТ' : verdict === 'no' ? 'ЗАЯВКА ОТКЛОНЕНА' : 'ЖДЁТ РЕШЕНИЯ'}
            cls={verdict === 'ok' ? 'live' : verdict === 'no' ? 'bad' : 'wait'}
          />
        }
        flush
      >
        <div className="divide-y divide-neutral-100">
          {squad.map((pl) => <PhonePly key={pl.nm} p={pl} />)}
        </div>
      </Panel>

      {verdict ? (
        <>
          <Bar tone={verdict === 'ok' ? 'success' : 'warning'}>
            {verdict === 'ok'
              ? 'Состав принят. Заявитель уведомлён, участники попадают в состав турнира.'
              : 'Заявка отклонена с причиной. Причина ушла заявителю — он может исправить и подать снова, пока приём открыт.'}
          </Bar>
          <Wide>
            <QuietAction
              onPress={() => {
                const next = { ...done };
                delete next[cur];
                setDone(next);
              }}
            >
              Вернуть заявку в очередь
            </QuietAction>
          </Wide>
        </>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          <Button variant="primary" onPress={() => setDone({ ...done, [cur]: 'ok' })}>
            <Check size={14} /> Принять состав
          </Button>
          <Button variant="outline" data-to="Э6.8" onPress={() => setDone({ ...done, [cur]: 'no' })}>
            Отклонить заявку с причиной
          </Button>
        </div>
      )}
      <Bar>{AGE_RULE}</Bar>
    </>
  );
};

export function Bids6_2Phone() {
  const [tab, setTab] = useState(BID_TABS[0].t);
  const hit = BID_TABS.find((b) => b.t === tab) ?? BID_TABS[0];
  return (
    <PhoneRoleApp
      role={at('ПРИЁМ ЗАЯВОК')}
      nav="Заявки"
      title="Заявки участников"
      sub="Заявка № 14 · 4 игрока"
    >
      <Strip>
        <FilterSeg items={BID_TABS.map((b) => b.t)} active={tab} onPick={setTab} />
      </Strip>
      {hit.kind ? <DecidedBids kind={hit.kind} /> : <Waiting6_2Phone />}
    </PhoneRoleApp>
  );
}

const Bids6_2States = () => (
  <States>
    <Shot tone="info" title="Заявок нет" text="Пустое состояние со сроком приёма.">
      <Frag w={480}>
        <EmptyBox title="Заявок пока нет" text="Приём открыт до 12.03, 18:00." />
      </Frag>
    </Shot>

    <Shot tone="warning" title="Заявка с непроходящим игроком" text="Кнопка «Принять» остаётся, но с предупреждением ✳.">
      <Frag>
        <Rows>
          <Row nm="Жумабеков Расул" sub="взнос не оплачен · медицинский допуск не приложен" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
        </Rows>
        <div className="mt-3">
          <Bar tone="warning">Решение за судьёй: система показывает несоответствие, но не решает за него.</Bar>
        </div>
      </Frag>
    </Shot>

    <Shot tone="info" title="Приём закрыт" text="Списки только на чтение." wide>
      <Frag>
        <Rows>
          <Row nm="112 участников · приём закрыт 12.03" sub="решения приняты, состав зафиксирован" pill={{ t: 'СОСТАВ СОБРАН', cls: 'live' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.3 · Сетка: формат, посев, сборка ────────────────────────── */

/** Э6.3 · Сетка — утверждение.

    Собирает сетку секретарь (Э7.3): систему проведения, жеребьёвку и саму
    сетку. Главный судья её **утверждает или возвращает с замечанием** — так
    границу задаёт документ федерации (решение 19.08.2026). При этом **доступ
    к любым параметрам турнира у судьи есть** ✳: он отвечает за соревнование
    целиком, но правка после утверждения уходит в журнал с автором (§12).

    Жеребьёвку проводит главный судья ✳ (комментарий федерации, 09.2026):
    раньше бросал секретарь, а судья утверждал — так была прочитана
    формулировка документа. Федерация поправила — бросает судья. Здесь же судья
    задаёт **регламент времени по кругам**: без него расписание не составить. */
const DRAW_TABS = ['Жеребьёвка', 'Регламент времени', 'Сетка'];
const DRAW_WAYS = ['Посев по рейтингу', 'Жребий'];

/** Сколько минут на матч в каждом круге. Пример федерации: предварительные
    первые три тура по 25 минут, дальше по 30; в плей-офф до 1/8 по 25, с
    четвертьфинала — по 30, финал — 35. */
type Round6 = { st: string; rd: string; min: number };

const ROUNDS6: Round6[] = [
  { st: 'Групповой этап', rd: 'туры 1–3', min: 25 },
  { st: 'Групповой этап', rd: 'туры 4 и далее', min: 30 },
  { st: 'Плей-офф', rd: '1/32 — 1/8', min: 25 },
  { st: 'Плей-офф', rd: '1/4 и полуфиналы', min: 30 },
  { st: 'Плей-офф', rd: 'финал и матч за 3-е место', min: 35 },
];

/** Сколько матчей в круге: числа регламента, из которых считаются стол-часы. */
const gamesOf = (r: Round6) =>
  r.rd === 'туры 1–3' ? 84 : r.rd === 'туры 4 и далее' ? 28 : r.rd === '1/32 — 1/8' ? 56 : r.rd.startsWith('1/4') ? 6 : 2;

/** Плитки Э6.3: число перебросов зависит от того, сколько раз бросали. */
const tiles6_3 = (n: number): Tile[] => [
  { v: '112', k: 'Участников в составе' },
  { v: '14', k: 'Регионов' },
  { v: '223', k: 'Матча по сетке' },
  { v: '16', k: 'Сеяных', tone: 'g' },
  { v: String(Math.max(0, n - 1)), k: 'Перебросов', tone: n > 1 ? 'a' : undefined },
];

/** Первые слоты: кто где стоит после посева или жребия. Один список на оба
    формата — строки реестра одинаково читаются и на 1200, и на 392 px. */
const Seeds6_3 = ({ n, lot }: { n: number; lot: boolean }) => (
  <Rows>
    <Row av={P.kim} nm="1 · Ким Георгий" sub="«Алатау» · рейтинг 2401" pill={{ t: 'ПОСЕВ №1', cls: 'reg' }} />
    <Row av={P.tok} nm="128 · Токаев Марат" sub="«Алатау» · рейтинг 2350" pill={{ t: 'ПОСЕВ №2', cls: 'reg' }} />
    <Row av={P.ahm} nm="65 · Ахметов Дархан" sub="«Алатау» · рейтинг 2120" pill={{ t: 'ПОСЕВ №3', cls: 'reg' }} />
    <Row
      av={P.bai}
      nm={n || !lot ? '12 · Байжанов Асхат' : '— · Байжанов Асхат'}
      sub="«Алатау» · рейтинг 2180"
      pill={lot ? { t: n ? 'ЖРЕБИЙ' : 'ЖДЁТ ЖРЕБИЯ', cls: n ? 'wait' : 'done' } : { t: 'ПОСЕВ №7', cls: 'reg' }}
    />
  </Rows>
);

/** Что собрал секретарь: то, под чем судья ставит «утвердить» или «вернуть». */
const Built6_3 = ({ n }: { n: number }) => (
  <Rows>
    <Row
      nm="Система проведения"
      sub="группы по 4 + плей-офф · 223 матча · 130 стол-часов из 480"
      pill={{ t: 'УКЛАДЫВАЕТСЯ', cls: 'live' }}
    />
    <Row nm="Жеребьёвка" sub={`провёл главный судья · ${n ? `бросков ${n}` : 'посев по рейтингу'}`} val="11.03, 15:40" />
    <Row nm="Сетка" sub="128 слотов · 16 bye добраны автоматически" val="11.03, 16:20" />
    <Row nm="Кто собрал" sub="Ким Лариса · главный секретарь" val="Э7.3" to="Э7.3" />
  </Rows>
);

export function Bracket6_3() {
  const [tab, setTab] = useState(DRAW_TABS[0]);
  /* Утверждена ли сетка. Возврат идёт с замечанием — секретарь должен знать,
     что переделывать. */
  const [ok, setOk] = useState<'' | 'yes' | 'back'>('');
  const [way, setWay] = useState(DRAW_WAYS[1]);
  const lot = way === DRAW_WAYS[1];
  /* Сколько раз бросали: первый бросок — не переброс. */
  const [n, setN] = useState(0);

  return (
    <WebApp role={at('СИСТЕМА ПРОВЕДЕНИЯ')} nav="Сетка" title="Жеребьёвка и сетка">
      <StatTiles items={tiles6_3(n)} />

      <div className="mb-4">
        <Segmented items={DRAW_TABS} value={tab} onPick={setTab} />
      </div>

      {tab === DRAW_TABS[0] && (
        /* Блок под блоком во всю ширину ✳ (30.08.2026): в двух колонках список
           «кто где стоит» шёл в половину ширины, а фамилия с клубом и рейтингом
           в неё не влезала. Панель держит отступ снизу сама. */
        <>
          <Panel
            title="Распределение по слотам"
            extra={<Pl t={!lot ? 'ПОСЕВ ГОТОВ' : n ? 'ЖРЕБИЙ ПРОВЕДЁН' : 'ЖРЕБИЙ НЕ БРОШЕН'} cls={!lot || n ? 'live' : 'wait'} />}
          >
            <div className="mb-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Как разводим участников</span>
              <div><FilterSeg items={DRAW_WAYS} active={way} onPick={(v) => { setWay(v); setN(0); }} /></div>
            </div>
            <FormGrid>
              <FieldView label="Основание посева" value="Рейтинг ФНТ РК на 05.03.2026" wide />
              <FieldView label="Сеяных" value="16 · по разным четвертям" />
              <FieldView
                label={lot ? 'Последний жребий' : 'Случайность'}
                value={lot ? (n ? `бросок ${n} · Оспанов Т.` : 'не бросали') : 'не участвует'}
              />
            </FormGrid>
            {/* При посеве по рейтингу бросать нечего: расстановка выводится из
                рейтинга целиком. Кнопка появляется только у жребия. */}
            <div className="mt-4 flex flex-col items-start gap-2">
              {lot && (
                <Button variant="primary" onPress={() => setN(n + 1)}>
                  <Shuffle size={15} /> {n ? 'Перебросить жребий' : 'Провести жеребьёвку'}
                </Button>
              )}
              <QuietAction>
                <Pencil size={14} /> {lot ? 'Изменить состав сеяных' : 'Изменить основание посева'}
              </QuietAction>
            </div>
            <div className="mt-3">
              <Bar>
                Жеребьёвка лежит на главном судье ✳ (комментарий федерации, 09.2026). Секретарь
                вправе её видеть и с ней работать — бросить, перебросить, пересобрать слоты
                (Э7.3), — но утверждает только главный судья. Прежний результат каждого броска
                остаётся в журнале: переигранный жребий участники вправе проверить.
              </Bar>
            </div>
          </Panel>

          <Panel title="Кто где стоит" extra={<span className="text-xs text-neutral-500">первые слоты</span>}>
            <Seeds6_3 n={n} lot={lot} />
            <div className="mt-3">
              <Bar>Весь состав со слотами — у секретаря (Э7.3): он собирает по ним сетку.</Bar>
            </div>
          </Panel>
        </>
      )}

      {tab === DRAW_TABS[1] && (
        <>
          {/* Регламент времени ✳ (комментарий федерации, 09.2026): судья
              прописывает, сколько минут даётся на матч в каждом круге. Круги
              идут не по одной мерке — предварительные короче финальных, — и из
              этих чисел потом складывается игровой день в расписании. */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-[12.5px] text-neutral-500">
              Минуты на матч по кругам · из них складывается игровой день в расписании (Э6.4)
            </span>
            <QuietAction><Pencil size={14} /> Изменить регламент</QuietAction>
          </div>

          <DataTable
            cols={['Этап', 'Круг', 'Минут на матч', 'Матчей', 'Стол-часов']}
            grid="1.2fr 1.2fr 120px 90px 100px"
            rows={ROUNDS6.map((r) => {
              const games = gamesOf(r);
              return {
                key: r.st + r.rd,
                cells: [
                  <span key="s" className="font-medium">{r.st}</span>,
                  <span key="r">{r.rd}</span>,
                  <b key="m" className="tabular-nums">{r.min}</b>,
                  <span key="g" className="tabular-nums">{games}</span>,
                  <span key="h" className="tabular-nums text-neutral-500">{Math.round((games * r.min) / 60)}</span>,
                ],
              };
            })}
          />

          <div className="mt-3">
            <Bar>
              Стол-часы считаются из регламента, а не задаются руками: поменял минуты — сразу
              видно, влезает ли турнир в игровые дни. При 20 столах и 8 часах в день зал даёт
              480 стол-часов.
            </Bar>
          </div>
        </>
      )}

      {tab === DRAW_TABS[2] && (
        /* Тот же вертикальный поток ✳: сначала то, что собрал секретарь, — на
           это судья и отвечает «утвердить» или «вернуть», — а под решением
           параметры турнира, из которых сетка выросла. */
        <>
          <Panel
            title="Что собрал секретарь"
            extra={<Pl t={ok === 'yes' ? 'УТВЕРЖДЕНА' : ok === 'back' ? 'ВОЗВРАЩЕНА' : 'ЖДЁТ УТВЕРЖДЕНИЯ'} cls={ok === 'yes' ? 'live' : ok === 'back' ? 'bad' : 'wait'} />}
          >
            <Built6_3 n={n} />

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-neutral-500">
                {ok === 'yes'
                  ? 'Сетка зафиксирована. Дальше расписание — его тоже собирает секретарь'
                  : ok === 'back'
                    ? 'Замечание ушло секретарю: он пересоберёт и передаст снова'
                    : 'Утверждение коллегией сетке не требуется (§4.6) — решение за главным судьёй'}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <QuietAction onPress={() => setOk('back')}>Вернуть с замечанием</QuietAction>
                <Button variant="primary" onPress={() => setOk('yes')}>
                  <Check size={15} /> Утвердить сетку
                </Button>
              </span>
            </div>
          </Panel>

          <Panel title="Параметры турнира" extra={<Pl t="ПОЛНЫЙ ДОСТУП" cls="reg" />}>
            <FormGrid>
              <FieldView label="Формат" value="Группы по 4 + плей-офф" />
              <FieldView label="Партий в матче" value="до 3 из 5" />
              <FieldView label="Утешительная сетка" value="нет" />
              <FieldView label="Столов в зале" value="20 · трансляция с 2" />
            </FormGrid>
            <div className="mt-3">
              <Bar>
                Главный судья отвечает за соревнование целиком и может поправить любой параметр —
                формат, партии, столы. Правка после утверждения сохраняется с автором и уходит в
                журнал (§12), а секретарь получает уведомление: он пересоберёт по новым вводным.
              </Bar>
            </div>
            <QuietAction><Pencil size={14} /> Изменить параметры</QuietAction>
          </Panel>
        </>
      )}
    </WebApp>
  );
}

/** Э6.3 на телефоне: те же три части — жеребьёвка, регламент времени и решение
    по сетке. Таблица регламента (этап · круг · минуты · матчи · стол-часы) в
    392 px в пять колонок не ложится: те же числа стоят строкой реестра, где
    минуты — главное значение справа. */
export function Bracket6_3Phone() {
  const [tab, setTab] = useState(DRAW_TABS[0]);
  const [ok, setOk] = useState<'' | 'yes' | 'back'>('');
  const [way, setWay] = useState(DRAW_WAYS[1]);
  const lot = way === DRAW_WAYS[1];
  const [n, setN] = useState(0);

  return (
    <PhoneRoleApp role={at('СИСТЕМА ПРОВЕДЕНИЯ')} nav="Сетка" title="Жеребьёвка и сетка">
      <PhoneTiles>
        <StatTiles items={tiles6_3(n)} />
      </PhoneTiles>

      <Strip>
        <Segmented items={DRAW_TABS} value={tab} onPick={setTab} />
      </Strip>

      {tab === DRAW_TABS[0] && (
        <>
          <Panel
            title="Распределение по слотам"
            extra={<Pl t={!lot ? 'ПОСЕВ ГОТОВ' : n ? 'ЖРЕБИЙ ПРОВЕДЁН' : 'ЖРЕБИЙ НЕ БРОШЕН'} cls={!lot || n ? 'live' : 'wait'} />}
          >
            <Strip>
              <FilterSeg items={DRAW_WAYS} active={way} onPick={(v) => { setWay(v); setN(0); }} />
            </Strip>
            {/* Поля в одну колонку: две на 392 px превращаются в две узкие
                полосы, где не помещается ни подпись, ни значение. */}
            <FormGrid>
              <FieldView label="Основание посева" value="Рейтинг ФНТ РК на 05.03.2026" wide />
              <FieldView label="Сеяных" value="16 · по разным четвертям" wide />
              <FieldView
                label={lot ? 'Последний жребий' : 'Случайность'}
                value={lot ? (n ? `бросок ${n} · Оспанов Т.` : 'не бросали') : 'не участвует'}
                wide
              />
            </FormGrid>
            {lot && (
              <Button className="mt-4 w-full" variant="primary" onPress={() => setN(n + 1)}>
                <Shuffle size={15} /> {n ? 'Перебросить жребий' : 'Провести жеребьёвку'}
              </Button>
            )}
          </Panel>

          <Panel title="Кто где стоит" extra={<span className="text-xs text-neutral-500">первые слоты</span>} flush>
            <Seeds6_3 n={n} lot={lot} />
          </Panel>
          <Bar>Весь состав со слотами — у секретаря (Э7.3): он собирает по ним сетку.</Bar>
        </>
      )}

      {tab === DRAW_TABS[1] && (
        <>
          <div className="mb-2 text-[12.5px] text-neutral-500">
            Минуты на матч по кругам · из них складывается игровой день (Э6.4)
          </div>
          <Rows>
            {ROUNDS6.map((r) => (
              <Row
                key={r.st + r.rd}
                nm={`${r.st} · ${r.rd}`}
                sub={`${gamesOf(r)} матчей · ${Math.round((gamesOf(r) * r.min) / 60)} стол-часов`}
                val={`${r.min} мин`}
              />
            ))}
          </Rows>
          <div className="mt-3">
            <Bar>
              Стол-часы считаются из регламента, а не задаются руками: при 20 столах и 8 часах в
              день зал даёт 480 стол-часов.
            </Bar>
          </div>
        </>
      )}

      {tab === DRAW_TABS[2] && (
        <>
          <Panel
            title="Что собрал секретарь"
            extra={<Pl t={ok === 'yes' ? 'УТВЕРЖДЕНА' : ok === 'back' ? 'ВОЗВРАЩЕНА' : 'ЖДЁТ УТВЕРЖДЕНИЯ'} cls={ok === 'yes' ? 'live' : ok === 'back' ? 'bad' : 'wait'} />}
            flush
          >
            <Built6_3 n={n} />
          </Panel>
          <div className="mb-4 flex flex-col gap-2">
            <Button variant="primary" onPress={() => setOk('yes')}>
              <Check size={15} /> Утвердить сетку
            </Button>
            <Button variant="outline" onPress={() => setOk('back')}>Вернуть с замечанием</Button>
          </div>

          <Panel title="Параметры турнира" extra={<Pl t="ПОЛНЫЙ ДОСТУП" cls="reg" />}>
            <FormGrid>
              <FieldView label="Формат" value="Группы по 4 + плей-офф" wide />
              <FieldView label="Партий в матче" value="до 3 из 5" wide />
              <FieldView label="Утешительная сетка" value="нет" wide />
              <FieldView label="Столов в зале" value="20 · трансляция с 2" wide />
            </FormGrid>
            <div className="mt-3">
              <Bar>
                Правка после утверждения сохраняется с автором и уходит в журнал (§12), а секретарь
                получает уведомление: он пересоберёт по новым вводным.
              </Bar>
            </div>
          </Panel>
        </>
      )}
    </PhoneRoleApp>
  );
}

const Bracket6_3States = () => (
  <States>
    <Shot tone="danger" title="Состав не собран" text="Экран закрыт с пояснением: сетку раньше состава не строят.">
      <Frag w={480}>
        <EmptyBox title="Сетку строить рано" text="Приём заявок ещё открыт: сетка собирается по закрытому составу." />
      </Frag>
    </Shot>

    <Shot
      tone="warning"
      title="Ни одна система не укладывается в столы и часы"
      text="Все варианты с красным светофором, судья решает сам."
    >
      <Frag>
        <Rows>
          <Row nm="Олимпийская с группами" sub="нужно 9 часов · есть 8" pill={{ t: 'НЕ ВЛЕЗАЕТ', cls: 'bad' }} />
          <Row nm="Круговая" sub="нужно 14 часов · есть 8" pill={{ t: 'НЕ ВЛЕЗАЕТ', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.4 · Расписание и столы ──────────────────────────────────── */

const HOURS = ['10:00', '11:30', '13:00', '14:30'];
const TABLES8 = [1, 2, 3, 4, 5, 6, 7, 8];
const STREAM = [1, 3];   // столы с трансляцией
const PAIRS = [
  'Ким Г. — Сәтбаев Е.', 'Токаев М. — Нұрғали А.', 'Гладун И. — Ахметов Д.', 'Байжанов А. — Досжан М.',
  'Мұрат Е. — Сарсенов А.', 'Тлеуова А. — Оралова М.', 'Ким Г. — Досжан М.', 'Токаев М. — Гладун И.',
];
/** Подсвеченные конфликты: участник в двух местах и занятый стол.
    Ключ — «волна дня · стол», как и раньше. */
const CONFLICT: Record<string, string> = {
  '2-3': 'участник уже на столе 6',
  '3-6': 'стол занят до 15:10',
};
/** Клетки без матча: стол в этот час свободен. */
const EMPTY = new Set(['2-8', '3-7', '3-8']);

/** Минут на матч по кругам — те же числа, что судья задал в регламенте времени
    (Э6.3, `ROUNDS6`). Раньше день был таблицей одинаковых клеток, и
    длительность круга в раскладке не участвовала вовсе: финал занимал ровно
    столько же места, сколько 1/32. На шкале времени она задаёт высоту блока —
    и день видно таким, каким он пройдёт. */
const RD_MIN: Record<string, number> = {
  '1/32': 25, '1/16': 25, '1/8': 25, '1/4': 30, '1/2': 30, Финал: 35, 'За 3-е место': 35,
};

/** Прибавить минуты к «ЧЧ:ММ»: конец матча считается из регламента, а не
    пишется руками — поменялись минуты на круг, поменялась и сетка времени. */
const plus = (t: string, m: number) => {
  const [h, mm] = t.split(':').map(Number);
  const all = h * 60 + mm + m;
  return `${String(Math.floor(all / 60)).padStart(2, '0')}:${String(all % 60).padStart(2, '0')}`;
};

/** Волна дня: в какой час какой круг и на каких столах он идёт. */
type Wave = { at: string; rd: string; tables: number[] };

/** Волны первых двух дней: четыре часа × восемь столов минус свободные
    клетки — ровно та раскладка, что была в таблице. */
const wavesOf = (rounds: string[]): Wave[] =>
  rounds.map((rd, r) => ({
    at: HOURS[r],
    rd,
    tables: TABLES8.filter((c) => !EMPTY.has(`${r}-${c}`)),
  }));

/** Три дня игры: в каждом свои круги сетки. На третий день столов в работе
    меньше и волн меньше: полуфинала два, финал и матч за 3-е место — по одному,
    и растягивать их на восемь столов, как делала таблица, было неправдой.
    Конфликты подсвечены только в том дне, где они есть: день без конфликтов
    должен выглядеть спокойным. */
type Day6 = { t: string; cap: string; waves: Wave[]; bad: boolean };

const DAYS6_4: Day6[] = [
  { t: 'День 1 · 12.03', cap: 'День 1 · 12 марта · столы 1–8 из 20', waves: wavesOf(['1/32', '1/32', '1/16', '1/16']), bad: true },
  { t: 'День 2 · 13.03', cap: 'День 2 · 13 марта · столы 1–8 из 20', waves: wavesOf(['1/8', '1/8', '1/4', '1/4']), bad: false },
  {
    t: 'День 3 · 14.03',
    cap: 'День 3 · 14 марта · столы 1–2 из 20',
    waves: [
      { at: '10:00', rd: '1/2', tables: [1, 2] },
      { at: '13:00', rd: 'За 3-е место', tables: [2] },
      { at: '14:30', rd: 'Финал', tables: [1] },
    ],
    bad: false,
  },
];

/** «Стол занят до 15:10» — на шкале времени это не подпись, а настоящий наезд:
    матч 13:00 на столе 6 тянется до 15:10, и матч 14:30 на этом столе стоять не
    может. Ключ — тот же «волна · стол», что у конфликтов. */
const OVERRUN: Record<string, string> = { '2-6': '15:10' };

/** Матч на шкале времени: к блоку календаря нужны ещё стол и круг — они уходят
    в список того же дня. */
type Slot6 = SlotEvent & { tbl: number; rd: string };

/** Матчи дня блоками: колонка — стол, начало — час волны, длина — минуты круга
    из регламента (Э6.3). Один и тот же набор блоков кормит и сетку времени, и
    список: два взгляда на один день расходиться не должны. */
const slotsOf = (day: Day6): Slot6[] =>
  day.waves.flatMap((w, r) =>
    w.tables.map((c): Slot6 => {
      const bad: string | undefined = day.bad ? CONFLICT[`${r}-${c}`] : undefined;
      const over: string | undefined = day.bad ? OVERRUN[`${r}-${c}`] : undefined;
      return {
        id: `${r}-${c}`,
        col: `s${c}`,
        tbl: c,
        rd: w.rd,
        from: w.at,
        till: over ?? plus(w.at, RD_MIN[w.rd] ?? 25),
        nm: PAIRS[(r * 3 + c) % PAIRS.length],
        sub: bad ?? (over ? `затянулся — стол занят до ${over}` : w.rd),
        /* Красный — конфликт, жёлтый — затянувшийся матч, синий — стол с
           трансляцией (его смотрят отдельно), серый — обычный матч по плану.
           Заливать все 29 блоков одним цветом бессмысленно: тогда цвет ничего
           не сообщает. */
        tone: bad ? 'danger' : over ? 'warning' : STREAM.includes(c) ? 'accent' : 'neutral',
      };
    }),
  );

/** Колонки сетки — столы, занятые в этот день; у трансляционных подпись «эфир». */
const colsOf = (day: Day6) =>
  [...new Set(day.waves.flatMap((w) => w.tables))]
    .sort((a, b) => a - b)
    .map((n) => ({ key: `s${n}`, t: `Стол ${n}`, sub: STREAM.includes(n) ? 'эфир' : undefined }));

/** Сетка «час × стол» одного дня — календарным `TimeGrid` (тем же приёмом, что
    недельный вид Google Calendar).

    Было: таблица из одинаковых клеток, где час стоял слева подписью, а
    длительность матча в раскладке не участвовала. Три вещи, ради которых
    расписание и смотрят, в ней не читались — когда стол реально занят, сколько
    простоя между кругами и где два матча налезли друг на друга. На шкале
    времени конфликт «стол занят» перестал быть красной подписью в клетке и стал
    видимым пересечением блоков: `TimeGrid` делит ширину колонки между теми, кто
    стоит в одно время. Свободные клетки исчезли за ненадобностью — пустое место
    в сетке времени и есть свободный стол. */
const Grid6_4 = ({ day }: { day: Day6 }) => (
  <>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-[12px] text-neutral-500">
      <span className="flex items-center gap-1.5">
        <Radio size={12} className="text-red-500" /> Трансляция — столы {STREAM.join(' и ')}
      </span>
      <span>Высота блока — минуты на круг из регламента времени (Э6.3)</span>
    </div>
    {/* Шкала с 10:00: игровой день начинается в 10, последнее, что на ней
        стоит, — финал 14:30 плюс 35 минут регламента. Красной линии «сейчас»
        здесь намеренно нет: расписание ещё утверждают, турнир не начался, и
        линия текущего времени соврала бы. */}
    <TimeGrid cols={colsOf(day)} events={slotsOf(day)} from={10} till={15} />
  </>
);

/** Тот же день списком: когда, где, кто и какой круг — по порядку времени.
    Строки собираются из тех же блоков, что стоят на шкале, поэтому список и
    сетка не могут разойтись. */
const List6_4 = ({ day, max = 12 }: { day: Day6; max?: number }) => {
  const slots = [...slotsOf(day)].sort((a, b) => a.from.localeCompare(b.from) || a.tbl - b.tbl);
  /* На десктопе список — второй взгляд рядом со шкалой, и длинный хвост в нём
     не нужен: день целиком виден на сетке. На телефоне сетки нет, и список
     показывает день полностью (`max` задаётся вызовом). */
  const shown = slots.slice(0, max);
  return (
    <>
      <Rows>
        {shown.map((s) => (
          <Row
            key={s.id}
            nm={s.nm}
            sub={`${s.from}–${s.till} · стол ${s.tbl} · ${s.rd}`}
            pill={
              s.tone === 'danger'
                ? { t: 'КОНФЛИКТ', cls: 'bad' }
                : s.tone === 'warning'
                  ? { t: 'ЗАТЯНУЛСЯ', cls: 'wait' }
                  : { t: 'РАССТАВЛЕН', cls: 'reg' }
            }
          />
        ))}
      </Rows>
      {slots.length > shown.length && (
        <div className="mt-3 text-[12.5px] text-neutral-500">
          Показаны первые {shown.length} матчей из {slots.length} — весь день целиком виден на сетке времени
        </div>
      )}
    </>
  );
};

/** День расписания: сетка «дни × столы» или тот же день списком. */
const Day6_4 = ({ day }: { day: Day6 }) => (
  <Panel title={day.cap}>
    <PageTabs
      items={[
        { t: 'Дни × столы', view: <Grid6_4 day={day} /> },
        { t: 'Списком', view: <List6_4 day={day} /> },
      ]}
    />
  </Panel>
);

/** Как идут игры: по часам, живой очередью или вперемешку — часть турнира
    так, часть иначе. */
const ORDER6 = ['По расписанию', 'Живая очередь', 'Смешанно'];

/** Живая очередь: очередь пар на освободившиеся столы. Часов нет — есть
    порядок; следующая пара уходит на тот стол, который освободился первым. */
const LiveOrder6_4 = () => (
  /* Очередь и столы — блок под блоком во всю ширину ✳ (30.08.2026): сначала
     порядок пар, под ним столы, на которые их вызывают. */
  <>
    <Panel title="Очередь пар" extra={<Pl t="ЖИВАЯ ОЧЕРЕДЬ" cls="live" />}>
      <Rows>
        <Row nm="1 · Смагулов — Цой" sub="1/8 · вызвана на стол 4" pill={{ t: 'ИГРАЕТ', cls: 'live' }} />
        <Row nm="2 · Ким — Сериков" sub="1/8 · вызвана на стол 2" pill={{ t: 'ИГРАЕТ', cls: 'live' }} />
        <Row nm="3 · Токаев — Гладун" sub="1/8 · следующая на освободившийся" pill={{ t: 'СЛЕДУЮЩАЯ', cls: 'wait' }} />
        <Row nm="4 · Пак — Мұрат" sub="1/8 · ждёт" />
        <Row nm="5 · Байжанов — Досжан" sub="1/8 · ждёт" />
      </Rows>
      <div className="mt-3">
        <Bar>
          Очередь ведёт главный судья: он вызывает пару на освободившийся стол (Э6.6). Времени в
          строке нет намеренно ✳ — в живой очереди его нельзя пообещать, а показанное время
          участники читают как обещание.
        </Bar>
      </div>
    </Panel>

    <Panel title="Столы" extra={<span className="text-xs text-neutral-500">8 из 20 в игре</span>}>
      <Rows>
        <Row nm="Стол 4" sub="Смагулов — Цой · идёт 12 минут" pill={{ t: 'ЗАНЯТ', cls: 'live' }} />
        <Row nm="Стол 2" sub="Ким — Сериков · идёт 4 минуты" pill={{ t: 'ЗАНЯТ', cls: 'live' }} />
        <Row nm="Стол 7" sub="освободился — следующая пара по очереди" pill={{ t: 'СВОБОДЕН', cls: 'wait' }} action="Вызвать пару" />
        <Row nm="Стол 9" sub="освободился" pill={{ t: 'СВОБОДЕН', cls: 'wait' }} action="Вызвать пару" />
      </Rows>
      <div className="mt-3">
        <Bar>
          Регламент времени по кругам (Э6.3) в живой очереди тоже работает: он говорит, сколько
          матч должен занять, — по нему судья и понимает, укладывается ли зал в игровой день.
        </Bar>
      </div>
    </Panel>
  </>
);

const TILES6_4: Tile[] = [
  { v: '127', k: 'Матчей в сетке' },
  { v: '3', k: 'Дня игры' },
  { v: '20', k: 'Столов в зале' },
  { v: '2', k: 'Конфликта', tone: 'a' },
  { v: '2', k: 'Трансляционных стола' },
];

export function Schedule6_4({ tab }: { tab?: string }) {
  const [order, setOrder] = useState(ORDER6[0]);
  return (
    <WebApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Расписание"
      title="Расписание — утверждение"
      sub="Разложил секретарь (Э7.4) · дни × столы · 127 матчей сетки по трём дням игры"
    >
      <StatTiles items={TILES6_4} />
      {/* Порядок игр ✳ (комментарий федерации, 09.2026): турнир можно запустить
          и **без расписания — по живой очерёдности**. Есть старты, которые в
          расписание не укладываются: любительские, где состав доигрывается на
          месте, или день, съехавший из-за затянувшихся матчей. Порядок
          выбирается **на весь турнир или на его часть**: первые дни по
          расписанию, финальный день живой очередью — обычный случай. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <FilterSeg items={ORDER6} active={order} onPick={setOrder} />
        <span className="text-[12.5px] text-neutral-500">
          {order === ORDER6[0]
            ? '2 конфликта: их видно на дне 1 — сначала их и разбирают'
            : order === ORDER6[1]
              ? 'Пары вызываются на освободившийся стол; часов в расписании нет'
              : 'Дни 1–2 по расписанию, финальный день — живой очередью'}
        </span>
      </div>

      {/* Утверждать в живой очереди нечего — кнопки утверждения там нет. */}
      {order !== ORDER6[1] && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
          <Pl t="ЖДЁТ УТВЕРЖДЕНИЯ" cls="wait" />
          <span className="flex-1 text-[12.5px] text-neutral-500">
            Собрал секретарь (Э7.4) — судья утверждает или возвращает
          </span>
          <QuietAction>Вернуть с замечанием</QuietAction>
          <Button variant="primary">
            <Check size={15} /> Утвердить расписание
          </Button>
        </div>
      )}

      {order === ORDER6[1] ? (
        <LiveOrder6_4 />
      ) : (
        <PageTabs
          active={tab}
          items={
            order === ORDER6[2]
              ? [
                ...DAYS6_4.slice(0, 2).map((d) => ({ t: d.t, view: <Day6_4 day={d} /> })),
                { t: 'День 3 · живая очередь', view: <LiveOrder6_4 /> },
              ]
              : DAYS6_4.map((d) => ({ t: d.t, view: <Day6_4 day={d} /> }))
          }
        />
      )}
    </WebApp>
  );
}

/** Э6.4 на телефоне: тот же день, но списком, а не сеткой времени.
    Шкала «час × стол» в 392 px нечитаема — восемь колонок столов на такой
    ширине дают по 40 px на блок, и в них не помещается ни пара, ни время.
    Список собран из тех же блоков, что и шкала (`slotsOf`), поэтому день в двух
    форматах не может разойтись: время, стол, круг и конфликт стоят в строке. */
export function Schedule6_4Phone() {
  const [order, setOrder] = useState(ORDER6[0]);
  const [day, setDay] = useState(DAYS6_4[0].t);
  const cur = DAYS6_4.find((d) => d.t === day) ?? DAYS6_4[0];
  /* В смешанном порядке финальный день идёт живой очередью — как на десктопе. */
  const live = order === ORDER6[1] || (order === ORDER6[2] && day === DAYS6_4[2].t);
  return (
    <PhoneRoleApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Расписание"
      title="Расписание — утверждение"
      sub="Разложил секретарь (Э7.4) · 127 матчей по трём дням"
    >
      <PhoneTiles>
        <StatTiles items={TILES6_4} />
      </PhoneTiles>

      <Strip>
        <FilterSeg items={ORDER6} active={order} onPick={setOrder} />
      </Strip>

      {order !== ORDER6[1] && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
          <span className="flex items-center gap-2">
            <Pl t="ЖДЁТ УТВЕРЖДЕНИЯ" cls="wait" />
            <span className="text-[12.5px] text-neutral-500">собрал секретарь (Э7.4)</span>
          </span>
          <Button variant="primary"><Check size={15} /> Утвердить расписание</Button>
          <Button variant="outline">Вернуть с замечанием</Button>
        </div>
      )}

      {order !== ORDER6[1] && (
        <Strip>
          <FilterSeg items={DAYS6_4.map((d) => d.t)} active={day} onPick={setDay} />
        </Strip>
      )}

      {live ? (
        <LiveOrder6_4 />
      ) : (
        <>
          <div className="mb-2 text-[12.5px] text-neutral-500">{cur.cap}</div>
          <List6_4 day={cur} max={99} />
          <div className="mt-3">
            <Bar>
              На телефоне день идёт списком по времени: сетка «час × стол» на 392 px нечитаема, а
              наезд матчей на ней виден пометкой «затянулся» в строке.
            </Bar>
          </div>
        </>
      )}
    </PhoneRoleApp>
  );
}

const Schedule6_4States = () => (
  <States>
    <Shot tone="info" title="Сетки ещё нет" text="Экран пуст, со ссылкой на Э6.3." wide>
      <Frag>
        <EmptyBox title="Расписание строится по сетке" text="Сначала соберите сетку — Э6.3." />
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.5 · Судьи на столах ─────────────────────────────────────── */

type Slot = { n: number; j: string | null; cat?: string };

const SLOTS: Slot[] = [
  { n: 1, j: 'Пак Сергей', cat: 'первая' },
  { n: 2, j: 'Ерлан Батыр', cat: 'национальная' },
  { n: 3, j: 'Ахметов Кайрат', cat: 'первая' },
  { n: 4, j: 'Нұрланов Данияр', cat: 'судья по спорту' },
  { n: 5, j: 'Сейтқали Айдос', cat: 'первая' },
  { n: 6, j: 'Абдрахманов Ерлан', cat: 'национальная' },
  { n: 7, j: null },
  { n: 8, j: 'Тұрсынов Мади', cat: 'первая' },
  { n: 9, j: 'Бектұров Руслан', cat: 'судья по спорту' },
  { n: 10, j: 'Қалиев Санжар', cat: 'национальная' },
  { n: 11, j: null },
  { n: 12, j: 'Аманжол Нұрлан', cat: 'первая' },
  { n: 13, j: 'Дәулет Жасұлан', cat: 'судья по спорту' },
  { n: 14, j: 'Жақсылық Бекзат', cat: 'первая' },
];

/** Номер судьи на турнир ✳ (комментарий федерации, 09.2026). На время
    соревнования судья получает номер — им он и стоит в расписании: «С-4», а не
    «Нұрланов Данияр». Фамилии в клетку расписания не влезают, а распечатанную
    таблицу со столами и часами читают с расстояния.

    Номер живёт один турнир: на следующем старте у того же человека будет
    другой. Это не идентификатор судьи, а место в наряде этого соревнования. */
const JNUM: Record<string, number> = {
  'Пак Сергей': 1,
  'Ерлан Батыр': 2,
  'Ахметов Кайрат': 3,
  'Нұрланов Данияр': 4,
  'Сейтқали Айдос': 5,
  'Абдрахманов Ерлан': 6,
  'Тұрсынов Мади': 8,
  'Бектұров Руслан': 9,
  'Қалиев Санжар': 10,
  'Аманжол Нұрлан': 12,
  'Дәулет Жасұлан': 13,
  'Жақсылық Бекзат': 14,
  'Мұқанов Талғат': 15,
  'Ибраев Қанат': 16,
};

const jn = (nm: string) => (JNUM[nm] ? `С-${JNUM[nm]}` : '—');

const JUDGE_VIEWS = ['Столы зала', 'Расписание судей'];

/** Карточка стола с судьёй: одна и та же в четыре колонки на десктопе и в две
    на телефоне. Фамилия и категория стоят двумя строками — в узкой карточке
    телефона одной строкой от фамилии остаётся половина, а категория пропадает
    совсем, хотя именно по ней судью и ставят на стол. */
const TableSlot = ({ s }: { s: Slot }) => (
  <div
    className={
      'rounded-lg border px-3 py-2 leading-tight ' +
      (s.j ? 'border-neutral-200 bg-white' : 'border-red-300 bg-red-50')
    }
  >
    <div className="text-[11px] font-semibold text-neutral-500">Стол {s.n}</div>
    {s.j ? (
      <>
        <div className="mt-0.5 truncate text-[12.5px] font-medium">{s.j}</div>
        <div className="truncate text-[11px] text-neutral-400">{s.cat}</div>
      </>
    ) : (
      <div className="mt-1"><Pl t="СУДЬЯ НЕ НАЗНАЧЕН" cls="bad" /></div>
    )}
  </div>
);

/** Часы, на которые судья не назначен: та же тройка и в шкале смен, и списком. */
const HOLES6_5 = ['10:00 · стол 5', '13:00 · стол 6', '16:00 · стол 4'];

/** Наряд турнира: кто свободен сейчас и кто уже стоит на столе. Один список на
    оба формата — на телефоне он же, потому что строка реестра узкая по природе. */
const Crew6_5 = () => (
  <>
    <Sec>Свободны сейчас</Sec>
    <Rows>
      <Row av={P.erl} nm="Мұқанов Талғат" sub="высшая национальная категория" action="На стол" />
      <Row av={P.pak} nm="Ибраев Қанат" sub="первая категория" action="На стол" />
    </Rows>
    <Sec>Уже на столах</Sec>
    <Rows>
      <Row nm="Пак Сергей" sub="первая категория" val="стол 1" pill={{ t: 'НА СТОЛЕ', cls: 'live' }} />
      <Row nm="Ерлан Батыр" sub="национальная категория" val="стол 2" pill={{ t: 'НА СТОЛЕ', cls: 'live' }} />
      <Row nm="Ахметов Кайрат" sub="первая категория" val="стол 3" pill={{ t: 'НА СТОЛЕ', cls: 'live' }} />
    </Rows>
  </>
);

/** Расписание судей — той же сеткой времени, что расписание игр ✳ (комментарий
    федерации, 09.2026): время слева, столы колонками, в блоке — номер. Одна
    раскладка на две вещи, потому что вопрос один — «кто где и когда», — и
    печатаются они рядом. Поэтому переезд расписания игр на календарный
    `TimeGrid` (Э6.4) тянет за собой и это: разойдясь формой, два листа
    перестали бы читаться как пара.

    Часы смен прежние, но подряд идущие часы одного судьи на одном столе
    склеены в один блок: в таблице это были пять одинаковых клеток, и длину
    смены приходилось считать глазами, а пересменок был не виден вовсе. */
const JSHIFT: { h: string; t: (string | null)[] }[] = [
  { h: '10:00', t: ['Пак Сергей', 'Ерлан Батыр', 'Ахметов Кайрат', 'Нұрланов Данияр', null, 'Абдрахманов Ерлан'] },
  { h: '11:30', t: ['Пак Сергей', 'Ерлан Батыр', 'Ахметов Кайрат', 'Нұрланов Данияр', 'Сейтқали Айдос', 'Абдрахманов Ерлан'] },
  { h: '13:00', t: ['Тұрсынов Мади', 'Бектұров Руслан', 'Қалиев Санжар', 'Аманжол Нұрлан', 'Сейтқали Айдос', null] },
  { h: '14:30', t: ['Тұрсынов Мади', 'Бектұров Руслан', 'Қалиев Санжар', 'Аманжол Нұрлан', 'Дәулет Жасұлан', 'Жақсылық Бекзат'] },
  { h: '16:00', t: ['Мұқанов Талғат', 'Ибраев Қанат', 'Қалиев Санжар', null, 'Дәулет Жасұлан', 'Жақсылық Бекзат'] },
];

const JTABLES = [1, 2, 3, 4, 5, 6];
/** Чем закрывается последняя смена: игровой день — восемь часов от 10:00 (то же
    число, из которого Э6.3 считает стол-часы зала). */
const JEND = '18:00';

/** Смены блоками. Пустая клетка стала красным блоком «нет судьи»: это стол,
    который в свой час не примет матч (§4.7), и оставить её пустотой нельзя —
    в сетке времени пустое место читается как «свободно», а здесь оно означает
    ровно обратное. */
const JSLOTS: SlotEvent[] = JTABLES.flatMap((n, c) => {
  const out: SlotEvent[] = [];
  let r = 0;
  while (r < JSHIFT.length) {
    const who = JSHIFT[r].t[c];
    /* Докуда тянется смена: пока в колонке стоит тот же судья (или та же
       дыра). */
    let k = r;
    while (k + 1 < JSHIFT.length && JSHIFT[k + 1].t[c] === who) k += 1;
    out.push({
      id: `j${n}-${r}`,
      col: `s${n}`,
      from: JSHIFT[r].h,
      till: k + 1 < JSHIFT.length ? JSHIFT[k + 1].h : JEND,
      /* Номер — крупной строкой, фамилия — тихой: номер и читают с расстояния
         на распечатке, а в блок, в отличие от клетки таблицы, помещаются оба. */
      nm: who ? jn(who) : 'нет судьи',
      sub: who ?? 'стол в свой час не примет матч',
      tone: who ? 'neutral' : 'danger',
    });
    r = k + 1;
  }
  return out;
});

/** Колонки — те же столы и с той же пометкой эфира, что в расписании игр. */
const JCOLS = JTABLES.map((n) => ({
  key: `s${n}`,
  t: `Стол ${n}`,
  sub: STREAM.includes(n) ? 'эфир' : undefined,
}));

const JudgeShift6_5 = () => (
  <>
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-[12.5px] text-neutral-500">
        День 1 · столы 1–6 · в блоках номера судей, полный список — рядом
      </span>
      <QuietAction><Printer size={14} /> Печать расписания</QuietAction>
    </div>

    {/* Час строки — 44 px вместо стандартных 52: смена идёт полтора-два часа, и
        на восьмичасовом дне сетка иначе не помещается на экран целиком. */}
    <TimeGrid cols={JCOLS} events={JSLOTS} from={10} till={17} hourPx={44} />

    {/* Под сеткой смен — блок под блоком во всю ширину ✳ (30.08.2026):
        сначала кто под каким номером, потом часы без судьи. */}
    <div className="mt-4">
      <Panel title="Кто под каким номером" extra={<span className="text-xs text-neutral-500">номер живёт один турнир</span>}>
        <Rows>
          {Object.entries(JNUM).slice(0, 7).map(([nm, n]) => (
            <Row key={nm} nm={`С-${n} · ${nm}`} sub="наряд Чемпионата Казахстана 2026" />
          ))}
        </Rows>
      </Panel>

      <Panel title="Пустые клетки" extra={<Pl t="3 ЧАСА БЕЗ СУДЬИ" cls="bad" />}>
        <Rows>
          {HOLES6_5.map((h) => (
            <Row key={h} nm={h} sub="судья не назначен" pill={{ t: 'ПУСТО', cls: 'bad' }} action="Назначить" />
          ))}
        </Rows>
        <div className="mt-3">
          <Bar>
            Пустая клетка расписания стоит на шкале красным блоком «нет судьи»: это стол, который
            в свой час не примет матч. На любительском турнире его можно оставить пустым намеренно
            (см. полосу выше), на официальном — нет.
          </Bar>
        </div>
      </Panel>
    </div>
  </>
);

export function Judges6_5() {
  const [view, setView] = useState(JUDGE_VIEWS[0]);

  return (
    <WebApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Судьи на столах"
      title="Судьи на столах"
      sub="Наряд турнира набирает председатель ГСК (Э5.2) — главный судья расставляет его по столам"
    >
      {/* Плиток-счётчиков над списком столов больше нет ✳ (30.08.2026): экран
          про то, кто на каком столе стоит, и всё, что говорили плитки, стоит в
          самих блоках — «2 ПУСТЫХ СЛОТА» на столах зала, «2 СВОБОДНЫ» на
          наряде. Витрина над рабочей частью только отодвигала её вниз. */}

      {/* Игра без судьи — свойство турнира, а не стола ✳ (комментарий
          федерации, 09.2026): разрешение даётся на соревнование целиком, иначе
          на одном столе счёт ведёт судья, на соседнем игроки, и протокол
          собирается из разного. На **официальном** старте разрешить её нельзя
          вовсе — Чемпионат Казахстана именно такой, поэтому кнопка здесь
          заблокирована, а живой она бывает только на любительском турнире
          (кадр в полке состояний). */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <Segmented items={JUDGE_VIEWS} value={view} onPick={setView} />
        <span className="flex-1 text-right text-[12.5px] text-neutral-500">
          Официальный старт: судья на столе обязателен, пустой стол в игру не идёт
        </span>
        <DisabledAction>Разрешить игру без судьи</DisabledAction>
      </div>

      {view === JUDGE_VIEWS[1] ? (
        <JudgeShift6_5 />
      ) : (
        /* Столы зала и наряд — блок под блоком во всю ширину ✳ (30.08.2026):
           в половине экрана карточка стола резала фамилию судьи многоточием на
           втором слове. */
        <>
          <Panel title="Столы зала" extra={<Pl t="2 ПУСТЫХ СЛОТА" cls="bad" />}>
            {/* Панель стала во всю ширину — карточки столов идут в четыре
                колонки: ширина карточки та же, что была в двух колонках
                половины экрана, а весь зал виден в четыре ряда вместо семи.
                Сама карточка — общая с телефоном (`TableSlot`), где она стоит
                в два столбца: фамилия и категория идут в ней двумя строками. */}
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map((s) => <TableSlot key={s.n} s={s} />)}
            </div>
          </Panel>

          <Panel title="Судьи наряда" extra={<Pl t="2 СВОБОДНЫ" cls="wait" />}>
            <Crew6_5 />
          </Panel>
        </>
      )}
    </WebApp>
  );
}

/** Э6.5 на телефоне: столы зала в два столбца и смены списком.
    Шкала смен «час × стол» в 392 px нечитаема так же, как расписание игр, —
    те же блоки идут строками: когда, где, кто. Порядок чтения тот же, что на
    шкале: сверху вниз по времени, внутри часа — по столам. */
export function Judges6_5Phone() {
  const [view, setView] = useState(JUDGE_VIEWS[0]);
  /* Стол блока — из его же колонки (`s7` → 7): список и шкала собираются из
     одного набора смен, и разойтись им нечем. */
  const tbl = (col: string) => Number(col.slice(1));
  const shifts = [...JSLOTS].sort((a, b) => a.from.localeCompare(b.from) || tbl(a.col) - tbl(b.col));

  return (
    <PhoneRoleApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Судьи на столах"
      title="Судьи на столах"
      sub="Наряд набирает председатель ГСК (Э5.2) — судья расставляет его по столам"
    >
      <Strip>
        <Segmented items={JUDGE_VIEWS} value={view} onPick={setView} />
      </Strip>

      {view === JUDGE_VIEWS[1] ? (
        <>
          <Panel title="Смены дня 1" extra={<Pl t="3 ЧАСА БЕЗ СУДЬИ" cls="bad" />} flush>
            <div className="divide-y divide-neutral-100">
              {shifts.map((s) => (
                <Row
                  key={s.id}
                  nm={`${s.from}–${s.till} · стол ${tbl(s.col)}`}
                  sub={s.sub ?? ''}
                  val={s.nm}
                  pill={s.tone === 'danger' ? { t: 'НЕТ СУДЬИ', cls: 'bad' } : undefined}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Пустые клетки" extra={<Pl t="3 ЧАСА" cls="bad" />} flush>
            <div className="divide-y divide-neutral-100">
              {HOLES6_5.map((h) => (
                <Row key={h} nm={h} sub="судья не назначен" pill={{ t: 'ПУСТО', cls: 'bad' }} action="Назначить" />
              ))}
            </div>
          </Panel>

          <Panel title="Кто под каким номером" flush>
            <div className="divide-y divide-neutral-100">
              {Object.entries(JNUM).slice(0, 7).map(([nm, n]) => (
                <Row key={nm} nm={`С-${n} · ${nm}`} sub="наряд Чемпионата Казахстана 2026" />
              ))}
            </div>
          </Panel>
          <Bar>
            Номер живёт один турнир: им судья стоит в расписании, потому что фамилия в клетку не
            влезает ни на распечатке, ни на телефоне.
          </Bar>
        </>
      ) : (
        <>
          <Panel title="Столы зала" extra={<Pl t="2 ПУСТЫХ СЛОТА" cls="bad" />}>
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((s) => <TableSlot key={s.n} s={s} />)}
            </div>
          </Panel>

          <Panel title="Судьи наряда" extra={<Pl t="2 СВОБОДНЫ" cls="wait" />}>
            <Crew6_5 />
          </Panel>

          <div className="mb-3 text-[12.5px] text-neutral-500">
            Официальный старт: судья на столе обязателен, пустой стол в игру не идёт
          </div>
          <Wide>
            <DisabledAction>Разрешить игру без судьи</DisabledAction>
          </Wide>
        </>
      )}
    </PhoneRoleApp>
  );
}

const Judges6_5States = () => (
  <States>
    <Shot tone="danger" title="На столе нет судьи" text="Слот подсвечен; стол не примет матчи, пока судья не назначен." wide>
      <Frag>
        <Rows>
          <Row nm="Стол 7" sub="судья не назначен" pill={{ t: 'НЕТ СУДЬИ', cls: 'bad' }} action="Назначить" />
        </Rows>
        <div className="mt-3">
          <Bar tone="danger">Матч не стартует, пока на стол не назначен судья.</Bar>
        </div>
      </Frag>
    </Shot>

    {/* На официальном старте (макет выше) кнопка заблокирована — живой тумблер
        существует только здесь, на любительском турнире ✳. */}
    <Shot tone="info" title="Любительский турнир — игра без судьи разрешена ✳" text="Разрешение — свойство турнира, а не стола; счёт ведут сами игроки.">
      <Frag>
        <Rows>
          <Row
            nm="Игра без судьи разрешена"
            sub="стол работает без судьи — счёт ведут сами игроки"
            pill={{ t: 'ЛЮБИТЕЛЬСКИЙ', cls: 'reg' }}
            action="Требовать судью"
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.6 · Ход турнира ─────────────────────────────────────────── */

const TILES6_6: Tile[] = [
  { v: '12', k: 'Идут сейчас' },
  { v: '8', k: 'Ждут стола', tone: 'a' },
  { v: '60 / 127', k: 'Матчей сыграно', tone: 'g' },
  { v: '1', k: 'Задержка старта' },
  { v: '1', k: 'Стол без судьи' },
];

/** Идущие матчи и правка счёта: на десктопе стоят правой колонкой наблюдения,
    на телефоне — блоком сразу под картой столов. Содержание одно. */
const LivePanel6_6 = () => (
  <Panel title="Идут сейчас" extra={<Pl t="12 СТОЛОВ В ИГРЕ" cls="live" />}>
    <LiveCards />
    <div className="mt-3 flex flex-col gap-2">
      <span className="text-[12px] leading-snug text-neutral-500">
        Правка — в пределах лимита, в журнал с автором
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline"><Pencil size={13} /> Исправить счёт</Button>
        <Button size="sm" variant="outline"><Ban size={13} /> Техническая победа</Button>
      </span>
    </div>
  </Panel>
);

export function Live6_6() {
  return (
    <WebApp
      role={at('ИДЁТ')}
      nav="Ход турнира"
      title="Ход турнира"
      sub="Карта столов · счёт обновляется в реальном времени · сетка пересобирается после каждого результата"
      /* Идущие матчи и очередь пар — правой колонкой ✳ (30.08.2026): за ними
         следят непрерывно, пока работают с картой столов, а блоком в общем
         потоке до них надо доскроллить. Свой скролл у колонки: очередь не
         уезжает вместе с картой. */
      aside={
        <>
          <LivePanel6_6 />
          <QueuePanel />
        </>
      }
    >
      <StatTiles items={TILES6_6} />
      {/* В рабочей области остаётся то, чем управляют: карта столов. Идущие
          матчи и очередь ушли в правую колонку — за ними наблюдают. */}
      <TableMap />
    </WebApp>
  );
}

/** Э6.6 на телефоне — главный экран роли в зале ✳ (30.08.2026).
    Судья ходит между столами, и телефон он достаёт ради двух вещей: что сейчас
    на столах и кого вызывать следующим. Поэтому кадр начинается с карты столов
    в два столбца, под ней идут матчи и очередь пар — те самые блоки, что на
    десктопе стоят правой колонкой наблюдения: колонки на 392 px нет, и
    наблюдение становится обычным блоком сразу под картой.

    Плитки-счётчики ушли вниз: все пять чисел читаются с самой карты (сколько
    столов в игре, где нет судьи, где задержка), и держать их витриной над
    рабочей частью на телефоне — значит отодвинуть зал на экран вниз. */
export function Live6_6Phone() {
  return (
    <PhoneRoleApp
      role={at('ИДЁТ')}
      nav="Ход турнира"
      title="Ход турнира"
      sub="Счёт обновляется в реальном времени"
    >
      <TableMap cols={2} />
      <LivePanel6_6 />
      <QueuePanel />
      <PhoneTiles>
        <StatTiles items={TILES6_6} />
      </PhoneTiles>
    </PhoneRoleApp>
  );
}

const Live6_6States = () => (
  <States>
    <Shot tone="danger" title="Матч не может стартовать" text="На карточке стола причина — «нет судьи».">
      <Frag>
        <Rows>
          <Row nm="Стол 7 · Ерлан — Пак" sub="пара вызвана, судьи нет" pill={{ t: 'НЕ СТАРТУЕТ', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="warning" title="Обрыв связи у стола" text="Карточка помечена; при расхождении приоритет у судьи стола.">
      <Frag>
        <Rows>
          <Row nm="Стол 4" sub="связи нет 2 минуты · счёт ведётся локально" pill={{ t: 'БЕЗ СВЯЗИ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.7 · Итоговый протокол ───────────────────────────────────── */

type Place = { pl: number; av: string; nm: string; club: string; res: string };

const PLACES: Place[] = [
  { pl: 1, av: P.kim, nm: 'Ким Георгий', club: 'СКА · Астана', res: '7 матчей · 21 : 4' },
  { pl: 2, av: P.tok, nm: 'Токаев Марат', club: 'Шымкент', res: '7 матчей · 19 : 9' },
  { pl: 3, av: P.gla, nm: 'Гладун Игорь', club: 'Тараз', res: '7 матчей · 18 : 11' },
  { pl: 4, av: P.ahm, nm: 'Ахметов Дархан', club: 'Алатау · Алматы', res: '6 матчей · 15 : 12' },
  { pl: 5, av: P.dos, nm: 'Досжан Марат', club: 'Шахтёр · Караганда', res: '5 матчей · 12 : 10' },
  { pl: 6, av: P.sar, nm: 'Сарсенов Абай', club: 'Иртыш · Павлодар', res: '5 матчей · 11 : 12' },
];

const PROTO = ['Формируется', 'На утверждении', 'Возвращён', 'Закрыт'];

/** Полоса состояний протокола: текущее — заливкой, остальные приглушены. */
const ProtoStrip = ({ cur }: { cur: string }) => (
  <div className="mb-3 inline-flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
    {PROTO.map((s) => (
      <span
        key={s}
        className={
          'rounded-md px-2.5 py-1 text-[12px] font-medium ' +
          (s === cur ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400')
        }
      >
        {s}
      </span>
    ))}
  </div>
);

/** Компактная строка журнала: техпобеда или правка счёта. */
const LogRow = ({ t, s, p }: { t: string; s: string; p: string }) => (
  <div className="flex items-center gap-3 px-4 py-2">
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block text-[12.5px] font-medium">{t}</span>
      <span className="block text-xs text-neutral-500">{s}</span>
    </span>
    <Pill t={p} color={p === 'В ЖУРНАЛЕ' ? 'accent' : 'danger'} />
  </div>
);

/** Строка итогового места: номер, человек, результат. */
const PlaceRow = ({ p }: { p: Place }) => (
  <div className="flex items-center gap-3 px-4 py-2">
    <span
      className={
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ' +
        (p.pl === 1 ? 'bg-amber-100 text-amber-800' : p.pl <= 3 ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-500')
      }
    >
      {p.pl}
    </span>
    <Avatar size="sm">
      <Avatar.Image alt={p.nm} src={p.av} />
      <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
    </Avatar>
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{p.nm}</span>
      <span className="block truncate text-xs text-neutral-500">{p.club}</span>
    </span>
    <span className="text-[12.5px] tabular-nums text-neutral-600">{p.res}</span>
  </div>
);

const bracket6_7 = { ...makeBigBracket(5), title: 'Чемпионат Казахстана 2026 · плей-офф' };

const GROUPS6_7 = [
  { nm: 'Группа A', rows: 'Ким Г. · Смагулов А. · Оралбек Д. · Цой А.', out: 'Ким Г., Смагулов А.', played: 6, of: 6 },
  { nm: 'Группа B', rows: 'Токаев М. · Абиш Н. · Сериков Н. · Ли В.', out: 'Токаев М., Абиш Н.', played: 6, of: 6 },
  { nm: 'Группа C', rows: 'Байжанов Е. · Пак С. · Мурат К. · Асан Б.', out: 'Байжанов Е., Пак С.', played: 6, of: 6 },
  { nm: 'Группа D', rows: 'Гладун И. · Оспанов Т. · Бекзат Ж. · Кайрат А.', out: 'Гладун И., Оспанов Т.', played: 6, of: 6 },
];

/** Что смотрит судья перед отправкой протокола. */
const PROTO_VIEWS = ['Итоги и решение', 'Сетка', 'Группы'];

/** Журнал протокола: техпобеды и снятия, правки счёта. Один набор на оба
    формата — на телефоне те же строки, только уже. */
const TECH6_7 = [
  { t: 'Байжанов А. — неявка', s: '1/16 · стол 4 · 12.03, 11:20', p: 'ТЕХПОБЕДА' },
  { t: 'Мұрат Е. — отказ, травма', s: '1/8 · стол 9 · 13.03, 15:40', p: 'СНЯТИЕ' },
];

const EDITS6_7 = [
  { t: 'Стол 3 · 1/16 · 2 : 1 → 2 : 0', s: 'Оспанов Т. · 12.03, 12:41', p: 'В ЖУРНАЛЕ' },
  { t: 'Стол 7 · 1/32 · 3 : 0 → 3 : 1', s: 'Жумабеков Р., заместитель · 12.03, 11:05', p: 'В ЖУРНАЛЕ' },
];

/** Круги сетки на 32 участника: от 1/16 к финалу. */
const RD6_7 = ['1/16', '1/8', '1/4', '1/2', 'Финал'];

export function Protocol6_7() {
  const [view, setView] = useState(PROTO_VIEWS[0]);
  return (
    <WebApp
      role={at('ИТОГОВЫЙ ПРОТОКОЛ')}
      nav="Протокол"
      title="Итоговый протокол"
      sub="Все 127 матчей сыграны · ввод результатов заблокирован"
    >
      {/* Плиток-счётчиков над протоколом больше нет ✳ (30.08.2026): все четыре
          числа стояли в других местах этого же экрана — «127 из 127» в
          подзаголовке, техпобеды и правки счёта заголовками разделов журнала
          ниже. Главное здесь — итоговые места, и начинать экран нужно с них. */}

      {/* Сетка и группы — здесь, до отправки ✳ (комментарий федерации,
          09.2026). Судья подписывается под итоговыми местами, а места берутся
          из сетки: не сверив её, он утверждает список, происхождение которого
          не видел. */}
      <div className="mb-4">
        <Segmented items={PROTO_VIEWS} value={view} onPick={setView} />
      </div>

      {view === PROTO_VIEWS[1] && (
        <>
          {/* Настоящая сетка тем же компонентом, что на фронте; светлый тон —
              новый слой светлый, чёрная плоскость из него выпадала. */}
          <div className="relative h-[430px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
            <div className="absolute inset-0 [&>div]:h-full!">
              <BracketFlow bracket={bracket6_7} minZoom={0.1} fitPadding={0.04} tone="light" />
            </div>
          </div>
          <div className="mt-3">
            <Bar>
              Та же сетка, что видят игроки и секретарь: одна модель на всю систему. Места в
              протоколе выводятся из неё — сверить их и есть смысл этого взгляда.
            </Bar>
          </div>
        </>
      )}

      {view === PROTO_VIEWS[2] && (
        <>
          <DataTable
            cols={['Группа и состав', 'Сыграно', 'Вышли в плей-офф', 'Состояние']}
            grid="1.8fr 90px 1.2fr 110px"
            rows={GROUPS6_7.map((g) => ({
              key: g.nm,
              cells: [
                <span key="n" className="leading-tight">
                  <span className="block font-medium">{g.nm}</span>
                  <span className="block text-xs text-neutral-500">{g.rows}</span>
                </span>,
                <span key="p" className="tabular-nums">{g.played} из {g.of}</span>,
                <span key="o">{g.out}</span>,
                <Pl key="s" t="СЫГРАНА" cls="live" />,
              ],
            }))}
          />
          <div className="mt-3">
            <Bar>
              Групповой этап смотрят перед отправкой не ради красоты: спор о месте в плей-офф
              решается местом в группе, и после утверждения переиграть его нельзя.
            </Bar>
          </div>
        </>
      )}

      {view === PROTO_VIEWS[0] && (
        /* Блок под блоком во всю ширину ✳ (30.08.2026): места — то, под чем
           судья подписывается, и им нужна вся строка (место, человек, клуб,
           результат). Журнал и отправка — под ними. */
        <>
          <Panel title="Итоговые места" extra={<Pl t="РЕЙТИНГ ПЕРЕСЧИТАЕТСЯ ПОСЛЕ ЗАКРЫТИЯ" cls="live" />} flush>
            <div className="divide-y divide-neutral-100">
              {PLACES.map((p) => <PlaceRow key={p.pl} p={p} />)}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-2.5">
              <span className="text-[12.5px] text-neutral-500">Протокол сформирован — правка результатов закрыта</span>
              <QuietAction><Printer size={13} /> Печать · после утверждения</QuietAction>
            </div>
          </Panel>

          <Panel title="Протокол турнира">
            <ProtoStrip cur="Формируется" />

            <Sec>Технические победы и снятия · 2</Sec>
            <Rows>
              {TECH6_7.map((l) => <LogRow key={l.t} t={l.t} s={l.s} p={l.p} />)}
            </Rows>

            <Sec>Правки счёта · 5, последние</Sec>
            <Rows>
              {EDITS6_7.map((l) => <LogRow key={l.t} t={l.t} s={l.s} p={l.p} />)}
            </Rows>

            <div className="mt-4">
              <PrimaryAction>Отправить председателю ГСК</PrimaryAction>
            </div>
          </Panel>
        </>
      )}
    </WebApp>
  );
}

/** Сетка списком: пары по кругам и счёт справа.

    Холст `BracketFlow` в 392 px нечитаем — вписанное в такую ширину дерево из
    31 матча превращается в узор, а водить по нему пальцем с масштабированием,
    стоя между столами, нельзя. Список собран из той же модели сетки
    (`bracket6_7`), что и дерево на десктопе: расходиться им нечем. */
const BracketList6_7 = () => (
  <>
    {RD6_7.map((rd, r) => {
      const ms = bracket6_7.matches.filter((m) => m.round === r);
      const shown = ms.slice(0, 4);
      return (
        <Panel
          key={rd}
          title={rd}
          extra={<span className="text-xs text-neutral-500">{ms.length} {plural(ms.length, 'матч', 'матча', 'матчей')}</span>}
          flush
        >
          <div className="divide-y divide-neutral-100">
            {shown.map((m) => (
              <Row
                key={m.id}
                nm={`${m.a?.name ?? '—'} — ${m.b?.name ?? '—'}`}
                sub={m.status === 'live' ? 'идёт сейчас' : 'сыгран'}
                val={`${m.scoreA ?? 0} : ${m.scoreB ?? 0}`}
                pill={m.status === 'live' ? { t: 'ИДЁТ', cls: 'live' } : undefined}
              />
            ))}
            {ms.length > shown.length && (
              <div className="px-4 py-2 text-[12px] text-neutral-500">
                показаны {shown.length} из {ms.length}
              </div>
            )}
          </div>
        </Panel>
      );
    })}
  </>
);

/** Э6.7 на телефоне: те же три взгляда — итоги, сетка и группы.
    Итоговые места и журнал ложатся строками как есть; сетка идёт списком по
    кругам вместо дерева, а таблица групп — строками вместо четырёх колонок. */
export function Protocol6_7Phone() {
  const [view, setView] = useState(PROTO_VIEWS[0]);
  return (
    <PhoneRoleApp
      role={at('ИТОГОВЫЙ ПРОТОКОЛ')}
      nav="Протокол"
      title="Итоговый протокол"
      sub="Все 127 матчей сыграны · ввод результатов заблокирован"
    >
      <Strip>
        <Segmented items={PROTO_VIEWS} value={view} onPick={setView} />
      </Strip>

      {view === PROTO_VIEWS[1] && (
        <>
          <BracketList6_7 />
          <Bar>
            Та же сетка, что видят игроки и секретарь: одна модель на всю систему. На телефоне она
            идёт списком по кругам — места в протоколе выводятся из неё, и сверить их можно строкой.
          </Bar>
        </>
      )}

      {view === PROTO_VIEWS[2] && (
        <>
          <Rows>
            {GROUPS6_7.map((g) => (
              <Row
                key={g.nm}
                nm={g.nm}
                sub={`${g.rows} · вышли: ${g.out}`}
                val={`${g.played} из ${g.of}`}
                pill={{ t: 'СЫГРАНА', cls: 'live' }}
              />
            ))}
          </Rows>
          <div className="mt-3">
            <Bar>
              Спор о месте в плей-офф решается местом в группе, и после утверждения переиграть его
              нельзя — поэтому группы смотрят до отправки.
            </Bar>
          </div>
        </>
      )}

      {view === PROTO_VIEWS[0] && (
        <>
          <Panel title="Итоговые места" extra={<Pl t="МЕСТА 1–6 ИЗ 112" cls="reg" />} flush>
            <div className="divide-y divide-neutral-100">
              {PLACES.map((p) => (
                <Row key={p.pl} av={p.av} nm={`${p.pl} · ${p.nm}`} sub={p.club} val={p.res} />
              ))}
            </div>
          </Panel>

          <Panel title="Протокол турнира">
            <ProtoStrip cur="Формируется" />
            <Sec>Технические победы и снятия · 2</Sec>
            <Rows>
              {TECH6_7.map((l) => <LogRow key={l.t} t={l.t} s={l.s} p={l.p} />)}
            </Rows>
            <Sec>Правки счёта · 5, последние</Sec>
            <Rows>
              {EDITS6_7.map((l) => <LogRow key={l.t} t={l.t} s={l.s} p={l.p} />)}
            </Rows>
            <div className="mt-4">
              <Wide>
                <PrimaryAction>Отправить председателю ГСК</PrimaryAction>
              </Wide>
            </div>
          </Panel>
        </>
      )}
    </PhoneRoleApp>
  );
}

const Protocol6_7States = () => (
  <States>
    <Shot tone="info" title="Ожидание решения ГСК" text="Экран «протокол на утверждении» — без кнопок правки." wide>
      <Frag>
        <Rows>
          <Row nm="Протокол отправлен" sub="председателю ГСК · 20.05, 19:10" pill={{ t: 'НА УТВЕРЖДЕНИИ', cls: 'wait' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.8 · Отклонение заявки с причиной ───────────────────────── */

/** Экран под диалогом: две заявки, из которых одну сейчас отклоняют. */
const Reject6_8Rows = () => (
  <Rows>
    <Row nm="Жумабеков Расул" sub="2007 · Караганда · «Шахтёр»" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
    <Row nm="Ерлан Бекзат" sub="2006 · Актобе · спортшкола №3" pill={{ t: 'ЗАЯВКА', cls: 'reg' }} />
  </Rows>
);

/** Сам диалог отклонения — один на оба формата: на телефоне он же, но во всю
    ширину кадра (`PhoneDialog`), потому что прибитые 520 px туда не влезают. */
const RejectDialog6_8 = () => (
  <InlineDialog
    title="Отклонить заявку с причиной"
    sub="Жумабеков Расул · одиночный разряд"
    to="Э6.2"
    foot={
      <>
        <span className="mr-auto text-xs text-neutral-500">
          Причина уйдёт заявителю и останется в журнале
        </span>
        <QuietAction>Закрыть</QuietAction>
        <Button variant="danger">Отклонить</Button>
      </>
    }
  >
    <Rows>
      <Row nm="Годовой взнос" sub="не оплачен" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
      <Row nm="Медицинский допуск" sub="документ не приложен" pill={{ t: 'НЕ ПРОХОДИТ', cls: 'bad' }} />
      <Row nm="Возраст" sub="2007 · граница «без ограничения»" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
    </Rows>
    <div className="mt-3">
      <FormGrid>
        <TextInput label="Причина" value="нет медицинского допуска и не оплачен годовой взнос" wide />
      </FormGrid>
    </div>
    <div className="mt-3">
      <Bar tone="warning">Проверку система сделала сама, но решение — судьи: он может принять и с замечанием.</Bar>
    </div>
  </InlineDialog>
);

export function Reject6_8() {
  return (
    /* Значок в шапке — «ПРИЁМ ЗАЯВОК», как на Э6.1–Э6.2: отклонение с причиной
       живёт только пока приём открыт, значок «ИДЁТ» спорил бы с подзаголовком. */
    <WebApp role={at('ПРИЁМ ЗАЯВОК')} nav="Заявки" title="Заявки участников" sub="Приём открыт до 12.03, 18:00">
      <Reject6_8Rows />
      <RejectDialog6_8 />
    </WebApp>
  );
}

/** Э6.8 на телефоне: тот же диалог поверх того же списка заявок.
    Поле причины стоит во всю ширину — в одну колонку, как все поля формы на
    392 px. */
export function Reject6_8Phone() {
  return (
    <PhoneRoleApp role={at('ПРИЁМ ЗАЯВОК')} nav="Заявки" title="Заявки участников" sub="Приём открыт до 12.03, 18:00">
      <Reject6_8Rows />
      <PhoneDialog>
        <RejectDialog6_8 />
      </PhoneDialog>
    </PhoneRoleApp>
  );
}

const Reject6_8States = () => (
  <States>
    <Shot tone="danger" title="Причина не заполнена" text="Кнопка неактивна.">
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

    <Shot tone="warning" title="Приём уже закрыт ✳" text="В уведомлении не обещаем повторную подачу.">
      <Frag>
        <Rows>
          <Row nm="Приём заявок" sub="закрыт 12.03, 18:00" pill={{ t: 'ЗАКРЫТ', cls: 'done' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э6.9 · Формирование итогового протокола ───────────────────── */

/** Диалог формирования протокола — один на оба формата. */
const FinishDialog6_9 = () => (
  <InlineDialog
    title="Сформировать итоговый протокол"
    sub="Чемпионат Казахстана 2026 · шаг необратим"
    to="Э6.7"
    foot={
      <>
        <span className="mr-auto text-xs text-neutral-500">
          После формирования ввод результатов закрыт
        </span>
        <QuietAction>Закрыть</QuietAction>
        <Button variant="primary">Сформировать</Button>
      </>
    }
  >
    <Rows>
      <Row nm="Все матчи сыграны" sub="127 из 127" pill={{ t: 'ДА', cls: 'live' }} />
      <Row nm="Незакрытых протестов нет" sub="проверено" pill={{ t: 'ДА', cls: 'live' }} />
      <Row nm="Столы освобождены" sub="20 из 20" pill={{ t: 'ДА', cls: 'live' }} />
    </Rows>
    <div className="mt-3">
      <Bar>
        Ввод результатов закроется, турнир перейдёт в «Итоговый протокол», а сам протокол
        уйдёт председателю ГСК на утверждение.
      </Bar>
    </div>
  </InlineDialog>
);

const Finish6_9Rows = () => (
  <Rows>
    <Row nm="Сыграно матчей" sub="127 из 127" pill={{ t: 'ВСЁ СЫГРАНО', cls: 'live' }} />
  </Rows>
);

export function Finish6_9() {
  return (
    <WebApp role={R06} nav="Протокол" title="Итоговый протокол" sub="Чемпионат Казахстана 2026">
      <Finish6_9Rows />
      <FinishDialog6_9 />
    </WebApp>
  );
}

/** Э6.9 на телефоне: тот же необратимый шаг, диалог во всю ширину кадра. */
export function Finish6_9Phone() {
  return (
    <PhoneRoleApp role={R06} nav="Протокол" title="Итоговый протокол" sub="Чемпионат Казахстана 2026">
      <Finish6_9Rows />
      <PhoneDialog>
        <FinishDialog6_9 />
      </PhoneDialog>
    </PhoneRoleApp>
  );
}

const Finish6_9States = () => (
  <States>
    <Shot tone="danger" title="Есть несыгранные матчи" text="«Сформировать» неактивна со списком того, что мешает.">
      <Frag>
        <Rows>
          <Row nm="Не сыграно матчей" sub="стол 4 — 1/4 финала, стол 9 — за 3-е место" val="2" pill={{ t: 'МЕШАЕТ', cls: 'bad' }} />
        </Rows>
        <div className="mt-3"><DisabledAction>Сформировать</DisabledAction></div>
      </Frag>
    </Shot>

    <Shot tone="info" title="Протокол уже сформирован" text="Вместо кнопки — состояние «на утверждении».">
      <Frag>
        <Rows>
          <Row nm="Протокол отправлен" sub="председателю ГСК · 20.05, 19:10" pill={{ t: 'НА УТВЕРЖДЕНИИ', cls: 'wait' }} />
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
  /* Борд роли начинается со входа — как у всех ролей (flows/00): маршрут не
     должен обрываться на середине. Регистрация стоит следом: это путь ДО
     входа, и на карте она ветка входа, а не его корень. */
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    /* Телефонный вход у роли не свой: он один на сайт и приложение, и берётся
       из role00 — второй такой же экран разъехался бы с ним на первой правке. */
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э0.7': {
    cap: 'Регистрация судьи',
    /* Второй формат — телефонный кадр того же экрана из role00: он
       принадлежит сквозным экранам, и второй копии здесь быть не должно. */
    alt: () => <SignUpJudge0_7Phone />,
    view: () => (
      <>
        <SignUpJudge0_7 />
        <SignUpJudge0_7States />
      </>
    ),
    next: 'вход под своей ролью',
  },
  'Э6.1': {
    cap: 'Мой турнир',
    view: () => (
      <>
        <Tournament6_1 />
        <Tournament6_1States />
      </>
    ),
    alt: () => <Tournament6_1Phone />,
    next: '8 заявок ждут решения',
  },
  'Э6.2': {
    cap: 'Заявки участников',
    view: () => (
      <>
        <Bids6_2 />
        <Bids6_2States />
      </>
    ),
    alt: () => <Bids6_2Phone />,
    next: 'закрыть приём',
  },
  'Э6.3': {
    cap: 'Сетка: формат, посев, сборка',
    view: () => (
      <>
        <Bracket6_3 />
        <Bracket6_3States />
      </>
    ),
    alt: () => <Bracket6_3Phone />,
    next: 'сетка собрана',
  },
  'Э6.4': {
    cap: 'Расписание и столы',
    view: () => (
      <>
        <Schedule6_4 />
        <Schedule6_4States />
      </>
    ),
    alt: () => <Schedule6_4Phone />,
    next: 'матчи разложены',
  },
  'Э6.5': {
    cap: 'Судьи на столах',
    view: () => (
      <>
        <Judges6_5 />
        <Judges6_5States />
      </>
    ),
    alt: () => <Judges6_5Phone />,
    next: 'столы укомплектованы',
  },
  'Э6.6': {
    cap: 'Ход турнира',
    view: () => (
      <>
        <Live6_6 />
        <Live6_6States />
      </>
    ),
    alt: () => <Live6_6Phone />,
    next: 'все матчи сыграны',
  },
  'Э6.7': {
    cap: 'Итоговый протокол',
    view: () => (
      <>
        <Protocol6_7 />
        <Protocol6_7States />
      </>
    ),
    alt: () => <Protocol6_7Phone />,
  },
  'Э6.8': {
    cap: 'Отклонение заявки с причиной',
    view: () => (
      <>
        <Reject6_8 />
        <Reject6_8States />
      </>
    ),
    alt: () => <Reject6_8Phone />,
    next: 'формирование протокола',
  },
  'Э6.9': {
    cap: 'Формирование итогового протокола',
    view: () => (
      <>
        <Finish6_9 />
        <Finish6_9States />
      </>
    ),
    alt: () => <Finish6_9Phone />,
  },
};

export function Role06Board() {
  return <Board role={R06} screens={SCREENS} />;
}
