'use client';

/* Заявка на судейство ✳ (29.10.2026, Э0.10) — на странице турнира в кабинете
   судьи. Пока приём открыт, судья отмечает одну или несколько должностей и
   подаёт заявку; пока решения нет — может отозвать. После отказа, пока приём
   открыт, подаётся та же заявка заново. Решение видно здесь же. Правила —
   на сервере (`back/tournaments/recruitment.py`). HeroUI + Tailwind. */

import { Button, Card, Checkbox, CheckboxGroup, Chip, Label } from '@heroui/react';
import { useState } from 'react';

import {
  applyAsReferee,
  recruitmentLabel,
  REFEREE_POSITIONS,
  useMyRefereeApplication,
  withdrawRefereeApplication,
  type RefereePosition,
  type Recruitment,
} from '@/entities/tournament';

const LABEL = Object.fromEntries(REFEREE_POSITIONS.map((p) => [p.id, p.label])) as Record<string, string>;

export function ApplicationPanel({ tournamentId, recruitment }: { tournamentId: string; recruitment: Recruitment }) {
  const mine = useMyRefereeApplication(tournamentId);
  const [picked, setPicked] = useState<RefereePosition[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setPicked([]);
      mine.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const a = mine.data;
  const canApply = recruitment.active && (!a || a.status === 'rejected');

  return (
    <Card className="rounded-xl" data-testid="application-panel" data-status={a?.status ?? 'none'}>
      <Card.Header className="flex flex-row items-center justify-between gap-3">
        <Card.Title className="text-[15px] font-semibold">Заявка на судейство</Card.Title>
        <Chip
          size="sm"
          variant="soft"
          color={recruitment.active ? 'success' : 'default'}
          data-testid="recruitment-state"
        >
          {recruitmentLabel(recruitment)}
        </Chip>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {mine.error && <p className="text-[13px] text-red-600">{mine.error}</p>}

        {a && (
          <div className="flex flex-col gap-2 text-[14px]" data-testid="application-mine">
            <div className="flex items-center gap-2">
              {a.status === 'pending' && (
                <Chip size="sm" variant="soft" color="warning">
                  Ждёт решения
                </Chip>
              )}
              {a.status === 'accepted' && (
                <Chip size="sm" variant="soft" color="success">
                  Назначен: {LABEL[a.position ?? '']}
                </Chip>
              )}
              {a.status === 'rejected' && (
                <Chip size="sm" variant="soft" color="danger">
                  Отклонена
                </Chip>
              )}
            </div>
            {a.status !== 'accepted' && (
              <p className="text-neutral-600" data-testid="application-positions">
                {a.positions.map((p) => LABEL[p]).join(', ')}
              </p>
            )}
          </div>
        )}

        {canApply && (
          <CheckboxGroup
            aria-label="Должности"
            value={picked}
            onChange={(v) => setPicked(v as RefereePosition[])}
            data-testid="application-pick"
          >
            {REFEREE_POSITIONS.map((p) => (
              <Checkbox key={p.id} value={p.id}>
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>{p.label}</Label>
                </Checkbox.Content>
              </Checkbox>
            ))}
          </CheckboxGroup>
        )}

        {error && (
          <p className="text-[13px] text-red-600" data-testid="application-error">
            {error}
          </p>
        )}
      </Card.Content>
      {(canApply || a?.status === 'pending') && (
        <Card.Footer className="flex justify-end gap-2">
          {a?.status === 'pending' ? (
            <Button
              variant="tertiary"
              className="rounded-xl"
              isDisabled={busy}
              onPress={() => run(() => withdrawRefereeApplication(tournamentId))}
              data-testid="application-withdraw"
            >
              Отозвать заявку
            </Button>
          ) : (
            <Button
              variant="primary"
              className="rounded-xl"
              isDisabled={busy || picked.length === 0}
              onPress={() => run(() => applyAsReferee(tournamentId, picked))}
              data-testid="application-submit"
            >
              Подать заявку
            </Button>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
