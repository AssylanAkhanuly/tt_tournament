'use client';

/* Таблица приложения ✳ (28.10.2026, решение владельца продукта: «все таблицы
   одинаковые — сортировка, страницы, поиск — одним компонентом»). HeroUI +
   Tailwind. Рейтинг-лист, турниры, спортсмены и судьи турнира — все через неё.

   Что одинаково у всех:
   - без обёртки и полей, на всю рабочую область (`Table` HeroUI, вариант
     `secondary`, концы шапки не скруглены, поля по краям — как у шапки экрана);
   - сверху одна полоса: поиск, отбор, «N всего», справа действия;
   - заголовок сортируемой колонки — щелчок, значок направления — `SortIcon`;
   - страницы — по центру снизу, «назад/вперёд» значками (`TablePagination`).

   Два режима. **Клиентский** (по умолчанию): весь список уже пришёл — поиск,
   сортировка и страницы считаются здесь же. **Серверный** (`server`): список
   постраничный, и сортировать на клиенте значило бы переставлять одну
   страницу, а не весь лист, — таблица только показывает состояние и сообщает о
   его смене (рейтинг-лист). */

import { SearchField, Table, type SortDescriptor } from '@heroui/react';
import { useMemo, useState, type ReactNode } from 'react';

import { SortIcon, TablePagination } from './table';

export type DataColumn<T> = {
  id: string;
  label: ReactNode;
  render: (row: T, indexOnPage: number) => ReactNode;
  /** Ключ сортировки; нет — колонка не сортируется. `null` — пусто, в конец. */
  sortValue?: (row: T) => string | number | null;
  /** В серверном режиме колонка сортируется, даже без `sortValue`. */
  sortable?: boolean;
  /** Первый щелчок — по убыванию (числа: рейтинг, участники). */
  descFirst?: boolean;
  align?: 'right';
  /** Классы колонки (ширина в фиксированной раскладке и т.п.). */
  className?: string;
  /** Колонка, по которой читалка называет строку. */
  rowHeader?: boolean;
};

export type DataTableServer = {
  query: string;
  onQuery: (q: string) => void;
  sort: SortDescriptor | null;
  onSort: (sort: SortDescriptor) => void;
  page: number;
  pages: number;
  onPage: (page: number) => void;
};

const DEFAULT_PAGE_SIZE = 20; // наше значение

function compare<T>(a: T, b: T, col: DataColumn<T>, dir: SortDescriptor['direction']): number {
  const x = col.sortValue!(a);
  const y = col.sortValue!(b);
  if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1; // пустые — в конец
  // Строки — по русскому алфавиту, а не по кодам символов.
  const r = typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y, 'ru') : x < y ? -1 : x > y ? 1 : 0;
  return dir === 'ascending' ? r : -r;
}

export function DataTable<T>({
  ariaLabel,
  rows,
  columns,
  getId,
  search,
  filters,
  count,
  actions,
  defaultSort,
  pageSize = DEFAULT_PAGE_SIZE,
  onRowAction,
  rowProps,
  empty = 'Ничего не найдено',
  loading,
  error,
  fixed,
  testId,
  server,
}: {
  ariaLabel: string;
  rows: T[];
  columns: DataColumn<T>[];
  getId: (row: T) => string;
  /** Поиск в полосе сверху; `text` — что ищется в строке (клиентский режим). */
  search?: { placeholder: string; text?: (row: T) => string; testId?: string };
  /** Отбор рядом с поиском («Фильтры»). */
  filters?: ReactNode;
  /** Подпись числа строк, например `n => 'Спортсменов: ' + n`. */
  count?: (n: number) => string;
  /** Действия справа в полосе. */
  actions?: ReactNode;
  defaultSort?: SortDescriptor;
  pageSize?: number;
  onRowAction?: (row: T) => void;
  /** Атрибуты строки для проверок (`data-testid`, `data-*`). */
  rowProps?: (row: T) => Record<string, string>;
  empty?: string;
  loading?: boolean;
  error?: string | null;
  /** Фиксированная раскладка колонок — на узком экране, чтобы не шире экрана. */
  fixed?: boolean;
  testId?: string;
  /** Серверный режим: поиск, сортировка и страницы — у вызывающего. */
  server?: DataTableServer;
}) {
  const [ownQuery, setOwnQuery] = useState('');
  const [ownSort, setOwnSort] = useState<SortDescriptor | null>(defaultSort ?? null);
  const [ownPage, setOwnPage] = useState(0);

  const query = server ? server.query : ownQuery;
  const sort = server ? server.sort : ownSort;

  const view = useMemo(() => {
    if (server) return { shown: rows, total: rows.length, pages: server.pages, page: server.page };
    const q = ownQuery.trim().toLowerCase();
    const found = q && search?.text ? rows.filter((r) => search.text!(r).toLowerCase().includes(q)) : rows;
    const col = ownSort && columns.find((c) => c.id === ownSort.column && c.sortValue);
    const sorted = col ? [...found].sort((a, b) => compare(a, b, col, ownSort!.direction)) : found;
    const pages = Math.ceil(sorted.length / pageSize);
    const page = Math.min(ownPage, Math.max(0, pages - 1)); // сузили поиск — держимся последней
    return { shown: sorted.slice(page * pageSize, (page + 1) * pageSize), total: sorted.length, pages, page };
  }, [server, rows, ownQuery, ownSort, ownPage, pageSize, search, columns]);

  const byId = useMemo(() => new Map(view.shown.map((r) => [getId(r), r])), [view.shown, getId]);

  const onQuery = (q: string) => {
    if (server) server.onQuery(q);
    else {
      setOwnQuery(q);
      setOwnPage(0);
    }
  };
  const onSort = (d: SortDescriptor) => {
    // Новая колонка с `descFirst` начинает с убывания: сильнейший сверху.
    const col = columns.find((c) => c.id === d.column);
    const next: SortDescriptor =
      col?.descFirst && sort?.column !== d.column ? { column: d.column, direction: 'descending' } : d;
    if (server) server.onSort(next);
    else {
      setOwnSort(next);
      setOwnPage(0);
    }
  };
  const onPage = (p: number) => (server ? server.onPage(p) : setOwnPage(p));

  const edge =
    '[&_th]:rounded-none [&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white" data-testid={testId}>
      {(search || filters || count || actions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-neutral-200 px-6 py-3">
          {search && (
            <SearchField aria-label="Поиск" value={query} onChange={onQuery} className="w-72 max-w-full">
              <SearchField.Group className="rounded-xl">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={search.placeholder} data-testid={search.testId} />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          )}
          {filters}
          {count && !error && !loading && (
            <span className="text-[13px] text-neutral-500" data-testid="table-count">
              {count(view.total)}
            </span>
          )}
          <div className="flex-1" />
          {actions}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {error ? (
          <p className="px-6 py-4 text-[13px] text-red-600" data-testid="table-error">
            {error}
          </p>
        ) : (
          <Table variant="secondary" className={edge}>
            <Table.ScrollContainer>
              <Table.Content
                aria-label={ariaLabel}
                className={fixed ? 'table-fixed' : undefined}
                sortDescriptor={sort ?? undefined}
                onSortChange={onSort}
                onRowAction={onRowAction ? (key) => byId.get(String(key)) && onRowAction(byId.get(String(key))!) : undefined}
              >
                <Table.Header>
                  {columns.map((c) => {
                    const sortable = c.sortable || !!c.sortValue;
                    return (
                      <Table.Column
                        key={c.id}
                        id={c.id}
                        isRowHeader={c.rowHeader}
                        allowsSorting={sortable}
                        data-testid={sortable ? 'sort-' + c.id : undefined}
                        className={(c.align === 'right' ? 'text-right ' : '') + (c.className ?? '')}
                      >
                        {({ sortDirection }) => (
                          <span
                            className={
                              'inline-flex min-w-0 items-center gap-1 ' + (c.align === 'right' ? 'w-full justify-end' : '')
                            }
                          >
                            <span className="truncate">{c.label}</span>
                            {sortable && (
                              <SortIcon
                                dir={sortDirection === 'ascending' ? 'asc' : sortDirection === 'descending' ? 'desc' : false}
                              />
                            )}
                          </span>
                        )}
                      </Table.Column>
                    );
                  })}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="py-6 text-center text-[13px] text-neutral-500" data-testid="table-empty">
                      {loading ? 'Загружается' : empty}
                    </p>
                  )}
                >
                  {view.shown.map((row, i) => (
                    <Table.Row
                      key={getId(row)}
                      id={getId(row)}
                      className={(onRowAction ? 'cursor-pointer ' : '') + 'tabular-nums'}
                      {...rowProps?.(row)}
                    >
                      {columns.map((c) => (
                        <Table.Cell key={c.id} className={c.align === 'right' ? 'text-right' : undefined}>
                          {c.render(row, i)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>

      <TablePagination page={view.page} pages={view.pages} onPage={onPage} />
    </div>
  );
}
