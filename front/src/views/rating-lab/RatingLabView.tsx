'use client';

/* Пилотный калькулятор Национального рейтинга.

   Зачем он есть. Федерация просила площадку, на которой можно «посмотреть
   показатели» до утверждения регламента: ввести спортсменов, свести матчи и
   увидеть, что делает с рейтингом формула из проекта Положения от 28.08.2026.
   Боевой рейтинг платформы (этап 6 плана, TZ §13.2) считается по протоколам
   турниров и запускается позже — здесь данные вводятся руками.

   Экран только собирает ввод и показывает вывод. Вся арифметика — в
   `entities/rating`, состояние — в `features/rating-lab`. Поменяется методика —
   поменяется entities, экран останется. */

import '@/shared/kit/tailwind.css';
import { useRatingLab } from '@/features/rating-lab/useRatingLab';
import { DEFAULT_PARAMS } from '@/entities/rating';
import {
  FindingsPanel,
  HistoryPanel,
  MatchesPanel,
  OpenQuestionsPanel,
  ParamsPanel,
  PlayersPanel,
  StandingsPanel,
  TournamentsPanel,
} from '@/widgets/rating-lab';

export function RatingLabView() {
  const lab = useRatingLab();

  return (
    <div className="hero-scope min-h-screen bg-neutral-50 text-neutral-900" data-theme="light">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Федерация настольного тенниса Республики Казахстан
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Пилотный калькулятор Национального рейтинга
          </h1>
          <p className="mt-1.5 max-w-3xl text-[13.5px] leading-snug text-neutral-600">
            Считает по проекту Положения о формировании и ведении Национального рейтинга спортсменов РК от
            28.08.2026. Введите спортсменов и матчи — рейтинг пересчитывается сразу. Коэффициенты, которых в
            проекте нет, вынесены в настройки и помечены: рядом с каждым числом видно, из документа оно или
            наше.
          </p>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-900">
            Это площадка для калибровки, а не официальный рейтинг. Значения D, K и потолка изменения в проекте
            Положения не заданы — пока федерация их не утвердит, любые числа отсюда условны.
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <PlayersPanel
            players={lab.players}
            params={lab.params}
            onAdd={lab.addPlayer}
            onUpdate={lab.updatePlayer}
            onRemove={lab.removePlayer}
          />
          <TournamentsPanel
            tournaments={lab.tournaments}
            players={lab.players}
            levelC={lab.params.levelC}
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
          <StandingsPanel table={lab.result.table} />
          <FindingsPanel result={lab.result} params={lab.params} />
          <ParamsPanel params={lab.params} onChange={lab.setParams} onReset={() => lab.setParams(DEFAULT_PARAMS)} />
        </div>
      </main>

      {/* История и открытые вопросы — во всю ширину: у истории одиннадцать
          колонок (§20 плюс слагаемые изменения), в колонке они уезжали в
          горизонтальную прокрутку и слагаемые никто бы не увидел. */}
      <section className="mx-auto max-w-[1400px] px-6 pb-2">
        <HistoryPanel history={lab.result.history} players={lab.players} />
        <OpenQuestionsPanel />
      </section>

      <footer className="mx-auto max-w-[1400px] px-6 pb-10 text-[12px] leading-snug text-neutral-500">
        Формула §9.2: Rнов = Rстар + P × K × C × (S − E), где E = 1 / (1 + 10^((Rсоперника − Rспортсмена) / D)).
        Коэффициент уровня C — таблица §13, коэффициент места P — §10.3, переходный период — §11, нижняя
        граница рейтинга 0,00 — §15.15.
      </footer>
    </div>
  );
}
