'use client';

/* «Доступ к правке» в таблице судей турнира ✳ (24.11.2026, решение владельца
   продукта: «колонка, чтобы давать доступ к правке»). Правит ход турнира один —
   держатель полномочий главного судьи (`authority.py`):
   - у держателя — «Правит»;
   - у главного судьи, секретаря и заместителя без полномочий — «Просмотр»;
     главному судье у секретаря и заместителя — переключатель: включил —
     полномочия переданы, выключил — вернулись к нему;
   - у судей стола — «Свои матчи»: счёт вносят только в матчах, куда посажены.
   Те же действия, что кнопки полосы полномочий; права решает сервер. */

import { Chip, Switch } from '@heroui/react';
import { useState } from 'react';

import { returnAuthority, transferAuthority, type Authority } from '@/entities/tournament';

const BRIGADE = ['chief_referee', 'chief_secretary', 'deputy_chief_referee'];

export function AccessCell({
  tournamentId,
  authority,
  person,
  onChange,
}: {
  tournamentId: string;
  authority: Authority | null;
  person: { id: string; position: string };
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!BRIGADE.includes(person.position)) {
    return (
      <span className="text-neutral-500" data-testid="referee-access" data-access="own">
        Свои матчи
      </span>
    );
  }
  if (!authority) return <span className="text-neutral-400">—</span>;
  const holds = authority.holder?.id === person.id;
  const canGive = authority.canTransfer && authority.candidates.some((c) => c.id === person.id);
  const canTake = holds && authority.transferred && authority.canReturn && person.position !== 'chief_referee';
  const run = async (fn: () => Promise<Authority>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const label = holds ? (
    <Chip size="sm" variant="soft" color="accent">
      Правит
    </Chip>
  ) : (
    <span className="text-neutral-500">Просмотр</span>
  );
  return (
    <span className="flex items-center gap-3" data-testid="referee-access" data-access={holds ? 'run' : 'view'}>
      {(canGive || canTake) && (
        <Switch
          size="sm"
          isSelected={holds}
          isDisabled={busy}
          onChange={(on) => void run(() => (on ? transferAuthority(tournamentId, person.id) : returnAuthority(tournamentId)))}
          aria-label={holds ? 'Забрать доступ к правке' : 'Дать доступ к правке'}
          data-testid="referee-access-switch"
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      )}
      {label}
      {error && <span className="text-[12px] text-red-600">{error}</span>}
    </span>
  );
}
