'use client';

/* Страницы Лиги в кабинете администратора федерации ✳ (19.11.2026, LEAGUE.md):
   сезон (разделы «Лиги · Регистрация») → лига-дивизион («Таблица · Команды ·
   Туры») → тур (встречи и окно счёта). Сезоны стоят в календаре рядом с
   турнирами (`DashboardView`), своего раздела в меню у Лиги нет; знак в шапке
   ведёт на уровень выше: тур → туры лиги → сезон → календарь. Содержимое — общие виджеты
   `widgets/league`; здесь только оболочка и адреса. */

import { Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { fetchDivision, fetchRules, fetchSeason, fetchTour, useLoad } from '@/entities/league';
import {
  DIVISION_SECTIONS,
  DivisionPage,
  SEASON_SECTIONS,
  SeasonPage,
  TourPage,
  type DivisionSection,
  type SeasonSection,
} from '@/widgets/league';

import { AdminShell } from './AdminShell';
import { divisionHref, LEAGUE_BASE as BASE, seasonHref } from './leagueHref';

function Failed({ error }: { error: string }) {
  return (
    <p className="p-6 text-[13px] text-red-600" data-testid="league-error">
      {error}
    </p>
  );
}

export function AdminSeasonView({ id, section }: { id: string; section: SeasonSection }) {
  const router = useRouter();
  const season = useLoad(() => fetchSeason(id), id);
  const nav = SEASON_SECTIONS.map((s) => ({ label: s.label, href: seasonHref(id, s.id) }));
  const active = SEASON_SECTIONS.find((s) => s.id === section)!.label;
  return (
    <AdminShell active={active} nav={nav} bleed>
      {season.error ? (
        <Failed error={season.error} />
      ) : !season.data ? (
        <Spinner className="m-auto" />
      ) : (
        <SeasonPage
          season={season.data}
          section={section}
          onOpenDivision={(divisionId) => router.push(divisionHref(divisionId))}
          onChanged={season.reload}
        />
      )}
    </AdminShell>
  );
}

export function AdminDivisionView({ id, section }: { id: string; section: DivisionSection }) {
  const router = useRouter();
  const division = useLoad(() => fetchDivision(id), id);
  const rules = useLoad(fetchRules, 'rules');
  const nav = DIVISION_SECTIONS.map((s) => ({ label: s.label, href: divisionHref(id, s.id) }));
  const active = DIVISION_SECTIONS.find((s) => s.id === section)!.label;
  return (
    <AdminShell active={active} nav={nav} home={division.data ? seasonHref(division.data.seasonId) : undefined} bleed>
      {division.error ? (
        <Failed error={division.error} />
      ) : !division.data ? (
        <Spinner className="m-auto" />
      ) : (
        <DivisionPage
          division={division.data}
          section={section}
          canEdit
          squadMax={rules.data?.squadMax ?? 8}
          onOpenTour={(tourId) => router.push(`${BASE}/tours/${tourId}`)}
          onChanged={division.reload}
        />
      )}
    </AdminShell>
  );
}

export function AdminTourView({ id }: { id: string }) {
  const tour = useLoad(() => fetchTour(id), id);
  const t = tour.data;
  const nav = t ? [{ label: 'Тур ' + t.number, href: `${BASE}/tours/${id}` }] : [];
  return (
    <AdminShell active={t ? 'Тур ' + t.number : ''} nav={nav} home={t ? divisionHref(t.division.id, 'tours') : undefined} bleed>
      {tour.error ? <Failed error={tour.error} /> : !t ? <Spinner className="m-auto" /> : <TourPage tour={t} canEdit onChanged={tour.reload} />}
    </AdminShell>
  );
}
