'use client';

/* Рейтинг-лист. Колонки — по замечаниям федерации ✳ (15.09.2026,
   docs/refs/zamechaniya-reyting-i-vvod-rezultatov-2026-09-15.md): № по порядку в
   показанном списке, рейтинг, ФАМИЛИЯ Имя Отчество, год рождения, регион.
   Матчи, победы и история — в карточке спортсмена, куда ведёт строка.

   Таблица на TanStack Table ✳ (16.09.2026, решение владельца продукта): колонки
   объявлены один раз, сортировка, поиск и страница живут состоянием таблицы, а
   не набором отдельных `useState` вокруг разметки.

   **Считает сервер, а не таблица.** `manualSorting`, `manualFiltering`,
   `manualPagination`: лист постраничный, и сортировка на клиенте переставляла
   бы строки внутри страницы, а не по всему листу — первым оказался бы не первый
   в рейтинге. Таблица отвечает за состояние и разметку, запрос собирает экран
   (`views/rating`), считает бэкенд (`GET /api/rating/?sort=…`).

   Рисуется китовым `Sheet`, а не своей разметкой: вид один с остальными
   реестрами. В кит TanStack не переезжает — кит импортирует Storybook, а этой
   библиотеки у него нет; за таблицами приложения остаётся этот слой.

   Возрастная категория здесь — выборка из общего рейтинга, а не отдельный
   рейтинг (п. 7.2–7.3 Положения): отбор сужает список, значения те же. */

import {
  columnFilteringFeature,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { fio, num2, type RatingList, type RatingProfile } from '@/entities/rating';
import { EmptyBox, FilterBar, FilterMenu, Pager, Panel, SearchInput, Sheet, useNarrow } from '@/shared/kit/app';

const GRID = '56px 96px minmax(0,2fr) 120px minmax(0,1fr)';
/** Телефон ✳ (11.09.2026): №, спортсмен с годом рождения и регионом, рейтинг. */
const GRID_NARROW = '32px minmax(0,1fr) 64px';

export const SEX_ITEMS = ['Все', 'Мужчины', 'Женщины'];
export const AGE_ITEMS = ['Все возрасты', 'U11', 'U13', 'U15', 'U17', 'U19', 'U21'];
export const STATUS_ITEMS = ['Активные', 'Неактивные', 'Все'];

/** Отбор, которого нет в колонках: пол, возрастная ступень, статус. Поиск —
    фильтр колонки «Фамилия Имя Отчество»: он про неё и есть. */
export type RatingFacets = { sex: string; age: string; status: string };

/** Возможности таблицы объявляются явно ✳ (TanStack Table 9): сортировка,
    фильтр колонки и страницы. Всё три — в ручном режиме, считает сервер. */
const FEATURES = { rowSortingFeature, columnFilteringFeature, rowPaginationFeature };
type Features = typeof FEATURES;
type Col = ColumnDef<Features, RatingProfile>;

/** Колонка выровнена по правому краю — число читается по разряду. */
type Meta = { right?: boolean };

const Sort = ({ dir }: { dir: false | 'asc' | 'desc' }) =>
  dir === 'asc' ? (
    <ArrowUp size={12} className="text-blue-600" />
  ) : dir === 'desc' ? (
    <ArrowDown size={12} className="text-blue-600" />
  ) : (
    <ChevronsUpDown size={12} className="text-neutral-300" />
  );

function HeaderCell({ header }: { header: Header<Features, RatingProfile, unknown> }) {
  const right = (header.column.columnDef.meta as Meta | undefined)?.right;
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!header.column.getCanSort()) {
    return <span className={'min-w-0 ' + (right ? 'block text-right' : '')}>{label}</span>;
  }
  return (
    <button
      type="button"
      data-testid={'sort-' + header.column.id}
      onClick={header.column.getToggleSortingHandler()}
      className={
        'flex min-w-0 items-center gap-1 uppercase tracking-wider hover:text-neutral-700 ' +
        (right ? 'justify-end' : '')
      }
    >
      <span className="min-w-0 truncate">{label}</span>
      <Sort dir={header.column.getIsSorted()} />
    </button>
  );
}

export function RatingTable({
  data,
  loading,
  error,
  facets,
  sorting,
  columnFilters,
  pagination,
  onFacets,
  onSortingChange,
  onColumnFiltersChange,
  onPaginationChange,
}: {
  data: RatingList | null;
  loading: boolean;
  error: string | null;
  facets: RatingFacets;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  pagination: PaginationState;
  onFacets: (patch: Partial<RatingFacets>) => void;
  onSortingChange: OnChangeFn<SortingState>;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  onPaginationChange: OnChangeFn<PaginationState>;
}) {
  const narrow = useNarrow();
  const rows = useMemo(() => data?.results ?? [], [data]);

  const columns = useMemo<Col[]>(() => {
    const num: Col = {
      id: 'num',
      header: '№',
      enableSorting: false,
      // Номер сквозной по листу, а не по странице: на второй сотне идёт 101-й.
      cell: ({ row }) => (
        <span className="text-neutral-500">{pagination.pageIndex * pagination.pageSize + row.index + 1}</span>
      ),
    };
    const value: Col = {
      id: 'value',
      accessorKey: 'value',
      header: 'Рейтинг',
      meta: { right: true } satisfies Meta,
      cell: (info) => (
        <span className="block text-right font-semibold" data-testid="rating-value">
          {num2(info.getValue<number>())}
        </span>
      ),
    };
    if (narrow) {
      return [
        num,
        {
          id: 'name',
          accessorKey: 'name',
          header: 'Спортсмен',
          cell: ({ row }) => (
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-medium">{fio(row.original.name)}</span>
              <span className="block truncate text-[11.5px] text-neutral-500">
                {[row.original.birthYear, row.original.region].filter(Boolean).join(' · ') || '—'}
              </span>
            </span>
          ),
        },
        value,
      ];
    }
    return [
      num,
      value,
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Фамилия Имя Отчество',
        cell: (info) => <span className="block truncate font-medium">{fio(info.getValue<string>())}</span>,
      },
      {
        id: 'birth_year',
        accessorKey: 'birthYear',
        header: 'Год рождения',
        cell: (info) => <span className="text-neutral-600">{info.getValue<number | null>() ?? '—'}</span>,
      },
      {
        id: 'region',
        accessorKey: 'region',
        header: 'Регион',
        cell: (info) => <span className="block truncate text-neutral-600">{info.getValue<string>() || '—'}</span>,
      },
    ];
  }, [narrow, pagination.pageIndex, pagination.pageSize]);

  const table = useTable({
    features: FEATURES,
    data: rows,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange,
    onColumnFiltersChange,
    onPaginationChange,
    // Считает сервер: таблица только хранит состояние и рисует (см. шапку).
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    rowCount: data?.count ?? 0,
  });

  const name = table.getColumn('name');
  const grid = narrow ? GRID_NARROW : GRID;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];

  return (
    <>
      <FilterBar>
        <SearchInput
          value={(name?.getFilterValue() as string) ?? ''}
          onChange={(v) => name?.setFilterValue(v)}
          placeholder="Фамилия или регион"
          className="w-64"
        />
        <FilterMenu
          groups={[
            { label: 'Пол', items: SEX_ITEMS, active: facets.sex, onPick: (v) => onFacets({ sex: v }) },
            { label: 'Возраст', items: AGE_ITEMS, active: facets.age, onPick: (v) => onFacets({ age: v }) },
            { label: 'Статус', items: STATUS_ITEMS, active: facets.status, onPick: (v) => onFacets({ status: v }) },
          ]}
        />
      </FilterBar>

      <Panel title={data ? 'Спортсменов в листе: ' + data.count : 'Рейтинг'} flush>
        {error ? (
          <div className="p-4">
            <EmptyBox title="Рейтинг не загрузился" text={error + '. Проверьте, что рейтинговый сервис запущен.'} />
          </div>
        ) : (
          <Sheet flush grid={grid} cols={headers.map((h) => <HeaderCell key={h.id} header={h} />)}>
            {table.getRowModel().rows.map((row) => (
              <Link
                key={row.id}
                href={'/rating/' + row.original.userId}
                data-row
                data-testid="rating-row"
                data-player={row.original.name}
                className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] tabular-nums"
                style={{ gridTemplateColumns: grid }}
              >
                {row.getAllCells().map((cell) => (
                  <span key={cell.id} className="min-w-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                ))}
              </Link>
            ))}
          </Sheet>
        )}

        {!error && !rows.length && (
          <div className="p-4">
            <EmptyBox
              title={loading ? 'Загружается' : 'Пусто'}
              text={
                loading
                  ? 'Рейтинг-лист загружается.'
                  : 'По такому отбору никого нет. Снимите фильтры или измените поиск.'
              }
            />
          </div>
        )}
      </Panel>

      {table.getPageCount() > 1 && (
        <Pager page={pagination.pageIndex} pages={table.getPageCount()} onPick={(p) => table.setPageIndex(p)} />
      )}
    </>
  );
}
