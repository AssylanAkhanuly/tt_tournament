'use client';

/* Неявка без уважительной причины — диалог по образцу «Отклонить заявку с
   причиной» и «Вернуть протокол с причиной» из макетов председателя ГСК
   (Э5.9, Э5.4): поле основания, «Закрыть» и главное действие.

   Последствие применяется, только когда обстоятельства установлены (п. 15.13
   Положения о рейтинге), поэтому это решение человека с основанием, а не
   автоматика. Размер снижения экран не считает: его присылает сервер.
   Пояснений в диалоге нет ✳ (10.09.2026, решение владельца продукта). */

import { Button } from '@heroui/react';
import { useState } from 'react';

import type { RatingEntry } from '@/entities/rating';
import { AreaInput, FormGrid, InlineDialog, QuietAction } from '@/shared/kit/app';
import { useRatingActions } from './useRatingActions';

export function NoShowDialog({
  userId,
  name,
  onClose,
  onDone,
}: {
  userId: string;
  name: string;
  onClose: () => void;
  onDone: (entry: RatingEntry) => void;
}) {
  const { noShow, busy, error } = useRatingActions(userId);
  const [reason, setReason] = useState('');

  async function submit() {
    const entry = await noShow(reason.trim());
    if (entry) onDone(entry);
  }

  return (
    <InlineDialog
      title="Зафиксировать неявку"
      sub={name}
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button
            variant="danger"
            data-testid="noshow-submit"
            isDisabled={busy || !reason.trim()}
            onPress={() => void submit()}
          >
            Зафиксировать
          </Button>
        </>
      }
    >
      <FormGrid>
        <AreaInput
          label="Основание"
          ariaLabel="Основание неявки"
          placeholder="Соревнование, дата, почему причина неуважительная"
          value={reason}
          onChange={setReason}
          wide
        />
      </FormGrid>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
