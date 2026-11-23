'use client';

/* Состав команды на сезон ✳ (19.11.2026, LEAGUE.md): список с «Убрать» и поиск
   спортсменов для «Добавить». Один на федерацию (лига → «Команды») и на
   администратора клуба (кабинет `/club`). Можно ли менять состав, решает сервер
   (`canEdit` в ответе команды): клуб — пока идёт регистрация и заявка не
   принята, федерация — пока сезон не завершён. Нельзя — список только для
   чтения, без поиска. Над списком — то, что передал открывший (`children`:
   состояние заявки, причина отказа, «Подать снова»). HeroUI + Tailwind. */

import { Avatar, Button, Chip, ListBox, Modal, SearchField, Spinner } from '@heroui/react';
import { UserMinus, UserPlus } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import {
  addMember,
  fetchCandidates,
  fetchTeam,
  removeMember,
  TEAM_STATUS_LABEL,
  useLoad,
  type LeaguePerson,
  type TeamStatus,
} from '@/entities/league';
import { ModalSheet } from '@/shared/ui/ModalSheet';

const STATUS_COLOR: Record<TeamStatus, 'warning' | 'success' | 'danger'> = {
  submitted: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

/** Состояние заявки команды — значком. */
export function TeamStatusChip({ status }: { status: TeamStatus }) {
  return (
    <Chip size="sm" variant="soft" color={STATUS_COLOR[status]} data-testid="team-status" data-status={status}>
      {TEAM_STATUS_LABEL[status]}
    </Chip>
  );
}

export function SquadDialog({
  team,
  squadMax,
  onClose,
  onChanged,
  children,
}: {
  team: { id: string; name: string } | null;
  squadMax: number;
  onClose: () => void;
  onChanged: () => void;
  children?: ReactNode;
}) {
  const detail = useLoad(() => (team ? fetchTeam(team.id) : Promise.resolve(null)), team?.id ?? 'none');
  const canEdit = detail.data?.canEdit ?? false;
  const [q, setQ] = useState('');
  const [found, setFound] = useState<LeaguePerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!team || !canEdit) return;
    let live = true;
    const t = setTimeout(() => {
      fetchCandidates(team.id, q)
        .then((list) => live && setFound(list))
        .catch(() => live && setFound([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [team, q, canEdit, detail.data]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      detail.reload();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const members = detail.data?.members ?? [];
  return (
    <ModalSheet isOpen={!!team} onOpenChange={(open) => !open && onClose()} size="md" testId="squad-dialog">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading className="text-lg font-semibold">
              {team?.name} · состав {members.length}/{squadMax}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            {children}
            <ul className="m-0 flex list-none flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 p-0">
              {members.length === 0 && <li className="px-3 py-3 text-[13px] text-neutral-500">Состав пуст</li>}
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2" data-testid="squad-member" data-name={m.name}>
                  <Avatar size="sm">
                    <Avatar.Fallback className="text-[11px]">{m.name.slice(0, 2)}</Avatar.Fallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{m.name}</span>
                  <span className="text-[12px] text-neutral-500">{m.region}</span>
                  {canEdit && (
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      aria-label="Убрать из состава"
                      className="rounded-xl text-red-600"
                      onPress={() => void run(() => removeMember(team!.id, m.id))}
                      data-testid="squad-remove"
                    >
                      <UserMinus size={16} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {canEdit && (
              <>
                <SearchField aria-label="Поиск спортсменов" value={q} onChange={setQ}>
                  <SearchField.Group className="rounded-xl">
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Добавить: фамилия или имя" data-testid="squad-search" />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
                <div className="max-h-56 overflow-y-auto">
                  {!found ? (
                    <Spinner className="mx-auto my-4 block" />
                  ) : (
                    <ListBox
                      aria-label="Кандидаты"
                      renderEmptyState={() => <p className="py-4 text-center text-[13px] text-neutral-500">Никого не найдено</p>}
                      onAction={(id) => void run(() => addMember(team!.id, String(id)))}
                    >
                      {found.map((p) => (
                        <ListBox.Item
                          key={p.id}
                          id={p.id}
                          textValue={p.name}
                          className="rounded-xl"
                          data-testid="squad-candidate"
                          data-name={p.name}
                        >
                          <span className="flex w-full items-center gap-2">
                            <UserPlus size={15} className="text-brand-600" />
                            <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            <span className="text-[12px] text-neutral-500">{p.region}</span>
                          </span>
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  )}
                </div>
              </>
            )}
            {error && <p className="text-[13px] text-red-600" data-testid="squad-error">{error}</p>}
          </Modal.Body>
        </ModalSheet>
  );
}
