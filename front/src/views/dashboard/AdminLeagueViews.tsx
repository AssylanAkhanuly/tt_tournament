'use client';

/* «Лига» в кабинете администратора федерации ✳ (19.11.2026, LEAGUE.md):
   дивизионы сезона → дивизион (разделы «Таблица · Команды · Туры» в
   сайдбаре) → тур (встречи и окно счёта). Содержимое — общие виджеты
   `widgets/league`; здесь только оболочка и адреса. Знак в шапке ведёт к
   дивизионам. */

import { Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { fetchDivision, fetchRules, fetchTour, useLoad } from '@/entities/league';
import { DIVISION_SECTIONS, DivisionPage, LeagueHome, TourPage, type DivisionSection } from '@/widgets/league';

import { AdminShell } from './AdminShell';

const BASE = '/dashboard/league';

function Failed({ error }: { error: string }) {
  return (
    <p className="p-6 text-[13px] text-red-600" data-testid="league-error">
      {error}
    </p>
  );
}

export function AdminLeagueView() {
  const router = useRouter();
  return (
    <AdminShell active="Лига" bleed>
      <LeagueHome canEdit onOpen={(id) => router.push(`${BASE}/${id}/table`)} />
    </AdminShell>
  );
}

export function AdminDivisionView({ id, section }: { id: string; section: DivisionSection }) {
  const router = useRouter();
  const division = useLoad(() => fetchDivision(id), id);
  const rules = useLoad(fetchRules, 'rules');
  const nav = DIVISION_SECTIONS.map((s) => ({ label: s.label, href: `${BASE}/${id}/${s.id}` }));
  const active = DIVISION_SECTIONS.find((s) => s.id === section)!.label;
  return (
    <AdminShell active={active} nav={nav} home={BASE} bleed>
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
    <AdminShell active={t ? 'Тур ' + t.number : ''} nav={nav} home={t ? `${BASE}/${t.division.id}/tours` : BASE} bleed>
      {tour.error ? <Failed error={tour.error} /> : !t ? <Spinner className="m-auto" /> : <TourPage tour={t} canEdit onChanged={tour.reload} />}
    </AdminShell>
  );
}
