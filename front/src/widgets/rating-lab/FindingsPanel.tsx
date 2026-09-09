'use client';

/* «Что показал прогон» — ради этого калибровка и нужна: не число рядом с
   фамилией, а поведение шкалы. Показатели считает сервер (`rating/analysis.py`)
   и присылает в ответе: это та же формула п. 9.3, и копия здесь разошлась бы с
   боевой. Экран только подаёт. */

import { num2, signed2, type PreviewResult } from '@/entities/rating';
import type { ParamOverrides } from '@/features/rating-lab/types';
import { Panel, StatTiles } from '@/shared/kit/app';

const pct = (x: number) => Math.round(x * 100) + ' %';

export function FindingsPanel({
  result,
  params,
}: {
  result: PreviewResult | null;
  params: ParamOverrides | null;
}) {
  if (!result || !params) {
    return (
      <Panel title="Что показал прогон">
        <p className="py-4 text-[13px] text-neutral-500">Расчёта ещё нет.</p>
      </Panel>
    );
  }

  const { history, table, injected, skipped, insights } = result;
  const capped = history.filter((h) => h.capped).length;
  const deltas = history.map((h) => h.delta);
  const maxUp = deltas.length ? Math.max(...deltas) : 0;
  const maxDown = deltas.length ? Math.min(...deltas) : 0;
  const новички = table.filter((r) => r.origin === 'new');
  const путь = insights.matches_new_to_kms;

  return (
    <Panel title="Что показал прогон" sub="Наблюдения считаются по текущим коэффициентам и текущим матчам">
      <StatTiles
        items={[
          { v: String(history.length / 2 || 0), k: 'матчей учтено' },
          { v: signed2(injected), k: 'изменение суммы рейтингов', tone: Math.abs(injected) > 1 ? 'a' : undefined },
          { v: String(capped), k: 'изменений обрезано потолком', tone: capped ? 'a' : undefined },
          { v: pct(insights.win_share_ms_over_kms), k: 'МС против КМС при этом D' },
        ]}
      />

      <ul className="flex flex-col gap-2 text-[13px] leading-snug text-neutral-700">
        <li>
          <b>Разброс за матч.</b> Наибольший рост {signed2(maxUp)}, наибольшее падение {signed2(maxDown)}.
          {params.max_delta > 0
            ? ' Потолок п. 12.1 стоит на ' + num2(params.max_delta) + '.'
            : ' Потолок п. 12.1 выключен — его значения в Положении нет.'}
        </li>
        <li>
          <b>Путь новичка со старта 1,00 до уровня КМС (40,00).</b>{' '}
          {путь === null ? (
            <span className="text-red-600">при текущих коэффициентах не доходит никогда</span>
          ) : (
            <>
              {путь} побед подряд над соперниками уровня 40,00
              {путь > params.transition_matches && (
                <span className="text-amber-700">
                  {' '}
                  — это дольше переходного периода в {params.transition_matches} матчей (п. 11.2)
                </span>
              )}
            </>
          )}
          .
        </li>
        {новички.map((н) => (
          <li key={н.id}>
            <b>{н.name}</b> — стартовал с {num2(н.start)}, после {н.matches}{' '}
            {н.matches === 1 ? 'матча' : 'матчей'} имеет {num2(н.rating)}
            {н.transition_left > 0 && '; переходного периода осталось ' + н.transition_left + ' матчей'}.
          </li>
        ))}
        <li>
          <b>Сумма рейтингов.</b> За прогон она изменилась на {signed2(injected)}. У строгой модели Эло сумма
          не меняется вовсе; здесь она плывёт, потому что у сторон бывает разный K (п. 11) и потому что
          P &gt; 1 добавляет призёрам (п. 10). На дистанции это инфляция шкалы: пороги КМС 40,00 и МС 50,00
          (п. 6) со временем перестанут значить то же самое.
        </li>
        {!!skipped.length && (
          <li className="text-amber-700">
            <b>Не учтено матчей: {skipped.length}.</b> {skipped.map((s) => s.reason).join('; ')}.
          </li>
        )}
      </ul>
    </Panel>
  );
}
