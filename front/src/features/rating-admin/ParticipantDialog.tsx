'use client';

/* Добавить участника из рейтинга ✳ (11.09.2026) — поиск по живому листу.

   Строка добавляет сразу, и диалог остаётся открытым: состав турнира вносят
   подряд, и открывать диалог на каждого — лишние клики. Уже добавленные в
   выдаче не показываются. Спортсмена, которого в листе нет, заводят кнопкой
   «Новый спортсмен» на странице турнира. */

import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

import { num2, useRatingList } from '@/entities/rating';
import { InlineDialog, SearchInput } from '@/shared/kit/app';
import { FormError } from './fields';

export function ParticipantDialog({
  exclude,
  onClose,
  onPick,
}: {
  /** Кто уже в турнире. */
  exclude: string[];
  onClose: () => void;
  /** Добавить; ошибка сервера — брошенным исключением. */
  onPick: (userId: string) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => ({ q: q.trim(), all: true, pageSize: 8 }), [q]);
  const found = useRatingList(query);
  const taken = new Set(exclude);
  const candidates = q.trim().length >= 2 ? (found.data?.results ?? []).filter((p) => !taken.has(p.userId)) : [];

  async function pick(userId: string) {
    setBusy(true);
    setError(null);
    try {
      await onPick(userId);
      setQ('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Участник из рейтинга"
      wide
      onClose={onClose}
      foot={
        <Button variant="primary" onPress={onClose}>
          Готово
        </Button>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Фамилия или регион" className="w-full" />
      {candidates.length > 0 && (
        <div className="mt-2 flex max-h-64 flex-col overflow-auto rounded-lg border border-neutral-200">
          {candidates.map((p) => (
            <button
              key={p.userId}
              type="button"
              disabled={busy}
              data-testid="participant-candidate"
              data-player={p.name}
              onClick={() => void pick(p.userId)}
              className="flex items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-neutral-50"
            >
              <span className="min-w-0 truncate font-medium">{p.name}</span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                {[p.region, num2(p.value)].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}
      <FormError text={error} />
    </InlineDialog>
  );
}
