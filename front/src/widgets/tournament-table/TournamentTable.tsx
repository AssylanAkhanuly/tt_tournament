'use client';

/* Турниры таблицей ✳ (28.10.2026) — второй вид календаря. Поиск, сортировка и
   страницы — общим компонентом `DataTable` (как у всех таблиц приложения):
   по умолчанию свежие сверху, без даты — в конце; строка открывает турнир.
   Всё на клиенте: турниров единицы десятков, весь список уже пришёл. */

import { Chip } from '@heroui/react';
import type { ReactNode } from 'react';

import {
  FORMAT_LABEL,
  STATUS_LABEL,
  type TournamentStatus,
  type TournamentSummary,
} from '@/entities/tournament';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

const STATUS_COLOR: Record<TournamentStatus, 'accent' | 'success' | 'default'> = {
  open: 'accent',
  in_progress: 'success',
  finished: 'default',
};

const shortDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const COLUMNS: DataColumn<TournamentSummary>[] = [
  { id: 'name', label: 'Турнир', rowHeader: true, sortValue: (t) => t.name, render: (t) => <span className="font-medium">{t.name}</span> },
  {
    id: 'date',
    label: 'Дата',
    descFirst: true,
    sortValue: (t) => t.startsAt?.getTime() ?? null,
    render: (t) => (t.startsAt ? shortDate(t.startsAt) : '—'),
  },
  {
    id: 'status',
    label: 'Статус',
    sortValue: (t) => STATUS_LABEL[t.status],
    render: (t) => (
      <Chip size="sm" variant="soft" color={STATUS_COLOR[t.status]}>
        {STATUS_LABEL[t.status]}
      </Chip>
    ),
  },
  { id: 'format', label: 'Формат', sortValue: (t) => FORMAT_LABEL[t.format] ?? t.format, render: (t) => FORMAT_LABEL[t.format] ?? t.format },
  { id: 'club', label: 'Клуб', sortValue: (t) => t.clubName, render: (t) => t.clubName ?? '—' },
  {
    id: 'participants',
    label: 'Участников',
    align: 'right',
    descFirst: true,
    sortValue: (t) => t.participants,
    render: (t) => t.participants,
  },
];

export function TournamentTable({
  tournaments,
  onOpen,
  toolbar,
}: {
  tournaments: TournamentSummary[];
  onOpen: (id: string) => void;
  /** Кнопки экрана справа в полосе над таблицей. */
  toolbar?: ReactNode;
}) {
  return (
    <DataTable
      ariaLabel="Турниры"
      testId="tournament-table"
      rows={tournaments}
      columns={COLUMNS}
      getId={(t) => t.id}
      search={{
        placeholder: 'Название, клуб, статус',
        testId: 'tournament-search',
        text: (t) => [t.name, t.clubName ?? '', STATUS_LABEL[t.status], FORMAT_LABEL[t.format] ?? ''].join(' '),
      }}
      count={(n) => 'Турниров: ' + n}
      actions={toolbar}
      defaultSort={{ column: 'date', direction: 'descending' }}
      onRowAction={(t) => onOpen(t.id)}
      rowProps={() => ({ 'data-testid': 'tournament-table-row' })}
    />
  );
}
