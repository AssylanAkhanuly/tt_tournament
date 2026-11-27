'use client';

/* Выбор из списка — один на всё приложение ✳ (03.11.2026, решение владельца
   продукта: «на телефоне все выпадающие списки — панелью снизу»).

   На десктопе — `Select` HeroUI как есть. На телефоне (`useNarrow`) список
   выпадал под полем, налезал на соседние и уезжал за край — поэтому там поле
   открывает панель снизу (`Drawer`): заголовок — подпись поля, значения —
   строками на всю ширину, выбранное с галочкой; выбор закрывает панель.
   Значение живёт снаружи. HeroUI + Tailwind.

   `search` ✳ (27.11.2026, решение владельца продукта: «выбор с поиском»):
   на десктопе — `ComboBox` HeroUI, в поле печатают, список сужается; на
   телефоне — строка поиска в шапке панели. Для длинных списков людей. */

import { ComboBox, Drawer, Input, Label, ListBox, SearchField, Select } from '@heroui/react';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { useNarrow } from '@/shared/kit/app';
import { BottomSheet } from './BottomSheet';

export type PickerOption = { id: string; label: string; isDisabled?: boolean };

export function Picker({
  label,
  showLabel = false,
  value,
  options,
  onChange,
  isDisabled,
  className = 'w-full min-w-0',
  testId,
  placeholder = '—',
  search = false,
}: {
  /** Подпись поля: для читалки и заголовок панели на телефоне. */
  label: string;
  /** Показать подпись над полем (в формах окон). */
  showLabel?: boolean;
  value: string | null;
  options: PickerOption[];
  onChange: (id: string) => void;
  isDisabled?: boolean;
  className?: string;
  testId?: string;
  placeholder?: string;
  /** Поиск по списку: на десктопе — поле ввода, на телефоне — строка в панели. */
  search?: boolean;
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const found = search && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;

  if (narrow) {
    const current = options.find((o) => o.id === value);
    return (
      <div className={'flex flex-col gap-1 ' + className}>
        {showLabel && <Label>{label}</Label>}
        <button
          type="button"
          aria-label={showLabel ? undefined : label}
          aria-haspopup="dialog"
          disabled={isDisabled}
          onClick={() => setOpen(true)}
          data-testid={testId}
          className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-left text-[14px] shadow-xs disabled:opacity-50"
        >
          <span className="min-w-0 flex-1 truncate">{current?.label ?? placeholder}</span>
          <ChevronDown size={16} className="shrink-0 text-neutral-400" />
        </button>
        <BottomSheet
          isOpen={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setQ('');
          }}
          title={search ? undefined : label}
          header={
            search ? (
              <div className="flex flex-col gap-3">
                <Drawer.Heading className="text-lg font-semibold">{label}</Drawer.Heading>
                <SearchField aria-label={'Поиск: ' + label} value={q} onChange={setQ} autoFocus>
                  <SearchField.Group className="w-full rounded-xl">
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Поиск" data-testid="picker-search" />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </div>
            ) : undefined
          }
          tall={search}
          testId="picker-drawer"
          bodyClassName="px-0 pb-4"
        >
          <div role="listbox" aria-label={label} className="flex flex-col">
            {search && found.length === 0 && <p className="px-6 py-3 text-[14px] text-neutral-500">Ничего не найдено</p>}
            {found.map((o) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={o.id === value}
                disabled={o.isDisabled}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={
                  'flex w-full items-center gap-3 border-b border-neutral-100 px-6 py-3.5 text-left text-[15px] last:border-b-0 disabled:opacity-40 ' +
                  (o.id === value ? 'font-medium text-brand-700' : 'text-neutral-800')
                }
              >
                <span className="min-w-0 flex-1">{o.label}</span>
                {o.id === value && <Check size={18} className="shrink-0 text-brand-600" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      </div>
    );
  }

  if (search) {
    return (
      <ComboBox
        aria-label={showLabel ? undefined : label}
        className={className}
        menuTrigger="focus"
        selectedKey={value}
        onSelectionChange={(k) => k !== null && onChange(String(k))}
        isDisabled={isDisabled}
      >
        {showLabel && <Label>{label}</Label>}
        <ComboBox.InputGroup className="rounded-xl">
          <Input className="rounded-xl" placeholder={placeholder === '—' ? 'Поиск' : placeholder} data-testid={testId} />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover className="rounded-xl">
          <ListBox renderEmptyState={() => <p className="px-3 py-2 text-[13px] text-neutral-500">Ничего не найдено</p>}>
            {options.map((o) => (
              <ListBox.Item key={o.id} id={o.id} textValue={o.label} isDisabled={o.isDisabled} className="rounded-xl">
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    );
  }

  return (
    <Select
      aria-label={showLabel ? undefined : label}
      selectedKey={value}
      onSelectionChange={(k) => k !== null && onChange(String(k))}
      isDisabled={isDisabled}
      className={className}
    >
      {showLabel && <Label>{label}</Label>}
      <Select.Trigger className="rounded-xl" data-testid={testId}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="rounded-xl">
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o.id} id={o.id} textValue={o.label} isDisabled={o.isDisabled} className="rounded-xl">
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
