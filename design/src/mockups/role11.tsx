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
  ArrowDownRight, ArrowUpDown, ArrowUpRight, BarChart3, Download, Eye, Star, User, Users,
} from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import {
  A, Bar, DataTable, FilterSeg, KV, Panel, Pill, Row, Rows, ScreenScope, Separator,
  StatTiles, WebApp, type RoleUI,
} from '../kit/hero/app';
/* Из старого слоя остаются только мета-компоненты борда: колонки, стрелки и
   полки состояний. Сами экраны собраны новым слоем. */
import { Board, States, Shot, type ScreenMap } from './shell';
/* График — настоящий Chart.js, как у спортсмена (роль 14): нарисованная ломаная
   не ответила бы, что было в январе. Цвета — токенами через getComputedStyle. */
import { ChartBox, soft, token } from './chart';
import { Login0_1 } from './role00';

/* ── Роль: сайдбар и подпись профиля ─────────────────────────────── */

/** Данные роли — те же, что в старом слое (`roles.tsx`), тип — из нового.
    `badge: false` — роль вне конкретного турнира, значка состояния в шапке нет. */
const R: RoleUI = {
  num: '11',
  title: 'Главный тренер национальной команды',
  person: { nm: 'Ахметов С.', rl: 'Главный тренер сборной', av: A(52) },
  brandName: 'Сборная РК',
  brandSub: 'Кандидаты · рейтинг · результаты',
  badge: false,
  nav: [
    [<Users size={16} key="c" />, 'Кандидаты'],
    [<User size={16} key="k" />, 'Карточка'],
    [<BarChart3 size={16} key="s" />, 'Сравнение'],
  ],
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

/** Таблица с «живыми» строками (⚠ дупликация из role05: компонент старого
    файла чужой роли импортировать нельзя, а DataTable не даёт строкам своих
    ячеек-кнопок — звёздочки и сортировки). */
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

  const found = CANDS.filter((c) => {
    /* Женского списка в рабочей гипотезе нет: фильтр честно показывает пусто,
       а не делает вид, что переключился. */
    if (sex === 'Женщины') return false;
    const byAge = age === AGES11[0] ? true : age === AGES11[1] ? c.born >= 2007 : c.born >= 2011;
    return byAge && (region === REGIONS11[0] || c.region === region);
  });
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
      <StatTiles
        items={[
          { v: '214', k: 'Спортсменов в отборе' },
          { v: String(stars.size), k: 'В моём списке — отмечены для сравнения', tone: 'g' },
          { v: '8', k: 'Главных стартов сезона' },
        ]}
      />

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
        <Bar tone="warning">
          ⚠ Видит ли роль всех спортсменов страны или только кандидатский список — не решено
          (вопрос 12.1). Пока показываем всех, как чтение реестра; данных экран не меняет.
        </Bar>
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

/** Карточка на чтение: слева кто это и куда идёт рейтинг, справа — чем это
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
      <div className="grid grid-cols-2 items-start gap-4">
        <div>
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
            {/* Профиль по зонам флоу: клуб · тренер · разряд — отдельными
                строками, а не склейкой в подпись. */}
            <KV
              items={[
                ['Клуб', '«СКА» · Астана'],
                ['Тренер', 'Ахметов Дамир'],
                ['Разряд', 'Мастер спорта РК'],
                ['Год рождения', '2003 · 22 года'],
                ['Матчей за сезон', '46 · побед 38 (83%)'],
                ['Динамика за сезон', <span key="d" className="text-green-700">+38 (было 2418)</span>],
              ]}
            />
          </Panel>

          <Panel
            title="История рейтинга"
            sub="август 2025 — март 2026 · по месяцам"
            extra={<Pill t="+38 ЗА СЕЗОН" color="success" />}
          >
            <RatingChart11 />
          </Panel>
        </div>

        <div>
          <Panel title="Последние матчи" extra={<ReadOnly />} flush>
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
        </div>
      </div>
    </WebApp>
  );
}

/* ── Э11.3 · Сравнение кандидатов ────────────────────────────────── */

const CMP_GRID = '200px repeat(3, 1fr)';
const cellK = 'border-t border-neutral-100 px-3 py-2.5 text-xs font-medium text-neutral-500';
const cellV = 'border-t border-neutral-100 px-3 py-2.5 text-[13px] font-semibold tabular-nums';

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

          {CMP.map(([k, a, b, c]) => (
            <Fragment key={k}>
              <div className={cellK}>{k}</div>
              <div className={cellV}>{a}</div>
              <div className={cellV}>{b}</div>
              <div className={cellV}>{c}</div>
            </Fragment>
          ))}

          {/* Динамика — из тех же чисел, что список Э11.1: стрелка и дельта. */}
          <div className={cellK}>Динамика за сезон</div>
          {THREE.map((c) => (
            <div key={c.nm} className={cellV}>
              <span className="inline-flex"><Delta d={c.d} /></span>
            </div>
          ))}

          <div className={cellK}>Личные встречи между собой</div>
          {CMP_H2H.map((v, i) => (
            <div key={i} className={cellV + ' whitespace-pre-line leading-relaxed'}>{v}</div>
          ))}
        </div>
      </Panel>
    </WebApp>
  );
}

/* ── Борд роли: экраны маршрута подряд ──────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу.
    Коды, подписи и порядок — те же, что были: по ним сходятся flows/, данные
    роли и Storybook. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
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
    next: 'строка спортсмена',
  },
  'Э11.2': {
    cap: 'Карточка спортсмена — чтение',
    view: () => <Card11_2 />,
    next: 'отмечены трое · сравнить',
  },
  'Э11.3': {
    cap: 'Сравнение кандидатов',
    view: () => <Compare11_3 />,
  },
};

export function Role11Board() {
  return <Board role={R} screens={SCREENS} />;
}
