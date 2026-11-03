'use client';

/* Меню действий на телефоне ✳ (03.11.2026, решение владельца продукта: «на
   телефоне все выпадающие списки — панелью снизу»). Вместо `Dropdown` — панель
   снизу (`Drawer` HeroUI): разделы с подписью, пункты строками на всю ширину,
   у выбранного — галочка, у опасного — красный текст. Пункт выполняет действие
   и закрывает панель.

   `ActionMenu` — кнопка и меню разом: на десктопе `Dropdown` HeroUI как есть,
   на телефоне — эта панель. Для меню со своим устройством (меню человека в
   оболочке) панель берётся отдельно — `MenuSheet`. HeroUI + Tailwind. */

import { Button, Dropdown, Label } from '@heroui/react';
import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useNarrow } from '@/shared/kit/app';
import { BottomSheet } from './BottomSheet';

export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  selected?: boolean;
  testId?: string;
  onAction: () => void;
};
export type MenuSection = { label?: string; items: MenuItem[] };

export function MenuSheet({
  isOpen,
  onOpenChange,
  title,
  sections,
  testId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sections: MenuSection[];
  testId?: string;
}) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} title={title} testId={testId} bodyClassName="flex flex-col gap-3 px-0 pb-4">
      {sections.map((s, i) => (
        <section key={s.label ?? i} role="menu" aria-label={s.label ?? title}>
          {s.label && (
            <h3 className="px-6 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{s.label}</h3>
          )}
          {s.items.map((it) => (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              data-testid={it.testId}
              onClick={() => {
                onOpenChange(false);
                it.onAction();
              }}
              className={
                'flex w-full items-center gap-3 border-b border-neutral-100 px-6 py-3.5 text-left text-[15px] last:border-b-0 ' +
                (it.danger ? 'text-red-600' : it.selected ? 'font-medium text-blue-700' : 'text-neutral-800')
              }
            >
              {it.icon}
              <span className="min-w-0 flex-1">{it.label}</span>
              {it.selected && <Check size={18} className="shrink-0 text-blue-600" />}
            </button>
          ))}
        </section>
      ))}
    </BottomSheet>
  );
}

/** Кнопка с меню действий: десктоп — `Dropdown`, телефон — панель снизу. */
export function ActionMenu({
  trigger,
  ariaLabel,
  title,
  items,
  testId,
}: {
  /** Содержимое кнопки (значок). */
  trigger: ReactNode;
  ariaLabel: string;
  /** Заголовок панели на телефоне. */
  title: string;
  items: MenuItem[];
  testId?: string;
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);

  if (narrow) {
    return (
      <>
        <Button isIconOnly variant="tertiary" aria-label={ariaLabel} className="rounded-xl" data-testid={testId} onPress={() => setOpen(true)}>
          {trigger}
        </Button>
        <MenuSheet isOpen={open} onOpenChange={setOpen} title={title} sections={[{ items }]} testId="menu-sheet" />
      </>
    );
  }

  return (
    <Dropdown>
      <Button isIconOnly variant="tertiary" aria-label={ariaLabel} className="rounded-xl" data-testid={testId}>
        {trigger}
      </Button>
      <Dropdown.Popover placement="bottom end" className="rounded-xl">
        <Dropdown.Menu aria-label={title} onAction={(key) => items.find((it) => it.id === key)?.onAction()}>
          {items.map((it) => (
            <Dropdown.Item key={it.id} id={it.id} textValue={it.label} className="rounded-xl" data-testid={it.testId}>
              {it.icon}
              <Label>{it.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
