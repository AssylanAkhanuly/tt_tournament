'use client';

/* Добавить участника из рейтинга ✳ (11.09.2026).

   Список виден сразу — лист по убыванию рейтинга, ввод его сужает: пустой
   диалог до первых букв выглядел сломанным. Строка добавляет сразу, и диалог
   остаётся открытым: состав турнира вносят подряд.

   Кого показывать, решает сервер ✳ (15.09.2026, замечания федерации):
   спортсменов, подходящих по возрастным категориям турнира (выбранной в отборе
   страницы или любой из них) и по полу, без уже добавленных. Правило возраста
   одно — на сервере (`back/rating/ages.py`); экран его не повторяет. */

import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

import { fio, num2, useCandidates } from '@/entities/rating';
import { InlineDialog, SearchInput } from '@/shared/kit/app';
import { FormError } from './fields';

export function ParticipantDialog({
  tournamentId,
  sex,
  category,
  sub,
  onClose,
  onPick,
}: {
  tournamentId: string;
  /** Отбор страницы турнира: пол ('' — любой) и возрастная категория (null — любая). */
  sex: string;
  category: number | null;
  sub?: string;
  onClose: () => void;
  /** Добавить; ошибка сервера — брошенным исключением. */
  onPick: (userId: string) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [rev, setRev] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => ({ q: q.trim() || undefined, sex: sex || undefined, category }), [q, sex, category]);
  const found = useCandidates(tournamentId, query, rev);
  const candidates = found.data ?? [];

  async function pick(userId: string) {
    setBusy(true);
    setError(null);
    try {
      await onPick(userId);
      setQ('');
      setRev((r) => r + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title="Участник из рейтинга"
      sub={sub}
      wide
      onClose={onClose}
      foot={
        <Button variant="primary" onPress={onClose}>
          Готово
        </Button>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Фамилия или регион" className="w-full" />
      {!found.loading && found.data && candidates.length === 0 && (
        <p data-testid="participant-none" className="mt-3 text-center text-[13px] text-neutral-500">
          Никого не нашлось
        </p>
      )}
      {candidates.length > 0 && (
        <div className="mt-2 flex max-h-80 flex-col overflow-auto rounded-lg border border-neutral-200">
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
              <span className="min-w-0 truncate font-medium">{fio(p.name)}</span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                {[p.birthYear, p.region, num2(p.value)].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}
      <FormError text={error} />
    </InlineDialog>
  );
}
