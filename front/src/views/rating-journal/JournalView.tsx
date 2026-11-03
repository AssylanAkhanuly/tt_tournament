'use client';

/* Журнал изменений рейтинга (п. 20, 21.6, 22.2) ✳ (11.09.2026, снят тем же
   днём, возвращён в новом виде 03.11.2026 — решения владельца продукта).

   Все строки истории всех спортсменов, новые первыми: когда записано, чья,
   что за запись (турнир и соперник со счётом или основание), было, изменение,
   стало и кто внёс. Отменённые строки остаются с пометкой — история хранится
   без удаления. Только чтение. Таблица — общий `DataTable` в серверном режиме:
   строк много, страницы и поиск считает сервер; отбор — «Фильтры» → «Вид
   записи». Строка открывает карточку спортсмена. */

import { Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  fio,
  num2,
  plainLabel,
  ruDateTime,
  signed2,
  useJournal,
  type RatingEntryKind,
  type RatingJournalEntry,
} from '@/entities/rating';
import { TableTools } from '@/shared/ui/TableTools';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { RatingShell } from '@/views/rating';
import { useChairmanOnly } from '@/views/rating/useChairmanOnly';

const PAGE_SIZE = 50;

/** Подписи отбора → вид записи на сервере. Первым — «все». */
const KINDS: [string, RatingEntryKind | undefined][] = [
  ['Все записи', undefined],
  ['Матч', 'match'],
  ['Надбавка за место', 'prize'],
  ['Неявка', 'no_show'],
  ['Исправление', 'correction'],
  ['Стартовое значение', 'start'],
  ['Аннулирование', 'void'],
  ['Объединение карточек', 'merge'],
];

function what(e: RatingJournalEntry): string {
  if (e.kind === 'match') {
    const vs = [e.opponentName ? 'с ' + e.opponentName : '', e.score].filter(Boolean).join(' ');
    return [e.tournamentName, vs].filter(Boolean).join(' · ');
  }
  if (e.kind === 'prize') return e.tournamentName ?? '';
  return e.reason;
}

const COLUMNS: DataColumn<RatingJournalEntry>[] = [
  {
    id: 'created',
    label: 'Записано',
    className: 'w-40',
    render: (e) => <span className="tabular-nums text-neutral-600">{ruDateTime(e.createdAt)}</span>,
  },
  {
    id: 'name',
    label: 'Спортсмен',
    rowHeader: true,
    render: (e) => <span className="font-medium">{fio(e.athleteName)}</span>,
  },
  {
    id: 'kind',
    label: 'Запись',
    render: (e) => (
      <span className="block min-w-0 leading-tight">
        <span className="flex items-center gap-2">
          <span className={e.isReverted ? 'text-neutral-400 line-through' : ''}>{plainLabel(e.kindLabel)}</span>
          {e.isReverted && (
            <Chip size="sm" variant="soft" data-testid="journal-reverted">
              отменена
            </Chip>
          )}
        </span>
        <span className="block max-w-[28rem] truncate text-[12px] text-neutral-500">{what(e)}</span>
      </span>
    ),
  },
  {
    id: 'before',
    label: 'Было',
    align: 'right',
    className: 'w-24',
    render: (e) => <span className="tabular-nums text-neutral-600">{num2(e.before)}</span>,
  },
  {
    id: 'delta',
    label: 'Изменение',
    align: 'right',
    className: 'w-28',
    render: (e) => (
      <span
        className={
          'font-semibold tabular-nums ' +
          (e.isReverted ? 'text-neutral-400' : e.delta > 0 ? 'text-green-700' : e.delta < 0 ? 'text-red-600' : 'text-neutral-500')
        }
        data-testid="journal-delta"
      >
        {signed2(e.delta)}
      </span>
    ),
  },
  {
    id: 'after',
    label: 'Стало',
    align: 'right',
    className: 'w-24',
    render: (e) => <span className="font-semibold tabular-nums">{num2(e.after)}</span>,
  },
  {
    id: 'by',
    label: 'Внёс',
    render: (e) => <span className="text-neutral-600">{e.createdByName ?? 'Расчёт'}</span>,
  },
];

export function JournalView() {
  const router = useRouter();
  const allowed = useChairmanOnly('/rating/journal');
  const [kind, setKind] = useState(KINDS[0][0]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const query = useMemo(
    () => ({
      kind: KINDS.find(([l]) => l === kind)?.[1],
      q: q.trim() || undefined,
      page: page + 1,
      pageSize: PAGE_SIZE,
    }),
    [kind, q, page],
  );
  const journal = useJournal(query);

  return (
    <RatingShell active="Журнал" bleed>
      {allowed && (
        <DataTable
          ariaLabel="Журнал изменений"
          testId="journal"
          rows={journal.data?.results ?? []}
          columns={COLUMNS}
          getId={(e) => String(e.id)}
          loading={journal.loading}
          error={journal.error ? 'Журнал не загрузился: ' + journal.error : null}
          empty="Записей нет"
          search={{ placeholder: 'Фамилия спортсмена' }}
          filters={
            <TableTools
              place="filters"
              groups={[
                {
                  label: 'Вид записи',
                  items: KINDS.map(([l]) => l),
                  active: kind,
                  onPick: (v) => {
                    setKind(v);
                    setPage(0);
                  },
                },
              ]}
            />
          }
          onRowAction={(e) => router.push('/rating/' + e.athleteId)}
          rowProps={(e) => ({
            'data-testid': 'journal-row',
            'data-player': e.athleteName,
            'data-kind': e.kind,
            'data-reverted': e.isReverted ? 'yes' : 'no',
          })}
          server={{
            query: q,
            onQuery: (v) => {
              setQ(v);
              setPage(0);
            },
            sort: null,
            onSort: () => {},
            page,
            pages: Math.ceil((journal.data?.count ?? 0) / PAGE_SIZE),
            onPage: setPage,
          }}
        />
      )}
    </RatingShell>
  );
}
