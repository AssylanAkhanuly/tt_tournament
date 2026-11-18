'use client';

/* «Отозвать» заявленного ✳ (19.11.2026, ROLES.md роль 12 — «Отозвать заявку:
   до закрытия приёма, состав выходит из турнира»). Значок в строке
   «Заявлены», с подтверждением: спортсмен выходит из турнира, место в квоте
   освобождается. Можно ли — решает сервер (`admission.withdraw`): отозвать
   своего, пока приём открыт; отказ — текстом у кнопки. HeroUI + Tailwind. */

import { AlertDialog, Button, Tooltip } from '@heroui/react';
import { UserMinus } from 'lucide-react';
import { useState } from 'react';

import { withdrawApplication, type ApplicationAthlete } from '@/entities/tournament';
import { AlertSheet } from '@/shared/ui/ModalSheet';

export function WithdrawButton({
  tournamentId,
  athlete,
  isDisabled,
  onWithdrawn,
}: {
  tournamentId: string;
  athlete: ApplicationAthlete;
  isDisabled?: boolean;
  onWithdrawn: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      await withdrawApplication(tournamentId, athlete.id);
      onWithdrawn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && (
        <span className="text-[12px] text-red-600" data-testid="withdraw-error">
          {error}
        </span>
      )}
      <AlertDialog>
        <Tooltip>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Отозвать"
            className="rounded-xl text-red-600"
            isDisabled={isDisabled || busy}
            data-testid="withdraw"
          >
            <UserMinus size={16} />
          </Button>
          <Tooltip.Content>Отозвать</Tooltip.Content>
        </Tooltip>
        <AlertSheet className="rounded-xl" testId="withdraw-confirm">
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>Отозвать из заявки?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="text-[14px]">{athlete.name}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" className="rounded-xl">
              Отмена
            </Button>
            <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void withdraw()}>
              Отозвать
            </Button>
          </AlertDialog.Footer>
        </AlertSheet>
      </AlertDialog>
    </span>
  );
}
