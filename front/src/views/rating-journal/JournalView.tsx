'use client';

/* Журнал изменений рейтинга — раздел председателя ГСК ✳ (11.09.2026).

   Все строки рейтинговой истории всех спортсменов, новые первыми: когда, чья,
   какого вида, на сколько, на каком основании и кто внёс (п. 20, 21.6).
   Председатель обеспечивает сохранность базы и истории (п. 22.2) — здесь он
   видит её целиком. Отменённые строки остаются зачёркнутыми: история хранится
   без удаления. Только чтение; строка открывает карточку спортсмена.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { num2, plainLabel, ruDate, signed2, useJournal } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { EmptyBox, FilterBar, FilterSeg, Pager, Panel, SearchInput, Sheet } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

const GRID = '88px minmax(0,1.2fr) minmax(0,1fr) 84px 70px minmax(0,1.4fr) minmax(0,1fr)';

/** Вид записи на экране → код на сервере. */
const KINDS: [string, string | undefined][] = [
  ['Все записи', undefined],
  ['Матчи', 'match'],
  ['Неявки', 'no_show'],
  ['Исправления', 'correction'],
  ['Стартовые', 'start'],
  ['Надбавки за место', 'prize'],
  ['Аннулирование', 'void'],
];

export function JournalView() {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const [kind, setKind] = useState(KINDS[0][0]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/journal');
  }, [sessionLoading, isGskChairman, router]);

  const query = useMemo(
    () => ({ kind: KINDS.find(([t]) => t === kind)?.[1], q: q || undefined, page }),
    [kind, q, page],
  );
  const { data, loading, error } = useJournal(query);
  const rows = data?.results ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.count / data.pageSize)) : 1;

  return (
    <RatingShell active="Журнал">
      <FilterBar>
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Спортсмен"
          className="w-64"
        />
        <FilterSeg
          items={KINDS.map(([t]) => t)}
          active={kind}
          onPick={(v) => {
            setKind(v);
            setPage(1);
          }}
        />
      </FilterBar>

      <Panel title={'Записей: ' + (data?.count ?? 0)} flush>
        {error ? (
          <div className="p-4">
            <EmptyBox title="Журнал не загрузился" text={error} />
          </div>
        ) : rows.length ? (
          <Sheet
            flush
            grid={GRID}
            cols={[
              'Дата',
              'Спортсмен',
              'Вид',
              <span key="d" className="block text-right">Изменение</span>,
              <span key="a" className="block text-right">После</span>,
              'Основание',
              'Внёс',
            ]}
          >
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                data-row
                data-testid="journal-row"
                data-player={r.athleteName}
                onClick={() => router.push('/rating/' + r.athleteId)}
                className={
                  'grid w-full items-center gap-3 px-4 py-2 text-left text-[12.5px] tabular-nums hover:bg-neutral-50 ' +
                  (r.isReverted ? 'opacity-50 line-through' : '')
                }
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="text-neutral-500">{ruDate(r.occurredAt)}</span>
                <span className="min-w-0 truncate font-medium">{r.athleteName}</span>
                <span className="min-w-0 truncate text-neutral-600">
                  {r.tournamentName ?? plainLabel(r.kindLabel)}
                </span>
                <span
                  className={
                    'text-right font-semibold ' +
                    (r.delta > 0 ? 'text-green-700' : r.delta < 0 ? 'text-red-600' : 'text-neutral-400')
                  }
                >
                  {signed2(r.delta)}
                </span>
                <span className="text-right">{num2(r.after)}</span>
                <span className="min-w-0 truncate text-neutral-600">{r.reason || '—'}</span>
                <span className="min-w-0 truncate text-neutral-500">{r.createdByName ?? 'система'}</span>
              </button>
            ))}
          </Sheet>
        ) : (
          <div className="p-4">
            <EmptyBox title={loading ? 'Загружается' : 'Записей нет'} text="" />
          </div>
        )}
      </Panel>

      {pages > 1 && <Pager page={page - 1} pages={pages} onPick={(p) => setPage(p + 1)} />}
    </RatingShell>
  );
}
