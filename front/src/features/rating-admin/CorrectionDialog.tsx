'use client';

/* Исправление технической ошибки (п. 21.5–21.6 Положения о рейтинге) —
   диалог по образцу «с причиной» из макетов председателя ГСК: текущее
   значение, новое, основание.

   Прежние записи не трогаются: разница дописывается отдельной строкой, и
   значение карточки остаётся суммой журнала. Пояснений в диалоге нет
   ✳ (10.09.2026, решение владельца продукта). */

import { Button } from '@heroui/react';
import { useState } from 'react';

import { num2, type RatingEntry } from '@/entities/rating';
import { AreaInput, FieldView, FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';
import { useRatingActions } from './useRatingActions';

export function CorrectionDialog({
  userId,
  name,
  current,
  onClose,
  onDone,
}: {
  userId: string;
  name: string;
  /** Текущее значение — чтобы исправлять, видя, от чего. */
  current: number;
  onClose: () => void;
  onDone: (entry: RatingEntry) => void;
}) {
  const { correct, busy, error } = useRatingActions(userId);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const n = Number(value.replace(',', '.'));
  const ready = value.trim() !== '' && Number.isFinite(n) && reason.trim() !== '';

  async function submit() {
    const entry = await correct(n, reason.trim());
    if (entry) onDone(entry);
  }

  return (
    <InlineDialog
      title="Исправить значение"
      sub={name}
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button
            variant="primary"
            data-testid="correction-submit"
            isDisabled={busy || !ready}
            onPress={() => void submit()}
          >
            Исправить
          </Button>
        </>
      }
    >
      <FormGrid>
        <FieldView label="Сейчас" value={num2(current)} />
        <TextInput
          label="Исправленное значение"
          placeholder="Например, 40,15"
          value={value}
          onChange={setValue}
        />
        <AreaInput
          label="Основание"
          ariaLabel="Основание исправления"
          placeholder="В чём ошибка и откуда верное значение"
          value={reason}
          onChange={setReason}
          wide
        />
      </FormGrid>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
