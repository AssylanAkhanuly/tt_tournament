'use client';

/* «Сведения» турнира — обзор ✳ (23.11.2026, решение владельца продукта; образец
   — экран «Route Optimization» Truck&Co). Сверху — показатели турнира. Ниже
   слева — карта Казахстана точками: место турнира выбирают щелчком по городу
   (сохраняется сразу, как в форме); справа — параметры турнира строками,
   «Изменить» открывает прежнюю форму сведений в широкой панели — с проектом
   протокола и его выгрузкой в PDF. Ниже — участники лентой карточек (лицо, группа и место, победы
   и поражения), ещё ниже — расписание лентой времени: строка — стол, блок —
   матч (сыгран — залит, идёт — с обводкой, ждёт — светлый), красная черта —
   «сейчас». Данные — сведения, состав и снимок расписания; считает сервер. */

import { Button, Chip, Drawer, Spinner } from '@heroui/react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';

import {
  FORMAT_LABEL,
  LEVEL_LABEL,
  STATUS_LABEL,
  placeLabel,
  updateTournament,
  useParticipants,
  useSchedule,
  useTournament,
  type GroupStanding,
  type Schedule,
  type ScheduledMatch,
  type TournamentSummary,
} from '@/entities/tournament';
import { TournamentInfoForm, infoOf } from '@/features/tournament-info';
import { placeholderFigure } from '@/shared/lib/figure';
import { shortName } from '@/shared/lib/name';
import { SideContent, SideDialog } from '@/shared/ui/SidePanel';

import { KzDotMap } from './KzDotMap';

const CARD = 'rounded-2xl border border-neutral-200 bg-white';
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hhmm = (d: Date) => pad(d.getHours()) + ':' + pad(d.getMinutes());
const ruDate = (iso: string | null) => (iso ? new Date(iso + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—');

// ── показатели ───────────────────────────────────────────────────────────────

function Kpi({ label, value, chip, testId }: { label: string; value: ReactNode; chip?: ReactNode; testId: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-5 first:pl-0 max-md:px-0" data-testid={testId}>
      <span className="text-[13px] text-neutral-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[26px] leading-none font-semibold whitespace-nowrap tabular-nums">{value}</span>
        {chip}
      </span>
    </div>
  );
}

const pill = (text: string, tone: 'brand' | 'green' | 'neutral' = 'brand') => (
  <span
    className={
      'rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
      (tone === 'green' ? 'bg-qtt-lime/50 text-green-900' : tone === 'neutral' ? 'bg-neutral-100 text-neutral-600' : 'bg-brand-100 text-brand-700')
    }
  >
    {text}
  </span>
);

// ── параметры справа ─────────────────────────────────────────────────────────

function Params({ t, onEdit }: { t: TournamentSummary; onEdit: () => void }) {
  const age = t.ageMin || t.ageMax ? [t.ageMin ? 'от ' + t.ageMin : '', t.ageMax ? 'до ' + t.ageMax : ''].filter(Boolean).join(' ') + ' лет' : 'Без ограничений';
  const rows: [string, ReactNode][] = [
    ['Название', t.name],
    ['Вид', t.kind?.name ?? 'Без вида'],
    ['Статус', <Chip key="s" size="sm" variant="soft" color={t.status === 'in_progress' ? 'success' : 'default'}>{STATUS_LABEL[t.status]}</Chip>],
    ['Даты', t.startsAt ? ruDate(dayKey(t.startsAt)) + (t.endsAt && t.endsAt !== dayKey(t.startsAt) ? ' — ' + ruDate(t.endsAt) : '') : '—'],
    ['Место', placeLabel(t) || '—'],
    ['Зал', t.venue || '—'],
    ['Система', FORMAT_LABEL[t.format] ?? t.format],
    ['Игроков в группе', t.groupSize],
    ['Матч', 'до ' + t.gamesToWin + ' побед'],
    ['Уровень', LEVEL_LABEL[t.level] ?? t.level],
    ['Возраст', age],
    ['Рейтинговый', t.isRating ? 'Да' : 'Нет'],
  ];
  return (
    <section className={CARD + ' flex min-h-0 flex-col p-5'} data-testid="overview-params">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold">Параметры</h2>
        <Button size="sm" variant="secondary" className="rounded-full" onPress={onEdit} data-testid="info-edit">
          <Pencil size={14} /> Изменить
        </Button>
      </div>
      <dl className="m-0 mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-b border-neutral-100 py-2.5 text-[14px] last:border-b-0">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="m-0 truncate text-right font-medium" title={typeof v === 'string' ? v : undefined}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── участники ────────────────────────────────────────────────────────────────

type PlayerCard = { id: string; name: string; avatar: string | null; group: string | null; standing: GroupStanding | null; rating: number | null };

function Players({ players }: { players: PlayerCard[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => strip.current?.scrollBy({ left: d * strip.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="flex items-center gap-2" data-testid="overview-players">
      <Button isIconOnly size="sm" variant="secondary" className="shrink-0 rounded-full max-md:hidden" aria-label="Назад" onPress={() => scroll(-1)}>
        <ChevronLeft size={16} />
      </Button>
      <div ref={strip} className="flex min-w-0 flex-1 snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {players.map((p) => {
          const games = p.standing ? p.standing.wins + p.standing.losses : 0;
          const share = games ? p.standing!.wins / games : 0;
          return (
            <div key={p.id} className={CARD + ' flex w-60 shrink-0 snap-start flex-col gap-3 p-4'} data-testid="overview-player">
              <div className="flex items-center gap-2">
                {p.group && <span className="text-[13px] font-semibold">Группа {p.group}</span>}
                {p.standing && p.standing.place ? pill('место ' + p.standing.place) : pill('—', 'neutral')}
              </div>
              <div className="flex items-center gap-3">
                <span className="block size-10 shrink-0 overflow-hidden rounded-full bg-qtt-peach">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar ?? placeholderFigure(p.id)} alt="" className={'size-full object-cover ' + (p.avatar ? '' : 'origin-[50%_12%] scale-[2.2] object-top')} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold" title={p.name}>{shortName(p.name)}</div>
                  {p.rating !== null && <div className="text-[12px] text-neutral-500">рейтинг {p.rating.toFixed(2).replace('.', ',')}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold tabular-nums">{p.standing ? p.standing.wins + '–' + p.standing.losses : '—'}</div>
                  <div className="text-[11px] text-neutral-500">побед</div>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
                <div className="h-full rounded-full bg-brand-600" style={{ width: Math.round(share * 100) + '%' }} />
              </div>
            </div>
          );
        })}
      </div>
      <Button isIconOnly size="sm" variant="secondary" className="shrink-0 rounded-full max-md:hidden" aria-label="Вперёд" onPress={() => scroll(1)}>
        <ChevronRight size={16} />
      </Button>
    </section>
  );
}

// ── расписание лентой времени ────────────────────────────────────────────────

function Timeline({ s }: { s: Schedule }) {
  const days = s.settings.days.length ? s.settings.days : [];
  const today = dayKey(new Date());
  const [at, setAt] = useState(() => Math.max(0, days.findIndex((d) => d.date === today)));
  const day = days[at];
  if (!day) return null;
  const [sh, sm] = day.start.split(':').map(Number);
  const [eh, em] = day.end.split(':').map(Number);
  const from = sh * 60 + sm;
  const to = eh * 60 + em;
  const span = Math.max(60, to - from);
  const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes();
  const ofDay = s.matches.filter((m) => m.scheduledAt && dayKey(m.scheduledAt) === day.date && m.table);
  const tables = Array.from({ length: Math.max(s.settings.tables, ...ofDay.map((m) => m.table ?? 0)) }, (_, i) => i + 1);
  const hours = Array.from({ length: Math.floor(span / 60) + 1 }, (_, i) => from + i * 60).filter((v) => v <= to);
  const now = new Date();
  const nowAt = day.date === today ? minutes(now) : null;
  const pct = (v: number) => ((v - from) / span) * 100;
  const block = (m: ScheduledMatch) => {
    const done = m.status === 'finished';
    const live = m.status === 'in_progress';
    return (
      <div
        key={m.id}
        className={
          'absolute inset-y-1 flex min-w-0 flex-col justify-center overflow-hidden rounded-lg px-2 text-[11px] leading-tight ' +
          (done ? 'bg-brand-600 text-white' : live ? 'bg-brand-100 text-brand-900 ring-2 ring-brand-500' : 'border border-neutral-200 bg-white text-neutral-700')
        }
        style={{ left: pct(minutes(m.scheduledAt!)) + '%', width: (s.settings.matchMinutes / span) * 100 + '%' }}
        title={m.player1.name + ' — ' + m.player2.name}
        data-testid="timeline-match"
        data-state={done ? 'done' : live ? 'live' : 'pending'}
      >
        <span className="truncate font-semibold">{shortName(m.player1.name).split(' ')[0]} — {shortName(m.player2.name).split(' ')[0]}</span>
        <span className="truncate opacity-75">
          {hhmm(m.scheduledAt!)}
          {done || live ? ' · ' + (m.score1 ?? 0) + ':' + (m.score2 ?? 0) : ''}
        </span>
      </div>
    );
  };
  return (
    <section className={CARD + ' p-5'} data-testid="overview-timeline">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[17px] font-semibold">Расписание</h2>
        <div className="ml-auto flex items-center gap-1 rounded-full border border-neutral-200 p-1">
          <Button isIconOnly size="sm" variant="ghost" className="rounded-full" aria-label="Предыдущий день" isDisabled={at === 0} onPress={() => setAt(at - 1)}>
            <ChevronLeft size={14} />
          </Button>
          <span className="px-2 text-[13px] font-medium" data-testid="timeline-day">{ruDate(day.date)}</span>
          <Button isIconOnly size="sm" variant="ghost" className="rounded-full" aria-label="Следующий день" isDisabled={at >= days.length - 1} onPress={() => setAt(at + 1)}>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <div style={{ minWidth: 150 + (span / 60) * 190 }}>
          <div className="sticky top-0 z-10 grid grid-cols-[150px_1fr] bg-white pb-1 text-[12px] text-neutral-500">
            <span>Стол</span>
            <div className="relative h-5">
              {hours.map((h) => (
                <span key={h} className="absolute -translate-x-1/2" style={{ left: pct(h) + '%' }}>
                  {pad(Math.floor(h / 60))}:00
                </span>
              ))}
            </div>
          </div>
          {tables.map((tb) => {
            const ms = ofDay.filter((m) => m.table === tb);
            const done = ms.filter((m) => m.status === 'finished').length;
            return (
              <div key={tb} className="grid grid-cols-[150px_1fr] items-center gap-0 py-1" data-testid="timeline-row">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="flex items-center justify-between text-[13px] font-semibold">
                    Стол {tb}
                    <span className="text-[12px] font-normal text-neutral-500 tabular-nums">{done}/{ms.length}</span>
                  </span>
                  <span className="h-1 overflow-hidden rounded-full bg-neutral-100">
                    <span className="block h-full rounded-full bg-brand-600" style={{ width: (ms.length ? (done / ms.length) * 100 : 0) + '%' }} />
                  </span>
                </div>
                <div className="relative h-12 rounded-lg bg-neutral-50">
                  {ms.map(block)}
                  {nowAt !== null && nowAt >= from && nowAt <= to && (
                    <span aria-hidden className="absolute inset-y-0 w-0.5 bg-red-500" style={{ left: pct(nowAt) + '%' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── экран ────────────────────────────────────────────────────────────────────

export function TournamentDashboard({ id }: { id: string }) {
  const tournament = useTournament(id);
  const participants = useParticipants(id);
  const schedule = useSchedule(id);
  const [editing, setEditing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const t = tournament.data;
  const s = schedule.data;

  const players = useMemo<PlayerCard[]>(() => {
    const standing = new Map<string, { group: string; standing: GroupStanding }>();
    s?.groups.forEach((g) => g.players.forEach((p) => standing.set(p.id, { group: g.name, standing: p.standing })));
    return (participants.data ?? [])
      .map((p) => ({ id: p.userId, name: p.name, avatar: p.avatar, group: standing.get(p.userId)?.group ?? null, standing: standing.get(p.userId)?.standing ?? null, rating: p.ratingBefore }))
      .sort((a, b) => (a.group ?? '~').localeCompare(b.group ?? '~') || (a.standing?.place || 99) - (b.standing?.place || 99) || a.name.localeCompare(b.name, 'ru'));
  }, [participants.data, s]);

  if (tournament.error) return <p className="p-6 text-[13px] text-red-600">{tournament.error}</p>;
  if (!t) return <Spinner className="m-auto" />;

  const total = s?.matches.length ?? 0;
  const done = s?.matches.filter((m) => m.status === 'finished').length ?? 0;
  const live = s?.matches.filter((m) => m.status === 'in_progress').length ?? 0;
  const tables = s ? Math.max(s.settings.tables, ...s.matches.map((m) => m.table ?? 0)) : 0;

  const pickPlace = async (place: { region: string; city: string }) => {
    setPlaceError(null);
    try {
      await updateTournament(t.id, { ...infoOf(t), ...place });
      tournament.reload();
    } catch (e) {
      setPlaceError((e as Error).message);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-neutral-50" data-testid="tournament-overview">
      <div className="flex flex-col gap-5 p-6 max-md:p-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="grid grid-cols-4 divide-x divide-neutral-200 max-md:grid-cols-2 max-md:gap-4 max-md:divide-x-0">
              <Kpi label="Участников" value={t.participants} chip={t.participantLimit ? pill('из ' + t.participantLimit, 'neutral') : undefined} testId="kpi-players" />
              <Kpi label="Сыграно матчей" value={total ? done + ' / ' + total : '—'} chip={total ? pill(Math.round((done / total) * 100) + '%', 'green') : undefined} testId="kpi-done" />
              <Kpi label="Идут сейчас" value={live} chip={live ? pill('live') : undefined} testId="kpi-live" />
              <Kpi label="Столов" value={tables || '—'} chip={s ? pill(s.groups.length + ' групп', 'neutral') : undefined} testId="kpi-tables" />
            </div>
            <div className={CARD + ' relative h-[380px] overflow-hidden bg-neutral-50 p-4 max-md:h-[260px]'}>
              <KzDotMap region={t.region} city={t.city} onPick={(p) => void pickPlace(p)} />
              <div className="absolute right-4 bottom-4 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[12px] shadow-sm" data-testid="overview-place">
                <div className="text-neutral-500">Место проведения</div>
                <div className="font-semibold">{placeLabel(t) || 'Выберите город на карте'}</div>
                {t.venue && <div className="text-neutral-500">{t.venue}</div>}
              </div>
              {placeError && <p className="absolute top-3 left-4 m-0 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-red-700">{placeError}</p>}
            </div>
          </div>
          <Params t={t} onEdit={() => setEditing(true)} />
        </div>

        {players.length > 0 && <Players players={players} />}
        {s && s.status !== 'none' ? (
          <Timeline s={s} />
        ) : (
          <section className={CARD + ' p-5 text-[14px] text-neutral-500'} data-testid="overview-timeline">
            Расписания пока нет
          </section>
        )}
      </div>

      <Drawer.Backdrop isOpen={editing} onOpenChange={setEditing}>
        <SideContent>
          <SideDialog className="sm:w-[min(1280px,96vw)]" data-testid="info-drawer">
            <Drawer.Header className="border-b border-neutral-200 pb-3">
              <Drawer.Heading className="text-lg font-semibold">Сведения</Drawer.Heading>
            </Drawer.Header>
            <div className="flex min-h-0 flex-1 flex-col">
              <TournamentInfoForm tournament={t} onSaved={tournament.reload} />
            </div>
          </SideDialog>
        </SideContent>
      </Drawer.Backdrop>
    </div>
  );
}
