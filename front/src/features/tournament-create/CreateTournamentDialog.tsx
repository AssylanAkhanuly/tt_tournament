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
   турнир, а дивизион сезона: название, розыгрыш, уровень, сезон. Дат нет — их
   дают туры дивизиона. Сервер командный вид в список не отдаёт (турнира такого
   вида не бывает), пункт добавляет диалог, когда открывший просит
   (`withLeague`). */

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

import { createDivision, GENDER_LABEL, type LeagueGender } from '@/entities/league';
import {
  CATEGORY_LABEL,
  createTournament,
  FORMAT_LABEL,
  type NewTournament,
  useTemplates,
} from '@/entities/tournament';
import { useNarrow } from '@/shared/kit/app';
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

type LeagueForm = { gender: LeagueGender; level: string; season: string };
const LEAGUE_EMPTY = (): LeagueForm => ({ gender: 'm', level: '1', season: String(new Date().getFullYear()) });

export function CreateTournamentDialog({
  onCreated,
  withLeague = false,
}: {
  onCreated: () => void;
  /** Предлагать «Евразийскую лигу» — заводит дивизион сезона. */
  withLeague?: boolean;
}) {
  const state = useOverlayState();
  const narrow = useNarrow();
  const [form, setForm] = useState<NewTournament>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [league, setLeague] = useState<LeagueForm>(LEAGUE_EMPTY);
  const templates = useTemplates();
  const set = <K extends keyof NewTournament>(k: K, v: NewTournament[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const isLeague = form.template === LEAGUE;

  const ready = form.name.trim() !== '' && (isLeague ? league.season.length === 4 : form.date !== '');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      if (isLeague) {
        await createDivision({
          season: Number(league.season),
          gender: league.gender,
          name: form.name.trim(),
          level: Number(league.level) || 1,
        });
      } else {
        await createTournament(form);
      }
      state.close();
      setForm(EMPTY());
      setLeague(LEAGUE_EMPTY());
      onCreated();
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
                    <Picker
                      label="Розыгрыш"
                      showLabel
                      testId="league-gender"
                      value={league.gender}
                      options={(['m', 'f'] as LeagueGender[]).map((g) => ({ id: g, label: GENDER_LABEL[g] }))}
                      onChange={(k) => setLeague((l) => ({ ...l, gender: k as LeagueGender }))}
                    />
                    <TextField value={league.level} onChange={(v) => setLeague((l) => ({ ...l, level: v.replace(/\D/g, '') }))}>
                      <Label>Уровень (1 — Суперлига)</Label>
                      <Input inputMode="numeric" className="rounded-xl" data-testid="league-level" />
                    </TextField>
                    <TextField
                      value={league.season}
                      onChange={(v) => setLeague((l) => ({ ...l, season: v.replace(/\D/g, '').slice(0, 4) }))}
                    >
                      <Label>Сезон</Label>
                      <Input inputMode="numeric" className="rounded-xl" data-testid="league-season" />
                    </TextField>
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
