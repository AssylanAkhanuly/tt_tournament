'use client';

/* Решение федерации по заявке клуба ✳ (19.11.2026, LEAGUE.md «Заявка клуба») —
   панель справа из «Команд» сезона, как карточка заявки судьи в турнире: кто
   подал, клуб и лига, состав, состояние и прежний комментарий; в подвале —
   «Открыть лигу», «Отклонить» (только с комментарием: клуб видит причину и
   подаёт снова) и «Принять». У решённой заявки решение можно поменять — сервер
   примет, пока сезон не завершён. HeroUI + Tailwind. */

import { Button, Drawer, Label, Spinner, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';

import { decideTeam, fetchTeam, TEAM_STATUS_LABEL, useLoad, type SeasonTeam } from '@/entities/league';

export function TeamDecision({
  team,
  onClose,
  onDecided,
  onOpenLeague,
}: {
  team: SeasonTeam | null;
  onClose: () => void;
  onDecided: () => void;
  onOpenLeague: (divisionId: string) => void;
}) {
  const detail = useLoad(() => (team ? fetchTeam(team.id) : Promise.resolve(null)), team?.id ?? 'none');
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setRejecting(false);
    setComment('');
    setError(null);
    onClose();
  }

  async function decide(decision: 'accept' | 'reject') {
    if (!team) return;
    setBusy(true);
    setError(null);
    try {
      await decideTeam(team.id, decision, comment.trim());
      onDecided();
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const row = (label: string, value: string) => (
    <div className="flex justify-between gap-4 border-b border-neutral-200 py-3 text-[14px]">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );

  return (
    <Drawer.Backdrop isOpen={!!team} onOpenChange={(open) => !open && close()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="sm:w-[28rem]" data-testid="team-decision">
          <Drawer.CloseTrigger aria-label="Закрыть" />
          <Drawer.Header className="border-b border-neutral-200 pb-4">
            <Drawer.Heading className="text-lg font-semibold">{team?.name}</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="pt-2">
            {team && (
              <>
                {row('Клуб', team.clubName)}
                {row('Лига', team.divisionName)}
                {row('Подал', team.submittedBy || '—')}
                {row('Заявка', TEAM_STATUS_LABEL[team.status])}
                {team.decisionComment && row('Комментарий', team.decisionComment)}
                <h3 className="pb-2 pt-5 text-[13px] font-semibold text-neutral-500">Состав</h3>
                {!detail.data ? (
                  <Spinner className="mx-auto my-4 block" />
                ) : detail.data.members.length === 0 ? (
                  <p className="text-[13px] text-neutral-500">Состав пуст</p>
                ) : (
                  <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-[14px]" data-testid="team-decision-squad">
                    {detail.data.members.map((m) => (
                      <li key={m.id}>
                        {m.name} <span className="text-neutral-500">· {m.region}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {rejecting && (
                  <TextField className="pt-5" value={comment} onChange={setComment} autoFocus>
                    <Label>Причина отказа</Label>
                    <TextArea className="rounded-xl" rows={3} data-testid="team-reject-comment" />
                  </TextField>
                )}
                {error && (
                  <p className="pt-3 text-[13px] text-red-600" data-testid="team-decision-error">
                    {error}
                  </p>
                )}
              </>
            )}
          </Drawer.Body>
          <Drawer.Footer className="flex justify-between gap-2">
            <Button variant="ghost" className="rounded-xl" onPress={() => team && onOpenLeague(team.divisionId)}>
              Открыть лигу
            </Button>
            <div className="flex gap-2">
              {rejecting ? (
                <Button
                  variant="danger"
                  className="rounded-xl"
                  isDisabled={!comment.trim() || busy}
                  onPress={() => void decide('reject')}
                  data-testid="team-reject-confirm"
                >
                  Отклонить
                </Button>
              ) : (
                <Button
                  variant="tertiary"
                  className="rounded-xl"
                  isDisabled={busy || team?.status === 'rejected'}
                  onPress={() => setRejecting(true)}
                  data-testid="team-reject"
                >
                  Отклонить
                </Button>
              )}
              <Button
                variant="primary"
                className="rounded-xl"
                isDisabled={busy || team?.status === 'accepted'}
                onPress={() => void decide('accept')}
                data-testid="team-accept"
              >
                Принять
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
