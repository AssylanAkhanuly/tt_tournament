'use client';

/* Спортивная карточка члена сборной ✳ (19.11.2026, NATIONAL.md; роль 22):
   записи психолога — дата и текст. Ведёт и читает только психолог сборной:
   кто ещё её читает, федерация не сказала (QUESTIONS 20.1). HeroUI + Tailwind. */

import { Button, Input, Label, TextArea, TextField, Tooltip } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { addSport, deleteSport, dmy, fetchSport, useLoad, type SportRecord } from '@/entities/national';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';

import { FormDialog } from './PlanBoard';

const today = () => new Date().toISOString().slice(0, 10);

function AddDialog({ memberId, onAdded }: { memberId: string; onAdded: () => void }) {
  const [date, setDate] = useState(today());
  const [text, setText] = useState('');
  return (
    <FormDialog
      testId="sport-add"
      title="Новая запись"
      submitLabel="Добавить"
      ready={!!date && !!text.trim()}
      submit={async () => {
        await addSport(memberId, { date, text });
        setText('');
        onAdded();
      }}
      trigger={
        <Button variant="primary" size="sm" className="rounded-xl" data-testid="sport-add-open">
          <Plus size={16} /> Добавить запись
        </Button>
      }
    >
      <TextField isRequired value={date} onChange={setDate}>
        <Label>Дата</Label>
        <Input type="date" className="rounded-xl" data-testid="sport-date" />
      </TextField>
      <TextField isRequired value={text} onChange={setText}>
        <Label>Запись</Label>
        <TextArea rows={5} className="rounded-xl" data-testid="sport-text" />
      </TextField>
    </FormDialog>
  );
}

export function SportCard({ memberId }: { memberId: string }) {
  const records = useLoad(() => fetchSport(memberId), memberId);
  const columns: DataColumn<SportRecord>[] = [
    { id: 'date', label: 'Дата', descFirst: true, sortValue: (r) => r.date, render: (r) => dmy(r.date) },
    { id: 'text', label: 'Запись', rowHeader: true, sortable: false, render: (r) => <span className="whitespace-pre-line">{r.text}</span> },
    { id: 'by', label: 'Внёс', sortable: false, render: (r) => r.createdBy || '—' },
    {
      id: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (r) => (
        <Tooltip>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Удалить запись"
            className="rounded-xl text-red-600"
            onPress={() => void deleteSport(r.id).then(records.reload)}
            data-testid="sport-delete"
          >
            <Trash2 size={15} />
          </Button>
          <Tooltip.Content>Удалить запись</Tooltip.Content>
        </Tooltip>
      ),
    },
  ];
  return (
    <DataTable
      ariaLabel="Спортивная карточка"
      testId="sport-records"
      rows={records.data ?? []}
      columns={columns}
      getId={(r) => r.id}
      loading={!records.data && !records.error}
      error={records.error}
      empty="Записей нет"
      defaultSort={{ column: 'date', direction: 'descending' }}
      actions={<AddDialog memberId={memberId} onAdded={records.reload} />}
      rowProps={() => ({ 'data-testid': 'sport-row' })}
    />
  );
}
