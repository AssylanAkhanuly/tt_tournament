'use client';

/* Где проходит турнир ✳ (01.11.2026, решение владельца продукта): выбор с
   поиском по справочнику сервера — регионы и города. Поиск идёт и по городу, и
   по области: «Павлодарская» показывает область и все её города. Город,
   записанный строкой до справочника, остаётся в списке, пока его не сменят.

   На телефоне ✳ (03.11.2026, решение владельца продукта: выпадающих списков
   там нет) поле открывает панель снизу: поиск сверху, список под ним, выбор
   закрывает панель. Поиск тот же — по подписи «город, область». */

import { ComboBox, Drawer, Input, ListBox, SearchField } from '@heroui/react';
import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { placeLabel, usePlaces } from '@/entities/tournament';
import { useNarrow } from '@/shared/kit/app';
import { BottomSheet } from '@/shared/ui/BottomSheet';

type Option = { id: string; region: string; city: string };

const idOf = (region: string, city: string) => region + '|' + city;

export function PlaceSelect({
  region,
  city,
  isDisabled,
  onChange,
}: {
  region: string;
  city: string;
  isDisabled?: boolean;
  onChange: (place: { region: string; city: string }) => void;
}) {
  const places = usePlaces();
  const narrow = useNarrow();
  const options = useMemo<Option[]>(
    () =>
      (places.data ?? []).flatMap((p) =>
        p.cities.length
          ? [{ region: p.region, city: '' }, ...p.cities.map((c) => ({ region: p.region, city: c }))].map((o) => ({
              ...o,
              id: idOf(o.region, o.city),
            }))
          : // Город республиканского значения: регион и есть город.
            [{ id: idOf(p.region, p.region), region: p.region, city: p.region }],
      ),
    [places.data],
  );
  const selected = city || region ? idOf(region, city) : null;
  const items =
    selected && places.data && !options.some((o) => o.id === selected)
      ? [{ id: selected, region, city }, ...options]
      : options;

  if (narrow) return <PlaceSheet items={items} selected={selected} isDisabled={isDisabled || !places.data} onPick={onChange} />;

  return (
    <ComboBox
      // Значение подставляется по уже загруженному списку.
      key={places.data ? 'ready' : 'loading'}
      aria-label="Город, область"
      className="w-full min-w-0"
      menuTrigger="focus"
      isDisabled={isDisabled || !places.data}
      selectedKey={selected}
      onSelectionChange={(k) => {
        const o = items.find((x) => x.id === k);
        onChange({ region: o?.region ?? '', city: o?.city ?? '' });
      }}
    >
      <ComboBox.InputGroup className="rounded-xl">
        <Input className="rounded-xl" placeholder="Город или область" data-testid="info-place" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover className="rounded-xl">
        <ListBox
          data-testid="info-place-options"
          renderEmptyState={() => <p className="px-3 py-2 text-[13px] text-neutral-500">Ничего не найдено</p>}
        >
          {items.map((o) => (
            <ListBox.Item key={o.id} id={o.id} textValue={placeLabel(o)} className="rounded-xl">
              <span className={o.city ? '' : 'font-semibold'}>{o.city || o.region}</span>
              {o.city && o.city !== o.region && o.region && (
                <span className="ml-2 text-[13px] text-neutral-500">{o.region}</span>
              )}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

function PlaceSheet({
  items,
  selected,
  isDisabled,
  onPick,
}: {
  items: Option[];
  selected: string | null;
  isDisabled?: boolean;
  onPick: (place: { region: string; city: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = items.find((o) => o.id === selected);
  const found = q.trim()
    ? items.filter((o) => placeLabel(o).toLowerCase().includes(q.trim().toLowerCase()))
    : items;
  return (
    <>
      <button
        type="button"
        aria-label="Город, область"
        disabled={isDisabled}
        onClick={() => {
          setQ('');
          setOpen(true);
        }}
        data-testid="info-place"
        className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-left text-[14px] shadow-xs disabled:opacity-50"
      >
        <span className={'min-w-0 flex-1 truncate ' + (current ? '' : 'text-neutral-400')}>
          {current ? placeLabel(current) : 'Город или область'}
        </span>
        <ChevronDown size={16} className="shrink-0 text-neutral-400" />
      </button>
      <BottomSheet
        isOpen={open}
        onOpenChange={setOpen}
        testId="place-sheet"
        tall
        bodyClassName="px-0 pb-4"
        header={
          <div className="flex flex-col gap-3">
            <Drawer.Heading className="text-lg font-semibold">Город, область</Drawer.Heading>
            <SearchField aria-label="Поиск места" value={q} onChange={setQ} autoFocus>
              <SearchField.Group className="w-full rounded-xl">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Город или область" data-testid="place-sheet-search" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
        }
      >
        <div role="listbox" aria-label="Город, область" data-testid="info-place-options">
          {found.length === 0 && <p className="px-6 py-3 text-[14px] text-neutral-500">Ничего не найдено</p>}
          {found.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === selected}
              onClick={() => {
                onPick({ region: o.region, city: o.city });
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b border-neutral-100 px-6 py-3 text-left last:border-b-0"
            >
              <span className="min-w-0 flex-1">
                <span className={'block text-[15px] ' + (o.city ? '' : 'font-semibold')}>{o.city || o.region}</span>
                {o.city && o.city !== o.region && o.region && (
                  <span className="block text-[12.5px] text-neutral-500">{o.region}</span>
                )}
              </span>
              {o.id === selected && <Check size={18} className="shrink-0 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
