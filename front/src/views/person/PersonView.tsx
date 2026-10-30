'use client';

/* Профиль человека ✳ (28.10.2026, решение владельца продукта): страница любой
   учётки — имя, почта, телефон и роли (у ролей турнира — какого). Открывается
   «Профилем» из карточки судьи. Оболочка — кабинет того, кто смотрит:
   администратора федерации или председателя ГСК. Роли — общей таблицей
   `DataTable`; строка роли турнира ведёт на этот турнир. HeroUI + Tailwind. */

import { Avatar, Button, Spinner } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { usePerson, type PersonRole } from '@/entities/person';
import { useSession } from '@/entities/session';
import { tournamentHref } from '@/entities/tournament';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { AdminShell } from '@/views/dashboard/AdminShell';
import { RatingShell } from '@/views/rating';

const COLUMNS: DataColumn<PersonRole>[] = [
  { id: 'label', label: 'Роль', rowHeader: true, sortValue: (r) => r.label, render: (r) => r.label },
  {
    id: 'tournament',
    label: 'Турнир',
    sortValue: (r) => r.tournament?.name ?? null,
    render: (r) => r.tournament?.name ?? <span className="text-neutral-500">вся система</span>,
  },
];

export function PersonView({ id }: { id: string }) {
  const router = useRouter();
  const { loading, isFederationAdmin, isGskChairman } = useSession();
  const person = usePerson(id);

  // Профиль — персональные данные: только администратору и председателю ГСК.
  useEffect(() => {
    if (!loading && !isFederationAdmin && !isGskChairman) router.replace('/login?next=/people/' + id);
  }, [loading, isFederationAdmin, isGskChairman, router, id]);
  const p = person.data;
  // Строка роли турнира ведёт на турнир — в кабинете, в оболочке которого открыт профиль.

  const context = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-fit gap-1.5 rounded-xl px-2 text-[13px] text-neutral-600"
      onPress={() => router.back()}
      data-testid="person-back"
    >
      <ArrowLeft size={15} /> Назад
    </Button>
  );

  const body: ReactNode = person.error ? (
    <p className="p-6 text-[13px] text-red-600" data-testid="person-error">
      {person.error}
    </p>
  ) : !p ? (
    <Spinner className="m-auto" />
  ) : (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-4 border-b border-neutral-200 px-6 py-5" data-testid="person-header">
        <Avatar size="lg">
          <Avatar.Fallback>{p.name.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <h1 className="text-xl font-semibold tracking-tight">{p.name}</h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            {[p.email ?? 'почта не указана', p.phone].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <DataTable
        ariaLabel="Роли"
        testId="person-roles"
        rows={p.roles}
        columns={COLUMNS}
        getId={(r) => r.kind + ':' + (r.tournament?.id ?? r.scope)}
        count={(n) => 'Ролей: ' + n}
        empty="Ролей нет"
        onRowAction={(r) => r.tournament && router.push(tournamentHref(isFederationAdmin ? 'dashboard' : 'gsk', r.tournament.id))}
        rowProps={(r) => ({ 'data-testid': 'person-role-row', 'data-kind': r.kind })}
      />
    </div>
  );

  return isFederationAdmin ? (
    <AdminShell active="" context={context} bleed>
      {body}
    </AdminShell>
  ) : (
    <RatingShell active="" context={context} bleed>
      {body}
    </RatingShell>
  );
}
