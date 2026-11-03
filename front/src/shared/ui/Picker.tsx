'use client';

/* Выбор из списка — один на всё приложение ✳ (03.11.2026, решение владельца
   продукта: «на телефоне все выпадающие списки — панелью снизу»).

   На десктопе — `Select` HeroUI как есть. На телефоне (`useNarrow`) список
   выпадал под полем, налезал на соседние и уезжал за край — поэтому там поле
   открывает панель снизу (`Drawer`): заголовок — подпись поля, значения —
   строками на всю ширину, выбранное с галочкой; выбор закрывает панель.
   Значение живёт снаружи. HeroUI + Tailwind. */

import { Label, ListBox, Select } from '@heroui/react';
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
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);

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
        <BottomSheet isOpen={open} onOpenChange={setOpen} title={label} testId="picker-drawer" bodyClassName="px-0 pb-4">
          <div role="listbox" aria-label={label} className="flex flex-col">
            {options.map((o) => (
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
                  (o.id === value ? 'font-medium text-blue-700' : 'text-neutral-800')
                }
              >
                <span className="min-w-0 flex-1">{o.label}</span>
                {o.id === value && <Check size={18} className="shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      </div>
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
