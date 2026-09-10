'use client';

/* Апелляции — раздел председателя ГСК ✳ (11.09.2026).

   Очередь по образцу Э5.7: вкладки «Ждут решения» (рабочая очередь, срок —
   10 рабочих дней с получения, п. 21.3), «Решённые», «Все»; строка открывает
   окно с решением. Решённая апелляция остаётся в списке со своей пометкой.
   Регистрируют апелляцию с карточки спортсмена — там видно, что обжалуется.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ruDate, useAppeals, type RatingAppeal } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { AppealDecisionDialog } from '@/features/rating-admin';
import { EmptyBox, FilterBar, FilterSeg, Panel, Sheet } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

const GRID = '56px minmax(0,1fr) 80px 104px 120px 130px';
const TABS = ['Ждут решения', 'Решённые', 'Все'];

const STATUS_TONE: Record<RatingAppeal['status'], string> = {
  pending: 'text-amber-700',
  upheld: 'text-green-700',
  rejected: 'text-neutral-500',
};

export function AppealsView() {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const appeals = useAppeals();
  const [tab, setTab] = useState(TABS[0]);
  const [open, setOpen] = useState<RatingAppeal | null>(null);

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/appeals');
  }, [sessionLoading, isGskChairman, router]);

  const all = appeals.data ?? [];
  const rows =
    tab === 'Ждут решения'
      ? all.filter((a) => a.status === 'pending')
      : tab === 'Решённые'
        ? all.filter((a) => a.status !== 'pending')
        : all;

  return (
    <RatingShell active="Апелляции">
      <FilterBar>
        <div data-testid="appeal-tabs">
          <FilterSeg items={TABS} active={tab} onPick={setTab} />
        </div>
      </FilterBar>

      <Panel title={tab + ': ' + rows.length} flush>
        {appeals.error ? (
          <div className="p-4">
            <EmptyBox title="Апелляции не загрузились" text={appeals.error} />
          </div>
        ) : rows.length ? (
          <Sheet
            flush
            grid={GRID}
            cols={['№', 'Спортсмен', 'Выпуск', 'Получена', 'Рассмотреть до', 'Статус']}
          >
            {rows.map((a) => (
              <button
                key={a.id}
                type="button"
                data-row
                data-testid="appeal-row"
                data-player={a.name}
                onClick={() => setOpen(a)}
                className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums hover:bg-neutral-50"
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="font-semibold">№{a.id}</span>
                <span className="min-w-0 truncate font-medium">{a.name}</span>
                <span className="text-neutral-600">№{a.editionNumber}</span>
                <span className="text-neutral-600">{ruDate(a.receivedAt)}</span>
                <span className="text-neutral-600">{ruDate(a.reviewUntil)}</span>
                <span className={STATUS_TONE[a.status]}>{a.statusLabel}</span>
              </button>
            ))}
          </Sheet>
        ) : (
          <div className="p-4">
            <EmptyBox title={appeals.loading ? 'Загружается' : 'Апелляций нет'} text="" />
          </div>
        )}
      </Panel>

      {open && (
        <AppealDecisionDialog
          appeal={open}
          onClose={() => setOpen(null)}
          onDone={() => {
            setOpen(null);
            appeals.reload();
          }}
        />
      )}
    </RatingShell>
  );
}
