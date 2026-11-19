'use client';

/* «Заявить команду» в кабинете администратора клуба ✳ (19.11.2026, LEAGUE.md
   «Заявка клуба»): сезон из тех, где сейчас идёт регистрация, лига этого
   сезона, клуб (если человек ведёт несколько) и название (пусто — как у
   клуба). Заявка уходит федерации «ждёт решения»; состав набирается после — в
   карточке команды. Открытых сезонов нет — кнопка неактивна. HeroUI + Tailwind. */

import { Button, Input, Label, Modal, TextField, useOverlayState } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { GENDER_LABEL, registerTeam, type MyLeague } from '@/entities/league';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

export function ApplyTeamDialog({ my, onCreated }: { my: MyLeague; onCreated: (teamId: string) => void }) {
  const state = useOverlayState();
  const [seasonId, setSeasonId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [clubId, setClubId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Выбранное по умолчанию — первое из списка: в первом сезоне чаще всего одна дорога.
  const season = my.seasons.find((s) => s.id === seasonId) ?? my.seasons[0];
  const division = season?.divisions.find((d) => d.id === divisionId) ?? season?.divisions[0];
  const club = my.clubs.find((c) => c.id === clubId) ?? my.clubs[0];
  const ready = !!season && !!division && !!club;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const t = await registerTeam(division!.id, club!.id, name.trim());
      state.close();
      setName('');
      onCreated(t.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal state={state}>
      <Button
        variant="primary"
        size="sm"
        className="rounded-xl"
        isDisabled={!my.seasons.length || !my.clubs.length}
        data-testid="club-apply-open"
      >
        <Plus size={16} /> Заявить команду
      </Button>
      <ModalSheet size="sm" testId="club-apply">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Заявка команды</Modal.Heading>
        </Modal.Header>
        <form onSubmit={submit}>
          <Modal.Body className="flex flex-col gap-4">
            <Picker
              label="Сезон"
              showLabel
              value={season?.id ?? null}
              options={my.seasons.map((s) => ({ id: s.id, label: s.name }))}
              onChange={(k) => {
                setSeasonId(k);
                setDivisionId('');
              }}
              testId="club-apply-season"
            />
            <Picker
              label="Лига"
              showLabel
              value={division?.id ?? null}
              options={(season?.divisions ?? []).map((d) => ({ id: d.id, label: d.name + ' · ' + GENDER_LABEL[d.gender].toLowerCase() }))}
              onChange={setDivisionId}
              testId="club-apply-division"
            />
            {my.clubs.length > 1 && (
              <Picker
                label="Клуб"
                showLabel
                value={club?.id ?? null}
                options={my.clubs.map((c) => ({ id: c.id, label: c.name }))}
                onChange={setClubId}
                testId="club-apply-club"
              />
            )}
            <TextField value={name} onChange={setName}>
              <Label>Название команды</Label>
              <Input placeholder={club ? club.name : 'Как у клуба'} className="rounded-xl" data-testid="club-apply-name" />
            </TextField>
            {error && <p className="text-[13px] text-red-600" data-testid="club-apply-error">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isDisabled={!ready || busy}>
              Подать заявку
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </Modal>
  );
}
