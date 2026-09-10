'use client';

/* Неявка без уважительной причины — диалог по образцу «Отклонить заявку с
   причиной» и «Вернуть протокол с причиной» из макетов председателя ГСК
   (Э5.9, Э5.4): что фиксируется, поле основания, внизу — куда уйдёт запись,
   «Закрыть» и главное действие.

   Последствие применяется, только когда обстоятельства установлены (п. 15.13
   Положения о рейтинге), поэтому это решение человека с основанием, а не
   автоматика. Размер снижения экран не считает: его присылает сервер. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import type { RatingEntry } from '@/entities/rating';
import { AreaInput, FieldView, FormGrid, InlineDialog, QuietAction } from '@/shared/kit/app';
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
      sub={name + ' · неявка без уважительной причины'}
      onClose={onClose}
      foot={
        <>
          <span className="mr-auto text-xs text-neutral-500">
            Строка уйдёт в историю рейтинга с основанием и автором
          </span>
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
        <FieldView label="Что фиксируется" value="Неявка без уважительной причины · п. 15.4–15.6" wide />
        <AreaInput
          label="Основание"
          ariaLabel="Основание неявки"
          placeholder="Соревнование, дата, почему причина неуважительная"
          value={reason}
          onChange={setReason}
          wide
        />
      </FormGrid>
      <p className="mt-3 text-[12px] leading-snug text-neutral-500">
        Первая неявка −0,20, повторная −0,30, далее −0,50. Только когда обстоятельства установлены и причина
        признана неуважительной (п. 15.13).
      </p>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
