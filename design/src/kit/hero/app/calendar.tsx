/* Календарь ✳ (30.08.2026) — приёмом Google Calendar.

   Зачем отдельный компонент. Календарь встречается у половины ролей: сезон у
   федерации (Э1.2) и у коллегии (Э5.3), расписание игрового дня у главного
   судьи (Э6.4), турниры спортсмена и клуба. Каждая роль рисовала его по-своему
   — то плитками месяцев, то таблицей, — и одно и то же событие выглядело в
   системе тремя разными способами.

   Три вида, как в Google Calendar:
   - `MonthGrid` — месяц. Турнир идёт несколько дней, поэтому событие рисуется
     ПОЛОСОЙ через дни, а не точкой в каждом: по полосе видно длительность, и
     соседние старты не сливаются. Полосы раскладываются по дорожкам (lanes),
     чтобы не наезжать друг на друга.
   - `TimeGrid` — неделя или день со шкалой часов: колонки — дни либо столы,
     блок стоит на своём времени. Так читают расписание матчей.
   - `MiniMonth` — маленький месяц: выбор даты рядом со списком.

   Даты — строки `ГГГГ-ММ-ДД`, время — `ЧЧ:ММ`. Считаем в UTC: локальная зона
   съезжает на сутки в зависимости от машины, а макет обязан выглядеть одинаково
   у всех. «Сегодня» задаётся снаружи (`today`) — макет не должен меняться от
   того, какой сегодня день у смотрящего. */

import { Fragment, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Словарь и арифметика дат ───────────────────────────────────── */

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
export const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const d2 = (n: number) => String(n).padStart(2, '0');
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
};
const iso = (d: Date) => `${d.getUTCFullYear()}-${d2(d.getUTCMonth() + 1)}-${d2(d.getUTCDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
/** Понедельник недели: у нас неделя начинается с понедельника, а не с воскресенья. */
const monday = (d: Date) => addDays(d, -((d.getUTCDay() + 6) % 7));
const sameDay = (a: string, b?: string) => !!b && a === b;

/** Дата словами: «12 марта», с годом — «12 марта 2026». */
export const dateWords = (s: string, withYear = false) => {
  const d = parse(s);
  return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ''}`;
};

/** Период словами: «12–15 марта», «28 февраля — 2 марта». */
export const periodWords = (from: string, till?: string) => {
  if (!till || till === from) return dateWords(from);
  const a = parse(from);
  const b = parse(till);
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()}–${b.getUTCDate()} ${MONTHS_GEN[a.getUTCMonth()]}`
    : `${dateWords(from)} — ${dateWords(till)}`;
};

/* ── Событие ────────────────────────────────────────────────────── */

export type CalTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

/** Событие календаря: турнир, семинар, срок подачи заявок.
    `till` не задан — событие однодневное. */
export type CalEvent = {
  id: string;
  nm: string;
  /** ГГГГ-ММ-ДД */
  from: string;
  /** ГГГГ-ММ-ДД включительно */
  till?: string;
  tone?: CalTone;
  /** Вторая строка в поповере/списке: город, состояние. */
  sub?: string;
  /** Экран, куда ведёт событие (карта флоу). */
  to?: string;
};

/* Тона событий. Полоса — заливка светлая, текст тёмный: полос на месяце
   бывает по три в день, и сплошная заливка превращает месяц в лоскут. */
const BAR: Record<CalTone, string> = {
  accent: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
  success: 'bg-green-100 text-green-900 hover:bg-green-200',
  warning: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
  danger: 'bg-red-100 text-red-900 hover:bg-red-200',
  neutral: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
};
const DOT: Record<CalTone, string> = {
  accent: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-neutral-400',
};

/* ── Месяц ──────────────────────────────────────────────────────── */

/** Отрезок события внутри одной недели: с какой колонки и на сколько дней. */
type Seg = { ev: CalEvent; col: number; span: number; startsHere: boolean; endsHere: boolean };

/** Разложить события недели по дорожкам, чтобы полосы не наезжали.
    Длинные вперёд: короткое событие легко подставить в свободное место,
    длинное — нет, и оно уезжало бы на пятую дорожку при трёх занятых днях. */
function lanesOf(week: Date[], events: CalEvent[]): Seg[][] {
  const first = week[0];
  const last = week[6];
  const segs: Seg[] = [];
  for (const ev of events) {
    const a = parse(ev.from);
    const b = ev.till ? parse(ev.till) : a;
    if (b < first || a > last) continue;
    const s = a < first ? first : a;
    const e = b > last ? last : b;
    const col = Math.round((s.getTime() - first.getTime()) / 86400000);
    const span = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    segs.push({ ev, col, span, startsHere: a >= first, endsHere: b <= last });
  }
  segs.sort((x, y) => y.span - x.span || x.col - y.col);
  const lanes: Seg[][] = [];
  for (const seg of segs) {
    const lane = lanes.find((l) => l.every((s) => seg.col >= s.col + s.span || seg.col + seg.span <= s.col));
    if (lane) lane.push(seg);
    else lanes.push([seg]);
  }
  return lanes;
}

/** Сетка месяца с многодневными полосами.

    `maxLanes` держит высоту клетки: лишние события сворачиваются в «ещё N» —
    иначе один насыщенный месяц растягивает сетку на два экрана. */
export function MonthGrid({
  month,
  events,
  today,
  selected,
  onPick,
  maxLanes = 3,
}: {
  /** Любая дата нужного месяца, ГГГГ-ММ-ДД. */
  month: string;
  events: CalEvent[];
  today?: string;
  selected?: string;
  onPick?: (day: string) => void;
  maxLanes?: number;
}) {
  const cur = parse(month);
  const m = cur.getUTCMonth();
  const start = monday(new Date(Date.UTC(cur.getUTCFullYear(), m, 1)));
  const endOfMonth = new Date(Date.UTC(cur.getUTCFullYear(), m + 1, 0));
  const weeks: Date[][] = [];
  for (let d = start; d <= endOfMonth || weeks.length < 5; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
    if (weeks.length >= 6) break;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={'px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider ' + (i > 4 ? 'text-neutral-300' : 'text-neutral-400')}
          >
            {w}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const lanes = lanesOf(week, events);
        const shown = lanes.slice(0, maxLanes);
        const hidden = lanes.slice(maxLanes);
        return (
          <div key={wi} className={'relative grid grid-cols-7 ' + (wi > 0 ? 'border-t border-neutral-100' : '')}>
            {/* Подложка: клетки дней с числами. Числа и полосы разведены по
                слоям — иначе полоса на несколько дней не пересечёт границу. */}
            {week.map((d) => {
              const key = iso(d);
              const out = d.getUTCMonth() !== m;
              const isToday = sameDay(key, today);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onPick?.(key)}
                  className={
                    /* 92 px — шесть недель месяца укладываются в рабочую
                       область ноутбука без прокрутки, а три полосы событий в
                       клетку помещаются. */
                    'flex min-h-[92px] flex-col items-start border-l border-neutral-100 px-1.5 pt-1.5 text-left first:border-l-0 ' +
                    (out ? 'bg-neutral-50/60 ' : '') +
                    (sameDay(key, selected) ? 'bg-blue-50/70 ' : 'hover:bg-neutral-50 ')
                  }
                >
                  <span
                    className={
                      'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[12.5px] tabular-nums ' +
                      (isToday
                        ? 'bg-blue-600 font-semibold text-white'
                        : out
                        ? 'text-neutral-300'
                        : 'font-medium text-neutral-700')
                    }
                  >
                    {d.getUTCDate()}
                  </span>
                </button>
              );
            })}

            {/* Слой полос: события лежат поверх клеток, ниже чисел. */}
            <div className="pointer-events-none absolute inset-x-0 top-9 flex flex-col gap-1 pb-1">
              {shown.map((lane, li) => (
                <div key={li} className="grid grid-cols-7 gap-1 px-1">
                  {lane.map((s) => (
                    <button
                      key={s.ev.id}
                      type="button"
                      data-to={s.ev.to}
                      title={`${s.ev.nm}${s.ev.sub ? ` · ${s.ev.sub}` : ''} · ${periodWords(s.ev.from, s.ev.till)}`}
                      style={{ gridColumn: `${s.col + 1} / span ${s.span}` }}
                      className={
                        'pointer-events-auto flex items-center gap-1 overflow-hidden px-1.5 py-0.5 text-left text-[11.5px] font-medium ' +
                        BAR[s.ev.tone ?? 'accent'] +
                        /* Скруглён тот край, где событие действительно
                           начинается или кончается: обрезанный неделей край
                           оставлен прямым — по нему видно, что продолжение
                           на соседней строке. */
                        (s.startsHere ? ' rounded-l-md' : '') +
                        (s.endsHere ? ' rounded-r-md' : '')
                      }
                    >
                      <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + DOT[s.ev.tone ?? 'accent']} />
                      <span className="truncate">{s.ev.nm}</span>
                    </button>
                  ))}
                </div>
              ))}
              {hidden.length > 0 && (
                <div className="grid grid-cols-7 gap-1 px-1">
                  {/* «Ещё N» встаёт в тот день, где событие начинается. */}
                  {hidden.flat().map((s) => (
                    <span
                      key={s.ev.id}
                      style={{ gridColumn: `${s.col + 1} / span 1` }}
                      className="px-1.5 text-[11px] text-neutral-400"
                    >
                      ещё 1
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Мини-месяц ─────────────────────────────────────────────────── */

/** Маленький месяц: выбор даты рядом со списком (сайдбар Google Calendar).
    События показаны точкой под числом — подписи в такой размер не влезают. */
export function MiniMonth({
  month,
  events = [],
  today,
  selected,
  onPick,
}: {
  month: string;
  events?: CalEvent[];
  today?: string;
  selected?: string;
  onPick?: (day: string) => void;
}) {
  const cur = parse(month);
  const m = cur.getUTCMonth();
  const start = monday(new Date(Date.UTC(cur.getUTCFullYear(), m, 1)));
  /* Недель ровно столько же, сколько в большой сетке: при жёстких шести
     появлялась лишняя строка следующего месяца, и точка события на ней
     показывала старт, которого в самой сетке нет. */
  const endOfMonth = new Date(Date.UTC(cur.getUTCFullYear(), m + 1, 0));
  const weeksCount = Math.max(5, Math.ceil((Math.round((endOfMonth.getTime() - start.getTime()) / 86400000) + 1) / 7));
  const days = Array.from({ length: weeksCount * 7 }, (_, i) => addDays(start, i));
  const busy = new Set<string>();
  for (const ev of events) {
    const b = ev.till ? parse(ev.till) : parse(ev.from);
    for (let d = parse(ev.from); d <= b; d = addDays(d, 1)) busy.add(iso(d));
  }
  return (
    <div className="w-fit">
      <div className="mb-1 px-1 text-[12.5px] font-semibold">
        {MONTHS[m]} {cur.getUTCFullYear()}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-0.5 text-center text-[10px] font-semibold uppercase text-neutral-400">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const key = iso(d);
          const out = d.getUTCMonth() !== m;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick?.(key)}
              className={
                'relative flex h-7 w-7 items-center justify-center rounded-full text-[12px] tabular-nums ' +
                (sameDay(key, today)
                  ? 'bg-blue-600 font-semibold text-white'
                  : sameDay(key, selected)
                  ? 'bg-blue-50 font-semibold text-blue-700'
                  : out
                  ? 'text-neutral-300'
                  : 'text-neutral-700 hover:bg-neutral-100')
              }
            >
              {d.getUTCDate()}
              {busy.has(key) && !sameDay(key, today) && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Шкала времени: неделя или игровой день ─────────────────────── */

/** Блок на шкале времени: матч на столе, семинар, окно приёма.
    `col` — в какой колонке стоит (день недели ГГГГ-ММ-ДД либо имя стола). */
export type SlotEvent = {
  id: string;
  col: string;
  /** ЧЧ:ММ */
  from: string;
  till: string;
  nm: string;
  sub?: string;
  tone?: CalTone;
  to?: string;
};

const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/* Блок на шкале — заливка плотнее, чем у полосы месяца: на светлой сетке
   часов бледная заливка не читается как объект. */
const SLOT: Record<CalTone, string> = {
  accent: 'border-blue-300 bg-blue-50 text-blue-900',
  success: 'border-green-300 bg-green-50 text-green-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  danger: 'border-red-300 bg-red-50 text-red-900',
  neutral: 'border-neutral-300 bg-neutral-50 text-neutral-700',
};

/** Сетка «часы × колонки»: неделя (колонки — дни) или игровой день
    (колонки — столы). Тем же приёмом, что недельный вид Google Calendar.

    Пересекающиеся блоки в одной колонке делятся по ширине: два матча на одном
    столе в одно время — это ошибка расписания, и её видно, а не спрятано. */
export function TimeGrid({
  cols,
  events,
  from = 9,
  till = 20,
  hourPx = 52,
  nowLine,
}: {
  /** Колонки: ключ и подпись (день — {key:'2026-03-12', t:'Чт 12'}). */
  cols: { key: string; t: string; sub?: string }[];
  events: SlotEvent[];
  /** Первый и последний час шкалы. */
  from?: number;
  till?: number;
  hourPx?: number;
  /** Линия «сейчас», ЧЧ:ММ — как красная линия текущего времени в Google. */
  nowLine?: string;
}) {
  const hours = Array.from({ length: till - from + 1 }, (_, i) => from + i);
  /* Высота полотна — по числу ЧАСОВЫХ ПРОМЕЖУТКОВ, а не подписей: иначе под
     последним часом остаётся пустая строка и читается как «после 19:00 ещё
     есть окно». */
  const totalH = (till - from) * hourPx;
  const top = (t: string) => ((mins(t) - from * 60) / 60) * hourPx;
  const height = (a: string, b: string) => Math.max(18, ((mins(b) - mins(a)) / 60) * hourPx);
  /* Сколько подробностей влезает во вторую строку блока — зависит от того,
     сколько колонок делят ширину. Зал на полтора десятка столов даёт колонку
     ýже полусотни пикселей, и период «10:00–12:30» превращается в огрызок
     «10:0…»: там печатаем только начало, а конец видно по высоте блока.
     Уточнение (`sub`) переживает только широкую сетку. */
  const dense = cols.length > 8;
  const roomy = cols.length <= 5;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Шапка колонок; левый столбец пуст — под шкалой часов.
          `min-w-0` обязателен: без него длинная подпись (`sub`) распирает свою
          ячейку по содержимому и отбирает ширину у остальных — шапка перестаёт
          совпадать с колонками тела, и номер стола повисает на разделителе. */}
      <div className="flex border-b border-neutral-200 bg-neutral-50">
        <div className="w-14 shrink-0" />
        {cols.map((c) => (
          <div key={c.key} className="min-w-0 flex-1 border-l border-neutral-200 px-2 py-1.5 leading-tight">
            <div className="truncate text-[12.5px] font-semibold">{c.t}</div>
            {c.sub && <div className="truncate text-[11px] text-neutral-500">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Шкала часов: подпись стоит на своей линии, поэтому приподнята на
            пол-строки. У первого часа сдвига нет — иначе она заезжает под
            границу шапки и выглядит зачёркнутой. */}
        <div className="relative w-14 shrink-0" style={{ height: totalH }}>
          {hours.map((h, i) => (
            <span
              key={h}
              className="absolute right-2 text-[11px] tabular-nums text-neutral-400"
              style={{ top: i * hourPx - (i === 0 ? 0 : 8) }}
            >
              {d2(h)}:00
            </span>
          ))}
        </div>

        {cols.map((c, ci) => {
          const own = events.filter((e) => e.col === c.key);
          return (
            <div key={c.key} className="relative min-w-0 flex-1 border-l border-neutral-200" style={{ height: totalH }}>
              {/* Часовые линии: сетка, по которой глаз считает время. */}
              {hours.map((h, i) => (
                <div key={h} className="absolute inset-x-0 border-t border-neutral-100" style={{ top: i * hourPx }} />
              ))}

              {own.map((e) => {
                /* Сколько блоков этой колонки пересекается с этим по времени —
                   столько долей ширины, и наш индекс среди них. */
                const clash = own.filter((o) => mins(o.from) < mins(e.till) && mins(o.till) > mins(e.from));
                const idx = clash.findIndex((o) => o.id === e.id);
                const w = 100 / clash.length;
                const h = height(e.from, e.till);
                return (
                  <button
                    key={e.id}
                    type="button"
                    data-to={e.to}
                    title={`${e.nm} · ${e.from}–${e.till}${e.sub ? ` · ${e.sub}` : ''}`}
                    /* `flex-col justify-start` обязателен: кнопка по умолчанию
                       центрирует содержимое по вертикали, и у длинного блока
                       подпись уезжала в середину — матч на 2 часа выглядел
                       пустым прямоугольником, а его начало нечем было опознать.
                       Подпись стоит у времени начала, как в Google Calendar. */
                    className={
                      'absolute flex flex-col items-stretch justify-start overflow-hidden rounded-md border px-1.5 py-1 text-left leading-tight ' +
                      SLOT[e.tone ?? 'accent']
                    }
                    style={{
                      top: top(e.from) + 1,
                      height: h - 2,
                      left: `calc(${idx * w}% + 2px)`,
                      width: `calc(${w}% - 4px)`,
                    }}
                  >
                    <span className="block truncate text-[11.5px] font-semibold">{e.nm}</span>
                    {/* Вторая строка только там, где она целиком помещается:
                        огрызок «10:0…» хуже, чем её отсутствие, — время всё
                        равно читается по оси слева и по высоте блока. */}
                    {h >= 34 && (
                      <span className="block truncate text-[10.5px] opacity-70">
                        {dense
                          ? e.from
                          : `${e.from}–${e.till}${roomy && e.sub ? ` · ${e.sub}` : ''}`}
                      </span>
                    )}
                  </button>
                );
              })}

              {nowLine && mins(nowLine) >= from * 60 && mins(nowLine) <= till * 60 && (
                /* Линия идёт через все колонки, а кружок один — у шкалы часов:
                   в каждой колонке он читался бы как отдельная отметка. */
                <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: top(nowLine) }}>
                  <div className="h-px bg-red-500" />
                  {ci === 0 && <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Календарь целиком: шапка и вид ─────────────────────────────── */

export type CalView = 'Месяц' | 'Неделя' | 'День';

/** Шапка календаря: период, стрелки, «Сегодня» и переключатель вида.

    Стрелки в макете не листают: месяц задан данными экрана, а листание без
    данных за соседний месяц показало бы пустую сетку и соврало бы. Вид
    переключается по-настоящему — он и есть смысл переключателя. */
export function Calendar({
  month,
  events = [],
  slots = [],
  cols = [],
  today,
  view: initial = 'Месяц',
  views = ['Месяц', 'Неделя'],
  side,
  nowLine,
  hours,
}: {
  month: string;
  events?: CalEvent[];
  slots?: SlotEvent[];
  cols?: { key: string; t: string; sub?: string }[];
  today?: string;
  view?: CalView;
  views?: CalView[];
  /** Что стоит слева от сетки: мини-месяц, список ближайших. */
  side?: ReactNode;
  nowLine?: string;
  hours?: { from: number; till: number };
}) {
  const [view, setView] = useState<CalView>(initial);
  const [selected, setSelected] = useState<string | undefined>(today);
  const cur = parse(month);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-3 py-2.5">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          className="rounded-md border border-neutral-300 px-2.5 py-1 text-[12.5px] font-medium hover:bg-neutral-50"
        >
          Сегодня
        </button>
        <h3 className="text-[15px] font-semibold">
          {MONTHS[cur.getUTCMonth()]} {cur.getUTCFullYear()}
        </h3>
        <div className="ml-auto inline-flex gap-1 rounded-lg bg-neutral-100 p-1">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              aria-selected={v === view}
              onClick={() => setView(v)}
              className={
                'rounded-md px-2.5 py-1 text-[12.5px] font-medium ' +
                (v === view ? 'on bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')
              }
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 p-3">
        {side && <div className="w-56 shrink-0">{side}</div>}
        <div className="min-w-0 flex-1">
          {view === 'Месяц' ? (
            <MonthGrid
              month={month}
              events={events}
              today={today}
              selected={selected}
              onPick={setSelected}
            />
          ) : (
            <TimeGrid
              cols={cols}
              events={slots}
              nowLine={nowLine}
              from={hours?.from}
              till={hours?.till}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Лента событий: дата слева, карточка справа ─────────────────── */

/** Событие ленты. `till` — многодневное: в дате показывается период. */
export type TimelineItem = {
  id: string;
  /** ГГГГ-ММ-ДД */
  from: string;
  till?: string;
  nm: string;
  sub?: string;
  tone?: CalTone;
  /** Правый край карточки: значок состояния, срок, кнопка. */
  right?: ReactNode;
  /** Что под названием: условия допуска, счёт, состав. */
  children?: ReactNode;
  to?: string;
};

const RAIL: Record<CalTone, string> = {
  accent: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-neutral-400',
};

/** Лента событий ✳ (30.08.2026): слева дата, справа карточка, даты нанизаны
    на общую линию.

    Зачем отдельно от `MonthGrid`. Сетка месяца отвечает на «где в календаре
    дыра и что на что накладывается», но подпись в клетке короткая, и по ней
    не решить, идти ли на турнир. Лента отвечает на другой вопрос — «что
    дальше по порядку»: дата вынесена в свою колонку, а справа полноценная
    карточка с условиями и действием. На телефоне это единственный читаемый
    вид календаря: сетка в 392 px не разворачивается.

    Линия рисуется отрезками в самой строке, а не абсолютной полосой на весь
    список: у первой строки верхний отрезок и у последней нижний срезаны, и
    лента не начинается и не кончается «оборванным проводом». */
export function EventTimeline({
  items,
  today,
  months = true,
}: {
  items: TimelineItem[];
  today?: string;
  /** Разделитель месяца между строками: в сезонном списке иначе теряется, где
      кончился март. */
  months?: boolean;
}) {
  let lastMonth = '';
  return (
    <div className="grid grid-cols-[56px_18px_1fr] gap-x-2">
      {items.map((it, i) => {
        const d = parse(it.from);
        const monthKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        const newMonth = months && monthKey !== lastMonth;
        lastMonth = monthKey;
        const tone = it.tone ?? 'accent';
        const isToday = sameDay(it.from, today);
        return (
          <Fragment key={it.id}>
            {newMonth && (
              <div className="col-span-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {MONTHS[d.getUTCMonth()]} {d.getUTCFullYear()}
              </div>
            )}

            {/* Дата: число крупно, под ним месяц и день недели — по числу глаз
                и ведёт счёт, остальное подпись. */}
            <div className="pt-2.5 text-right leading-tight">
              <div className={'text-[17px] font-semibold tabular-nums ' + (isToday ? 'text-blue-600' : '')}>
                {d.getUTCDate()}
                {it.till && it.till !== it.from && (
                  <span className="text-neutral-400">–{parse(it.till).getUTCDate()}</span>
                )}
              </div>
              <div className="text-[11px] text-neutral-500">{MONTHS_GEN[d.getUTCMonth()]}</div>
              <div className="text-[11px] text-neutral-400">{WEEKDAYS[(d.getUTCDay() + 6) % 7]}</div>
            </div>

            {/* Рельс: отрезок линии и точка события. */}
            <div className="relative">
              <span className={'absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 ' + (i === 0 ? '' : 'bg-neutral-200')} />
              <span
                className={
                  'absolute left-1/2 top-3.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full ' +
                  RAIL[tone] +
                  (isToday ? ' ring-4 ring-blue-100' : '')
                }
              />
              <span
                className={
                  'absolute left-1/2 bottom-0 top-6 w-px -translate-x-1/2 ' +
                  (i === items.length - 1 ? '' : 'bg-neutral-200')
                }
              />
            </div>

            {/* Карточка события. */}
            <div className="pb-3">
              <div
                data-to={it.to}
                data-row
                className={
                  'rounded-xl border bg-white p-3 shadow-sm ' +
                  (isToday ? 'border-blue-200' : 'border-neutral-200') +
                  (it.to ? ' cursor-pointer hover:border-neutral-300' : '')
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 leading-tight">
                    <div className="text-[13.5px] font-semibold">{it.nm}</div>
                    {it.sub && <div className="mt-0.5 text-xs text-neutral-500">{it.sub}</div>}
                  </div>
                  {it.right && <div className="shrink-0">{it.right}</div>}
                </div>
                {it.children && <div className="mt-2.5">{it.children}</div>}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

/** Список событий дня рядом с календарём: то, что в сетке не помещается
    подписью. Точка тона, время, название, вторая строка. */
export const DayList = ({
  title,
  items,
}: {
  title: string;
  items: { id: string; t: string; nm: string; sub?: string; tone?: CalTone; to?: string }[];
}) => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
    <div className="border-b border-neutral-100 px-3 py-2 text-[12.5px] font-semibold">{title}</div>
    {items.length === 0 ? (
      <div className="px-3 py-6 text-center text-[12.5px] text-neutral-400">В этот день ничего нет</div>
    ) : (
      items.map((i) => (
        <button
          key={i.id}
          type="button"
          data-to={i.to}
          data-row
          className="flex w-full items-start gap-2 border-t border-neutral-100 px-3 py-2 text-left first:border-t-0 hover:bg-neutral-50"
        >
          <span className={'mt-1.5 h-2 w-2 shrink-0 rounded-full ' + DOT[i.tone ?? 'accent']} />
          {/* Колонка под «весь день», а не только под «10:00»: у события на
              весь день подпись иначе ломалась на две строки. */}
          <span className="w-14 shrink-0 text-[12px] tabular-nums text-neutral-500">{i.t}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[12.5px] font-medium">{i.nm}</span>
            {i.sub && <span className="block text-[11.5px] text-neutral-500">{i.sub}</span>}
          </span>
        </button>
      ))
    )}
  </div>
);
