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
import { useMemo } from 'react';

import { fetchSeasons } from '@/entities/league';
import { useTournaments } from '@/entities/tournament';
import { useLoad } from '@/shared/lib/useLoad';
import { CreateTournamentDialog } from '@/features/tournament-create';
import { TournamentCalendar } from '@/widgets/tournament-calendar';
import { TournamentTable } from '@/widgets/tournament-table';

import { seasonRow } from './leagueRows';

type View = 'calendar' | 'table';

/** Вид раздела турниров — подпункты в сайдбаре ✳ (30.10.2026, решение владельца
 *  продукта: вместо вкладок «Календарь · Таблица» на экране). «Месяц» — без
 *  параметра, «Таблица» — `?view=table`. Кабинет вешает их под свой раздел и
 *  может добавить свои виды следом (Лига у администратора) — тогда передаёт
 *  их имя в `view`, и «Месяц» не подсвечивается. */
export function boardViews(basePath: string, view: string) {
  return [
    { label: 'Месяц', href: basePath, active: view === 'calendar' },
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
  leaguePath,
}: {
  /** Страница турнира для «Подробнее» и строки таблицы. */
  detailsPath: (id: string) => string;
  /** «Новый турнир» — только тем, кому сервер разрешит завести турнир. */
  canCreate: boolean;
  /** Только эти турниры (кабинет главного судьи — его турниры); нет — все. */
  only?: string[];
  /** Страница сезона Евразийской лиги. Есть — сезоны стоят в календаре и
   *  таблице рядом с турнирами ✳ (19.11.2026), а «Новый турнир» умеет завести
   *  сезон; нет — только турниры. */
  leaguePath?: (seasonId: string) => string;
}) {
  const router = useRouter();
  const view = useBoardView();
  const tournaments = useTournaments();
  const seasons = useLoad(() => (leaguePath ? fetchSeasons() : Promise.resolve([])), leaguePath ? 'league' : 'none');
  const leagueRows = useMemo(() => (seasons.data ?? []).map(seasonRow), [seasons.data]);
  const leagueIds = useMemo(() => new Set(leagueRows.map((r) => r.id)), [leagueRows]);
  const open = (id: string) => router.push(leaguePath && leagueIds.has(id) ? leaguePath(id) : detailsPath(id));

  const toolbar = (
    <>
      {canCreate && (
        <CreateTournamentDialog
          withLeague={!!leaguePath}
          onCreated={(created) => {
            // Новый сезон пуст — сразу на его страницу: дальше лиги и регистрация.
            if (created?.seasonId && leaguePath) router.push(leaguePath(created.seasonId));
            else tournaments.reload();
          }}
        />
      )}
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
  const rows = [...(only ? tournaments.data.filter((t) => only.includes(t.id)) : tournaments.data), ...leagueRows];
  return view === 'table' ? (
    <TournamentTable tournaments={rows} onOpen={open} toolbar={toolbar} />
  ) : (
    <TournamentCalendar tournaments={rows} onOpen={open} toolbar={toolbar} />
  );
}
