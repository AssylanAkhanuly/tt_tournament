'use client';

/* «Карточки · Таблица» — один переключатель на приложение ✳ (24.11.2026,
   решение владельца продукта: «карточки одинаковые по всему приложению,
   компонентом»). Стоит справа в полосе над списком: рейтинг-лист, состав
   турнира, состав сборной. Вид живёт в адресе — его читает и пишет экран. */

import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ cards, onChange, testIds }: { cards: boolean; onChange: (cards: boolean) => void; testIds: { cards: string; table: string } }) {
  return (
    <ToggleButtonGroup
      size="sm"
      aria-label="Вид"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[cards ? 'cards' : 'table']}
      onSelectionChange={(keys) => {
        const v = [...keys][0];
        if (v) onChange(v === 'cards');
      }}
    >
      <ToggleButton id="cards" aria-label="Карточки" data-testid={testIds.cards}>
        <LayoutGrid size={16} />
      </ToggleButton>
      <ToggleButton id="table" aria-label="Таблица" data-testid={testIds.table}>
        <List size={16} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
