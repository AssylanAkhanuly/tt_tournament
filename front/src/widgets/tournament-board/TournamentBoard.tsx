'use client';

/* Все турниры системы двумя видами — календарь (сетка месяца) и таблица с
   поиском ✳ (28.10.2026). Один и тот же раздел у администратора федерации
   (`/dashboard`) и председателя ГСК (`/calendar`), судьи и главного судьи:
   экран передаёт, куда вести «Подробнее». Вид — подпунктами раздела в
   сайдбаре («Месяц», «Таблица» — `boardViews`) и живёт в адресе
   (`?view=table`), чтобы пережить перезагрузку и ссылку.
   HeroUI + Tailwind. */

import { Spinner } from '@heroui/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useTournaments } from '@/entities/tournament';
import { CreateTournamentDialog } from '@/features/tournament-create';
import { TournamentCalendar } from '@/widgets/tournament-calendar';
import { TournamentTable } from '@/widgets/tournament-table';

type View = 'calendar' | 'table';

/** Вид раздела турниров — подпункты в сайдбаре ✳ (30.10.2026, решение владельца
 *  продукта: вместо вкладок «Календарь · Таблица» на экране). «Месяц» — без
 *  параметра, «Таблица» — `?view=table`. Кабинет вешает их под свой раздел. */
export function boardViews(basePath: string, view: View) {
  return [
    { label: 'Месяц', href: basePath, active: view !== 'table' },
    { label: 'Таблица', href: basePath + '?view=table', active: view === 'table' },
  ];
}

/** Вид из адреса. */
export function useBoardView(): View {
  return useSearchParams().get('view') === 'table' ? 'table' : 'calendar';
}

export function TournamentBoard({
  detailsPath,
  canCreate,
  only,
}: {
  /** Страница турнира для «Подробнее» и строки таблицы. */
  detailsPath: (id: string) => string;
  /** «Новый турнир» — только тем, кому сервер разрешит завести турнир. */
  canCreate: boolean;
  /** Только эти турниры (кабинет главного судьи — его турниры); нет — все. */
  only?: string[];
}) {
  const router = useRouter();
  const view = useBoardView();
  const tournaments = useTournaments();
  const open = (id: string) => router.push(detailsPath(id));

  const toolbar = (
    <>
      {canCreate && <CreateTournamentDialog onCreated={tournaments.reload} />}
    </>
  );

  if (tournaments.error) {
    return (
      <p className="p-6 text-[13px] text-red-600" data-testid="calendar-error">
        {tournaments.error}
      </p>
    );
  }
  if (!tournaments.data) return <Spinner className="m-auto" />;
  const rows = only ? tournaments.data.filter((t) => only.includes(t.id)) : tournaments.data;
  return view === 'table' ? (
    <TournamentTable tournaments={rows} onOpen={open} toolbar={toolbar} />
  ) : (
    <TournamentCalendar tournaments={rows} onOpen={open} toolbar={toolbar} />
  );
}
