'use client';

/* Условия допуска в «Настройках» раздела «Спортсмены» ✳ (19.11.2026,
   ADMISSION.md): кто подаёт заявку, квота региона, предел участников. Их
   засевает вид соревнования, дальше они свои у турнира. Первая заявка их
   замораживает — поля неактивны, причина в подсказке у замка (пояснительного
   текста на экране нет — правило «Текст в интерфейсе»).

   Поле управляемое: черновик и сохранение — у панели (`RecruitmentSettings`).
   HeroUI + Tailwind. */

import { Button, Checkbox, CheckboxGroup, Input, Label, TextField, Tooltip } from '@heroui/react';
import { Lock } from 'lucide-react';

import { useApplicantKinds, type Admission } from '@/entities/tournament';

/** «12» → 12, пусто → null (без ограничения), не число — как было. */
const toLimit = (raw: string, prev: number | null): number | null => {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return null;
  const n = Number(digits);
  return n > 0 ? n : prev;
};

function LimitField({
  label,
  value,
  placeholder,
  isDisabled,
  testId,
  onChange,
}: {
  label: string;
  value: number | null;
  placeholder: string;
  isDisabled: boolean;
  testId: string;
  onChange: (v: number | null) => void;
}) {
  return (
    <TextField
      value={value === null ? '' : String(value)}
      onChange={(raw) => onChange(toLimit(raw, value))}
      isDisabled={isDisabled}
      className="flex flex-row items-center justify-between gap-3"
    >
      <Label className="text-[14px] font-medium">{label}</Label>
      <Input inputMode="numeric" placeholder={placeholder} className="w-36 rounded-xl" data-testid={testId} />
    </TextField>
  );
}

export function AdmissionFields({
  value,
  locked,
  onChange,
}: {
  value: Admission;
  locked: boolean;
  onChange: (a: Admission) => void;
}) {
  const kinds = useApplicantKinds();

  return (
    <section className="flex flex-col gap-4 border-t border-neutral-200 pt-5" data-testid="admission-settings" data-locked={locked}>
      <div className="flex items-center gap-2">
        <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wider text-neutral-500">Допуск</h3>
        {locked && (
          <Tooltip>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="Условия допуска заморожены"
              className="size-6 min-w-0 rounded-xl text-neutral-500"
              data-testid="admission-locked"
            >
              <Lock size={14} />
            </Button>
            <Tooltip.Content>Заявки уже поданы — условия допуска не меняются</Tooltip.Content>
          </Tooltip>
        )}
      </div>

      <CheckboxGroup
        value={value.applicantKinds}
        onChange={(keys) => onChange({ ...value, applicantKinds: keys as string[] })}
        isDisabled={locked}
        data-testid="admission-applicants"
      >
        <Label className="text-[14px] font-medium">Кто подаёт заявку</Label>
        {(kinds.data ?? []).map((k) => (
          <Checkbox key={k.key} value={k.key} data-testid={'admission-applicant-' + k.key}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>{k.label}</Label>
            </Checkbox.Content>
          </Checkbox>
        ))}
      </CheckboxGroup>

      <LimitField
        label="Квота региона"
        value={value.regionQuota}
        placeholder="Без квоты"
        isDisabled={locked}
        testId="admission-quota"
        onChange={(regionQuota) => onChange({ ...value, regionQuota })}
      />
      <LimitField
        label="Предел участников"
        value={value.participantLimit}
        placeholder="Без предела"
        isDisabled={locked}
        testId="admission-limit"
        onChange={(participantLimit) => onChange({ ...value, participantLimit })}
      />
    </section>
  );
}
