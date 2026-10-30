'use client';

/* Карточка судьи турнира ✳ (28.10.2026, решение владельца продукта): щелчок по
   строке таблицы «Судьи» открывает её справа. Кто он (имя, почта) и его
   должность в этом турнире — со сменой тем же выбором, что при назначении.
   Действия — в подвале: «Профиль» (страница человека), «Убрать из турнира» (с
   подтверждением; в других турнирах он остаётся), «Сохранить». «Другие турниры»
   сняты (решение владельца продукта). HeroUI `Drawer` + Tailwind. */

import { AlertDialog, Avatar, Button, Drawer, Spinner, Tooltip } from '@heroui/react';
import { UserMinus, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  PositionPicker,
  changeRefereePosition,
  removeReferee,
  useRefereeCard,
  type RefereePosition,
} from '@/entities/tournament';


function Card({
  tournamentId,
  userId,
  taken,
  onChanged,
  onRemoved,
}: {
  tournamentId: string;
  userId: string;
  taken: { position: RefereePosition; name: string; id: string }[];
  onChanged: () => void;
  onRemoved: () => void;
}) {
  const router = useRouter();
  const card = useRefereeCard(tournamentId, userId);
  const [position, setPosition] = useState<RefereePosition | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Пришла карточка — выбор встаёт на текущую должность.
  useEffect(() => {
    if (card.data) setPosition(card.data.position);
  }, [card.data]);

  if (card.error) return <Drawer.Body className="text-[13px] text-red-600">{card.error}</Drawer.Body>;
  if (!card.data)
    return (
      <Drawer.Body>
        <Spinner className="mx-auto my-6 block" />
      </Drawer.Body>
    );
  const c = card.data;
  const changed = position !== null && position !== c.position;

  async function run(action: () => Promise<unknown>, after: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      after();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Drawer.Body className="flex flex-col gap-6">
        <div className="flex items-center gap-3" data-testid="referee-profile">
          <Avatar size="lg">
            <Avatar.Fallback>{c.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="text-[16px] font-semibold">{c.name}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">{c.email ?? 'почта не указана'}</p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500">Должность</h3>
          <PositionPicker value={position} onChange={setPosition} taken={taken} self={userId} />
        </section>

        {error && (
          <p className="text-[13px] text-red-600" data-testid="referee-error">
            {error}
          </p>
        )}
      </Drawer.Body>

      <Drawer.Footer className="flex items-center gap-2">
        {/* Второстепенные действия — значками с подсказкой ✳ (решение владельца
            продукта); подпись — и в подсказке, и в `aria-label`. */}
        <Tooltip>
          <Button
            isIconOnly
            variant="tertiary"
            aria-label="Профиль"
            className="rounded-xl"
            onPress={() => router.push('/people/' + userId)}
            data-testid="referee-profile-open"
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
              data-testid="referee-remove"
            >
              <UserMinus size={18} />
            </Button>
            <Tooltip.Content>Убрать из турнира</Tooltip.Content>
          </Tooltip>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog className="rounded-xl" data-testid="referee-remove-confirm">
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading>Убрать из турнира?</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p className="text-[14px]">{c.name}</p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="tertiary" className="rounded-xl">
                    Отмена
                  </Button>
                  <Button
                    slot="close"
                    variant="danger"
                    className="rounded-xl"
                    onPress={() => void run(() => removeReferee(tournamentId, userId), onRemoved)}
                  >
                    Убрать
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>

        <div className="flex-1" />
        <Button
          variant="primary"
          className="rounded-xl"
          isDisabled={!changed || busy}
          onPress={() =>
            void run(
              () => changeRefereePosition(tournamentId, userId, position!),
              () => {
                card.reload();
                onChanged();
              },
            )
          }
          data-testid="referee-save"
        >
          Сохранить
        </Button>
      </Drawer.Footer>
    </>
  );
}

export function RefereeDrawer({
  tournamentId,
  userId,
  taken,
  onClose,
  onChanged,
}: {
  tournamentId: string;
  /** Чья карточка открыта; `null` — закрыта. */
  userId: string | null;
  taken: { position: RefereePosition; name: string; id: string }[];
  onClose: () => void;
  /** Должность сменилась или судью убрали — таблица перечитывается. */
  onChanged: () => void;
}) {
  return (
    // Без обёртки-триггера: карточку открывает строка таблицы, а не кнопка.
    <Drawer.Backdrop isOpen={userId !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Ширина — у самой панели: `Content` у HeroUI — полоса на весь экран,
          прижимающая панель к правому краю; сузить её — увести панель влево. */}
      <Drawer.Content placement="right">
        <Drawer.Dialog className="sm:w-[28rem]" data-testid="referee-drawer">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-semibold">Судья</Drawer.Heading>
          </Drawer.Header>
          {userId && (
            <Card
              key={userId}
              tournamentId={tournamentId}
              userId={userId}
              taken={taken}
              onChanged={onChanged}
              onRemoved={() => {
                onChanged();
                onClose();
              }}
            />
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
