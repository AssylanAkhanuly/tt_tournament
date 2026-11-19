'use client';

/* Поле даты ✳ (19.11.2026): `DatePicker` HeroUI по-русски, значение — строка
   `ГГГГ-ММ-ДД` или null. Не родной `<input type="date">`: тот пишет дату по
   языку браузера (10/20/2026). `inline` — подпись слева, поле справа (строка
   настроек); иначе подпись над полем (форма в окне). HeroUI + Tailwind. */

import { Calendar, DateField, DatePicker, I18nProvider, Label } from '@heroui/react';
import { parseDate, type CalendarDate } from '@internationalized/date';

export function DateInput({
  label,
  value,
  onChange,
  inline = false,
  testId,
}: {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  inline?: boolean;
  testId?: string;
}) {
  return (
    <I18nProvider locale="ru-RU">
      <DatePicker
        value={value ? parseDate(value) : null}
        onChange={(v) => onChange(v ? (v as CalendarDate).toString() : null)}
        className={inline ? 'flex flex-row items-center justify-between gap-3' : 'flex flex-col gap-1'}
      >
        <Label className={inline ? 'text-[14px] font-medium' : undefined}>{label}</Label>
        <DateField.Group className={(inline ? 'w-44 ' : 'w-full ') + 'rounded-xl'} data-testid={testId}>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger aria-label="Выбрать дату">
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover className="rounded-xl">
          <Calendar aria-label={label}>
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
    </I18nProvider>
  );
}
