'use client';

/* Кабинет врача сборной (`/doctor`) ✳ (19.11.2026, роль 21, NATIONAL.md):
   «Состав сборной» — та же таблица, что у главного тренера, но без правки и
   без планов; строка — `/doctor/members/<id>`: шапка члена сборной и
   медицинская карта целиком (допуск, УМО, болезни, травмы, ограничения
   нагрузки) с «Добавить запись». Не путать с врачом соревнований (роль 18). */

import { Spinner } from '@heroui/react';
import { HeartPulse, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { fetchMember, useLoad } from '@/entities/national';
import { ROLE_NATIONAL_DOCTOR } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import { MedicalCardView, MemberStrip, RosterTable } from '@/widgets/national';

const BASE = '/doctor';
const NAV: RoleNavItem[] = [{ label: 'Состав сборной', href: BASE, icon: <Users size={16} /> }];

function Shell({ active, nav = NAV, home, children }: { active: string; nav?: RoleNavItem[]; home?: string; children: ReactNode }) {
  return (
    <RoleShell kind={ROLE_NATIONAL_DOCTOR} title="Врач сборной" nav={nav} home={home} active={active} bleed>
      {children}
    </RoleShell>
  );
}

export function DoctorView() {
  const router = useRouter();
  return (
    <Shell active="Состав сборной">
      <RosterTable canEdit={false} onOpen={(id) => router.push(`${BASE}/members/${id}`)} />
    </Shell>
  );
}

export function DoctorMemberView({ id }: { id: string }) {
  const member = useLoad(() => fetchMember(id), id);
  const nav = [{ label: 'Медкарта', href: `${BASE}/members/${id}`, icon: <HeartPulse size={16} /> }];
  return (
    <Shell active="Медкарта" nav={nav} home={BASE}>
      {member.error ? (
        <p className="p-6 text-[13px] text-red-600">{member.error}</p>
      ) : !member.data ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto">
          <MemberStrip member={member.data} canEdit={false} onChanged={member.reload} onRemoved={() => undefined} />
          <MedicalCardView memberId={id} onChanged={member.reload} />
        </div>
      )}
    </Shell>
  );
}
