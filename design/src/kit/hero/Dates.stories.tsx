/* Справочник HeroUI 3 · группа «Даты и время» ✳ (30.08.2026).

   Календари и поля дат в тройке целиком композиционные: без `Grid` +
   `GridHeader`/`GridBody` (children — только функции) календарь пуст, без
   цепочки `Group → InputContainer → Input → Segment` поле не рендерит ни
   одного сегмента — именно на этом ломался старый справочник. Значения дат —
   классы из `@internationalized/date`: из `@heroui/react` они не
   реэкспортируются. */

import type { ReactNode } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import {
  Calendar,
  CalendarYearPicker,
  DateField,
  DatePicker,
  DateRangePicker,
  RangeCalendar,
  TimeField,
} from '@heroui/react';
/* DateInputGroup из корня пакета не реэкспортируется (проверено по
   dist/components/index.d.ts) — только сабпутём. */
import {
  DateInputGroup,
  dateInputGroupVariants,
  type DateInputGroupSegmentProps,
} from '@heroui/react/date-input-group';
import { CalendarDate, Time } from '@internationalized/date';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/04 · Даты и время',
  parameters: { layout: 'fullscreen' },
};

/* Даты домена: Кубок Алматы 2026 проходит 12–15 марта; дата рождения —
   у спортсмена Ким Георгий (МС). */
const START = new CalendarDate(2026, 3, 12);
const END = new CalendarDate(2026, 3, 15);
const BIRTH = new CalendarDate(2008, 3, 14);

/* Обязательная анатомия месяца: шапка с навигацией и таблица. GridHeader и
   GridBody принимают ТОЛЬКО функции-children — обычные дети молча дают пустую
   таблицу. Переиспользуется и в самостоятельном календаре, и внутри поповера
   DatePicker (там Calendar берёт значение и подпись из контекста пикера). */
const CalendarMonth = ({ marked = false }: { marked?: boolean }) => (
  <>
    <Calendar.Header>
      <Calendar.NavButton slot="previous" />
      <Calendar.Heading />
      <Calendar.NavButton slot="next" />
    </Calendar.Header>
    <Calendar.Grid>
      <Calendar.GridHeader>
        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
      </Calendar.GridHeader>
      <Calendar.GridBody>
        {(date) =>
          marked ? (
            /* Дни турнира помечены точкой CellIndicator; children ячейки —
               рендер-функция, число выводим сами через formattedDate. */
            <Calendar.Cell date={date}>
              {({ formattedDate }) => (
                <>
                  {formattedDate}
                  {date.compare(START) >= 0 && date.compare(END) <= 0 && (
                    <Calendar.CellIndicator />
                  )}
                </>
              )}
            </Calendar.Cell>
          ) : (
            <Calendar.Cell date={date} />
          )
        }
      </Calendar.GridBody>
    </Calendar.Grid>
  </>
);

/* Та же анатомия для диапазона: у RangeCalendar собственный набор частей. */
const RangeMonth = () => (
  <>
    <RangeCalendar.Header>
      <RangeCalendar.NavButton slot="previous" />
      <RangeCalendar.Heading />
      <RangeCalendar.NavButton slot="next" />
    </RangeCalendar.Header>
    <RangeCalendar.Grid>
      <RangeCalendar.GridHeader>
        {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
      </RangeCalendar.GridHeader>
      <RangeCalendar.GridBody>
        {(date) => <RangeCalendar.Cell date={date} />}
      </RangeCalendar.GridBody>
    </RangeCalendar.Grid>
  </>
);

/* У полей дат в тройке нет части Label (и пропов label/description из v2):
   видимую подпись собираем снаружи, имя для читалки даёт aria-label корня. */
const Labeled = ({ caption, children }: { caption: string; children: ReactNode }) => (
  <div className="flex w-72 flex-col gap-1.5">
    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
      {caption}
    </span>
    {children}
  </div>
);

/* ── Календари ──────────────────────────────────────────────────── */
export const Calendars = {
  name: 'Календарь',
  render: () => (
    <Shell>
      <Section
        name="Calendar"
        note="Один месяц с навигацией. Внешних вариантов в пакете нет — только слоты; управляется пропами RAC (value, isDisabled, isInvalid…). Дни турнира отмечены CellIndicator."
      >
        <Calendar aria-label={`Дата начала — ${TOURNAMENTS[0]}`} defaultValue={START}>
          <CalendarMonth marked />
        </Calendar>
        <Row
          prop="состояния"
          vals={['isDisabled', 'isInvalid']}
          render={(v) => (
            <Calendar
              aria-label={`Дата начала — ${TOURNAMENTS[0]}`}
              defaultValue={START}
              isDisabled={v === 'isDisabled'}
              isInvalid={v === 'isInvalid'}
            >
              <CalendarMonth />
            </Calendar>
          )}
        />
      </Section>

      <Section
        name="RangeCalendar"
        note="Диапазон дат: value — объект { start, end }. Анатомия та же, что у Calendar; начало и конец периода красятся data-атрибутами RAC, отдельных пропов нет."
      >
        <RangeCalendar
          aria-label={`Период проведения — ${TOURNAMENTS[0]}`}
          defaultValue={{ start: START, end: END }}
        >
          <RangeMonth />
        </RangeCalendar>
      </Section>
    </Shell>
  ),
};

/* ── Выбор года ─────────────────────────────────────────────────── */
export const YearPicker = {
  name: 'Выбор года',
  render: () => (
    <Shell>
      <Section
        name="CalendarYearPicker"
        note="Не самостоятельный компонент: части живут только внутри Calendar/RangeCalendar и берут состояние из контекста. Открыт через defaultYearPickerOpen на корне календаря — удобен для дат рождения, где листать по месяцу слишком долго."
      >
        <Calendar
          aria-label={`Дата рождения — ${PLAYERS[0].nm}`}
          defaultValue={BIRTH}
          defaultYearPickerOpen
        >
          <Calendar.Header>
            {/* TriggerHeading и TriggerIndicator обязаны стоять внутри Trigger. */}
            <CalendarYearPicker.Trigger>
              <CalendarYearPicker.TriggerHeading />
              <CalendarYearPicker.TriggerIndicator />
            </CalendarYearPicker.Trigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <CalendarYearPicker.Grid>
            <CalendarYearPicker.GridBody>
              {({ year, formattedYear }) => (
                <CalendarYearPicker.Cell key={year} year={year}>
                  {formattedYear}
                </CalendarYearPicker.Cell>
              )}
            </CalendarYearPicker.GridBody>
          </CalendarYearPicker.Grid>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </Section>
    </Shell>
  ),
};

/* ── Поля ввода ─────────────────────────────────────────────────── */
export const Fields = {
  name: 'Поля даты и времени',
  render: () => (
    <Shell>
      <Section
        name="DateField"
        note="Посегментный ввод даты без календаря. Обязательная цепочка: Group → InputContainer → Input (children — функция) → Segment."
      >
        <div className="flex items-center gap-3">
          <img
            src={PLAYERS[0].av}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="text-sm">
            <div className="font-medium">{PLAYERS[0].nm}</div>
            <div className="text-neutral-500">
              {PLAYERS[0].rank} · {PLAYERS[0].city}
            </div>
          </div>
        </div>
        <Labeled caption="Дата рождения">
          <DateField aria-label={`Дата рождения — ${PLAYERS[0].nm}`} defaultValue={BIRTH}>
            <DateField.Group>
              <DateField.InputContainer>
                <DateField.Input>
                  {(segment) => <DateField.Segment segment={segment} />}
                </DateField.Input>
              </DateField.InputContainer>
            </DateField.Group>
          </DateField>
        </Labeled>
        <Row
          prop="состояния"
          vals={['isDisabled', 'isInvalid']}
          render={(v) => (
            <DateField
              aria-label={`Дата рождения — ${PLAYERS[0].nm}`}
              defaultValue={BIRTH}
              isDisabled={v === 'isDisabled'}
              isInvalid={v === 'isInvalid'}
            >
              <DateField.Group>
                <DateField.InputContainer>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                </DateField.InputContainer>
              </DateField.Group>
            </DateField>
          )}
        />
      </Section>

      <Section
        name="TimeField"
        note="Те же части, что у DateField, но значение — Time из @internationalized/date; локаль ru-RU даёт 24-часовой цикл сама."
      >
        <Labeled caption={`Начало матча · ${CITIES[0]}`}>
          <TimeField
            aria-label={`Время начала матча — ${CITIES[0]}`}
            defaultValue={new Time(17, 0)}
          >
            <TimeField.Group>
              <TimeField.Prefix>
                <Clock size={16} />
              </TimeField.Prefix>
              <TimeField.InputContainer>
                <TimeField.Input>
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.InputContainer>
            </TimeField.Group>
          </TimeField>
        </Labeled>
      </Section>

      <Section
        name="DateInputGroup"
        note="Каркас всех полей даты/времени и единственный компонент группы с настоящими вариантами: variant красит рамку, fullWidth растягивает. Сам по себе не работает — только внутри DateField/TimeField/DatePicker/DateRangePicker."
      >
        <Row
          prop="variant"
          vals={values(dateInputGroupVariants, 'variant')}
          render={(v) => (
            <DateField aria-label={`Дата начала — ${TOURNAMENTS[0]}`} defaultValue={START}>
              <DateInputGroup variant={v as never}>
                <DateInputGroup.Prefix>
                  <CalendarDays size={16} />
                </DateInputGroup.Prefix>
                <DateInputGroup.InputContainer>
                  <DateInputGroup.Input>
                    {(segment: DateInputGroupSegmentProps['segment']) => <DateInputGroup.Segment segment={segment} />}
                  </DateInputGroup.Input>
                </DateInputGroup.InputContainer>
              </DateInputGroup>
            </DateField>
          )}
        />
        <Row
          prop="fullWidth"
          vals={['false', 'true']}
          render={(v) => (
            /* Широкая обёртка — чтобы true было куда тянуться. Сам DateField —
               flex-col со stretch по умолчанию, и без items-start он растягивал
               группу на всю обёртку даже при fullWidth=false — варианты были
               неотличимы. */
            <div className="w-96">
              <DateField
                aria-label={`Дата начала — ${TOURNAMENTS[0]}`}
                defaultValue={START}
                className="items-start"
              >
                <DateInputGroup fullWidth={v === 'true'}>
                  <DateInputGroup.InputContainer>
                    <DateInputGroup.Input>
                      {(segment: DateInputGroupSegmentProps['segment']) => <DateInputGroup.Segment segment={segment} />}
                    </DateInputGroup.Input>
                  </DateInputGroup.InputContainer>
                </DateInputGroup>
              </DateField>
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Поповеры: по одному открытому порталу на историю ───────────── */
export const DatePickerOpen = {
  name: 'Выбор даты (открыт)',
  render: () => (
    <Shell>
      <Section
        name="DatePicker"
        note="Поле + поповер + календарь одним состоянием RAC. Popover — портал (PortalProvider кита направляет его внутрь .hero-scope); здесь заморожен isOpen, чтобы скриншот показывал календарь. Calendar внутри без value и aria-label — всё из контекста."
      >
        <Labeled caption="Дата начала турнира">
          <DatePicker
            aria-label={`Дата начала — ${TOURNAMENTS[0]}`}
            defaultValue={START}
            isOpen
          >
            <DateInputGroup>
              <DateInputGroup.InputContainer>
                <DateInputGroup.Input>
                  {(segment: DateInputGroupSegmentProps['segment']) => <DateInputGroup.Segment segment={segment} />}
                </DateInputGroup.Input>
              </DateInputGroup.InputContainer>
              <DateInputGroup.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
              </DateInputGroup.Suffix>
            </DateInputGroup>
            <DatePicker.Popover>
              <Calendar>
                <CalendarMonth />
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        </Labeled>
        {/* Запас высоты: поповер раскрывается вниз от поля. */}
        <div className="h-96" aria-hidden />
      </Section>
    </Shell>
  ),
};

export const DateRangePickerOpen = {
  name: 'Период проведения (открыт)',
  render: () => (
    <Shell>
      <Section
        name="DateRangePicker"
        note="Два Input со slot=start и slot=end (без слотов RAC не привяжет сегменты к краям диапазона), между ними RangeSeparator. Поповер заморожен isOpen; RangeCalendar внутри — без своих значений."
      >
        <Labeled caption={`Период проведения · ${TOURNAMENTS[0]}`}>
          <DateRangePicker
            aria-label={`Период проведения — ${TOURNAMENTS[0]}`}
            defaultValue={{ start: START, end: END }}
            isOpen
          >
            <DateInputGroup>
              <DateInputGroup.InputContainer>
                <DateInputGroup.Input slot="start">
                  {(segment: DateInputGroupSegmentProps['segment']) => <DateInputGroup.Segment segment={segment} />}
                </DateInputGroup.Input>
                <DateRangePicker.RangeSeparator />
                <DateInputGroup.Input slot="end">
                  {(segment: DateInputGroupSegmentProps['segment']) => <DateInputGroup.Segment segment={segment} />}
                </DateInputGroup.Input>
              </DateInputGroup.InputContainer>
              <DateInputGroup.Suffix>
                <DateRangePicker.Trigger>
                  <DateRangePicker.TriggerIndicator />
                </DateRangePicker.Trigger>
              </DateInputGroup.Suffix>
            </DateInputGroup>
            <DateRangePicker.Popover>
              <RangeCalendar>
                <RangeMonth />
              </RangeCalendar>
            </DateRangePicker.Popover>
          </DateRangePicker>
        </Labeled>
        {/* Запас высоты: поповер раскрывается вниз от поля. */}
        <div className="h-96" aria-hidden />
      </Section>
    </Shell>
  ),
};
