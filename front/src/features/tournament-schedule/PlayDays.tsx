'use client';

/* «Игровые дни» в параметрах расписания ✳ (30.10.2026, решение владельца
   продукта): у каждого дня своя дата и свои часы — первый день с обеда, второй
   с утра. Матчи заполняют дни по порядку дат; не поместились — сервер говорит,
   сколько слотов не хватает (`schedule.play_slots`). Дни по умолчанию — даты
   турнира, их отдаёт сервер. Дата — `DatePicker`, часы — `TimeField` HeroUI. */

import { Button, Calendar, DateField, DatePicker, I18nProvider, TimeField } from '@heroui/react';
import { parseDate, parseTime, type CalendarDate } from '@internationalized/date';
import { Plus, Trash2 } from 'lucide-react';

import type { PlayDay } from '@/entities/tournament';

const pad = (n: number) => String(n).padStart(2, '0');

/** Время дня — сегменты «часы : минуты», как у даты; значение — `ЧЧ:ММ`. */
export function Clock({
  label,
  value,
  onChange,
  testId,
  width = 'w-32',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId: string;
  width?: string;
}) {
  return (
    <TimeField
      aria-label={label}
      value={parseTime(value)}
      hourCycle={24}
      onChange={(t) => t && onChange(pad(t.hour) + ':' + pad(t.minute))}
      className={width}
    >
      <TimeField.Group className="rounded-xl" data-testid={testId}>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
    </TimeField>
  );
}

function DayDate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <DatePicker
      aria-label="Дата"
      value={parseDate(value)}
      onChange={(v) => v && onChange((v as CalendarDate).toString())}
      className="w-40"
    >
      <DateField.Group className="rounded-xl" data-testid="play-day-date">
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger aria-label="Выбрать дату">
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover className="rounded-xl">
        <Calendar aria-label="Игровой день">
          <Calendar.Header>
            <Calendar.Heading />
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>{(d) => <Calendar.HeaderCell>{d}</Calendar.HeaderCell>}</Calendar.GridHeader>
            <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

/** Следующий день после последнего — с его же часами. */
function nextDay(days: PlayDay[]): PlayDay {
  const last = days[days.length - 1];
  return { ...last, date: parseDate(last.date).add({ days: 1 }).toString() };
}

export function PlayDays({ value, onChange }: { value: PlayDay[]; onChange: (days: PlayDay[]) => void }) {
  const set = (i: number, patch: Partial<PlayDay>) => onChange(value.map((d, k) => (k === i ? { ...d, ...patch } : d)));
  return (
    <I18nProvider locale="ru-RU">
      <section className="flex flex-col gap-2 border-t border-neutral-200 pt-4" data-testid="play-days">
        <h3 className="text-[14px] font-semibold">Игровые дни</h3>
        {value.map((d, i) => (
          <div key={i} className="flex items-center gap-2" data-testid="play-day">
            <DayDate value={d.date} onChange={(date) => set(i, { date })} />
            <Clock label="Начало" value={d.start} onChange={(start) => set(i, { start })} testId="play-day-start" width="w-[5.5rem]" />
            <span className="text-neutral-400" aria-hidden>
              –
            </span>
            <Clock label="Конец" value={d.end} onChange={(end) => set(i, { end })} testId="play-day-end" width="w-[5.5rem]" />
            {/* Последний день не убрать: без дней расписания нет. */}
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Убрать день"
              isDisabled={value.length < 2}
              onPress={() => onChange(value.filter((_, k) => k !== i))}
              className="ml-auto text-neutral-500"
              data-testid="play-day-remove"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="self-start rounded-xl"
          onPress={() => onChange([...value, nextDay(value)])}
          data-testid="play-day-add"
        >
          <Plus size={15} />
          Добавить день
        </Button>
      </section>
    </I18nProvider>
  );
}
