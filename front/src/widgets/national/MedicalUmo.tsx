'use client';

/* УМО в медкарте ✳ (22.11.2026, NATIONAL.md «Медкарта: УМО»; шаблон врача
   «Динамика спортсмена: УМО»). Ведёт врач; штаб (главный тренер,
   консультант) только смотрит — `canEdit` с сервера, кнопок правки у него нет. Вкладки — «Сводка» и девять
   блоков; что считать, решает сервер (`national/umo.py`): расчётные
   параметры, «последнее», Δ к базе (%) и к предыдущему, статус по референсу.

   - **Сводка** — условия осмотров столбцами (дата, этап, нагрузка, болезни,
     условия забора, добавки, примечания) и плановая дата следующего (+3
     месяца); ниже карточки блоков: сколько параметров с данными, сколько ниже
     и выше нормы, «на что влияет → что делаем»; карточка открывает блок.
     «Новый осмотр» и правка осмотра — окно по щелчку на дате.
   - **Блок** — таблица: параметр (★ — ключевой минимум; значок «i» —
     «что отражает» и «сигнал внимания»), единицы, референс, значения по
     осмотрам (вне референса — персиковой подложкой, как в шаблоне),
     последнее, Δ, статус. «Внести значения» — столбец выбранного осмотра
     становится полями ввода; расчётные не вводятся.

   Вид ✳ (22.11.2026, решения владельца продукта): без обёртки с полями —
   полосы и таблицы от края до края; таблицы — как остальные таблицы
   приложения (шапка-подложка, черта между строками, поле 24 px у краёв), но
   полупрозрачные «жидким стеклом» — сквозь них видны серая подложка и
   огромный значок медкарты за всем (`Backdrop` в `MedicalCardView`).
   Карточки блоков в сводке — белые; полосы над таблицей блока нет
   (решение владельца продукта 22.11.2026). */

import { AlertDialog, Button, Chip, Input, Label, Modal, Spinner, TextArea, TextField, Tooltip, useOverlayState } from '@heroui/react';
import { Info, Pencil, Plus, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  addUmoExam,
  deleteUmoExam,
  dmy,
  fetchUmo,
  updateUmoExam,
  useLoad,
  type Umo,
  type UmoBlock,
  type UmoContext,
  type UmoExam,
  type UmoStatus,
  type UmoValue,
} from '@/entities/national';
import { AlertSheet, ModalSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

const fmt = (v: UmoValue) => (typeof v === 'number' ? v.toLocaleString('ru-RU', { maximumFractionDigits: 3 }) : (v ?? ''));
const shortDate = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(2, 4);
const signed = (v: number, digits = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('ru-RU', { maximumFractionDigits: digits });

/* Цвета состояния — классы целиком. */
const OUT = 'bg-[color-mix(in_srgb,var(--color-qtt-peach)_28%,white)]';
const STATUS: Record<'low' | 'high' | 'ok', { text: string; color: 'warning' | 'danger' | 'success' }> = {
  low: { text: 'Ниже нормы', color: 'warning' },
  high: { text: 'Выше нормы', color: 'danger' },
  ok: { text: 'В норме', color: 'success' },
};

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): UmoContext => ({ date: today(), heightCm: '', stage: '', loadNote: '', illnesses: '', conditions: '', supplements: '', note: '' });
const fromExam = (e: UmoExam): UmoContext => ({
  date: e.date,
  heightCm: e.heightCm ? String(e.heightCm) : '',
  stage: e.stage,
  loadNote: e.loadNote,
  illnesses: e.illnesses,
  conditions: e.conditions,
  supplements: e.supplements,
  note: e.note,
});

const CONTEXT: { key: keyof UmoContext; label: string; area?: boolean }[] = [
  { key: 'stage', label: 'Этап подготовки' },
  { key: 'loadNote', label: 'Нагрузка за предшествующие 2 недели', area: true },
  { key: 'illnesses', label: 'Болезни и травмы за период', area: true },
  { key: 'conditions', label: 'Условия забора (время, натощак, последняя тренировка, фаза цикла)', area: true },
  { key: 'supplements', label: 'Добавки и препараты', area: true },
  { key: 'note', label: 'Врач, примечания', area: true },
];

/** Окно осмотра: новый или правка (с удалением). */
function ExamDialog({ memberId, exam, onSaved, trigger }: { memberId: string; exam?: UmoExam; onSaved: (u: Umo) => void; trigger: ReactNode }) {
  const state = useOverlayState();
  const [form, setForm] = useState<UmoContext>(exam ? fromExam(exam) : blank());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<UmoContext>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      onSaved(exam ? await updateUmoExam(exam.id, form) : await addUmoExam(memberId, form));
      state.close();
      if (!exam) setForm(blank());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal state={state}>
      {trigger}
      <ModalSheet size="lg" testId="umo-exam">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">{exam ? 'Осмотр ' + dmy(exam.date) : 'Новый осмотр'}</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField isRequired value={form.date} onChange={(v) => set({ date: v })}>
              <Label>Дата осмотра</Label>
              <Input type="date" className="rounded-xl" data-testid="umo-date" />
            </TextField>
            <TextField value={form.heightCm} onChange={(v) => set({ heightCm: v })}>
              <Label>Рост, см</Label>
              <Input inputMode="decimal" className="rounded-xl" data-testid="umo-height" />
            </TextField>
          </div>
          {CONTEXT.map((c) => (
            <TextField key={c.key} value={form[c.key]} onChange={(v) => set({ [c.key]: v })}>
              <Label>{c.label}</Label>
              {c.area ? <TextArea rows={2} className="rounded-xl" data-testid={'umo-' + c.key} /> : <Input className="rounded-xl" data-testid={'umo-' + c.key} />}
            </TextField>
          ))}
          {error && <p className="m-0 text-[13px] text-red-600" data-testid="umo-error">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          {exam && <DeleteExam exam={exam} onDeleted={(u) => (state.close(), onSaved(u))} />}
          <Button variant="tertiary" className="ml-auto rounded-xl" onPress={state.close}>
            Отмена
          </Button>
          <Button variant="primary" className="rounded-xl" isDisabled={busy || !form.date} onPress={() => void save()} data-testid="umo-exam-save">
            {exam ? 'Сохранить' : 'Добавить'}
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </Modal>
  );
}

function DeleteExam({ exam, onDeleted }: { exam: UmoExam; onDeleted: (u: Umo) => void }) {
  return (
    <AlertDialog>
      <Button variant="ghost" className="rounded-xl text-red-600" data-testid="umo-exam-delete">
        Удалить осмотр
      </Button>
      <AlertSheet className="rounded-xl">
        <AlertDialog.Header>
          <AlertDialog.Icon status="danger" />
          <AlertDialog.Heading>Удалить осмотр {dmy(exam.date)}?</AlertDialog.Heading>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <Button slot="close" variant="tertiary" className="rounded-xl">
            Отмена
          </Button>
          <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void deleteUmoExam(exam.id).then(onDeleted)}>
            Удалить
          </Button>
        </AlertDialog.Footer>
      </AlertSheet>
    </AlertDialog>
  );
}

/* Клетки — как у таблиц приложения (HeroUI Table: шапка на подложке, мелкий
   приглушённый текст, черта между строками, у краёв поле 24 px), но стеклом. */
const th =
  'border-b border-[color-mix(in_oklab,var(--separator)_50%,transparent)] bg-[color-mix(in_srgb,var(--surface-secondary)_65%,transparent)] px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap text-[var(--muted)] first:pl-6 last:pr-6';
const td = 'border-b border-[color-mix(in_oklab,var(--separator)_50%,transparent)] px-4 py-2.5 text-[13px] align-top first:pl-6 last:pr-6';
/* Стекло: полупрозрачный белый с размытием — сквозь видно подложку и значок. */
const GLASS = 'overflow-x-auto border-b border-white/60 bg-white/45 backdrop-blur-md';
const STICKY = 'sticky left-0 bg-white/70 backdrop-blur-md';

function Summary({ umo, memberId, onSaved, onOpen }: { umo: Umo; memberId: string; onSaved: (u: Umo) => void; onOpen: (code: string) => void }) {
  const newExam = (
    <Button variant="primary" size="sm" className="rounded-xl" data-testid="umo-new">
      <Plus size={16} /> Новый осмотр
    </Button>
  );
  return (
    <div className="flex min-h-full flex-col [&>*]:shrink-0" data-testid="umo-summary">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color-mix(in_oklab,var(--separator)_50%,transparent)] px-6 py-3">
        <h3 className="m-0 text-[15px] font-semibold">Осмотры</h3>
        {umo.canEdit && <ExamDialog memberId={memberId} onSaved={onSaved} trigger={newExam} />}
      </div>
      {umo.exams.length === 0 ? (
        <p className="m-0 px-6 py-4 text-[13px] text-neutral-500" data-testid="umo-empty">
          Осмотров нет
        </p>
      ) : (
        <div className={GLASS}>
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className={th + ' sticky left-0 z-10 w-64'}>Показатель</th>
                {umo.exams.map((e, i) => (
                  <th key={e.id} className={th}>
                    {!umo.canEdit ? (
                      <span className="px-1.5 font-medium text-neutral-700" data-testid="umo-exam-date">
                        {i === 0 ? 'База · ' : 'Осмотр ' + (i + 1) + ' · '}
                        {dmy(e.date)}
                      </span>
                    ) : (
                    <ExamDialog
                      memberId={memberId}
                      exam={e}
                      onSaved={onSaved}
                      trigger={
                        <Button variant="ghost" size="sm" className="rounded-lg px-1.5 font-medium text-neutral-700" data-testid="umo-exam-open">
                          {i === 0 ? 'База · ' : 'Осмотр ' + (i + 1) + ' · '}
                          {dmy(e.date)} <Pencil size={12} />
                        </Button>
                      }
                    />
                    )}
                  </th>
                ))}
                {umo.nextPlanned && <th className={th + ' text-neutral-400'}>Следующий · {dmy(umo.nextPlanned)}</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td + ' ' + STICKY + ' text-neutral-500'}>Рост, см</td>
                {umo.exams.map((e) => (
                  <td key={e.id} className={td}>
                    {e.heightCm ? fmt(e.heightCm) : '—'}
                  </td>
                ))}
                {umo.nextPlanned && <td className={td} />}
              </tr>
              {CONTEXT.map((c) => (
                <tr key={c.key}>
                  <td className={td + ' ' + STICKY + ' text-neutral-500'}>{c.label}</td>
                  {umo.exams.map((e) => (
                    <td key={e.id} className={td + ' max-w-72 whitespace-pre-line'}>
                      {(e[c.key as keyof UmoExam] as string) || '—'}
                    </td>
                  ))}
                  {umo.nextPlanned && <td className={td} />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 xl:grid-cols-3">
        {umo.blocks.map((b) => (
          <button
            key={b.code}
            type="button"
            onClick={() => onOpen(b.code)}
            className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-left hover:border-brand-200 hover:shadow-sm"
            data-testid="umo-block-card"
            data-code={b.code}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-semibold">
                {b.n}. {b.title}
              </span>
              <span className={'rounded-full px-2 py-0.5 text-[10.5px] font-semibold ' + (b.control ? 'bg-neutral-100 text-neutral-600' : 'bg-brand-50 text-brand-700')}>
                {b.control ? 'Допуск и контроль' : 'Рычаг'}
              </span>
            </span>
            <span className="flex gap-4 text-[12.5px]">
              <span>
                <b className="tabular-nums">{b.summary.numeric}</b> <span className="text-neutral-500">с данными</span>
              </span>
              <span className={b.summary.low ? 'text-amber-700' : 'text-neutral-400'}>
                <b className="tabular-nums">{b.summary.low}</b> ниже
              </span>
              <span className={b.summary.high ? 'text-red-600' : 'text-neutral-400'} data-testid="umo-block-high">
                <b className="tabular-nums">{b.summary.high}</b> выше
              </span>
            </span>
            <span className="text-[12px] text-neutral-500">{b.impact}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusChip({ s }: { s: UmoStatus }) {
  if (!s) return <span className="text-neutral-400">—</span>;
  return (
    <Chip size="sm" variant="soft" color={STATUS[s].color} data-testid="umo-status" data-status={s}>
      {STATUS[s].text}
    </Chip>
  );
}

function BlockTable({ block, umo, onSaved }: { block: UmoBlock; umo: Umo; onSaved: (u: Umo) => void }) {
  const [editing, setEditing] = useState<string | null>(null); // id осмотра в правке
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const col = editing ? umo.exams.findIndex((e) => e.id === editing) : -1;

  function start(examId: string) {
    const exam = umo.exams.find((e) => e.id === examId)!;
    setDraft(Object.fromEntries(block.params.filter((p) => !p.calc).map((p) => [p.code, exam.values[p.code] ?? ''])));
    setEditing(examId);
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateUmoExam(editing, {}, draft));
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const ref = (min: number | null, max: number | null) =>
    min === null && max === null ? '—' : min === null ? '≤ ' + fmt(max) : max === null ? '≥ ' + fmt(min) : fmt(min) + ' – ' + fmt(max);

  return (
    <div className="flex min-h-full flex-col [&>*]:shrink-0" data-testid="umo-block" data-code={block.code}>
      {/* Заголовка блока нет — он повторял бы выбранную вкладку ✳ (22.11.2026). */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[color-mix(in_oklab,var(--separator)_50%,transparent)] px-6 py-3 empty:hidden">
        {umo.canEdit &&
          umo.exams.length > 0 &&
          (editing ? (
            <div className="flex items-center gap-2">
              {error && <span className="text-[13px] text-red-600" data-testid="umo-values-error">{error}</span>}
              <Button variant="tertiary" size="sm" className="rounded-xl" onPress={() => setEditing(null)}>
                Отмена
              </Button>
              <Button variant="primary" size="sm" className="rounded-xl" isDisabled={busy} onPress={() => void save()} data-testid="umo-values-save">
                Сохранить
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Picker
                label="Осмотр"
                value={umo.exams[umo.exams.length - 1].id}
                options={umo.exams.map((e, i) => ({ id: e.id, label: (i === 0 ? 'База · ' : 'Осмотр ' + (i + 1) + ' · ') + dmy(e.date) }))}
                onChange={(id) => start(id)}
                testId="umo-values-exam"
              />
              <Button variant="primary" size="sm" className="rounded-xl" onPress={() => start(umo.exams[umo.exams.length - 1].id)} data-testid="umo-values-edit">
                <Pencil size={14} /> Внести значения
              </Button>
            </div>
          ))}
      </div>
      {umo.exams.length === 0 ? (
        <p className="m-0 px-6 py-4 text-[13px] text-neutral-500">Осмотров нет</p>
      ) : (
        <div className={GLASS}>
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className={th + ' sticky left-0 z-10'}>Параметр</th>
                <th className={th}>Ед.</th>
                <th className={th}>Референс</th>
                {umo.exams.map((e, i) => (
                  <th key={e.id} className={th + (i === col ? ' bg-brand-50 text-brand-700' : '')}>
                    {i === 0 ? 'База ' : ''}
                    {shortDate(e.date)}
                  </th>
                ))}
                <th className={th}>Последнее</th>
                <th className={th}>Δ к базе</th>
                <th className={th}>Δ к пред.</th>
                <th className={th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {block.params.map((p) => (
                <tr key={p.code} data-testid="umo-param" data-code={p.code}>
                  <td className={td + ' ' + STICKY + ' z-10 min-w-56'}>
                    <span className="flex items-start gap-1.5">
                      {p.key && <Star size={12} className="mt-1 shrink-0 fill-qtt-peach text-qtt-peach" aria-label="Ключевой параметр" />}
                      <span className={p.calc ? 'text-neutral-500 italic' : 'font-medium'}>{p.name}</span>
                      {(p.reflects || p.signal) && (
                        <Tooltip>
                          <Tooltip.Trigger aria-label={'Пояснение: ' + p.name} className="mt-0.5 shrink-0 text-neutral-400 hover:text-brand-600">
                            <Info size={13} />
                          </Tooltip.Trigger>
                          <Tooltip.Content className="max-w-80">
                            {p.reflects && (
                              <p className="m-0 text-[12px]">
                                <b>Что отражает.</b> {p.reflects}
                              </p>
                            )}
                            {p.signal && (
                              <p className="m-0 mt-1 text-[12px]">
                                <b>Сигнал внимания.</b> {p.signal}
                              </p>
                            )}
                          </Tooltip.Content>
                        </Tooltip>
                      )}
                    </span>
                  </td>
                  <td className={td + ' whitespace-nowrap text-neutral-500'}>{p.unit}</td>
                  <td className={td + ' whitespace-nowrap text-neutral-500 tabular-nums'}>{p.kind === 'num' ? ref(p.refMin, p.refMax) : '—'}</td>
                  {p.values.map((v, i) => (
                    <td
                      key={i}
                      className={td + ' tabular-nums ' + (i === col ? 'bg-brand-50/60 ' : p.statuses[i] === 'low' || p.statuses[i] === 'high' ? OUT : '')}
                      data-testid="umo-cell"
                      data-status={p.statuses[i] ?? ''}
                    >
                      {i === col && !p.calc ? (
                        <input
                          value={draft[p.code] ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, [p.code]: e.target.value }))}
                          inputMode={p.kind === 'num' ? 'decimal' : 'text'}
                          aria-label={p.name}
                          className={'rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[13px] ' + (p.kind === 'num' ? 'w-20' : 'w-48')}
                          data-testid={'umo-input-' + p.code}
                        />
                      ) : (
                        <span className={p.kind === 'text' ? 'block max-w-56 whitespace-normal' : ''}>{fmt(v) || '—'}</span>
                      )}
                    </td>
                  ))}
                  <td className={td + ' font-semibold tabular-nums'}>{fmt(p.last) || '—'}</td>
                  <td className={td + ' tabular-nums'}>{p.deltaBasePct === null ? '—' : signed(p.deltaBasePct, 1) + ' %'}</td>
                  <td className={td + ' tabular-nums'}>{p.deltaPrev === null ? '—' : signed(p.deltaPrev, 3)}</td>
                  <td className={td}>
                    <StatusChip s={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Содержимое вкладки УМО: `tab` — `summary` или код блока. */
export function UmoPanel({ memberId, tab, onTab }: { memberId: string; tab: string; onTab: (t: string) => void }) {
  const loaded = useLoad(() => fetchUmo(memberId), memberId + ':umo');
  const [fresh, setFresh] = useState<Umo | null>(null);
  const umo = fresh ?? loaded.data;
  if (!umo) return loaded.error ? <p className="m-0 p-5 text-[13px] text-red-600">{loaded.error}</p> : <Spinner className="m-6" />;
  if (tab === 'summary') return <Summary umo={umo} memberId={memberId} onSaved={setFresh} onOpen={onTab} />;
  const block = umo.blocks.find((b) => b.code === tab);
  return block ? <BlockTable key={block.code} block={block} umo={umo} onSaved={setFresh} /> : null;
}

/** Вкладки УМО: «Сводка» и блоки — для ленты вкладок медкарты. */
export const UMO_TABS: { id: string; label: string }[] = [
  { id: 'summary', label: 'Сводка УМО' },
  { id: 'nutrition', label: 'Питание' },
  { id: 'oxygen', label: 'Кислород' },
  { id: 'load', label: 'Нагрузка' },
  { id: 'support', label: 'Опора' },
  { id: 'immune', label: 'Иммунитет' },
  { id: 'vision', label: 'Зрение' },
  { id: 'heart', label: 'Сердце' },
  { id: 'liver', label: 'Печень' },
  { id: 'water', label: 'Вода' },
];
