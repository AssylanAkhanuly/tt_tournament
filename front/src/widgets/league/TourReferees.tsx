'use client';

/* «Судьи» тура Лиги ✳ (19.11.2026, LEAGUE.md «Расписание тура») — судьи стола,
   из которых «Сформировать» сажает судью на каждую встречу, как коллегия
   турнира. Кандидаты — учётки с ролью «судья», кроме игроков составов этого
   сезона (их отсекает сервер). Убрать судью — его встречи в черновике
   остаются без судьи до правки или нового «Сформировать». После отправки
   расписания судей не меняют. HeroUI + Tailwind. */

import { Button, ListBox, Modal, SearchField, Spinner, useOverlayState } from '@heroui/react';
import { Plus, UserMinus, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { addTourReferee, fetchTourRefereeCandidates, removeTourReferee, type TourDetail } from '@/entities/league';
import { DataTable, type DataColumn } from '@/shared/ui/DataTable';
import { ModalSheet } from '@/shared/ui/ModalSheet';

type Ref = { id: string; name: string };

function AddReferee({ tourId, onAdded }: { tourId: string; onAdded: () => void }) {
  const state = useOverlayState();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Ref[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isOpen) return;
    let live = true;
    const t = setTimeout(() => {
      fetchTourRefereeCandidates(tourId, q)
        .then((list) => live && setFound(list))
        .catch(() => live && setFound([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [state.isOpen, tourId, q]);

  async function add(id: string) {
    setError(null);
    try {
      await addTourReferee(tourId, id);
      setFound((list) => (list ?? []).filter((r) => r.id !== id));
      onAdded();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal state={state}>
      <Button variant="primary" size="sm" className="rounded-xl" data-testid="tour-referee-add-open">
        <Plus size={16} /> Добавить
      </Button>
      <ModalSheet size="sm" testId="tour-referee-add">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Судья стола</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-3">
          <SearchField aria-label="Поиск судей" value={q} onChange={setQ}>
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Фамилия или имя" data-testid="tour-referee-search" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="max-h-72 overflow-y-auto">
            {!found ? (
              <Spinner className="mx-auto my-4 block" />
            ) : (
              <ListBox
                aria-label="Кандидаты в судьи"
                renderEmptyState={() => <p className="py-4 text-center text-[13px] text-neutral-500">Никого не найдено</p>}
                onAction={(id) => void add(String(id))}
              >
                {found.map((r) => (
                  <ListBox.Item key={r.id} id={r.id} textValue={r.name} className="rounded-xl" data-testid="tour-referee-candidate" data-name={r.name}>
                    <span className="flex items-center gap-2">
                      <UserPlus size={15} className="text-brand-600" />
                      {r.name}
                    </span>
                  </ListBox.Item>
                ))}
              </ListBox>
            )}
          </div>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
        </Modal.Body>
      </ModalSheet>
    </Modal>
  );
}

export function TourReferees({ tour, onChanged }: { tour: TourDetail; onChanged: () => void }) {
  const { referees, canEdit } = tour.schedule;
  const [error, setError] = useState<string | null>(null);
  const load = (r: Ref) => tour.matches.filter((m) => m.referee?.id === r.id).length;

  async function remove(id: string) {
    setError(null);
    try {
      await removeTourReferee(tour.id, id);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const columns: DataColumn<Ref>[] = [
    { id: 'name', label: 'Судья стола', rowHeader: true, sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
    { id: 'load', label: 'Встреч', align: 'right', sortValue: load, render: load },
    {
      id: 'remove',
      label: '',
      sortable: false,
      align: 'right',
      render: (r) =>
        canEdit ? (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Убрать из тура"
            className="rounded-xl text-red-600"
            onPress={() => void remove(r.id)}
            data-testid="tour-referee-remove"
          >
            <UserMinus size={16} />
          </Button>
        ) : null,
    },
  ];

  return (
    <DataTable
      ariaLabel="Судьи стола тура"
      testId="tour-referees"
      rows={referees}
      columns={columns}
      getId={(r) => r.id}
      empty="Судей нет — без них расписание не сформировать"
      actions={
        <>
          {error && <span className="text-[13px] text-red-600">{error}</span>}
          {canEdit && <AddReferee tourId={tour.id} onAdded={onChanged} />}
        </>
      }
      rowProps={(r) => ({ 'data-testid': 'tour-referee-row', 'data-name': r.name })}
    />
  );
}
