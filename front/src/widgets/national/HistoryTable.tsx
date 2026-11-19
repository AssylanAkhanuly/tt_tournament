'use client';

/* История подготовки члена сборной ✳ (19.11.2026, флоу Э11.2): сборы и
   старты из согласованных рапортов и турниры с изменением рейтинга — одной
   лентой, новые первыми. Собирает сервер. HeroUI + Tailwind. */

import { dmy, fetchHistory, useLoad, type HistoryRow } from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

const KIND: Record<HistoryRow['kind'], string> = { camp: 'Сбор', start: 'Старт', tournament: 'Турнир' };

const result = (h: HistoryRow) => {
  if (h.kind !== 'tournament') return '—';
  const delta = Number(h.delta ?? 0);
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${h.wins ?? 0}–${h.losses ?? 0} · ${sign}${Math.abs(delta).toFixed(2).replace('.', ',')}`;
};

const COLUMNS: DataColumn<HistoryRow>[] = [
  { id: 'date', label: 'Дата', sortable: false, render: (h) => dmy(h.date) + (h.endsOn && h.endsOn !== h.date ? ' — ' + dmy(h.endsOn) : '') },
  { id: 'kind', label: 'Что', sortable: false, render: (h) => KIND[h.kind] },
  { id: 'title', label: 'Мероприятие', rowHeader: true, sortable: false, render: (h) => <span className="font-medium">{h.title}</span> },
  { id: 'city', label: 'Где', sortable: false, render: (h) => h.city || '—' },
  { id: 'result', label: 'Победы–поражения · рейтинг', align: 'right', sortable: false, render: (h) => <span className="tabular-nums">{result(h)}</span> },
];

export function HistoryTable({ memberId }: { memberId: string }) {
  const rows = useLoad(() => fetchHistory(memberId), memberId);
  return (
    <DataTable
      ariaLabel="История подготовки"
      testId="history"
      rows={rows.data ?? []}
      columns={COLUMNS}
      getId={(h) => h.kind + h.date + h.title}
      loading={!rows.data && !rows.error}
      error={rows.error}
      empty="Истории пока нет"
      rowProps={(h) => ({ 'data-testid': 'history-row', 'data-kind': h.kind, 'data-title': h.title })}
    />
  );
}
