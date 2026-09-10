'use client';

/* Коэффициенты расчёта.

   Значения приходят с сервера — их вводит федерация, а не программист. Экран
   даёт покрутить их локально («а что если») и, если прав хватает, сохранить
   подобранное как действующее.

   Рядом с каждым полем стоит происхождение: шесть значений Положение называет
   и не задаёт, и число, не взятое из документа, обязано быть видно как наше. */

import type { ReactNode } from 'react';

import type { ParamSource } from '@/entities/rating';
import type { ParamOverrides } from '@/features/rating-lab/types';
import { Panel } from '@/shared/kit/app';
import { Btn, Num, Select, Source } from './controls';

const PRIZE: { value: ParamOverrides['prize_mode']; label: string }[] = [
  { value: 'match', label: 'P в формуле каждого матча (п. 9.2)' },
  { value: 'tournament', label: 'P к итогу турнира (п. 10.6)' },
  { value: 'none', label: 'Без коэффициента места' },
];

const BASELINE: { value: ParamOverrides['baseline']; label: string }[] = [
  { value: 'sequential', label: 'Поматчево — как в примере п. 20' },
  { value: 'pre_tournament', label: 'От рейтинга до турнира — как в п. 8.1' },
];

/** Пояснение к полю: чем оно управляет и почему стоит именно столько. */
const NOTES: Record<string, string> = {
  d: 'Параметр масштаба назван, значение не задано. Чем меньше D, тем резче шкала делит игроков; чем больше — тем ближе исход к монетке.',
  k_standard: 'Значение не задано. Задаёт цену обычного матча: при 0,60 равные соперники расходятся на ±0,30.',
  k_transition:
    '⚠ В Положении написано «пониженный коэффициент, обеспечивающий ускоренную адаптацию» — это противоречие: пониженный K замедляет. Для заявленной цели нужен повышенный.',
  transition_matches: '20 официальных матчей, считая с первого учтённого.',
  max_delta: 'Потолок объявлен, число отсутствует (пункт 12.2 в документе пропущен). 0 — считать без потолка.',
  cap_in_transition:
    'В Положении не разделено. Если потолок действует и в переходном периоде, новичок со старта 1,00 идёт до своего уровня втрое дольше.',
  prize_mode:
    'Два прочтения одного правила. Без потолка числа совпадают, но во втором надбавка не привязана к матчу, чего требует п. 4.6.',
  baseline: 'От какого значения считать матчи одного турнира. В Положении прямо не сказано.',
  ittf: 'Rmax = 90 и k = 10 приведены в Положении как значения «для целей примера», не как норма.',
  level_c: 'Таблица уровней соревнований задана полностью.',
  prize_p: '1 место — 1,20; 2 — 1,15; 3 — 1,10; 4 и ниже — 1,00.',
};

function Row({
  label,
  source,
  note,
  children,
  wide,
}: {
  label: string;
  source?: ParamSource;
  note: string;
  children: ReactNode;
  /** Поле шире подписи (выбор из списка) — тогда оно уходит строкой ниже. */
  wide?: boolean;
}) {
  return (
    <div className="border-t border-neutral-100 py-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium">{label}</span>
        <div className="flex shrink-0 items-center gap-2">
          {source && <Source fixed={source.fixed} clause={source.clause} />}
          {!wide && <div className="w-28">{children}</div>}
        </div>
      </div>
      {wide && <div className="mt-1.5">{children}</div>}
      <p className="mt-1 max-w-prose text-[11.5px] leading-snug text-neutral-500">{note}</p>
    </div>
  );
}

export function ParamsPanel({
  params,
  sources,
  loading,
  error,
  saving,
  saveError,
  canSave,
  onChange,
  onReset,
  onPublish,
}: {
  params: ParamOverrides | null;
  sources: Record<string, ParamSource>;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  canSave: boolean;
  onChange: (patch: Partial<ParamOverrides>) => void;
  onReset: () => void;
  onPublish: () => void;
}) {
  if (error) {
    return (
      <Panel title="Параметры расчёта">
        <p className="py-4 text-[13px] text-red-600">Коэффициенты не загрузились: {error}</p>
      </Panel>
    );
  }
  if (loading || !params) {
    return (
      <Panel title="Параметры расчёта">
        <p className="py-4 text-[13px] text-neutral-500">Загружаются действующие коэффициенты…</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Параметры расчёта"
      sub="Зелёное — из Положения, жёлтое — не задано в нём и требует решения федерации"
      extra={
        <div className="flex gap-2">
          <Btn onClick={onReset}>Вернуть действующие</Btn>
          {canSave ? (
            <Btn onClick={onPublish} tone="primary" testId="publish-params">
              {saving ? 'Сохраняю…' : 'Сделать действующими'}
            </Btn>
          ) : (
            /* Не прячем возможность совсем: иначе коэффициенты казались бы
               неизменяемыми. Показываем, кто их меняет и где войти. */
            <a
              href="/login?next=/rating/calibration"
              data-testid="publish-login"
              className="self-center text-[12.5px] text-blue-600 hover:underline"
            >
              Сохранить может председатель ГСК — войти
            </a>
          )}
        </div>
      }
    >
      <div data-testid="params">
        {saveError && <p className="mb-2 text-[12.5px] text-red-600">Не сохранилось: {saveError}</p>}

        <Row label="D — масштаб шкалы" source={sources.d} note={NOTES.d}>
          <Num value={params.d} onChange={(v) => onChange({ d: v })} ariaLabel="Параметр D" step={1} min={1} testId="param-D" />
        </Row>
        <Row label="K стандартный (с 21-го матча)" source={sources.k_standard} note={NOTES.k_standard}>
          <Num
            value={params.k_standard}
            onChange={(v) => onChange({ k_standard: v })}
            ariaLabel="Коэффициент K стандартный"
            step={0.05}
            min={0}
            testId="param-k"
          />
        </Row>
        <Row label="K переходного периода" source={sources.k_transition} note={NOTES.k_transition}>
          <Num
            value={params.k_transition}
            onChange={(v) => onChange({ k_transition: v })}
            ariaLabel="Коэффициент K переходного периода"
            step={0.1}
            min={0}
          />
        </Row>
        <Row
          label="Длина переходного периода, матчей"
          source={sources.transition_matches}
          note={NOTES.transition_matches}
        >
          <Num
            value={params.transition_matches}
            onChange={(v) => onChange({ transition_matches: Math.max(0, Math.round(v)) })}
            ariaLabel="Длина переходного периода"
            min={0}
          />
        </Row>
        <Row label="Потолок изменения за матч (0 — без потолка)" source={sources.max_delta} note={NOTES.max_delta}>
          <Num
            value={params.max_delta}
            onChange={(v) => onChange({ max_delta: Math.max(0, v) })}
            ariaLabel="Потолок изменения за матч"
            step={0.05}
            min={0}
            testId="param-cap"
          />
        </Row>
        <Row
          label="Резать потолком и переходный период"
          source={sources.cap_in_transition}
          note={NOTES.cap_in_transition}
        >
          <label className="flex items-center justify-end gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={params.cap_in_transition}
              onChange={(e) => onChange({ cap_in_transition: e.target.checked })}
              aria-label="Резать потолком переходный период"
            />
            {params.cap_in_transition ? 'да' : 'нет'}
          </label>
        </Row>
        <Row label="Коэффициент места" source={sources.prize_mode} note={NOTES.prize_mode} wide>
          <Select
            value={params.prize_mode}
            onChange={(v) => onChange({ prize_mode: v })}
            options={PRIZE}
            ariaLabel="Как применяется коэффициент места"
            testId="param-prize"
          />
        </Row>
        <Row label="База расчёта внутри турнира" source={sources.baseline} note={NOTES.baseline} wide>
          <Select
            value={params.baseline}
            onChange={(v) => onChange({ baseline: v })}
            options={BASELINE}
            ariaLabel="База расчёта внутри турнира"
          />
        </Row>
        <Row label="Перевод из ITTF: Rmax и k" source={sources.ittf_r_max} note={NOTES.ittf}>
          <div className="flex gap-1.5">
            <Num
              value={params.ittf_r_max}
              onChange={(v) => onChange({ ittf_r_max: v })}
              ariaLabel="Rmax перевода из ITTF"
              step={1}
            />
            <Num
              value={params.ittf_k}
              onChange={(v) => onChange({ ittf_k: v })}
              ariaLabel="Коэффициент k перевода из ITTF"
              step={0.5}
            />
          </div>
        </Row>
      </div>
    </Panel>
  );
}
