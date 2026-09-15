'use client';

/* Рейтинг-лист. Колонки — по замечаниям федерации ✳ (15.09.2026,
   docs/refs/zamechaniya-reyting-i-vvod-rezultatov-2026-09-15.md): № по порядку в
   показанном списке, рейтинг, ФАМИЛИЯ Имя Отчество, год рождения, регион.
   Матчи, победы и история — в карточке спортсмена, куда ведёт строка.

   Возрастная категория здесь — выборка из общего рейтинга, а не отдельный
   рейтинг (п. 7.2–7.3 Положения): фильтр сужает список, значения те же. */

import Link from 'next/link';

import { fio, num2, type RatingList } from '@/entities/rating';
import { EmptyBox, FilterBar, FilterSeg, Pager, Panel, SearchInput, Sheet, useNarrow } from '@/shared/kit/app';

const GRID = '56px 96px minmax(0,2fr) 120px minmax(0,1fr)';
/** Телефон ✳ (11.09.2026): №, спортсмен с годом рождения и регионом, рейтинг. */
const GRID_NARROW = '32px minmax(0,1fr) 64px';

export const SEX_ITEMS = ['Все', 'Мужчины', 'Женщины'];
export const AGE_ITEMS = ['Все возрасты', 'U11', 'U13', 'U15', 'U17', 'U19', 'U21'];
export const STATUS_ITEMS = ['Активные', 'Неактивные', 'Все'];

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
  const narrow = useNarrow();
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

      <Panel title={data ? 'Спортсменов в листе: ' + data.count : 'Рейтинг'} flush>
        {error ? (
          <div className="p-4">
            <EmptyBox title="Рейтинг не загрузился" text={error + '. Проверьте, что рейтинговый сервис запущен.'} />
          </div>
        ) : (
          <Sheet
            flush
            grid={narrow ? GRID_NARROW : GRID}
            cols={
              narrow
                ? ['№', 'Спортсмен', <span key="v" className="block text-right">Рейтинг</span>]
                : [
                    '№',
                    <span key="v" className="block text-right">Рейтинг</span>,
                    'Фамилия Имя Отчество',
                    'Год рождения',
                    'Регион',
                  ]
            }
          >
            {rows.map((r, i) => (
              <Link
                key={r.userId}
                href={'/rating/' + r.userId}
                data-row
                data-testid="rating-row"
                data-player={r.name}
                className="grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] tabular-nums"
                style={{ gridTemplateColumns: narrow ? GRID_NARROW : GRID }}
              >
                <span className="text-neutral-500">{first + i + 1}</span>
                {narrow ? (
                  <>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate font-medium">{fio(r.name)}</span>
                      <span className="block truncate text-[11.5px] text-neutral-500">
                        {[r.birthYear, r.region].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                    <span className="text-right font-semibold" data-testid="rating-value">
                      {num2(r.value)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-right font-semibold" data-testid="rating-value">
                      {num2(r.value)}
                    </span>
                    <span className="min-w-0 truncate font-medium">{fio(r.name)}</span>
                    <span className="text-neutral-600">{r.birthYear ?? '—'}</span>
                    <span className="min-w-0 truncate text-neutral-600">{r.region || '—'}</span>
                  </>
                )}
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
