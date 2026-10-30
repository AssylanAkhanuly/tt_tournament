'use client';

/* «Настройки» раздела турнира ✳ (29.10.2026, решение владельца продукта) — у
   председателя ГСК и администратора в разделах «Судьи» и «Спортсмены» (`of`:
   чей приём). Кнопка открывает панель справа (HeroUI `Drawer`): заголовок
   отделён чертой, настройки — строками «подпись слева, поле справа». Первая —
   «Приём заявок» (судей или игроков); у открытого приёма строкой ниже —
   необязательный срок «до» (включительно; по нему приём закрывается сам; без
   срока — открыт, пока не выключат). У судей заявку решает председатель, игрок
   при открытом приёме записывается сам.

   Правки — черновик: на сервер уходят разом по «Сохранить» в подвале,
   «Отменить» возвращает сохранённое; обе кнопки неактивны, пока ничего не
   изменено. Панель открывается всегда с сохранённым. HeroUI + Tailwind. */

import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  Drawer,
  I18nProvider,
  Label,
  Switch,
  useOverlayState,
} from '@heroui/react';
import { parseDate, type CalendarDate } from '@internationalized/date';
import { Settings } from 'lucide-react';
import { useState } from 'react';

import { setRecruitment, type Recruitment, type RecruitmentOf, type TournamentSummary } from '@/entities/tournament';

/** Кнопка «Настройки». Отдельно — чтобы экран показал её сразу, неактивной,
 *  пока турнир грузится, и полоса над таблицей не прыгала. */
export function SettingsButton({ isDisabled }: { isDisabled?: boolean }) {
  return (
    <Button variant="outline" size="sm" className="rounded-xl" isDisabled={isDisabled} data-testid="tournament-settings">
      <Settings size={16} /> Настройки
    </Button>
  );
}

type Draft = { open: boolean; until: CalendarDate | null };

const draftOf = (r: Recruitment): Draft => ({ open: r.open, until: r.until ? parseDate(r.until) : null });

export function RecruitmentSettings({
  tournamentId,
  of,
  recruitment,
  onChanged,
}: {
  tournamentId: string;
  /** Чей приём заявок правится. */
  of: RecruitmentOf;
  recruitment: Recruitment;
  onChanged: (t: TournamentSummary) => void;
}) {
  const saved = draftOf(recruitment);
  const [draft, setDraft] = useState<Draft>(saved);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Открылась панель — черновик с сохранённого: прошлые неотправленные правки не тянутся.
  const state = useOverlayState({
    onOpenChange: (isOpen) => {
      if (isOpen) {
        setDraft(draftOf(recruitment));
        setError(null);
      }
    },
  });

  const changed = draft.open !== saved.open || String(draft.until) !== String(saved.until);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      onChanged(
        await setRecruitment(tournamentId, of, { open: draft.open, until: draft.until?.toString() ?? null }),
      );
      state.close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer state={state}>
      <SettingsButton />
      <Drawer.Backdrop>
        {/* Ширина — у самой панели: `Content` у HeroUI — полоса на весь экран. */}
        <Drawer.Content placement="right">
          <Drawer.Dialog className="sm:w-[26rem]" data-testid="tournament-settings-drawer">
            <Drawer.CloseTrigger aria-label="Закрыть" />
            {/* Черта под заголовком — заголовок отделён от настроек. */}
            <Drawer.Header className="border-b border-neutral-200 pb-4">
              <Drawer.Heading className="text-lg font-semibold">Настройки</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="pt-5">
              <section className="flex flex-col gap-4" data-testid="recruitment-settings">
                {/* Строка настройки: подпись слева, переключатель справа. */}
                <Switch
                  isSelected={draft.open}
                  onChange={(open) => setDraft((d) => ({ ...d, open }))}
                  className="w-full"
                  data-testid="recruitment-switch"
                >
                  <Switch.Content className="w-full justify-between">
                    <Label className="text-[14px] font-medium">Приём заявок</Label>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
                {/* Срок — только у открытого приёма: у закрытого ему нечего ограничивать. */}
                {draft.open && (
                  <I18nProvider locale="ru-RU">
                    <DatePicker
                      value={draft.until}
                      onChange={(v) => setDraft((d) => ({ ...d, until: v as CalendarDate | null }))}
                      className="flex flex-row items-center justify-between gap-3"
                    >
                      <Label className="text-[14px] font-medium">Срок, до</Label>
                      <DateField.Group className="w-44 rounded-xl" data-testid="recruitment-until">
                        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger aria-label="Выбрать дату">
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover className="rounded-xl">
                        <Calendar aria-label="Срок приёма">
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
                )}
                {draft.open && draft.until && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit self-end rounded-xl"
                    onPress={() => setDraft((d) => ({ ...d, until: null }))}
                    data-testid="recruitment-until-clear"
                  >
                    Без срока
                  </Button>
                )}
                {error && (
                  <p className="text-[13px] text-red-600" data-testid="recruitment-error">
                    {error}
                  </p>
                )}
              </section>
            </Drawer.Body>
            <Drawer.Footer className="flex justify-end gap-2">
              <Button
                variant="tertiary"
                className="rounded-xl"
                isDisabled={!changed || busy}
                onPress={() => setDraft(saved)}
                data-testid="settings-discard"
              >
                Отменить
              </Button>
              <Button
                variant="primary"
                className="rounded-xl"
                isDisabled={!changed || busy}
                onPress={() => void save()}
                data-testid="settings-save"
              >
                Сохранить
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
