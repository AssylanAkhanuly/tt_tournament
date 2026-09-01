/* Роль 11 · Главный тренер национальной команды — макеты по флоу на новом
   слое (HeroUI) ✳ (30.08.2026). Содержание, коды экранов и переходы — прежние
   (см. `flows/11-glavnyy-trener-sbornoy.md`); меняется подача: оболочка WebApp
   и доменные компоненты `kit/hero/app` вместо старого макетного слоя.

   ⚠ Вся роль — рабочая гипотеза: функционал в документе федерации не заполнен
   (вопрос 12.1), международных стартов в календаре нет. Рисуем минимальный
   наблюдательный кабинет: смотреть, сравнивать, выгружать. Данных роль не
   меняет — единственная «запись» на экранах — личная звёздочка кандидата, она
   живёт в списке тренера и на реестр не влияет. */

import { Fragment, useState, type ReactNode } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpDown, ArrowUpRight, BarChart3, CalendarDays, ClipboardCheck,
  Download, Eye, FileText, Plane, Plus, Star, User, Users, Users2,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import { A, AW } from '../fedCommon';
import {
  Bar,
  Bars,
  ChartRow,
  DataTable,
  Donut,
  EventTimeline,
  Facts,
  FilterBar,
  FilterSeg,
  KV,
  PageTabs,
  Panel,
  PhoneRoleApp,
  Pill,
  Row,
  Rows,
  ScreenScope,
  SearchInput,
  Separator,
  Sheet,
  StatTiles,
  WebApp,
  type RoleUI,
} from '@/shared/kit/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* График — настоящий Chart.js, как у спортсмена (роль 14): нарисованная ломаная
   не ответила бы, что было в январе. Цвета — токенами через getComputedStyle. */
import { ChartBox, soft, token } from '@/shared/kit/chart';
import { Login0_1, LoginPhone0_1 } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    `badge: false` — роль вне конкретного турнира, значка состояния в шапке нет. */
const R: RoleUI = {
  num: '11',
  title: 'Главный тренер национальной команды',
  person: { nm: 'Ахметов С.', rl: 'Главный тренер сборной', av: A(52) },
  brandName: 'Национальная команда РК',
  brandSub: 'Состав · подготовка · командирование',
  badge: false,
  /* Меню выросло с трёх пунктов до пяти ✳ (31.08.2026, дополнения федерации):
     к наблюдательному кабинету (кандидаты, карточка, сравнение) добавились
     состав сборной, календарь подготовки и рапорты. «Карточка» и «Сравнение»
     остались пунктами: это не разделы, а экраны, куда приходят из списка, но
     подсветку сайдбара им сохраняем — иначе экран выглядит пришедшим ниоткуда. */
  nav: [
    [<Users2 size={16} key="t" />, 'Состав сборной'],
    [<CalendarDays size={16} key="p" />, 'Календарь подготовки'],
    [<Plane size={16} key="r" />, 'Рапорты'],
    [<Users size={16} key="c" />, 'Кандидаты'],
    [<User size={16} key="k" />, 'Карточка'],
    [<BarChart3 size={16} key="s" />, 'Сравнение'],
  ],
  roles: ['Главный тренер национальной команды', { t: 'Судья · вне турнира', to: 'Э0.8' }],
};

/* ── Данные экранов ──────────────────────────────────────────────── */

/** Кандидат в списке отбора. Поля разложены (год, регион, клуб), а не склеены
    в подпись: по ним фильтруют и сортируют — из строки текста это не сделать. */
type Cand = {
  pl: number;
  av: string;
  nm: string;
  born: number;
  region: string;
  club: string;
  grade: string;
  /** Последние главные старты сезона: турнир → место. */
  res: [string, string][];
  r: number;
  d: number;
};

const CANDS: Cand[] = [
  {
    pl: 1, av: A(44), nm: 'Ким Георгий', born: 2003, region: 'Астана', club: 'клуб «СКА»',
    grade: 'мастер спорта РК', res: [['ЧК', '1'], ['Кубок', '2'], ['Спарт.', '1']], r: 2456, d: 38,
  },
  {
    pl: 2, av: A(32), nm: 'Смагулов Алан', born: 2004, region: 'Алматы', club: 'клуб «Алатау»',
    grade: 'мастер спорта РК', res: [['ЧК', '2'], ['Кубок', '1'], ['Спарт.', '4']], r: 2411, d: 52,
  },
  {
    pl: 3, av: A(51), nm: 'Токаев Марат', born: 2002, region: 'Астана', club: 'клуб «Барыс»',
    grade: 'мастер спорта РК', res: [['ЧК', '4'], ['Кубок', '3'], ['Спарт.', '2']], r: 2388, d: -14,
  },
  {
    pl: 4, av: A(22), nm: 'Жумабеков Расул', born: 2007, region: 'Караганда', club: 'клуб «Шахтёр»',
    grade: 'КМС', res: [['ЧК', '8'], ['Кубок', '4'], ['Спарт.', '3']], r: 2295, d: 96,
  },
  {
    pl: 5, av: A(85), nm: 'Байжанов Арман', born: 2005, region: 'Актобе', club: 'клуб «Актобе»',
    grade: 'КМС', res: [['ЧК', '8'], ['Кубок', '8'], ['Спарт.', '5']], r: 2270, d: 11,
  },
  {
    pl: 6, av: A(93), nm: 'Мұрат Ерасыл', born: 2008, region: 'Шымкент', club: 'клуб «Достык»',
    grade: 'КМС', res: [['ЧК', '8'], ['Кубок', '4'], ['Спарт.', '3']], r: 2244, d: 130,
  },
  {
    pl: 7, av: A(56), nm: 'Гладун Игорь', born: 2001, region: 'Тараз', club: 'без клуба',
    grade: 'мастер спорта РК', res: [['ЧК', '16'], ['Кубок', '8'], ['Спарт.', '6']], r: 2210, d: -27,
  },
];

const subOf = (c: Cand) => `${c.born} г.р. · ${c.region} · ${c.club} · ${c.grade}`;
/** Дельта с типографским минусом: «-14» из числа выглядит дефисом. */
const fmtD = (d: number) => (d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '0');

/** Число в русском формате: разряды пробелом («2 460», а не английское
    «2,460»). Считаем сами, а не `toLocaleString`: разделитель не должен
    зависеть от локали браузера, в котором открыт Storybook, а пробел здесь —
    обычный, тот же, что в «5 210 спортсменов» на полке состояний Э11.1. */
const fmtN = (n: number) => {
  const [int, frac] = String(n).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+$)/g, ' ');
  return frac ? `${grouped},${frac}` : grouped;
};

/* История рейтинга Кима Г. по месяцам сезона: 2418 (август) → 2456 (март),
   +38 за сезон — то же число, что в списке и в сравнении: числа на разных
   экранах обязаны сходиться. */
const RATING: { m: string; r: number }[] = [
  { m: 'авг', r: 2418 }, { m: 'сен', r: 2410 }, { m: 'окт', r: 2426 }, { m: 'ноя', r: 2431 },
  { m: 'дек', r: 2422 }, { m: 'янв', r: 2440 }, { m: 'фев', r: 2449 }, { m: 'мар', r: 2456 },
];

const MATCHES: { st: 'win' | 'loss'; nm: string; sub: string; sc: string; dt: string }[] = [
  { st: 'win', nm: 'Ким Г. — Токаев М.', sub: 'Чемпионат Казахстана 2026 · 1/4 финала', sc: '4:2', dt: '14.03' },
  { st: 'win', nm: 'Ким Г. — Байжанов А.', sub: 'Чемпионат Казахстана 2026 · 1/8 финала', sc: '4:0', dt: '13.03' },
  { st: 'loss', nm: 'Ким Г. — Смагулов А.', sub: 'Кубок Казахстана 2026 · финал', sc: '2:4', dt: '22.02' },
  { st: 'win', nm: 'Ким Г. — Жумабеков Р.', sub: 'Кубок Казахстана 2026 · 1/2 финала', sc: '4:3', dt: '21.02' },
  { st: 'win', nm: 'Ким Г. — Гладун И.', sub: 'Спартакиада РК 2026 · финал', sc: '4:1', dt: '26.01' },
  { st: 'win', nm: 'Ким Г. — Мұрат Е.', sub: 'Спартакиада РК 2026 · 1/2 финала', sc: '4:2', dt: '25.01' },
];

const H2H: [string, string, string][] = [
  ['Смагулов Алан', '5 : 4', 'последняя 22.02.2026 · 2:4'],
  ['Токаев Марат', '7 : 2', 'последняя 14.03.2026 · 4:2'],
  ['Жумабеков Расул', '3 : 1', 'последняя 21.02.2026 · 4:3'],
  ['Мұрат Ерасыл', '2 : 0', 'последняя 25.01.2026 · 4:2'],
];

/** Главные старты Кима по сезонам — зона «участие в главных стартах». */
const SEASONS: { y: string; ch: string; cup: string; sp: string }[] = [
  { y: '2026', ch: '1 место', cup: '2 место', sp: '1 место' },
  { y: '2025', ch: '3 место', cup: '1 место', sp: '—' },
  { y: '2024', ch: '6 место', cup: '—', sp: '—' },
];

/* Трое отмеченных — колонки сравнения Э11.3 и стартовый «мой список» Э11.1.
   Один источник: кто со звёздочкой, того и сравниваем. */
const THREE = [CANDS[0], CANDS[1], CANDS[5]];

const CMP: [string, string, string, string][] = [
  ['Регион и клуб', 'Астана · «СКА»', 'Алматы · «Алатау»', 'Шымкент · «Достык»'],
  ['Возраст', '22 года (2003 г.р.)', '21 год (2004 г.р.)', '17 лет (2008 г.р.)'],
  ['Место в рейтинге', '1', '2', '6'],
  ['Рейтинг на 14.03.2026', '2456', '2411', '2244'],
  ['Чемпионат РК 2026', '1 место', '2 место', '1/8 финала'],
  ['Кубок РК 2026', '2 место', '1 место', '1/4 финала'],
  ['Спартакиада РК 2026', '1 место', '4 место', '3 место'],
  ['Матчей за сезон', '46 · побед 38', '44 · побед 35', '39 · побед 30'],
];

const CMP_H2H: [string, string, string] = [
  'со Смагуловым 5 : 4\nс Мұратом 2 : 0',
  'с Кимом 4 : 5\nс Мұратом 1 : 1',
  'с Кимом 0 : 2\nсо Смагуловым 1 : 1',
];

/* ── Мелочи, общие для экранов роли ─────────────────────────────── */

/** Значок «только чтение»: в матрице прав у роли проставлено чтение — это
    допущение (⚠ 12.1), и на каждой панели оно сказано явно. */
const ReadOnly = () => (
  <span className="flex items-center gap-1 whitespace-nowrap rounded-md bg-neutral-100 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-neutral-500">
    <Eye size={11} /> ТОЛЬКО ЧТЕНИЕ
  </span>
);


/** Заголовок сортируемого столбца (⚠ дупликация из role05). */
const Th = ({ t, on, onClick }: { t: string; on: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={'flex items-center gap-1 text-left uppercase ' + (on ? 'text-neutral-700' : 'hover:text-neutral-600')}
  >
    {t}
    {on && <ArrowUpDown size={11} />}
  </button>
);

/** Человек в строке таблицы: фото и две строки; `to` — переход в карточку
    (⚠ дупликация из role05). */
const Who = ({ av, nm, sub, to }: { av: string; nm: string; sub?: ReactNode; to?: string }) => {
  const inner = (
    <>
      <Avatar size="sm">
        <Avatar.Image alt={nm} src={av} />
        <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
      </Avatar>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[13.5px] font-medium">{nm}</span>
        {sub && <span className="block truncate text-xs text-neutral-500">{sub}</span>}
      </span>
    </>
  );
  return to ? (
    <button type="button" data-to={to} className="flex min-w-0 items-center gap-2.5 text-left">{inner}</button>
  ) : (
    <span className="flex min-w-0 items-center gap-2.5">{inner}</span>
  );
};

/** Кадр состояния: фрагмент экрана в скоупе нового слоя — без обёртки фрагмент
    на полке States остаётся без стилей HeroUI (⚠ дупликация из role05). */
const Frag = ({ w = 560, children }: { w?: number; children: ReactNode }) => (
  <ScreenScope>
    <div style={{ width: w }}>{children}</div>
  </ScreenScope>
);

/** Дельта рейтинга со стрелкой: рост зелёный, падение красное — динамика
    считывается раньше числа. */
const Delta = ({ d }: { d: number }) => (
  <span
    className={
      'flex items-center justify-end gap-0.5 font-semibold tabular-nums ' +
      (d >= 0 ? 'text-green-700' : 'text-red-600')
    }
  >
    {d >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
    {fmtD(d)}
  </span>
);

/* ── Э11.1 · Кандидаты в сборную ─────────────────────────────────── */

const REGIONS11 = ['Все регионы', 'Астана', 'Алматы'];
const AGES11 = ['Взрослые', 'До 19 лет', 'До 15 лет'];
const CAND_GRID = '36px 1.9fr 1.1fr 76px 90px 36px';

/** Кто остаётся в списке после фильтров. Выборка одна на оба формата: если бы
    десктоп и телефон считали её каждый по-своему, по одним и тем же фильтрам они
    показали бы разных кандидатов. */
const filterCands = (sex: string, age: string, region: string) =>
  CANDS.filter((c) => {
    /* Женского списка в рабочей гипотезе нет: фильтр честно показывает пусто,
       а не делает вид, что переключился. */
    if (sex === 'Женщины') return false;
    const byAge = age === AGES11[0] ? true : age === AGES11[1] ? c.born >= 2007 : c.born >= 2011;
    return byAge && (region === REGIONS11[0] || c.region === region);
  });

/** Охват списка — открытый вопрос из флоу, и он сказан на самом экране (в обоих
    форматах одним текстом: два пересказа одного допущения разъедутся). */
const SCOPE_WARN11 = (
  <>
    ⚠ Видит ли роль всех спортсменов страны или только кандидатский список — не решено
    (вопрос 12.1). Пока показываем всех, как чтение реестра; данных экран не меняет.
  </>
);

type SortKey = 'pl' | 'nm' | 'r' | 'd';
const COLS11: { k: SortKey; t: string }[] = [
  { k: 'pl', t: '№' },
  { k: 'nm', t: 'Спортсмен' },
];
const COLS11R: { k: SortKey; t: string }[] = [
  { k: 'r', t: 'Рейтинг' },
  { k: 'd', t: 'Динамика' },
];

/** Список отбора: фильтры и сортировка рабочие — отбор кандидатов и есть работа
    роли, и список под руками сужается сразу. Звёздочка — личная пометка «в мой
    список», данных федерации она не меняет; «Сравнить» оживает, когда отмечены
    двое-трое. Проп `variant` старой адаптивной рамки сохранён ради истории
    «Адаптив»: у нового слоя своей планшетной рамки веба пока нет. */
export function Cands11_1(_props: { variant?: 'desktop' | 'land' } = {}) {
  const [sex, setSex] = useState('Мужчины');
  const [age, setAge] = useState(AGES11[0]);
  const [region, setRegion] = useState(REGIONS11[0]);
  const [period, setPeriod] = useState('Сезон 2026');
  const [sort, setSort] = useState<{ k: SortKey; up: boolean }>({ k: 'pl', up: true });
  /* Мой список — те же трое, что в колонках Э11.3: пометка и сравнение — одно
     множество, второму счётчику разъезжаться не с чем. */
  const [stars, setStars] = useState<ReadonlySet<string>>(new Set(THREE.map((c) => c.nm)));
  const toggle = (nm: string) => {
    const next = new Set(stars);
    if (!next.delete(nm)) next.add(nm);
    setStars(next);
  };

  const found = filterCands(sex, age, region);
  const rows = [...found].sort((a, b) => {
    const x = sort.k === 'nm' ? a.nm.localeCompare(b.nm, 'ru') : a[sort.k] - b[sort.k];
    return sort.up ? x : -x;
  });
  const canCmp = stars.size >= 2 && stars.size <= 3;

  return (
    <WebApp
      role={R}
      nav="Кандидаты"
      title="Кандидаты в сборную"
      sub="Реестр спортсменов · рейтинг и динамика за сезон 2026"
    >
      {/* Плиток-счётчиков над таблицей больше нет ✳ (30.08.2026): экран — реестр
          кандидатов, и витрина «214 в отборе · 8 стартов» отодвигала работу вниз,
          ничего не решая. Сколько отмечено — написано на самой кнопке «Сравнить
          отмеченных», сколько строк на экране — в строке под фильтрами. В данных
          роли зоны счётчиков и нет: там фильтры, таблица и охват списка. */}

      {/* Фильтры из флоу: пол · возрастная группа · регион · период. */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterSeg items={['Мужчины', 'Женщины']} active={sex} onPick={setSex} />
        <FilterSeg items={AGES11} active={age} onPick={setAge} />
        <FilterSeg items={REGIONS11} active={region} onPick={setRegion} />
        <FilterSeg items={['Сезон 2026', 'Год']} active={period} onPick={setPeriod} />
      </div>

      {/* Счётчик говорит, по чему список сужен; справа — оба действия роли.
          «Сравнить» — главный акцент экрана, и он же объясняет звёздочки. */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-neutral-500">
          {rows.length} из {CANDS.length} на экране · {sex.toLowerCase()}, {age.toLowerCase()},{' '}
          {region.toLowerCase()} · период: {period.toLowerCase()}
        </span>
        <span className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Download size={14} /> Выгрузить список
          </Button>
          <Button size="sm" variant="primary" data-to="Э11.3" isDisabled={!canCmp}>
            Сравнить отмеченных ({stars.size})
          </Button>
        </span>
      </div>

      <Sheet
        grid={CAND_GRID}
        cols={[
          ...COLS11.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : c.k !== 'r' && c.k !== 'd' })}
            />
          )),
          <span key="res">Главные старты</span>,
          ...COLS11R.map((c) => (
            <Th
              key={c.k}
              t={c.t}
              on={sort.k === c.k}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : false })}
            />
          )),
          <span key="star" />,
        ]}
      >
        {rows.map((c) => {
          const on = stars.has(c.nm);
          return (
            <div
              key={c.nm}
              className="grid items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-neutral-50"
              style={{ gridTemplateColumns: CAND_GRID }}
            >
              <span className="font-semibold tabular-nums text-neutral-400">{c.pl}</span>
              {/* Строка ведёт в карточку спортсмена — переход на человеке, а не
                  на всей полосе: звёздочка в той же строке не должна уводить. */}
              <Who av={c.av} nm={c.nm} sub={subOf(c)} to="Э11.2" />
              <span className="flex flex-wrap gap-1">
                {c.res.map(([k, v]) => (
                  <span key={k} className="whitespace-nowrap rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500">
                    {k} <b className="text-neutral-800">{v}</b>
                  </span>
                ))}
              </span>
              <span className="text-right font-semibold tabular-nums">{c.r}</span>
              <Delta d={c.d} />
              <button
                type="button"
                title={on ? 'Убрать из моего списка' : 'Отметить в мой список'}
                aria-pressed={on}
                onClick={() => toggle(c.nm)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-amber-50"
              >
                <Star size={15} className={on ? 'text-amber-500' : 'text-neutral-300'} fill={on ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="px-4 py-4 text-[12.5px] text-neutral-500">
            По этим фильтрам в отборе никого нет — женский список появится с данными федерации.
          </div>
        )}
      </Sheet>

      {/* Охват списка — открытый вопрос из флоу, и он сказан на самом экране. */}
      <div className="mt-4">
        <Bar tone="warning">{SCOPE_WARN11}</Bar>
      </div>
    </WebApp>
  );
}

const Cands11_1States = () => (
  <States>
    <Shot
      tone="warning"
      title="Охват списка не решён"
      text="Видит ли роль всех спортсменов страны или только кандидатский список — не решено (⚠ 12.1)."
      wide
    >
      <Frag>
        <Rows>
          <Row
            nm="Весь реестр — 5 210 спортсменов"
            sub="наше допущение: показываем всех, на чтение"
            pill={{ t: 'СЕЙЧАС ТАК', cls: 'reg' }}
          />
          <Row
            nm="Только кандидатский список"
            sub="если федерация подтвердит — экран сузится"
            pill={{ t: 'ВОПРОС', cls: 'bad' }}
          />
        </Rows>
      </Frag>
    </Shot>
  </States>
);

/* ── Э11.2 · Карточка спортсмена — чтение ────────────────────────── */

/** График истории рейтинга: линия, а не столбики — вопрос к рейтингу «куда
    идёт». Точки месяцев роста зелёные, спадов красные. */
const RatingChart11 = () => (
  <ChartBox
    height={168}
    label="История рейтинга Кима Георгия по месяцам сезона"
    make={(el) => ({
      type: 'line',
      data: {
        labels: RATING.map((p) => p.m),
        datasets: [
          {
            label: 'Рейтинг',
            data: RATING.map((p) => p.r),
            borderColor: token('--c-accent', el),
            backgroundColor: soft('--c-accent', 16, el),
            pointBackgroundColor: RATING.map((p, i) =>
              i > 0 && p.r < RATING[i - 1].r ? token('--c-danger', el) : token('--c-success', el),
            ),
            pointBorderColor: token('--c-panel', el),
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 5,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        /* Локаль — для всего, что Chart.js форматирует сам (подсказка,
           внутренние числа): без неё он считает по en-US. На саму ось на это
           не полагаемся — на снимке она всё равно вышла с английской запятой
           («2,460»), — и подписи тиков считаем своим `fmtN`. */
        locale: 'ru-RU',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (i) => {
                const d = i.dataIndex > 0 ? RATING[i.dataIndex].r - RATING[i.dataIndex - 1].r : 0;
                return `${RATING[i.dataIndex].r}${i.dataIndex > 0 ? ` · ${fmtD(d)} за месяц` : ''}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), font: { size: 10 } },
          },
          y: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: {
              color: token('--c-dim', el),
              font: { size: 10 },
              callback: (v: string | number) => (typeof v === 'number' ? fmtN(v) : v),
            },
          },
        },
      },
    })}
  />
);

/** Профиль по зонам флоу: клуб · тренер · разряд — отдельными строками, а не
    склейкой в подпись. Один список на оба формата. */
const PROFILE11: [string, ReactNode][] = [
  ['Клуб', '«СКА» · Астана'],
  ['Тренер', 'Ахметов Дамир'],
  ['Разряд', 'Мастер спорта РК'],
  ['Год рождения', '2003 · 22 года'],
  ['Матчей за сезон', '46 · побед 38 (83%)'],
  ['Динамика за сезон', <span key="d" className="text-green-700">+38 (было 2418)</span>],
];

/** Последние матчи: победа-поражение кружком, счёт справа. Список один на оба
    формата — на телефоне он и так строчный, ужимать нечего. */
const Matches11 = () => (
  <div className="divide-y divide-neutral-100">
    {MATCHES.map((m) => (
      <div key={m.nm + m.dt} className="flex items-center gap-3 px-4 py-2.5">
        <span
          className={
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ' +
            (m.st === 'win' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')
          }
        >
          {m.st === 'win' ? 'П' : 'О'}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-medium">{m.nm}</span>
          <span className="block truncate text-xs text-neutral-500">{m.sub}</span>
        </span>
        <span className="text-[13.5px] font-bold tabular-nums">{m.sc}</span>
        <span className="w-10 text-right text-xs tabular-nums text-neutral-400">{m.dt}</span>
      </div>
    ))}
  </div>
);

/** Карточка на чтение: сперва кто это и куда идёт рейтинг, ниже — чем это
    подтверждено (матчи, личные встречи, главные старты). Правок на экране нет
    вовсе — только просмотр, и об этом сказано на каждой панели. */
export function Card11_2() {
  return (
    <WebApp
      role={R}
      nav="Карточка"
      title="Ким Георгий — карточка спортсмена"
      sub="2003 г.р. · Астана · клуб «СКА» · 1 место в рейтинге"
      back={{ label: 'Кандидаты в сборную', to: 'Э11.1' }}
    >
      {/* Блоки идут один под другим во всю ширину ✳ (30.08.2026): в две колонки
          график истории рейтинга сжимался вдвое, а таблица главных стартов и
          строки матчей теряли колонки. Порядок — как читают карточку: кто это,
          куда идёт рейтинг, чем это подтверждено. Панель сама держит отступ
          снизу, обёртка не нужна. */}
      <>
        <Panel title="Профиль и рейтинг" extra={<ReadOnly />}>
          <div className="flex items-center gap-3.5">
            <Avatar size="lg">
              <Avatar.Image alt="Ким Георгий" src={A(44)} />
              <Avatar.Fallback>К</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[15px] font-semibold">Ким Георгий</div>
              <div className="mt-0.5 text-xs text-neutral-500">1 место в рейтинге · сезон 2026</div>
            </div>
            <div className="text-right leading-tight">
              <div className="text-2xl font-bold tabular-nums tracking-tight">2456</div>
              <div className="text-[11px] text-neutral-400">рейтинг</div>
            </div>
          </div>
          <Separator className="my-3" />
          <KV items={PROFILE11} />
        </Panel>

        <Panel
          title="История рейтинга"
          sub="август 2025 — март 2026 · по месяцам"
          extra={<Pill t="+38 ЗА СЕЗОН" color="success" />}
        >
          <RatingChart11 />
        </Panel>

        <Panel title="Последние матчи" extra={<ReadOnly />} flush>
          <Matches11 />
        </Panel>

        <Panel title="Личные встречи с соперниками" flush>
          <div className="divide-y divide-neutral-100">
            {H2H.map(([nm, sc, sub]) => (
              <Row key={nm} nm={nm} sub={sub} val={sc} />
            ))}
          </div>
        </Panel>

        <Panel title="Главные старты по сезонам" flush>
          <DataTable
            cols={['Сезон', 'Чемпионат РК', 'Кубок РК', 'Спартакиада']}
            grid="64px 1fr 1fr 1fr"
            rows={SEASONS.map((s) => ({
              key: s.y,
              cells: [
                <b key="y" className="tabular-nums">{s.y}</b>,
                <span key="c">{s.ch}</span>,
                <span key="k">{s.cup}</span>,
                <span key="s">{s.sp}</span>,
              ],
            }))}
          />
        </Panel>
      </>
    </WebApp>
  );
}

/* ── Э11.3 · Сравнение кандидатов ────────────────────────────────── */

const CMP_GRID = '200px repeat(3, 1fr)';
const cellK = 'border-t border-neutral-100 px-3 py-2.5 text-xs font-medium text-neutral-500';
const cellV = 'border-t border-neutral-100 px-3 py-2.5 text-[13px] font-semibold tabular-nums';

/** Все строки сравнения одним списком: признак и три значения в порядке
    колонок `THREE`. Один источник на оба формата — на десктопе из него
    складывается матрица, на телефоне блоки по признакам: 200-пиксельная
    колонка подписей и три колонки значений в 392 px не помещаются вовсе. */
const CMP_ALL: [string, ReactNode[]][] = [
  ...CMP.map(([k, a, b, c]): [string, ReactNode[]] => [k, [a, b, c]]),
  /* Динамика — из тех же чисел, что список Э11.1: стрелка и дельта. */
  ['Динамика за сезон', THREE.map((c) => <span key={c.nm} className="inline-flex"><Delta d={c.d} /></span>)],
  [
    'Личные встречи между собой',
    CMP_H2H.map((v, i) => (
      <span key={THREE[i].nm} className="whitespace-pre-line leading-relaxed">{v}</span>
    )),
  ],
];

/** Трое отмеченных колонками: по строкам — то, по чему выбирают в сборную.
    Экран на чтение; единственное действие — выгрузка. */
export function Compare11_3() {
  return (
    <WebApp
      role={R}
      nav="Сравнение"
      title="Сравнение кандидатов"
      sub="Трое отмеченных из списка · сезон 2026 · только просмотр"
      back={{ label: 'Кандидаты в сборную', to: 'Э11.1' }}
    >
      <Panel
        title="Ким Георгий · Смагулов Алан · Мұрат Ерасыл"
        extra={
          <span className="flex items-center gap-2">
            <ReadOnly />
            <Button size="sm" variant="outline">
              <Download size={14} /> Выгрузить сравнение
            </Button>
          </span>
        }
        flush
      >
        <div className="grid" style={{ gridTemplateColumns: CMP_GRID }}>
          <div />
          {THREE.map((c) => (
            <div key={c.nm} className="flex items-center gap-2.5 px-3 pb-3 pt-4">
              <Avatar size="sm">
                <Avatar.Image alt={c.nm} src={c.av} />
                <Avatar.Fallback>{c.nm.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13.5px] font-semibold">{c.nm}</span>
                <span className="block text-[11px] text-neutral-500">{c.pl} место в рейтинге</span>
              </span>
            </div>
          ))}

          {CMP_ALL.map(([k, vals]) => (
            <Fragment key={k}>
              <div className={cellK}>{k}</div>
              {vals.map((v, i) => (
                <div key={THREE[i].nm} className={cellV}>{v}</div>
              ))}
            </Fragment>
          ))}
        </div>
      </Panel>
    </WebApp>
  );
}

/* ── Второй формат: те же экраны на телефоне ────────────────────── */

/* Полный адаптив ✳ (30.08.2026, решение владельца «все экраны в обоих»).

   Тренер сборной сидит за столом не всегда: список отбора и карточку он
   открывает в зале, между матчами, — телефон для этой роли не «на всякий
   случай», а второе рабочее место. Содержание то же и из тех же данных
   (`CANDS`, `MATCHES`, `CMP_ALL`), меняется раскладка:

   - оболочка `WebApp` → `PhoneRoleApp`: вкладки нижней панели она строит из
     тех же `R.nav`, что рисует сайдбар;
   - таблица кандидатов (`Sheet`) → строки `Rows`/`Row`: фото, фамилия,
     рейтинг справа, остальное подписью;
   - ряд из четырёх фильтров → друг под другом, длинные — с прокруткой вбок;
   - матрица сравнения (подпись + три колонки) → блоки по признакам.

   Состояния экрана во втором формате не повторяем: они показаны один раз, на
   полке `States` под основным макетом. */

/** Полоса фильтра, которая не влезает в 392 px: прокручивается вбок в своей
    полосе, а не режется и не переносится. `w-max` нужен потому, что сам
    сегмент умеет переносить кнопки — в узком родителе он бы завернулся вместо
    того, чтобы поехать. */
const Slide = ({ children }: { children: ReactNode }) => (
  <div className="-mx-4 overflow-x-auto px-4">
    <div className="w-max">{children}</div>
  </div>
);

/** Э11.1 на телефоне: те же фильтры, те же кандидаты, та же звёздочка. */
function Cands11_1Phone() {
  const [sex, setSex] = useState('Мужчины');
  const [age, setAge] = useState(AGES11[0]);
  const [region, setRegion] = useState(REGIONS11[0]);
  const [period, setPeriod] = useState('Сезон 2026');
  const [stars, setStars] = useState<ReadonlySet<string>>(new Set(THREE.map((c) => c.nm)));
  const toggle = (nm: string) => {
    const next = new Set(stars);
    if (!next.delete(nm)) next.add(nm);
    setStars(next);
  };
  /* Сортировки на телефоне нет: её место — шапки колонок, а колонок здесь нет
     вовсе. Список идёт по месту в рейтинге, как открывается и на десктопе. */
  const rows = filterCands(sex, age, region);
  const canCmp = stars.size >= 2 && stars.size <= 3;

  return (
    <PhoneRoleApp
      role={R}
      nav="Кандидаты"
      title="Кандидаты в сборную"
      sub="Реестр спортсменов · рейтинг и динамика за сезон 2026"
    >
      <div className="mb-3 flex flex-col gap-2">
        {/* Пол и период коротки и стоят в одной строке; возраст и регион — по
            своей полосе: резать выбор нельзя, отбор и есть работа роли. */}
        <div className="flex flex-wrap gap-2">
          <FilterSeg items={['Мужчины', 'Женщины']} active={sex} onPick={setSex} />
          <FilterSeg items={['Сезон 2026', 'Год']} active={period} onPick={setPeriod} />
        </div>
        <Slide><FilterSeg items={AGES11} active={age} onPick={setAge} /></Slide>
        <Slide><FilterSeg items={REGIONS11} active={region} onPick={setRegion} /></Slide>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        <span className="text-[12px] leading-snug text-neutral-500">
          {rows.length} из {CANDS.length} на экране · {sex.toLowerCase()}, {age.toLowerCase()},{' '}
          {region.toLowerCase()} · период: {period.toLowerCase()}
        </span>
        {/* Оба действия роли — в ряд во всю ширину: на телефоне кнопка у края
            экрана попадает под большой палец, а не ищется глазами. */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Download size={14} /> Выгрузить
          </Button>
          <Button size="sm" variant="primary" className="flex-1" data-to="Э11.3" isDisabled={!canCmp}>
            Сравнить ({stars.size})
          </Button>
        </div>
      </div>

      {rows.length ? (
        <Rows>
          {rows.map((c) => {
            const on = stars.has(c.nm);
            return (
              <Row
                key={c.nm}
                av={c.av}
                nm={c.nm}
                /* Всё, что на десктопе стоит колонками — место, год, регион,
                   клуб, динамика, — здесь подписью: она переносится, и ничего
                   из таблицы не пропадает. Главные старты остаются числом в
                   строке: «ЧК 1 · Кубок 2 · Спарт. 1». */
                sub={
                  `${c.pl} место · ${c.born} г.р. · ${c.region} · ${c.club} · ` +
                  `${c.res.map(([k, v]) => `${k} ${v}`).join(' · ')} · ${fmtD(c.d)} за сезон`
                }
                val={String(c.r)}
                to="Э11.2"
                /* Звёздочка словом: значок в 15 px рядом с фамилией на телефоне
                   не нажать. `actionTo` — свой же экран: кнопка помечает в мой
                   список и никуда не уводит, в отличие от самой строки. */
                action={on ? 'В списке' : 'Отметить'}
                actionTo="Э11.1"
                onAction={() => toggle(c.nm)}
              />
            );
          })}
        </Rows>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-[12.5px] text-neutral-500">
          По этим фильтрам в отборе никого нет — женский список появится с данными федерации.
        </div>
      )}

      <div className="mt-4">
        <Bar tone="warning">{SCOPE_WARN11}</Bar>
      </div>
    </PhoneRoleApp>
  );
}

/** Э11.2 на телефоне: те же панели одна под другой. График — тот же холст
    Chart.js: он и на десктопе тянется по ширине панели, на 392 px читается. */
const Card11_2Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Карточка"
    title="Ким Георгий"
    sub="2003 г.р. · Астана · клуб «СКА» · 1 место в рейтинге"
    back={{ label: 'Кандидаты в сборную', to: 'Э11.1' }}
  >
    <Panel title="Профиль и рейтинг" extra={<ReadOnly />}>
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <Avatar.Image alt="Ким Георгий" src={A(44)} />
          <Avatar.Fallback>К</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[14px] font-semibold">Ким Георгий</div>
          <div className="mt-0.5 text-[11.5px] text-neutral-500">1 место в рейтинге · сезон 2026</div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-xl font-bold tabular-nums tracking-tight">2456</div>
          <div className="text-[11px] text-neutral-400">рейтинг</div>
        </div>
      </div>
      <Separator className="my-3" />
      <KV items={PROFILE11} />
    </Panel>

    <Panel
      title="История рейтинга"
      sub="август 2025 — март 2026 · по месяцам"
      extra={<Pill t="+38 ЗА СЕЗОН" color="success" />}
    >
      <RatingChart11 />
    </Panel>

    <Panel title="Последние матчи" extra={<ReadOnly />} flush>
      <Matches11 />
    </Panel>

    <Panel title="Личные встречи с соперниками" flush>
      <div className="divide-y divide-neutral-100">
        {H2H.map(([nm, sc, sub]) => (
          <Row key={nm} nm={nm} sub={sub} val={sc} />
        ))}
      </div>
    </Panel>

    {/* Таблица главных стартов — четыре колонки, и на 392 px они сжимаются до
        нечитаемых. Тот же сезон строкой: год слева, три результата подписью. */}
    <Panel title="Главные старты по сезонам" flush>
      <div className="divide-y divide-neutral-100">
        {SEASONS.map((s) => (
          <Row
            key={s.y}
            nm={`Сезон ${s.y}`}
            sub={`Чемпионат РК — ${s.ch} · Кубок РК — ${s.cup} · Спартакиада — ${s.sp}`}
          />
        ))}
      </div>
    </Panel>
  </PhoneRoleApp>
);

/** Э11.3 на телефоне: сначала кого сравниваем, дальше признак за признаком.
    Матрица разворачивается «по строкам»: подпись признака — заголовком блока,
    три значения — тремя строками с фамилиями. Колонок рядом на телефоне не
    бывает, а вопрос «кто из троих» остаётся тем же. */
const Compare11_3Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Сравнение"
    title="Сравнение кандидатов"
    sub="Трое отмеченных из списка · сезон 2026 · только просмотр"
    back={{ label: 'Кандидаты в сборную', to: 'Э11.1' }}
  >
    <div className="mb-3">
      <Rows>
        {THREE.map((c) => (
          <Row
            key={c.nm}
            av={c.av}
            nm={c.nm}
            sub={`${c.pl} место в рейтинге · ${c.region}`}
            val={String(c.r)}
          />
        ))}
      </Rows>
    </div>

    <Panel title="Чем отличаются" extra={<ReadOnly />} flush>
      <div className="divide-y divide-neutral-100">
        {CMP_ALL.map(([k, vals]) => (
          <div key={k} className="px-4 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{k}</div>
            <div className="mt-0.5">
              <KV items={THREE.map((c, i): [string, ReactNode] => [c.nm, vals[i]])} />
            </div>
          </div>
        ))}
      </div>
    </Panel>

    <Button variant="outline" className="w-full">
      <Download size={14} /> Выгрузить сравнение
    </Button>
  </PhoneRoleApp>
);

/* ── Борд роли: экраны маршрута подряд ──────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.
    Коды, подписи и порядок — те же, что были: по ним сходятся flows/, данные
    роли и Storybook. */

/* ── Кабинет сборной ✳ (31.08.2026) ───────────────────────────────
   Дополнения федерации (документ «Предложения», пп. 1, 2, 4, 5) разнесены сюда,
   в роль главного тренера: план подготовки, медкарта, календарь подготовки и
   рапорты на командирование. Из четырёх пунктов взят вариант 5 — одним
   разделом, а не тремя добавками в чужие экраны: план без календаря не
   проверить, рапорт без состава не собрать.

   Первоисточник — `docs/refs/predlozheniya-dopolneniya-2026-08-31.md`.
   Открытые вопросы по этим экранам — QUESTIONS §20. */
/* ── Данные ──────────────────────────────────────────────────────── */

type Squad = 'Основной' | 'Расширенный';
type Athlete = {
  av: string;
  nm: string;
  born: number;
  region: string;
  squad: Squad;
  age: string;
  coach: string;
  rating: number;
  /** Состояние плана подготовки: доля выполненного за текущий период. */
  plan: { done: number; total: number } | null;
  /** Медицинская карта: до какой даты действует допуск. */
  med: { till: string; warn?: boolean } | null;
};

const TEAM: Athlete[] = [
  { av: A(13), nm: 'Ким Георгий', born: 2003, region: 'Алматы', squad: 'Основной', age: 'Взрослые', coach: 'Ахметов С.', rating: 2456, plan: { done: 7, total: 9 }, med: { till: '14.02.2027' } },
  { av: A(76), nm: 'Токаев Марат', born: 2005, region: 'Астана', squad: 'Основной', age: 'До 21', coach: 'Ахметов С.', rating: 2350, plan: { done: 5, total: 9 }, med: { till: '30.09.2026', warn: true } },
  { av: AW(21), nm: 'Тлеуова Аружан', born: 2007, region: 'Шымкент', squad: 'Основной', age: 'До 19', coach: 'Смагулова Д.', rating: 2288, plan: { done: 9, total: 9 }, med: { till: '02.06.2027' } },
  { av: A(45), nm: 'Байжанов Асхат', born: 2004, region: 'Караганда', squad: 'Расширенный', age: 'Взрослые', coach: 'Ахметов С.', rating: 2180, plan: { done: 3, total: 8 }, med: { till: '18.11.2026' } },
  { av: AW(31), nm: 'Ким Лариса', born: 2008, region: 'Павлодар', squad: 'Расширенный', age: 'До 19', coach: 'Смагулова Д.', rating: 2104, plan: null, med: { till: '04.04.2027' } },
  { av: A(64), nm: 'Сейтқали Айдос', born: 2009, region: 'Тараз', squad: 'Расширенный', age: 'До 17', coach: 'Смагулова Д.', rating: 1980, plan: { done: 2, total: 6 }, med: null },
];

const SQUADS = ['Все составы', 'Основной', 'Расширенный'];
const AGES = ['Все возрасты', 'Взрослые', 'До 21', 'До 19', 'До 17'];
const COACHES = ['Все тренеры', 'Ахметов С.', 'Смагулова Д.'];

const squadFiltered = (q: string, sq: string, age: string, coach: string) =>
  TEAM.filter((a) => {
    if (sq !== SQUADS[0] && a.squad !== sq) return false;
    if (age !== AGES[0] && a.age !== age) return false;
    if (coach !== COACHES[0] && a.coach !== coach) return false;
    const t = q.trim().toLowerCase();
    return !t || a.nm.toLowerCase().includes(t) || a.region.toLowerCase().includes(t);
  });

/** Значок плана: не «есть / нет», а сколько сделано. План, который нельзя
    проверить, — список пожеланий, и на экране это должно быть видно числом. */
const planPill = (a: Athlete) =>
  a.plan === null ? (
    <Pill t="ПЛАНА НЕТ" color="warning" />
  ) : a.plan.done === a.plan.total ? (
    <Pill t={`ВЫПОЛНЕН ${a.plan.done}/${a.plan.total}`} color="success" />
  ) : (
    <Pill t={`${a.plan.done} из ${a.plan.total}`} color="accent" />
  );

const medPill = (a: Athlete) =>
  a.med === null ? (
    <Pill t="НЕТ ДОПУСКА" color="danger" />
  ) : a.med.warn ? (
    <Pill t={`ДО ${a.med.till}`} color="warning" />
  ) : (
    <Pill t={`ДО ${a.med.till}`} color="success" />
  );

/* ── Э11.4 · Состав сборной ───────────────────────────────────────── */

const TEAM_GRID = 'minmax(0,2.4fr) 100px 84px minmax(0,1.1fr) 70px 118px 142px';

export function Squad11_4() {
  const [q, setQ] = useState('');
  const [sq, setSq] = useState(SQUADS[0]);
  const [age, setAge] = useState(AGES[0]);
  const [coach, setCoach] = useState(COACHES[0]);
  const rows = squadFiltered(q, sq, age, coach);
  return (
    <WebApp
      role={R}
      nav="Состав сборной"
      title="Состав национальной команды"
      sub="Сезон 2026 · основной и расширенный составы"
      hint="Предложение 5 федерации: единая база членов сборной с распределением по составам, возрастным группам и тренерам."
    >
      <StatTiles
        items={[
          { v: '24', k: 'В сборной' },
          { v: '12', k: 'Основной состав' },
          { v: '12', k: 'Расширенный' },
          { v: '3', k: 'Плана подготовки нет', tone: 'a' },
          { v: '1', k: 'Медицинский допуск истёк', tone: 'b' },
          { v: '6', k: 'УТС в сезоне' },
        ]}
      />

      <FilterBar
        right={
          <Button size="sm" variant="outline">
            <Plus size={14} /> Внести в состав
          </Button>
        }
      >
        <SearchInput value={q} onChange={setQ} placeholder="Фамилия или регион" className="w-72" />
        <FilterSeg items={SQUADS} active={sq} onPick={setSq} />
        <FilterSeg items={AGES} active={age} onPick={setAge} />
        <FilterSeg items={COACHES} active={coach} onPick={setCoach} />
      </FilterBar>

      <Panel
        title={`Члены сборной · ${rows.length}`}
        flush
      >
        <Sheet
          flush
          grid={TEAM_GRID}
          cols={['Спортсмен', 'Состав', 'Возраст', 'Тренер', 'Рейтинг', 'План периода', 'Медицинский допуск']}
        >
          {rows.map((a) => (
            <div
              key={a.nm}
              data-row
              data-to="Э11.5"
              className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px]"
              style={{ gridTemplateColumns: TEAM_GRID }}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar size="sm">
                  <Avatar.Image alt={a.nm} src={a.av} />
                  <Avatar.Fallback>{a.nm.slice(0, 1)}</Avatar.Fallback>
                </Avatar>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-medium">{a.nm}</span>
                  <span className="block truncate text-xs text-neutral-500">
                    {a.born} г.р. · {a.region}
                  </span>
                </span>
              </span>
              <span className="text-neutral-600">{a.squad}</span>
              <span className="text-neutral-600">{a.age}</span>
              <span className="truncate text-neutral-600">{a.coach}</span>
              <span className="text-right tabular-nums">{a.rating}</span>
              <span>{planPill(a)}</span>
              <span>{medPill(a)}</span>
            </div>
          ))}
        </Sheet>
      </Panel>

      <Bar tone="warning">
        ✳ Наше предположение, а не слова федерации: деление на основной и расширенный составы
        федерация назвала, но не сказала, кто и по какому правилу переводит спортсмена между ними —
        главный тренер решением или отбор считается по рейтингу. Уточнить.
      </Bar>
    </WebApp>
  );
}

export const Squad11_4Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Состав сборной"
    title="Состав сборной"
    sub="Сезон 2026 · 24 спортсмена"
  >
    <div className="mb-3">
      <FilterSeg items={SQUADS} active={SQUADS[1]} onPick={() => {}} />
    </div>
    <Rows>
      {TEAM.filter((a) => a.squad === 'Основной').map((a) => (
        <Row
          key={a.nm}
          av={a.av}
          nm={a.nm}
          sub={`${a.age} · ${a.region} · ${a.coach}`}
          val={String(a.rating)}
          to="Э11.5"
          pill={a.med === null ? { t: 'НЕТ ДОПУСКА', cls: 'bad' } : a.plan === null ? { t: 'ПЛАНА НЕТ', cls: 'wait' } : { t: `${a.plan.done}/${a.plan.total}`, cls: 'live' }}
        />
      ))}
    </Rows>
    <div className="mt-3">
      <Bar>На телефоне колонки сведены в подпись: состав, возраст, тренер — строкой под фамилией.</Bar>
    </div>
  </PhoneRoleApp>
);

/* ── Э11.5 · Карточка спортсмена сборной ──────────────────────────── */

const PLAN = [
  { t: 'Общая физическая подготовка', sub: 'январь–март · 3 раза в неделю', done: true },
  { t: 'Техника: приём короткой подачи', sub: 'февраль · с тренером региона', done: true },
  { t: 'УТС Алматы — базовый сбор', sub: '02–14.03 · 12 дней', done: true },
  { t: 'Чемпионат РК — выход в 1/4', sub: '12–14.03 · целевой результат', done: true },
  { t: 'Работа над игрой слева в атаке', sub: 'апрель–май · видеоразбор раз в неделю', done: true },
  { t: 'УТС Астана — предсоревновательный', sub: '05–18.05 · 14 дней', done: true },
  { t: 'Открытый турнир Караганды', sub: '24.05 · обкатка подачи', done: true },
  { t: 'УТС Шымкент — восстановительный', sub: '10–20.06 · 11 дней', done: false },
  { t: 'Международный старт — отбор', sub: 'июль · по решению штаба', done: false },
];

const MED = [
  { t: 'Медицинский допуск к соревнованиям', sub: 'выдан 14.02.2026 · действует до 14.02.2027', st: 'ДЕЙСТВУЕТ', cls: 'live' as const },
  { t: 'Углублённое медобследование (УМО)', sub: 'пройдено 20.01.2026 · Республиканский диспансер', st: 'ПРОЙДЕНО', cls: 'live' as const },
  { t: 'Травма: правое плечо, надостная мышца', sub: '18.04.2026 · нагрузка ограничена 3 недели · снято 09.05.2026', st: 'ЗАКРЫТА', cls: 'done' as const },
  { t: 'Аллергия: пыльца злаковых', sub: 'внесено врачом сборной · учитывать в мае–июне', st: 'ПОСТОЯННО', cls: 'wait' as const },
];

const HISTORY = [
  { t: 'УТС Астана — предсоревновательный', sub: '05–18.05.2026 · 14 дней · тренер Ахметов С.', val: 'явка полная' },
  { t: 'Открытый турнир Караганды', sub: '24.05.2026 · 1/2 финала · 4 победы, 1 поражение', val: '+8 рейтинга' },
  { t: 'Чемпионат РК 2026', sub: '12–14.03.2026 · 1/4 финала · цель плана выполнена', val: '+34 рейтинга' },
  { t: 'УТС Алматы — базовый сбор', sub: '02–14.03.2026 · 12 дней · тренер Ахметов С.', val: 'явка полная' },
];

/* Вкладки, а не фильтр ✳: вкладка меняет экран, фильтр отбирает строки. План,
   медкарта и история — три разных экрана под одной шапкой, поэтому здесь
   сегмент, а не выпадающий отбор. */
function CardTabs({ start = 'План подготовки' }: { start?: string }) {
  const done = PLAN.filter((p) => p.done).length;
  const plan = (
        <>
          <Panel
            title="Индивидуальный план подготовки · сезон 2026"
            sub="Составил и правит главный тренер сборной · последняя правка 12.06.2026"
            extra={
              <Button size="sm" variant="outline">
                <ClipboardCheck size={14} /> Внести правку
              </Button>
            }
          >
            <div className="mb-3">
              <Facts
                items={[
                  { k: 'пунктов плана', v: String(PLAN.length) },
                  { k: 'выполнено', v: `${done} из ${PLAN.length}` },
                  { k: 'период', v: 'январь — декабрь 2026' },
                  { k: 'правок за сезон', v: '4' },
                ]}
              />
            </div>
            <Rows>
              {PLAN.map((p) => (
                <div key={p.t} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={
                      'grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ' +
                      (p.done ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400')
                    }
                  >
                    {p.done ? '✓' : '—'}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className={'block truncate text-[13.5px] ' + (p.done ? 'font-medium' : 'font-medium text-neutral-500')}>
                      {p.t}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
                  </span>
                  <Pill t={p.done ? 'ВЫПОЛНЕНО' : 'ВПЕРЕДИ'} color={p.done ? 'success' : 'default'} />
                </div>
              ))}
            </Rows>
          </Panel>

          <Bar tone="warning">
            ✳ Наше предположение: «контроль выполнения плана» федерация назвала, но чем считается
            выполнение — отметкой тренера, явкой на УТС или достигнутым результатом — не сказала.
            Здесь отметку ставит тренер, а явка и результат подтягиваются из истории.
          </Bar>
        </>
  );
  const med = (
        <>
          {/* Доступ — первое, что видно на медицинской вкладке ✳: это
              чувствительные данные, и правило должно быть на экране, а не в
              настройках, куда никто не заходит. */}
          <Bar tone="warning">
            Медицинские данные видят: <b>врач сборной</b> (вносит и правит),{' '}
            <b>главный тренер</b> (читает допуск и ограничения нагрузки),{' '}
            <b>сам спортсмен</b> (читает всё). Остальным ролям вкладка не видна вовсе. ✳ Круг лиц —
            наше предположение: федерация написала «с разграничением прав доступа», но кому что
            открыто, не назвала.
          </Bar>

          <Panel
            title="Медицинская карта"
            sub="Ким Георгий · 2003 г.р. · Алматы"
            extra={
              <Button size="sm" variant="outline">
                <Plus size={14} /> Добавить запись
              </Button>
            }
          >
            <div className="mb-3">
              <KV
                items={[
                  ['Допуск к соревнованиям', 'действует до 14.02.2027'],
                  ['Последнее УМО', '20.01.2026 · Республиканский диспансер'],
                  ['Группа крови', 'указана врачом сборной'],
                  ['Ограничения нагрузки', 'нет'],
                ]}
              />
            </div>
            <Rows>
              {MED.map((m) => (
                <Row key={m.t} nm={m.t} sub={m.sub} pill={{ t: m.st, cls: m.cls }} />
              ))}
            </Rows>
          </Panel>

          <Bar>
            Допуск на турнир система и так сверяет с системами Минздрава при заявке (TZ §8.2).
            Карта не заменяет эту проверку — она хранит то, чего в справке нет: травмы,
            ограничения, историю обследований.
          </Bar>
        </>
  );
  const history = (
        <>
          <Panel title="История подготовки · сезон 2026" sub="УТС, выезды и результаты — одной лентой" flush>
            <Rows>
              {HISTORY.map((h) => (
                <Row key={h.t} nm={h.t} sub={h.sub} val={h.val} />
              ))}
            </Rows>
          </Panel>
          <ChartRow>
            <Panel title="Из чего сложился сезон">
              <Donut
                label="Мероприятия сезона: сборы, соревнования, восстановление"
                total="14"
                totalNote="мероприятий"
                parts={[
                  { t: 'Учебно-тренировочные сборы', v: 6, note: '68 дней' },
                  { t: 'Соревнования', v: 5 },
                  { t: 'Плановые обследования', v: 3 },
                ]}
              />
            </Panel>
            <Panel title="Дней на сборах по месяцам">
              <Bars
                label="Дней на учебно-тренировочных сборах по месяцам"
                suffix="дней на сборах"
                items={[
                  { t: 'янв', v: 0 },
                  { t: 'фев', v: 0 },
                  { t: 'мар', v: 12 },
                  { t: 'апр', v: 0 },
                  { t: 'май', v: 14 },
                  { t: 'июн', v: 11, on: true },
                ]}
              />
            </Panel>
          </ChartRow>
        </>
  );
  return (
    <PageTabs
      active={start}
      items={[
        { t: 'План подготовки', view: plan },
        { t: 'Медицинская карта', view: med },
        { t: 'История подготовки', view: history },
      ]}
    />
  );
}

export const Card11_5 = () => (
  <WebApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав сборной', to: 'Э11.4' }}
    title="Ким Георгий"
    sub="Основной состав · взрослые · 2003 г.р. · Алматы · рейтинг 2456 · тренер Ахметов С."
  >
    <CardTabs />
  </WebApp>
);

export const Card11_5Med = () => (
  <WebApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав сборной', to: 'Э11.4' }}
    title="Ким Георгий"
    sub="Основной состав · взрослые · 2003 г.р. · Алматы · рейтинг 2456 · тренер Ахметов С."
  >
    <CardTabs start="Медицинская карта" />
  </WebApp>
);

export const Card11_5History = () => (
  <WebApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав сборной', to: 'Э11.4' }}
    title="Ким Георгий"
    sub="Основной состав · взрослые · 2003 г.р. · Алматы · рейтинг 2456 · тренер Ахметов С."
  >
    <CardTabs start="История подготовки" />
  </WebApp>
);

export const Card11_5Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Состав сборной"
    back={{ label: 'Состав', to: 'Э11.4' }}
    title="Ким Георгий"
    sub="Основной состав · 2003 г.р. · рейтинг 2456"
  >
    <PageTabs
      items={[
        {
          t: 'План',
          view: (
            <Panel title="План подготовки · 7 из 9" flush>
              <Rows>
                {PLAN.slice(0, 5).map((p) => (
                  <Row key={p.t} nm={p.t} sub={p.sub} pill={{ t: p.done ? 'ВЫПОЛНЕНО' : 'ВПЕРЕДИ', cls: p.done ? 'live' : 'wait' }} />
                ))}
              </Rows>
            </Panel>
          ),
        },
        {
          t: 'Медкарта',
          view: (
            <>
              <Bar tone="warning">Видят: врач сборной, главный тренер, сам спортсмен.</Bar>
              <Panel title="Медицинская карта" flush>
                <Rows>
                  {MED.map((m) => (
                    <Row key={m.t} nm={m.t} sub={m.sub} pill={{ t: m.st, cls: m.cls }} />
                  ))}
                </Rows>
              </Panel>
            </>
          ),
        },
        {
          t: 'История',
          view: (
            <Panel title="История подготовки" flush>
              <Rows>
                {HISTORY.map((h) => (
                  <Row key={h.t} nm={h.t} sub={h.sub} val={h.val} />
                ))}
              </Rows>
            </Panel>
          ),
        },
      ]}
    />
  </PhoneRoleApp>
);

/* ── Э11.6 · Календарь подготовки ─────────────────────────────────── */

const PREP = [
  { id: 'p1', from: '2026-03-02', till: '2026-03-14', nm: 'УТС Алматы — базовый сбор', sub: '12 дней · основной состав · тренер Ахметов С.', tone: 'accent' as const },
  { id: 'p2', from: '2026-03-12', till: '2026-03-14', nm: 'Чемпионат РК 2026', sub: 'Астана · целевой старт сезона', tone: 'warning' as const },
  { id: 'p3', from: '2026-05-05', till: '2026-05-18', nm: 'УТС Астана — предсоревновательный', sub: '14 дней · основной и расширенный', tone: 'accent' as const },
  { id: 'p4', from: '2026-05-24', nm: 'Открытый турнир Караганды', sub: 'обкатка подачи · четверо из расширенного', tone: 'warning' as const },
  { id: 'p5', from: '2026-06-10', till: '2026-06-20', nm: 'УТС Шымкент — восстановительный', sub: '11 дней · рапорт на согласовании', tone: 'neutral' as const },
  { id: 'p6', from: '2026-07-08', till: '2026-07-12', nm: 'Международный старт — отбор', sub: 'состав определяет штаб', tone: 'neutral' as const },
];

export const Prep11_6 = () => (
  <WebApp
    role={R}
    nav="Календарь подготовки"
    title="Календарь подготовки сборной"
    sub="Сезон 2026 · сборы, выезды и целевые старты в одной ленте"
    hint="Предложение 5: единый календарь подготовки национальной команды с учётом УТС и выездов на соревнования."
    aside={
      <>
        <Panel title="Ближайшее" sub="10–20 июня · через 9 дней">
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">УТС Шымкент</div>
            <div className="mt-0.5 text-[12.5px] text-neutral-500">восстановительный · 11 дней</div>
          </div>
          <div className="mt-3">
            <KV
              items={[
                ['Состав', '8 спортсменов'],
                ['Тренеры', 'Ахметов С., Смагулова Д.'],
                ['Рапорт', 'на согласовании у меня'],
              ]}
            />
          </div>
          <div className="mt-3">
            <Button className="w-full" variant="primary" data-to="Э11.7">
              <FileText size={15} /> Открыть рапорт
            </Button>
          </div>
        </Panel>
        <Panel title="Загрузка сезона">
          <Facts
            items={[
              { k: 'сборов', v: '6' },
              { k: 'дней на сборах', v: '68' },
              { k: 'выездов', v: '5' },
            ]}
          />
        </Panel>
      </>
    }
  >
    <Panel title="Сборы и старты · сезон 2026" sub="Серым — то, по чему рапорт ещё не согласован">
      <EventTimeline items={PREP} today="2026-06-01" />
    </Panel>
    <Bar>
      Календарь подготовки — не второй календарь соревнований: старты в нём те же, что в общем
      календаре федерации (§4.1), но показаны рядом со сборами, потому что план строится из тех и
      других вместе.
    </Bar>
  </WebApp>
);

/* ── Э11.7 · Рапорты на командирование ────────────────────────────── */

type Report = {
  nm: string;
  sub: string;
  who: string;
  st: string;
  cls: 'live' | 'bad' | 'wait' | 'done';
};

const REPORTS: Report[] = [
  { nm: 'УТС Шымкент — восстановительный', sub: '10–20.06 · 8 спортсменов, 2 тренера · подал Смагулова Д.', who: 'Регион Шымкент', st: 'ЖДЁТ МЕНЯ', cls: 'wait' },
  { nm: 'Открытый турнир Караганды', sub: '24.05 · 4 спортсмена · подал Байтасов Р.', who: 'Регион Алматы', st: 'ЖДЁТ МЕНЯ', cls: 'wait' },
  { nm: 'УТС Астана — предсоревновательный', sub: '05–18.05 · 12 спортсменов, 3 тренера · подал Ахметов С.', who: 'Штаб сборной', st: 'СОГЛАСОВАН', cls: 'live' },
  { nm: 'Международный старт — отбор', sub: '08–12.07 · состав не приложен · подал Байтасов Р.', who: 'Регион Алматы', st: 'НА ДОРАБОТКЕ', cls: 'bad' },
  { nm: 'УТС Алматы — базовый сбор', sub: '02–14.03 · 14 спортсменов · подал Ахметов С.', who: 'Штаб сборной', st: 'В ФЕДЕРАЦИИ', cls: 'done' },
];

const TRACK = [
  { at: '09.06, 11:20', t: 'Подан на согласование', s: 'Смагулова Д. · старший тренер региона Шымкент', tone: 'flat' },
  { at: '09.06, 15:04', t: 'Возвращён на доработку', s: 'главный тренер: «приложите поимённый состав и сроки заезда»', tone: 'loss' },
  { at: '10.06, 09:12', t: 'Подан повторно', s: 'состав приложен · 8 спортсменов, 2 тренера', tone: 'flat' },
];

export function Reports11_7() {
  const [pick, setPick] = useState(REPORTS[0].nm);
  const one = REPORTS.find((r) => r.nm === pick) ?? REPORTS[0];
  return (
    <WebApp
      role={R}
      nav="Рапорты"
      title="Рапорты на командирование"
      sub="Сборы и выезды · согласование главного тренера"
      hint="Предложение 4: рапорт подают тренеры штаба и старшие тренеры регионов; после согласования документ уходит в федерацию сам."
    >
      <StatTiles
        items={[
          { v: '2', k: 'Ждут моего решения', tone: 'a' },
          { v: '1', k: 'На доработке у автора' },
          { v: '1', k: 'Согласован сегодня', tone: 'g' },
          { v: '1', k: 'Ушёл в федерацию' },
        ]}
      />

      <Panel title="Очередь рапортов" flush>
        <Rows>
          {REPORTS.map((r) => (
            <Row
              key={r.nm}
              nm={r.nm}
              sub={r.sub}
              pill={{ t: r.st, cls: r.cls }}
              on={r.nm === pick}
              onSelect={() => setPick(r.nm)}
            />
          ))}
        </Rows>
      </Panel>

      <Panel
        title={one.nm}
        sub={`${one.who} · рапорт № 14/2026`}
        extra={<Pill t={one.st} color={one.cls === 'live' ? 'success' : one.cls === 'bad' ? 'danger' : one.cls === 'wait' ? 'warning' : 'default'} />}
      >
        <KV
          items={[
            ['Мероприятие', 'Учебно-тренировочный сбор, Шымкент'],
            ['Сроки', '10–20 июня 2026 · 11 дней'],
            ['Состав', '8 спортсменов, 2 тренера — поимённо в приложении'],
            ['Основание', 'план подготовки сборной на 2026 год'],
            ['Приложение', 'рапорт-скан.pdf · 240 КБ'],
          ]}
        />

        {/* История согласования — не журнал ради журнала ✳: рапорт ходит между
            тремя людьми, и «почему вернули» должно читаться там же, где решают. */}
        <div className="mt-4">
          <Panel title="История согласования" flush>
            <Rows>
              {TRACK.map((t) => (
                <Row key={t.at} nm={t.t} sub={`${t.at} · ${t.s}`} />
              ))}
            </Rows>
          </Panel>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary">
            <ClipboardCheck size={15} /> Согласовать
          </Button>
          <Button variant="outline">Вернуть на доработку</Button>
          <Button variant="outline">Отклонить</Button>
          <span className="text-[12.5px] text-neutral-500">
            У «вернуть» и «отклонить» комментарий обязателен — иначе автор не знает, что править.
          </span>
        </div>
      </Panel>

      <Bar>
        Согласованный рапорт уходит в федерацию сам — отправлять его отдельно никто не должен.
        Дальше он живёт в документах федерации, а здесь остаётся строкой «в федерации» с датой.
      </Bar>
    </WebApp>
  );
}

export const Reports11_7Phone = () => (
  <PhoneRoleApp
    role={R}
    nav="Рапорты"
    title="Рапорты"
    sub="2 ждут решения"
  >
    <Rows>
      {REPORTS.map((r) => (
        <Row key={r.nm} nm={r.nm} sub={r.sub} pill={{ t: r.st, cls: r.cls }} />
      ))}
    </Rows>
    <div className="mt-3">
      <Bar>Согласование с телефона — то же решение: согласовать, вернуть с комментарием, отклонить.</Bar>
    </div>
  </PhoneRoleApp>
);


export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    /* Вход в приложении уже нарисован (role00): второй такой же экран здесь
       был бы копией — берём тот же. */
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э11.1': {
    cap: 'Кандидаты в сборную',
    view: () => (
      <>
        <Cands11_1 />
        <Cands11_1States />
      </>
    ),
    alt: () => <Cands11_1Phone />,
    next: 'строка спортсмена',
  },
  'Э11.2': {
    cap: 'Карточка спортсмена — чтение',
    view: () => <Card11_2 />,
    alt: () => <Card11_2Phone />,
    next: 'отмечены трое · сравнить',
  },
  'Э11.3': {
    cap: 'Сравнение кандидатов',
    view: () => <Compare11_3 />,
    alt: () => <Compare11_3Phone />,
    next: 'пункт меню «Состав сборной»',
  },
  'Э11.4': {
    cap: 'Состав национальной команды',
    view: () => <Squad11_4 />,
    alt: () => <Squad11_4Phone />,
    next: 'строка спортсмена',
  },
  'Э11.5': {
    cap: 'Карточка спортсмена сборной',
    view: () => <Card11_5 />,
    alt: () => <Card11_5Phone />,
    frames: [
      { t: 'Медицинская карта — вкладка с ограниченным доступом', view: () => <Card11_5Med /> },
      { t: 'История подготовки — УТС, старты и результаты', view: () => <Card11_5History /> },
    ],
    next: 'пункт меню «Календарь подготовки»',
  },
  'Э11.6': {
    cap: 'Календарь подготовки',
    view: () => <Prep11_6 />,
    next: 'рапорт по ближайшему сбору',
  },
  'Э11.7': {
    cap: 'Рапорты на командирование',
    view: () => <Reports11_7 />,
    alt: () => <Reports11_7Phone />,
  },
};

export function Role11Board() {
  return <Board role={R} screens={SCREENS} />;
}
