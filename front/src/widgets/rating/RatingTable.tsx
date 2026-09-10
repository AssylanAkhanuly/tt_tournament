'use client';

/* Рейтинг-лист. Устроен как лист судей (Э0.12): строка ведёт в карточку, и
   слагаемые видны прямо в списке — «чем один выше другого» читается без
   перехода. Для игрока это матчи, победы и поражения рядом со значением.

   Возрастная категория здесь — выборка из общего рейтинга, а не отдельный
   рейтинг (п. 7.2–7.3 Положения): фильтр сужает список, значения те же. */

import Link from 'next/link';
import { Avatar } from '@heroui/react';

import { num2, type RatingList, type RatingProfile } from '@/entities/rating';
import { EmptyBox, FilterBar, FilterSeg, Pager, Panel, SearchInput, Sheet } from '@/shared/kit/app';

const GRID = '56px minmax(0,1.9fr) minmax(0,1fr) 58px 74px 58px 66px 88px';

export const SEX_ITEMS = ['Все', 'Мужчины', 'Женщины'];
export const AGE_ITEMS = ['Все возрасты', 'U11', 'U13', 'U15', 'U17', 'U19', 'U21'];
export const STATUS_ITEMS = ['Активные', 'Неактивные', 'Все'];

const STATUS_TONE: Record<RatingProfile['status'], string> = {
  active: 'text-neutral-600',
  inactive: 'text-amber-700',
  void: 'text-red-600',
  no_matches: 'text-neutral-400',
};

export type RatingFilters = { sex: string; age: string; status: string; q: string };

export function RatingTable({
  data,
  loading,
  error,
  filters,
  page,
  onFilters,
  onPage,
}: {
  data: RatingList | null;
  loading: boolean;
  error: string | null;
  filters: RatingFilters;
  page: number;
  onFilters: (patch: Partial<RatingFilters>) => void;
  onPage: (p: number) => void;
}) {
  const rows = data?.results ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.count / data.pageSize)) : 1;
  const first = data ? (data.page - 1) * data.pageSize : 0;

  return (
    <>
      <FilterBar>
        <SearchInput
          value={filters.q}
          onChange={(v) => onFilters({ q: v })}
          placeholder="Фамилия или регион"
          className="w-64"
        />
        <FilterSeg items={SEX_ITEMS} active={filters.sex} onPick={(v) => onFilters({ sex: v })} label="Пол" />
        <FilterSeg items={AGE_ITEMS} active={filters.age} onPick={(v) => onFilters({ age: v })} label="Возраст" />
        <FilterSeg
          items={STATUS_ITEMS}
          active={filters.status}
          onPick={(v) => onFilters({ status: v })}
          label="Статус"
        />
      </FilterBar>

      <Panel
        title={data ? 'Спортсменов в листе: ' + data.count : 'Рейтинг'}
        flush
      >
        {error ? (
          <div className="p-4">
            <EmptyBox
              title="Рейтинг не загрузился"
              text={error + '. Проверьте, что рейтинговый сервис запущен.'}
            />
          </div>
        ) : (
          <Sheet
            flush
            grid={GRID}
            cols={[
              'Место',
              'Спортсмен',
              'Регион',
              'Возраст',
              <span key="v" className="text-right block">Рейтинг</span>,
              <span key="m" className="text-right block">Матчи</span>,
              <span key="w" className="text-right block">В / П</span>,
              'Статус',
            ]}
          >
            {rows.map((r, i) => (
              <Link
                key={r.userId}
                href={'/rating/' + r.userId}
                data-row
                data-testid="rating-row"
                data-player={r.name}
                className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] tabular-nums"
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="text-neutral-600">{first + i + 1}</span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm">
                    <Avatar.Fallback>{r.name.slice(0, 1)}</Avatar.Fallback>
                  </Avatar>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-medium">{r.name}</span>
                  </span>
                </span>
                <span className="truncate text-neutral-600">{r.region || '—'}</span>
                <span className="text-neutral-600">{r.ageCategory ?? '—'}</span>
                <span className="text-right font-semibold" data-testid="rating-value">
                  {num2(r.value)}
                </span>
                <span className="text-right text-neutral-600">{r.matchesPlayed}</span>
                <span className="text-right text-neutral-600">
                  {r.wins} / {r.losses}
                </span>
                <span className={'truncate text-[12.5px] ' + STATUS_TONE[r.status]}>{r.statusLabel}</span>
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

      {pages > 1 && <Pager page={page - 1} pages={pages} onPick={(p) => onPage(p + 1)} />}
    </>
  );
}
