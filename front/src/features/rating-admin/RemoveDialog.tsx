'use client';

/* «Удалить из рейтинга» на карточке спортсмена ✳ (27.11.2026, решение
   владельца продукта: «ГСК может удалять спортсменов из рейтинга»; основание
   не спрашивается — только подтверждение). Карточка и история на сервере не
   стираются (п. 21.6): спортсмен пропадает из листа и подборов, а председатель
   может вернуть его той же карточкой — `RestoreButton`. */

import { AlertDialog, Button } from '@heroui/react';
import { RotateCcw, Trash2 } from 'lucide-react';

import type { RatingEntry } from '@/entities/rating';
import { AlertSheet } from '@/shared/ui/ModalSheet';

import { useRatingActions } from './useRatingActions';

export function RemoveDialog({ userId, name, onDone }: { userId: string; name: string; onDone: (entry: RatingEntry) => void }) {
  const { remove, busy, error } = useRatingActions(userId);
  return (
    <span className="flex items-center gap-3">
      {error && (
        <span role="alert" data-testid="chairman-error" className="text-[13px] text-red-600">
          {error}
        </span>
      )}
      <AlertDialog>
        <Button variant="danger-soft" className="rounded-xl" isDisabled={busy} data-testid="remove-open">
          <Trash2 size={15} /> Удалить из рейтинга
        </Button>
        <AlertSheet className="rounded-xl" testId="remove-dialog">
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>Удалить из рейтинга?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="text-[14px]">{name}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" className="rounded-xl">
              Отмена
            </Button>
            <Button
              slot="close"
              variant="danger"
              className="rounded-xl"
              data-testid="remove-submit"
              onPress={async () => {
                const entry = await remove('');
                if (entry) onDone(entry);
              }}
            >
              Удалить
            </Button>
          </AlertDialog.Footer>
        </AlertSheet>
      </AlertDialog>
    </span>
  );
}

/** Вернуть удалённого — одним нажатием: значение и история те же. */
export function RestoreButton({ userId, onDone }: { userId: string; onDone: (entry: RatingEntry) => void }) {
  const { restore, busy, error } = useRatingActions(userId);
  return (
    <span className="flex items-center gap-3">
      {error && <span className="text-[13px] text-red-600">{error}</span>}
      <Button
        variant="primary"
        className="rounded-xl"
        isDisabled={busy}
        data-testid="restore-submit"
        onPress={async () => {
          const entry = await restore();
          if (entry) onDone(entry);
        }}
      >
        <RotateCcw size={15} /> Вернуть в рейтинг
      </Button>
    </span>
  );
}
