'use client';

/* Параметры расчёта. Половина из них в Положении названа, но не задана — и это
   главное, что должен показывать пилот: где кончается документ и начинается
   наше допущение. Поэтому у каждого поля стоит метка происхождения, а не просто
   значение по умолчанию. */

import { Panel } from '@/shared/kit/app';
import { PARAM_SOURCES, type Baseline, type PrizeMode, type RatingParams } from '@/entities/rating';
import { Btn, Num, Select, Source } from './controls';

const PRIZE: { value: PrizeMode; label: string }[] = [
  { value: 'заматч', label: 'P в формуле каждого матча (§9.2)' },
  { value: 'затурнир', label: 'P к итогу турнира (§10.6)' },
  { value: 'нет', label: 'Без коэффициента места' },
];

const BASELINE: { value: Baseline; label: string }[] = [
  { value: 'поматчево', label: 'Поматчево — как в примере §20' },
  { value: 'дотурнира', label: 'От рейтинга до турнира — как в §8.1' },
];

const Row = ({
  label,
  source,
  children,
  wide,
}: {
  label: string;
  source: keyof typeof PARAM_SOURCES;
  children: React.ReactNode;
  /** Поле шире подписи (выбор из списка) — тогда оно уходит на строку ниже. */
  wide?: boolean;
}) => {
  const s = PARAM_SOURCES[source];
  return (
    <div className="border-t border-neutral-100 py-2.5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium">{label}</span>
        <div className="flex shrink-0 items-center gap-2">
          <Source fixed={s.fixed} clause={s.clause} />
          {!wide && <div className="w-28">{children}</div>}
        </div>
      </div>
      {wide && <div className="mt-1.5">{children}</div>}
      <p className="mt-1 max-w-prose text-[11.5px] leading-snug text-neutral-500">{s.note}</p>
    </div>
  );
};

export function ParamsPanel({
  params,
  onChange,
  onReset,
}: {
  params: RatingParams;
  onChange: (patch: Partial<RatingParams>) => void;
  onReset: () => void;
}) {
  return (
    <Panel
      title="Параметры расчёта"
      sub="Зелёное — из Положения, жёлтое — не задано в нём и требует решения федерации"
      extra={<Btn onClick={onReset}>Вернуть значения по умолчанию</Btn>}
    >
      <div data-testid="params">
        <Row label="D — масштаб шкалы" source="D">
          <Num value={params.D} onChange={(v) => onChange({ D: v })} ariaLabel="Параметр D" step={1} min={1} testId="param-D" />
        </Row>
        <Row label="K стандартный (с 21-го матча)" source="kStandard">
          <Num
            value={params.kStandard}
            onChange={(v) => onChange({ kStandard: v })}
            ariaLabel="Коэффициент K стандартный"
            step={0.05}
            min={0}
            testId="param-k"
          />
        </Row>
        <Row label="K переходного периода" source="kTransition">
          <Num
            value={params.kTransition}
            onChange={(v) => onChange({ kTransition: v })}
            ariaLabel="Коэффициент K переходного периода"
            step={0.1}
            min={0}
          />
        </Row>
        <Row label="Длина переходного периода, матчей" source="transitionMatches">
          <Num
            value={params.transitionMatches}
            onChange={(v) => onChange({ transitionMatches: Math.max(0, Math.round(v)) })}
            ariaLabel="Длина переходного периода"
            min={0}
          />
        </Row>
        <Row label="Потолок изменения за матч (0 — без потолка)" source="maxDelta">
          <Num
            value={params.maxDelta}
            onChange={(v) => onChange({ maxDelta: Math.max(0, v) })}
            ariaLabel="Потолок изменения за матч"
            step={0.05}
            min={0}
            testId="param-cap"
          />
        </Row>
        <Row label="Резать потолком и переходный период" source="capInTransition">
          <label className="flex items-center justify-end gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={params.capInTransition}
              onChange={(e) => onChange({ capInTransition: e.target.checked })}
              aria-label="Резать потолком переходный период"
            />
            {params.capInTransition ? 'да' : 'нет'}
          </label>
        </Row>
        <Row label="Коэффициент места" source="prizeMode" wide>
          <Select
            value={params.prizeMode}
            onChange={(v) => onChange({ prizeMode: v })}
            options={PRIZE}
            ariaLabel="Как применяется коэффициент места"
            testId="param-prize"
          />
        </Row>
        <Row label="База расчёта внутри турнира" source="baseline" wide>
          <Select
            value={params.baseline}
            onChange={(v) => onChange({ baseline: v })}
            options={BASELINE}
            ariaLabel="База расчёта внутри турнира"
          />
        </Row>
        <Row label="Перевод из ITTF: Rmax и k" source="ittf">
          <div className="flex gap-1.5">
            <Num
              value={params.ittf.rMax}
              onChange={(v) => onChange({ ittf: { ...params.ittf, rMax: v } })}
              ariaLabel="Rmax перевода из ITTF"
              step={1}
            />
            <Num
              value={params.ittf.k}
              onChange={(v) => onChange({ ittf: { ...params.ittf, k: v } })}
              ariaLabel="Коэффициент k перевода из ITTF"
              step={0.5}
            />
          </div>
        </Row>
      </div>
    </Panel>
  );
}
