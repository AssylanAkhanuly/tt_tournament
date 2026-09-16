/* Графики нового слоя ✳ (31.08.2026).

   Числа в реестрах отвечают на «сколько», но не на «из чего сложилось» и не на
   «как менялось». Судья, глядя на «R = 9», не видит, что весь балл у него из
   S1, а S3 и S4 пустые; экономист по столбику «оплачено» не видит, какая доля
   турнира ещё не заплатила. На это отвечает форма, а не строка таблицы.

   Два вида, больше пока не заводим:

   - **кольцо** (`Donut`) — из чего сложилось целое: слагаемые рейтинга, статусы
     оплат. Легенда стоит рядом со значениями: круг отвечает «какая доля»,
     подпись — «сколько именно», и одно без другого бесполезно;
   - **столбики** (`Bars`) — как менялось по шагам: турниры сезона, месяцы.

   Холст настоящий (Chart.js), а не нарисованный прямоугольниками: см. `mockups/
   chart.tsx` — там же токены темы, потому что холст `var(--…)` не понимает.

   Палитра берётся из токенов, сырых цветов здесь нет. */

import { useCallback, type ReactNode } from 'react';
import type { ChartTypeRegistry, TooltipItem } from 'chart.js';
import { ChartBox, soft, token } from '../chart';

/** Доли кольца по умолчанию — шкала акцента, а не светофор ✳. Слагаемые
    рейтинга не бывают «хорошими» и «плохими»: S4 = 0 покрасить красным значило
    бы сказать «ошибка», хотя это просто «семинаров пока не было». Светофор
    берём только там, где он про состояние, — у оплат и допусков (`tone`). */
const PALETTE = ['--c-accent', '--c-accent-2', '--c-accent-3', '--c-dim', '--c-line'];

const TONE = { ok: '--c-success', warn: '--c-warning', bad: '--c-danger' } as const;

export type Part = {
  t: string;
  v: number;
  note?: string;
  /** Состояние, а не доля: оплачено — зелёным, просрочено — красным. */
  tone?: keyof typeof TONE;
};

/** Токен доли: состояние важнее позиции в списке. */
const partToken = (p: Part, i: number) => (p.tone ? TONE[p.tone] : PALETTE[i % PALETTE.length]);

/** Кольцо: из чего сложилось целое. В середине — итог, ради которого пришли. */
export function Donut({
  parts,
  total,
  totalNote,
  height = 190,
  label,
}: {
  parts: Part[];
  /** Что написать в середине кольца; без него середина пустая. */
  total?: string;
  totalNote?: string;
  height?: number;
  label: string;
}) {
  const make = useCallback(
    (el: HTMLCanvasElement) => ({
      type: 'doughnut' as const,
      data: {
        labels: parts.map((p) => p.t),
        datasets: [
          {
            data: parts.map((p) => p.v),
            backgroundColor: parts.map((p, i) => token(partToken(p, i), el)),
            borderWidth: 0,
            /* Дырка крупная: в неё встаёт итог, и кольцо перестаёт быть
               украшением — оно подпись к числу, а не наоборот. */
            cutout: '68%',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    }),
    [parts],
  );
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ChartBox make={make} height={height} label={label} />
        {total && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="text-2xl font-bold tabular-nums">{total}</span>
            {totalNote && <span className="text-[11px] text-neutral-500">{totalNote}</span>}
          </div>
        )}
      </div>
      {/* Легенда со значениями: круг отвечает «какая доля», строка — «сколько». */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {parts.map((p, i) => (
          <div key={p.t} className="flex items-baseline gap-2.5 text-[13px]">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ background: `var(${partToken(p, i)})` }}
            />
            <span className="min-w-0 flex-1 truncate text-neutral-600">{p.t}</span>
            {p.note && <span className="shrink-0 text-[11px] text-neutral-400">{p.note}</span>}
            <span className="shrink-0 font-semibold tabular-nums">{p.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Столбики: как менялось по шагам. Значения подписаны под осью, а не в
    подсказке: макет читают глазами, наводить мышь на картинку никто не будет. */
export function Bars({
  items,
  height = 200,
  label,
  suffix,
}: {
  items: { t: string; v: number; on?: boolean }[];
  height?: number;
  label: string;
  /** Единица у оси: «баллов», «₸». */
  suffix?: string;
  }) {
  const make = useCallback(
    (el: HTMLCanvasElement) => ({
      type: 'bar' as const,
      data: {
        labels: items.map((i) => i.t),
        datasets: [
          {
            data: items.map((i) => i.v),
            /* Выделенный столбик — тот, про который экран: «мой турнир»,
               «текущий месяц». Остальные приглушены, иначе график спорит
               с таблицей за внимание. */
            backgroundColor: items.map((i) => (i.on ? token('--c-accent', el) : soft('--c-accent', 35, el))),
            /* Столбик прямоугольный: углы интерфейса в системе прямые
               (`--r-*` = 0), и график из этого правила не выпадает. */
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: token('--c-dim', el) } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: token('--c-line', el) },
            ticks: { color: token('--c-dim', el), precision: 0 },
          },
        },
      },
    }),
    [items],
  );
  return (
    <div>
      <ChartBox make={make} height={height} label={label} />
      {suffix && <div className="mt-1 text-right text-[11px] text-neutral-400">{suffix}</div>}
    </div>
  );
}

/** Две половины одного ответа рядом: слева форма, справа список. На узком
    кадре встают одна под другой — на телефоне график не сжимаем. */
export const ChartRow = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 md:grid-cols-2">{children}</div>
);

/** Точка линии: значение на дату плюс то, что за ней стоит. */
export type Point = {
  /** Подпись на оси: дата. */
  t: string;
  v: number;
  /** Заголовок подсказки: турнир или основание записи. */
  note?: string;
  /** Строки подсказки: значение с изменением, соперник, основание. */
  lines?: string[];
  /** Чем кончилось: в плюс или в минус — этим красится точка. */
  tone?: 'up' | 'down';
};

/** Линия: как менялось значение во времени ✳ (16.09.2026).

    Вид взят у кривой рейтинга из макетов профиля спортсмена (`design/src/design/
    role14h2h.tsx`, `role14mobile5.tsx`): сглаженная линия с мягкой заливкой,
    точки покрашены по знаку изменения — зелёная в плюс, красная в минус, — так
    видно не только уровень, но и чем кончился каждый турнир.

    Таблица отвечает «что было в каждой записи», линия — «куда движется»: по ней
    видно провал после неявки и рост за сезон, чего в столбце чисел не
    разглядеть. Что стоит за точкой (турнир, неявка, исправление), говорит
    подсказка: подписей столько же, сколько точек, и на оси они не помещаются. */
export function Line({
  points,
  height = 240,
  label,
}: {
  points: Point[];
  height?: number;
  label: string;
}) {
  const make = useCallback(
    (el: HTMLCanvasElement) => {
      const values = points.map((p) => p.v);
      /* Шкала по данным, а не от нуля, и с запасом: у рейтинга изменения в
         сотых, и на плотной шкале ступенька в 0,01 выглядела бы обрывом. */
      const span = Math.max(...values) - Math.min(...values);
      const pad = Math.max(0.3, span * 0.2);
      return {
        type: 'line' as const,
        data: {
          labels: points.map((p) => p.t),
          datasets: [
            {
              data: values,
              borderColor: token('--c-accent', el, '--primary'),
              backgroundColor: soft('--c-accent', 14, el, '--primary'),
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              /* Точки у длинной истории не рисуются: полсотни кружков сливаются
                 в пунктир. Подсказка работает всё равно — она по индексу. */
              pointRadius: points.length > 40 ? 0 : 4,
              pointHoverRadius: 6,
              pointBorderWidth: 2,
              pointBorderColor: token('--c-panel', el, '--card'),
              pointBackgroundColor: points.map((p) =>
                p.tone === 'up'
                  ? token('--c-success', el, '--success')
                  : p.tone === 'down'
                    ? token('--c-danger', el, '--danger')
                    : token('--c-accent', el, '--primary'),
              ),
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          /* Подсказка ловится по вертикали: попасть мышью в кружок трудно, а
             ответ нужен про дату под курсором. */
          interaction: { mode: 'index' as const, intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items: TooltipItem<keyof ChartTypeRegistry>[]) =>
                  points[items[0]?.dataIndex ?? 0]?.note ?? '',
                label: (item: TooltipItem<keyof ChartTypeRegistry>) => points[item.dataIndex]?.lines ?? [],
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: token('--c-dim', el, '--muted'),
                font: { size: 10 },
                maxRotation: 0,
                autoSkipPadding: 16,
              },
            },
            y: {
              min: Math.min(...values) - pad,
              max: Math.max(...values) + pad,
              border: { display: false },
              grid: { color: token('--c-line', el, '--line') },
              ticks: {
                color: token('--c-dim', el, '--muted'),
                font: { size: 10 },
                // Разделитель — запятая: рейтинг всюду пишется 50,30 (п. 6.4).
                callback: (v: string | number) => Number(v).toFixed(2).replace('.', ','),
              },
            },
          },
        },
      };
    },
    [points],
  );
  return <ChartBox make={make} height={height} label={label} />;
}
