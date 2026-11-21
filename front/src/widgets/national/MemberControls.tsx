'use client';

/* Правка члена сборной главным тренером ✳ (19.11.2026, флоу Э11.2; с
   22.11.2026 — в шапке профиля): личный тренер, состав и группа — выбором,
   «Убрать из сборной» — значком с подтверждением. Показывается только тем,
   кому сервер открыл правку состава (`access.roster`). HeroUI + Tailwind. */

import { AlertDialog, Button, Tooltip } from '@heroui/react';
import { UserMinus } from 'lucide-react';
import { useState } from 'react';

import {
  fetchPersonalCoaches,
  removeMember,
  updateMember,
  useLoad,
  type AgeGroup,
  type NationalMember,
  type Squad,
} from '@/entities/national';
import { AlertSheet } from '@/shared/ui/ModalSheet';
import { Picker } from '@/shared/ui/Picker';

import { AGE_GROUPS, SQUADS } from './RosterTable';

const NONE = 'none';

export function MemberControls({ member, onChanged, onRemoved }: { member: NationalMember; onChanged: () => void; onRemoved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const coaches = useLoad(fetchPersonalCoaches, 'coaches');

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
    <div className="flex flex-wrap items-end gap-2" data-testid="member-controls">
      <Picker
        label="Личный тренер"
        showLabel
        className="w-52 min-w-0"
        value={member.personalCoach?.id ?? NONE}
        options={[{ id: NONE, label: 'Без личного тренера' }, ...(coaches.data ?? []).map((c) => ({ id: c.id, label: c.name }))]}
        onChange={(k) => void run(() => updateMember(member.id, { personalCoachId: k === NONE ? null : k }), onChanged)}
        testId="strip-personal-coach"
      />
      <Picker
        label="Состав"
        showLabel
        className="w-40 min-w-0"
        value={member.squad}
        options={SQUADS}
        onChange={(k) => void run(() => updateMember(member.id, { squad: k as Squad }), onChanged)}
        testId="strip-squad"
      />
      <Picker
        label="Возрастная группа"
        showLabel
        className="w-40 min-w-0"
        value={member.ageGroup}
        options={AGE_GROUPS}
        onChange={(k) => void run(() => updateMember(member.id, { ageGroup: k as AgeGroup }), onChanged)}
        testId="strip-age-group"
      />
      <AlertDialog>
        <Tooltip>
          <Button isIconOnly variant="ghost" aria-label="Убрать из сборной" className="rounded-xl text-red-600" data-testid="member-remove">
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
            <p className="text-[14px]">{member.person.name}</p>
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
      {error && <p className="m-0 w-full text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
