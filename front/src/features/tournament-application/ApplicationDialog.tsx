'use client';

/* «Подать заявку» за своих спортсменов ✳ (19.11.2026, ROLES.md роль 12 —
   «Заявка на старт»; ADMISSION.md). Окно: поиск, кандидаты списком (сервер
   отдаёт только тех, кого этот заявитель может заявить и кого в турнире ещё
   нет), можно отметить нескольких, «Подать заявку (N)» в подвале.

   Заявка проходит целиком или не проходит: при отказе окно остаётся открытым,
   отмеченные — отмеченными, у каждого спортсмена с причиной она подписана
   красным под именем, общая (предел участников, приём закрыт) — над кнопками.
   Возраст, квоту и предел проверяет сервер — экран их не повторяет.
   HeroUI + Tailwind. */

import { Button, Description, Label, ListBox, Modal, SearchField, Spinner, useOverlayState } from '@heroui/react';
import { FilePlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { num2 } from '@/entities/rating/lib/format';
import {
  ApplicationRefused,
  fetchApplicationCandidates,
  submitApplication,
  type ApplicationAthlete,
} from '@/entities/tournament';
import { ModalSheet } from '@/shared/ui/ModalSheet';

/** Выдача с задержкой: запрос — когда ввод замер, а не на каждую букву. */
function useCandidates(tournamentId: string, as: string, q: string, open: boolean, tick: number) {
  const [state, setState] = useState<{ key: string; list: ApplicationAthlete[]; error: string | null } | null>(null);
  const key = JSON.stringify([q, tick]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = setTimeout(() => {
      fetchApplicationCandidates(tournamentId, as, q)
        .then((list) => live && setState({ key, list, error: null }))
        .catch((e: Error) => live && setState({ key, list: [], error: e.message }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [tournamentId, as, q, open, key]);

  return { list: state?.list ?? null, error: state?.error ?? null };
}

/** «2010 · Алматы · 12,40» — по чему тренер узнаёт своего. */
const details = (a: ApplicationAthlete) =>
  [a.birthYear, a.region, a.rating === null ? null : num2(a.rating)].filter((x) => x !== null && x !== '').join(' · ');

export function ApplicationDialog({
  tournamentId,
  as,
  isDisabled,
  onSubmitted,
}: {
  tournamentId: string;
  /** Заявитель, от имени которого подаётся (`canApplyAs` турнира). */
  as: string;
  isDisabled?: boolean;
  onSubmitted: () => void;
}) {
  const state = useOverlayState({
    onOpenChange: (open) => {
      if (open) return;
      setQ('');
      setSelected(new Set());
      setRefusal(null);
    },
  });
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<ApplicationRefused | Error | null>(null);
  const found = useCandidates(tournamentId, as, q, state.isOpen, tick);

  const reasons = new Map(
    refusal instanceof ApplicationRefused
      ? refusal.errors.filter((e) => e.athleteId).map((e) => [e.athleteId!, e.detail])
      : [],
  );
  // Общие причины — без спортсмена; нет ни одной по спортсменам — сам текст отказа.
  const common =
    refusal instanceof ApplicationRefused
      ? [...refusal.errors.filter((e) => !e.athleteId).map((e) => e.detail), ...(reasons.size ? [] : [refusal.message])]
      : refusal
        ? [refusal.message]
        : [];

  async function submit() {
    setBusy(true);
    setRefusal(null);
    try {
      await submitApplication(tournamentId, as, [...selected]);
      onSubmitted();
      setTick((t) => t + 1);
      state.close();
    } catch (e) {
      setRefusal(e as Error);
    } finally {
      setBusy(false);
    }
  }

  return (
    // Кнопка — внутри `Modal`: это его триггер.
    <Modal state={state}>
      <Button variant="primary" className="rounded-xl" isDisabled={isDisabled} data-testid="application-open">
        <FilePlus size={16} /> Подать заявку
      </Button>
      <ModalSheet size="md" className="rounded-xl" testId="application-dialog" tall>
        <Modal.CloseTrigger aria-label="Закрыть" />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Заявка на турнир</Modal.Heading>
        </Modal.Header>

        <Modal.Body className="flex flex-col gap-3">
          <SearchField aria-label="Поиск спортсменов" value={q} onChange={setQ} autoFocus>
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Фамилия или имя" data-testid="application-search" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="h-72 overflow-y-auto max-md:h-auto max-md:min-h-0 max-md:flex-1">
            {found.error ? (
              <p className="py-6 text-center text-[13px] text-red-600">{found.error}</p>
            ) : !found.list ? (
              <Spinner className="mx-auto my-6 block" />
            ) : (
              <ListBox
                aria-label="Спортсмены"
                selectionMode="multiple"
                selectedKeys={selected}
                onSelectionChange={(keys) => {
                  setSelected(new Set([...(keys as Set<string | number>)].map(String)));
                  setRefusal(null);
                }}
                renderEmptyState={() => (
                  <p className="py-6 text-center text-[13px] text-neutral-500" data-testid="application-empty">
                    Никого не найдено
                  </p>
                )}
              >
                {found.list.map((a) => (
                  <ListBox.Item
                    key={a.id}
                    id={a.id}
                    textValue={a.name}
                    className="rounded-xl data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-900"
                    data-testid="application-candidate"
                    data-name={a.name}
                    data-refused={reasons.has(a.id) || undefined}
                  >
                    <div className="flex min-w-0 flex-col">
                      <Label>{a.name}</Label>
                      <Description>{details(a)}</Description>
                      {reasons.has(a.id) && (
                        <span className="text-[12px] text-red-600" data-testid="application-reason">
                          {reasons.get(a.id)}
                        </span>
                      )}
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            )}
          </div>
          {common.map((text) => (
            <p key={text} className="text-[13px] text-red-600" data-testid="application-error">
              {text}
            </p>
          ))}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="tertiary" className="rounded-xl" onPress={state.close}>
            Отмена
          </Button>
          <Button
            variant="primary"
            className="rounded-xl"
            isDisabled={selected.size === 0 || busy}
            onPress={() => void submit()}
            data-testid="application-submit"
          >
            Подать заявку{selected.size ? ' (' + selected.size + ')' : ''}
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </Modal>
  );
}
