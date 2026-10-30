'use client';

/* Страница турнира ✳ (28.10.2026, решение владельца продукта): внутри турнира
   сайдбар показывает не разделы кабинета, а разделы турнира — «Спортсмены» и
   «Судьи» (каждый — своя страница), над ними «← Все турниры», название и дата.
   Оболочку (кабинет администратора или председателя ГСК) даёт экран; отсюда —
   разделы, шапка сайдбара и содержимое раздела. Таблицы — общий `DataTable`
   (поиск, сортировка, страницы); заголовка раздела над таблицей нет — раздел
   уже подсвечен в сайдбаре. «Добавить» справа в полосе над таблицей —
   спортсмен или судья из существующих учёток (`features/tournament-roster`).
   У «Судей» две вкладки ✳ (29.10.2026): «Коллегия» — назначенные, «Заявки» —
   заявки судей на судейство с решением и приёмом заявок
   (`features/referee-recruitment`); вкладка — в адресе (`?tab=applications`).
   HeroUI + Tailwind. */

import { Button, Chip } from '@heroui/react';
import { ArrowLeft, CalendarClock, Gavel, Info, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import {
  REFEREE_POSITIONS,
  tournamentDate,
  useParticipants,
  useReferees,
  useRefereeApplications,
  useTournament,
  type ApplicationStatus,
  type RefereeApplication,
  type RefereePosition,
  type TournamentParticipant,
  type TournamentReferee,
  type TournamentSummary,
} from '@/entities/tournament';
import { ApplicationDrawer } from '@/features/referee-recruitment';
import { TournamentInfoForm } from '@/features/tournament-info';
import { ScheduleSection } from '@/features/tournament-schedule';
import { AddToRosterDialog, PlayerDrawer, RefereeDrawer } from '@/features/tournament-roster';
import { RecruitmentSettings, SettingsButton } from '@/features/tournament-settings';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { PersonAvatar } from '@/shared/ui/PersonAvatar';

export type TournamentSectionId = 'info' | 'players' | 'referees' | 'schedule';

const SECTIONS: { id: TournamentSectionId; label: string; icon: ReactNode }[] = [
  // «Сведения» ✳ (29.10.2026) — первым: общее о турнире и формат.
  { id: 'info', label: 'Сведения', icon: <Info size={16} /> },
  { id: 'players', label: 'Спортсмены', icon: <Users size={16} /> },
  { id: 'referees', label: 'Судьи', icon: <Gavel size={16} /> },
  // «Расписание» ✳ (30.10.2026): строит главный судья, остальные видят.
  { id: 'schedule', label: 'Расписание', icon: <CalendarClock size={16} /> },
];

/** Вид раздела — подпункт в сайдбаре ✳ (30.10.2026, решение владельца продукта:
 *  вместо вкладок на экране). Живёт в адресе: «Судьи» — `?tab=applications`,
 *  «Расписание» — `?view=day|groups`; первый подпункт — без параметра. */
/** Подпункт раздела — той же формы, что подпункт сайдбара (`AppShell`). */
type NavSubItem = { label: string; href: string; active?: boolean; badge?: number };

export type SectionView = { tab: 'roster' | 'applications'; view: 'matches' | 'day' | 'groups'; pending: number };

/** Разделы турнира для сайдбара: подпись, адрес, значок и подпункты. Каждый
 *  раздел — своя страница ✳ (28.10.2026, решение владельца продукта):
 *  `…/<id>/players`, `…/<id>/referees`, а не параметр адреса. */
export function tournamentNav(pageHref: string, only?: TournamentSectionId[], at?: SectionView) {
  const sub = (section: TournamentSectionId): NavSubItem[] | undefined => {
    const base = pageHref + '/' + section;
    if (section === 'referees')
      return [
        { label: 'Коллегия', href: base, active: at?.tab !== 'applications' },
        { label: 'Заявки', href: base + '?tab=applications', active: at?.tab === 'applications', badge: at?.pending },
      ];
    if (section === 'schedule')
      return [
        { label: 'Матчи', href: base, active: !at || at.view === 'matches' },
        { label: 'День', href: base + '?view=day', active: at?.view === 'day' },
        { label: 'Группы', href: base + '?view=groups', active: at?.view === 'groups' },
      ];
    return undefined;
  };
  return SECTIONS.filter((s) => !only || only.includes(s.id)).map((s) => ({
    label: s.label,
    href: pageHref + '/' + s.id,
    icon: s.icon,
    children: sub(s.id),
  }));
}

export const sectionLabel = (id: TournamentSectionId) => SECTIONS.find((s) => s.id === id)!.label;

/** Шапка сайдбара внутри турнира: назад к списку, название и дата. */
export function TournamentContext({ t, onBack }: { t: TournamentSummary | null; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-fit gap-1.5 rounded-xl px-2 text-[13px] text-neutral-600"
        onPress={onBack}
        data-testid="tournament-back"
      >
        <ArrowLeft size={15} /> Все турниры
      </Button>
      {t && (
        <div className="px-2" data-testid="tournament-context">
          <p className="line-clamp-3 text-[14px] font-semibold leading-snug">{t.name}</p>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t.startsAt ? tournamentDate(t.startsAt) : 'Без даты'}</p>
        </div>
      )}
    </div>
  );
}

const signed = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',');
const plain = (v: number) => v.toFixed(2).replace('.', ',');

const PLAYER_COLUMNS: DataColumn<TournamentParticipant>[] = [
  {
    id: 'name',
    label: 'Спортсмен',
    rowHeader: true,
    sortValue: (p) => p.name,
    // Фото — в строке рядом с именем ✳ (29.10.2026): нет снимка — силуэт-заглушка.
    render: (p) => (
      <span className="flex items-center gap-3">
        <PersonAvatar name={p.name} src={p.avatar} />
        {p.name}
        {p.absent && (
          <Chip size="sm" variant="soft" color="warning">
            неявка
          </Chip>
        )}
      </span>
    ),
  },
  {
    id: 'before',
    label: 'Рейтинг до',
    align: 'right',
    descFirst: true,
    sortValue: (p) => p.ratingBefore,
    render: (p) => (p.ratingBefore === null ? '—' : plain(p.ratingBefore)),
  },
  {
    id: 'change',
    label: 'Изменение',
    align: 'right',
    descFirst: true,
    sortValue: (p) => p.ratingChange,
    render: (p) => (
      <span
        className={
          p.ratingChange && p.ratingChange > 0
            ? 'text-green-700'
            : p.ratingChange && p.ratingChange < 0
              ? 'text-red-600'
              : ''
        }
      >
        {p.ratingChange === null ? '—' : signed(p.ratingChange)}
      </span>
    ),
  },
];

const POSITION_ORDER: string[] = REFEREE_POSITIONS.map((p) => p.id);
const POSITION_LABEL = Object.fromEntries(REFEREE_POSITIONS.map((p) => [p.id, p.label])) as Record<string, string>;

const REFEREE_COLUMNS: DataColumn<TournamentReferee>[] = [
  { id: 'name', label: 'Судья', rowHeader: true, sortValue: (r) => r.name, render: (r) => r.name },
  {
    id: 'position',
    label: 'Должность',
    // По старшинству должности, а не по алфавиту.
    sortValue: (r) => POSITION_ORDER.indexOf(r.position),
    render: (r) => POSITION_LABEL[r.position] ?? r.position,
  },
  {
    id: 'email',
    label: 'Эл. почта',
    sortValue: (r) => r.email,
    render: (r) => <span className="text-neutral-600">{r.email ?? '—'}</span>,
  },
];

/** «Спортсмены»: состав турнира. Как у «Судей»: справа в полосе «Настройки»
 *  (приём заявок игроков) и «Добавить», щелчок по строке — карточка справа. */
function Players({ id, recruitment }: { id: string; recruitment: boolean }) {
  const participants = useParticipants(id);
  const tournament = useTournament(id);
  const rows = participants.data ?? [];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <DataTable
        ariaLabel="Спортсмены"
        testId="participants"
        rows={rows}
        loading={!participants.data && !participants.error}
        error={participants.error}
        columns={PLAYER_COLUMNS}
        getId={(p) => String(p.id)}
        search={{ placeholder: 'Фамилия или имя', text: (p) => p.name, testId: 'participants-search' }}
        count={(n) => 'Спортсменов: ' + n}
        actions={
          <>
            {!recruitment ? null : tournament.data ? (
              <RecruitmentSettings
                tournamentId={id}
                of="players"
                recruitment={tournament.data.playerRecruitment}
                onChanged={tournament.reload}
              />
            ) : (
              <SettingsButton isDisabled />
            )}
            <AddToRosterDialog tournamentId={id} role="player" onAdded={participants.reload} />
          </>
        }
        empty="Участников нет"
        onRowAction={(p) => setOpen(p.id)}
        rowProps={() => ({ 'data-testid': 'participant-row' })}
      />
      <PlayerDrawer
        tournamentId={id}
        player={rows.find((p) => p.id === open) ?? null}
        onClose={() => setOpen(null)}
        onRemoved={participants.reload}
      />
    </>
  );
}

type RefereeTab = SectionView['tab'];

function Referees({ id }: { id: string }) {
  const params = useSearchParams();
  const tab: RefereeTab = params.get('tab') === 'applications' ? 'applications' : 'roster';
  const referees = useReferees(id);
  const tournament = useTournament(id);
  // Заявки — здесь, а не во вкладке: их число нужно значку и на «Коллегии».
  const applications = useRefereeApplications(id);
  const rows = referees.data ?? [];
  // Чья карточка открыта: щелчок по строке открывает её справа.
  const [open, setOpen] = useState<string | null>(null);
  const taken = rows.map((r) => ({ position: r.position, name: r.name, id: r.id }));
  // Полоса над таблицей одна на «Коллегию» и «Заявки» (их выбирают подпункты
  // сайдбара): «Настройки», «Добавить» — на тех же местах. «Настройки» видны
  // сразу, до загрузки турнира, — иначе полоса прыгает при открытии страницы.
  const toolbar = (
    <>
      {tournament.data ? (
        <RecruitmentSettings
          tournamentId={id}
          of="referees"
          recruitment={tournament.data.refereeRecruitment}
          onChanged={tournament.reload}
        />
      ) : (
        <SettingsButton isDisabled />
      )}
      <AddToRosterDialog tournamentId={id} role="referee" taken={taken} onAdded={referees.reload} />
    </>
  );
  if (tab === 'applications') {
    return (
      <Applications id={id} applications={applications} taken={taken} toolbar={toolbar} onAssigned={referees.reload} />
    );
  }
  return (
    <>
      <DataTable
        ariaLabel="Судьи"
        testId="referees"
        rows={rows}
        loading={!referees.data && !referees.error}
        error={referees.error}
        columns={REFEREE_COLUMNS}
        getId={(r) => r.id}
        search={{
          placeholder: 'Фамилия, имя или почта',
          text: (r) => r.name + ' ' + (r.email ?? ''),
          testId: 'referees-search',
        }}
        count={(n) => 'Судей: ' + n}
        actions={toolbar}
        defaultSort={{ column: 'position', direction: 'ascending' }}
        empty="Судей нет"
        onRowAction={(r) => setOpen(r.id)}
        rowProps={(r) => ({ 'data-testid': 'referee-row', 'data-position': r.position })}
      />
      <RefereeDrawer
        tournamentId={id}
        userId={open}
        taken={taken}
        onClose={() => setOpen(null)}
        onChanged={referees.reload}
      />
    </>
  );
}

const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; color: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Ждёт решения', color: 'warning' },
  accepted: { label: 'Назначен', color: 'success' },
  rejected: { label: 'Отклонена', color: 'danger' },
};

/** Заявки судей на турнир: кто, на какие должности, когда подана и решение.
 *  Щелчок по строке — карточка заявки справа с «Назначить» и «Отклонить». */
function Applications({
  id,
  applications,
  taken,
  toolbar,
  onAssigned,
}: {
  id: string;
  applications: ReturnType<typeof useRefereeApplications>;
  taken: { position: RefereePosition; name: string; id: string }[];
  /** Полоса над таблицей — общая с «Коллегией». */
  toolbar: ReactNode;
  onAssigned: () => void;
}) {
  // Чья заявка открыта: щелчок по строке открывает карточку справа.
  const [open, setOpen] = useState<string | null>(null);
  const rows = applications.data ?? [];
  const columns: DataColumn<RefereeApplication>[] = [
    { id: 'name', label: 'Судья', rowHeader: true, sortValue: (a) => a.name, render: (a) => a.name },
    {
      id: 'positions',
      label: 'Должности',
      render: (a) => (
        <span className="text-neutral-600">{a.positions.map((p) => POSITION_LABEL[p] ?? p).join(', ')}</span>
      ),
    },
    {
      id: 'created',
      label: 'Подана',
      descFirst: true,
      sortValue: (a) => a.createdAt.getTime(),
      render: (a) => a.createdAt.toLocaleDateString('ru-RU'),
    },
    {
      id: 'status',
      label: 'Решение',
      sortValue: (a) => a.status,
      render: (a) => (
        <Chip size="sm" variant="soft" color={APPLICATION_STATUS[a.status].color}>
          {APPLICATION_STATUS[a.status].label}
          {a.status === 'accepted' && a.position ? ': ' + POSITION_LABEL[a.position] : ''}
        </Chip>
      ),
    },
  ];
  return (
    <>
      <DataTable
        ariaLabel="Заявки судей"
        testId="applications"
        rows={rows}
        loading={!applications.data && !applications.error}
        error={applications.error}
        columns={columns}
        getId={(a) => a.id}
        search={{ placeholder: 'Фамилия, имя или почта', text: (a) => a.name + ' ' + (a.email ?? '') }}
        count={(n) => 'Заявок: ' + n}
        actions={toolbar}
        defaultSort={{ column: 'created', direction: 'ascending' }}
        empty="Заявок нет"
        onRowAction={(a) => setOpen(a.id)}
        rowProps={(a) => ({ 'data-testid': 'application-row', 'data-status': a.status })}
      />
      <ApplicationDrawer
        tournamentId={id}
        application={rows.find((a) => a.id === open) ?? null}
        taken={taken}
        onClose={() => setOpen(null)}
        onDecided={() => {
          // Решили — карточка закрывается, решение видно в строке.
          setOpen(null);
          applications.reload();
          onAssigned();
        }}
      />
    </>
  );
}

/** «Сведения»: общее о турнире и формат — правка черновиком. */
function InfoSection({ id }: { id: string }) {
  const tournament = useTournament(id);
  if (tournament.error) return <p className="p-6 text-[13px] text-red-600">{tournament.error}</p>;
  if (!tournament.data) return null;
  return <TournamentInfoForm tournament={tournament.data} onSaved={tournament.reload} />;
}

/** Содержимое раздела турнира — на всю рабочую область (`bleed`). */
export function TournamentSection({
  id,
  section,
  recruitment = true,
}: {
  id: string;
  section: TournamentSectionId;
  /** «Настройки» приёма заявок у «Спортсменов»: у главного судьи их нет —
   *  приём ведёт председатель ГСК. */
  recruitment?: boolean;
}) {
  if (section === 'info') return <InfoSection id={id} />;
  if (section === 'schedule') return <ScheduleSection tournamentId={id} />;
  return section === 'referees' ? <Referees id={id} /> : <Players id={id} recruitment={recruitment} />;
}
