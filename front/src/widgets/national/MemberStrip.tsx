'use client';

/* Шапка карточки члена сборной ✳ (19.11.2026, флоу Э11.2): фамилия, год и
   регион, рейтинг, допуск. Главному тренеру (`canEdit`) состав и группа —
   выбором прямо здесь, «Убрать из сборной» — значком с подтверждением.
   Полоса от края до края, черта снизу. HeroUI + Tailwind. */

import { AlertDialog, Button, Tooltip } from '@heroui/react';
import { UserMinus } from 'lucide-react';
import { useState } from 'react';

import {
  AGE_GROUP_LABEL,
  fetchPersonalCoaches,
  removeMember,
  useLoad,
  SQUAD_LABEL,
  updateMember,
  type AgeGroup,
  type NationalMember,
  type Squad,
} from '@/entities/national';
import { AlertSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

import { AGE_GROUPS, ClearanceChip, SQUADS } from './RosterTable';

export function MemberStrip({
  member,
  canEdit,
  onChanged,
  onRemoved,
}: {
  member: NationalMember;
  canEdit: boolean;
  onChanged: () => void;
  onRemoved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const p = member.person;
  const coaches = useLoad(() => (canEdit ? fetchPersonalCoaches() : Promise.resolve([])), canEdit ? 'coaches' : 'none');
  const NONE = 'none';

  async function run(action: () => Promise<unknown>, after: () => void) {
    setError(null);
    try {
      await action();
      after();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-neutral-200 px-6 py-4" data-testid="member-strip">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate text-[20px] font-semibold" data-testid="member-name">
          {p.name}
        </h1>
        <p className="m-0 text-[13px] text-neutral-500">{[p.birthYear, p.region].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="text-right">
        <div className="text-[20px] font-semibold tabular-nums">{p.rating ?? '—'}</div>
        <div className="text-[12px] text-neutral-500">рейтинг</div>
      </div>
      <ClearanceChip clearance={member.clearance} />
      {canEdit ? (
        <div className="flex items-center gap-2">
          <Picker
            label="Личный тренер"
            className="w-48 min-w-0"
            value={member.personalCoach?.id ?? NONE}
            options={[{ id: NONE, label: 'Без личного тренера' }, ...(coaches.data ?? []).map((c) => ({ id: c.id, label: c.name }))]}
            onChange={(k) => void run(() => updateMember(member.id, { personalCoachId: k === NONE ? null : k }), onChanged)}
            testId="strip-personal-coach"
          />
          <Picker
            label="Состав"
            className="w-40 min-w-0"
            value={member.squad}
            options={SQUADS}
            onChange={(k) => void run(() => updateMember(member.id, { squad: k as Squad }), onChanged)}
            testId="strip-squad"
          />
          <Picker
            label="Возрастная группа"
            className="w-36 min-w-0"
            value={member.ageGroup}
            options={AGE_GROUPS}
            onChange={(k) => void run(() => updateMember(member.id, { ageGroup: k as AgeGroup }), onChanged)}
            testId="strip-age-group"
          />
          <AlertDialog>
            <Tooltip>
              <Button isIconOnly variant="ghost" size="sm" aria-label="Убрать из сборной" className="rounded-xl text-red-600" data-testid="member-remove">
                <UserMinus size={16} />
              </Button>
              <Tooltip.Content>Убрать из сборной</Tooltip.Content>
            </Tooltip>
            <AlertSheet className="rounded-xl" testId="member-remove-confirm">
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Убрать из сборной?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-[14px]">{p.name}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" className="rounded-xl">
                  Отмена
                </Button>
                <Button slot="close" variant="danger" className="rounded-xl" onPress={() => void run(() => removeMember(member.id), onRemoved)}>
                  Убрать
                </Button>
              </AlertDialog.Footer>
            </AlertSheet>
          </AlertDialog>
        </div>
      ) : (
        <span className="text-[13px] text-neutral-600">
          {[SQUAD_LABEL[member.squad], AGE_GROUP_LABEL[member.ageGroup], member.personalCoach?.name].filter(Boolean).join(' · ')}
        </span>
      )}
      {error && <p className="m-0 w-full text-[13px] text-red-600">{error}</p>}
    </header>
  );
}
