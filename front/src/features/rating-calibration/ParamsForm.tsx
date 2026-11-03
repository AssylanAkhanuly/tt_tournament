'use client';

/* Коэффициенты расчёта ✳ (калибровка восстановлена 03.11.2026): черновик
   строками по группам — шкала, переходный период, уровень соревнования (C,
   п. 13), место (P, п. 10.3), перевод из ITTF (п. 17.4). Правка меняет
   черновик и сразу пересчитывает долю побед; действующими коэффициенты становятся
   по «Сохранить» в полосе внизу (`ParamsActions`). HeroUI + Tailwind. */

import { Button } from '@heroui/react';

import type { CompetitionLevel } from '@/entities/rating';
import { Choice, Group, Num, Row, Toggle } from './fields';
import { formulaFor } from './formulas';
import type { Calibration, ParamDraft } from './useCalibration';

export const LEVEL_LABEL: Record<CompetitionLevel, string> = {
  top: 'Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12',
  republic: 'Чемпионаты РК по возрастам, ЕЛНТ, республиканские',
  region: 'Областные и городские',
  amateur: 'Любительские',
};
const LEVELS = Object.keys(LEVEL_LABEL) as CompetitionLevel[];

const PRIZE_MODES: [ParamDraft['prize_mode'], string][] = [
  ['match', 'В каждом матче (п. 9.2)'],
  ['tournament', 'К итогу турнира (п. 10.6)'],
  ['none', 'Не применять'],
];
const BASELINES: [ParamDraft['baseline'], string][] = [
  ['sequential', 'Поматчево (п. 20)'],
  ['pre_tournament', 'От рейтинга до турнира (п. 8.1)'],
];

export function ParamsForm({ lab, canEdit }: { lab: Calibration; canEdit: boolean }) {
  const { draft, saving } = lab.params;
  if (!draft) return null;
  const off = !canEdit || saving;
  const set = lab.setParams;

  return (
    <div className="@container" data-testid="calibration-params">
      <Group title="Шкала">
        <Row label="D — масштаб шкалы" formula={formulaFor('d')}>
          <Num label="D" value={draft.d} step={0.5} min={1} onChange={(v) => set({ d: v })} isDisabled={off} testId="param-d" />
        </Row>
        <Row label="K стандартный" formula={formulaFor('k_standard')}>
          <Num label="K стандартный" value={draft.k_standard} step={0.05} onChange={(v) => set({ k_standard: v })} isDisabled={off} testId="param-k" />
        </Row>
        <Row label="Потолок изменения за матч" formula={formulaFor('max_delta')}>
          <Num label="Потолок" value={draft.max_delta} step={0.1} onChange={(v) => set({ max_delta: v })} isDisabled={off} testId="param-cap" />
        </Row>
        <Row label="База расчёта внутри турнира" formula={formulaFor('baseline')}>
          <Choice label="База расчёта" value={draft.baseline} options={BASELINES} onChange={(v) => set({ baseline: v })} isDisabled={off} />
        </Row>
      </Group>

      <Group title="Переходный период">
        <Row label="K переходного периода" formula={formulaFor('k_transition')}>
          <Num label="K переходного периода" value={draft.k_transition} step={0.1} onChange={(v) => set({ k_transition: v })} isDisabled={off} testId="param-k-transition" />
        </Row>
        <Row label="Матчей в переходном периоде" formula={formulaFor('transition_matches')}>
          <Num label="Матчей" value={draft.transition_matches} step={1} onChange={(v) => set({ transition_matches: Math.round(v) })} isDisabled={off} />
        </Row>
        <Row label="Потолок и в переходном периоде" formula={formulaFor('cap_in_transition')}>
          <Toggle label="Потолок в переходном периоде" value={draft.cap_in_transition} onChange={(v) => set({ cap_in_transition: v })} isDisabled={off} />
        </Row>
      </Group>

      <Group title="Уровень соревнования — C">
        {LEVELS.map((l) => (
          <Row key={l} label={LEVEL_LABEL[l]} formula={formulaFor('c_' + l)}>
            <Num
              label={'C · ' + LEVEL_LABEL[l]}
              value={draft.level_c[l]}
              step={0.05}
              onChange={(v) => set({ level_c: { ...draft.level_c, [l]: v } })}
              isDisabled={off}
              testId={'param-c-' + l}
            />
          </Row>
        ))}
      </Group>

      <Group title="Место — P">
        <Row label="Как применяется" formula={formulaFor('prize_mode')}>
          <Choice label="Как применяется P" value={draft.prize_mode} options={PRIZE_MODES} onChange={(v) => set({ prize_mode: v })} isDisabled={off} />
        </Row>
        {(['1', '2', '3'] as const).map((p) => (
          <Row key={p} label={p + ' место'} formula={formulaFor('p_first')}>
            <Num
              label={'P · ' + p + ' место'}
              value={draft.prize_p[p]}
              step={0.01}
              onChange={(v) => set({ prize_p: { ...draft.prize_p, [p]: v } })}
              isDisabled={off}
            />
          </Row>
        ))}
      </Group>

      <Group title="Перевод из ITTF">
        <Row label="Rmax" formula={formulaFor('ittf_r_max')}>
          <Num label="Rmax" value={draft.ittf_r_max} step={1} onChange={(v) => set({ ittf_r_max: v })} isDisabled={off} />
        </Row>
        <Row label="k" formula={formulaFor('ittf_k')}>
          <Num label="k перевода" value={draft.ittf_k} step={0.5} onChange={(v) => set({ ittf_k: v })} isDisabled={off} />
        </Row>
      </Group>
    </div>
  );
}

/** «Отменить» и «Сохранить» — в полосе внизу, неактивны без правок. */
export function ParamsActions({ lab }: { lab: Calibration }) {
  const { changed, saving, saveError } = lab.params;
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2">
      {saveError && (
        <p role="alert" className="mr-auto text-[13px] text-red-600" data-testid="params-error">
          {saveError}
        </p>
      )}
      <Button variant="tertiary" className="rounded-xl" isDisabled={!changed || saving} onPress={lab.resetParams} data-testid="params-reset">
        Отменить
      </Button>
      <Button
        variant="primary"
        className="rounded-xl"
        isDisabled={!changed || saving}
        onPress={() => void lab.saveParams()}
        data-testid="params-save"
      >
        Сохранить
      </Button>
    </div>
  );
}
