'use client';

/* Рейтинг-лист. Колонки — по замечаниям федерации ✳ (15.09.2026,
   docs/refs/zamechaniya-reyting-i-vvod-rezultatov-2026-09-15.md): № по порядку в
   показанном списке, рейтинг, ФАМИЛИЯ Имя Отчество, год рождения, регион.
   Матчи, победы и история — в карточке спортсмена, куда ведёт строка.

   Рисуется общим `DataTable` ✳ (28.10.2026, решение владельца продукта: все
   таблицы одинаковые) — в **серверном режиме**: лист постраничный, и сортировка
   на клиенте переставляла бы строки внутри страницы, а не по всему листу —
   первым оказался бы не первый в рейтинге. Таблица показывает состояние и
   сообщает о его смене; запрос собирает экран (`views/rating`), считает бэкенд
   (`GET /api/rating/?sort=…`). Состояние у экрана — в типах TanStack Table
   (`SortingState`, `ColumnFiltersState`, `PaginationState`, решение 16.09.2026),
   здесь оно переводится в язык `DataTable` и обратно.

   Возрастная категория здесь — выборка из общего рейтинга, а не отдельный
   рейтинг (п. 7.2–7.3 Положения): отбор сужает список, значения те же.

   «Выгрузить в Excel» ✳ (01.10.2026) — файл собирает сервер: на экране одна
   страница листа, а в файл идёт весь отбор в том же порядке. С 28.10.2026
   выгрузка и «Добавить спортсмена» — в меню «⋯» справа над таблицей. */

import { Button, Dropdown, Label } from '@heroui/react';
import type { ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Download, MoreHorizontal, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { fio, num2, type RatingList, type RatingProfile } from '@/entities/rating';
import { FilterMenu, useNarrow } from '@/shared/kit/app';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

export const SEX_ITEMS = ['Все', 'Мужчины', 'Женщины'];
export const AGE_ITEMS = ['Все возрасты', 'U11', 'U13', 'U15', 'U17', 'U19', 'U21'];
export const STATUS_ITEMS = ['Активные', 'Неактивные', 'Все'];

/** Отбор, которого нет в колонках: пол, возрастная ступень, статус. Поиск —
    фильтр колонки «Фамилия Имя Отчество»: он про неё и есть. */
export type RatingFacets = { sex: string; age: string; status: string };

/** Скачать файл по адресу, не уходя со страницы: сервер отдаёт его вложением. */
function download(href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function columns(narrow: boolean, offset: number): DataColumn<RatingProfile>[] {
  const num: DataColumn<RatingProfile> = {
    id: 'num',
    label: '№',
    // Номер сквозной по листу, а не по странице: на второй сотне идёт 101-й.
    render: (_, i) => <span className="text-neutral-500">{offset + i + 1}</span>,
    className: narrow ? 'w-12' : 'w-16',
  };
  const value: DataColumn<RatingProfile> = {
    id: 'value',
    label: 'Рейтинг',
    align: 'right',
    sortable: true,
    // У рейтинга первый щелчок — по убыванию: сильнейший сверху.
    descFirst: true,
    className: narrow ? 'w-20' : 'w-28',
    render: (r) => (
      <span className="font-semibold" data-testid="rating-value">
        {num2(r.value)}
      </span>
    ),
  };
  if (narrow) {
    return [
      num,
      {
        id: 'name',
        label: 'Спортсмен',
        rowHeader: true,
        sortable: true,
        render: (r) => (
          <span className="block min-w-0 leading-tight">
            <span className="block truncate font-medium">{fio(r.name)}</span>
            <span className="block truncate text-[11.5px] text-neutral-500">
              {[r.birthYear, r.region].filter(Boolean).join(' · ') || '—'}
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
      label: 'Фамилия Имя Отчество',
      rowHeader: true,
      sortable: true,
      render: (r) => <span className="font-medium">{fio(r.name)}</span>,
    },
    {
      id: 'birth_year',
      label: 'Год рождения',
      sortable: true,
      render: (r) => <span className="text-neutral-600">{r.birthYear ?? '—'}</span>,
    },
    {
      id: 'region',
      label: 'Регион',
      sortable: true,
      render: (r) => <span className="text-neutral-600">{r.region || '—'}</span>,
    },
  ];
}

export function RatingTable({
  data,
  loading,
  error,
  facets,
  sorting,
  columnFilters,
  pagination,
  exportHref,
  onAddAthlete,
  onFacets,
  onSortingChange,
  onColumnFiltersChange,
  onPaginationChange,
}: {
  data: RatingList | null;
  loading: boolean;
  error: string | null;
  /** Адрес файла Excel с показанным отбором и сортировкой. */
  exportHref: string;
  /** «Добавить спортсмена» — только председателю ГСК; нет — пункта нет. */
  onAddAthlete?: () => void;
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
  const router = useRouter();
  const rows = data?.results ?? [];
  const query = String(columnFilters.find((f) => f.id === 'name')?.value ?? '');
  const canExport = !error && !!data?.count;

  return (
    <DataTable
      ariaLabel="Рейтинг-лист"
      rows={rows}
      columns={columns(narrow, pagination.pageIndex * pagination.pageSize)}
      getId={(r) => r.userId}
      fixed={narrow}
      loading={loading}
      error={error ? 'Рейтинг не загрузился: ' + error : null}
      empty="По такому отбору никого нет"
      search={{ placeholder: 'Фамилия или регион' }}
      filters={
        <FilterMenu
          groups={[
            { label: 'Пол', items: SEX_ITEMS, active: facets.sex, onPick: (v) => onFacets({ sex: v }) },
            { label: 'Возраст', items: AGE_ITEMS, active: facets.age, onPick: (v) => onFacets({ age: v }) },
            { label: 'Статус', items: STATUS_ITEMS, active: facets.status, onPick: (v) => onFacets({ status: v }) },
          ]}
        />
      }
      count={narrow ? undefined : () => 'Спортсменов: ' + (data?.count ?? 0)}
      actions={
        // Редкие действия — под «⋯» ✳ (28.10.2026, решение владельца продукта):
        // на виду только поиск и отбор. Пустой отбор выгружать незачем.
        (onAddAthlete || canExport) && (
          <Dropdown>
            <Button isIconOnly variant="tertiary" aria-label="Ещё" className="rounded-xl" data-testid="rating-more">
              <MoreHorizontal size={18} />
            </Button>
            <Dropdown.Popover placement="bottom end" className="rounded-xl">
              <Dropdown.Menu
                aria-label="Действия"
                onAction={(key) => {
                  if (key === 'add') onAddAthlete?.();
                  if (key === 'export') download(exportHref);
                }}
              >
                {onAddAthlete ? (
                  <Dropdown.Item id="add" textValue="Добавить спортсмена" className="rounded-xl" data-testid="athlete-open">
                    <UserPlus size={16} />
                    <Label>Добавить спортсмена</Label>
                  </Dropdown.Item>
                ) : null}
                {canExport ? (
                  <Dropdown.Item id="export" textValue="Выгрузить в Excel" className="rounded-xl" data-testid="rating-export">
                    <Download size={16} />
                    <Label>Выгрузить в Excel</Label>
                  </Dropdown.Item>
                ) : null}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        )
      }
      onRowAction={(r) => router.push('/rating/' + r.userId)}
      rowProps={(r) => ({ 'data-testid': 'rating-row', 'data-player': r.name })}
      server={{
        query,
        // Поиск — фильтр колонки «Фамилия Имя Отчество» (состояние экрана).
        onQuery: (q) => onColumnFiltersChange((old) => [...old.filter((f) => f.id !== 'name'), { id: 'name', value: q }]),
        sort: sorting[0] ? { column: sorting[0].id, direction: sorting[0].desc ? 'descending' : 'ascending' } : null,
        onSort: (d) => onSortingChange([{ id: String(d.column), desc: d.direction === 'descending' }]),
        page: pagination.pageIndex,
        pages: Math.ceil((data?.count ?? 0) / pagination.pageSize),
        onPage: (p) => onPaginationChange((old) => ({ ...old, pageIndex: p })),
      }}
    />
  );
}
