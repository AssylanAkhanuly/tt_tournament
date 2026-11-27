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

import { Button, Chip, I18nProvider, Input, Label, Modal, NumberField, RangeCalendar, Spinner, Switch, TextArea, TextField } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { ChevronRight, MapPin, Trophy } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

import {
  FORMAT_LABEL,
  LEVEL_LABEL,
  SEX_LABEL,
  STATUS_LABEL,
  placeLabel,
  updateTournament,
  useApplicantKinds,
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
import { PlaceSelect, infoOf } from '@/features/tournament-info';
import { useNarrow } from '@/shared/kit/app';
import { ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';
import { usePageTabs } from '@/widgets/app-shell';
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
/** Силуэт сетки пунктиром: восемь, четыре, два слота к финалу — зеркально. */
function BracketEmpty() {
  const col = (n: number) => (
    <div className="flex flex-col justify-around gap-2">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="block h-6 w-24 rounded-md border border-dashed border-neutral-300 bg-neutral-50 max-md:w-14" />
      ))}
    </div>
  );
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 pt-10" data-testid="overview-bracket-empty">
      <div aria-hidden className="flex h-40 items-stretch gap-4 opacity-80 max-md:h-28 max-md:gap-2">
        {col(4)}
        {col(2)}
        <div className="flex flex-col items-center justify-center gap-2">
          <Trophy size={28} className="text-neutral-300" />
          <span className="block h-6 w-24 rounded-md border border-dashed border-neutral-300 bg-neutral-50 max-md:w-14" />
        </div>
        {col(2)}
        {col(4)}
      </div>
      <p className="m-0 text-[14px] font-medium text-neutral-500">Сетки пока нет</p>
    </div>
  );
}

function BracketPreview({ s, href }: { s: Schedule | null; href: string }) {
  const router = useRouter();
  const has = !!s && s.status !== 'none' && s.playoff.matches.length > 0;
  return (
    // Шапки над картинкой нет ✳ (24.11.2026, решение владельца продукта):
    // подпись и «Открыть сетку» стоят поверх сетки в углах. Сетки ещё нет —
    // пустое состояние: светлая карточка с силуэтом сетки пунктиром.
    <section
      className={
        'relative flex h-[360px] flex-col overflow-hidden rounded-2xl border max-md:h-[260px] ' +
        (has ? 'border-transparent bg-brand-950' : 'border-neutral-200 bg-white')
      }
      data-testid="overview-bracket"
      data-empty={!has || undefined}
    >
      {has ? <PlayoffMap playoff={s.playoff} still /> : <BracketEmpty />}
      <h2 className={'pointer-events-none absolute top-4 left-5 m-0 text-[15px] font-semibold ' + (has ? 'text-white/90' : 'text-neutral-900')}>Сетка плей-офф</h2>
      {has && (
        <Button size="sm" variant="secondary" className="absolute top-3 right-3 rounded-full bg-white/90" onPress={() => router.push(href)} data-testid="overview-bracket-open">
          Открыть сетку <ChevronRight size={14} />
        </Button>
      )}
    </section>
  );
}

// ── место: город с карты и адрес ─────────────────────────────────────────────

/** Карточка места поверх карты ✳ (23.11.2026, решение владельца продукта): город
    и адрес текстом, значок рядом открывает окно с адресом — город и область
    (`PlaceSelect`, справочник мест сервера) и адрес с залом; город можно
    выбрать и щелчком по карте. */
function PlaceCard({ t, onSave, readOnly = false }: { t: TournamentSummary; onSave: (place: { region: string; city: string; venue: string }) => Promise<boolean>; readOnly?: boolean }) {
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
      {!readOnly && <Button isIconOnly size="sm" variant="secondary" className="shrink-0 rounded-full" aria-label="Адрес" onPress={start} data-testid="overview-place-edit">
        <MapPin size={15} />
      </Button>}
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
function Dates({ t, onPick, error, readOnly = false }: { t: TournamentSummary; onPick: (startsOn: string, endsAt: string) => void; error: string | null; readOnly?: boolean }) {
  const start = t.startsAt ? dayKey(t.startsAt) : null;
  const value = start ? { start: parseDate(start), end: parseDate(t.endsAt ?? start) } : null;
  return (
    // Отдельной строки «Даты» над календарём нет ✳ (24.11.2026): шапка одна —
    // месяц и стрелки календаря; выбранные даты — строкой под сеткой.
    <section className={CARD + ' flex flex-col p-4'} data-testid="overview-dates">
      <I18nProvider locale="ru-RU">
        <RangeCalendar
          isReadOnly={readOnly}
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
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-100 px-1 pt-3 text-[13px]">
        <span className="text-neutral-500">Даты</span>
        <span className="font-medium" data-testid="overview-dates-label">
          {start ? ruDate(start) + (t.endsAt && t.endsAt !== start ? ' — ' + ruDate(t.endsAt) : '') : 'Не выбраны'}
        </span>
      </div>
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

type ParamsPage = 'tournament' | 'players';
const PARAM_PAGES: { id: ParamsPage; label: string }[] = [
  { id: 'tournament', label: 'Турнир' },
  { id: 'players', label: 'Участники и место' },
];

/** Параметры — правка только на месте ✳ (23.11.2026; с 24.11.2026 без
    «Изменить» и боковой формы — решение владельца продукта): все сведения
    турнира двумя страницами внутри карточки — «Турнир · Участники и место»
    (`params-page`). Правки — черновиком на все страницы сразу: «Отменить» и
    «Сохранить» появляются после изменения, уходят на сервер разом, правила
    проверяет он. Условия допуска (кто подаёт, предел, квота, пол, рейтинг)
    здесь только видны — правятся в «Настройках» раздела «Спортсмены». Даты —
    календарём рядом, город — и щелчком по карте. Карточка тянется на высоту
    левой колонки. */
function Params({ t, onSaved, readOnly = false }: { t: TournamentSummary; onSaved: () => void; readOnly?: boolean }) {
  const templates = useTemplates();
  const kinds = useApplicantKinds();
  const saved = useMemo(() => infoOf(t), [t]);
  const [draft, setDraft] = useState<TournamentInfo>(saved);
  const [base, setBase] = useState(saved);
  const [page, setPage] = useState<ParamsPage>('tournament');
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
      await updateTournament(t.id, { ...draft, name: draft.name.trim(), venue: draft.venue.trim() });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const text = (v: ReactNode, testId?: string) => (
    <span className="truncate text-right font-medium" data-testid={testId}>
      {v}
    </span>
  );
  const limit = (n: number | null) => (n === null ? 'Без ограничения' : String(n));
  const editRows: Record<'general' | 'format' | 'players' | 'place', [string, ReactNode][]> = {
    general: [
      ['Название', (
        <TextField key="name" aria-label="Название" value={draft.name} onChange={(v) => set('name', v)} className="w-full">
          <Input className="h-8 w-full rounded-xl text-[13px]" placeholder="—" data-testid="params-name" />
        </TextField>
      )],
      ['Описание', (
        <TextField key="desc" aria-label="Описание" value={draft.description} onChange={(v) => set('description', v)} className="w-full">
          <TextArea className="w-full rounded-xl text-[13px]" rows={3} placeholder="—" data-testid="params-description" />
        </TextField>
      )],
      ['Вид', (
        <Picker key="kind"
          label="Вид соревнования"
          value={draft.template || NO_KIND}
          options={[{ id: NO_KIND, label: 'Без вида' }, ...(templates.data ?? []).map((k) => ({ id: k.code, label: k.name }))]}
          onChange={(k) => set('template', k === NO_KIND ? '' : k)}
          isDisabled={t.admissionLocked}
          testId="params-kind"
        />
      )],
      ['Статус', <Chip key="status" size="sm" variant="soft" color={t.status === 'in_progress' ? 'success' : 'default'}>{STATUS_LABEL[t.status]}</Chip>],
      ['Уровень', (
        <Picker key="level"
          label="Уровень"
          value={draft.level}
          options={LEVELS.map((l) => ({ id: l, label: LEVEL_LABEL[l] }))}
          onChange={(k) => set('level', k as TournamentLevel)}
          testId="params-level"
        />
      )],
      ['Рейтинговый', (
        <Switch key="rating" isSelected={draft.isRating} onChange={(v) => set('isRating', v)} aria-label="Рейтинговый">
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      )],
    ],
    format: [
      ['Система', (
        <Picker key="format"
          label="Система"
          value={draft.format}
          options={(manual ? (['manual'] as TournamentFormat[]) : FORMATS).map((f) => ({ id: f, label: FORMAT_LABEL[f] }))}
          onChange={(k) => set('format', k as TournamentFormat)}
          isDisabled={manual}
          testId="params-format"
        />
      )],
      ...(draft.format === 'group_playoff'
        ? ([['Игроков в группе', <Stepper key="group" label="Игроков в группе" value={draft.groupSize} onChange={(v) => v !== null && set('groupSize', v)} min={2} max={16} testId="params-group-size" />]] as [string, ReactNode][])
        : []),
      ['Матч до побед', <Stepper key="games" label="Матч до побед" value={draft.gamesToWin} onChange={(v) => v !== null && set('gamesToWin', v)} min={2} max={5} testId="params-games" />],
      ['Участников', text(t.participants + (t.participantLimit ? ' из ' + t.participantLimit : ''), 'params-participants')],
    ],
    players: [
      ['Возраст от', <Stepper key="age-min" label="Возраст от" value={draft.ageMin} onChange={(v) => set('ageMin', v)} min={5} max={90} testId="params-age-min" />],
      ['Возраст до', <Stepper key="age-max" label="Возраст до" value={draft.ageMax} onChange={(v) => set('ageMax', v)} min={5} max={90} testId="params-age-max" />],
      ['Пол', text(SEX_LABEL[t.sex])],
      ['Рейтинг', text(t.ratingMin === null && t.ratingMax === null ? 'Без ценза' : (t.ratingMin ?? '—') + ' — ' + (t.ratingMax ?? '—'))],
      ['Заявку подают', text(t.applicantKinds.map((k) => kinds.data?.find((x) => x.key === k)?.label ?? k).join(', ') || '—', 'params-applicants')],
      ['Предел участников', text(limit(t.participantLimit))],
      ['Квота региона', text(limit(t.regionQuota))],
    ],
    place: [
      ['Город', <div key="city" className="w-full"><PlaceSelect region={draft.region} city={draft.city} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} /></div>],
      ['Адрес, зал', (
        <TextField key="venue" aria-label="Адрес, зал" value={draft.venue} onChange={(v) => set('venue', v)} className="w-full">
          <Input className="h-8 w-full rounded-xl text-[13px]" placeholder="Улица, дом, спорткомплекс" data-testid="params-venue" />
        </TextField>
      )],
      ['Начало', text(ruDate(draft.startsOn))],
      ['Окончание', text(ruDate(draft.endsAt ?? draft.startsOn))],
    ],
  };
  // Только видно (бригада турнира) ✳ (24.11.2026, решение владельца продукта:
  // «только просмотр — никаких полей»): значения текстом, без полей и кнопок.
  const kindName = t.kind?.name ?? 'Без вида';
  const viewRows: typeof editRows = {
    general: [
      ['Название', text(t.name, 'params-name')],
      ['Описание', text(t.description || '—')],
      ['Вид', text(kindName)],
      editRows.general.find(([k]) => k === 'Статус')!,
      ['Уровень', text(LEVEL_LABEL[t.level] ?? t.level)],
      ['Рейтинговый', text(t.isRating ? 'Да' : 'Нет')],
    ],
    format: [
      ['Система', text(FORMAT_LABEL[t.format] ?? t.format)],
      ...(t.format === 'group_playoff' ? ([['Игроков в группе', text(t.groupSize)]] as [string, ReactNode][]) : []),
      ['Матч до побед', text(t.gamesToWin, 'params-games')],
      ...editRows.format.filter(([k]) => k === 'Участников'),
    ],
    players: [
      ['Возраст от', text(t.ageMin ?? '—')],
      ['Возраст до', text(t.ageMax ?? '—')],
      ...editRows.players.filter(([k]) => !k.startsWith('Возраст')),
    ],
    place: [
      ['Город', text(placeLabel(t) || '—')],
      ['Адрес, зал', text(t.venue || '—')],
      ['Начало', text(ruDate(draft.startsOn))],
      ['Окончание', text(ruDate(draft.endsAt ?? draft.startsOn))],
    ],
  };
  const rows = readOnly ? viewRows : editRows;
  return (
    <section className={CARD + ' flex h-full min-h-0 flex-col p-4'} data-testid="overview-params">
      {/* Страницы — точками в углу ✳ (24.11.2026, решение владельца продукта):
          выбранная — вытянутой чёрточкой, название страницы — в подсказке и aria-label. */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold">Параметры</h2>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Страницы параметров">
          {PARAM_PAGES.map((pg) => (
            <button
              key={pg.id}
              type="button"
              role="tab"
              aria-selected={page === pg.id}
              aria-label={pg.label}
              title={pg.label}
              onClick={() => setPage(pg.id)}
              className="grid h-6 place-items-center px-0.5"
              data-testid="params-page"
              data-page={pg.id}
            >
              <span className={'block h-2 rounded-full transition-all ' + (page === pg.id ? 'w-5 bg-brand-600' : 'w-2 bg-neutral-300 hover:bg-neutral-400')} />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto" role="tabpanel" data-testid="params-fields">
        {(page === 'tournament' ? [...rows.general, ...rows.format] : [...rows.players, ...rows.place]).map(([k, v]) => (
          <div key={k} className="flex min-h-11 items-center justify-between gap-3 border-b border-neutral-100 py-1.5 text-[13px] last:border-b-0">
            <span className="shrink-0 text-neutral-500">{k}</span>
            <span className="flex min-w-0 max-w-[64%] flex-1 justify-end">{v}</span>
          </div>
        ))}
      </div>
      {error && (
        <p className="m-0 mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      )}
      {dirty && !readOnly && (
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
function TopPlayers({ players, allHref, swipe = false }: { players: RatingCardData[]; allHref: string; swipe?: boolean }) {
  const router = useRouter();
  return (
    <section className="flex flex-col gap-3" data-testid="overview-players">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[17px] font-semibold">Лучшие по рейтингу</h2>
        <Button size="sm" variant="secondary" className="rounded-full" onPress={() => router.push(allHref)} data-testid="overview-players-all">
          Все спортсмены <ChevronRight size={14} />
        </Button>
      </div>
      {swipe ? (
        // Телефон — каруселью Swiper ✳ (24.11.2026, решение владельца продукта):
        // карточка на ширину экрана, край следующей виден; точки — под лентой.
        <div
          className="-mx-4 [--swiper-pagination-bullet-inactive-color:var(--color-neutral-400)] [--swiper-theme-color:var(--color-brand-600)] [&_.swiper-pagination]:static [&_.swiper-pagination]:mt-3"
          data-testid="overview-players-swiper"
        >
          <Swiper modules={[Pagination]} slidesPerView={1.12} spaceBetween={12} slidesOffsetBefore={16} slidesOffsetAfter={16} pagination={{ clickable: true }}>
            {players.map((p, i) => (
              <SwiperSlide key={p.userId}>
                <RatingPlayerCard r={p} place={i + 1} onOpen={() => router.push('/rating/' + p.userId)} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {players.map((p, i) => (
            <RatingPlayerCard key={p.userId} r={p} place={i + 1} onOpen={() => router.push('/rating/' + p.userId)} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── телефон: раскладка по образцу «Football reservation» ─────────────────────

const WEEKDAY = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

/** Полоса дней: дни турнира выделены, по краям — по дню до и после. Щелчок — выбор дат. */
function DayStrip({ t, onOpen }: { t: TournamentSummary; onOpen: () => void }) {
  const start = t.startsAt ? dayKey(t.startsAt) : null;
  const end = t.endsAt ?? start;
  const days = useMemo(() => {
    if (!start || !end) return [];
    const from = new Date(start + 'T12:00');
    from.setDate(from.getDate() - 1);
    const to = new Date(end + 'T12:00');
    to.setDate(to.getDate() + 1);
    const out: Date[] = [];
    for (const d = new Date(from); d <= to && out.length < 14; d.setDate(d.getDate() + 1)) out.push(new Date(d));
    while (out.length < 5) out.push(new Date(out[out.length - 1].getTime() + 864e5));
    return out;
  }, [start, end]);
  if (!start) {
    return (
      <Button variant="secondary" className="h-12 w-full rounded-2xl" onPress={onOpen} data-testid="phone-days-pick">
        Выбрать даты
      </Button>
    );
  }
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" data-testid="phone-days">
      {days.map((d) => {
        const k = dayKey(d);
        const on = k >= start && k <= (end ?? start);
        return (
          <button
            key={k}
            type="button"
            onClick={onOpen}
            className={'flex h-[62px] w-[52px] shrink-0 flex-col items-center justify-center rounded-2xl ' + (on ? 'bg-brand-200 text-brand-950' : 'bg-neutral-100 text-neutral-700')}
            data-testid="phone-day"
            data-on={on}
          >
            <span className="text-[20px] leading-none font-semibold tabular-nums">{d.getDate()}</span>
            <span className="mt-1 text-[11px] font-medium uppercase">{WEEKDAY[d.getDay()]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Шапка телефона ✳ (24.11.2026, решение владельца продукта): картинка — сетка
    плей-офф плакатом (щелчок — «Расписание» на виде «Сетка»; сетки нет — стол
    сверху), поверх — уровень, название и город; внизу вместо чипов — вкладки
    разделов турнира (`phone-tab`), полосы вкладок над экраном нет. При
    прокрутке шапка стоит (`sticky`), а белый лист наезжает на неё; шапка
    по мере этого темнеет и чуть приближается — доля прокрутки `--hero-p`
    ставится на прокручиваемой области. */
function PhoneHero({ t, s, bracketHref }: { t: TournamentSummary; s: Schedule | null; bracketHref: string }) {
  const router = useRouter();
  const { tabs, open } = usePageTabs(true);
  const bracket = !!s && s.status !== 'none' && s.playoff.matches.length > 0;
  return (
    <div className="sticky top-0 z-0 h-[420px] overflow-hidden bg-brand-950" data-testid="phone-hero">
      <div className="absolute inset-0 origin-top [transform:scale(calc(1+var(--hero-p,0)*0.08))]">
        {bracket ? (
          <button
            type="button"
            aria-label="Открыть сетку"
            onClick={() => router.push(bracketHref)}
            className="absolute inset-x-0 top-0 flex h-[250px] flex-col"
            data-testid="phone-hero-bracket"
          >
            <div className="pointer-events-none flex min-h-0 w-full flex-1 flex-col">
              <PlayoffMap playoff={s.playoff} still />
            </div>
          </button>
        ) : (
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-brand-500),var(--color-brand-700)_60%,var(--color-brand-900))]">
            <div className="absolute inset-x-6 top-6 bottom-24 border-2 border-white/70" />
            <div className="absolute top-6 bottom-24 left-1/2 w-px -translate-x-1/2 bg-white/50" />
            <div className="absolute inset-x-2 top-[30%] h-1.5 bg-white/85" />
          </div>
        )}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--color-brand-950)_70%)]" />
      {/* Лист наезжает — шапка темнеет. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-brand-950 [opacity:calc(var(--hero-p,0)*0.7)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[96px] flex flex-col items-center px-6 text-center text-white">
        <span className="text-[11px] font-semibold tracking-[0.25em] uppercase opacity-85">{LEVEL_LABEL[t.level] ?? t.level}</span>
        <h1 className="m-0 mt-1.5 line-clamp-2 font-[family-name:var(--font-poster)] text-[30px] leading-[1.02] font-bold uppercase" data-testid="phone-title">
          {t.name}
        </h1>
        {t.city && <span className="mt-1.5 text-[12px] font-semibold tracking-[0.2em] uppercase opacity-85">{t.city}</span>}
      </div>
      {tabs.length > 0 && (
        <nav className="absolute inset-x-0 bottom-11 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]" aria-label="Вкладки страницы">
          {tabs.map((tab) => (
            <button
              key={tab.href}
              type="button"
              aria-current={tab.active || undefined}
              onClick={() => open(tab.href)}
              className={
                'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ' +
                (tab.active ? 'bg-brand-200 text-brand-950' : 'bg-white/15 text-white backdrop-blur-sm')
              }
              data-testid="phone-tab"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function PhoneTile({ label, value, testId }: { label: string; value: ReactNode; testId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-100 px-2 py-3" data-testid={testId}>
      <span className="font-[family-name:var(--font-poster)] text-[22px] leading-none font-bold tabular-nums">{value}</span>
      <span className="mt-1 text-[11px] text-neutral-500">{label}</span>
    </div>
  );
}

/** Обзор на телефоне ✳ (23.11.2026, решение владельца продукта; образец — экран
    бронирования поля «Football reservation» с Pinterest): шапка-сетка с уровнем,
    названием, городом и вкладками разделов, белый лист внахлёст —
    полоса дней турнира (щелчок — выбор дат), ход турнира плитками и тёмная
    кнопка «Открыть сетку»; ниже — место на карте, параметры, лучшие по рейтингу. */
function PhoneOverview({ t, s, kpis, base, map, params, players, dates }: {
  t: TournamentSummary;
  s: Schedule | null;
  kpis: { players: ReactNode; done: ReactNode; live: ReactNode; tables: ReactNode };
  base: string;
  map: ReactNode;
  params: ReactNode;
  players: ReactNode;
  dates: ReactNode;
}) {
  const router = useRouter();
  const [datesOpen, setDatesOpen] = useState(false);
  return (
    <>
      <PhoneHero t={t} s={s} bracketHref={base + '/schedule?view=bracket'} />
      <div className="relative z-10 -mt-8 flex flex-col gap-5 rounded-t-[28px] bg-white px-4 pt-5 pb-28" data-testid="phone-sheet">
        <div className="flex flex-col gap-2">
          <span className="text-center text-[12px] text-neutral-500">Дни турнира</span>
          <DayStrip t={t} onOpen={() => setDatesOpen(true)} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <PhoneTile label="участн." value={kpis.players} testId="kpi-players" />
          <PhoneTile label="сыграно" value={kpis.done} testId="kpi-done" />
          <PhoneTile label="идут" value={kpis.live} testId="kpi-live" />
          <PhoneTile label="столов" value={kpis.tables} testId="kpi-tables" />
        </div>
        <Button className="h-12 w-full rounded-full bg-neutral-950 text-[14px] font-semibold text-white" onPress={() => router.push(base + '/schedule?view=bracket')} data-testid="overview-bracket-open">
          Открыть сетку
        </Button>
        {map}
        {params}
        {players}
      </div>
      <ModalSheet isOpen={datesOpen} onOpenChange={setDatesOpen} size="sm" testId="phone-dates">
        <Modal.Body className="p-0">{dates}</Modal.Body>
      </ModalSheet>
    </>
  );
}

// ── экран ────────────────────────────────────────────────────────────────────

/** `readOnly` ✳ (24.11.2026) — тот же обзор бригаде турнира (главный секретарь,
    заместитель): поля и календарь только видны, место с карты не выбирается —
    сведения правят главный судья, председатель ГСК и администратор. */
export function TournamentDashboard({ id, readOnly = false }: { id: string; readOnly?: boolean }) {
  const narrow = useNarrow();
  const tournament = useTournament(id);
  const participants = useParticipants(id);
  const schedule = useSchedule(id);
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

  const mapCard = (
    // `isolate`: слои Leaflet (z-index 400+) остаются внутри карточки и не перекрывают окна страницы.
    <div className={CARD + ' relative isolate min-h-[300px] overflow-hidden bg-brand-50 max-md:min-h-[260px]'}>
      <div className="absolute inset-0 z-0">
        <KzMap region={t.region} city={t.city} onPick={readOnly ? () => {} : (p) => void pickPlace(p)} />
      </div>
      <PlaceCard t={t} onSave={pickPlace} readOnly={readOnly} />
      {placeError && <p className="absolute top-3 left-4 z-10 m-0 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] text-red-700">{placeError}</p>}
    </div>
  );
  const dates = <Dates t={t} onPick={(a, b) => void pickDates(a, b)} error={datesError} readOnly={readOnly} />;
  const params = <Params t={t} onSaved={() => tournament.reload()} readOnly={readOnly} />;
  const players = top.length > 0 && <TopPlayers players={top} allHref={base + '/players'} swipe={narrow} />;

  return (
    <div
      className={'h-full overflow-y-auto ' + (narrow ? 'bg-white' : 'bg-neutral-50')}
      // Доля прокрутки для шапки телефона: лист наезжает, шапка темнеет.
      onScroll={narrow ? (e) => e.currentTarget.style.setProperty('--hero-p', String(Math.min(1, e.currentTarget.scrollTop / 320))) : undefined}
      data-testid="tournament-overview"
    >
      {narrow ? (
        <PhoneOverview
          t={t}
          s={s}
          base={base}
          kpis={{ players: t.participants, done: total ? done + '/' + total : '—', live, tables: tables || '—' }}
          map={mapCard}
          params={params}
          players={players}
          dates={dates}
        />
      ) : (
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
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <BracketPreview s={s} href={base + '/schedule?view=bracket'} />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              {mapCard}
              {dates}
            </div>
          </div>
          {params}
        </div>

        {players}
      </div>
      )}

    </div>
  );
}
