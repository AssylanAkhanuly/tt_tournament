/* Роль 7 · Главный секретарь соревнований — макеты по флоу на новом слое
   (HeroUI) ✳ (30.08.2026). Содержание, решения и переходы — прежние
   (см. `flows/07-glavnyy-sekretar.md`); меняется подача: оболочка WebApp и
   доменные компоненты `kit/hero/app` вместо старого макетного слоя.

   Главное, что должны показывать макеты: у турнира два рабочих места, и они
   разведены — **секретарь собирает, судья утверждает** (решение 19.08.2026).
   Поэтому у секретаря нет экрана заявок, вводные судьи стоят на чтение, а
   каждая готовая работа заканчивается кнопкой «Передать главному судье». */

import { useState, type ReactNode } from 'react';
import {
  ArrowUpDown, CalendarDays, Grid3x3, LayoutDashboard, Printer, RefreshCw, Scroll, Send, Shuffle,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import {
  A, AW, AreaInput, Bar, FieldView, FilterSeg, FormGrid, KV, Panel, PhoneRoleApp, Pill, Row, Rows,
  ScreenScope, SearchInput, StatTiles, TextInput, WebApp, type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* Сетка — тот же холст и та же модель, что у спортсмена (Э14.5), у
   администратора федерации (Э1.3) и на фронте: секретарь собирает ровно то,
   что потом увидят игроки. Пять кругов — плей-офф на 32: полная сетка на 128
   при вписывании в экран нечитаема, а формат Кубка — «олимпийская с группами»,
   и в плей-офф из групп выходят как раз 32. */
import { makeBigBracket } from '../bigBracket';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
/* Маршрут судейской роли начинается раньше входа: судья заводит себя сам
   (Э0.7), а роль в наряде ему выдают уже потом. Без этой колонки борд и карта
   начинались с «Вход», и откуда взялся человек, из них было не видно. */
import { Login0_1, LoginPhone0_1, SignUpJudge0_7, SignUpJudge0_7States } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    Подписи пунктов те же слова: по ним карта флоу находит переходы. */
const R07: RoleUI = {
  num: '7',
  title: 'Главный секретарь соревнований',
  person: { nm: 'Ким Л.', rl: 'Главный секретарь', av: AW(31) },
  brandName: 'Чемпионат Казахстана 2026',
  brandSub: 'Одиночный · олимпийская · г. Астана',
  badge: 'ИДЁТ',
  nav: [
    [<LayoutDashboard size={16} key="d" />, 'Рабочий стол'],
    [<Grid3x3 size={16} key="b" />, 'Сетка'],
    [<CalendarDays size={16} key="s" />, 'Расписание'],
    [<Scroll size={16} key="p" />, 'Протоколы'],
  ],
};

/** Значок состояния в шапке: на каждом экране турнир в своём состоянии (§4.3) —
    у секретаря это «Система проведения», а протоколы открываются в «Итоговом
    протоколе». Тем же приёмом собран главный судья (role06). */
const at = (badge: string): RoleUI => ({ ...R07, badge });

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

/** Таблица с «живыми» строками: шапка колонок задана, строки собирает экран —
    у жребия строка меняет слот от броска, в расписании горит конфликтом.
    ⚠ Временная дупликация с той же таблицей в role05/role06 — когда роли
    доедут до нового слоя, таблице место в `kit/hero/app`. */
const Sheet = ({ cols, grid, children }: { cols: ReactNode[]; grid: string; children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <div
      className="grid items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
      style={{ gridTemplateColumns: grid }}
    >
      {cols.map((c, i) => <span key={i} className="min-w-0">{c}</span>)}
    </div>
    <div className="divide-y divide-neutral-100">{children}</div>
  </div>
);

/** Заголовок сортируемого столбца: слоты сравнивают по номеру, людей — по
    фамилии и рейтингу. ⚠ Дупликация с role05 — до общего компонента. */
const Th = ({ t, on, onClick }: { t: string; on: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={'flex items-center gap-1 text-left ' + (on ? 'text-neutral-700' : 'hover:text-neutral-600')}
  >
    {t}
    {on && <ArrowUpDown size={11} />}
  </button>
);

/** Пустой результат поиска — строкой таблицы, а не отдельным экраном. */
const NoRows = ({ children }: { children: ReactNode }) => (
  <div className="px-4 py-4 text-[12.5px] text-neutral-500">{children}</div>
);

/** Человек в строке таблицы: фото и две строки.
    ⚠ Дупликация с role05 — до общего компонента. */
const Who = ({ av, nm, sub }: { av?: string; nm: string; sub?: ReactNode }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    {av && (
      <Avatar size="sm">
        <Avatar.Image alt={nm} src={av} />
        <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
    )}
    <span className="min-w-0 leading-tight">
      <span className="block truncate text-[13.5px] font-medium">{nm}</span>
      {sub && <span className="block truncate text-xs text-neutral-500">{sub}</span>}
    </span>
  </span>
);

/* ── Телефонный кадр: что меняется на 392 px ────────────────────── */

/* Полный адаптив ✳ (решение владельца, 30.08.2026): у каждого экрана роли есть
   второй формат. Секретарь работает в зале рядом с судьёй — заводит результаты
   матчей, правит расписание на ходу, — и телефон ему такое же рабочее место,
   как ноутбук на столе секретариата. Телефонный кадр берёт те же данные и
   отличается только раскладкой.

   ⚠ Те же обёртки живут в role06 — когда телефонные кадры появятся у всех
   ролей, им место в `kit/hero/app`. */

/** Плитки-счётчики на телефоне: тот же `StatTiles`, но в два столбца. */
const PhoneTiles = ({ children }: { children: ReactNode }) => (
  <div className="[&>div]:grid-flow-row [&>div]:grid-cols-2 [&>div]:gap-2">{children}</div>
);

/** Полоса переключателей на телефоне: не переносится рядами, а уезжает вбок —
    пять срезов сборки сетки на 392 px иначе встают в три ряда. */
const Strip = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 mb-3 overflow-x-auto px-4 **:data-seg:flex-nowrap">{children}</div>
);

/* Кнопок-обёрток здесь не понадобилось: решения секретаря на телефоне стоят
   столбиком (`flex flex-col`), а в таком ряду кнопка растягивается сама. */

/** Плитки экрана: один набор чисел на оба формата. */
type Tile = { v: string; k: string; tone?: 'g' | 'a' | 'b'; to?: string };

/** Главное действие секретаря: работа готова — уходит судье. Одна на экран.
    `wide` — когда кнопка стоит одна над таблицей во всю её ширину; в ряду с
    соседними кнопками она занимает столько, сколько нужно подписи. */
const ToJudge = (
  { wide, onPress, children }: { wide?: boolean; onPress?: () => void; children: ReactNode },
) => (
  <Button variant="primary" className={wide ? 'w-full' : undefined} onPress={onPress}>
    <Send size={15} /> {children}
  </Button>
);

/* ── Э7.1 · Рабочий стол: список работ и решение судьи ───────────── */

const TILES7_1: Tile[] = [
  { v: '128', k: 'Участников' },
  { v: '20', k: 'Столов в зале' },
  { v: '3', k: 'Игровых дня' },
  { v: '1 / 4', k: 'Работ готово', tone: 'a' },
];

/** Работа по турниру: что собирает секретарь, готово ли это и у кого лежит.
    Один список на оба формата — строка ведёт на свой экран. */
type Work = { to?: string; nm: string; sub: string; p: string; cls: Cls; act?: string };

const WORKS7_1: Work[] = [
  {
    to: 'Э7.3', nm: 'Система проведения и жеребьёвка',
    sub: 'формат выбран · жребий проведён 14.05, 12:40 · 16 сеяных',
    p: 'ГОТОВО', cls: 'live', act: 'Открыть',
  },
  {
    to: 'Э7.3', nm: 'Сетка',
    sub: 'олимпийская, 128 участников · собрана 15.05, 09:20',
    p: 'У ГЛАВНОГО СУДЬИ', cls: 'wait', act: 'Открыть',
  },
  {
    to: 'Э7.4', nm: 'Расписание',
    sub: '127 матчей без времени · 20 столов, 8 часов в день',
    p: 'НЕ СОСТАВЛЕНО', cls: 'bad', act: 'Открыть',
  },
  { to: 'Э7.5', nm: 'Протокол', sub: 'откроется, когда матчи сыграны', p: 'ЖДЁТ МАТЧЕЙ', cls: 'wait' },
];

const Works7_1 = () => (
  <div className="divide-y divide-neutral-100">
    {WORKS7_1.map((w) => (
      <Row key={w.nm} to={w.to} nm={w.nm} sub={w.sub} pill={{ t: w.p, cls: w.cls }} action={w.act} />
    ))}
  </div>
);

/** Вводные судьи — на чтение: секретарь работает по решению судьи ✳, править
    их здесь нельзя, поэтому поля — подписями, а не формой. */
const JUDGE_KV: [string, string][] = [
  ['Система проведения', 'Олимпийская'],
  ['Дисциплина', 'Одиночная'],
  ['Партий в матче', 'до 3 из 5'],
  ['Утешительная сетка', 'нет'],
  ['Дни и столы', '18–20 мая · 20 столов · 8 часов в день'],
];

/** Проп `variant` старой адаптивной рамки сохранён ради истории «Адаптив»:
    у нового слоя своей планшетной рамки веба пока нет. */
export function Desk7_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  return (
    <WebApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Рабочий стол"
      title="Рабочий стол секретаря"
      sub="Чемпионат Казахстана 2026 · 18–20.05.2026 · состояние «Система проведения»"
    >
      <StatTiles items={TILES7_1} />
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две
          колонки узкое «Решение главного судьи» висело в пустоте рядом со
          сжатым списком работ, а подписи работ обрезались. Панель сама держит
          отступ снизу — обёртка не нужна. */}
      <>
        {/* Работы — главный акцент экрана: у каждой видно, готова ли она и у
            кого сейчас лежит; строка ведёт на свой экран. */}
        <Panel title="Работы по турниру" extra={<Pl t="СИСТЕМА ПРОВЕДЕНИЯ" cls="reg" />} flush>
          <Works7_1 />
        </Panel>

        <Panel title="Решение главного судьи · чтение" extra={<Pl t="ТОЛЬКО ПРОСМОТР" cls="wait" />}>
          <KV items={JUDGE_KV} />
        </Panel>
      </>
    </WebApp>
  );
}

/** Э7.1 на телефоне: тот же список работ и те же вводные судьи.
    Список работ стоит первым — с него секретарь и начинает, а плитки-счётчики
    (участники, столы, дни) в два столбца под ним: это справка о размере старта,
    а не то, ради чего открывают телефон. */
export function Desk7_1Phone() {
  return (
    <PhoneRoleApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Рабочий стол"
      title="Рабочий стол секретаря"
      sub="Чемпионат Казахстана 2026 · 18–20.05 · «Система проведения»"
    >
      <Panel title="Работы по турниру" extra={<Pl t="1 / 4 ГОТОВО" cls="reg" />} flush>
        <Works7_1 />
      </Panel>

      <PhoneTiles>
        <StatTiles items={TILES7_1} />
      </PhoneTiles>

      <Panel title="Решение главного судьи · чтение" extra={<Pl t="ПРОСМОТР" cls="wait" />}>
        <KV items={JUDGE_KV} />
      </Panel>
    </PhoneRoleApp>
  );
}

const Desk7_1States = () => (
  <States>
    <Shot
      tone="info"
      title="До «Системы проведения» работы закрыты"
      text="Пояснение «идёт приём заявок»; экрана заявок у секретаря нет."
      wide
    >
      <Frag>
        <Rows>
          <Row nm="Жеребьёвка" sub="откроется, когда закроется приём заявок" pill={{ t: 'ЖДЁТ СОСТАВА', cls: 'done' }} />
          <Row nm="Сетка" sub="строится после жеребьёвки" pill={{ t: 'ЖДЁТ', cls: 'done' }} />
        </Rows>
        <div className="mt-3">
          <Bar>Состав ещё собирается: заявки принимает главный судья, секретарь их не видит.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Жеребьёвка: часть параметров проведения (Э7.3) ──────────────── */

/* Отдельным экраном она быть перестала ✳ (19.08.2026): жеребьёвка — не этап
   сам по себе, а один из параметров проведения, которые собирает секретарь.
   Пунктом меню она стояла между «Сеткой» и «Расписанием», хотя без сетки
   бессмысленна: слоты жребия — это и есть места в сетке. */

/** Участник в жеребьёвке: какой слот сетки достался, кто это и на чём стоит.

    Слот и человек — одна строка, а не два списка. Раньше это были две вкладки:
    «Слоты» по номерам и «Список участников» по алфавиту, — один и тот же состав
    двумя взглядами. Одна таблица с сортировкой даёт оба: по слоту — порядок
    сетки, по фамилии — поиск человека. */
type SlotRow = { slot: number; seed: number; av: string; nm: string; club: string; rt: number };

/** Первые шестнадцать по рейтингу — сеяные (`seed` = номер посева). У остальных
    посева нет, и слот им достаётся жребием. */
const SLOTS: SlotRow[] = [
  { slot: 1, seed: 1, av: A(32), nm: 'Смагулов Алан', club: 'Алатау · Алматы', rt: 2456 },
  { slot: 128, seed: 2, av: A(44), nm: 'Ким Георгий', club: 'СКА · Астана', rt: 2401 },
  { slot: 65, seed: 3, av: A(51), nm: 'Токаев Марат', club: 'Шымкент', rt: 2350 },
  { slot: 64, seed: 4, av: A(13), nm: 'Пак Сергей', club: 'Иртыш · Павлодар', rt: 2312 },
  { slot: 33, seed: 5, av: A(19), nm: 'Цой Виктор', club: 'Шахтёр · Караганда', rt: 2288 },
  { slot: 96, seed: 6, av: A(76), nm: 'Оспанов Дархан', club: 'СКА · Астана', rt: 2270 },
  { slot: 12, seed: 0, av: A(22), nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', rt: 2190 },
  { slot: 97, seed: 0, av: A(56), nm: 'Гладун Игорь', club: 'Тараз', rt: 2165 },
  { slot: 44, seed: 0, av: A(45), nm: 'Досжан Марат', club: 'Алатау · Алматы', rt: 2140 },
  { slot: 81, seed: 0, av: A(64), nm: 'Сериков Нурлан', club: 'Барыс · Астана', rt: 2118 },
  { slot: 29, seed: 0, av: A(51), nm: 'Байжанов Арман', club: 'Ақжайық · Актобе', rt: 2095 },
  { slot: 116, seed: 0, av: A(13), nm: 'Мұрат Ерасыл', club: 'Тараз', rt: 2072 },
];

/** Слоты, которые достаются жребием. Сеяные стоят на своих номерах по рейтингу
    и не двигаются — их разводят по четвертям сетки; остальные при каждом броске
    получают новые слоты из этого набора. */
const LOTS = [12, 97, 44, 81, 29, 116];

const COLS72: { k: 'slot' | 'nm' | 'rt' | 'seed'; t: string }[] = [
  { k: 'slot', t: 'Слот' },
  { k: 'nm', t: 'Участник' },
  { k: 'rt', t: 'Рейтинг' },
  { k: 'seed', t: 'Основание' },
];

/** Состояние жребия. `draft` — ещё не бросали; `done` — результат есть;
    `sent` — ушёл главному судье на утверждение.

    Перебросить можно и после отправки: по флоу это разрешено, «пока сетка не
    утверждена судьёй». Новый бросок отзывает отправленный результат — судья не
    должен утверждать то, чего уже нет. */
type DrawSt = 'draft' | 'done' | 'sent';

/** Два способа распределения — два разных экрана, а не подсветка ✳.

    **Посев по рейтингу**: слоты считаются из рейтинга, случайности нет вовсе —
    бросать и перебрасывать нечего, работа сразу готова к передаче судье.
    **Жребий**: сеяные стоят по рейтингу, остальных разводит бросок — появляются
    «Провести жеребьёвку» и «Перебросить». */
const WAYS = ['Посев по рейтингу', 'Жребий'];

const SLOT_GRID = '64px 2.1fr 0.8fr 1.3fr';

/** Жеребьёвка: слоты и способ их раздачи.
    `phone` — тот же блок в телефонном кадре: таблица из четырёх колонок в
    392 px не ложится, и состав идёт строками реестра; сортировка, которая на
    десктопе живёт в шапке таблицы, становится полосой над списком. */
const DrawPanel = ({ phone }: { phone?: boolean }) => {
  const [way, setWay] = useState(WAYS[1]);
  const lot = way === WAYS[1];
  const [st, setSt] = useState<DrawSt>('draft');
  /* Сколько раз бросали. Первый бросок — не переброс, поэтому перебросов на
     один меньше: счётчик отвечает на вопрос «сколько раз переигрывали». */
  const [n, setN] = useState(0);
  const [q, setQ] = useState('');
  /* По умолчанию — по слоту: это порядок сетки, ради него на экран и приходят.
     Сортировка по фамилии даёт второй взгляд, ради которого раньше держали
     отдельную вкладку. */
  const [sort, setSort] = useState<{ k: (typeof COLS72)[number]['k']; up: boolean }>({ k: 'slot', up: true });
  const roll = () => { setN(n + 1); setSt('done'); };

  /* При посеве по рейтингу случайного места нет ни у кого: слоты идут по
     рейтингу, и в строке так и написано — «посев», а не «жребий». При жребии
     сеяные не двигаются, остальные сдвигаются на один слот за бросок. */
  const all = SLOTS.map((r, i) => {
    if (!lot) return { ...r, seed: i + 1 };
    if (r.seed || n === 0) return r;
    const k = LOTS.indexOf(r.slot);
    return { ...r, slot: LOTS[(k + n) % LOTS.length] };
  });
  const found = all.filter((r) => {
    const t = q.trim().toLowerCase();
    return !t || r.nm.toLowerCase().includes(t) || r.club.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const v = k === 'nm' ? a.nm.localeCompare(b.nm, 'ru') : a[k] - b[k];
    return sort.up ? v : -v;
  });

  const head: Record<DrawSt, { t: string; cls: Cls }> = {
    draft: { t: lot ? 'ЧЕРНОВИК ЖРЕБИЯ' : 'ПОСЕВ ГОТОВ', cls: lot ? 'wait' : 'live' },
    done: { t: 'ЖРЕБИЙ ПРОВЕДЁН', cls: 'live' },
    sent: { t: 'У ГЛАВНОГО СУДЬИ', cls: 'reg' },
  };

  return (
    <>
      {/* Вкладок «Слоты» и «Список участников» больше нет ✳: это был один и тот
          же состав двумя взглядами, а сортировка по столбцу даёт оба — по слоту
          порядок сетки, по фамилии поиск человека.

          **Жеребьёвка лежит на главном судье** ✳ (комментарий федерации,
          09.2026), но секретарь вправе её видеть и с ней работать: бросить,
          перебросить, пересобрать слоты. Разница не в кнопках, а в том, чьё
          решение окончательно — **утверждает только главный судья** (Э6.3).
          Поэтому здесь нет и не может быть «утвердить»: работа уходит наверх
          передачей. */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <FilterSeg
          items={WAYS}
          active={way}
          onPick={(v) => { setWay(v); setSt('draft'); setN(0); }}
        />
        <Pl t={head[st].t} cls={head[st].cls} />
        <span className="text-[12.5px] text-neutral-500">
          {lot
            ? n === 0 ? 'жребий не бросали' : `бросок ${n} · перебросов ${n - 1}`
            : 'случайность не участвует — слоты считаются из рейтинга'}
        </span>
      </div>

      <div className={phone ? 'mb-3 flex flex-col gap-2' : 'mb-3 flex items-center justify-between gap-4'}>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Фамилия, клуб или регион"
          className={phone ? 'w-full' : 'w-80'}
        />
        <span className="text-[12.5px] text-neutral-500">
          {rows.length === all.length ? `${all.length} участников` : `найдено ${rows.length} из ${all.length}`}
        </span>
      </div>

      {phone ? (
        <>
          {/* Сортировка на телефоне — полосой над списком: шапки таблицы, в
              которой на десктопе кликают по столбцу, здесь нет. */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-xs text-neutral-500">Сортировка</span>
            <FilterSeg
              items={COLS72.filter((c) => c.k !== 'seed').map((c) => c.t)}
              active={COLS72.find((c) => c.k === sort.k)?.t ?? COLS72[0].t}
              onPick={(t) => {
                const c = COLS72.find((x) => x.t === t);
                if (c) setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true });
              }}
            />
          </div>
          <Rows>
            {rows.map((r) => (
              <Row
                key={r.nm}
                av={r.av}
                nm={`${r.slot} · ${r.nm}`}
                sub={`${r.club} · рейтинг ${r.rt}`}
                pill={
                  r.seed
                    ? { t: `ПОСЕВ №${r.seed}`, cls: 'reg' }
                    : { t: n === 0 ? 'ЖДЁТ ЖРЕБИЯ' : 'ЖРЕБИЙ', cls: 'wait' }
                }
              />
            ))}
            {rows.length === 0 && (
              <NoRows>По запросу «{q}» никого нет — проверьте написание фамилии.</NoRows>
            )}
          </Rows>
        </>
      ) : (
        <Sheet
          grid={SLOT_GRID}
          cols={COLS72.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
            />
          ))}
        >
          {rows.map((r) => (
            <div
              key={r.nm}
              className="grid items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-neutral-50"
              style={{ gridTemplateColumns: SLOT_GRID }}
            >
              <b className="tabular-nums">{r.slot}</b>
              <Who av={r.av} nm={r.nm} sub={r.club} />
              <span className="tabular-nums text-neutral-600">{r.rt}</span>
              {/* Посев учитывается основанием строки, а не отдельной вкладкой:
                  видно, почему человек стоит именно здесь — по рейтингу или по
                  броску. У сеяных слот от жребия не зависит. */}
              <span>
                {r.seed
                  ? <Pl t={`ПОСЕВ №${r.seed}`} cls="reg" />
                  : <Pl t={n === 0 ? 'ЖДЁТ ЖРЕБИЯ' : 'ЖРЕБИЙ'} cls="wait" />}
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <NoRows>По запросу «{q}» никого нет — проверьте написание фамилии.</NoRows>
          )}
        </Sheet>
      )}

      {/* Кнопки идут по состоянию работы: пока не бросали — перебрасывать и
          передавать нечего, поэтому их на экране нет. */}
      <div className={'mt-3 flex gap-2 ' + (phone ? 'flex-col' : '')}>
        {!lot && st !== 'sent' && (
          <ToJudge wide onPress={() => setSt('sent')}>Передать главному судье на утверждение</ToJudge>
        )}
        {lot && st === 'draft' && (
          <Button variant="primary" className="flex-1" onPress={roll}>
            <Shuffle size={15} /> Провести жеребьёвку
          </Button>
        )}
        {lot && st !== 'draft' && (
          <>
            {st === 'done' && (
              <ToJudge wide onPress={() => setSt('sent')}>Передать главному судье на утверждение</ToJudge>
            )}
            {/* Прежний результат уходит в журнал: переигранный жребий — то, что
                участники вправе проверить. */}
            <Button variant="outline" onPress={roll}>
              <RefreshCw size={15} /> Перебросить жребий
            </Button>
          </>
        )}
      </div>

      <div className="mt-3">
        <Bar>
          {st === 'sent'
            ? 'Жребий у главного судьи. Перебросить ещё можно — пока он не утвердил; новый бросок отзывает отправленный результат.'
            : 'Жеребьёвка лежит на главном судье ✳: секретарь вправе с ней работать, но утверждает её только он (Э6.3).'}
        </Bar>
      </div>
    </>
  );
};

/* Подсказка системы (§5.3). Ресурс зала считается один раз: 20 столов × 3 дня
   × 8 часов = 480 стол-часов, средний матч — 35 минут. Светофор сравнивает
   потребность варианта с этим ресурсом, поэтому расчёт раскрывается и
   проверяется руками — секретарь видит, из чего сложилась оценка. */
type Sys = { nm: string; sum: string; calc: string; idle: string; p: string; cls: 'live' | 'wait' | 'bad'; on?: boolean };

const SYSTEMS: Sys[] = [
  {
    nm: 'Олимпийская (с утешением за 3–4 места)',
    sum: '111 матчей · 65 стол-часов · 14 % ресурса зала',
    calc: 'расчёт: 111 матчей × 35 мин ÷ 20 столов ≈ 3,2 часа чистой игры',
    idle: 'простой: в 1/2 и финале заняты 2 стола из 20 — третий день зал стоит',
    p: 'УКЛАДЫВАЕТСЯ', cls: 'live', on: true,
  },
  {
    nm: 'Группы по 4 + плей-офф',
    sum: '223 матча · 130 стол-часов · 27 % ресурса зала',
    calc: 'расчёт: 28 групп × 6 матчей = 168, плей-офф 56 участников = 55; 223 × 35 мин ÷ 20 столов ≈ 6,5 часа',
    idle: 'простоя нет: у каждого участника не меньше трёх матчей',
    p: 'УКЛАДЫВАЕТСЯ', cls: 'live',
  },
  {
    nm: 'Круговая в 8 группах по 14',
    sum: '728 матчей · 425 стол-часов · 88 % ресурса зала',
    calc: 'расчёт: 8 групп × 91 матч = 728; 728 × 35 мин ÷ 20 столов ≈ 21 час — почти все три дня',
    idle: 'резерв на задержки — полдня: одна затянувшаяся группа сдвинет расписание',
    p: 'ВПРИТЫК', cls: 'wait',
  },
  {
    nm: 'Круговая — все со всеми',
    sum: '6 216 матчей · 3 626 стол-часов · 756 % ресурса зала',
    calc: 'расчёт: 112 × 111 ÷ 2 = 6 216 матчей; при 20 столах и 8 часах в день это 23 дня вместо 3',
    idle: 'не помещается ни в столы, ни в часы',
    p: 'НЕ УКЛАДЫВАЕТСЯ', cls: 'bad',
  },
];

/** Вкладка «Свод»: варианты системы целиком — сколько матчей, часов и ресурса
    зала съедает каждый. Подсвечен вариант, который выбрал главный судья
    (Э7.1, «Система проведения — Олимпийская»): подсказка сравнивает, но не
    советует — граница «судья решает, секретарь оформляет» ✳. */
const Systems7_3 = () => (
  <Rows>
    {SYSTEMS.map((s) => (
      <div
        key={s.nm}
        className={'flex items-start justify-between gap-3 px-4 py-2.5 ' + (s.on ? 'bg-blue-50/60' : '')}
      >
        <span className="min-w-0 leading-tight">
          <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
            {s.nm}
            {s.on && <Pl t="ВЫБРАН СУДЬЁЙ" cls="reg" />}
          </span>
          <span className="mt-0.5 block text-xs text-neutral-500">{s.sum}</span>
          <span className="block text-[11px] text-neutral-400">{s.calc}</span>
          <span className="block text-[11px] text-neutral-400">{s.idle}</span>
        </span>
        <Pl t={s.p} cls={s.cls} />
      </div>
    ))}
  </Rows>
);

/** Вкладка «По кругам»: вариант «группы + плей-офф» из подсказки, разложенный
    по кругам — из этого видно, какой день чем занят и где зал простаивает.
    ⚠ Судья выбрал олимпийскую — раскладка её по кругам в данных не описана;
    рассинхрон помечен, не выдумываем. */
const ROUNDS7_3 = [
  { nm: 'Групповой этап · 28 групп по 4', sub: 'день 1 · 168 матчей · 20 столов заняты', v: '98 стол-часов' },
  { nm: '1/32 и 1/16 плей-офф', sub: 'день 2 · 40 матчей · 20 столов заняты', v: '23 стол-часа' },
  { nm: '1/8 и 1/4', sub: 'день 2 · 12 матчей · 12 столов', v: '7 стол-часов' },
  { nm: '1/2, финал и матч за 3-е место', sub: 'день 3 · 3 матча · 2 стола', v: '2 стол-часа' },
];

const ByRounds7_3 = () => (
  <>
    <Rows>
      {ROUNDS7_3.map((r) => (
        <Row key={r.nm} nm={r.nm} sub={r.sub} val={r.v} />
      ))}
    </Rows>
    <div className="mt-3 text-[12.5px] text-neutral-500">
      Итого 223 матча · 130 стол-часов из 480 · третий день зал занят на два стола
    </div>
  </>
);

/* ── Э7.3 · Параметры проведения: формат, жеребьёвка, сетка ──────── */

/* Границу «кто формирует» федерация в документе задаёт так: у секретаря —
   «сетки», у главного судьи — «утверждение сеток». Решение 19.08.2026: **всё
   формирует секретарь** — систему проведения, жеребьёвку, сетку и расписание,
   — а главный судья их утверждает, правит счёт по ходу игры и имеет доступ к
   любым параметрам турнира. Прежнее «судья решает, секретарь оформляет» этой
   границе противоречило: подсказка по системе и сборка стояли у судьи. */

/** Что показывает экран параметров: подсказка по системе, её раскладка по
    кругам, жеребьёвка и два взгляда на саму сетку. */
const VIEW73 = ['Формат', 'По кругам', 'Жеребьёвка', 'Дерево', 'Таблица групп'];

export function Bracket7_3() {
  const [view, setView] = useState(VIEW73[0]);
  /* Собрана ли сетка и ушла ли судье. Пересобрать можно и после отправки —
     тем же правилом, что переброс жребия: пока судья не утвердил, работа ещё
     секретаря. Новая сборка отзывает отправленную: судья не должен утверждать
     сетку, которой уже нет. */
  const [sent, setSent] = useState(false);
  const [built, setBuilt] = useState(1);
  return (
    <WebApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Сетка"
      title="Система проведения и сетка"
      sub="Формат, жеребьёвка и сетка — собирает секретарь, утверждает главный судья"
    >
      {/* Ряда плиток-счётчиков над экраном больше нет ✳ (30.08.2026):
          «128 участников · 7 раундов · 64 матча в 1/64 · 16 сеяных» — витрина
          над рабочей частью. Участники и посев видны в самой таблице жребия,
          круги — в раскладке «По кругам», а плитки отжимали таблицу вниз.

          Панели «Вводные от судьи» больше нет ✳: формат, партии и утешительная
          сетка приходят от судьи и на них не влияют — читать их секретарю нужно
          один раз, а место они занимали наравне с самой сеткой. Решения по
          работе стоят полосой над предпросмотром: собранная сетка уходит судье,
          пересобрать можно, пока он её не утвердил. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <Pl
          t={sent ? 'У ГЛАВНОГО СУДЬИ' : built > 1 ? `ПЕРЕСОБРАНА ${built - 1} РАЗ` : 'СЕТКА СОБРАНА'}
          cls={sent ? 'reg' : 'live'}
        />
        <span className="flex items-center gap-2">
          <Button variant="outline" onPress={() => { setBuilt(built + 1); setSent(false); }}>
            <RefreshCw size={14} /> Пересобрать сетку
          </Button>
          {!sent && (
            <Button variant="primary" onPress={() => setSent(true)}>
              <Send size={15} /> Передать главному судье
            </Button>
          )}
        </span>
      </div>
      {sent && (
        <Bar>
          Сетка у главного судьи. Пересобрать ещё можно — пока он её не утвердил; новая сборка
          отзывает отправленную.
        </Bar>
      )}

      {/* Два формата — два взгляда: олимпийку смотрят деревом, групповой этап
          таблицами. Вкладка «Таблица групп» — для формата «группы + плей-офф»
          (TZ §5.1): пока группы не сыграны, дерево пустое. */}
      {/* Параметры проведения одним экраном ✳: формат с подсказкой системы,
          жеребьёвка и сама сетка. Жеребьёвка была отдельным пунктом меню между
          сеткой и расписанием, хотя без сетки бессмысленна — слоты жребия это и
          есть места в ней; а подсказка по системе стояла у главного судьи, хотя
          собирает по ней секретарь. */}
      <div className="mb-4">
        <FilterSeg items={VIEW73} active={view} onPick={setView} />
      </div>
      {view === VIEW73[0] ? (
        <Systems7_3 />
      ) : view === VIEW73[1] ? (
        <ByRounds7_3 />
      ) : view === VIEW73[2] ? (
        <DrawPanel />
      ) : view === VIEW73[3] ? (
        <Tree7_3 />
      ) : (
        <GroupTables7_3 />
      )}
    </WebApp>
  );
}

/** Вкладка «Дерево»: сетку рисует тот же компонент, что и на фронте, — не
    картинка и не свои прямоугольники, а настоящий холст по общей модели сетки.
    Тот же приём, что у спортсмена (Э14.5): сетка одна на всю систему, и
    секретарь собирает ровно то, что потом увидят игроки. Светлый тон — новый
    слой светлый, чёрная плоскость из него выпадала. */
const bracket7_3 = { ...makeBigBracket(5), title: 'Чемпионат Казахстана 2026 · плей-офф' };

const Tree7_3 = () => (
  <div className="relative h-110 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <div className="absolute inset-0 [&>div]:h-full!">
      <BracketFlow bracket={bracket7_3} minZoom={0.1} fitPadding={0.04} tone="light" />
    </div>
  </div>
);

/** Вкладка «Таблица групп»: формат «группы + плей-офф» — из каждой группы
    выходят двое, и до конца групп сетка плей-офф стоит без имён. */
type Grp = { nm: string; rows: string; out: string; played: number; of: number; cls: Cls };

const GROUPS7_3: Grp[] = [
  { nm: 'Группа A', rows: 'Смагулов А. · Ким Г. · Оралбек Д. · Цой А.', out: 'Смагулов А., Ким Г.', played: 6, of: 6, cls: 'live' },
  { nm: 'Группа B', rows: 'Токаев М. · Абиш Н. · Сериков Н. · Ли В.', out: 'Токаев М., Абиш Н.', played: 6, of: 6, cls: 'live' },
  { nm: 'Группа C', rows: 'Байжанов Е. · Пак С. · Мурат К. · Асан Б.', out: '—', played: 4, of: 6, cls: 'wait' },
  { nm: 'Группа D', rows: 'Гладун И. · Оспанов Т. · Бекзат Ж. · Кайрат А.', out: '—', played: 0, of: 6, cls: 'reg' },
  { nm: 'Группа E', rows: 'Досжан М. · Ерлан С. · Мұрат Е. · Нурлан К.', out: 'Досжан М., Ерлан С.', played: 6, of: 6, cls: 'live' },
  { nm: 'Группа F', rows: 'Жумабеков Р. · Абдрахманов К. · Ли С. · Тлеу А.', out: '—', played: 2, of: 6, cls: 'wait' },
];

const COLS73: { k: 'nm' | 'played' | 'out'; t: string }[] = [
  { k: 'nm', t: 'Группа и состав' },
  { k: 'played', t: 'Сыграно' },
  { k: 'out', t: 'Выходят в плей-офф' },
];

const GRP_GRID = '2.3fr 0.8fr 1.5fr 110px';

/** Тем же приёмом, что состав участников у спортсмена (Э14.5): поиск и
    сортировка по столбцу. Строками это не работает — групп тридцать две, и
    секретарь ищет либо конкретную группу, либо те, что ещё не доиграли. */
const GroupTables7_3 = ({ phone }: { phone?: boolean }) => {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS73)[number]['k']; up: boolean }>({ k: 'nm', up: true });

  const found = GROUPS7_3.filter((g) => {
    const t = q.trim().toLowerCase();
    return !t || g.nm.toLowerCase().includes(t) || g.rows.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const v = sort.k === 'played' ? a.played - b.played : String(a[sort.k]).localeCompare(String(b[sort.k]), 'ru');
    return sort.up ? v : -v;
  });

  return (
    <>
      {/* Пояснения «32 группы по 4, выходят двое» нет ✳: сколько выходит, видно
          в столбце, а сколько сыграно — в соседнем. */}
      <div className={phone ? 'mb-3 flex flex-col gap-2' : 'mb-3 flex items-center justify-between gap-4'}>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Группа или фамилия"
          className={phone ? 'w-full' : 'w-80'}
        />
        <span className="text-[12.5px] text-neutral-500">
          {rows.length === GROUPS7_3.length
            ? `${GROUPS7_3.length} групп`
            : `найдено ${rows.length} из ${GROUPS7_3.length}`}
        </span>
      </div>

      {/* На телефоне группы идут строками ✳: четыре колонки (состав, сыграно,
          кто выходит, состояние) в 392 px превращаются в четыре обрубка —
          состав группы читается только целиком. */}
      {phone ? (
        <Rows>
          {rows.map((g) => (
            <Row
              key={g.nm}
              nm={g.nm}
              sub={`${g.rows} · выходят: ${g.out}`}
              val={`${g.played} из ${g.of}`}
              pill={{
                t: g.cls === 'live' ? 'СЫГРАНА' : g.cls === 'wait' ? 'ИДЁТ' : 'НЕ НАЧАТА',
                cls: g.cls,
              }}
            />
          ))}
          {rows.length === 0 && <NoRows>По запросу «{q}» ничего нет — проверьте написание.</NoRows>}
        </Rows>
      ) : (
        <Sheet
          grid={GRP_GRID}
          cols={[
            ...COLS73.map((c) => (
              <Th
                key={c.k}
                t={c.t}
                on={sort.k === c.k}
                onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
              />
            )),
            <span key="st">Состояние</span>,
          ]}
        >
          {rows.map((g) => (
            <div
              key={g.nm}
              className="grid items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-neutral-50"
              style={{ gridTemplateColumns: GRP_GRID }}
            >
              <span className="min-w-0 leading-tight">
                <span className="block text-[13.5px] font-medium">{g.nm}</span>
                <span className="block truncate text-xs text-neutral-500">{g.rows}</span>
              </span>
              <span className="tabular-nums text-neutral-600">{g.played} из {g.of}</span>
              <span className="text-neutral-600">{g.out}</span>
              <Pl
                t={g.cls === 'live' ? 'СЫГРАНА' : g.cls === 'wait' ? 'ИДЁТ' : 'НЕ НАЧАТА'}
                cls={g.cls}
              />
            </div>
          ))}
          {rows.length === 0 && (
            <NoRows>По запросу «{q}» ничего нет — проверьте написание.</NoRows>
          )}
        </Sheet>
      )}
    </>
  );
};

/** Круги сетки на 32 участника: от 1/16 к финалу. */
const RD7_3 = ['1/16', '1/8', '1/4', '1/2', 'Финал'];

/** Сетка списком: пары по кругам и счёт справа.

    Холст `BracketFlow` в 392 px нечитаем — вписанное в такую ширину дерево из
    31 матча превращается в узор. Список собран из той же модели сетки
    (`bracket7_3`), что и дерево на десктопе: секретарь на телефоне видит ровно
    то, что собрал, только в один столбец. */
const BracketList7_3 = () => (
  <>
    {RD7_3.map((rd, r) => {
      const ms = bracket7_3.matches.filter((m) => m.round === r);
      const shown = ms.slice(0, 4);
      return (
        <Panel
          key={rd}
          title={rd}
          extra={<span className="text-xs text-neutral-500">матчей: {ms.length}</span>}
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

/** Э7.3 на телефоне: те же пять срезов работы над системой проведения.
    Полоса срезов уезжает вбок, решения по работе идут кнопками одна под другой,
    а дерево сетки заменено списком по кругам. */
export function Bracket7_3Phone() {
  const [view, setView] = useState(VIEW73[0]);
  const [sent, setSent] = useState(false);
  const [built, setBuilt] = useState(1);
  return (
    <PhoneRoleApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Сетка"
      title="Система проведения и сетка"
      sub="Собирает секретарь, утверждает главный судья"
    >
      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <Pl
          t={sent ? 'У ГЛАВНОГО СУДЬИ' : built > 1 ? `ПЕРЕСОБРАНА ${built - 1} РАЗ` : 'СЕТКА СОБРАНА'}
          cls={sent ? 'reg' : 'live'}
        />
        {!sent && (
          <Button variant="primary" onPress={() => setSent(true)}>
            <Send size={15} /> Передать главному судье
          </Button>
        )}
        <Button variant="outline" onPress={() => { setBuilt(built + 1); setSent(false); }}>
          <RefreshCw size={14} /> Пересобрать сетку
        </Button>
      </div>
      {sent && (
        <Bar>
          Сетка у главного судьи. Пересобрать ещё можно — пока он её не утвердил; новая сборка
          отзывает отправленную.
        </Bar>
      )}

      <Strip>
        <FilterSeg items={VIEW73} active={view} onPick={setView} />
      </Strip>

      {view === VIEW73[0] ? (
        <Systems7_3 />
      ) : view === VIEW73[1] ? (
        <ByRounds7_3 />
      ) : view === VIEW73[2] ? (
        <DrawPanel phone />
      ) : view === VIEW73[3] ? (
        <BracketList7_3 />
      ) : (
        <GroupTables7_3 phone />
      )}
    </PhoneRoleApp>
  );
}

/* ── Э7.4 · Расписание: время × стол, конфликты подсвечены ──────── */

/** Матч в расписании: когда, на каком столе, кто играет и какой круг.

    Раньше расписание было раскладкой столов плитками: двадцать квадратов, в
    каждом время и пара. Найти в них «что идёт в 11:00» или «когда играет
    Смагулов» можно было только глазами по всей сетке. Расписание читают по
    времени — временем оно и выстроено. */
type Mch = {
  id: string;
  /** День турнира: 1–3. */
  day: number;
  time: string;
  table: number;
  pair: string;
  round: string;
  /** Тот же игрок в это же время на другом столе. */
  clash?: boolean;
};

const MATCHES: Mch[] = [
  { id: 'm1', day: 1, time: '10:00', table: 1, pair: 'Смагулов — Цой', round: '1/16' },
  { id: 'm2', day: 1, time: '10:00', table: 2, pair: 'Ким — Сериков', round: '1/16' },
  { id: 'm3', day: 1, time: '10:00', table: 3, pair: 'Токаев — Гладун', round: '1/16' },
  { id: 'm4', day: 1, time: '10:30', table: 6, pair: 'Жумабеков — Цой', round: '1/16' },
  { id: 'm5', day: 1, time: '10:30', table: 7, pair: 'Пак — Мұрат', round: '1/16' },
  { id: 'm6', day: 1, time: '10:30', table: 8, pair: 'Байжанов — Ким', round: '1/16' },
  { id: 'm7', day: 1, time: '11:00', table: 4, pair: 'Смагулов — Пак', round: '1/8', clash: true },
  /* Второй матч конфликтной пары — тоже одиночный: турнир по решению судьи
     одиночный, парному разряду взяться неоткуда. Соперник — не Досжан: тот в
     11:00 уже играет (m9), и вышел бы второй, непомеченный конфликт. */
  { id: 'm8', day: 1, time: '11:00', table: 12, pair: 'Смагулов — Сериков', round: '1/8', clash: true },
  { id: 'm9', day: 1, time: '11:00', table: 9, pair: 'Токаев — Досжан', round: '1/8' },
  { id: 'm10', day: 2, time: '10:00', table: 1, pair: 'Смагулов — Токаев', round: '1/4' },
  { id: 'm11', day: 2, time: '10:00', table: 2, pair: 'Ким — Пак', round: '1/4' },
  { id: 'm12', day: 2, time: '12:00', table: 1, pair: 'Победитель 1/4 — победитель 1/4', round: '1/2' },
  { id: 'm13', day: 3, time: '11:00', table: 1, pair: 'Финал', round: 'финал' },
  { id: 'm14', day: 3, time: '11:00', table: 2, pair: 'Матч за 3-е место', round: 'за 3-е место' },
];

/** Как смотрят расписание: одним днём или всеми сразу. Турнир идёт три дня
    подряд, и недели в нём не считают — срез «по неделям» отвечал бы на вопрос,
    которого здесь никто не задаёт. */
const VIEW74 = ['По дням', 'Все дни'];
const DAYS74 = ['День 1 · 18.05', 'День 2 · 19.05', 'День 3 · 20.05'];

const SCHED_GRID = '120px 80px 1.7fr 1fr 130px';

/** Тело экрана расписания: одно на оба формата — вся работа (перенос матча,
    отзыв отправленного) считается здесь, и второй копии логики быть не должно.
    `phone` меняет только раскладку: таблица становится строками, фильтры и
    решения — столбиком. */
const Sched7_4Body = ({ phone }: { phone?: boolean }) => {
  const [view, setView] = useState(VIEW74[0]);
  const [pick, setPick] = useState(DAYS74[0]);
  /* Перенесённые матчи: id → новое время. Перенос снимает конфликт — ради
     этого его и делают. */
  const [moved, setMoved] = useState<Record<string, string>>({});
  /* Расписание ушло судье на проверку. Переносить после этого можно — работа
     остаётся секретаря, пока судья не проверил; перенос отзывает отправленное,
     как пересборка сетки и переброс жребия. */
  const [sent, setSent] = useState(false);

  const timeOf = (m: Mch) => moved[m.id] ?? m.time;
  /* Конфликт считается, а не хранится: перенесли один из двух матчей — и его
     больше нет. Иначе пометка осталась бы висеть на разведённых парах. */
  const clash = (m: Mch) => {
    if (!m.clash) return false;
    const other = MATCHES.find((x) => x.id !== m.id && x.clash && x.day === m.day);
    return Boolean(other && timeOf(other) === timeOf(m));
  };

  const inView = (m: Mch) => (view === VIEW74[1] ? true : DAYS74[m.day - 1] === pick);
  const rows = MATCHES.filter(inView).sort((a, b) =>
    a.day - b.day || timeOf(a).localeCompare(timeOf(b)) || a.table - b.table);
  const clashes = MATCHES.filter(clash);

  /* Матч строкой реестра: время и стол — в имени, круг и состояние — подписью.
     Те же пять величин, что в колонках таблицы, только сверху вниз. */
  const phoneRow = (m: Mch) => (
    <Row
      key={m.id}
      nm={`${timeOf(m)} · стол ${m.table}`}
      sub={`${m.pair} · ${m.round}${view === VIEW74[1] ? ` · день ${m.day}` : ''}${moved[m.id] ? ` · перенесён с ${m.time}` : ''}`}
      pill={clash(m) ? { t: 'КОНФЛИКТ', cls: 'bad' } : undefined}
    />
  );

  return (
    <>
      {/* Ряда плиток-счётчиков над расписанием больше нет ✳ (30.08.2026):
          «3 игровых дня · 20 столов · 14 матчей · N конфликта» — витрина над
          рабочей частью. Дни выбираются фильтром ниже, матчи стоят строками
          таблицы, а конфликты разбираются списком под ней: каждый счётчик
          отвечал на вопрос, ответ на который лежал рядом.

          Сначала как смотрим, потом — что именно. У длинного турнира дни в
          неделю не укладываются, у короткого недель нет вовсе; поэтому срез
          выбирается первым, а список под ним меняется. */}
      {phone ? (
        <>
          <Strip>
            <FilterSeg items={VIEW74} active={view} onPick={(v) => { setView(v); setPick(DAYS74[0]); }} />
          </Strip>
          {view !== VIEW74[1] && (
            <Strip>
              <FilterSeg items={DAYS74} active={pick} onPick={setPick} />
            </Strip>
          )}
        </>
      ) : (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <FilterSeg items={VIEW74} active={view} onPick={(v) => { setView(v); setPick(DAYS74[0]); }} />
          {view !== VIEW74[1] && <FilterSeg items={DAYS74} active={pick} onPick={setPick} />}
        </div>
      )}

      {phone ? (
        <Rows>
          {rows.map(phoneRow)}
          {rows.length === 0 && <NoRows>В этом срезе матчей нет.</NoRows>}
        </Rows>
      ) : (
        <Sheet
          grid={SCHED_GRID}
          cols={[
            <span key="t">Время</span>,
            <span key="s">Стол</span>,
            <span key="m">Матч</span>,
            <span key="r">Круг</span>,
            <span key="st">Состояние</span>,
          ]}
        >
          {rows.map((m) => (
            <div
              key={m.id}
              className={
                'grid items-center gap-3 px-4 py-2.5 text-[13px] ' +
                (clash(m) ? 'bg-red-50/60' : 'hover:bg-neutral-50')
              }
              style={{ gridTemplateColumns: SCHED_GRID }}
            >
              <span className="leading-tight">
                <b className="tabular-nums">{timeOf(m)}</b>
                {/* День — только в срезе «Все дни»: в срезе «По дням» он выбран
                    фильтром, и подпись была бы его дублем. */}
                {view === VIEW74[1] && (
                  <span className="block text-[11px] text-neutral-400">день {m.day}</span>
                )}
              </span>
              <span className="text-neutral-600">стол {m.table}</span>
              <span className="font-medium">{m.pair}</span>
              <span className="text-neutral-600">{m.round}</span>
              {/* Состояние матча, а не дубль фильтра: запланирован, перенесён
                  (откуда — тут же) или конфликт. */}
              <span>
                {clash(m)
                  ? <Pl t="КОНФЛИКТ" cls="bad" />
                  : (
                    <span className="text-[12.5px] text-neutral-500">
                      {moved[m.id] ? `перенесён с ${m.time}` : 'запланирован'}
                    </span>
                  )}
              </span>
            </div>
          ))}
          {rows.length === 0 && <NoRows>В этом срезе матчей нет.</NoRows>}
        </Sheet>
      )}

      {/* Конфликты — отдельным списком под расписанием: в таблице они помечены,
          но разбирают их подряд, а не выискивая красные строки. */}
      {/* Столбиком на телефоне: кнопка растягивается сама (`items-stretch`), и
          главное действие занимает строку кадра. */}
      <div className={phone ? 'mb-3 mt-4 flex flex-col gap-2' : 'mb-3 mt-4 flex items-center justify-end gap-4'}>
        {sent ? (
          <Pl t="ОТПРАВЛЕНО ГЛАВНОМУ СУДЬЕ" cls="live" />
        ) : (
          <Button variant="outline" onPress={() => setSent(true)}>
            <Send size={15} /> Передать главному судье на проверку
          </Button>
        )}
      </div>
      {clashes.length > 0 ? (
        <Rows>
          {clashes.map((m) => (
            <Row
              key={m.id}
              av={A(32)}
              nm={`${m.pair} · ${timeOf(m)}`}
              sub={`стол ${m.table} · ${m.round} — тот же игрок занят в это же время на другом столе`}
              pill={{ t: 'КОНФЛИКТ', cls: 'bad' }}
              action="Перенести на 12:00"
              onAction={() => { setMoved({ ...moved, [m.id]: '12:00' }); setSent(false); }}
            />
          ))}
        </Rows>
      ) : (
        <Bar tone="success">
          Конфликтов нет: ни один игрок не стоит на двух столах в одно время.
        </Bar>
      )}
    </>
  );
};

export function Schedule7_4() {
  return (
    <WebApp role={at('СИСТЕМА ПРОВЕДЕНИЯ')} nav="Расписание" title="Расписание">
      <Sched7_4Body />
    </WebApp>
  );
}

/** Э7.4 на телефоне: то же расписание строками.
    Таблица «время · стол · матч · круг · состояние» в 392 px в пять колонок не
    ложится — время со столом стоят именем строки, пара с кругом подписью, а
    конфликт остаётся значком: по нему строку и находят. Разбор конфликтов
    (перенос на 12:00) работает так же, как на десктопе, — логика у экрана одна. */
export function Schedule7_4Phone() {
  return (
    <PhoneRoleApp
      role={at('СИСТЕМА ПРОВЕДЕНИЯ')}
      nav="Расписание"
      title="Расписание"
      sub="127 матчей по трём игровым дням"
    >
      <Sched7_4Body phone />
    </PhoneRoleApp>
  );
}

/* ── Э7.5 · Протоколы: секретарь оформляет, отправляет судья ─────── */

type Res = { pl: number; av: string; nm: string; club: string; sc: string };

const RESULTS: Res[] = [
  { pl: 1, av: A(32), nm: 'Смагулов Алан', club: 'Алатау · Алматы', sc: 'финал 4:2' },
  { pl: 2, av: A(44), nm: 'Ким Георгий', club: 'СКА · Астана', sc: 'финал 2:4' },
  { pl: 3, av: A(51), nm: 'Токаев Марат', club: 'Шымкент', sc: '1/2 · 3:4' },
  { pl: 4, av: A(13), nm: 'Пак Сергей', club: 'Иртыш · Павлодар', sc: '1/2 · 2:4' },
  { pl: 5, av: A(22), nm: 'Жумабеков Расул', club: 'Шахтёр · Караганда', sc: '1/4 · 1:4' },
];

/** Протокол отдельного матча — из чего собралась таблица мест. */
type Mp = { nm: string; sub: string; sc: string; tag: string; cls: Cls };

const MATCH_PROTOCOLS: Mp[] = [
  { nm: 'Финал · Смагулов А. — Ким Г.', sub: '20.05, 17:20 · стол 1 · судья Пак С.', sc: '4 : 2', tag: 'ПОДТВЕРЖДЁН', cls: 'live' },
  { nm: '1/2 · Ким Г. — Токаев М.', sub: '20.05, 14:00 · стол 2 · судья Ерлан Б.', sc: '4 : 3', tag: 'ПОДТВЕРЖДЁН', cls: 'live' },
  { nm: '1/2 · Смагулов А. — Пак С.', sub: '20.05, 14:00 · стол 1 · судья Ахметов К.', sc: '4 : 1', tag: 'ПОДТВЕРЖДЁН', cls: 'live' },
  { nm: '1/4 · Байжанов А. — неявка', sub: '19.05, 11:20 · стол 4', sc: '—', tag: 'ТЕХПОБЕДА', cls: 'wait' },
];

/** Два списка одного протокола: итог и то, из чего он собран. Переключаются
    полосой — тем же приёмом, что срезы на сборке сетки и в расписании. */
const LISTS75 = ['Итоговый протокол', 'Протоколы матчей'];

/** Тело экрана протоколов: одно на оба формата.
    `phone` меняет раскладку — поля формы в одну колонку, решения столбиком, —
    и то, какой список открыт первым: в зале секретарь берёт телефон ради
    результатов матчей, а не ради шапки протокола. */
const Protocols7_5Body = ({ phone }: { phone?: boolean }) => {
  /* Оформление протокола — работа секретаря, и поля здесь заполняют, а не
     читают: дату составления, место, состав бригады. Читаемые поля были
     обманом — на этом экране их и вносят.

     Кто главный судья и кто секретарь не правится: это наряд, его собирает
     председатель ГСК (Э5.2). Секретарь не назначает сам себя. */
  const [sent, setSent] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [list, setList] = useState(phone ? LISTS75[1] : LISTS75[0]);
  return (
    <>
      {/* Ряда плиток-счётчиков над протоколом больше нет ✳ (30.08.2026):
          «127 матчей сыграно · 2 техпобеды · 1 неявка · 20.05» — витрина над
          рабочей частью. Число матчей стоит значком у списка протоколов,
          техпобеда и неявка — строками в нём же, а последний игровой день
          написан подзаголовком экрана.

          Раскладка та же, что на рабочем столе (Э7.1): блоки один под другим
          во всю ширину — сначала список, под ним то, что заполняют. Список
          выбирается полосой — тем же переключателем, что «Дерево / Таблица
          групп» на сборке сетки и «По дням / Все дни» в расписании: один приём
          на всю роль. */}
      <>
        {phone ? (
          <Strip>
            <FilterSeg items={LISTS75} active={list} onPick={setList} />
          </Strip>
        ) : (
          <div className="mb-3">
            <FilterSeg items={LISTS75} active={list} onPick={setList} />
          </div>
        )}
        {list === LISTS75[0] ? (
          <Panel title="Итоговый протокол" extra={<Pl t="МЕСТА 1–5 ИЗ 128" cls="reg" />} flush>
            <div className="divide-y divide-neutral-100">
              {/* Место стоит первым в имени: «1 · Смагулов Алан» — так строка
                  читается слева направо, как в итоговой таблице на бумаге. */}
              {RESULTS.map((r) => (
                <Row key={r.pl} av={r.av} nm={`${r.pl} · ${r.nm}`} sub={r.club} val={r.sc} />
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Протоколы матчей" extra={<Pl t="127 МАТЧЕЙ" cls="reg" />} flush>
            <div className="divide-y divide-neutral-100">
              {MATCH_PROTOCOLS.map((m) => (
                <Row key={m.nm} nm={m.nm} sub={m.sub} val={m.sc} pill={{ t: m.tag, cls: m.cls }} />
              ))}
            </div>
          </Panel>
        )}

        <Panel
          title="Оформление"
          extra={<Pl t={sent ? 'У ГЛАВНОГО СУДЬИ' : 'В РАБОТЕ'} cls={sent ? 'reg' : 'wait'} />}
        >
          <FormGrid>
            {/* Дата — текстовым полем в формате ДД.ММ.ГГГГ ✳: нативный
                input[type=date] рисуется локалью браузера и в en-US показывает
                «05/20/2026» рядом с «20.05.2026» в подзаголовке. Календарь
                вернётся, когда в ките будет поле даты с прибитой ru-локалью. */}
            {/* На телефоне все поля во всю ширину: две колонки на 392 px дают
                по 170 px, и в них не помещается ни подпись, ни значение. */}
            <TextInput label="Дата составления" value="20.05.2026" wide={phone} />
            <TextInput label="Место проведения" value="Астана, ЦСКА" wide={phone} />
            {/* Наряд правится у председателя ГСК (Э5.2), а не здесь: секретарь
                не назначает ни главного судью, ни себя. */}
            <FieldView label="Главный судья" value="Оспанов Т." wide={phone} />
            <FieldView label="Главный секретарь" value="Ким Л." wide={phone} />
            <TextInput label="Состав бригады" value="14 человек · из наряда коллегии" wide />
            <AreaInput label="Примечания к протоколу" value="Техпобеда в 1/4 — неявка Байжанова А., подтверждена судьёй стола." wide />
          </FormGrid>
          {/* Кнопки — рядом, а не столбиком ✳: панель стоит во всю ширину, и
              две растянутые на весь экран кнопки читались бы как две полосы.
              На телефоне рядом их не поставить — там они идут столбиком. */}
          <div className={'mt-4 flex gap-2 ' + (phone ? 'flex-col' : 'flex-wrap items-center')}>
            {sent ? (
              <Button variant="outline" onPress={() => setSent(false)}>
                <RefreshCw size={15} /> Вернуть в работу
              </Button>
            ) : (
              <ToJudge onPress={() => setSent(true)}>Передать главному судье на утверждение</ToJudge>
            )}
            {/* Кнопка отвечает «отправлено на печать» ✳: печать — действие без
                экрана результата, и молчащая кнопка выглядела бы сломанной. */}
            <Button variant="outline" onPress={() => setPrinted(true)}>
              <Printer size={15} /> {printed ? 'Отправлено на печать' : 'Печать протоколов'}
            </Button>
          </div>
          {sent && (
            <div className="mt-3">
              <Bar>
                Протокол у главного судьи. Пока он не утвердил, работа ещё секретаря — «Вернуть в
                работу» отзывает отправленное.
              </Bar>
            </div>
          )}
        </Panel>
      </>
    </>
  );
};

export function Protocols7_5() {
  return (
    <WebApp
      role={at('ИТОГОВЫЙ ПРОТОКОЛ')}
      nav="Протоколы"
      title="Оформление протокола"
      sub="Чемпионат Казахстана 2026 · матчи сыграны 20.05.2026"
    >
      <Protocols7_5Body />
    </WebApp>
  );
}

/** Э7.5 на телефоне ✳ (30.08.2026): первым открыт список протоколов матчей.
    Секретарь достаёт телефон в зале ради результата — свериться со счётом
    матча, который только что доиграли, — а шапка протокола (дата, место, состав
    бригады) заполняется потом и стоит ниже, полем в один столбец. */
export function Protocols7_5Phone() {
  return (
    <PhoneRoleApp
      role={at('ИТОГОВЫЙ ПРОТОКОЛ')}
      nav="Протоколы"
      title="Оформление протокола"
      sub="Матчи сыграны 20.05.2026"
    >
      <Protocols7_5Body phone />
    </PhoneRoleApp>
  );
}

const Protocols7_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Протокол возвращён коллегией"
      text="Секретарь видит причину и правит оформление; исправление результатов — не его право."
      wide
    >
      <Frag>
        <Rows>
          {/* Тот же турнир, что и на всём борде роли (scope «один турнир»):
              чужая запись в кадре читалась бы как другой турнир. Причина —
              про оформление: парного разряда в одиночном турнире нет. */}
          <Row
            nm="Чемпионат Казахстана 2026"
            sub="вернул Мукашев Б., 21.05 · «в составе бригады не указаны судьи столов»"
            pill={{ t: 'ВОЗВРАЩЁН', cls: 'bad' }}
          />
        </Rows>
        <div className="mt-3">
          <Bar>Правится оформление протокола. Счёт и результаты меняет главный судья.</Bar>
        </div>
      </Frag>
    </Shot>
  </States>
);

/* ── Борд роли: экраны маршрута подряд ──────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
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
    view: () => (
      <>
        <SignUpJudge0_7 />
        <SignUpJudge0_7States />
      </>
    ),
    next: 'вход под своей ролью',
  },
  'Э7.1': {
    cap: 'Рабочий стол секретаря',
    view: () => (
      <>
        <Desk7_1 />
        <Desk7_1States />
      </>
    ),
    alt: () => <Desk7_1Phone />,
    next: 'работа «Сетка»',
  },
  'Э7.3': {
    cap: 'Система проведения и сетка',
    view: () => <Bracket7_3 />,
    alt: () => <Bracket7_3Phone />,
    next: 'работа «Расписание»',
  },
  'Э7.4': {
    cap: 'Расписание',
    view: () => <Schedule7_4 />,
    alt: () => <Schedule7_4Phone />,
    next: 'матчи сыграны',
  },
  'Э7.5': {
    cap: 'Протоколы',
    view: () => (
      <>
        <Protocols7_5 />
        <Protocols7_5States />
      </>
    ),
    alt: () => <Protocols7_5Phone />,
  },
};

export function Role07Board() {
  return <Board role={R07} screens={SCREENS} />;
}
