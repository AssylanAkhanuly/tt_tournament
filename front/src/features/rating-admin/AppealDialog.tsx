'use client';

/* Зарегистрировать апелляцию (п. 21.1–21.2) — с карточки спортсмена.

   Апелляция подаётся письменно в Федерацию, в систему её вносит председатель
   ГСК: кто подал, когда получена, что обжалуется, обстоятельства, требование,
   документы — ровно перечень п. 21.2. Обжалуется последний выпуск; срок подачи
   проверяет сервер и, если он истёк, называет дату.

   Дата получения уходит на сервер, только если её поменяли руками. Иначе
   сервер ставит свою «сегодня»: дата браузера и дата сервера расходятся по
   часовому поясу, и в первые часы суток апелляция выглядела бы полученной
   раньше публикации выпуска. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import { registerAppeal, type RatingAppeal } from '@/entities/rating';
import { AreaInput, DateInput, FormGrid, InlineDialog, QuietAction, TextInput } from '@/shared/kit/app';

/** Сегодня по часам браузера, ГГГГ-ММ-ДД — не по UTC, как у `toISOString`. */
function localToday(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function AppealDialog({
  userId,
  name,
  onClose,
  onDone,
}: {
  userId: string;
  name: string;
  onClose: () => void;
  onDone: (appeal: RatingAppeal) => void;
}) {
  const [applicant, setApplicant] = useState('Спортсмен');
  const [receivedAt, setReceivedAt] = useState(localToday);
  const [dateTouched, setDateTouched] = useState(false);
  const [subject, setSubject] = useState('');
  const [circumstances, setCircumstances] = useState('');
  const [demand, setDemand] = useState('');
  const [documents, setDocuments] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = subject.trim() !== '' && demand.trim() !== '';

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onDone(
        await registerAppeal({
          userId,
          receivedAt: dateTouched ? receivedAt : undefined,
          applicant,
          subject,
          circumstances,
          demand,
          documents,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Апелляция"
      sub={name}
      wide
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button
            variant="primary"
            data-testid="appeal-submit"
            isDisabled={busy || !ready}
            onPress={() => void submit()}
          >
            Зарегистрировать
          </Button>
        </>
      }
    >
      <FormGrid>
        <TextInput label="Кто подал" value={applicant} onChange={setApplicant} />
        <DateInput
          label="Получена"
          value={receivedAt}
          onChange={(v) => {
            setReceivedAt(v);
            setDateTouched(true);
          }}
        />
        <AreaInput label="Что обжалуется" value={subject} onChange={setSubject} rows={2} wide />
        <AreaInput label="Обстоятельства" value={circumstances} onChange={setCircumstances} rows={2} wide />
        <AreaInput label="Требование" value={demand} onChange={setDemand} rows={2} wide />
        <TextInput label="Документы" value={documents} onChange={setDocuments} wide />
      </FormGrid>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
