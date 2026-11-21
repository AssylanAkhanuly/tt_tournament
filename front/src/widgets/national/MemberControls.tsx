'use client';

/* Правка члена сборной в шапке профиля ✳ (22.11.2026, решения владельца
   продукта): состав, группа и личный тренер — строками сведений «Состав:
   Основной ▾», значение — кнопка с меню выбора (`Dropdown` HeroUI); «Убрать
   из сборной» — значком с подтверждением. Показывается тому, кому сервер
   открыл правку состава (`access.roster`); остальным — те же строки текстом.
   HeroUI + Tailwind. */

import { AlertDialog, Button, Dropdown, Label } from '@heroui/react';
import { ChevronDown, UserMinus } from 'lucide-react';
import { useState } from 'react';

import { fetchPersonalCoaches, removeMember, updateMember, useLoad, type NationalMember } from '@/entities/national';
import { AlertSheet } from '@/shared/ui/ModalSheet';

export const NO_COACH = 'none';

/** Правка с ошибкой рядом: зовёт сервер, после — `after`. */
export function useMemberEdit(canEdit: boolean) {
  const [error, setError] = useState<string | null>(null);
  const coaches = useLoad(() => (canEdit ? fetchPersonalCoaches() : Promise.resolve([])), canEdit ? 'coaches' : 'none');
  async function run(action: () => Promise<unknown>, after: () => void) {
    setError(null);
    try {
      await action();
      after();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return { error, run, coaches: coaches.data ?? [], update: updateMember };
}

/** Значение строки сведений с меню выбора: текст и стрелка, по щелчку — список. */
export function ValueSelect({ label, value, text, options, onChange, testId }: {
  label: string;
  value: string;
  text: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  testId: string;
}) {
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        className="-mx-1.5 inline-flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-0.5 font-medium hover:bg-neutral-100"
        data-testid={testId}
      >
        <span className="truncate">{text}</span>
        <ChevronDown size={14} className="shrink-0 text-neutral-500" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="rounded-xl">
        <Dropdown.Menu aria-label={label} selectionMode="single" selectedKeys={[value]} onAction={(key) => key !== value && onChange(String(key))}>
          {options.map((o) => (
            <Dropdown.Item key={o.id} id={o.id} textValue={o.label} className="rounded-xl">
              <Dropdown.ItemIndicator />
              <Label>{o.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function RemoveMemberButton({ member, onRemove }: { member: NationalMember; onRemove: () => void }) {
  return (
    <AlertDialog>
      <Button size="sm" variant="ghost" className="rounded-xl text-red-600" data-testid="member-remove">
        <UserMinus size={15} /> Убрать из сборной
      </Button>
      <AlertSheet className="rounded-xl" testId="member-remove-confirm">
        <AlertDialog.Header>
          <AlertDialog.Icon status="danger" />
          <AlertDialog.Heading>Убрать из сборной?</AlertDialog.Heading>
        </AlertDialog.Header>
        <AlertDialog.Body>
          <p className="text-[14px]">{member.person.name}</p>
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button slot="close" variant="tertiary" className="rounded-xl">
            Отмена
          </Button>
          <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void removeMember(member.id).then(onRemove)}>
            Убрать
          </Button>
        </AlertDialog.Footer>
      </AlertSheet>
    </AlertDialog>
  );
}
