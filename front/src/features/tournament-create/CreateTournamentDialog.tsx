'use client';

/* «Новый турнир» в кабинете администратора ✳ (28.10.2026). HeroUI + Tailwind.

   Поля — те, что принимает `POST /api/tournaments/`: название, день начала,
   формат, размер группы (только для «Группы и плей-офф») и описание. Турнир
   протоколом вручную здесь не заводится — у него свой путь через рейтинг. */

import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  I18nProvider,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  useOverlayState,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import {
  createTournament,
  FORMAT_LABEL,
  type NewTournament,
  type TournamentSummary,
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
  format: 'single_elimination',
  groupSize: 4,
  description: '',
});

export function CreateTournamentDialog({ onCreated }: { onCreated: (t: TournamentSummary) => void }) {
  const state = useOverlayState();
  const narrow = useNarrow();
  const [form, setForm] = useState<NewTournament>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof NewTournament>(k: K, v: NewTournament[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const ready = form.name.trim() !== '' && form.date !== '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createTournament(form);
      state.close();
      setForm(EMPTY());
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

                {/* DatePicker HeroUI, а не `<input type="date">`: родное поле пишет
                      дату по языку браузера (в английском Chrome — 10/20/2026). */}
                <I18nProvider locale="ru-RU">
                  <DatePicker
                    isRequired
                    value={form.date ? parseDate(form.date) : null}
                    onChange={(v) => set('date', v ? v.toString() : '')}
                  >
                    <Label>Дата начала</Label>
                    <DateField.Group fullWidth className="rounded-xl" data-testid="tournament-date">
                      <DateField.Input>
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateField.Suffix>
                        <DatePicker.Trigger aria-label="Выбрать дату">
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    <DatePicker.Popover className="rounded-xl">
                      <Calendar aria-label="Дата начала">
                        <Calendar.Header>
                          <Calendar.Heading />
                          <Calendar.NavButton slot="previous" />
                          <Calendar.NavButton slot="next" />
                        </Calendar.Header>
                        <Calendar.Grid>
                          <Calendar.GridHeader>
                            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                        </Calendar.Grid>
                      </Calendar>
                    </DatePicker.Popover>
                  </DatePicker>
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

                <TextField value={form.description} onChange={(v) => set('description', v)}>
                  <Label>Описание</Label>
                  <TextArea rows={3} className="rounded-xl" />
                </TextField>

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
