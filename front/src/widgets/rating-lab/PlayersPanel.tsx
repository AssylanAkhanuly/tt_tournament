'use client';

/* Спортсмены калибровки: имя, откуда взялся стартовый рейтинг, сколько матчей
   за плечами. Стартовое значение НЕ считается здесь — его выводит сервер по
   п. 6.1 / 6.3 / 17.4 и присылает в ответе; экран только показывает. */

import { Panel } from '@/shared/kit/app';
import { num2, type RatingOrigin } from '@/entities/rating';
import type { LabPlayerInput } from '@/features/rating-lab/types';
import { Btn, Num, Select, Text } from './controls';

const ORIGIN: { value: RatingOrigin; label: string }[] = [
  { value: 'new', label: 'Новый — 1,00' },
  { value: 'legacy', label: 'Прежний рейтинг' },
  { value: 'ittf', label: 'Позиция ITTF' },
];

const GRID = 'minmax(0,1.7fr) minmax(0,1.2fr) 84px 76px 80px 32px';

export function PlayersPanel({
  players,
  startOf,
  onAdd,
  onUpdate,
  onRemove,
}: {
  players: LabPlayerInput[];
  /** Стартовое значение из ответа сервера; null — ответа ещё нет. */
  startOf: (id: string) => number | null;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LabPlayerInput>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Panel
      title="Спортсмены"
      extra={
        <Btn onClick={onAdd} tone="primary" testId="add-player">
          Добавить спортсмена
        </Btn>
      }
    >
      <div
        className="mb-1.5 grid gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
        style={{ gridTemplateColumns: GRID }}
      >
        <span>Фамилия и имя</span>
        <span>Стартовое значение</span>
        <span>{'Прежний / ITTF'}</span>
        <span>Матчей до</span>
        <span>Старт</span>
        <span />
      </div>

      <div className="flex flex-col gap-1.5" data-testid="players-list">
        {players.map((p) => {
          const свой = p.origin === 'legacy';
          const ittf = p.origin === 'ittf';
          const start = startOf(p.id);
          return (
            <div key={p.id} className="grid items-center gap-2" style={{ gridTemplateColumns: GRID }} data-row>
              <Text
                value={p.name}
                onChange={(v) => onUpdate(p.id, { name: v })}
                ariaLabel="Фамилия и имя спортсмена"
                placeholder="Фамилия и имя"
              />
              <Select
                value={p.origin}
                onChange={(v) => onUpdate(p.id, { origin: v })}
                options={ORIGIN}
                ariaLabel={'Происхождение рейтинга: ' + p.name}
              />
              <Num
                value={ittf ? p.ittfPosition : p.legacy}
                onChange={(v) => onUpdate(p.id, ittf ? { ittfPosition: v } : { legacy: v })}
                ariaLabel={(ittf ? 'Позиция ITTF: ' : 'Прежний рейтинг: ') + p.name}
                step={ittf ? 1 : 0.01}
                min={ittf ? 1 : 0}
                disabled={!свой && !ittf}
              />
              <Num
                value={p.played}
                onChange={(v) => onUpdate(p.id, { played: Math.max(0, Math.round(v)) })}
                ariaLabel={'Сыграно матчей до прогона: ' + p.name}
                min={0}
              />
              <span className="text-right text-[13px] font-semibold tabular-nums" data-testid="start-value">
                {start === null ? '…' : num2(start)}
              </span>
              <Btn onClick={() => onRemove(p.id)} tone="danger" ariaLabel={'Удалить ' + p.name}>
                ×
              </Btn>
            </div>
          );
        })}
      </div>

      {!players.length && (
        <p className="py-6 text-center text-[13px] text-neutral-500">
          Ни одного спортсмена. Добавьте хотя бы двоих, чтобы свести матч.
        </p>
      )}
    </Panel>
  );
}
