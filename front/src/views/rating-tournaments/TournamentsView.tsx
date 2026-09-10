'use client';

/* Турниры для рейтинга — раздел председателя ГСК ✳ (11.09.2026).

   Завершённые рейтинговые турниры и турниры протоколом вручную. Строка
   открывает страницу турнира: участники, матчи, предпросмотр и утверждение.
   «Новый турнир» заводит турнир вручную — пока соревнования федерации идут
   вне системы, результаты в рейтинг попадают так.

   Раздел только председателю: гостя уводим на вход. Права проверяет сервер. */

import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ruDate, useProtocols } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { TournamentDialog } from '@/features/rating-admin';
import { EmptyBox, Panel, Sheet, useNarrow } from '@/shared/kit/app';
import { RatingShell } from '@/views/rating';

const GRID = 'minmax(0,1.6fr) 100px minmax(0,1.4fr) 100px 90px';
/** Телефон: турнир с датой и уровнем под названием, учтён ли. */
const GRID_NARROW = 'minmax(0,1fr) 70px';

export function TournamentsView() {
  const router = useRouter();
  const { loading: sessionLoading, isGskChairman } = useSession();
  const list = useProtocols();
  const narrow = useNarrow();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/tournaments');
  }, [sessionLoading, isGskChairman, router]);

  const rows = list.data ?? [];
  const open = (id: string) => router.push('/rating/tournaments/' + id);

  return (
    <RatingShell
      active="Турниры"
      actions={
        <Button variant="primary" data-testid="tournament-create-open" onPress={() => setCreating(true)}>
          <Plus size={15} /> Новый турнир
        </Button>
      }
    >
      <Panel title={'Турниров: ' + rows.length} flush>
        {list.error ? (
          <div className="p-4">
            <EmptyBox title="Турниры не загрузились" text={list.error} />
          </div>
        ) : rows.length ? (
          <Sheet
            flush
            grid={narrow ? GRID_NARROW : GRID}
            cols={narrow ? ['Турнир', 'Учтён'] : ['Турнир', 'Дата', 'Уровень', 'Участников', 'Учтён']}
          >
            {rows.map((t) => (
              <button
                key={t.id}
                type="button"
                data-row
                data-testid="tournament-row"
                data-tournament={t.name}
                onClick={() => open(t.id)}
                className="grid w-full items-center gap-3 px-4 py-2 text-left text-[13px] tabular-nums hover:bg-neutral-50"
                style={{ gridTemplateColumns: narrow ? GRID_NARROW : GRID }}
              >
                {narrow ? (
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-medium">{t.name}</span>
                    <span className="block truncate text-[11.5px] text-neutral-500">
                      {ruDate(t.date) + ' · ' + t.levelLabel + ' · ' + t.participants.length}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="min-w-0 truncate font-medium">{t.name}</span>
                    <span className="text-neutral-600">{ruDate(t.date)}</span>
                    <span className="min-w-0 truncate text-neutral-600">{t.levelLabel}</span>
                    <span className="text-neutral-600">{t.participants.length}</span>
                  </>
                )}
                <span className={t.applied ? 'text-green-700' : 'text-neutral-400'}>
                  {t.applied ? 'да' : t.editable ? 'черновик' : 'нет'}
                </span>
              </button>
            ))}
          </Sheet>
        ) : (
          <div className="p-4">
            <EmptyBox title={list.loading ? 'Загружается' : 'Турниров нет'} text="" />
          </div>
        )}
      </Panel>

      {creating && <TournamentDialog onClose={() => setCreating(false)} onDone={(t) => open(t.id)} />}
    </RatingShell>
  );
}
