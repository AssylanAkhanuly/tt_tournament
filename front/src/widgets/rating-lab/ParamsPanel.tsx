'use client';

/* Коэффициенты расчёта.

   Значения приходят с сервера — их вводит федерация, а не программист. Экран
   даёт покрутить их локально («а что если») и, если прав хватает, сохранить
   подобранное как действующее.

   Рядом с каждым полем стоит происхождение: шесть значений Положение называет
   и не задаёт, и число, не взятое из документа, обязано быть видно как наше.
   Пояснений под полями нет ✳ (10.09.2026, решение владельца продукта): что
   значит каждый коэффициент и откуда он взялся — RATING.md, раздел 3. */

import type { ReactNode } from 'react';

import type { ParamSource } from '@/entities/rating';
import type { ParamOverrides } from '@/features/rating-lab/types';
import { Panel } from '@/shared/kit/app';
import { Btn, Num, Select, Source } from './controls';

const PRIZE: { value: ParamOverrides['prize_mode']; label: string }[] = [
  { value: 'match', label: 'P в формуле каждого матча' },
  { value: 'tournament', label: 'P к итогу турнира' },
  { value: 'none', label: 'Без коэффициента места' },
];

const BASELINE: { value: ParamOverrides['baseline']; label: string }[] = [
  { value: 'sequential', label: 'Поматчево' },
  { value: 'pre_tournament', label: 'От рейтинга до турнира' },
];

function Row({
  label,
  source,
  children,
  wide,
}: {
  label: string;
  source?: ParamSource;
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

        <Row label="D — масштаб шкалы" source={sources.d}>
          <Num value={params.d} onChange={(v) => onChange({ d: v })} ariaLabel="Параметр D" step={1} min={1} testId="param-D" />
        </Row>
        <Row label="K стандартный (с 21-го матча)" source={sources.k_standard}>
          <Num
            value={params.k_standard}
            onChange={(v) => onChange({ k_standard: v })}
            ariaLabel="Коэффициент K стандартный"
            step={0.05}
            min={0}
            testId="param-k"
          />
        </Row>
        <Row label="K переходного периода" source={sources.k_transition}>
          <Num
            value={params.k_transition}
            onChange={(v) => onChange({ k_transition: v })}
            ariaLabel="Коэффициент K переходного периода"
            step={0.1}
            min={0}
          />
        </Row>
        <Row label="Длина переходного периода, матчей" source={sources.transition_matches}>
          <Num
            value={params.transition_matches}
            onChange={(v) => onChange({ transition_matches: Math.max(0, Math.round(v)) })}
            ariaLabel="Длина переходного периода"
            min={0}
          />
        </Row>
        <Row label="Потолок изменения за матч (0 — без потолка)" source={sources.max_delta}>
          <Num
            value={params.max_delta}
            onChange={(v) => onChange({ max_delta: Math.max(0, v) })}
            ariaLabel="Потолок изменения за матч"
            step={0.05}
            min={0}
            testId="param-cap"
          />
        </Row>
        <Row label="Резать потолком и переходный период" source={sources.cap_in_transition}>
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
        <Row label="Коэффициент места" source={sources.prize_mode} wide>
          <Select
            value={params.prize_mode}
            onChange={(v) => onChange({ prize_mode: v })}
            options={PRIZE}
            ariaLabel="Как применяется коэффициент места"
            testId="param-prize"
          />
        </Row>
        <Row label="База расчёта внутри турнира" source={sources.baseline} wide>
          <Select
            value={params.baseline}
            onChange={(v) => onChange({ baseline: v })}
            options={BASELINE}
            ariaLabel="База расчёта внутри турнира"
          />
        </Row>
        <Row label="Перевод из ITTF: Rmax и k" source={sources.ittf_r_max}>
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
