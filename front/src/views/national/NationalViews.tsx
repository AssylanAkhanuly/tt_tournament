'use client';

/* Кабинет главного тренера национальной команды (`/national`) ✳ (19.11.2026,
   роль 11, NATIONAL.md): «Состав сборной» — таблица и «Внести в сборную»;
   строка — карточка члена сборной `/national/members/<id>/plan|medical`:
   шапка (состав и группа правятся там же), «План подготовки» и «Медкарта»
   (допуск и ограничения нагрузки — диагнозы тренеру сервер не отдаёт).
   Знак в шапке ведёт к составу. */

import { Spinner } from '@heroui/react';
import { ClipboardList, HeartPulse, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { fetchMember, useLoad } from '@/entities/national';
import { ROLE_NATIONAL_HEAD_COACH } from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import { MedicalCardView, MemberStrip, PlanBoard, RosterTable } from '@/widgets/national';

const BASE = '/national';
const NAV: RoleNavItem[] = [{ label: 'Состав сборной', href: BASE, icon: <Users size={16} /> }];

export type MemberSection = 'plan' | 'medical';
const SECTIONS: { id: MemberSection; label: string; icon: ReactNode }[] = [
  { id: 'plan', label: 'План подготовки', icon: <ClipboardList size={16} /> },
  { id: 'medical', label: 'Медкарта', icon: <HeartPulse size={16} /> },
];

function Shell({ active, nav = NAV, home, children }: { active: string; nav?: RoleNavItem[]; home?: string; children: ReactNode }) {
  return (
    <RoleShell kind={ROLE_NATIONAL_HEAD_COACH} title="Главный тренер сборной" nav={nav} home={home} active={active} bleed>
      {children}
    </RoleShell>
  );
}

export function NationalView() {
  const router = useRouter();
  return (
    <Shell active="Состав сборной">
      <RosterTable canEdit onOpen={(id) => router.push(`${BASE}/members/${id}/plan`)} />
    </Shell>
  );
}

export function NationalMemberView({ id, section }: { id: string; section: MemberSection }) {
  const router = useRouter();
  const member = useLoad(() => fetchMember(id), id);
  const nav = SECTIONS.map((s) => ({ label: s.label, href: `${BASE}/members/${id}/${s.id}`, icon: s.icon }));
  const active = SECTIONS.find((s) => s.id === section)!.label;
  return (
    <Shell active={active} nav={nav} home={BASE}>
      {member.error ? (
        <p className="p-6 text-[13px] text-red-600">{member.error}</p>
      ) : !member.data ? (
        <Spinner className="m-auto" />
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto">
          <MemberStrip member={member.data} canEdit onChanged={member.reload} onRemoved={() => router.push(BASE)} />
          {section === 'plan' ? (
            <PlanBoard memberId={id} />
          ) : (
            <MedicalCardView memberId={id} />
          )}
        </div>
      )}
    </Shell>
  );
}
