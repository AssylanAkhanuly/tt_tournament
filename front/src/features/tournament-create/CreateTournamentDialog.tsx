'use client';

/* «Новый турнир» в кабинете администратора ✳ (28.10.2026). HeroUI + Tailwind.

   Поля — те, что принимает `POST /api/tournaments/`: название, даты —
   диапазоном, как в «Сведениях» ✳ (03.11.2026, решение владельца продукта:
   начало и окончание сразу; однодневный — оба конца в один день), формат и
   размер группы (только для «Группы и плей-офф»). Описания здесь нет
   ✳ (03.11.2026) — оно правится в «Сведениях». Турнир протоколом вручную здесь
   не заводится — у него свой путь через рейтинг.

   Вид соревнования ✳ (19.11.2026, ADMISSION.md) — первым полем: он засевает
   условия допуска (кто подаёт заявку, квота региона) и значок турнира.
   Список видов — с сервера (`useTemplates`); «Без вида» — спортсмен
   записывается сам, как раньше.

   «Евразийская лига» ✳ (19.11.2026, решение владельца продукта: Лига — в
   календаре, как турниры, а не отдельным разделом) — тоже вид, но заводит не
   турнир, а **сезон Лиги** (LEAGUE.md «Сезон»): название, год и необязательный
   срок регистрации команд (указан — регистрация открыта до него). Дат и формата
   нет — даты дают туры, лиги заводятся на странице сезона, куда и ведёт
   открывший (`onCreated({seasonId})`). Сервер командный вид в список не отдаёт
   (турнира такого вида не бывает), пункт добавляет диалог, когда открывший
   просит (`withLeague`). */

import {
  Button,
  DateField,
  DateRangePicker,
  I18nProvider,
  Input,
  Label,
  Modal,
  RangeCalendar,
  TextField,
  useOverlayState,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { createSeason } from '@/entities/league';
import {
  CATEGORY_LABEL,
  createTournament,
  FORMAT_LABEL,
  type NewTournament,
  useTemplates,
} from '@/entities/tournament';
import { useNarrow } from '@/shared/kit/app';
import { DateInput } from '@/shared/ui/DateInput';
import { Picker } from '@/shared/ui/Picker';
import { ModalSheet } from '@/shared/ui/ModalSheet';

const FORMATS: NewTournament['format'][] = ['single_elimination', 'group_playoff'];

const today = () => {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

const EMPTY = (): NewTournament => ({
  name: '',
  date: today(),
  endsAt: today(),
  format: 'single_elimination',
  groupSize: 4,
  template: '',
});

// Ключ пункта «Без вида»: у `Select` HeroUI пустой ключ не выбирается.
const NO_KIND = 'none';
// Вид «Евразийская лига» — код шаблона сервера.
const LEAGUE = 'eurasian_league';

type SeasonForm = { year: string; registrationUntil: string | null };
const SEASON_EMPTY = (): SeasonForm => ({ year: String(new Date().getFullYear()), registrationUntil: null });

export function CreateTournamentDialog({
  onCreated,
  withLeague = false,
}: {
  /** Заведено; у сезона Лиги — его id (открывший ведёт на страницу сезона). */
  onCreated: (created?: { seasonId?: string }) => void;
  /** Предлагать «Евразийскую лигу» — заводит сезон Лиги. */
  withLeague?: boolean;
}) {
  const state = useOverlayState();
  const narrow = useNarrow();
  const [form, setForm] = useState<NewTournament>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [season, setSeason] = useState<SeasonForm>(SEASON_EMPTY);
  const templates = useTemplates();
  const set = <K extends keyof NewTournament>(k: K, v: NewTournament[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const isLeague = form.template === LEAGUE;

  const ready = form.name.trim() !== '' && (isLeague ? season.year.length === 4 : form.date !== '');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      let created: { seasonId?: string } | undefined;
      if (isLeague) {
        const s = await createSeason({
          year: Number(season.year),
          name: form.name.trim(),
          registrationUntil: season.registrationUntil,
        });
        created = { seasonId: s.id };
      } else {
        await createTournament(form);
      }
      state.close();
      setForm(EMPTY());
      setSeason(SEASON_EMPTY());
      onCreated(created);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    // Кнопка — внутри `Modal`: это его триггер (DialogTrigger). Снаружи, с
    // открытием через состояние, react-aria ругается «PressResponder without a
    // pressable child».
    <Modal state={state}>
      {/* На телефоне — круглая кнопка «+» в правом нижнем углу области
          ✳ (03.11.2026, решение владельца продукта): в шапке месяца ей не
          хватало места. Родитель области — `relative`. */}
      {narrow ? (
        <Button
          isIconOnly
          variant="primary"
          aria-label="Новый турнир"
          className="absolute bottom-4 right-4 z-20 size-14 rounded-full shadow-lg"
          data-testid="tournament-create-open"
        >
          <Plus size={24} />
        </Button>
      ) : (
        <Button variant="primary" size="sm" className="rounded-xl" data-testid="tournament-create-open">
          <Plus size={16} /> Новый турнир
        </Button>
      )}
      <ModalSheet size="md" className="rounded-xl" testId="tournament-create">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="text-lg font-semibold">Новый турнир</Modal.Heading>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="flex flex-col gap-4">
                <TextField isRequired value={form.name} onChange={(v) => set('name', v)} autoFocus>
                  <Label>Название</Label>
                  <Input className="rounded-xl" />
                </TextField>

                <Picker
                  label="Вид соревнования"
                  showLabel
                  testId="tournament-kind-picker"
                  value={form.template || NO_KIND}
                  options={[
                    { id: NO_KIND, label: 'Без вида' },
                    ...(templates.data ?? []).map((t) => ({ id: t.code, label: t.name })),
                    ...(withLeague ? [{ id: LEAGUE, label: CATEGORY_LABEL.league }] : []),
                  ]}
                  onChange={(k) => set('template', k === NO_KIND ? '' : k)}
                />

                {isLeague && (
                  <>
                    <TextField
                      value={season.year}
                      onChange={(v) => setSeason((s) => ({ ...s, year: v.replace(/\D/g, '').slice(0, 4) }))}
                    >
                      <Label>Год</Label>
                      <Input inputMode="numeric" className="rounded-xl" data-testid="season-year" />
                    </TextField>
                    <DateInput
                      label="Регистрация команд до"
                      value={season.registrationUntil}
                      onChange={(v) => setSeason((s) => ({ ...s, registrationUntil: v }))}
                      testId="season-registration-until"
                    />
                  </>
                )}

                {!isLeague && (
                  <>
                {/* Диапазон HeroUI, как в «Сведениях», а не `<input type="date">`:
                    родное поле пишет дату по языку браузера (10/20/2026). */}
                <I18nProvider locale="ru-RU">
                  <DateRangePicker
                    isRequired
                    value={form.date ? { start: parseDate(form.date), end: parseDate(form.endsAt || form.date) } : null}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, date: v ? v.start.toString() : '', endsAt: v ? v.end.toString() : '' }))
                    }
                  >
                    <Label>Даты</Label>
                    <DateField.Group fullWidth className="w-full min-w-0 rounded-xl" data-testid="tournament-date">
                      <DateField.Input slot="start">{(seg) => <DateField.Segment segment={seg} />}</DateField.Input>
                      <DateRangePicker.RangeSeparator />
                      <DateField.Input slot="end">{(seg) => <DateField.Segment segment={seg} />}</DateField.Input>
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
                          <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
                        </RangeCalendar.Grid>
                      </RangeCalendar>
                    </DateRangePicker.Popover>
                  </DateRangePicker>
                </I18nProvider>

                <Picker
                  label="Формат"
                  showLabel
                  value={form.format}
                  options={FORMATS.map((f) => ({ id: f, label: FORMAT_LABEL[f] }))}
                  onChange={(k) => set('format', k as NewTournament['format'])}
                />

                {form.format === 'group_playoff' && (
                  <TextField
                    value={String(form.groupSize)}
                    onChange={(v) => set('groupSize', Math.max(2, Number(v.replace(/\D/g, '')) || 2))}
                  >
                    <Label>Игроков в группе</Label>
                    <Input inputMode="numeric" className="rounded-xl" />
                  </TextField>
                )}
                  </>
                )}

                {error && (
                  <p className="text-[13px] text-red-600" data-testid="tournament-create-error">
                    {error}
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
                  Отмена
                </Button>
                <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!ready || busy}>
                  Завести
                </Button>
              </Modal.Footer>
            </form>
          </ModalSheet>
    </Modal>
  );
}
