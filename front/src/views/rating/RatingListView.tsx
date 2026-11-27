'use client';

/* Рейтинг игроков — публичная страница (ТЗ §3, экран Э0.4).

   Открыта без входа: таблица с отбором, строка ведёт в карточку спортсмена.
   Данные приходят с бэкенда; расчёта на фронте нет вовсе. Значение живое:
   посчитали — сразу действует.

   Состояние таблицы — TanStack Table ✳ (16.09.2026): сортировка, фильтр
   колонки и страница живут здесь и уходят в запрос. Считает сервер: лист
   постраничный, и сортировка на клиенте переставляла бы строки внутри
   страницы, а не по всему листу.

   Выгрузка в Excel ✳ (01.10.2026) берёт тот же запрос без страницы: в файле
   весь отбор в показанном порядке, собирает его сервер.

   Председателю ГСК ✳ (11.09.2026) — «Добавить спортсмена»: карточка
   заводится со стартом по Положению, и сразу открывается. С 28.10.2026 пункт
   вместе с выгрузкой — в меню «⋯» над таблицей. */

import type { ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { createAthlete, ratingExportUrl, useRatingList, type NewAthlete } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { AthleteDialog } from '@/features/rating-admin';
import { RatingTable, type RatingFacets } from '@/widgets/rating';
import { RatingShell } from './RatingShell';

/** Подписи отбора → значения запроса. Перевод один и в одном месте. */
const SEX_QUERY: Record<string, string | undefined> = {
  Все: undefined,
  Мужчины: 'm',
  Женщины: 'f',
};
const STATUS_QUERY: Record<string, { status?: string; all?: boolean }> = {
  Активные: {},
  Неактивные: { status: 'inactive' },
  Все: { all: true },
};

const PAGE_SIZE = 100;

export function RatingListView() {
  const router = useRouter();
  const { isGskChairman, loading: sessionLoading } = useSession();
  const path = usePathname();
  // Вид листа ✳ (23.11.2026): таблица или карточки (`?view=cards`) — переключателем
  // справа над листом ✳ (24.11.2026), как у состава турнира и сборной.
  const cards = useSearchParams().get('view') === 'cards';
  const setView = (c: boolean) => router.replace(path + (c ? '?view=cards' : ''), { scroll: false });
  // Лист председателя — в его кабинете (`/gsk`) ✳ (24.11.2026), как у остальных
  // ролей; `/rating` остаётся публичной страницей для гостей.
  // Гостя из кабинета — на вход, как у остальных кабинетов.
  const redirecting = (isGskChairman && path === '/rating') || (!sessionLoading && !isGskChairman && path === '/gsk');
  useEffect(() => {
    if (sessionLoading) return;
    if (isGskChairman && path === '/rating') router.replace('/gsk' + window.location.search);
    else if (!isGskChairman && path === '/gsk') router.replace('/login?next=/gsk');
  }, [isGskChairman, sessionLoading, path, router]);
  const [adding, setAdding] = useState(false);
  /** Завести и сразу открыть карточку — из окна и из панели на телефоне. */
  const create = async (athlete: NewAthlete) => {
    const created = await createAthlete(athlete);
    router.push('/rating/' + created.userId);
  };

  const [facets, setFacets] = useState<RatingFacets>({ sex: 'Все', age: 'Все возрасты', status: 'Активные' });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });

  const q = String(columnFilters.find((f) => f.id === 'name')?.value ?? '');
  const sort = sorting[0] ? (sorting[0].desc ? '-' : '') + sorting[0].id : undefined;

  const query = useMemo(
    () => ({
      sex: SEX_QUERY[facets.sex],
      age: facets.age === 'Все возрасты' ? undefined : facets.age,
      q: q.trim() || undefined,
      sort,
      ...STATUS_QUERY[facets.status],
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }),
    [facets, q, sort, pagination],
  );

  const { data, loading, error } = useRatingList(query);

  /** Сменили отбор или сортировку — страница снова первая: на седьмой
      странице нового отбора может не быть ни одной строки. */
  const toFirstPage = () => setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    toFirstPage();
  };
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    toFirstPage();
  };

  // Пока уводим — пусто: набранное в поиске до перехода пропало бы.
  if (redirecting) return null;

  return (
    /* Без заголовка и пояснений ✳ (10.09.2026, решение владельца продукта):
       экран начинается прямо с отбора и таблицы. */
    <RatingShell bleed>
      <RatingTable
        cards={cards}
        onView={isGskChairman ? setView : undefined}
        data={data}
        loading={loading}
        error={error}
        facets={facets}
        sorting={sorting}
        columnFilters={columnFilters}
        pagination={pagination}
        exportHref={ratingExportUrl(query)}
        onAddAthlete={isGskChairman ? () => setAdding(true) : undefined}
        onCreateAthlete={isGskChairman ? create : undefined}
        onFacets={(patch) => {
          setFacets((f) => ({ ...f, ...patch }));
          toFirstPage();
        }}
        onSortingChange={onSortingChange}
        onColumnFiltersChange={onColumnFiltersChange}
        onPaginationChange={setPagination}
      />
      {adding && (
        <AthleteDialog
          onClose={() => setAdding(false)}
          onSubmit={create}
        />
      )}
    </RatingShell>
  );
}
