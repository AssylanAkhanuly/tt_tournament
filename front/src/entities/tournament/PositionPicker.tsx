'use client';

/* Выбор судейской должности ✳ (28.10.2026): один и тот же при назначении судьи,
   при смене должности в карточке и при назначении по заявке (`only` — только
   отмеченные в заявке, ✳ 29.10.2026). Главный судья, заместитель и главный
   секретарь — по одному на турнир: занятые чужими недоступны и подписаны, кем
   заняты. HeroUI `RadioGroup`. Лежит в сущности, а не в фиче: им пользуются
   две фичи — состав турнира и заявки судей. */

import { Description, Label, Radio, RadioGroup } from '@heroui/react';

import { REFEREE_POSITIONS, type RefereePosition } from './api';

export function PositionPicker({
  value,
  onChange,
  taken,
  self,
  only,
  isDisabled,
}: {
  value: RefereePosition | null;
  onChange: (position: RefereePosition) => void;
  /** Занятые должности турнира. */
  taken: { position: RefereePosition; name: string; id?: string }[];
  /** Чья должность меняется: своя занятая — не «чужая». */
  self?: string;
  /** Показать только эти должности (отмеченные в заявке). */
  only?: RefereePosition[];
  isDisabled?: boolean;
}) {
  return (
    <RadioGroup
      aria-label="Должность"
      value={value ?? ''}
      onChange={(v) => onChange(v as RefereePosition)}
      isDisabled={isDisabled}
      data-testid="roster-positions"
    >
      {REFEREE_POSITIONS.filter((p) => !only || only.includes(p.id)).map((p) => {
        const by = p.single ? taken.find((t) => t.position === p.id && t.id !== self)?.name : undefined;
        return (
          // Строение HeroUI: `Radio.Content` — строка «кружок + подпись»,
          // пояснение — рядом с ней, под строкой.
          <Radio key={p.id} value={p.id} isDisabled={!!by}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Label>{p.label}</Label>
            </Radio.Content>
            {by && <Description>занято: {by}</Description>}
          </Radio>
        );
      })}
    </RadioGroup>
  );
}
