'use client';

/* «Сведения» турнира — обзор ✳ (23.11.2026, решения владельца продукта; образец
   — экран «Route Optimization» Truck&Co). Сверху — показатели турнира. Слева —
   сетка плей-офф неподвижной картинкой с переходом «Открыть сетку», под ней
   карта Казахстана точками (место выбирают щелчком по городу, сохраняется
   сразу) и даты календарём-диапазоном (тоже сразу); справа — параметры
   строками, «Изменить» открывает прежнюю форму сведений в широкой панели — с
   проектом протокола и выгрузкой в PDF. Ниже во всю ширину — пять лучших
   участников по рейтингу карточками рейтинг-листа и «Все спортсмены». Ленты
   расписания здесь нет (снята) — оно в разделе «Расписание». Данные —
   сведения, состав и снимок расписания; считает сервер. */

import { Button, Chip, Drawer, I18nProvider, Input, Label, Modal, NumberField, RangeCalendar, Spinner, Switch, TextField } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { ChevronRight, MapPin, Pencil } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

import {
  FORMAT_LABEL,
  LEVEL_LABEL,
  STATUS_LABEL,
  placeLabel,
  updateTournament,
  useParticipants,
  useSchedule,
  useTemplates,
  useTournament,
  type Schedule,
  type TournamentFormat,
  type TournamentInfo,
  type TournamentLevel,
  type TournamentSummary,
} from '@/entities/tournament';
import { PlaceSelect, TournamentInfoForm, infoOf } from '@/features/tournament-info';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';
import { SideContent, SideDialog } from '@/shared/ui/SidePanel';
import { PlayoffMap } from '@/widgets/bracket/PlayoffMap';
import { RatingPlayerCard, type RatingCardData } from '@/widgets/rating';

import { KzMap } from './KzMap';

const CARD = 'rounded-2xl border border-neutral-200 bg-white';
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
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

// ── сетка плей-офф: только картинка ─────────────────────────────────────────

/** Сетка плей-офф — неподвижной картинкой ✳ (23.11.2026, решение владельца
    продукта: «не исследуемая, только переход к сетке»): «Открыть сетку» ведёт
    в «Расписание» на вид «Сетка», где её можно двигать и приближать. */
function BracketPreview({ s, href }: { s: Schedule | null; href: string }) {
  const router = useRouter();
  return (
    <section className={CARD + ' flex flex-col overflow-hidden'} data-testid="overview-bracket">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="m-0 text-[17px] font-semibold">Сетка плей-офф</h2>
        <Button size="sm" variant="secondary" className="rounded-full" onPress={() => router.push(href)} data-testid="overview-bracket-open">
          Открыть сетку <ChevronRight size={14} />
        </Button>
      </div>
      <div className="flex h-[300px] flex-col border-t border-neutral-100 max-md:h-[220px]">
        {s && s.status !== 'none' && s.playoff.matches.length ? (
          <PlayoffMap playoff={s.playoff} still />
        ) : (
          <p className="m-0 px-5 py-8 text-[14px] text-neutral-500">Сетки пока нет</p>
        )}
      </div>
    </section>
  );
}

// ── место: город с карты и адрес ─────────────────────────────────────────────

/** Карточка места поверх карты ✳ (23.11.2026, решение владельца продукта): город
    и адрес текстом, значок рядом открывает окно с адресом — город и область
    (`PlaceSelect`, справочник мест сервера) и адрес с залом; город можно
    выбрать и щелчком по карте. */
function PlaceCard({ t, onSave }: { t: TournamentSummary; onSave: (place: { region: string; city: string; venue: string }) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ region: t.region, city: t.city, venue: t.venue });
  const [busy, setBusy] = useState(false);
  const start = () => {
    setPlace({ region: t.region, city: t.city, venue: t.venue });
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await onSave({ ...place, venue: place.venue.trim() });
    setBusy(false);
    if (ok) setOpen(false);
  };
  return (
    <div className="absolute right-4 bottom-4 z-10 flex max-w-[calc(100%-32px)] items-start gap-3 rounded-xl border border-neutral-200 bg-white py-2 pr-2 pl-3 text-[12px] shadow-md" data-testid="overview-place">
      <div className="min-w-0">
        <div className="text-neutral-500">Место проведения</div>
        <div className="truncate font-semibold" data-testid="overview-place-city">{placeLabel(t) || 'Выберите город на карте'}</div>
        {t.venue && <div className="truncate text-neutral-600" data-testid="overview-place-venue">{t.venue}</div>}
      </div>
      <Button isIconOnly size="sm" variant="secondary" className="shrink-0 rounded-full" aria-label="Адрес" onPress={start} data-testid="overview-place-edit">
        <MapPin size={15} />
      </Button>
      <ModalSheet isOpen={open} onOpenChange={setOpen} size="sm" testId="place-dialog">
        <Modal.CloseTrigger aria-label="Закрыть" />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Место проведения</Modal.Heading>
        </Modal.Header>
        <form onSubmit={(e) => void submit(e)}>
          <Modal.Body className="flex flex-col gap-4">
            <PlaceSelect region={place.region} city={place.city} onChange={(p) => setPlace((x) => ({ ...x, ...p }))} />
            <TextField value={place.venue} onChange={(v) => setPlace((x) => ({ ...x, venue: v }))}>
              <Label>Адрес, зал</Label>
              <Input className="rounded-xl" placeholder="Улица, дом, спорткомплекс" data-testid="place-venue" />
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" className="rounded-xl" onPress={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" className="rounded-xl" isPending={busy} data-testid="place-save">
              Сохранить
            </Button>
          </Modal.Footer>
        </form>
      </ModalSheet>
    </div>
  );
}

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

const NO_KIND = 'none';
const LEVELS = Object.keys(LEVEL_LABEL) as TournamentLevel[];
const FORMATS: TournamentFormat[] = ['single_elimination', 'group_playoff'];

/** Число с «−» / «+» по краям — один вид на все числовые параметры. */
function Stepper({ label, value, onChange, min, max, testId }: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  testId: string;
}) {
  return (
    <NumberField aria-label={label} value={value ?? Number.NaN} onChange={(v) => onChange(Number.isNaN(v) ? null : v)} minValue={min} maxValue={max} className="w-32">
      <NumberField.Group className="h-8 rounded-xl">
        <NumberField.DecrementButton aria-label={'Уменьшить: ' + label} />
        <NumberField.Input className="text-center text-[13px]" placeholder="—" data-testid={testId} />
        <NumberField.IncrementButton aria-label={'Увеличить: ' + label} />
      </NumberField.Group>
    </NumberField>
  );
}

/** Параметры полями прямо на обзоре ✳ (23.11.2026, решение владельца продукта):
    правки — черновиком, «Отменить» и «Сохранить» появляются только после
    изменения; уходят на сервер разом, правила проверяет он. «Изменить» —
    прежняя полная форма с протоколом. */
function Params({ t, onEdit, onSaved }: { t: TournamentSummary; onEdit: () => void; onSaved: () => void }) {
  const templates = useTemplates();
  const saved = useMemo(() => infoOf(t), [t]);
  const [draft, setDraft] = useState<TournamentInfo>(saved);
  const [base, setBase] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Пришли свежие сведения с сервера — черновик начинается с них (без эффекта).
  if (base !== saved) {
    setBase(saved);
    setDraft(saved);
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof TournamentInfo>(k: K, v: TournamentInfo[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const manual = t.format === 'manual';
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateTournament(t.id, draft);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const field = (k: 'name', label: string, testId: string) => (
    <TextField aria-label={label} value={draft[k]} onChange={(v) => set(k, v)} className="w-full">
      <Input className="h-8 w-full rounded-xl text-[13px]" placeholder="—" data-testid={testId} />
    </TextField>
  );
  const rows: [string, ReactNode][] = [
    ['Название', field('name', 'Название', 'params-name')],
    ['Вид', (
      <Picker key="2399112"
        label="Вид соревнования"
        value={draft.template || NO_KIND}
        options={[{ id: NO_KIND, label: 'Без вида' }, ...(templates.data ?? []).map((k) => ({ id: k.code, label: k.name }))]}
        onChange={(k) => set('template', k === NO_KIND ? '' : k)}
        isDisabled={t.admissionLocked}
        testId="params-kind"
      />
    )],
    ['Статус', <Chip key="Статус" size="sm" variant="soft" color={t.status === 'in_progress' ? 'success' : 'default'}>{STATUS_LABEL[t.status]}</Chip>],
    ['Система', (
      <Picker key="2399700"
        label="Система"
        value={draft.format}
        options={(manual ? (['manual'] as TournamentFormat[]) : FORMATS).map((f) => ({ id: f, label: FORMAT_LABEL[f] }))}
        onChange={(k) => set('format', k as TournamentFormat)}
        isDisabled={manual}
        testId="params-format"
      />
    )],
    ...(draft.format === 'group_playoff'
      ? ([['Игроков в группе', <Stepper key="Игроков в группе" label="Игроков в группе" value={draft.groupSize} onChange={(v) => v !== null && set('groupSize', v)} min={2} max={16} testId="params-group-size" />]] as [string, ReactNode][])
      : []),
    ['Матч до побед', <Stepper key="Матч до побед" label="Матч до побед" value={draft.gamesToWin} onChange={(v) => v !== null && set('gamesToWin', v)} min={2} max={5} testId="params-games" />],
    ['Уровень', (
      <Picker key="23991533"
        label="Уровень"
        value={draft.level}
        options={LEVELS.map((l) => ({ id: l, label: LEVEL_LABEL[l] }))}
        onChange={(k) => set('level', k as TournamentLevel)}
        testId="params-level"
      />
    )],
    ['Возраст от', <Stepper key="Возраст от" label="Возраст от" value={draft.ageMin} onChange={(v) => set('ageMin', v)} min={5} max={90} testId="params-age-min" />],
    ['Возраст до', <Stepper key="Возраст до" label="Возраст до" value={draft.ageMax} onChange={(v) => set('ageMax', v)} min={5} max={90} testId="params-age-max" />],
    ['Рейтинговый', (
      <Switch key="23992133" isSelected={draft.isRating} onChange={(v) => set('isRating', v)} aria-label="Рейтинговый">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    )],
  ];
  return (
    <section className={CARD + ' flex min-h-0 flex-col p-4'} data-testid="overview-params">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold">Параметры</h2>
        <Button size="sm" variant="secondary" className="rounded-full" onPress={onEdit} data-testid="info-edit">
          <Pencil size={14} /> Изменить
        </Button>
      </div>
      <div className="mt-3 flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="flex min-h-11 items-center justify-between gap-3 border-b border-neutral-100 py-1.5 text-[13px] last:border-b-0">
            <span className="shrink-0 text-neutral-500">{k}</span>
            <span className="flex min-w-0 max-w-[62%] flex-1 justify-end">{v}</span>
          </div>
        ))}
      </div>
      {error && (
        <p className="m-0 mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      )}
      {dirty && (
        <div className="mt-3 flex justify-end gap-2" data-testid="params-actions">
          <Button size="sm" variant="secondary" className="rounded-xl" onPress={() => setDraft(saved)} isDisabled={busy} data-testid="params-cancel">
            Отменить
          </Button>
          <Button size="sm" className="rounded-xl" onPress={() => void save()} isPending={busy} data-testid="params-save">
            Сохранить
          </Button>
        </div>
      )}
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
  const base = usePathname().replace(/\/info$/, '');

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
  const pickPlace = async (place: { region: string; city: string; venue?: string }) => {
    setPlaceError(null);
    try {
      await updateTournament(t.id, { ...infoOf(t), ...place });
      tournament.reload();
      return true;
    } catch (e) {
      setPlaceError((e as Error).message);
      return false;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-neutral-50" data-testid="tournament-overview">
      <div className="flex flex-col gap-5 p-6 max-md:p-4">
        {/* Показатели — во всю ширину; ниже карта широко, справа стопкой даты и параметры ✳ (23.11.2026). */}
        <div className="@container">
          <div className="grid grid-cols-2 gap-4 @[640px]:grid-cols-4 @[640px]:gap-0 @[640px]:divide-x @[640px]:divide-neutral-200">
            <Kpi label="Участников" value={t.participants} chip={t.participantLimit ? pill('из ' + t.participantLimit, 'neutral') : undefined} testId="kpi-players" />
            <Kpi label="Сыграно матчей" value={total ? done + ' / ' + total : '—'} chip={total ? pill(Math.round((done / total) * 100) + '%', 'green') : undefined} testId="kpi-done" />
            <Kpi label="Идут сейчас" value={live} chip={live ? pill('live') : undefined} testId="kpi-live" />
            <Kpi label="Столов" value={tables || '—'} chip={s ? pill(s.groups.length + ' групп', 'neutral') : undefined} testId="kpi-tables" />
          </div>
        </div>
        {/* Слева: сетка, под ней карта и даты; справа — параметры. Участники и
            расписание — во всю ширину ✳ (23.11.2026). */}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <BracketPreview s={s} href={base + '/schedule?view=bracket'} />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* `isolate`: слои Leaflet (z-index 400+) остаются внутри карточки и не перекрывают окна страницы. */}
              <div className={CARD + ' relative isolate min-h-[300px] overflow-hidden bg-brand-50 max-md:min-h-[220px]'}>
                <div className="absolute inset-0 z-0">
                  <KzMap region={t.region} city={t.city} onPick={(p) => void pickPlace(p)} />
                </div>
                <PlaceCard t={t} onSave={pickPlace} />
                {placeError && <p className="absolute top-3 left-4 z-10 m-0 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-red-700">{placeError}</p>}
              </div>
              <Dates t={t} onPick={(a, b) => void pickDates(a, b)} error={datesError} />
            </div>
          </div>
          <Params t={t} onEdit={() => setEditing(true)} onSaved={() => tournament.reload()} />
        </div>

        {top.length > 0 && <TopPlayers players={top} allHref={base + '/players'} />}
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
