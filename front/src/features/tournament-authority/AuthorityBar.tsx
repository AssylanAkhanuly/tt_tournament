'use client';

/* Полоса полномочий главного судьи ✳ (24.11.2026, flows/07 Э7.6, flows/08
   Э8.1–Э8.2; решения совещания 04.11.2026). Над ходом турнира («Столы») и на
   «Сведениях» бригады — в правом углу: «Только просмотр» тому, кто сейчас не
   правит, «Полномочия у вас» держателю; имя держателя — в подсказке.

   - Главный судья передаёт их секретарю или заместителю своего турнира —
     кнопкой на каждого; пока переданы, сам он только смотрит.
   - Вернуть может тот, у кого они, или главный судья.
   - «Журнал» — передачи и возвраты с временем.
   Кнопок нет у тех, кому действие недоступно (не серые — flows/08 ✳).
   Права решает сервер (`can_transfer`, `can_return`). */

import { Button, Chip, Modal } from '@heroui/react';
import { Eye, History, Undo2, UserRoundCog } from 'lucide-react';
import { useState } from 'react';

import { returnAuthority, transferAuthority, useAuthority, type Authority } from '@/entities/tournament';
import { ModalSheet } from '@/shared/ui/ModalSheet';

const when = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Кому передать — подпись кнопки по должности. */
const TO: Record<string, string> = {
  chief_secretary: 'Передать секретарю',
  deputy_chief_referee: 'Передать заместителю',
};

export function AuthorityBar({ tournamentId, onChange }: { tournamentId: string; onChange?: (a: Authority) => void }) {
  const loaded = useAuthority(tournamentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const a = loaded.data;
  // Нет прав видеть (не бригада) — полосы нет.
  if (!a) return null;

  const run = async (fn: () => Promise<Authority>) => {
    setBusy(true);
    setError(null);
    try {
      const next = await fn();
      loaded.reload();
      onChange?.(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const mine = a.canRun && a.transferred;
  const viewOnly = !a.canRun;
  // Показать нечего (ведёт сам главный судья, передавать некому, журнала нет) — полосы нет.
  if (!viewOnly && !mine && !(a.canTransfer && a.candidates.length) && !a.canReturn && !a.log.length) return null;
  // Имени держателя на экране нет ✳ (24.11.2026, решение владельца продукта):
  // в углу — «Только просмотр» или «Полномочия у вас»; кто держит — в подсказке.
  const holder = a.holder ? a.holder.name + (a.transferred ? ' · ' + a.holder.positionLabel.toLowerCase() : '') + (a.since ? ' · с ' + when(a.since) : '') : '';
  return (
    <div
      className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pt-3 pb-1 text-[13px] max-md:px-4"
      data-testid="authority-bar"
      data-holder={a.holder?.position ?? ''}
      data-transferred={a.transferred || undefined}
    >
      {viewOnly && (
        <Chip size="sm" variant="soft" title={'Полномочия главного судьи: ' + holder} data-testid="authority-view-only">
          <Eye size={13} /> Только просмотр
        </Chip>
      )}
      {mine && (
        <Chip size="sm" variant="soft" color="accent" title={'С ' + (a.since ? when(a.since) : '')} data-testid="authority-mine">
          <UserRoundCog size={13} /> Полномочия у вас
        </Chip>
      )}
      {a.canTransfer &&
        a.candidates.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant="secondary"
            className="rounded-xl"
            isDisabled={busy}
            onPress={() => void run(() => transferAuthority(tournamentId, c.id))}
            data-testid="authority-transfer"
            data-to={c.position}
          >
            {TO[c.position] ?? 'Передать'} · {c.name}
          </Button>
        ))}
      {a.canReturn && (
        <Button size="sm" variant="primary" className="rounded-xl" isDisabled={busy} onPress={() => void run(() => returnAuthority(tournamentId))} data-testid="authority-return">
          <Undo2 size={14} /> Вернуть полномочия
        </Button>
      )}
      {a.log.length > 0 && (
        <Button size="sm" variant="ghost" className="rounded-xl" onPress={() => setLogOpen(true)} data-testid="authority-log-open">
          <History size={14} /> Журнал
        </Button>
      )}
      {error && <p className="m-0 w-full text-[12px] text-red-600">{error}</p>}
      <ModalSheet isOpen={logOpen} onOpenChange={setLogOpen} size="sm" testId="authority-log">
        <Modal.CloseTrigger aria-label="Закрыть" />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">Журнал полномочий</Modal.Heading>
        </Modal.Header>
        <Modal.Body>
          <ul className="m-0 flex list-none flex-col p-0">
            {a.log.map((e, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2 text-[13px] last:border-b-0" data-testid="authority-log-row">
                <span>
                  {e.action === 'transfer' ? (
                    <>
                      Передача · {e.by} → <b>{e.holder}</b>
                    </>
                  ) : (
                    <>
                      Возврат · {e.holder} → главный судья{e.by !== e.holder ? ' (' + e.by + ')' : ''}
                    </>
                  )}
                </span>
                <span className="shrink-0 text-neutral-500 tabular-nums">{when(e.at)}</span>
              </li>
            ))}
          </ul>
        </Modal.Body>
      </ModalSheet>
    </div>
  );
}
