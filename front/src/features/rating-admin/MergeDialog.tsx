'use client';

/* Объединить дубль (п. 5.3) — с карточки спортсмена, которая остаётся.

   Найти дубль по фамилии, выбрать его, указать основание. История дубля
   перейдёт к этой карточке, карточка дубля исчезнет — это делает сервер
   (старт дубля остаётся в истории отменённым, иначе значение удвоилось бы).
   Ищем по живым значениям, а не по выпуску: дубль мог появиться после
   последней публикации. */

import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

import { mergeProfiles, num2, useRatingList, type RatingProfile } from '@/entities/rating';
import { AreaInput, FieldView, FormGrid, InlineDialog, QuietAction, SearchInput } from '@/shared/kit/app';

export function MergeDialog({
  userId,
  name,
  onClose,
  onDone,
}: {
  userId: string;
  name: string;
  onClose: () => void;
  onDone: (kept: RatingProfile, droppedName: string) => void;
}) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<RatingProfile | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => ({ q: q.trim(), all: true, pageSize: 8 }), [q]);
  const found = useRatingList(query);
  const candidates = q.trim().length >= 2 ? (found.data?.results ?? []).filter((p) => p.userId !== userId) : [];

  async function submit() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await mergeProfiles(userId, picked.userId, reason.trim()), picked.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Объединить дубль"
      sub={name}
      wide
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button
            variant="danger"
            data-testid="merge-submit"
            isDisabled={busy || !picked || !reason.trim()}
            onPress={() => void submit()}
          >
            Объединить
          </Button>
        </>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Фамилия дубля" className="w-full" />
      {candidates.length > 0 && (
        <div className="mt-2 flex max-h-48 flex-col overflow-auto rounded-lg border border-neutral-200">
          {candidates.map((p) => (
            <button
              key={p.userId}
              type="button"
              data-testid="merge-candidate"
              data-player={p.name}
              onClick={() => setPicked(p)}
              className={
                'flex items-center justify-between gap-3 px-3 py-2 text-left text-[13px] ' +
                (picked?.userId === p.userId ? 'bg-blue-50 text-blue-700' : 'hover:bg-neutral-50')
              }
            >
              <span className="min-w-0 truncate font-medium">{p.name}</span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                {[p.region, num2(p.value)].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <FormGrid>
          {picked && <FieldView label="Дубль" value={picked.name + ' · ' + num2(picked.value)} wide />}
          <AreaInput
            label="Основание"
            ariaLabel="Основание объединения"
            value={reason}
            onChange={setReason}
            rows={2}
            wide
          />
        </FormGrid>
      </div>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
