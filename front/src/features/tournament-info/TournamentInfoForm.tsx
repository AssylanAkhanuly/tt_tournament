'use client';

/* Сведения редактируются вертикально, рядом — связанный проект протокола.
   Ввод меняет черновик и предпросмотр; на сервер он уходит по «Сохранить». */

import {
  Button,
  DateField,
  DateRangePicker,
  I18nProvider,
  Input,
  ListBox,
  NumberField,
  RangeCalendar,
  Select,
  Slider,
  Switch,
  Tabs,
  TextArea,
  TextField,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Check, CircleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  FORMAT_LABEL,
  LEVEL_LABEL,
  updateTournament,
  type TournamentFormat,
  type TournamentInfo,
  type TournamentLevel,
  type TournamentSummary,
} from '@/entities/tournament';
import { TournamentProtocolPreview, type ProtocolField } from './TournamentProtocolPreview';

const AGE_SCALE = [5, 90] as const;
const GAMES = [2, 3, 4, 5];
const FORMATS: TournamentFormat[] = ['single_elimination', 'group_playoff'];
const LEVELS = Object.keys(LEVEL_LABEL) as TournamentLevel[];
type NumberKey = 'ageMin' | 'ageMax' | 'groupSize';
const dayOf = (d: Date | null) =>
  d
    ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    : null;
const infoOf = (t: TournamentSummary): TournamentInfo => ({
  name: t.name,
  description: t.description,
  startsOn: dayOf(t.startsAt),
  endsAt: t.endsAt,
  city: t.city,
  venue: t.venue,
  ageMin: t.ageMin,
  ageMax: t.ageMax,
  format: t.format,
  groupSize: t.groupSize,
  gamesToWin: t.gamesToWin,
  level: t.level,
  isRating: t.isRating,
});

function Row({
  label,
  field,
  onFocus,
  children,
  top,
}: {
  label: string;
  field: ProtocolField;
  onFocus: (field: ProtocolField) => void;
  children: ReactNode;
  top?: boolean;
}) {
  return (
    <div
      className={
        'grid min-w-0 grid-cols-1 gap-2 py-3 @[520px]:grid-cols-[140px_minmax(0,1fr)] @[520px]:gap-5 ' +
        (top ? 'items-start' : 'items-center')
      }
      data-info-field={field}
      onFocusCapture={() => onFocus(field)}
    >
      <span className={'text-[13px] font-medium text-neutral-700 ' + (top ? '@[520px]:pt-2' : '')}>{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Group({ title, children, testId }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="border-b border-neutral-200 py-5 last:border-b-0" data-testid={testId}>
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{title}</h2>
      <div className="divide-y divide-neutral-100">{children}</div>
    </section>
  );
}

export function TournamentInfoForm({
  tournament,
  onSaved,
}: {
  tournament: TournamentSummary;
  onSaved: (t: TournamentSummary) => void;
}) {
  const saved = infoOf(tournament);
  const [draft, setDraft] = useState<TournamentInfo>(saved);
  const [numberInput, setNumberInput] = useState<Partial<Record<NumberKey, string>>>({});
  const [activeField, setActiveField] = useState<ProtocolField | null>(null);
  const [mobilePanel, setMobilePanel] = useState('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof TournamentInfo>(k: K, v: TournamentInfo[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const changed =
    JSON.stringify(draft) !== JSON.stringify(saved) ||
    Object.entries(numberInput).some(([key, value]) => value !== String(draft[key as NumberKey] ?? ''));
  const preview = {
    ...draft,
    ...Object.fromEntries(
      Object.entries(numberInput)
        .filter(([key]) => key !== 'groupSize')
        .map(([key, value]) => [key, value === '' ? null : Number(value)]),
    ),
  };
  const ready = draft.name.trim() !== '';
  const manual = tournament.format === 'manual';
  const age: [number, number] = [draft.ageMin ?? AGE_SCALE[0], draft.ageMax ?? AGE_SCALE[1]];
  const setAge = ([lo, hi]: number[]) =>
    setDraft((d) => ({
      ...d,
      ageMin: lo <= AGE_SCALE[0] ? null : lo,
      ageMax: hi >= AGE_SCALE[1] ? null : hi,
    }));
  // Промежуточный ввод нужен только протоколу: изменение value NumberField
  // на каждом символе преждевременно округляет «1» до minValue=5 при вводе «12».
  const typeNumber = (key: NumberKey, value: string) => {
    if (/^\d*$/.test(value)) setNumberInput((current) => ({ ...current, [key]: value }));
  };
  const clearNumber = (key: NumberKey) => {
    setNumberInput((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const t = await updateTournament(tournament.id, draft);
      setDraft(infoOf(t));
      setNumberInput({});
      onSaved(t);
      setActiveField(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white font-sans" data-testid="tournament-info">
      <Tabs
        selectedKey={mobilePanel}
        onSelectionChange={(key) => setMobilePanel(String(key))}
        className="shrink-0 border-b border-neutral-200 px-4 py-2 lg:hidden"
      >
        <Tabs.ListContainer className="rounded-xl">
          <Tabs.List aria-label="Сведения и документ">
            <Tabs.Tab id="form">
              Сведения
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="protocol">
              Протокол
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div className="flex min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,1fr)]">
        <div className={'min-h-0 min-w-0 flex-1 flex-col ' + (mobilePanel === 'form' ? 'flex' : 'hidden lg:flex')}>
          <div className="min-h-0 flex-1 overflow-auto px-4 sm:px-6" data-testid="info-scroll">
            <div className="@container mx-auto max-w-3xl pb-4">
              <Group title="Общее">
                <Row label="Название" field="name" onFocus={setActiveField}>
                  <TextField
                    aria-label="Название"
                    value={draft.name}
                    onChange={(v) => set('name', v)}
                    isRequired
                    isDisabled={busy}
                  >
                    <Input className="rounded-xl" data-testid="info-name" />
                  </TextField>
                </Row>
                <Row label="Описание" field="description" onFocus={setActiveField} top>
                  <TextField
                    aria-label="Описание"
                    value={draft.description}
                    onChange={(v) => set('description', v)}
                    isDisabled={busy}
                  >
                    <TextArea rows={3} className="resize-y rounded-xl" data-testid="info-description" />
                  </TextField>
                </Row>
              </Group>

              <Group title="Даты и место" testId="info-where">
                <Row label="Даты" field="dates" onFocus={setActiveField}>
                  <I18nProvider locale="ru-RU">
                    <DateRangePicker
                      aria-label="Даты"
                      isDisabled={busy}
                      value={
                        draft.startsOn
                          ? { start: parseDate(draft.startsOn), end: parseDate(draft.endsAt ?? draft.startsOn) }
                          : null
                      }
                      onChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          startsOn: v ? v.start.toString() : null,
                          endsAt: v ? v.end.toString() : null,
                        }))
                      }
                    >
                      <DateField.Group className="w-full min-w-0 rounded-xl" data-testid="info-dates">
                        <DateField.Input slot="start">{(s) => <DateField.Segment segment={s} />}</DateField.Input>
                        <DateRangePicker.RangeSeparator />
                        <DateField.Input slot="end">{(s) => <DateField.Segment segment={s} />}</DateField.Input>
                        <DateField.Suffix>
                          <DateRangePicker.Trigger aria-label="Выбрать даты">
                            <DateRangePicker.TriggerIndicator />
                          </DateRangePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DateRangePicker.Popover className="rounded-xl">
                        <RangeCalendar aria-label="Даты турнира">
                          <RangeCalendar.Header>
                            <RangeCalendar.Heading />
                            <RangeCalendar.NavButton slot="previous" />
                            <RangeCalendar.NavButton slot="next" />
                          </RangeCalendar.Header>
                          <RangeCalendar.Grid>
                            <RangeCalendar.GridHeader>
                              {(d) => <RangeCalendar.HeaderCell>{d}</RangeCalendar.HeaderCell>}
                            </RangeCalendar.GridHeader>
                            <RangeCalendar.GridBody>
                              {(date) => <RangeCalendar.Cell date={date} />}
                            </RangeCalendar.GridBody>
                          </RangeCalendar.Grid>
                        </RangeCalendar>
                      </DateRangePicker.Popover>
                    </DateRangePicker>
                  </I18nProvider>
                </Row>
                <Row label="Город" field="city" onFocus={setActiveField}>
                  <TextField aria-label="Город" value={draft.city} onChange={(v) => set('city', v)} isDisabled={busy}>
                    <Input className="rounded-xl" placeholder="Астана" data-testid="info-city" />
                  </TextField>
                </Row>
                <Row label="Место проведения" field="venue" onFocus={setActiveField}>
                  <TextField
                    aria-label="Место проведения"
                    value={draft.venue}
                    onChange={(v) => set('venue', v)}
                    isDisabled={busy}
                  >
                    <Input className="rounded-xl" placeholder="Зал, адрес" data-testid="info-venue" />
                  </TextField>
                </Row>
              </Group>

              <Group title="Участники">
                <Row label="Возраст, лет" field="age" onFocus={setActiveField}>
                  <div className="flex items-center gap-3" data-testid="info-age">
                    <NumberField
                      aria-label="Возраст от"
                      isDisabled={busy}
                      value={draft.ageMin ?? NaN}
                      onChange={(v) => set('ageMin', Number.isNaN(v) ? null : v)}
                      minValue={AGE_SCALE[0]}
                      maxValue={draft.ageMax ?? AGE_SCALE[1]}
                      className="w-16 shrink-0"
                    >
                      <NumberField.Group className="rounded-xl">
                        <NumberField.Input
                          placeholder="от"
                          data-testid="info-age-min"
                          onInput={(e) => typeNumber('ageMin', e.currentTarget.value)}
                          onBlur={() => clearNumber('ageMin')}
                        />
                      </NumberField.Group>
                    </NumberField>
                    <Slider
                      aria-label="Возраст"
                      isDisabled={busy}
                      value={age}
                      onChange={(v) => setAge(v as number[])}
                      minValue={AGE_SCALE[0]}
                      maxValue={AGE_SCALE[1]}
                      className="min-w-0 flex-1"
                      data-testid="info-age-slider"
                    >
                      <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb index={0} aria-label="От" />
                        <Slider.Thumb index={1} aria-label="До" />
                      </Slider.Track>
                    </Slider>
                    <NumberField
                      aria-label="Возраст до"
                      isDisabled={busy}
                      value={draft.ageMax ?? NaN}
                      onChange={(v) => set('ageMax', Number.isNaN(v) ? null : v)}
                      minValue={draft.ageMin ?? AGE_SCALE[0]}
                      maxValue={AGE_SCALE[1]}
                      className="w-16 shrink-0"
                    >
                      <NumberField.Group className="rounded-xl">
                        <NumberField.Input
                          placeholder="до"
                          data-testid="info-age-max"
                          onInput={(e) => typeNumber('ageMax', e.currentTarget.value)}
                          onBlur={() => clearNumber('ageMax')}
                        />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </Row>
              </Group>

              <Group title="Формат">
                <Row label="Система" field="format" onFocus={setActiveField}>
                  <Select
                    aria-label="Система"
                    selectedKey={draft.format}
                    onSelectionChange={(k) => k && set('format', k as TournamentFormat)}
                    isDisabled={manual || busy}
                    className="w-full min-w-0"
                  >
                    <Select.Trigger className="rounded-xl" data-testid="info-format">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="rounded-xl">
                      <ListBox>
                        {(manual ? (['manual'] as TournamentFormat[]) : FORMATS).map((f) => (
                          <ListBox.Item key={f} id={f} textValue={FORMAT_LABEL[f]} className="rounded-xl">
                            {FORMAT_LABEL[f]}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </Row>
                {draft.format === 'group_playoff' && (
                  <Row label="Игроков в группе" field="groupSize" onFocus={setActiveField}>
                    <NumberField
                      aria-label="Игроков в группе"
                      isDisabled={busy}
                      value={draft.groupSize}
                      onChange={(v) => !Number.isNaN(v) && set('groupSize', v)}
                      minValue={2}
                      className="w-32"
                    >
                      <NumberField.Group className="rounded-xl">
                        <NumberField.DecrementButton />
                        <NumberField.Input
                          data-testid="info-group-size"
                          onInput={(e) => typeNumber('groupSize', e.currentTarget.value)}
                          onBlur={() => clearNumber('groupSize')}
                        />
                        <NumberField.IncrementButton />
                      </NumberField.Group>
                    </NumberField>
                  </Row>
                )}
                <Row label="Матч до побед" field="gamesToWin" onFocus={setActiveField}>
                  <Select
                    aria-label="Матч до побед"
                    isDisabled={busy}
                    selectedKey={String(draft.gamesToWin)}
                    onSelectionChange={(k) => k && set('gamesToWin', Number(k))}
                    className="w-32"
                  >
                    <Select.Trigger className="rounded-xl" data-testid="info-games">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="rounded-xl">
                      <ListBox>
                        {GAMES.map((g) => (
                          <ListBox.Item key={g} id={String(g)} textValue={String(g)} className="rounded-xl">
                            {g}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </Row>
                <Row label="Уровень" field="level" onFocus={setActiveField}>
                  <Select
                    aria-label="Уровень"
                    selectedKey={draft.level}
                    onSelectionChange={(k) => k && set('level', k as TournamentLevel)}
                    isDisabled={busy}
                    className="w-full min-w-0"
                  >
                    <Select.Trigger className="rounded-xl" data-testid="info-level">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="rounded-xl">
                      <ListBox>
                        {LEVELS.map((l) => (
                          <ListBox.Item key={l} id={l} textValue={LEVEL_LABEL[l]} className="rounded-xl">
                            {LEVEL_LABEL[l]}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </Row>
                <Row label="Рейтинговый" field="isRating" onFocus={setActiveField}>
                  <Switch
                    isSelected={draft.isRating}
                    onChange={(v) => set('isRating', v)}
                    aria-label="Рейтинговый"
                    isDisabled={busy}
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Content>
                  </Switch>
                </Row>
              </Group>
            </div>
          </div>
        </div>
        <div
          className={
            'min-h-0 min-w-0 flex-1 border-neutral-200 lg:flex lg:border-l ' +
            (mobilePanel === 'protocol' ? 'flex' : 'hidden')
          }
        >
          <TournamentProtocolPreview
            draft={preview}
            activeField={activeField}
            participants={tournament.participants}
            mobileVisible={mobilePanel === 'protocol'}
            groupSizeInput={numberInput.groupSize}
          />
        </div>
      </div>
      <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {error && (
            <p
              className="flex w-full items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700"
              role="alert"
              data-testid="info-error"
            >
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <Button
            variant="tertiary"
            className="rounded-xl max-sm:ml-auto"
            isDisabled={!changed || busy}
            onPress={() => {
              setDraft(saved);
              setNumberInput({});
              setError(null);
              setActiveField(null);
            }}
            data-testid="info-discard"
          >
            Отменить
          </Button>
          <Button
            variant="primary"
            className="gap-2 rounded-xl"
            isDisabled={!changed || !ready || busy}
            onPress={() => void save()}
            data-testid="info-save"
          >
            <Check size={16} aria-hidden="true" />
            {busy ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
