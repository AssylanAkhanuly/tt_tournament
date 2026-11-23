'use client';

/* «Настройки» сезона Лиги ✳ (19.11.2026, решение владельца продукта: «как у
   игроков в турнире») — кнопка над таблицей «Команды» страницы сезона,
   панель справа (HeroUI `Drawer`): заголовок отделён чертой, настройки —
   строками «подпись слева, поле справа». «Регистрация команд» — окно, в
   которое клуб заявляет команду сам; у открытой строкой ниже — необязательный
   срок «до» (включительно). Ниже чертой — «Сезон завершён»: закрывает сезон
   для любых изменений (LEAGUE.md «Сезон»).

   Правки — черновик, как у приёма заявок турнира: на сервер уходят разом по
   «Сохранить», «Отменить» возвращает сохранённое, обе неактивны без правок;
   панель всегда открывается с сохранённым. HeroUI + Tailwind. */

import { Button, Drawer, Label, Switch, useOverlayState } from '@heroui/react';
import { Settings } from 'lucide-react';
import { useState } from 'react';

import { updateSeason, type Season } from '@/entities/league';
import { DateInput } from '@/shared/ui/DateInput';
import { SideContent, SideDialog } from '@/shared/ui/SidePanel';

type Draft = { open: boolean; until: string | null; closed: boolean };
const draftOf = (s: Season): Draft => ({ open: s.registration.open, until: s.registration.until, closed: s.closed });

function SettingSwitch({ label, value, onChange, testId }: { label: string; value: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <Switch isSelected={value} onChange={onChange} className="w-full" data-testid={testId}>
      <Switch.Content className="w-full justify-between">
        <Label className="text-[14px] font-medium">{label}</Label>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

export function SeasonSettings({ season, onChanged }: { season: Season; onChanged: () => void }) {
  const saved = draftOf(season);
  const [draft, setDraft] = useState<Draft>(saved);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const state = useOverlayState({
    onOpenChange: (isOpen) => {
      if (isOpen) {
        setDraft(draftOf(season));
        setError(null);
      }
    },
  });
  const changed = draft.open !== saved.open || draft.until !== saved.until || draft.closed !== saved.closed;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await updateSeason(season.id, {
        registrationOpen: draft.open,
        // У закрытой регистрации срока нет: ему нечего ограничивать.
        registrationUntil: draft.open ? draft.until : null,
        closed: draft.closed,
      });
      onChanged();
      state.close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer state={state}>
      <Button variant="outline" size="sm" className="rounded-xl" data-testid="season-settings">
        <Settings size={16} /> Настройки
      </Button>
      <Drawer.Backdrop>
        {/* Ширина — у самой панели: `Content` у HeroUI — полоса на весь экран. */}
        <SideContent>
          <SideDialog className="sm:w-[26rem]" data-testid="season-settings-drawer">
            <Drawer.CloseTrigger aria-label="Закрыть" />
            <Drawer.Header className="border-b border-neutral-200 pb-4">
              <Drawer.Heading className="text-lg font-semibold">Настройки</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="pt-5">
              <section className="flex flex-col gap-4">
                <SettingSwitch
                  label="Регистрация команд"
                  value={draft.open}
                  onChange={(open) => setDraft((d) => ({ ...d, open }))}
                  testId="season-registration-switch"
                />
                {draft.open && (
                  <DateInput
                    inline
                    label="Срок, до"
                    value={draft.until}
                    onChange={(until) => setDraft((d) => ({ ...d, until }))}
                    testId="season-registration-until"
                  />
                )}
                {draft.open && draft.until && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit self-end rounded-xl"
                    onPress={() => setDraft((d) => ({ ...d, until: null }))}
                  >
                    Без срока
                  </Button>
                )}
                <div className="border-t border-neutral-200 pt-4">
                  <SettingSwitch
                    label="Сезон завершён"
                    value={draft.closed}
                    onChange={(closed) => setDraft((d) => ({ ...d, closed }))}
                    testId="season-closed-switch"
                  />
                </div>
                {error && (
                  <p className="text-[13px] text-red-600" data-testid="season-error">
                    {error}
                  </p>
                )}
              </section>
            </Drawer.Body>
            <Drawer.Footer className="flex justify-end gap-2">
              <Button variant="tertiary" className="rounded-xl" isDisabled={!changed || busy} onPress={() => setDraft(saved)}>
                Отменить
              </Button>
              <Button
                variant="primary"
                className="rounded-xl"
                isDisabled={!changed || busy}
                onPress={() => void save()}
                data-testid="season-save"
              >
                Сохранить
              </Button>
            </Drawer.Footer>
          </SideDialog>
        </SideContent>
      </Drawer.Backdrop>
    </Drawer>
  );
}
