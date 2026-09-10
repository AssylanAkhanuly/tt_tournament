'use client';

/* Калибровка Национального рейтинга.

   Зачем она есть. Шесть коэффициентов Положение называет и не задаёт, а
   подобрать их можно только на фактических результатах. Экран даёт ввести
   спортсменов и матчи, покрутить коэффициенты и увидеть, что получится — на
   том же движке, которым считается боевой рейтинг.

   Расчёта здесь нет ✳ (10.09.2026): он на бэкенде, экран шлёт набор в ручку
   предпросчёта. Коэффициенты правит и делает действующими председатель ГСК
   (п. 8.3, 22).

   Раздел председателя ✳ (11.09.2026, карта функций рейтинга): гостя уводим
   на вход, как с остальных его разделов. Сами ручки чтения коэффициентов и
   предпросчёта остаются открытыми — это не граница прав, а место экрана в
   кабинете.

   Пояснительного текста на экране нет ✳ (10.09.2026, решение владельца
   продукта): ни заголовка с вводным абзацем, ни плашки об условности чисел, ни
   панели открытых вопросов — они живут в RATING.md и QUESTIONS.md §5. */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/entities/session';
import { useRatingLab } from '@/features/rating-lab/useRatingLab';
import { RatingShell } from '@/views/rating';
import {
  FindingsPanel,
  HistoryPanel,
  MatchesPanel,
  ParamsPanel,
  PlayersPanel,
  StandingsPanel,
  TournamentsPanel,
} from '@/widgets/rating-lab';

export function RatingLabView() {
  const router = useRouter();
  const lab = useRatingLab();
  const { loading: sessionLoading, isGskChairman } = useSession();

  useEffect(() => {
    if (!sessionLoading && !isGskChairman) router.replace('/login?next=/rating/calibration');
  }, [sessionLoading, isGskChairman, router]);

  return (
    <RatingShell active="Калибровка">
      {lab.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-800">
          Расчёт не выполнен: {lab.error}
        </div>
      )}

      {/* Две колонки — по ширине рабочей области, а не окна: у председателя
          слева меню роли, и при «широком» окне таблице прогона оставалось
          место на три буквы фамилии. */}
      <div className="@container">
        <div className="grid gap-6 @min-[72rem]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <PlayersPanel
              players={lab.players}
              startOf={lab.startOf}
              onAdd={lab.addPlayer}
              onUpdate={lab.updatePlayer}
              onRemove={lab.removePlayer}
            />
            <TournamentsPanel
              tournaments={lab.tournaments}
              players={lab.players}
              params={lab.params}
              onAdd={lab.addTournament}
              onUpdate={lab.updateTournament}
              onRemove={lab.removeTournament}
              onPlace={lab.setPlace}
            />
            <MatchesPanel
              matches={lab.matches}
              players={lab.players}
              tournaments={lab.tournaments}
              onAdd={lab.addMatch}
              onUpdate={lab.updateMatch}
              onRemove={lab.removeMatch}
              onClear={lab.clearMatches}
              onRoundRobin={lab.fillRoundRobin}
            />
          </div>

          <div className="min-w-0">
            <StandingsPanel table={lab.result?.table ?? []} calculating={lab.calculating} />
            <FindingsPanel result={lab.result} params={lab.params} />
            <ParamsPanel
              params={lab.params}
              sources={lab.sources}
              loading={lab.paramsLoading}
              error={lab.paramsError}
              saving={lab.saving}
              saveError={lab.saveError}
              canSave={isGskChairman}
              onChange={lab.setParams}
              onReset={lab.resetParams}
              onPublish={lab.publishParams}
            />
          </div>
        </div>
      </div>

      {/* История — во всю ширину: у неё одиннадцать колонок (п. 20 плюс
          слагаемые), в колонке они уезжали в прокрутку. */}
      <section className="mt-2">
        <HistoryPanel history={lab.result?.history ?? []} players={lab.players} />
      </section>
    </RatingShell>
  );
}
