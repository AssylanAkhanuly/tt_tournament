'use client';

/* Кабинеты национальной команды ✳ (19.11.2026, NATIONAL.md) — один набор
   экранов на все роли сборной; кабинет задаёт адрес, роли, меню и можно ли
   вносить в состав:

   - `/national` — тренерский штаб: главный тренер (11), консультант (19 —
     полная копия), тренер сборной (20 — видит свою возрастную группу);
     разделы «Состав сборной», «Планы подготовки» (календарь подготовки и
     рапорты из меню убраны 22.11.2026, решение владельца продукта);
   - `/personal-coach` — личный тренер: «Мои спортсмены», «Планы подготовки»;
   - `/doctor` — врач сборной (21); `/psychologist` — психолог (22).

   Карточка члена сборной — `<кабинет>/members/<id>[/<раздел>]` ✳ (22.11.2026,
   решение владельца продукта): сайдбар остаётся меню кабинета, имя — заголовком.
   Без раздела в адресе — профиль (`MemberProfile`); разделы, что сервер открыл
   этому человеку (`member.access`) — «План подготовки», «Медкарта», «История»,
   «Спортивная карточка», — открываются ссылками из блоков профиля, вкладок нет;
   в разделе — «← Профиль» (меню туда не ведёт). Знак в шапке ведёт к составу. */

import { Button, Spinner } from '@heroui/react';
import { Brain, ChevronLeft, ClipboardList, GanttChart, HeartPulse, History, UserRound, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { fetchMember, fetchNationalMe, useLoad, type NationalMember } from '@/entities/national';
import {
  ROLE_NATIONAL_CONSULTANT,
  ROLE_NATIONAL_DOCTOR,
  ROLE_NATIONAL_HEAD_COACH,
  ROLE_NATIONAL_PSYCHOLOGIST,
  ROLE_NATIONAL_TEAM_COACH,
  ROLE_PERSONAL_COACH,
  useSession,
  workspacesOf,
} from '@/entities/session';
import { RoleShell, type RoleNavItem } from '@/views/workspace';
import {
  HistoryTable,
  MedicalCardView,
  MemberProfile,
  PlanBoard,
  PlansTimeline,
  RosterTable,
  SportCard,
} from '@/widgets/national';

export type CabinetKey = 'national' | 'personal' | 'doctor' | 'psychologist';
export type MemberSection = 'profile' | 'plan' | 'medical' | 'history' | 'sport';

type Cabinet = { base: string; kinds: string[]; nav: RoleNavItem[]; roster: string; canAdd: boolean };

const CABINETS: Record<CabinetKey, Cabinet> = {
  national: {
    base: '/national',
    kinds: [ROLE_NATIONAL_HEAD_COACH, ROLE_NATIONAL_CONSULTANT, ROLE_NATIONAL_TEAM_COACH],
    roster: 'Состав сборной',
    canAdd: true,
    nav: [
      { label: 'Состав сборной', href: '/national', icon: <Users size={16} />, group: 'Сборная' },
      // Доска планов всех спортсменов ✳ (21.11.2026, образец Visitly).
      { label: 'Планы подготовки', href: '/national/plans', icon: <GanttChart size={16} />, group: 'Сборная' },
    ],
  },
  personal: {
    base: '/personal-coach',
    kinds: [ROLE_PERSONAL_COACH],
    roster: 'Мои спортсмены',
    canAdd: false,
    nav: [
      { label: 'Мои спортсмены', href: '/personal-coach', icon: <Users size={16} /> },
      { label: 'Планы подготовки', href: '/personal-coach/plans', icon: <GanttChart size={16} /> },
    ],
  },
  doctor: {
    base: '/doctor',
    kinds: [ROLE_NATIONAL_DOCTOR],
    roster: 'Состав сборной',
    canAdd: false,
    nav: [{ label: 'Состав сборной', href: '/doctor', icon: <Users size={16} /> }],
  },
  psychologist: {
    base: '/psychologist',
    kinds: [ROLE_NATIONAL_PSYCHOLOGIST],
    roster: 'Состав сборной',
    canAdd: false,
    nav: [{ label: 'Состав сборной', href: '/psychologist', icon: <Users size={16} /> }],
  },
};

const SECTIONS: { id: MemberSection; label: string; icon: ReactNode; open: (m: NationalMember) => boolean }[] = [
  { id: 'profile', label: 'Профиль', icon: <UserRound size={16} />, open: () => true },
  { id: 'plan', label: 'План подготовки', icon: <ClipboardList size={16} />, open: (m) => m.access.plans },
  { id: 'medical', label: 'Медкарта', icon: <HeartPulse size={16} />, open: (m) => m.access.medical !== null },
  { id: 'history', label: 'История', icon: <History size={16} />, open: (m) => m.access.plans },
  { id: 'sport', label: 'Спортивная карточка', icon: <Brain size={16} />, open: (m) => m.access.sport },
];

function Shell({ cabinet, active, home, sections, section, pageTitle, children }: {
  cabinet: Cabinet;
  active: string;
  home?: string;
  sections?: RoleNavItem[];
  section?: string;
  pageTitle?: string;
  children: ReactNode;
}) {
  const { user } = useSession();
  // Первая строка меню человека — его роль из тех, что пускают в кабинет.
  const title = workspacesOf(user).find((w) => cabinet.kinds.includes(w.kind))?.title ?? '';
  return (
    <RoleShell
      kind={cabinet.kinds}
      title={title}
      nav={cabinet.nav}
      home={home}
      active={active}
      sections={sections}
      section={section}
      pageTitle={pageTitle}
      bleed
    >
      {children}
    </RoleShell>
  );
}

export function NationalRosterView({ cabinet: key }: { cabinet: CabinetKey }) {
  const router = useRouter();
  const cabinet = CABINETS[key];
  // «Внести в сборную» — главному тренеру и консультанту, не тренеру сборной.
  const me = useLoad(fetchNationalMe, 'me');
  return (
    <Shell cabinet={cabinet} active={cabinet.roster}>
      <RosterTable canEdit={cabinet.canAdd && !!me.data?.headStaff} onOpen={(id) => router.push(`${cabinet.base}/members/${id}`)} />
    </Shell>
  );
}

/** Доска планов подготовки ✳ (21.11.2026): строка на спортсмена, пункты его
 *  планов по дням; щелчок по имени или «Открыть план» — раздел плана карточки. */
export function NationalPlansView({ cabinet: key }: { cabinet: CabinetKey }) {
  const router = useRouter();
  const cabinet = CABINETS[key];
  return (
    <Shell cabinet={cabinet} active="Планы подготовки">
      <PlansTimeline onOpenPlan={(id) => router.push(`${cabinet.base}/members/${id}/plan`)} />
    </Shell>
  );
}

export function NationalMemberView({ cabinet: key, id, section = 'profile' }: { cabinet: CabinetKey; id: string; section?: MemberSection }) {
  const router = useRouter();
  const cabinet = CABINETS[key];
  const member = useLoad(() => fetchMember(id), id);
  const m = member.data;
  const open = m ? SECTIONS.filter((s) => s.open(m)) : [];
  // Раздел, который этому человеку не открыт, — профиль (он есть у всех).
  const current = open.find((s) => s.id === section) ?? open[0];
  const href = (s: MemberSection) => `${cabinet.base}/members/${id}` + (s === 'profile' ? '' : '/' + s);

  return (
    <Shell
      cabinet={cabinet}
      active={cabinet.roster}
      home={cabinet.base}
      sections={[]}
      pageTitle={m ? m.person.name + (current && current.id !== 'profile' ? ' · ' + current.label : '') : undefined}
    >
      {member.error ? (
        <p className="p-6 text-[13px] text-red-600">{member.error}</p>
      ) : !m || !current ? (
        <Spinner className="m-auto" />
      ) : current.id === 'profile' ? (
        <MemberProfile
          member={m}
          onOpenPlan={() => router.push(href('plan'))}
          onOpenHistory={() => router.push(href('history'))}
          onOpenMedical={() => router.push(href('medical'))}
          onOpenSport={() => router.push(href('sport'))}
          onChanged={member.reload}
          onRemoved={() => router.push(cabinet.base)}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto">
          <div className="px-4 pt-3">
            <Button size="sm" variant="ghost" className="rounded-xl" onPress={() => router.push(href('profile'))} data-testid="member-back">
              <ChevronLeft size={16} /> Профиль
            </Button>
          </div>
          {current.id === 'plan' && <PlanBoard memberId={id} canCreate={m.access.planAuthor} onChanged={member.reload} />}
          {current.id === 'medical' && <MedicalCardView memberId={id} onChanged={member.reload} />}
          {current.id === 'history' && <HistoryTable memberId={id} />}
          {current.id === 'sport' && <SportCard memberId={id} />}
        </div>
      )}
    </Shell>
  );
}
