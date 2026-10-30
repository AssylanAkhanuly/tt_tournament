'use client';

/* «Добавить» в разделе турнира ✳ (28.10.2026): спортсмены или судья — из
   существующих учёток. HeroUI + Tailwind.

   Шаги ✳ (решение владельца продукта): сверху — трекер шагов, действие — кнопкой
   в подвале окна, а не у каждой строки.
   - Спортсмены — один шаг: отмечаем в выдаче одного или нескольких и
     «Добавить (N)».
   - Судья — два шага: «Выбор» (один человек) → «Далее» → «Должность»: главный
     судья, заместитель, главный секретарь — по одному на турнир (занятые
     недоступны и подписаны, кем заняты), судей стола — сколько угодно.
   Править состав может председатель ГСК и администратор федерации — остальным
   сервер ответит 403. */

import { Avatar, Button, Description, Label, ListBox, Modal, SearchField, Spinner, useOverlayState } from '@heroui/react';
import { Check, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  PositionPicker,
  addToRoster,
  fetchCandidates,
  type RefereePosition,
  type RosterCandidate,
  type RosterRole,
} from '@/entities/tournament';


const TITLE: Record<RosterRole, string> = { player: 'Добавить спортсменов', referee: 'Добавить судью' };

/** Выдача поиска с задержкой: запрос — когда ввод замер, а не на каждую букву. */
function useCandidates(tournamentId: string, role: RosterRole, q: string, open: boolean, tick: number) {
  const [state, setState] = useState<{ key: string; list: RosterCandidate[]; error: string | null } | null>(null);
  const key = JSON.stringify([q, tick]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = setTimeout(() => {
      fetchCandidates(tournamentId, role, q)
        .then((list) => live && setState({ key, list, error: null }))
        .catch((e: Error) => live && setState({ key, list: [], error: e.message }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [tournamentId, role, q, open, key]);

  return { list: state?.list ?? null, error: state?.error ?? null };
}

/** Трекер шагов: номер в кружке, подпись, линия между шагами. Пройденный — с
 *  галочкой, текущий — залит. Свой на Tailwind: готового степпера в HeroUI v3
 *  нет (проверено по списку компонентов, 28.10.2026). */
function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="m-0 flex list-none items-center gap-2 p-0" data-testid="roster-steps">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
          {i > 0 && <span className={'h-px w-8 ' + (i <= current ? 'bg-blue-600' : 'bg-neutral-200')} />}
          <span
            className={
              'flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ' +
              (i < current
                ? 'bg-blue-600 text-white'
                : i === current
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 text-neutral-500')
            }
          >
            {i < current ? <Check size={13} /> : i + 1}
          </span>
          <span className={'text-[13px] ' + (i === current ? 'font-semibold text-neutral-900' : 'text-neutral-500')}>
            {s}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AddToRosterDialog({
  tournamentId,
  role,
  taken = [],
  onAdded,
}: {
  tournamentId: string;
  role: RosterRole;
  /** Занятые должности судей турнира — чтобы не предлагать их второй раз. */
  taken?: { position: RefereePosition; name: string }[];
  /** Добавили — таблица раздела перечитывается. */
  onAdded: () => void;
}) {
  const referee = role === 'referee';
  const steps = referee ? ['Выбор', 'Должность'] : ['Выбор'];

  const state = useOverlayState({
    onOpenChange: (open) => {
      if (open) return;
      // Закрыли — следующий раз с чистого листа.
      setStep(0);
      setQ('');
      setSelected(new Set());
      setPosition(null);
      setError(null);
    },
  });
  const [step, setStep] = useState(0);
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState<RefereePosition | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const found = useCandidates(tournamentId, role, q, state.isOpen, tick);
  // Отмеченные помним целиком: поиск может увести их из выдачи.
  const [picked, setPicked] = useState<Map<string, RosterCandidate>>(new Map());


  async function submit() {
    setBusy(true);
    setError(null);
    try {
      for (const id of selected) await addToRoster(tournamentId, role, id, position ?? undefined);
      onAdded();
      setTick((t) => t + 1);
      state.close();
    } catch (e) {
      setError((e as Error).message);
      onAdded(); // часть могла добавиться
    } finally {
      setBusy(false);
    }
  }

  const person = [...selected].map((id) => picked.get(id)).find(Boolean);

  return (
    // Кнопка — внутри `Modal`: это его триггер.
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid={`roster-add-${role}`}>
        <UserPlus size={16} /> Добавить
      </Button>
      <Modal.Backdrop>
        <Modal.Container size="md">
          <Modal.Dialog className="rounded-xl" data-testid="roster-dialog">
            <Modal.CloseTrigger aria-label="Закрыть" />
            <Modal.Header className="flex flex-col items-start gap-3">
              <Modal.Heading className="text-lg font-semibold">{TITLE[role]}</Modal.Heading>
              {steps.length > 1 && <Steps steps={steps} current={step} />}
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {step === 0 ? (
                <>
                  <SearchField aria-label="Поиск учёток" value={q} onChange={setQ} autoFocus>
                    <SearchField.Group className="rounded-xl">
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Имя, почта или телефон" data-testid="roster-search" />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                  {/* Выдача ограничена по высоте и прокручивается сама — окно не растёт. */}
                  <div className="h-72 overflow-y-auto">
                    {found.error ? (
                      <p className="py-6 text-center text-[13px] text-red-600">{found.error}</p>
                    ) : !found.list ? (
                      <Spinner className="mx-auto my-6 block" />
                    ) : (
                      <ListBox
                        aria-label="Учётки"
                        selectionMode={referee ? 'single' : 'multiple'}
                        selectedKeys={selected}
                        onSelectionChange={(keys) => {
                          const next = new Set([...(keys as Set<string | number>)].map(String));
                          setSelected(next);
                          setPicked((m) => {
                            const copy = new Map(m);
                            for (const c of found.list ?? []) if (next.has(c.id)) copy.set(c.id, c);
                            return copy;
                          });
                        }}
                        renderEmptyState={() => (
                          <p className="py-6 text-center text-[13px] text-neutral-500" data-testid="roster-empty">
                            Никого не найдено
                          </p>
                        )}
                      >
                        {found.list.map((c) => (
                          <ListBox.Item
                            key={c.id}
                            id={c.id}
                            textValue={c.name}
                            // Отмеченная строка подсвечена, а не только с галочкой справа.
                            className="rounded-xl data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900"
                            data-testid="roster-candidate"
                            data-name={c.name}
                          >
                            <Avatar size="sm">
                              <Avatar.Fallback>{c.name.slice(0, 1)}</Avatar.Fallback>
                            </Avatar>
                            <span className="min-w-0 flex-1 leading-tight">
                              <Label className="block truncate text-[13px] font-medium">{c.name}</Label>
                              {c.email && <Description className="block truncate text-[12px]">{c.email}</Description>}
                            </span>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {person && (
                    <p className="text-[13px] text-neutral-600">
                      <span className="font-medium text-neutral-900">{person.name}</span>
                    </p>
                  )}
                  <PositionPicker value={position} onChange={setPosition} taken={taken} />
                </>
              )}

              {error && (
                <p className="text-[13px] text-red-600" data-testid="roster-error">
                  {error}
                </p>
              )}
            </Modal.Body>

            <Modal.Footer>
              {step > 0 && (
                <Button variant="tertiary" className="rounded-xl" onPress={() => setStep(step - 1)}>
                  Назад
                </Button>
              )}
              {referee && step === 0 ? (
                <Button
                  variant="primary"
                  className="rounded-xl"
                  isDisabled={selected.size === 0}
                  onPress={() => setStep(1)}
                  data-testid="roster-next"
                >
                  Далее
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="rounded-xl"
                  isDisabled={selected.size === 0 || (referee && !position) || busy}
                  onPress={() => void submit()}
                  data-testid="roster-submit"
                >
                  {referee || selected.size <= 1 ? 'Добавить' : `Добавить (${selected.size})`}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
