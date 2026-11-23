'use client';

/* «Сведения» турнира — обзор ✳ (23.11.2026, решение владельца продукта; образец
   — экран «Route Optimization» Truck&Co). Сверху — показатели турнира. Ниже
   слева — карта Казахстана точками: место турнира выбирают щелчком по городу
   (сохраняется сразу, как в форме); справа — параметры турнира строками,
   над ними — даты календарём-диапазоном (выбор сохраняется сразу);
   «Изменить» открывает прежнюю форму сведений в широкой панели — с проектом
   протокола и его выгрузкой в PDF. Ниже — участники лентой карточек (лицо, группа и место, победы
   и поражения), ещё ниже — расписание лентой времени: строка — стол, блок —
   матч (сыгран — залит, идёт — с обводкой, ждёт — светлый), красная черта —
   «сейчас». Данные — сведения, состав и снимок расписания; считает сервер. */

import { Button, Chip, Drawer, I18nProvider, RangeCalendar, Spinner } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';

import {
  FORMAT_LABEL,
  LEVEL_LABEL,
  STATUS_LABEL,
  placeLabel,
  updateTournament,
  useParticipants,
  useSchedule,
  useTournament,
  type Schedule,
  type ScheduledMatch,
  type TournamentSummary,
} from '@/entities/tournament';
import { TournamentInfoForm, infoOf } from '@/features/tournament-info';
import { shortName } from '@/shared/lib/name';
import { SideContent, SideDialog } from '@/shared/ui/SidePanel';
import { RatingPlayerCard, type RatingCardData } from '@/widgets/rating';

import { KzDotMap } from './KzDotMap';

const CARD = 'rounded-2xl border border-neutral-200 bg-white';
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hhmm = (d: Date) => pad(d.getHours()) + ':' + pad(d.getMinutes());
const ruDate = (iso: string | null) => (iso ? new Date(iso + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—');

// ── показатели ───────────────────────────────────────────────────────────────

function Kpi({ label, value, chip, testId }: { label: string; value: ReactNode; chip?: ReactNode; testId: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 @[640px]:px-5 @[640px]:first:pl-0" data-testid={testId}>
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

// ── даты: календарь-диапазон ─────────────────────────────────────────────────

/** Даты турнира — календарь-диапазон HeroUI ✳ (23.11.2026, решение владельца
    продукта): выбранный диапазон сохраняется сразу, как место на карте. */
function Dates({ t, onPick, error }: { t: TournamentSummary; onPick: (startsOn: string, endsAt: string) => void; error: string | null }) {
  const start = t.startsAt ? dayKey(t.startsAt) : null;
  const value = start ? { start: parseDate(start), end: parseDate(t.endsAt ?? start) } : null;
  return (
    <section className={CARD + ' p-4'} data-testid="overview-dates">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="m-0 text-[17px] font-semibold">Даты</h2>
        <span className="text-[13px] text-neutral-500" data-testid="overview-dates-label">
          {start ? ruDate(start) + (t.endsAt && t.endsAt !== start ? ' — ' + ruDate(t.endsAt) : '') : 'Не выбраны'}
        </span>
      </div>
      <I18nProvider locale="ru-RU">
        <RangeCalendar
          aria-label="Даты турнира"
          className="w-full"
          value={value}
          defaultFocusedValue={value?.start}
          onChange={(v) => v && onPick(v.start.toString(), v.end.toString())}
        >
          <RangeCalendar.Header>
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid className="w-full">
            <RangeCalendar.GridHeader>{(d) => <RangeCalendar.HeaderCell>{d}</RangeCalendar.HeaderCell>}</RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </I18nProvider>
      {error && <p className="m-0 mt-2 px-1 text-[12px] text-red-600">{error}</p>}
    </section>
  );
}

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

// ── лучшие по рейтингу ───────────────────────────────────────────────────────

/** Пять сильнейших участников по текущему рейтингу — карточками рейтинг-листа;
    «Все спортсмены» — раздел «Спортсмены» турнира ✳ (23.11.2026). */
function TopPlayers({ players, allHref }: { players: RatingCardData[]; allHref: string }) {
  const router = useRouter();
  return (
    <section className="flex flex-col gap-3" data-testid="overview-players">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold">Лучшие по рейтингу</h2>
        <Button size="sm" variant="secondary" className="rounded-full" onPress={() => router.push(allHref)} data-testid="overview-players-all">
          Все спортсмены <ChevronRight size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {players.map((p, i) => (
          <RatingPlayerCard key={p.userId} r={p} place={i + 1} onOpen={() => router.push('/rating/' + p.userId)} />
        ))}
      </div>
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
  const [datesError, setDatesError] = useState<string | null>(null);
  const t = tournament.data;
  const s = schedule.data;

  const top = useMemo<RatingCardData[]>(
    () =>
      (participants.data ?? [])
        .map((p) => ({ userId: p.userId, name: p.name, value: p.rating, region: p.region, birthYear: p.birthYear, sex: p.sex }))
        .sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || a.name.localeCompare(b.name, 'ru'))
        .slice(0, 5),
    [participants.data],
  );
  const allHref = usePathname().replace(/\/info$/, '/players');

  if (tournament.error) return <p className="p-6 text-[13px] text-red-600">{tournament.error}</p>;
  if (!t) return <Spinner className="m-auto" />;

  const total = s?.matches.length ?? 0;
  const done = s?.matches.filter((m) => m.status === 'finished').length ?? 0;
  const live = s?.matches.filter((m) => m.status === 'in_progress').length ?? 0;
  const tables = s ? Math.max(s.settings.tables, ...s.matches.map((m) => m.table ?? 0)) : 0;

  const pickDates = async (startsOn: string, endsAt: string) => {
    setDatesError(null);
    try {
      await updateTournament(t.id, { ...infoOf(t), startsOn, endsAt });
      tournament.reload();
    } catch (e) {
      setDatesError((e as Error).message);
    }
  };
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="@container"><div className="grid grid-cols-2 gap-4 @[640px]:grid-cols-4 @[640px]:gap-0 @[640px]:divide-x @[640px]:divide-neutral-200">
              <Kpi label="Участников" value={t.participants} chip={t.participantLimit ? pill('из ' + t.participantLimit, 'neutral') : undefined} testId="kpi-players" />
              <Kpi label="Сыграно матчей" value={total ? done + ' / ' + total : '—'} chip={total ? pill(Math.round((done / total) * 100) + '%', 'green') : undefined} testId="kpi-done" />
              <Kpi label="Идут сейчас" value={live} chip={live ? pill('live') : undefined} testId="kpi-live" />
              <Kpi label="Столов" value={tables || '—'} chip={s ? pill(s.groups.length + ' групп', 'neutral') : undefined} testId="kpi-tables" />
            </div></div>
            {/* Карта и даты — рядом: правая колонка (параметры) по высоте вровень с ними. */}
            <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className={CARD + ' relative min-h-[340px] overflow-hidden bg-neutral-50 p-4 max-md:min-h-[240px]'}>
                <div className="absolute inset-4 bottom-16">
                  <KzDotMap region={t.region} city={t.city} onPick={(p) => void pickPlace(p)} />
                </div>
                <div className="absolute right-4 bottom-4 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[12px] shadow-sm" data-testid="overview-place">
                  <div className="text-neutral-500">Место проведения</div>
                  <div className="font-semibold">{placeLabel(t) || 'Выберите город на карте'}</div>
                  {t.venue && <div className="text-neutral-500">{t.venue}</div>}
                </div>
                {placeError && <p className="absolute top-3 left-4 m-0 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-red-700">{placeError}</p>}
              </div>
              <Dates t={t} onPick={(a, b) => void pickDates(a, b)} error={datesError} />
            </div>
          </div>
          <Params t={t} onEdit={() => setEditing(true)} />
        </div>

        {top.length > 0 && <TopPlayers players={top} allHref={allHref} />}
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
