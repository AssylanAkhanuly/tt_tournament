'use client';

/* Заявка на судейство ✳ (29.10.2026, Э0.10) — полоса внизу страницы турнира в
   кабинете судьи ✳ (01.11.2026, решение владельца продукта: не блок на
   странице). В полосе — состояние приёма, своя заявка и кнопка. «Подать заявку»
   открывает окно: турнир и должности, одну или несколько. Пока решения нет,
   заявку можно отозвать; после отказа, пока приём открыт, подаётся заново.
   Правила — на сервере (`back/tournaments/recruitment.py`). HeroUI + Tailwind. */

import { Button, Checkbox, CheckboxGroup, Chip, Label, Modal, useOverlayState } from '@heroui/react';
import { useState } from 'react';

import {
  applyAsReferee,
  placeLabel,
  recruitmentLabel,
  REFEREE_POSITIONS,
  tournamentDate,
  useMyRefereeApplication,
  withdrawRefereeApplication,
  type RefereePosition,
  type TournamentSummary,
} from '@/entities/tournament';
import { ModalSheet } from '@/shared/ui/ModalSheet';

const LABEL = Object.fromEntries(REFEREE_POSITIONS.map((p) => [p.id, p.label])) as Record<string, string>;

export function ApplicationPanel({ tournament }: { tournament: TournamentSummary }) {
  const tournamentId = tournament.id;
  const recruitment = tournament.refereeRecruitment;
  const mine = useMyRefereeApplication(tournamentId);
  const dialog = useOverlayState();
  const [picked, setPicked] = useState<RefereePosition[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Удалось ли: окно закрывается только после ответа сервера. */
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setPicked([]);
      mine.reload();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const a = mine.data;
  const canApply = recruitment.active && (!a || a.status === 'rejected');
  const failure = mine.error ?? (dialog.isOpen ? null : error);
  const where = [placeLabel(tournament), tournament.venue].filter(Boolean).join(', ');
  // Срок или «закрыт»; приём без срока виден по самой кнопке, подпись не нужна.
  const term = recruitment.active && !recruitment.until ? null : recruitmentLabel(recruitment);

  return (
    <div className="flex w-full flex-wrap items-center gap-3" data-testid="application-panel" data-status={a?.status ?? 'none'}>
      {term && (
        <span className="text-[14px] text-neutral-600" data-testid="recruitment-state">
          {term}
        </span>
      )}

      {a && (
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[14px]" data-testid="application-mine">
          {a.status === 'pending' && (
            <Chip size="sm" variant="soft" color="warning">
              Ждёт решения
            </Chip>
          )}
          {a.status === 'accepted' && (
            <Chip size="sm" variant="soft" color="success">
              Назначен: {LABEL[a.position ?? '']}
            </Chip>
          )}
          {a.status === 'rejected' && (
            <Chip size="sm" variant="soft" color="danger">
              Отклонена
            </Chip>
          )}
          {a.status !== 'accepted' && (
            <span className="text-neutral-600" data-testid="application-positions">
              {a.positions.map((p) => LABEL[p]).join(', ')}
            </span>
          )}
        </div>
      )}

      {failure && (
        <p className="text-[13px] text-red-600" data-testid="application-error">
          {failure}
        </p>
      )}

      <div className="ml-auto flex gap-2">
        {a?.status === 'pending' && (
          <Button
            variant="tertiary"
            className="rounded-xl"
            isDisabled={busy}
            onPress={() => void run(() => withdrawRefereeApplication(tournamentId))}
            data-testid="application-withdraw"
          >
            Отозвать заявку
          </Button>
        )}
        {canApply && (
          <Button
            variant="primary"
            className="rounded-xl"
            onPress={() => {
              setError(null);
              dialog.open();
            }}
            data-testid="application-apply"
          >
            Подать заявку
          </Button>
        )}
      </div>

      {/* Без `Modal`-обёртки: окно открывает кнопка полосы, состояние ведём сами. */}
      <ModalSheet isOpen={dialog.isOpen} onOpenChange={dialog.setOpen} size="md" className="rounded-xl" testId="application-dialog">
            <Modal.CloseTrigger aria-label="Закрыть" />
            <Modal.Header>
              <Modal.Heading className="text-lg font-semibold">Заявка на судейство</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-5">
              <div className="border-b border-neutral-200 pb-4 text-[14px]" data-testid="application-tournament">
                <p className="font-semibold">{tournament.name}</p>
                <p className="mt-1 text-neutral-600">
                  {[tournament.startsAt ? tournamentDate(tournament.startsAt) : 'Без даты', where].filter(Boolean).join(' · ')}
                </p>
                {term && <p className="mt-1 text-neutral-600">{term}</p>}
              </div>
              <CheckboxGroup
                aria-label="Должности"
                value={picked}
                onChange={(v) => setPicked(v as RefereePosition[])}
                data-testid="application-pick"
              >
                <Label>Должности</Label>
                {REFEREE_POSITIONS.map((p) => (
                  <Checkbox key={p.id} value={p.id}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>{p.label}</Label>
                    </Checkbox.Content>
                  </Checkbox>
                ))}
              </CheckboxGroup>
              {error && (
                <p className="text-[13px] text-red-600" data-testid="application-error">
                  {error}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="tertiary" className="rounded-xl" onPress={dialog.close}>
                Отмена
              </Button>
              <Button
                variant="primary"
                className="rounded-xl"
                isDisabled={busy || picked.length === 0}
                onPress={() =>
                  void run(() => applyAsReferee(tournamentId, picked)).then((done) => {
                    if (done) dialog.close();
                  })
                }
                data-testid="application-submit"
              >
                Подать заявку
              </Button>
            </Modal.Footer>
          </ModalSheet>
    </div>
  );
}
