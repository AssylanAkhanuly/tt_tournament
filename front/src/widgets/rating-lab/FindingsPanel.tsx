'use client';

/* «Что показал прогон» — ради этого пилот и нужен: не число рядом с фамилией,
   а поведение шкалы. Считает `entities/rating/analysis`, здесь только подача. */

import { Panel, StatTiles } from '@/shared/kit/app';
import { matchesToLevel, winShare, type RatingParams, type RunResult } from '@/entities/rating';
import { num2, signed2 } from './controls';

const pct = (x: number) => Math.round(x * 100) + ' %';

export function FindingsPanel({ result, params }: { result: RunResult; params: RatingParams }) {
  const { history, table, injected, skipped } = result;

  const capped = history.filter((h) => h.capped).length;
  const deltas = history.map((h) => h.delta);
  const maxUp = deltas.length ? Math.max(...deltas) : 0;
  const maxDown = deltas.length ? Math.min(...deltas) : 0;

  const мсНадКмс = winShare(50, 40, params.D);
  const путьНовичка = matchesToLevel({ from: 1, level: 40, params });
  const новички = table.filter((r) => r.origin === 'новый');

  return (
    <Panel title="Что показал прогон" sub="Наблюдения считаются по текущим параметрам и текущим матчам">
      <StatTiles
        items={[
          { v: String(history.length / 2 || 0), k: 'матчей учтено' },
          { v: signed2(injected), k: 'изменение суммы рейтингов', tone: Math.abs(injected) > 1 ? 'a' : undefined },
          { v: String(capped), k: 'изменений обрезано потолком', tone: capped ? 'a' : undefined },
          { v: pct(мсНадКмс), k: 'МС против КМС при этом D' },
        ]}
      />

      <ul className="flex flex-col gap-2 text-[13px] leading-snug text-neutral-700">
        <li>
          <b>Разброс за матч.</b> Наибольший рост {signed2(maxUp)}, наибольшее падение {signed2(maxDown)}.
          {params.maxDelta > 0
            ? ' Потолок §12.1 стоит на ' + num2(params.maxDelta) + '.'
            : ' Потолок §12.1 выключен — его значения в Положении нет.'}
        </li>
        <li>
          <b>Путь новичка со старта 1,00 до уровня КМС (40,00).</b>{' '}
          {путьНовичка === null ? (
            <span className="text-red-600">при текущих параметрах не доходит никогда</span>
          ) : (
            <>
              {путьНовичка} побед подряд над соперниками уровня 40,00
              {путьНовичка > params.transitionMatches && (
                <span className="text-amber-700">
                  {' '}— это дольше переходного периода в {params.transitionMatches} матчей (§11.2)
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
            {н.transitionLeft > 0 && '; переходного периода осталось ' + н.transitionLeft + ' матчей'}.
          </li>
        ))}
        <li>
          <b>Сумма рейтингов.</b> За прогон она изменилась на {signed2(injected)}. У строгой модели Эло сумма
          не меняется вовсе; здесь она плывёт, потому что
          у сторон бывает разный K (§11) и потому что P &gt; 1 добавляет призёрам (§10). На дистанции это
          инфляция шкалы: пороги КМС 40,00 и МС 50,00 (§6) со временем перестанут значить то же самое.
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
