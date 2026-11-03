'use client';

/* «Редактировать» на карточке спортсмена ✳ (03.11.2026, решение владельца
   продукта: одна кнопка вместо «Зафиксировать неявку» и «Исправить значение»)
   — исправление технической ошибки (п. 21.5–21.6 Положения о рейтинге).

   Поле одно: в нём уже стоит текущее значение, его и правят — отдельного
   «Сейчас» рядом нет. «−» и «+» по краям — шаг 0,01. Основание обязательно.
   Прежние записи не трогаются: разница дописывается строкой истории, и
   значение карточки остаётся суммой журнала. Кнопка — триггер окна, поэтому
   живёт внутри `Modal`. HeroUI + Tailwind. */

import { Button, I18nProvider, Label, Modal, NumberField, TextArea, TextField, useOverlayState } from '@heroui/react';
import { PenLine } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import type { RatingEntry } from '@/entities/rating';
import { useRatingActions } from './useRatingActions';
import { ModalSheet } from '@/shared/ui/ModalSheet';

export function CorrectionDialog({
  userId,
  name,
  current,
  onDone,
}: {
  userId: string;
  name: string;
  /** Текущее значение — с него поле и начинается. */
  current: number;
  onDone: (entry: RatingEntry) => void;
}) {
  const state = useOverlayState();
  const { correct, busy, error } = useRatingActions(userId);
  const [value, setValue] = useState(current);
  const [reason, setReason] = useState('');
  const ready = Number.isFinite(value) && Math.round(value * 100) !== Math.round(current * 100) && reason.trim() !== '';

  /** Открыли заново — поле снова с текущим значением. */
  const open = (isOpen: boolean) => {
    if (isOpen) {
      setValue(current);
      setReason('');
    }
    state.setOpen(isOpen);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const entry = await correct(Math.round(value * 100) / 100, reason.trim());
    if (entry) {
      state.close();
      onDone(entry);
    }
  }

  return (
    <Modal isOpen={state.isOpen} onOpenChange={open}>
      <Button variant="primary" className="rounded-xl" data-testid="correction-open">
        <PenLine size={15} /> Редактировать
      </Button>
      <ModalSheet size="sm" className="rounded-xl" testId="correction-dialog">
            <Modal.CloseTrigger aria-label="Закрыть" />
            <Modal.Header>
              <Modal.Heading className="text-lg font-semibold">Редактировать рейтинг</Modal.Heading>
              <p className="text-[13px] text-neutral-500">{name}</p>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="flex flex-col gap-4">
                <I18nProvider locale="ru-RU">
                  <NumberField
                    value={value}
                    onChange={(v) => setValue(v)}
                    step={0.01}
                    minValue={0}
                    formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                  >
                    <Label>Рейтинг</Label>
                    <NumberField.Group className="w-full rounded-xl">
                      <NumberField.DecrementButton aria-label="Уменьшить рейтинг" />
                      <NumberField.Input className="w-full min-w-0 text-center tabular-nums" data-testid="correction-value" />
                      <NumberField.IncrementButton aria-label="Увеличить рейтинг" />
                    </NumberField.Group>
                  </NumberField>
                </I18nProvider>
                <TextField isRequired value={reason} onChange={setReason}>
                  <Label>Основание</Label>
                  <TextArea
                    rows={3}
                    className="rounded-xl"
                    placeholder="В чём ошибка и откуда верное значение"
                    aria-label="Основание исправления"
                    data-testid="correction-reason"
                  />
                </TextField>
                {error && (
                  <p role="alert" data-testid="chairman-error" className="text-[13px] text-red-600">
                    {error}
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-xl"
                  isDisabled={busy || !ready}
                  data-testid="correction-submit"
                >
                  Сохранить
                </Button>
              </Modal.Footer>
            </form>
          </ModalSheet>
    </Modal>
  );
}
