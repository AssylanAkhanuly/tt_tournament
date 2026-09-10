'use client';

/* Решение по апелляции (п. 21.4) — из очереди «Апелляции».

   В окне — то, что требует п. 21.2, и сроки; внизу два решения. Обоснование
   обязательно для обоих. «Удовлетворить» требует исправленного значения: оно
   уходит строкой журнала «Апелляция №N: …», выпуск не меняется. Решение
   окончательное — у решённой апелляции окно только для чтения. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import { decideAppeal, num2, ruDate, type RatingAppeal } from '@/entities/rating';
import { AreaInput, FieldView, FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';

export function AppealDecisionDialog({
  appeal,
  onClose,
  onDone,
}: {
  appeal: RatingAppeal;
  onClose: () => void;
  onDone: (appeal: RatingAppeal) => void;
}) {
  const [decision, setDecision] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = appeal.status === 'pending';
  const n = Number(value.replace(',', '.'));
  const hasValue = value.trim() !== '' && Number.isFinite(n);
  const hasDecision = decision.trim() !== '';

  async function decide(upheld: boolean) {
    setBusy(true);
    setError(null);
    try {
      onDone(await decideAppeal(appeal.id, { upheld, decision, value: upheld ? n : undefined }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title={'Апелляция №' + appeal.id}
      sub={appeal.name + ' · выпуск №' + appeal.editionNumber}
      wide
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          {pending && (
            <>
              <Button
                variant="danger"
                data-testid="appeal-reject"
                isDisabled={busy || !hasDecision}
                onPress={() => void decide(false)}
              >
                Отклонить
              </Button>
              <Button
                variant="primary"
                data-testid="appeal-uphold"
                isDisabled={busy || !hasDecision || !hasValue}
                onPress={() => void decide(true)}
              >
                Удовлетворить
              </Button>
            </>
          )}
        </>
      }
    >
      <FormGrid>
        <FieldView label="Кто подал" value={appeal.applicant || '—'} />
        <FieldView label="Получена · рассмотреть до" value={ruDate(appeal.receivedAt) + ' · ' + ruDate(appeal.reviewUntil)} />
        <FieldView label="Что обжалуется" value={appeal.subject} wide />
        {appeal.circumstances && <FieldView label="Обстоятельства" value={appeal.circumstances} wide />}
        <FieldView label="Требование" value={appeal.demand} wide />
        {appeal.documents && <FieldView label="Документы" value={appeal.documents} wide />}
        {pending ? (
          <>
            <AreaInput label="Обоснование решения" value={decision} onChange={setDecision} rows={2} wide />
            <TextInput
              label="Исправленное значение"
              placeholder="Например, 40,15"
              value={value}
              onChange={setValue}
            />
          </>
        ) : (
          <>
            <FieldView label={appeal.statusLabel} value={appeal.decision} wide />
            {appeal.correctionAfter !== null && (
              <FieldView label="Исправлено на" value={num2(appeal.correctionAfter)} />
            )}
          </>
        )}
      </FormGrid>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
