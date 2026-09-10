'use client';

/* Рейтинг игроков — публичная страница (ТЗ §3, экран Э0.4).

   Открыта без входа: таблица с фильтрами, строка ведёт в карточку спортсмена.
   Данные приходят с бэкенда; расчёта на фронте нет вовсе.

   Лист — последний опубликованный выпуск (п. 8.2) ✳ (11.09.2026). Прошлый
   выпуск выбирается справа в строке фильтров; председатель ГСК там же видит
   текущие, ещё не опубликованные значения. Выпуск из адреса (`?edition=`)
   открывается сразу — так в лист ведёт строка раздела «Выпуски». */

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { ruDate, useEditions, useRatingList, type RatingEdition } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { FilterSeg } from '@/shared/kit/app';
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

/** Живые, ещё не опубликованные значения — пункт выбора только председателю. */
const LIVE = 'текущие значения';
const editionLabel = (e: RatingEdition) => '№' + e.number + ' · ' + ruDate(e.publishedAt);

export function RatingListView() {
  const params = useSearchParams();
  const { isGskChairman } = useSession();
  const editions = useEditions();

  const [filters, setFilters] = useState<RatingFilters>({
    sex: 'Все',
    age: 'Все возрасты',
    status: 'Активные',
    q: '',
  });
  const [page, setPage] = useState(1);
  // '' — последний выпуск (так отвечает сервер без параметра), 'live' — живые
  // значения, иначе номер записи выпуска.
  const [edition, setEdition] = useState<string>(params.get('edition') ?? '');

  const query = useMemo(
    () => ({
      sex: SEX_QUERY[filters.sex],
      age: filters.age === 'Все возрасты' ? undefined : filters.age,
      q: filters.q || undefined,
      ...STATUS_QUERY[filters.status],
      page,
      pageSize: 100,
      edition: edition || undefined,
    }),
    [filters, page, edition],
  );

  const { data, loading, error } = useRatingList(query);

  const onFilters = useCallback((patch: Partial<RatingFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1); // сменили отбор — страница снова первая, иначе список пуст
  }, []);

  const list = editions.data ?? [];
  const items = [...(isGskChairman ? [LIVE] : []), ...list.map(editionLabel)];
  const active =
    edition === 'live' || (!data?.edition && !list.length)
      ? LIVE
      : data?.edition
        ? editionLabel(data.edition)
        : editionLabel(list[0]);

  const picker = list.length ? (
    <div data-testid="edition-picker">
      <FilterSeg
        items={items}
        active={active}
        label="Выпуск"
        onPick={(label) => {
          const picked = list.find((e) => editionLabel(e) === label);
          setEdition(label === LIVE ? 'live' : picked ? String(picked.id) : '');
          setPage(1);
        }}
      />
    </div>
  ) : undefined;

  return (
    /* Без заголовка и пояснений ✳ (10.09.2026, решение владельца продукта):
       экран начинается прямо с поиска и таблицы. */
    <RatingShell>
      <RatingTable
        data={data}
        loading={loading}
        error={error}
        filters={filters}
        page={page}
        onFilters={onFilters}
        onPage={setPage}
        extra={picker}
      />
    </RatingShell>
  );
}
