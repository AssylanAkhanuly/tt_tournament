'use client';

/* Выпуски рейтинга — раздел председателя ГСК ✳ (11.09.2026).

   Шаг потока «пересчитали → посмотрели → опубликовали»: наверху черновик —
   кто сдвинулся с прошлого выпуска и кто новый, ниже прошлые выпуски, внизу
   главное действие «Опубликовать выпуск». Строка прошлого выпуска открывает
   лист этого выпуска. Таблица публикуется еженедельно (п. 8.2), от даты
   выпуска считается срок апелляции (п. 21.2) — он виден в строке выпуска.

   Раздел только председателю: гостя уводим на вход. Права всё равно
   проверяет сервер. */

import { Button } from '@heroui/react';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { num2, publishEdition, ruDate, signed2, useEditionDraft, useEditions } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { EmptyBox, Panel, Sheet } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

const DRAFT_GRID = 'minmax(0,1fr) 90px 90px 100px';
const EDITIONS_GRID = '70px 120px minmax(0,1fr) 130px 70px';

export function EditionsView() {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const draft = useEditionDraft();
  const editions = useEditions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/editions');
  }, [sessionLoading, isGskChairman, router]);

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const ed = await publishEdition();
      setDone('Опубликован выпуск №' + ed.number + ' · апелляции до ' + ruDate(ed.appealUntil));
      draft.reload();
      editions.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const last = editions.data?.[0];
  const rows = draft.data ?? [];

  return (
    <RatingShell
      active="Выпуски"
      actions={
        isGskChairman ? (
          <Button variant="primary" data-testid="publish-edition" isDisabled={busy} onPress={() => void publish()}>
            <Send size={15} /> Опубликовать выпуск
          </Button>
        ) : undefined
      }
    >
      {done && (
        <p
          data-testid="edition-result"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-800"
        >
          {done}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
          {error}
        </p>
      )}

      <Panel title={last ? 'Изменения с выпуска №' + last.number : 'Изменения к первому выпуску'} flush>
        {draft.error ? (
          <div className="p-4">
            <EmptyBox title="Черновик не загрузился" text={draft.error} />
          </div>
        ) : rows.length ? (
          <Sheet
            flush
            grid={DRAFT_GRID}
            cols={[
              'Спортсмен',
              <span key="b" className="block text-right">Было</span>,
              <span key="a" className="block text-right">Стало</span>,
              <span key="d" className="block text-right">Изменение</span>,
            ]}
          >
            {rows.map((r) => (
              <div
                key={r.userId}
                data-row
                data-testid="draft-row"
                data-player={r.name}
                className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums"
                style={{ gridTemplateColumns: DRAFT_GRID }}
              >
                <span className="min-w-0 truncate font-medium">{r.name}</span>
                <span className="text-right text-neutral-500">{r.before === null ? '—' : num2(r.before)}</span>
                <span className="text-right font-semibold">{num2(r.after)}</span>
                <span
                  className={
                    'text-right ' +
                    (r.delta === null
                      ? 'text-blue-700'
                      : r.delta > 0
                        ? 'text-green-700'
                        : r.delta < 0
                          ? 'text-red-600'
                          : 'text-neutral-400')
                  }
                >
                  {r.delta === null ? 'новый' : signed2(r.delta)}
                </span>
              </div>
            ))}
          </Sheet>
        ) : (
          <div className="p-4">
            <EmptyBox title={draft.loading ? 'Загружается' : 'Изменений нет'} text="" />
          </div>
        )}
      </Panel>

      <Panel title="Выпуски" flush>
        {editions.data?.length ? (
          <Sheet
            flush
            grid={EDITIONS_GRID}
            cols={['№', 'Опубликован', 'Опубликовал', 'Апелляции до', <span key="r" className="block text-right">Строк</span>]}
          >
            {editions.data.map((e) => (
              <button
                key={e.id}
                type="button"
                data-row
                data-testid="edition-row"
                onClick={() => router.push('/rating?edition=' + e.id)}
                className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums hover:bg-neutral-50"
                style={{ gridTemplateColumns: EDITIONS_GRID }}
              >
                <span className="font-semibold">№{e.number}</span>
                <span className="text-neutral-600">{ruDate(e.publishedAt)}</span>
                <span className="min-w-0 truncate text-neutral-600">{e.publishedByName ?? '—'}</span>
                <span className="text-neutral-600">{ruDate(e.appealUntil)}</span>
                <span className="text-right text-neutral-500">{e.rows}</span>
              </button>
            ))}
          </Sheet>
        ) : (
          <div className="p-4">
            <EmptyBox title={editions.loading ? 'Загружается' : 'Выпусков ещё нет'} text="" />
          </div>
        )}
      </Panel>
    </RatingShell>
  );
}
