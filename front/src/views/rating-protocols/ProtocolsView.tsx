'use client';

/* Протоколы для рейтинга — раздел председателя ГСК ✳ (11.09.2026).

   Первый шаг потока рейтинга: турнир завершён → председатель утверждает
   протокол — уровень соревнования (C, п. 13) и призовую тройку (P, п. 10) —
   и турнир пересчитывается. Дальше изменения видны в черновике выпуска.

   Здесь только список; строка открывает страницу протокола — там матчи,
   участники, предпросмотр и утверждение. Окна поверх списка больше нет: в нём
   не помещались результаты, из которых строится рейтинг.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ruDate, useProtocols } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { EmptyBox, Panel, Sheet } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

const GRID = 'minmax(0,1.6fr) 100px minmax(0,1.4fr) 100px 90px';

export function ProtocolsView() {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const protocols = useProtocols();

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/protocols');
  }, [sessionLoading, isGskChairman, router]);

  const rows = protocols.data ?? [];

  return (
    <RatingShell active="Протоколы">
      <Panel title={'Турниров: ' + rows.length} flush>
        {protocols.error ? (
          <div className="p-4">
            <EmptyBox title="Протоколы не загрузились" text={protocols.error} />
          </div>
        ) : rows.length ? (
          <Sheet flush grid={GRID} cols={['Турнир', 'Дата', 'Уровень', 'Участников', 'Учтён']}>
            {rows.map((t) => (
              <button
                key={t.id}
                type="button"
                data-row
                data-testid="protocol-row"
                data-tournament={t.name}
                onClick={() => router.push('/rating/protocols/' + t.id)}
                className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums hover:bg-neutral-50"
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="min-w-0 truncate font-medium">{t.name}</span>
                <span className="text-neutral-600">{ruDate(t.date)}</span>
                <span className="min-w-0 truncate text-neutral-600">{t.levelLabel}</span>
                <span className="text-neutral-600">{t.participants.length}</span>
                <span className={t.applied ? 'text-green-700' : 'text-neutral-400'}>{t.applied ? 'да' : 'нет'}</span>
              </button>
            ))}
          </Sheet>
        ) : (
          <div className="p-4">
            <EmptyBox title={protocols.loading ? 'Загружается' : 'Завершённых рейтинговых турниров нет'} text="" />
          </div>
        )}
      </Panel>
    </RatingShell>
  );
}
