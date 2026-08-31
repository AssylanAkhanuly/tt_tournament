/* Доменные компоненты нового слоя (HeroUI) ✳ (30.08.2026).

   Промежуточный этаж между библиотекой и экранами ролей: строка сезона,
   очередь «требует внимания», строка реестра, счёт матча — вещи, которые
   повторяются у половины ролей и обязаны выглядеть одинаково. Экран роли
   собирается из них, а не из голых Chip и Table.

   API повторяет старый слой (`mockups/shell.tsx`) там, где у ролей уже есть
   данные под него (SeasonRow, AttnItem, Row): содержимое экранов переносится
   без переписывания, меняется подача.

   Крючки карты флоу: переходы — `data-to`, строки списков — `data-row`,
   переключатели — `data-seg` на обёртке. */

import { useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronRight, Search as SearchIcon, X } from 'lucide-react';
import { Avatar, Button, Chip, Input, InputGroup, Separator } from '@heroui/react';

/* ── Словари состояний ───────────────────────────────────────────────
   Перенесены из старого слоя как есть: словарь — проектное решение (порядок
   жизни заявки и состояния турнира по TZ §4.3), а не стиль. */

type ChipColor = 'accent' | 'danger' | 'default' | 'success' | 'warning';
type StDef = { t: string; color: ChipColor; dot?: boolean };

/** Что происходит с НАШЕЙ заявкой или составом (регион, клуб, судья). */
export const ST = {
  claim: { t: 'ПРИЁМ ЗАЯВОК', color: 'accent' as ChipColor },
  wait: { t: 'ЖДЁТ ДОПУСКА', color: 'warning' as ChipColor },
  reserve: { t: 'В РЕЗЕРВЕ', color: 'default' as ChipColor },
  no: { t: 'ОТКЛОНЕНА', color: 'danger' as ChipColor },
  ready: { t: 'СОСТАВ ПОДТВЕРЖДЁН', color: 'success' as ChipColor },
  assigned: { t: 'НАЗНАЧЕН', color: 'success' as ChipColor },
  live: { t: 'ИДЁТ', color: 'success' as ChipColor, dot: true },
  done: { t: 'ЗАВЕРШЁН', color: 'default' as ChipColor },
} satisfies Record<string, StDef>;
export type St = keyof typeof ST;

/** Состояние самого ТУРНИРА (TZ §4.3) — глазами председателя ГСК. */
export const TST = {
  draft: { t: 'ЧЕРНОВИК', color: 'default' as ChipColor },
  judges: { t: 'ЗАЯВКИ СУДЕЙ', color: 'warning' as ChipColor },
  judge: { t: 'СУДЬЯ НАЗНАЧЕН', color: 'accent' as ChipColor },
  players: { t: 'ЗАЯВКИ ИГРОКОВ', color: 'accent' as ChipColor },
  system: { t: 'СИСТЕМА ПРОВЕДЕНИЯ', color: 'accent' as ChipColor },
  live: { t: 'ИДЁТ', color: 'success' as ChipColor, dot: true },
  protocol: { t: 'ИТОГОВЫЙ ПРОТОКОЛ', color: 'warning' as ChipColor },
  done: { t: 'ЗАВЕРШЁН', color: 'default' as ChipColor },
  /* Девятое состояние ✳ (01.09.2026): отмена перестала быть действием без
     состояния. Отменённый турнир остаётся в календаре с причиной, а сыгранные
     до отмены матчи — в истории игрока, но вне рейтинга (TZ §4.3). */
  cancelled: { t: 'ОТМЕНЁН', color: 'danger' as ChipColor },
} satisfies Record<string, StDef>;
export type TSt = keyof typeof TST;

/** Значок состояния: единственный способ покрасить состояние на экране. */
export const StatusChip = ({ st, tst }: { st?: St; tst?: TSt }) => {
  const d: StDef = tst ? TST[tst] : ST[st ?? 'done'];
  return (
    <Chip className="whitespace-nowrap" color={d.color} size="sm" variant={d.color === 'default' ? 'soft' : 'primary'}>
      {d.dot && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />}
      {d.t}
    </Chip>
  );
};

/** Свободный значок тем же кеглем — где словари не подходят («НА ИСПРАВЛЕНИИ»). */
export const Pill = ({ t, color = 'default' }: { t: string; color?: ChipColor }) => (
  <Chip className="whitespace-nowrap" color={color} size="sm" variant={color === 'default' ? 'soft' : 'primary'}>
    {t}
  </Chip>
);

/* ── Панель и заголовки ─────────────────────────────────────────── */

/** Панель — основной блок рабочей области: белая карточка на сером холсте. */
export function Panel({
  title,
  sub,
  extra,
  flush,
  children,
}: {
  title?: string;
  sub?: string;
  /** Правый край заголовка: переключатель, счётчик, действие. */
  extra?: ReactNode;
  /** Тело без внутренних отступов — для таблиц и списков во всю ширину. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div className="leading-tight">
            <h3 className="text-[13.5px] font-semibold">{title}</h3>
            {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
          </div>
          {extra}
        </div>
      )}
      <div className={flush ? undefined : 'p-4'}>{children}</div>
    </section>
  );
}

/* ── Показатели и очередь ───────────────────────────────────────── */

const TILE_TONE = { g: 'text-green-700', a: 'text-amber-600', b: 'text-red-600' } as const;

/** Плитки-счётчики: «как идёт сезон» одной строкой над рабочей областью. */
export function StatTiles({
  items,
  to,
}: {
  items: { v: string; k: string; tone?: keyof typeof TILE_TONE; to?: string }[];
  to?: string;
}) {
  return (
    <div className="mb-4 grid auto-cols-fr grid-flow-col gap-3">
      {items.map((c) => (
        <button
          key={c.k}
          type="button"
          data-to={c.to ?? to}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm hover:border-neutral-300"
        >
          <div className={'text-xl font-semibold tabular-nums tracking-tight ' + (c.tone ? TILE_TONE[c.tone] : '')}>
            {c.v}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">{c.k}</div>
        </button>
      ))}
    </div>
  );
}

/** Строка внутри счётчика очереди: одно дело — что, почему и кто снимает. */
export type AttnRow = {
  nm: string;
  mt: string;
  why: string;
  who: string;
  to?: string;
  cls?: 'bad';
};
export type AttnItem = { n: string; t: string; rows: AttnRow[] };

/** Очередь «Требует внимания»: счётчики, в каждый можно провалиться.
    API старого слоя — данные ролей переносятся как есть. */
export function Attention({
  items,
  act = true,
  action,
  max,
}: {
  items: AttnItem[];
  /** У наблюдателей переходов и кнопок нет вовсе. */
  act?: boolean;
  /** Главное действие экрана — в одном ряду со счётчиками. */
  action?: ReactNode;
  max?: number;
}) {
  const [open, setOpen] = useState<string | null>(items[0].t);
  const cur = items.find((a) => a.t === open);
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Требует внимания
        </span>
        {items.map((a) => (
          <button
            key={a.t}
            type="button"
            aria-expanded={a.t === open}
            onClick={() => setOpen(a.t === open ? null : a.t)}
            className={
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ' +
              (a.t === open
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300')
            }
          >
            <b className="tabular-nums">{a.n}</b> {a.t}
            <ChevronDown size={13} className={a.t === open ? 'rotate-180' : undefined} />
          </button>
        ))}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {cur && (
        <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {cur.rows.slice(0, max ?? cur.rows.length).map((r, i) => (
            <button
              key={r.nm}
              type="button"
              data-to={act ? r.to : undefined}
              data-row
              className={
                'grid w-full grid-cols-[1.6fr_1fr_1fr] items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 ' +
                (i > 0 ? 'border-t border-neutral-100' : '')
              }
            >
              <span className="leading-tight">
                <span className="block text-[13.5px] font-medium">{r.nm}</span>
                <span className="block text-xs text-neutral-500">{r.mt}</span>
              </span>
              <span className="text-xs text-neutral-500">{r.who}</span>
              <span className={'text-right text-xs font-medium ' + (r.cls ? 'text-red-600' : 'text-neutral-600')}>
                {r.why}
              </span>
            </button>
          ))}
          <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-1.5 text-[11px] text-neutral-400">
            {act ? 'Строка ведёт туда, где дело снимается' : 'Только просмотр: переходов и действий у роли нет'}
            {max && max < cur.rows.length && ` · показаны ${max} из ${cur.n}`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Список сезона ──────────────────────────────────────────────── */

/** Строка сезона — форма из старого слоя, данные ролей подходят как есть. */
export type SeasonRow = {
  key: string;
  m: number;
  nm: string;
  sub: string;
  when: string;
  val: string;
  st: St;
  tst?: TSt;
  to: string;
  wait?: boolean;
};

/** Сезон одной таблицей: соревнование · когда и где · срок или итог · состояние. */
export const SeasonTable = ({ rows }: { rows: SeasonRow[] }) => (
  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <div className="grid grid-cols-[1.7fr_1.1fr_1fr_1fr_28px] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
      <span>Соревнование</span>
      <span>Когда и где</span>
      <span>Срок или итог</span>
      <span>Состояние</span>
      <span />
    </div>
    {rows.map((r, i) => (
      <button
        key={r.key}
        type="button"
        data-to={r.to}
        data-row
        className={
          'grid w-full grid-cols-[1.7fr_1.1fr_1fr_1fr_28px] items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 ' +
          (i > 0 ? 'border-t border-neutral-100' : '')
        }
      >
        <span className="leading-tight">
          <span className="block text-[13.5px] font-medium">{r.nm}</span>
          <span className="block text-xs text-neutral-500">{r.sub}</span>
        </span>
        <span className="text-[13px] text-neutral-600">{r.when}</span>
        <span className={'text-[13px] ' + (r.wait ? 'font-medium text-amber-700' : 'text-neutral-600')}>{r.val}</span>
        <span>{r.tst ? <StatusChip tst={r.tst} /> : <StatusChip st={r.st} />}</span>
        <ChevronRight size={15} className="text-neutral-300" />
      </button>
    ))}
  </div>
);

/* ── Реестры ────────────────────────────────────────────────────── */

/** Строка реестра: человек или запись, справа значение, значок и действие.
    API старого `Row` — данные переносятся как есть. */
export function Row({
  av,
  nm,
  sub,
  val,
  pill,
  action,
  onAction,
  actionTo,
  on,
  onSelect,
  to,
}: {
  av?: string;
  nm: string;
  sub: string;
  val?: string;
  pill?: { t: string; cls: 'live' | 'wait' | 'bad' | 'reg' | 'done' };
  action?: string;
  onAction?: () => void;
  actionTo?: string;
  on?: boolean;
  onSelect?: () => void;
  to?: string;
}) {
  const PILL: Record<string, ChipColor> = { live: 'success', wait: 'warning', bad: 'danger', reg: 'accent', done: 'default' };
  /* Кнопок внутри строк в системе нет ✳ (31.08.2026, решение владельца
     продукта). Кнопка в каждой строке спорит с самой строкой за клик, тянет
     под себя колонку на всю таблицу и на списке в сорок позиций превращает
     реестр в частокол одинаковых прямоугольников. Теперь строку нажимают
     целиком, а то, что было надписью на кнопке, становится главным действием
     диалога — там же видно, по кому решение принимается.

     Диалог держит сама строка, а не список: списки в макетах бывают и без
     обёртки `Rows` (внутри `Panel flush` это просто `divide-y`), и привязка к
     обёртке оставила бы половину строк без диалога. */
  const [ask, setAsk] = useState(false);
  return (
    <>
    <div
      data-to={to}
      data-row
      onClick={
        action
          ? () => {
              onSelect?.();
              setAsk(true);
            }
          : onSelect
      }
      className={
        'flex w-full items-center gap-3 px-4 py-2.5 text-left ' +
        (on ? 'bg-blue-50/60' : 'hover:bg-neutral-50') +
        (onSelect || to || action ? ' cursor-pointer' : '')
      }
    >
      {av && (
        <Avatar size="sm">
          <Avatar.Image alt={nm} src={av} />
          <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
      )}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13.5px] font-medium">{nm}</span>
        {/* Подпись переносится, а не режется: в кадрах состояний в ней живёт
            правило («второй раз подавать не нужно и нельзя»), и многоточие
            съедало самую суть. Имя выше остаётся в одну строку. */}
        <span className="block text-xs text-neutral-500">{sub}</span>
      </span>
      {val && <span className="text-[13px] font-medium tabular-nums text-neutral-700">{val}</span>}
      {pill && <Pill t={pill.t} color={PILL[pill.cls]} />}
      {/* Стрелка вместо кнопки ✳ (31.08.2026): у строки одно действие, и оно
          открывается кликом по самой строке. Стрелка — обещание, что клик
          что-то сделает, а не украшение. */}
      {action && <ChevronRight size={16} className="shrink-0 text-neutral-300" />}
    </div>
    {ask && (
      <InlineDialog
        title={nm}
        sub={sub}
        foot={
          <>
            <Button variant="outline" onPress={() => setAsk(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              data-to={actionTo}
              onPress={() => {
                onAction?.();
                setAsk(false);
              }}
            >
              {action}
            </Button>
          </>
        }
      >
        <div className="text-[13px] leading-relaxed text-neutral-600">
          Действие по строке — <b className="text-neutral-900">{action}</b>. Раньше оно стояло
          кнопкой в самой строке; теперь строка нажимается целиком, а решение принимается здесь,
          где видно, по кому оно принимается.
        </div>
      </InlineDialog>
    )}
    </>
  );
}

/** Список строк реестра: рамка и волосяные линии между строками. */
export const Rows = ({ children }: { children: ReactNode }) => (
  <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    {children}
  </div>
);

/* ── Переключатели, поиск, страницы ─────────────────────────────── */

export type TabItem = { t: string; view: ReactNode };

const Seg = ({
  items,
  cur,
  onPick,
}: {
  items: string[];
  cur: string;
  onPick: (t: string) => void;
}) => (
  <div data-seg className="inline-flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
    {items.map((t) => (
      <button
        key={t}
        type="button"
        className={
          'rounded-md px-3 py-1.5 text-[13px] font-medium ' +
          (t === cur ? 'on bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')
        }
        aria-selected={t === cur}
        onClick={() => onPick(t)}
      >
        {t}
      </button>
    ))}
  </div>
);

/** Вкладки экрана: переключатель обязан переключать — содержимое живёт рядом. */
export function PageTabs({ items, active }: { items: TabItem[]; active?: string }) {
  const [cur, setCur] = useState(active ?? items[0].t);
  const hit = items.find((i) => i.t === cur) ?? items[0];
  return (
    <>
      <div className="mb-4"><Seg items={items.map((i) => i.t)} cur={cur} onPick={setCur} /></div>
      {hit.view}
    </>
  );
}

/** Фильтр списка ✳ (31.08.2026): выбор сужает список, а не меняет экран.

    Был сегментом — тем же переключателем, что и вкладки, — и это оказалось
    неверно дважды. По смыслу: вкладка меняет экран, фильтр отбирает строки, а
    выглядели они одинаково. По вёрстке: сегмент со значениями вроде «Все
    категории · Национальная · Первая» в строку не влезал и переносился в
    столбик — на экране получался не контрол, а список слов, из которого
    непонятно, что выбрано.

    Теперь это выпадающий отбор: закрытый показывает, что именно выбрано, и
    занимает одну строку при любом числе значений. Когда фильтр не сброшен,
    кнопка окрашена — иначе «список пуст» читается как ошибка, а не как
    следствие отбора. Первое значение считается сбросом («Все …»). */
export function FilterSeg({
  items,
  active,
  onPick,
  label,
}: {
  items: string[];
  active: string;
  onPick: (v: string) => void;
  /** Что отбираем: «Категория», «Регион». Без подписи в кнопке стоит само
      значение — так у большинства списков и написано («Все категории»). */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const on = active !== items[0];
  return (
    <div className="relative" data-filter>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={
          'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium ' +
          (on
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50')
        }
      >
        {label && <span className={on ? 'text-blue-500' : 'text-neutral-400'}>{label}</span>}
        <span className="max-w-[164px] truncate">{active}</span>
        <ChevronDown size={14} className={on ? 'text-blue-500' : 'text-neutral-400'} />
      </button>
      {open && (
        <div className="absolute left-0 top-[38px] z-20 min-w-[188px] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
          {items.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onPick(t);
                setOpen(false);
              }}
              className={
                'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[13px] ' +
                (t === active ? 'bg-blue-50 font-medium text-blue-700' : 'text-neutral-700 hover:bg-neutral-50')
              }
            >
              <span className="truncate">{t}</span>
              {t === active && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Полоса отбора над списком: поиск, фильтры, справа — действия над списком.

    Заведена, чтобы у всех реестров она была одна: до этого каждый экран
    складывал поиск и фильтры своим `flex`, и одинаковые по смыслу полосы
    отличались отступами и порядком. Переносится по строкам — на узком кадре
    фильтры уезжают вниз, а не сжимают поиск до иконки. */
export function FilterBar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {children}
      {right && <span className="ml-auto flex items-center gap-2">{right}</span>}
    </div>
  );
}

/** Поиск по списку — управляется снаружи: от значения зависит, что показано. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <InputGroup className={className ?? 'w-64'}>
      <InputGroup.Prefix>
        <SearchIcon size={15} />
      </InputGroup.Prefix>
      <InputGroup.Input
        aria-label="Поиск"
        className="min-w-0"
        placeholder={placeholder ?? 'Поиск'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </InputGroup>
  );
}

/** Страницы длинного списка: окно номеров, как в старом слое. */
export function Pager({
  page,
  pages,
  onPick,
}: {
  page: number;
  pages: number;
  onPick: (p: number) => void;
}) {
  const nums: (number | '…')[] = [];
  if (pages <= 9) {
    for (let i = 0; i < pages; i++) nums.push(i);
  } else {
    const from = Math.max(1, Math.min(page - 1, pages - 5));
    const to = Math.min(pages - 2, Math.max(page + 1, 4));
    nums.push(0);
    if (from > 1) nums.push('…');
    for (let i = from; i <= to; i++) nums.push(i);
    if (to < pages - 2) nums.push('…');
    nums.push(pages - 1);
  }
  return (
    <div className="mt-3 flex items-center gap-1">
      <Button size="sm" variant="ghost" isDisabled={page === 0} onPress={() => onPick(page - 1)}>
        Назад
      </Button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={'gap' + i} className="px-1 text-neutral-400">…</span>
        ) : (
          <Button
            key={n}
            size="sm"
            variant={n === page ? 'primary' : 'ghost'}
            onPress={() => onPick(n)}
          >
            {n + 1}
          </Button>
        ),
      )}
      <Button size="sm" variant="ghost" isDisabled={page >= pages - 1} onPress={() => onPick(page + 1)}>
        Вперёд
      </Button>
    </div>
  );
}

/* ── Форма ──────────────────────────────────────────────────────── */

export const FormGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid max-w-2xl grid-cols-2 gap-x-4 gap-y-3.5">{children}</div>
);

const FieldShell = ({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) => (
  <label className={'flex flex-col gap-1 ' + (wide ? 'col-span-2' : '')}>
    <span className="text-xs font-medium text-neutral-500">{label}</span>
    {children}
  </label>
);

/** Поле ввода: в него можно печатать. */
export function TextInput({
  label,
  value = '',
  placeholder,
  wide,
  bad,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  wide?: boolean;
  /** Поле не проходит проверку. */
  bad?: boolean;
}) {
  const [v, setV] = useState(value);
  return (
    <FieldShell label={label} wide={wide}>
      <Input
        aria-label={label}
        className={'w-full' + (bad ? ' border-red-400' : '')}
        placeholder={placeholder}
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
    </FieldShell>
  );
}

/** Многострочное поле. */
export function AreaInput({
  label,
  value = '',
  rows = 3,
  wide,
}: {
  label: string;
  value?: string;
  rows?: number;
  wide?: boolean;
}) {
  const [v, setV] = useState(value);
  return (
    <FieldShell label={label} wide={wide}>
      <textarea
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-blue-500"
        rows={rows}
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
    </FieldShell>
  );
}

/** Дата: календарь браузера, а не строка. */
export function DateInput({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  const [v, setV] = useState(value);
  return (
    <FieldShell label={label} wide={wide}>
      <input
        type="date"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
    </FieldShell>
  );
}

/** Выбор из списка — статичный вид без портала: на борде стоят десятки
    экранов, и выпадающий портал одного накрыл бы чужие. Открытое состояние
    показывают истории справочника, а не макеты флоу. */
export function PickField({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <FieldShell label={label} wide={wide}>
      <span className="flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm">
        {value}
        <ChevronDown size={14} className="text-neutral-400" />
      </span>
    </FieldShell>
  );
}

/** Значение на чтение: задано системой, здесь не правится. */
export function FieldView({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <FieldShell label={label} wide={wide}>
      <span className="w-full rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">{value}</span>
    </FieldShell>
  );
}

/** Выведенное значение: подпись слева, значение справа — здесь не выбирают. */
export const Derived = ({ k, v }: { k: string; v: string }) => (
  <div className="col-span-2 flex items-baseline justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
    <span className="text-neutral-500">{k}</span>
    <b className="font-semibold">{v}</b>
  </div>
);

/** Загрузка файла: формат и размер сказаны до выбора, а не в ошибке после. */
export function FileDrop({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="col-span-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3">
      <span className="leading-tight">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-neutral-500">{hint}</span>
      </span>
      <Button size="sm" variant="outline">Выбрать файл</Button>
    </div>
  );
}

/* ── Действия ───────────────────────────────────────────────────── */

/** Главная кнопка экрана — одна на экран. */
export const PrimaryAction = ({ to, children }: { to?: string; children: ReactNode }) => (
  <Button variant="primary" data-to={to}>
    {children} <ArrowRight size={15} />
  </Button>
);

/** Тихая кнопка рядом с главной: не спорит с ней за внимание. */
export const QuietAction = ({ to, onPress, children }: { to?: string; onPress?: () => void; children: ReactNode }) => (
  <Button variant="ghost" data-to={to} onPress={onPress}>
    {children}
  </Button>
);

/** Действие видно, но пока запрещено — и по виду понятно, почему нажимать рано. */
export const DisabledAction = ({ children }: { children: ReactNode }) => (
  <Button variant="primary" isDisabled>
    {children}
  </Button>
);

/* ── Плашки и пустые состояния ──────────────────────────────────── */

const BAR_TONE = {
  info: 'border-blue-100 bg-blue-50 text-blue-900',
  success: 'border-green-100 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-100 bg-red-50 text-red-900',
} as const;
export type Tone = keyof typeof BAR_TONE;

/** Плашка-правило или предупреждение: почему экран выглядит так. */
export const Bar = ({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) => (
  <div className={'mb-4 rounded-lg border px-3.5 py-2.5 text-[12.5px] leading-relaxed ' + BAR_TONE[tone]}>
    {children}
  </div>
);

/** Пустое состояние — тоже часть макета. */
export const EmptyBox = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
    <div className="text-sm font-semibold">{title}</div>
    <div className="max-w-sm text-[13px] text-neutral-500">{text}</div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

/** Факты одной строкой рядом с поиском: даты, сроки, счётчики. */
export const Facts = ({ items }: { items: { k: string; v: string; hot?: boolean }[] }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
    {items.map((f, i) => (
      <span key={f.k} className="flex items-center gap-1.5">
        {i > 0 && <span className="text-neutral-300">·</span>}
        {f.k}{' '}
        <b className={'font-semibold ' + (f.hot ? 'text-amber-700' : 'text-neutral-800')}>{f.v}</b>
      </span>
    ))}
  </div>
);

/** Строки «подпись — значение»: регламент, карточка, шапка протокола. */
export const KV = ({ items }: { items: [string, ReactNode][] }) => (
  <div className="divide-y divide-neutral-100">
    {items.map(([k, v]) => (
      <div key={k} className="flex items-baseline justify-between gap-6 py-2 text-sm">
        <span className="shrink-0 text-neutral-500">{k}</span>
        <span className="text-right font-medium">{v}</span>
      </div>
    ))}
  </div>
);

/* ── Диалог поверх экрана ───────────────────────────────────────── */

/** Диалог: рабочая область видна и притушена под ним. Абсолютный слой внутри
    рамки устройства — не портал (см. шапку frame.tsx). */
export function InlineDialog({
  title,
  sub,
  foot,
  to,
  wide,
  children,
}: {
  title: string;
  sub?: string;
  /** Полоса решений внизу: главное действие и отказ. */
  foot?: ReactNode;
  /** Экран позади диалога — туда ведёт крестик. */
  to?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-900/40 p-8">
      {/* Ширина «не больше N, но и не шире кадра» ✳ (30.08.2026): тот же
          диалог показывается и на ноутбуке, и на телефоне, а прибитые 520 px
          в 392 px вылезали за корпус. Роли заводили под это свои обёртки —
          теперь не нужно. */}
      <div
        className={
          'flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ' +
          (wide ? 'max-w-[720px]' : 'max-w-[520px]')
        }
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">{title}</div>
            {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
          </div>
          <button
            type="button"
            data-to={to}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 pb-4">{children}</div>
        {foot && (
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50 px-5 py-3">
            {foot}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Матч и счёт ────────────────────────────────────────────────── */

/** Счёт по партиям — как на табло: победная цифра тёмная, проигранная серая. */
export const GameCells = ({ games }: { games: ReadonlyArray<readonly [number, number]> }) => (
  <div className="flex gap-1.5">
    {games.map(([a, b], i) => (
      <div key={i} className="flex w-9 flex-col items-center rounded-md border border-neutral-200 py-1 tabular-nums leading-tight">
        <span className={a > b ? 'text-[13px] font-semibold' : 'text-[13px] text-neutral-400'}>{a}</span>
        <span className={b > a ? 'text-[13px] font-semibold' : 'text-[13px] text-neutral-400'}>{b}</span>
      </div>
    ))}
  </div>
);

/** Игрок в матче: фото, имя, город/разряд. `right` — зеркально, у правого борта. */
export const PlayerSide = ({
  av,
  nm,
  sub,
  right,
}: {
  av?: string;
  nm: string;
  sub?: string;
  right?: boolean;
}) => (
  <div className={'flex items-center gap-2.5 ' + (right ? 'flex-row-reverse text-right' : '')}>
    <Avatar size="md">
      {av && <Avatar.Image alt={nm} src={av} />}
      <Avatar.Fallback>{nm.slice(0, 1)}</Avatar.Fallback>
    </Avatar>
    <div className="leading-tight">
      <div className="text-[13.5px] font-semibold">{nm}</div>
      {sub && <div className="text-xs text-neutral-500">{sub}</div>}
    </div>
  </div>
);

/** Карточка матча: двое, крупный счёт, партии и примечание. */
export function MatchCard({
  tour,
  home,
  away,
  score,
  games,
  note,
  live,
  to,
}: {
  tour?: string;
  home: { nm: string; av?: string; sub?: string };
  away: { nm: string; av?: string; sub?: string };
  score: string;
  games?: ReadonlyArray<readonly [number, number]>;
  note?: string;
  live?: boolean;
  to?: string;
}) {
  return (
    <div data-to={to} data-row className={'rounded-xl border bg-white p-4 shadow-sm ' + (live ? 'border-green-200' : 'border-neutral-200')}>
      {(tour || live) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {tour && <span className="text-xs text-neutral-500">{tour}</span>}
          {live && (
            <Chip color="success" size="sm">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-600" /> ИДЁТ
            </Chip>
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <PlayerSide {...home} />
        <div className="text-2xl font-bold tabular-nums tracking-tight">{score}</div>
        <PlayerSide {...away} right />
      </div>
      {(games || note) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          {games ? <GameCells games={games} /> : <span />}
          {note && <span className="text-xs text-neutral-500">{note}</span>}
        </div>
      )}
    </div>
  );
}

/* ── Таблица данных ─────────────────────────────────────────────── */

/** Простая таблица данных: шапка колонок и строки-кнопки с переходом.
    Для реестров и протоколов, где строки однородны; ширины — grid-шаблоном. */
/* Полосы строк ✳ (31.08.2026). В плотном реестре на десять колонок одна линия
   между строками глаз не держит: взгляд идёт по числам вправо и съезжает на
   соседнюю строку. Поэтому чётные строки залиты — «какая строка моя» видно без
   линейки.

   Про специфичность: `[&>*:nth-child(even)]` и подсветка выбранной строки — оба
   селектора одного веса, и кто победит, решал бы порядок в собранном CSS.
   Поэтому у подсветки и у наведения селектор удвоен (`[data-on][data-on]`,
   `:hover:hover`) — он тяжелее полосы намеренно, а не случайно. */
export const ROWS =
  '[&>*:nth-child(even)]:bg-neutral-50/70 ' +
  '[&>*:hover:hover]:bg-neutral-100/70 ' +
  '[&>*[data-on][data-on]]:bg-blue-50';

/** Шапка и тело реестра: строки рисует вызывающий — колонки у каждого реестра
    свои. Раньше эта же разметка лежала копией в девяти файлах ролей и уже
    начала расходиться (у одних карточка вокруг, у других нет).

    `flush` — таблица стоит внутри `Panel flush`, и своя рамка ей не нужна. */
export function Sheet({
  cols,
  grid,
  flush,
  children,
}: {
  cols: ReactNode[];
  /** grid-template-columns, например '2fr 1fr 1fr 90px'. */
  grid: string;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={flush ? undefined : 'overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm'}>
      <div
        className="grid items-center gap-3 border-b border-neutral-200 bg-neutral-100/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
        style={{ gridTemplateColumns: grid }}
      >
        {cols.map((c, i) => (
          <span key={i} className="min-w-0">{c}</span>
        ))}
      </div>
      <div className={'divide-y divide-neutral-100 ' + ROWS}>{children}</div>
    </div>
  );
}

export function DataTable({
  cols,
  grid,
  rows,
}: {
  cols: string[];
  /** grid-template-columns, например '2fr 1fr 1fr 90px'. */
  grid: string;
  rows: { key: string; to?: string; on?: boolean; cells: ReactNode[] }[];
}) {
  return (
    <Sheet cols={cols} grid={grid}>
      {rows.map((r) => (
        <div
          key={r.key}
          data-to={r.to}
          data-row
          data-on={r.on ? '' : undefined}
          className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px]"
          style={{ gridTemplateColumns: grid }}
        >
          {r.cells.map((c, j) => (
            <span key={j} className="min-w-0">{c}</span>
          ))}
        </div>
      ))}
    </Sheet>
  );
}

export { Separator };
