'use client';

/* Карточка заявки судьи ✳ (29.10.2026, решение владельца продукта): щелчок по
   строке «Заявок» открывает её справа — так же, как карточку судьи в
   «Коллегии». Кто подал (имя, почта), когда и решение; должность выбирается из
   отмеченных в заявке (единственные занятые недоступны и подписаны, кем
   заняты). Действия — в подвале: «Профиль» значком, «Отклонить» и «Назначить»;
   у решённой заявки — только «Профиль». Назначенный встаёт в коллегию турнира;
   после решения карточка закрывается, решение видно в строке.
   HeroUI `Drawer` + Tailwind. */

import { Avatar, Button, Chip, Drawer, Tooltip } from '@heroui/react';
import { UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  decideRefereeApplication,
  PositionPicker,
  REFEREE_POSITIONS,
  type ApplicationStatus,
  type RefereeApplication,
  type RefereePosition,
} from '@/entities/tournament';

const STATUS: Record<ApplicationStatus, { label: string; color: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Ждёт решения', color: 'warning' },
  accepted: { label: 'Назначен', color: 'success' },
  rejected: { label: 'Отклонена', color: 'danger' },
};

const LABEL = Object.fromEntries(REFEREE_POSITIONS.map((p) => [p.id, p.label])) as Record<string, string>;

function Card({
  tournamentId,
  application: a,
  taken,
  onDecided,
}: {
  tournamentId: string;
  application: RefereeApplication;
  taken: { position: RefereePosition; name: string; id: string }[];
  onDecided: () => void;
}) {
  const router = useRouter();
  const pending = a.status === 'pending';
  // Сразу выбрана первая свободная из отмеченных: чаще всего её и назначают.
  const free = a.positions.find((p) => !REFEREE_POSITIONS.find((x) => x.id === p)?.single || !taken.some((t) => t.position === p));
  const [position, setPosition] = useState<RefereePosition | null>(pending ? (free ?? null) : a.position);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: { accept: RefereePosition } | 'reject') {
    setBusy(true);
    setError(null);
    try {
      await decideRefereeApplication(tournamentId, a.id, decision);
      onDecided();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Drawer.Body className="flex flex-col gap-6">
        <div className="flex items-center gap-3" data-testid="application-profile">
          <Avatar size="lg">
            <Avatar.Fallback>{a.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="text-[16px] font-semibold">{a.name}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">{a.email ?? 'почта не указана'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[13px] text-neutral-600">
          <Chip size="sm" variant="soft" color={STATUS[a.status].color} data-testid="application-status">
            {STATUS[a.status].label}
            {a.status === 'accepted' && a.position ? ': ' + LABEL[a.position] : ''}
          </Chip>
          <span>Подана {a.createdAt.toLocaleDateString('ru-RU')}</span>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500">Должность</h3>
          <PositionPicker
            value={position}
            onChange={setPosition}
            taken={taken}
            only={a.positions}
            isDisabled={!pending}
          />
        </section>

        {error && (
          <p className="text-[13px] text-red-600" data-testid="application-error">
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
            onPress={() => router.push('/people/' + a.userId)}
            data-testid="application-profile-open"
          >
            <UserRound size={18} />
          </Button>
          <Tooltip.Content>Профиль</Tooltip.Content>
        </Tooltip>
        <div className="flex-1" />
        {pending && (
          <>
            <Button
              variant="tertiary"
              className="rounded-xl text-red-600"
              isDisabled={busy}
              onPress={() => void decide('reject')}
              data-testid="application-reject"
            >
              Отклонить
            </Button>
            <Button
              variant="primary"
              className="rounded-xl"
              isDisabled={busy || !position}
              onPress={() => void decide({ accept: position! })}
              data-testid="application-accept"
            >
              Назначить
            </Button>
          </>
        )}
      </Drawer.Footer>
    </>
  );
}

export function ApplicationDrawer({
  tournamentId,
  application,
  taken,
  onClose,
  onDecided,
}: {
  tournamentId: string;
  /** Чья заявка открыта; `null` — закрыта. */
  application: RefereeApplication | null;
  /** Занятые должности турнира. */
  taken: { position: RefereePosition; name: string; id: string }[];
  onClose: () => void;
  /** Заявку решили — таблицы перечитываются. */
  onDecided: () => void;
}) {
  return (
    // Без обёртки-триггера: карточку открывает строка таблицы, а не кнопка.
    <Drawer.Backdrop isOpen={application !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Ширина — у самой панели: `Content` у HeroUI — полоса на весь экран. */}
      <Drawer.Content placement="right">
        <Drawer.Dialog className="sm:w-[28rem]" data-testid="application-drawer">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-semibold">Заявка</Drawer.Heading>
          </Drawer.Header>
          {application && (
            <Card
              key={application.id + application.status}
              tournamentId={tournamentId}
              application={application}
              taken={taken}
              onDecided={onDecided}
            />
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
