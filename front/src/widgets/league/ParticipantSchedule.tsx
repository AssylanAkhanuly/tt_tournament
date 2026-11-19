'use client';

/* Расписание участнику Лиги ✳ (19.11.2026, LEAGUE.md «Расписание тура»):
   встречи из **отправленных** расписаний туров — черновик видит только
   федерация. Один на кабинет клуба (встречи его команд) и кабинет судьи
   (встречи, которые он судит): время, тур и город, лига, стол, встреча, судья,
   счёт. Только смотреть. HeroUI + Tailwind. */

import type { ParticipantMatch } from '@/entities/league';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

const pad = (n: number) => String(n).padStart(2, '0');
const when = (d: Date | null) =>
  d ? d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : '—';

const COLUMNS: DataColumn<ParticipantMatch>[] = [
  { id: 'time', label: 'Время', sortValue: (m) => m.scheduledAt?.getTime() ?? null, render: (m) => when(m.scheduledAt) },
  {
    id: 'tour',
    label: 'Тур',
    sortValue: (m) => m.tour.number,
    render: (m) => 'Тур ' + m.tour.number + (m.tour.city ? ' · ' + m.tour.city : ''),
  },
  { id: 'league', label: 'Лига', sortValue: (m) => m.divisionName, render: (m) => m.divisionName },
  { id: 'table', label: 'Стол', align: 'right', sortValue: (m) => m.table, render: (m) => m.table ?? '—' },
  {
    id: 'match',
    label: 'Встреча',
    rowHeader: true,
    sortValue: (m) => m.teamA.name,
    render: (m) => (
      <span className="font-medium">
        {m.teamA.name} — {m.teamB.name}
      </span>
    ),
  },
  { id: 'referee', label: 'Судья', sortValue: (m) => m.referee?.name ?? null, render: (m) => m.referee?.name ?? '—' },
  {
    id: 'score',
    label: 'Счёт',
    align: 'right',
    sortable: false,
    render: (m) => (m.status === 'finished' ? m.rubbersA + ' : ' + m.rubbersB : '—'),
  },
];

export function ParticipantSchedule({ matches, testId, empty }: { matches: ParticipantMatch[]; testId: string; empty: string }) {
  return (
    <DataTable
      ariaLabel="Расписание встреч"
      testId={testId}
      rows={matches}
      columns={COLUMNS}
      getId={(m) => String(m.id)}
      empty={empty}
      search={{ placeholder: 'Команда, город, лига', testId: testId + '-search', text: (m) => [m.teamA.name, m.teamB.name, m.tour.city, m.divisionName].join(' ') }}
      defaultSort={{ column: 'time', direction: 'ascending' }}
      rowProps={(m) => ({ 'data-testid': testId + '-row', 'data-match': m.teamA.name + ' — ' + m.teamB.name })}
    />
  );
}
