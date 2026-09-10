'use client';

/* Рейтинг игроков — публичная страница (ТЗ §3, экран Э0.4).

   Открыта без входа: таблица с фильтрами, строка ведёт в карточку спортсмена.
   Данные приходят с бэкенда; расчёта на фронте нет вовсе. */

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { useRatingList } from '@/entities/rating';
import { RatingTable, type RatingFilters } from '@/widgets/rating';
import { RatingShell } from './RatingShell';

/** Подписи фильтров → значения запроса. Перевод один и в одном месте. */
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

export function RatingListView() {
  const [filters, setFilters] = useState<RatingFilters>({
    sex: 'Все',
    age: 'Все возрасты',
    status: 'Активные',
    q: '',
  });
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      sex: SEX_QUERY[filters.sex],
      age: filters.age === 'Все возрасты' ? undefined : filters.age,
      q: filters.q || undefined,
      ...STATUS_QUERY[filters.status],
      page,
      pageSize: 100,
    }),
    [filters, page],
  );

  const { data, loading, error } = useRatingList(query);

  const onFilters = useCallback((patch: Partial<RatingFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1); // сменили отбор — страница снова первая, иначе список пуст
  }, []);

  return (
    <RatingShell
      title="Рейтинг игроков"
      lead={
        <>
          Национальный рейтинг спортсменов Республики Казахстан. Значение одно на человека и меняется по итогам
          рейтинговых соревнований; возрастные списки — выборка из общего рейтинга, а не отдельный рейтинг.
          Строка открывает карточку с историей всех начислений.{' '}
          <Link href="/rating/calibration" className="text-blue-600 hover:underline">
            Коэффициенты расчёта
          </Link>
          .
        </>
      }
      note="Пока федерация не утвердила коэффициенты D, K и потолок изменения, значения остаются пилотными."
    >
      <RatingTable
        data={data}
        loading={loading}
        error={error}
        filters={filters}
        page={page}
        onFilters={onFilters}
        onPage={setPage}
      />
    </RatingShell>
  );
}
