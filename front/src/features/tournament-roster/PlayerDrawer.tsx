'use client';

/* Карточка спортсмена турнира ✳ (29.10.2026, решение владельца продукта):
   щелчок по строке «Спортсменов» открывает её справа — так же, как карточку
   судьи. Фото (или заглушка), имя, рейтинг до турнира и изменение за него,
   неявка. В подвале — значки с подсказкой «Профиль» и «Убрать из турнира» (с
   подтверждением; из начатого турнира сервер не уберёт и скажет почему).
   HeroUI `Drawer` + Tailwind. */

import { AlertDialog, Button, Chip, Drawer, Tooltip } from '@heroui/react';
import { UserMinus, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { removeParticipant, type TournamentParticipant } from '@/entities/tournament';
import { PersonAvatar } from '@/shared/ui/PersonAvatar';

const num = (v: number | null, signed = false) =>
  v === null ? '—' : (signed && v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',');

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 text-[14px]">
      <span className="text-neutral-600">{label}</span>
      <span className="font-medium tabular-nums">{children}</span>
    </div>
  );
}

export function PlayerDrawer({
  tournamentId,
  player,
  onClose,
  onRemoved,
}: {
  tournamentId: string;
  /** Чья карточка открыта; `null` — закрыта. */
  player: TournamentParticipant | null;
  onClose: () => void;
  /** Спортсмена убрали — таблица перечитывается. */
  onRemoved: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(p: TournamentParticipant) {
    setBusy(true);
    setError(null);
    try {
      await removeParticipant(tournamentId, p.id);
      onRemoved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const p = player;
  return (
    // Без обёртки-триггера: карточку открывает строка таблицы, а не кнопка.
    <Drawer.Backdrop
      isOpen={p !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onClose();
        }
      }}
    >
      {/* Ширина — у самой панели: `Content` у HeroUI — полоса на весь экран. */}
      <Drawer.Content placement="right">
        <Drawer.Dialog className="sm:w-[28rem]" data-testid="player-drawer">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-semibold">Спортсмен</Drawer.Heading>
          </Drawer.Header>
          {p && (
            <>
              <Drawer.Body className="flex flex-col gap-6">
                <div className="flex items-center gap-3" data-testid="player-profile">
                  <PersonAvatar name={p.name} src={p.avatar} size="lg" />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[16px] font-semibold">{p.name}</p>
                    {p.absent && (
                      <Chip size="sm" variant="soft" color="warning" className="mt-1">
                        неявка
                      </Chip>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-neutral-100 border-y border-neutral-100" data-testid="player-facts">
                  <Fact label="Рейтинг до">{num(p.ratingBefore)}</Fact>
                  <Fact label="Изменение">{num(p.ratingChange, true)}</Fact>
                </div>
                {error && (
                  <p className="text-[13px] text-red-600" data-testid="player-error">
                    {error}
                  </p>
                )}
              </Drawer.Body>

              <Drawer.Footer className="flex items-center gap-2">
                <Tooltip>
                  <Button
                    isIconOnly
                    variant="tertiary"
                    aria-label="Профиль"
                    className="rounded-xl"
                    onPress={() => router.push('/people/' + p.userId)}
                    data-testid="player-profile-open"
                  >
                    <UserRound size={18} />
                  </Button>
                  <Tooltip.Content>Профиль</Tooltip.Content>
                </Tooltip>

                {/* Убрать — с подтверждением: это действие не отменяется кнопкой «Назад». */}
                <AlertDialog>
                  <Tooltip>
                    <Button
                      isIconOnly
                      variant="tertiary"
                      aria-label="Убрать из турнира"
                      className="rounded-xl text-red-600"
                      isDisabled={busy}
                      data-testid="player-remove"
                    >
                      <UserMinus size={18} />
                    </Button>
                    <Tooltip.Content>Убрать из турнира</Tooltip.Content>
                  </Tooltip>
                  <AlertDialog.Backdrop>
                    <AlertDialog.Container>
                      <AlertDialog.Dialog className="rounded-xl" data-testid="player-remove-confirm">
                        <AlertDialog.Header>
                          <AlertDialog.Icon status="danger" />
                          <AlertDialog.Heading>Убрать из турнира?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                          <p className="text-[14px]">{p.name}</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                          <Button slot="close" variant="tertiary" className="rounded-xl">
                            Отмена
                          </Button>
                          <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void remove(p)}>
                            Убрать
                          </Button>
                        </AlertDialog.Footer>
                      </AlertDialog.Dialog>
                    </AlertDialog.Container>
                  </AlertDialog.Backdrop>
                </AlertDialog>
              </Drawer.Footer>
            </>
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
