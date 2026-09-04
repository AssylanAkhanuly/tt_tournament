/* 16 · Дисциплинарный комитет — макеты по флоу на новом слое (HeroUI) ✳ (30.08.2026).
   Содержание, коды экранов и переходы — прежние (см. `flows/16-disciplinarnyy-komitet.md`);
   меняется подача: оболочка WebApp и доменные компоненты `kit/hero/app` вместо
   старого макетного слоя.

   Комитет — орган, а не роль: человек входит в него поверх своей роли. Поэтому
   в файле две оболочки — спортсмена (Э16.1, он подаёт протест) и комитета
   (Э16.2–Э16.4, он его разбирает). Маршрут начинается у спортсмена намеренно:
   без формы подачи очередь дел неоткуда взять.

   Второй формат ✳ (30.08.2026, решение владельца продукта «все экраны в
   обоих»): у каждого экрана есть телефонный кадр (`*Ph`), и на борде он стоит
   врезкой под десктопным. Для протеста спортсмена телефон вообще основной —
   роль 14 живёт в приложении (TZ §10); член комитета смотрит дела в зале, между
   матчами. Данные у форматов общие: срез очереди, лента под линзой и текст
   решения считаются и хранятся в одном месте — иначе два кадра одного экрана
   разъедутся. */

import { useState, type ReactNode } from 'react';
import {
  Download, FileText, Gavel, History, Newspaper, Scroll, Send, Trophy, User, X,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  ActionBar,
  AreaInput,
  Bar,
  DataTable,
  DisabledAction,
  EmptyBox,
  Facts,
  FilterSeg,
  GameCells,
  InlineDialog,
  KV,
  MatchCard,
  Panel,
  PhoneRoleApp,
  PickField,
  Pill,
  PrimaryAction,
  QuietAction,
  Row,
  Rows,
  ScreenScope,
  SearchInput,
  WebApp,
  type RoleUI,
} from '@/shared/kit/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';

/* ── Роли экранов: спортсмен и член комитета ────────────────────── */

/* ⚠ дупликация: разделы спортсмена повторены локально — старый слой не
   импортируем, а слова пунктов обязаны совпадать с ролью 14: по ним сходится
   карта флоу.

   Состав приведён к решению от 30.08.2026: у спортсмена три раздела —
   «Турниры» (сюда слиты прежние «Календарь» и «Мой турнир»), «Новости» и
   «Профиль» (в нём же вход в аналитику). Прежние шесть пунктов остались здесь
   после того, как таббар роли 14 перестроили, и экран протеста ссылался на
   раздел «Мой турнир», которого больше нет, — карта флоу такой переход не
   находила. */
const R14L: RoleUI = {
  num: '14',
  title: 'Спортсмен',
  person: { nm: 'Ким Г.', rl: 'Спортсмен · рейтинг 2456', av: A(44) },
  brandName: 'Мой профиль',
  badge: false,
  nav: [
    [<Trophy size={16} key="t" />, 'Турниры'],
    [<Newspaper size={16} key="n" />, 'Новости'],
    [<User size={16} key="u" />, 'Профиль'],
  ],
};

/** Член комитета. Разделов два — очередь протестов и лента нарушений: больше
    у органа дел нет, он разбирает и фиксирует, а не ведёт турниры. */
const RD: RoleUI = {
  num: '16',
  title: 'Дисциплинарный комитет',
  person: { nm: 'Мукашев Б.', rl: 'Член комитета · председатель ГСК', av: A(67) },
  /* В шапке — сезон, а не название роли ✳ (04.09.2026): «Дисциплинарный
     комитет» стоит в боковом меню, и второй раз наверху это тот же текст. */
  brandName: 'Сезон 2026',
  badge: false,
  nav: [
    [<Scroll size={16} key="p" />, 'Протесты'],
    [<History size={16} key="h" />, 'История'],
  ],
};

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI. */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/** Длинный текст на чтение с подписью: протест в деле показывается так, как
    его подал спортсмен, — комитет его не правит, поле ввода здесь врало бы. */
const ReadText = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm leading-relaxed text-neutral-700">
      {children}
    </p>
  </div>
);

/* ── Второй формат: те же экраны на телефоне ─────────────────────── */

/** Диалог на телефоне — во всю ширину, снизу ✳ (30.08.2026).

    ⚠ Дупликация с role15.tsx (и повод поднять в `kit/hero/app`, когда таких
    экранов наберётся больше): `InlineDialog` нового слоя прибит к 520 точкам —
    это ширина ноутбука, и в 392 px он не помещается вовсе. */
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

/** Полоса переключателей шире экрана: на 392 px четыре состояния протеста в
    строку не встают. Полоса прокручивается вбок и выходит за поля экрана — так
    видно, что справа есть ещё, а не что список обрезан. */
const Scroller = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 overflow-x-auto px-4">
    <div className="w-max">{children}</div>
  </div>
);

/* ── Дела ───────────────────────────────────────────────────────── */

type Case = {
  id: string;
  who: string;
  av: string;
  match: string;
  tour: string;
  at: string;
  st: 'подан' | 'на рассмотрении' | 'решение принято';
  by?: string;
};

/** Очередь уже отсортирована «новые сверху» ✳: у протеста есть срок, и порядок
    по дате подачи — не украшение, а правило экрана. */
const CASES: Case[] = [
  { id: 'Д-118', who: 'Ким Георгий', av: A(44), match: '1/8 · Ким Г. — Токаев М. · стол 4', tour: 'Чемпионат Казахстана 2026', at: '13.03, 19:20', st: 'подан' },
  { id: 'Д-117', who: 'Мұрат Ерлан', av: A(93), match: '1/16 · Гладун И. — Мұрат Е. · стол 2', tour: 'Чемпионат Казахстана 2026', at: '13.03, 15:04', st: 'на рассмотрении', by: 'Мукашев Б.' },
  { id: 'Д-116', who: 'Тлеуова Аружан', av: AW(21), match: '1/16 · Тлеуова А. — Абаева Д. · стол 11', tour: 'Чемпионат Казахстана 2026', at: '12.03, 20:41', st: 'решение принято', by: 'Мукашев Б.' },
  { id: 'Д-113', who: 'Байжанов Асхат', av: A(85), match: 'группа B · Байжанов А. — Досжан М. · стол 6', tour: 'Кубок Казахстана 2026', at: '22.02, 18:02', st: 'решение принято', by: 'Ахметов К.' },
];

/** Тона значков старого словаря сохранены: подан — ждёт (жёлтый), в работе —
    процесс (синий), решение — закрыто (зелёный). */
const ST_CLS: Record<Case['st'], 'wait' | 'reg' | 'live'> = {
  'подан': 'wait',
  'на рассмотрении': 'reg',
  'решение принято': 'live',
};

/* ── Э16.1 · Протест спортсмена ─────────────────────────────────── */

/** Матч, по которому спор — один на оба формата: на десктопе его рисует
    карточка матча из кита, на телефоне те же данные встают двумя строками. */
const MATCH16_1 = {
  tour: '1/8 финала · 13.03, 15:58',
  home: { nm: 'Ким Георгий', av: A(44), sub: 'Астана · СКА', d: 4 },
  away: { nm: 'Токаев Марат', av: A(51), sub: 'Шымкент · «Жетісу»', d: 2 },
  score: '4 : 2',
  games: [[11, 9], [9, 11], [11, 7], [8, 11], [11, 6], [11, 4]] as ReadonlyArray<readonly [number, number]>,
  note: 'стол 4 · судья Оралбай Е.',
};

/** Тот же матч на 392 px: карточка кита ставит двоих и счёт в один ряд, и на
    телефоне от фамилий остаётся по слогу. Двумя строками со счётом справа — та
    же форма, в которой счёт читают на табло. */
const MatchRows16_1 = () => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <div className="border-b border-neutral-100 px-4 py-2 text-xs text-neutral-500">{MATCH16_1.tour}</div>
    <div className="divide-y divide-neutral-100">
      {[MATCH16_1.home, MATCH16_1.away].map((p) => (
        <div key={p.nm} className="flex items-center gap-3 px-4 py-2.5">
          <Avatar size="sm">
            <Avatar.Image alt={p.nm} src={p.av} />
            <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-semibold">{p.nm}</span>
            <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
          </span>
          <span className="text-2xl font-bold tabular-nums tracking-tight">{p.d}</span>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
      <GameCells games={MATCH16_1.games.slice(0, 3)} />
      <span className="text-[11px] text-neutral-500">{MATCH16_1.note}</span>
    </div>
    <div className="border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-500">
      Партии 4–6: {MATCH16_1.games.slice(3).map(([a, b]) => `${a}:${b}`).join(' · ')}
    </div>
  </div>
);

/** Материалы, которые система прикладывает к протесту сама. */
const MATERIALS16_1: { nm: string; sub: string }[] = [
  { nm: 'Протокол матча', sub: 'счёт по партиям, судья, время · подтверждён 15:58' },
  { nm: 'История событий матча', sub: 'розыгрыши, тайм-ауты, смены сторон, отмены (TZ §6.5)' },
  { nm: 'Жёлтая карточка · Токаев М.', sub: '15:46 · вынес судья стола Оралбай Е.' },
  /* Правка не меняет победителя партии: табло показывает уже исправленные
     11 : 6, итог 4 : 2 с ними сходится. */
  { nm: 'Правка счёта после подтверждения', sub: 'партия 5: было 11 : 5 → стало 11 : 6 · исправил главный судья' },
];

/** Текст протеста, как его набрал спортсмен: два поля, а не одно ✳ — комитет
    разбирает первое, а решает по второму, и в одном абзаце они слипаются. */
const PROTEST16_1 = {
  what: 'В пятой партии счёт исправили после подтверждения партии, основание судья не объяснил. В шестой — жёлтая карточка без предупреждения.',
  ask: 'Проверить правку счёта и обоснованность карточки.',
};

/** Правило экрана: срок подачи не назван (⚠ 15.4). */
const Rule16_1 = () => (
  <Bar tone="warning">
    ⚠ Срок подачи протеста федерация не назвала — вопрос 15.4. Правило будет, числа
    пока нет.
  </Bar>
);

/** Правило экрана: материалы собирает система, а не спортсмен. */
const Rule16_1Mat = () => (
  <Bar>
    Собирать материалы спортсмену не нужно и нельзя: он их не хранит, а система хранит.
    Комитет получает их вместе с протестом и ничего не запрашивает у судьи.
  </Bar>
);

/** Экран роли 14: протест подаёт сам спортсмен. Материалы к нему прикладывает
    система — собирать их спортсмену не нужно и нельзя: он их не хранит.
    Это же закрывает половину замечания федерации — «чтобы все нарушения и
    карты фиксировались». */
export function Protest16_1() {
  return (
    <WebApp
      role={R14L}
      nav="Турниры"
      title="Протест по матчу"
    >
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          карточка матча со счётом по партиям сжималась вдвое, а подписи
          материалов резались по краю колонки. Порядок прежний: сперва протест —
          то, ради чего экран, — под ним материалы, которые система приложила
          сама. Панель сама держит отступ снизу, обёртка не нужна. */}
      <>
        <Panel title="Протест" extra={<Pill t="ЧЕРНОВИК" color="warning" />}>
          {/* Матч, по которому спор, — как на табло, а не строкой формы:
              соперник, счёт по партиям, стол и судья видны без слов. */}
          <MatchCard
            tour={MATCH16_1.tour}
            home={MATCH16_1.home}
            away={MATCH16_1.away}
            score={MATCH16_1.score}
            games={MATCH16_1.games}
            note={MATCH16_1.note}
          />
          <div className="mt-3">
            <Facts items={[{ k: 'подаёт', v: 'Ким Георгий' }, { k: 'черновик сохранён', v: '13.03, 19:20' }]} />
          </div>

          <div className="mt-4 flex flex-col gap-3.5">
            {/* Четыре строки, не три, и текст короче: с rows={3} демо-текст
                переносился на четвёртую строку и она резалась кромкой поля.
                Теперь текст укладывается в три строки, четвёртая — запас. */}
            <AreaInput label="На что жалоба — что произошло" value={PROTEST16_1.what} rows={4} />
            <AreaInput label="Что прошу — какого решения жду" value={PROTEST16_1.ask} rows={2} />
          </div>

          <div className="mt-4">
            <Rule16_1 />
          </div>
          <div className="flex items-center justify-end gap-2">
            {/* Черновик — своей кнопкой ✳: протест пишут не на площадке, а вечером. */}
            <QuietAction>Сохранить черновик</QuietAction>
            <PrimaryAction to="Э16.2">Подать протест</PrimaryAction>
          </div>
        </Panel>

        {/* Материалы не собираются спортсменом: система прикладывает их сама. */}
        <Panel
          title="Материалы"
          sub="приложены системой — спортсмен их не собирает"
          extra={<Pill t="ПРИЛОЖЕНЫ" color="accent" />}
          flush
        >
          <div className="divide-y divide-neutral-100">
            {MATERIALS16_1.map((m) => (
              <Row key={m.nm} nm={m.nm} sub={m.sub} pill={{ t: 'ЕСТЬ', cls: 'live' }} />
            ))}
          </div>
          <div className="px-4 pb-1 pt-3">
            <Rule16_1Mat />
          </div>
        </Panel>
      </>
    </WebApp>
  );
}

/** Тот же протест на телефоне ✳ (30.08.2026).

    Протест пишут вечером после матча, и телефон для этого — не запасной
    вариант, а основной: спортсмен и так живёт в приложении (TZ §10). Разделы —
    те же, что у роли 14, поэтому нижние вкладки строит `PhoneRoleApp` из
    `R14L.nav`, а не пишутся руками.

    Что меняется: карточка матча становится двумя строками со счётом справа
    (`MatchRows16_1`) — в один ряд на 392 px двое и счёт не встают; поля
    протеста идут во всю ширину; «Сохранить черновик» и «Подать протест» стоят
    друг под другом, и главное действие первым. */
export function Protest16_1Ph() {
  return (
    <PhoneRoleApp
      role={R14L}
      nav="Турниры"
      title="Протест по матчу"
    >
      <Panel title="Протест" extra={<Pill t="ЧЕРНОВИК" color="warning" />}>
        <MatchRows16_1 />
        <div className="mt-3">
          <Facts items={[{ k: 'подаёт', v: 'Ким Георгий' }, { k: 'черновик сохранён', v: '13.03, 19:20' }]} />
        </div>

        <div className="mt-4 flex flex-col gap-3.5">
          <AreaInput label="На что жалоба — что произошло" value={PROTEST16_1.what} rows={5} wide />
          <AreaInput label="Что прошу — какого решения жду" value={PROTEST16_1.ask} rows={3} wide />
        </div>

        <div className="mt-4">
          <Rule16_1 />
        </div>
      </Panel>

      <Panel
        title="Материалы"
        sub="приложены системой — спортсмен их не собирает"
        extra={<Pill t="ПРИЛОЖЕНЫ" color="accent" />}
        flush
      >
        <div className="divide-y divide-neutral-100">
          {MATERIALS16_1.map((m) => (
            <Row key={m.nm} nm={m.nm} sub={m.sub} pill={{ t: 'ЕСТЬ', cls: 'live' }} />
          ))}
        </div>
        <div className="px-4 pb-1 pt-3">
          <Rule16_1Mat />
        </div>
      </Panel>
      <ActionBar>
        <Button variant="ghost" className="w-full">Сохранить черновик</Button>
        <Button variant="primary" className="w-full" data-to="Э16.2">Подать протест</Button>
      </ActionBar>
    </PhoneRoleApp>
  );
}

const Protest16_1States = () => (
  <States>
    <Shot
      tone="info"
      title="Протест по этому матчу уже подан"
      text="Второй по тому же матчу не подаётся — открывается поданный."
    >
      <Frag>
        <Rows>
          <Row
            nm="Д-118 · 1/8 · Ким Г. — Токаев М."
            sub="подан 13.03, 19:20 · состояние «подан»"
            pill={{ t: 'УЖЕ ПОДАН', cls: 'wait' }}
            action="Открыть"
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot tone="danger" title="Срок подачи истёк ⚠" text="Правило есть, числа нет — вопрос 15.4.">
      <Frag>
        <Rows>
          <Row
            nm="Срок подачи протеста"
            sub="федерация не назвала, сколько дней даётся после матча"
            pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3"><DisabledAction>Подать протест</DisabledAction></div>
      </Frag>
    </Shot>
  </States>
);

/* ── Э16.2 · Протесты ───────────────────────────────────────────── */

const FILTER_ST = ['Все', 'Подан', 'На рассмотрении', 'Решение принято'];
const FILTER_TOUR = ['Все турниры', 'Чемпионат РК', 'Кубок РК'];

/** Срез очереди под двумя фильтрами — один на оба формата: очередь дел одна, и
    два выражения, считающие её по-разному, разъедутся на первой же правке. */
const cases16_2 = (fs: string, ft: string) =>
  CASES.filter((c) => {
    if (fs !== 'Все' && c.st !== fs.toLowerCase()) return false;
    if (ft === 'Чемпионат РК' && !c.tour.startsWith('Чемпионат')) return false;
    if (ft === 'Кубок РК' && !c.tour.startsWith('Кубок')) return false;
    return true;
  });

/** Что сказано под полосой действий: почему «взять в работу» доступно или нет.
    Текст один на оба формата — правило «в работу берут только поданное» от
    ширины экрана не зависит. */
const hint16_2 = (picked: Case | undefined, canTake: boolean) =>
  picked
    ? canTake
      ? `Выбрано дело ${picked.id} — состояние станет «на рассмотрении», автор и время запишутся в журнал`
      : `Дело ${picked.id} уже ${picked.st === 'на рассмотрении' ? 'ведётся' : 'закрыто'} — взять в работу можно только дело в состоянии «подан»`
    : 'Выберите дело';

/** Очередь дел комитета — первый экран члена комитета (пункт «Протесты»).
    Взять в работу можно только дело в состоянии «подан»: остальные либо уже
    ведутся, либо закрыты — кнопка это знает и говорит. */
export function Cases16_2() {
  const [fs, setFs] = useState(FILTER_ST[0]);
  const [ft, setFt] = useState(FILTER_TOUR[0]);
  const [pick, setPick] = useState<string | null>(null);
  const rows = cases16_2(fs, ft);
  const picked = CASES.find((c) => c.id === pick);
  /* Взятое дело переводится в «на рассмотрении», автор и время — в журнал. */
  const canTake = picked?.st === 'подан';

  return (
    <WebApp
      role={RD}
      nav="Протесты"
      title="Протесты"
    >
      {/* Плиток-счётчиков над очередью больше нет ✳ (30.08.2026): экран — сама
          очередь дел, и три плитки пересказывали её состояния, которые стоят
          значком в каждой строке, а четвёртая («карточек за сезон») к протестам
          отношения не имеет — она из дисциплинарной истории (Э16.4). Сузить
          очередь по состоянию можно фильтром, а не чтением плитки. */}

      {/* Фильтр по состоянию и турниру ✳ — оба сужают список, а не меняют экран. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterSeg items={FILTER_ST} active={fs} onPick={setFs} />
        <FilterSeg items={FILTER_TOUR} active={ft} onPick={setFt} />
      </div>

      <Panel title="Очередь дел" flush>
        {rows.length ? (
          <div className="divide-y divide-neutral-100">
            {rows.map((c) => (
              <Row
                key={c.id}
                av={c.av}
                to="Э16.3"
                nm={`${c.id} · ${c.who}`}
                sub={`${c.match} · ${c.tour} · подан ${c.at}${c.by ? ` · ведёт ${c.by}` : ''}`}
                pill={{ t: c.st.toUpperCase(), cls: ST_CLS[c.st] }}
                on={pick === c.id}
                onSelect={() => setPick(pick === c.id ? null : c.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyBox title="Под фильтр ничего не попало" text="Снимите фильтр состояния или турнира." />
          </div>
        )}
      </Panel>

      <ActionBar>
        <span className="mr-auto text-[12.5px] text-neutral-500">{hint16_2(picked, canTake)}</span>
        <Button variant="outline" data-to="Э16.4">
          <History size={14} /> Дисциплинарная история
        </Button>
        {canTake ? (
          <PrimaryAction to="Э16.3">
            <Gavel size={15} /> Взять в работу
          </PrimaryAction>
        ) : (
          <DisabledAction>
            <Gavel size={15} /> Взять в работу
          </DisabledAction>
        )}
      </ActionBar>
    </WebApp>
  );
}

/** Та же очередь дел на телефоне ✳ (30.08.2026).

    Член комитета — не диспетчер за монитором: протест смотрят там же, где он
    случился, — в зале, между матчами. Поэтому очередь и на телефоне та же, с
    теми же двумя фильтрами и тем же правилом «в работу берут только поданное».

    Что меняется: два ряда фильтров встают друг под другом, и каждый
    прокручивается вбок — четыре состояния протеста в 392 px в строку не
    помещаются. Кнопки уходят под список: «Взять в работу» главным действием,
    «Дисциплинарная история» тихой кнопкой. Строки очереди те же `Row`, только
    подпись короче — турнир и время подачи остаются, а «ведёт такой-то» уходит
    в конец. */
export function Cases16_2Ph() {
  const [fs, setFs] = useState(FILTER_ST[0]);
  const [ft, setFt] = useState(FILTER_TOUR[0]);
  const [pick, setPick] = useState<string | null>(null);
  const rows = cases16_2(fs, ft);
  const picked = CASES.find((c) => c.id === pick);
  const canTake = picked?.st === 'подан';

  return (
    <PhoneRoleApp role={RD} nav="Протесты" title="Протесты">
      <div className="mb-2 flex flex-col gap-2">
        <Scroller><FilterSeg items={FILTER_ST} active={fs} onPick={setFs} /></Scroller>
        <Scroller><FilterSeg items={FILTER_TOUR} active={ft} onPick={setFt} /></Scroller>
      </div>
      <div className="mb-3 text-[12px] leading-snug text-neutral-500">{hint16_2(picked, canTake)}</div>

      <Panel title="Очередь дел" sub="новые сверху — сортировка по дате подачи" flush>
        {rows.length ? (
          <div className="divide-y divide-neutral-100">
            {rows.map((c) => (
              <Row
                key={c.id}
                av={c.av}
                to="Э16.3"
                nm={`${c.id} · ${c.who}`}
                sub={`${c.match} · ${c.tour} · подан ${c.at}${c.by ? ` · ведёт ${c.by}` : ''}`}
                pill={{ t: c.st.toUpperCase(), cls: ST_CLS[c.st] }}
                on={pick === c.id}
                onSelect={() => setPick(pick === c.id ? null : c.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyBox title="Под фильтр ничего не попало" text="Снимите фильтр состояния или турнира." />
          </div>
        )}
      </Panel>

      <ActionBar>
        <Button variant="ghost" className="w-full" data-to="Э16.4">
          <History size={14} /> Дисциплинарная история
        </Button>
        {canTake ? (
          <Button variant="primary" className="w-full" data-to="Э16.3">Взять в работу</Button>
        ) : (
          <Button variant="primary" className="w-full" isDisabled>Взять в работу</Button>
        )}
      </ActionBar>
    </PhoneRoleApp>
  );
}

const Cases16_2States = () => (
  <States>
    <Shot tone="info" title="Протестов нет" text="Пустое состояние, а не пустой список.">
      <Frag>
        <EmptyBox title="Протестов нет" text="Дела появляются, когда спортсмен подаёт протест по матчу." />
      </Frag>
    </Shot>

    <Shot tone="danger" title="Дело просрочено ⚠" text="Срок рассмотрения федерация не назвала — вопрос 15.4.">
      <Frag>
        <Rows>
          <Row
            nm="Д-117 · на рассмотрении 6 дней"
            sub="сколько дней даётся комитету — не определено"
            pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э16.3 · Дело ───────────────────────────────────────────────── */

/** Шапка дела: кто подал, по какому матчу и кто взял в работу. Автор и время
    взятия — из журнала: решение именное. Пары одни на оба формата. */
const CASE16_3: [string, ReactNode][] = [
  ['Подал', 'Ким Георгий · 13.03.2026, 19:20'],
  ['Матч', '1/8 · Ким Г. — Токаев М. · стол 4'],
  ['Взял в работу', 'Мукашев Б. · 14.03, 09:12'],
];

/** Протест как он подан — на чтение: комитет разбирает первое поле, а решает
    по второму, и не правит ни то ни другое. */
const PROTEST16_3 = {
  what: 'Счёт исправлен после подтверждения партии без объяснения основания; жёлтая карточка вынесена без предупреждения.',
  ask: 'Проверить правку счёта и обоснованность карточки.',
};

/** Материалы дела: приехали вместе с результатом (TZ §6.5). */
const MATERIALS16_3: { nm: string; sub: string }[] = [
  { nm: 'Протокол матча', sub: '4 : 2 · подтверждён судьёй стола 15:58' },
  { nm: 'История событий', sub: 'розыгрыши, тайм-ауты, карточки, правки (TZ §6.5)' },
  { nm: 'Жёлтая карточка · Токаев М.', sub: '15:46 · судья стола Оралбай Е.' },
];

/** Участники дела: у каждого ссылка в его дисциплинарную историю. */
const PARTIES16_3: { av: string; nm: string; sub: string; pill: { t: string; cls: 'reg' | 'wait' } }[] = [
  { av: A(44), nm: 'Ким Георгий · заявитель', sub: 'дисциплинарная история', pill: { t: 'СПОРТСМЕН', cls: 'reg' } },
  { av: A(51), nm: 'Токаев Марат · соперник', sub: 'дисциплинарная история', pill: { t: 'СПОРТСМЕН', cls: 'reg' } },
  { av: A(58), nm: 'Оралбай Ержан · судья стола', sub: 'карточки и правки по его столам', pill: { t: 'СУДЬЯ', cls: 'wait' } },
  { av: A(76), nm: 'Оспанов Талгат · главный судья', sub: 'кто исправлял счёт', pill: { t: 'СУДЬЯ', cls: 'wait' } },
];

/** Решение: санкции не перечислены — федерация их не назвала (⚠ 15.4). Пока
    решение это свободная формулировка и фиксация, а не выбор из списка. */
const DECISION16_3 = {
  text: 'Правка счёта партии 5 признана обоснованной: основание видно в истории событий. Жёлтая карточка оставлена в силе.',
  effect: 'Результат матча не меняется · карточка остаётся в дисциплинарной истории.',
};

/** Правило решения: система по нему ничего не пересчитывает. */
const Rule16_3 = () => (
  <Bar tone="warning">
    ⚠ Перечень санкций не определён (вопрос 15.4): решение фиксируется текстом, система
    по нему ничего не пересчитывает — ни допуск, ни рейтинг судьи.
  </Bar>
);

/** Бланк запроса пояснения — один на оба формата: вопрос уходит судье или
    главному судье старта, ответ приходит в это же дело. */
const AskForm16_3 = () => (
  <div className="flex flex-col gap-3.5 pt-1">
    <PickField label="Кому" value="Оралбай Ержан · судья стола 4" wide />
    <AreaInput
      label="Вопрос"
      value="На каком основании исправлен счёт пятой партии после подтверждения?"
      rows={3}
      wide
    />
    <Bar>Ответ придёт в дело и останется в его журнале — переписки вне дела нет.</Bar>
  </div>
);

/** Дело целиком: протест как его подал спортсмен, материалы, которые приехали
    вместе с результатом (TZ §6.5), участники со ссылками в их историю — и
    решение. Пояснение запрашивается диалогом поверх дела: комитет не уходит
    с экрана, на котором решает. */
export function Case16_3() {
  const [ask, setAsk] = useState(false);
  return (
    <WebApp
      role={RD}
      nav="Протесты"
      title="Дело Д-118"
      back={{ label: 'Протесты', to: 'Э16.2' }}
    >
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          «Решение» стояло слева, а материалы, по которым его принимают, — справа,
          и в вертикальном потоке решение оказалось бы раньше них. Порядок теперь
          тот же, что и разбор: протест → материалы → участники → решение. Панель
          сама держит отступ снизу, обёртка не нужна. */}
      <>
        <Panel title="Протест" extra={<Pill t="НА РАССМОТРЕНИИ" color="accent" />}>
          <KV items={CASE16_3} />
          <div className="mt-3 flex flex-col gap-3">
            <ReadText label="На что жалоба — что произошло">{PROTEST16_3.what}</ReadText>
            <ReadText label="Что просит">{PROTEST16_3.ask}</ReadText>
          </div>
        </Panel>

        <Panel title="Материалы дела" sub="приехали вместе с результатом (TZ §6.5)" flush>
          <div className="divide-y divide-neutral-100">
            {MATERIALS16_3.map((m) => (
              <Row key={m.nm} nm={m.nm} sub={m.sub} pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
            ))}
          </div>
          <div className="px-4 pb-1 pt-3">
            <Bar>Комитет не запрашивает материалы у судьи и не ждёт их — дело уже полное.</Bar>
          </div>
        </Panel>

        {/* У каждого участника — ссылка в его дисциплинарную историю. */}
        <Panel title="Участники дела" sub="строка ведёт в дисциплинарную историю" flush>
          <div className="divide-y divide-neutral-100">
            {PARTIES16_3.map((p) => <Row key={p.nm} to="Э16.4" {...p} />)}
          </div>
        </Panel>

        <Panel title="Решение" sub="текст решения и что оно меняет">
          <div className="flex flex-col gap-3.5">
            <AreaInput label="Текст решения" value={DECISION16_3.text} rows={3} />
            <AreaInput label="Что оно меняет" value={DECISION16_3.effect} rows={2} />
          </div>
          <div className="mt-4">
            <Rule16_3 />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="max-w-[46%] text-xs text-neutral-500">
              Решение уйдёт заявителю уведомлением и останется в истории участников
            </span>
            <span className="flex items-center gap-2">
              <QuietAction onPress={() => setAsk(true)}>
                <FileText size={14} /> Запросить пояснение
              </QuietAction>
              <PrimaryAction>Принять решение</PrimaryAction>
            </span>
          </div>
        </Panel>
      </>

      {/* Вопрос уходит судье или главному судье старта ✳ — диалог поверх дела,
          материалы остаются перед глазами. */}
      {ask && (
        <InlineDialog
          title="Запросить пояснение"
          sub="вопрос уходит судье или главному судье старта"
          to="Э16.3"
          foot={
            <>
              <span className="mr-auto text-xs text-neutral-500">
                Ответ придёт в это же дело
              </span>
              <QuietAction onPress={() => setAsk(false)}>Отмена</QuietAction>
              <Button variant="primary" onPress={() => setAsk(false)}>
                <Send size={15} /> Отправить вопрос
              </Button>
            </>
          }
        >
          <AskForm16_3 />
        </InlineDialog>
      )}
    </WebApp>
  );
}

/** То же дело на телефоне ✳ (30.08.2026).

    Порядок блоков тот же, что и разбор: протест → материалы → участники →
    решение. Он и есть решение экрана, и от ширины не зависит: решение не должно
    оказаться раньше того, по чему его принимают.

    Что меняется: поля решения идут во всю ширину, полоса решений разъезжается
    в две кнопки друг под другом («Принять решение» первым — оно главное), а
    диалог пояснения приходит снизу во всю ширину. Все переходы участников
    (`data-to="Э16.4"`) сохранены. */
export function Case16_3Ph() {
  const [ask, setAsk] = useState(false);
  return (
    <PhoneRoleApp
      role={RD}
      nav="Протесты"
      title="Дело Д-118"
      back={{ label: 'Протесты', to: 'Э16.2' }}
    >
      <Panel title="Протест" extra={<Pill t="НА РАССМОТРЕНИИ" color="accent" />}>
        <KV items={CASE16_3} />
        <div className="mt-3 flex flex-col gap-3">
          <ReadText label="На что жалоба — что произошло">{PROTEST16_3.what}</ReadText>
          <ReadText label="Что просит">{PROTEST16_3.ask}</ReadText>
        </div>
      </Panel>

      <Panel title="Материалы дела" sub="приехали вместе с результатом (TZ §6.5)" flush>
        <div className="divide-y divide-neutral-100">
          {MATERIALS16_3.map((m) => (
            <Row key={m.nm} nm={m.nm} sub={m.sub} pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
          ))}
        </div>
        <div className="px-4 pb-1 pt-3">
          <Bar>Комитет не запрашивает материалы у судьи и не ждёт их — дело уже полное.</Bar>
        </div>
      </Panel>

      <Panel title="Участники дела" sub="строка ведёт в дисциплинарную историю" flush>
        <div className="divide-y divide-neutral-100">
          {PARTIES16_3.map((p) => <Row key={p.nm} to="Э16.4" {...p} />)}
        </div>
      </Panel>

      <Panel title="Решение" sub="текст решения и что оно меняет">
        <div className="flex flex-col gap-3.5">
          <AreaInput label="Текст решения" value={DECISION16_3.text} rows={4} wide />
          <AreaInput label="Что оно меняет" value={DECISION16_3.effect} rows={3} wide />
        </div>
        <div className="mt-4">
          <Rule16_3 />
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-neutral-500">
          Решение уйдёт заявителю уведомлением и останется в истории участников
        </p>
      </Panel>

      {ask && (
        <PhoneDialog
          title="Запросить пояснение"
          sub="вопрос уходит судье или главному судье старта · ответ придёт в это же дело"
          to="Э16.3"
          onClose={() => setAsk(false)}
          foot={
            <>
              <Button variant="primary" className="w-full" onPress={() => setAsk(false)}>
                <Send size={15} /> Отправить вопрос
              </Button>
              <Button variant="ghost" className="w-full" onPress={() => setAsk(false)}>Отмена</Button>
            </>
          }
        >
          <AskForm16_3 />
        </PhoneDialog>
      )}
      <ActionBar>
        <Button variant="ghost" className="w-full" onPress={() => setAsk(true)}>
          <FileText size={14} /> Запросить пояснение
        </Button>
        <Button variant="primary" className="w-full">Принять решение</Button>
      </ActionBar>
    </PhoneRoleApp>
  );
}

const Case16_3States = () => (
  <States>
    <Shot tone="info" title="Решение принято — только чтение" text="Дальше дело не правится.">
      <Frag>
        <Rows>
          <Row
            nm="Д-116 · решение принято 13.03"
            sub="решение ушло заявителю уведомлением"
            pill={{ t: 'ЗАКРЫТО', cls: 'live' }}
          />
        </Rows>
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Может ли комитет отменить результат матча ⚠"
      text="Федерация не сказала — вопрос 15.4."
      wide
    >
      <Frag w={680}>
        <Rows>
          <Row nm="Результат матча" sub="отменяет ли его комитет или решение касается только дисциплины" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
          <Row nm="Санкции и допуск" sub="какие возможны и влияют ли на допуск к следующим стартам" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э16.4 · Дисциплинарная история ─────────────────────────────── */

type Ev = {
  at: string;
  ev: string;
  who: string;
  tour: string;
  sub: string;
  kind: string;
  color: 'warning' | 'success' | 'accent' | 'danger';
};

/** Лента собирается автоматически ✳: карточки приходят с табло судьи вместе с
    результатом (TZ §6.5), комитет их не заводит руками. */
const HIST: Ev[] = [
  { at: '13.03', ev: 'Жёлтая карточка', who: 'Токаев Марат', tour: 'Чемпионат Казахстана 2026', sub: 'стол 4 · 1/8 финала · вынес судья Оралбай Е.', kind: 'КАРТОЧКА', color: 'warning' },
  { at: '13.03', ev: 'Решение комитета по делу Д-116', who: 'Тлеуова Аружан', tour: 'Чемпионат Казахстана 2026', sub: 'протест по снятию с матча', kind: 'РЕШЕНИЕ', color: 'success' },
  { at: '12.03', ev: 'Снятие по травме', who: 'Тлеуова Аружан', tour: 'Чемпионат Казахстана 2026', sub: 'стол 11 · подтверждено врачом соревнований', kind: 'СНЯТИЕ', color: 'accent' },
  { at: '12.03', ev: 'Техническое поражение', who: 'Гладун Игорь', tour: 'Чемпионат Казахстана 2026', sub: 'неявка на матч 1/16 · стол 2', kind: 'НЕЯВКА', color: 'danger' },
  { at: '22.02', ev: 'Красная карточка', who: 'Байжанов Асхат', tour: 'Кубок Казахстана 2026', sub: 'группа B · стол 6', kind: 'КАРТОЧКА', color: 'danger' },
];

/** Ключ для сортировки «новые сверху»: дата dd.mm → mmdd. */
const dk = (at: string) => at.split('.').reverse().join('');

const LENSES = ['По человеку', 'По турниру'];

/** Тон события → значок строки: на телефоне вид события стоит значком в строке,
    а не колонкой «Вид», и словарь тонов у них один. */
const EV_CLS: Record<Ev['color'], 'live' | 'wait' | 'bad' | 'reg'> = {
  success: 'live',
  warning: 'wait',
  danger: 'bad',
  accent: 'reg',
};

/** Что показывает лента под линзой и поиском — одно на оба формата: линза
    честно перестраивает список, и перестраивать его двумя выражениями нельзя. */
const hist16_4 = (lens: string, q: string) => {
  const t = q.trim().toLowerCase();
  const found = HIST.filter(
    (e) => !t || e.who.toLowerCase().includes(t) || e.tour.toLowerCase().includes(t) || e.ev.toLowerCase().includes(t),
  );
  const byPerson = lens === LENSES[0];
  return {
    byPerson,
    rows: [...found].sort((a, b) =>
      byPerson
        ? a.who.localeCompare(b.who, 'ru') || dk(b.at).localeCompare(dk(a.at))
        : a.tour.localeCompare(b.tour, 'ru') || dk(b.at).localeCompare(dk(a.at)),
    ),
  };
};

/** Правило ленты: комитет её не заполняет. Текст один на оба формата. */
const Rule16_4 = () => (
  <Bar>
    Комитет ленту не заполняет: карточки и снятия приходят с табло судьи вместе с
    результатом матча (TZ §6.5). Запись без события на столе — это уже не история, а мнение.
  </Bar>
);

/** Подсказка экрана: откуда лента берётся. Один текст на оба формата. */
const HINT16_4 =
  'Собирается автоматически: карточки приходят с табло судьи вместе с результатом матча (TZ §6.5) — комитет их не заводит руками.';

/** Лента нарушений и решений: смотреть, фильтровать, выгружать — без права
    правки. Переключатель линзы честно перестраивает таблицу: тот же список
    читается по людям и по турнирам. */
export function History16_4() {
  const [lens, setLens] = useState(LENSES[0]);
  const [q, setQ] = useState('');
  const { byPerson, rows } = hist16_4(lens, q);
  const eventCell = (e: Ev) => (
    <span className="leading-tight">
      <span className="block font-medium">{e.ev}</span>
      <span className="block text-xs text-neutral-500">{e.sub}</span>
    </span>
  );
  return (
    <WebApp
      role={RD}
      nav="История"
      title="Дисциплинарная история"
      hint={HINT16_4}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Лента по человеку и по турниру — одна, линза меняет чтение. */}
          <FilterSeg items={LENSES} active={lens} onPick={setLens} />
          <SearchInput value={q} onChange={setQ} placeholder="Фамилия, турнир или событие" className="w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Download size={14} /> Выгрузить
          </Button>
          <Button size="sm" variant="outline" data-to="Э16.2">
            <Scroll size={14} /> Протесты
          </Button>
        </div>
      </div>

      <Panel
        title="Лента нарушений"
        sub="только чтение и выгрузка"
        extra={<span className="text-xs text-neutral-500">заводить запись руками нельзя</span>}
        flush
      >
        {rows.length ? (
          <DataTable
            cols={byPerson ? ['Человек', 'Событие', 'Турнир', 'Когда', 'Вид'] : ['Турнир', 'Событие', 'Человек', 'Когда', 'Вид']}
            grid="1.1fr 1.9fr 1.3fr 64px 104px"
            rows={rows.map((e) => ({
              key: e.at + e.ev + e.who,
              cells: byPerson
                ? [
                  <span key="w" className="font-medium">{e.who}</span>,
                  eventCell(e),
                  <span key="t" className="text-neutral-500">{e.tour}</span>,
                  <span key="d" className="tabular-nums text-neutral-600">{e.at}</span>,
                  <Pill key="k" t={e.kind} color={e.color} />,
                ]
                : [
                  <span key="t" className="font-medium">{e.tour}</span>,
                  eventCell(e),
                  <span key="w" className="text-neutral-500">{e.who}</span>,
                  <span key="d" className="tabular-nums text-neutral-600">{e.at}</span>,
                  <Pill key="k" t={e.kind} color={e.color} />,
                ],
            }))}
          />
        ) : (
          <div className="p-4">
            <EmptyBox title="Ничего не нашлось" text={`По запросу «${q}» событий нет — проверьте написание.`} />
          </div>
        )}
        <div className="px-4 pb-1 pt-3">
          {/* Запись без события на столе — это уже не история, а мнение. */}
          <Rule16_4 />
        </div>
      </Panel>
    </WebApp>
  );
}

/** Та же лента на телефоне ✳ (30.08.2026).

    Таблица из пяти колонок в 392 px не живёт, а линза при этом обязана
    работать: она и есть решение экрана — один список читается по людям и по
    турнирам. В строке поэтому меняется само имя: под линзой «По человеку»
    первым стоит человек, под «По турниру» — турнир, а всё остальное уходит
    подписью. Вид события остаётся значком и тем же цветом.

    Линза и поиск встают друг под другом: в один ряд на телефоне они не
    помещаются, а поиск здесь работает — по нему сюда и приходят («что было у
    этого человека»). Выгрузка остаётся тихой кнопкой внизу: файл с телефона
    всё равно открывают не здесь. */
export function History16_4Ph() {
  const [lens, setLens] = useState(LENSES[0]);
  const [q, setQ] = useState('');
  const { byPerson, rows } = hist16_4(lens, q);
  return (
    <PhoneRoleApp
      role={RD}
      nav="История"
      title="Дисциплинарная история"
    >
      <div className="mb-3 flex flex-col gap-2">
        <Scroller><FilterSeg items={LENSES} active={lens} onPick={setLens} /></Scroller>
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия, турнир или событие" className="w-full" />
      </div>

      <Panel title="Лента нарушений" sub="только чтение и выгрузка" flush>
        {rows.length ? (
          <div className="divide-y divide-neutral-100">
            {rows.map((e) => (
              <Row
                key={e.at + e.ev + e.who}
                nm={byPerson ? e.who : e.tour}
                sub={`${e.ev} · ${byPerson ? e.tour : e.who} · ${e.at} · ${e.sub}`}
                pill={{ t: e.kind, cls: EV_CLS[e.color] }}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyBox title="Ничего не нашлось" text={`По запросу «${q}» событий нет — проверьте написание.`} />
          </div>
        )}
        <div className="px-4 pb-1 pt-3">
          <Rule16_4 />
        </div>
      </Panel>

      <div className="flex flex-col gap-2">
        <Button variant="ghost" className="w-full" data-to="Э16.2">
          <Scroll size={14} /> Протесты
        </Button>
        <Button variant="ghost" className="w-full">
          <Download size={14} /> Выгрузить
        </Button>
      </div>
    </PhoneRoleApp>
  );
}

const History16_4States = () => (
  <States>
    <Shot tone="info" title="Нарушений нет" text="Так и написано, а не пустая лента.">
      <Frag>
        <EmptyBox title="Нарушений нет" text="Карточки и снятия появляются здесь сами, когда судья выносит их на столе." />
      </Frag>
    </Shot>

    <Shot
      tone="danger"
      title="Влияют ли карточки на допуск и на рейтинг ⚠"
      text="Вопрос 15.4: до ответа система только фиксирует."
    >
      <Frag>
        <Rows>
          <Row nm="Допуск к следующим стартам" sub="закрывает ли красная карточка следующий турнир" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
          <Row nm="Рейтинг судьи" sub="влияет ли решение комитета на баллы (TZ §7.2)" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд ───────────────────────────────────────────────────────── */

/** Экраны роли по кодам: коды, подписи и порядок — те же, что были: по ним
    сходятся flows/, данные роли и Storybook.

    У каждого экрана есть `alt` — тот же экран во втором формате ✳ (30.08.2026,
    решение владельца продукта «все экраны в обоих»): экраны рисовались
    десктопом, второй кадр телефонный. Состояния (`States`) во втором формате не
    повторяются: состояние экрана — про ситуацию, а не про устройство. */
export const SCREENS: ScreenMap = {
  'Э16.1': {
    cap: 'Протест спортсмена',
    view: () => (<><Protest16_1 /><Protest16_1States /></>),
    alt: () => <Protest16_1Ph />,
    next: 'дело уходит в комитет',
  },
  'Э16.2': {
    cap: 'Протесты',
    view: () => (<><Cases16_2 /><Cases16_2States /></>),
    alt: () => <Cases16_2Ph />,
    next: 'взять в работу',
  },
  'Э16.3': {
    cap: 'Дело',
    view: () => (<><Case16_3 /><Case16_3States /></>),
    alt: () => <Case16_3Ph />,
    next: 'история участника',
  },
  'Э16.4': {
    cap: 'Дисциплинарная история',
    view: () => (<><History16_4 /><History16_4States /></>),
    alt: () => <History16_4Ph />,
  },
};

export function Role16Board() {
  return <Board role={RD} screens={SCREENS} />;
}
