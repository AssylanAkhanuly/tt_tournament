'use client';

/* «Сведения» профиля ✳ (22.11.2026, образец владельца продукта Athlitiq —
   «Player Information»): строки «подпись слева — значение справа» через
   черту: состав, группа, личный тренер (штабу — меню выбора, `ValueSelect`),
   дата рождения, почта, телефон. Регион и «в сборной с» — в шапке. */

import type { ReactNode } from 'react';

import { AGE_GROUP_LABEL, dmy, SQUAD_LABEL, type AgeGroup, type NationalMember, type Squad } from '@/entities/national';

import { NO_COACH, useMemberEdit, ValueSelect } from '../MemberControls';
import { AGE_GROUPS, SQUADS } from '../RosterParts';
import { Panel } from './ui';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center justify-between gap-4 border-b border-neutral-100 py-2.5 text-[14px] first:pt-0 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-neutral-500">{label}</span>
      <span className="flex min-w-0 items-center justify-end text-right font-medium">{children}</span>
    </li>
  );
}

export function Facts({ member, canEdit, onChanged }: { member: NationalMember; canEdit: boolean; onChanged: () => void }) {
  const p = member.person;
  const pr = member.profile;
  const edit = useMemberEdit(canEdit);
  const coach = member.personalCoach?.name ?? 'Без личного тренера';
  return (
    <Panel title="Сведения" testId="member-strip">
      <ul className="m-0 flex list-none flex-col p-0">
        <Row label="Состав">
          {canEdit ? (
            <ValueSelect
              label="Состав"
              value={member.squad}
              text={SQUAD_LABEL[member.squad]}
              options={SQUADS}
              onChange={(k) => void edit.run(() => edit.update(member.id, { squad: k as Squad }), onChanged)}
              testId="strip-squad"
            />
          ) : (
            SQUAD_LABEL[member.squad]
          )}
        </Row>
        <Row label="Группа">
          {canEdit ? (
            <ValueSelect
              label="Возрастная группа"
              value={member.ageGroup}
              text={AGE_GROUP_LABEL[member.ageGroup]}
              options={AGE_GROUPS}
              onChange={(k) => void edit.run(() => edit.update(member.id, { ageGroup: k as AgeGroup }), onChanged)}
              testId="strip-age-group"
            />
          ) : (
            AGE_GROUP_LABEL[member.ageGroup]
          )}
        </Row>
        <Row label="Личный тренер">
          {canEdit ? (
            <ValueSelect
              label="Личный тренер"
              value={member.personalCoach?.id ?? NO_COACH}
              text={coach}
              options={[{ id: NO_COACH, label: 'Без личного тренера' }, ...edit.coaches.map((c) => ({ id: c.id, label: c.name }))]}
              onChange={(k) =>
                void edit.run(
                  () =>
                    edit.update(member.id, {
                      personalCoachId: k === NO_COACH ? null : k,
                    }),
                  onChanged,
                )
              }
              testId="strip-personal-coach"
            />
          ) : (
            <span className="truncate">{coach}</span>
          )}
        </Row>
        {(pr?.birthDate || p.birthYear) && <Row label="Дата рождения">{pr?.birthDate ? dmy(pr.birthDate) : p.birthYear}</Row>}
        {pr?.email && (
          <Row label="Эл. почта">
            <span className="truncate">{pr.email}</span>
          </Row>
        )}
        {pr?.phone && <Row label="Телефон">{pr.phone}</Row>}
      </ul>
      {edit.error && <p className="m-0 mt-3 text-[13px] text-red-600">{edit.error}</p>}
    </Panel>
  );
}
