'use client';

/* Карточка спортсмена — публичная (ТЗ §3, экран Э0.4: «профиль игрока —
   рейтинг, статистика, история матчей»).

   Персональные данные ограничены рейтинговыми: п. 23.5 Положения разрешает
   публиковать только то, что нужно для идентификации спортсмена и работы
   рейтинга. Контакты и документы сюда не попадают вовсе — их нет в ответе.

   Председателю ГСК ✳ (10.09.2026) на той же карточке открывается правка — в
   полосе действий внизу одна кнопка «Редактировать» ✳ (03.11.2026, решение
   владельца продукта): исправленное значение и основание. «Зафиксировать
   неявку» и «Объединить» с карточки сняты тем же решением (ручки `no-show/` и
   `merge/` на сервере остались). Изменение рейтинга видно только здесь, в
   истории карточки: выпусков и апелляций нет.
   Отдельного экрана под правки нет намеренно: править
   значение, не видя истории, из которой оно сложилось, нельзя. Права всё
   равно проверяет сервер.

   Вид — профиль спортсмена ✳ (24.11.2026, решение владельца продукта: «это
   старый вид профиля»): тот же `PlayerProfileView`, что у кабинета спортсмена
   и страницы человека — шапка с фигурой и местом, показатели, динамика,
   личные встречи; ниже — история изменений таблицей со слагаемыми. */

import { useState } from 'react';

import { num2, signed2, useRatingCard, type RatingEntry } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { CorrectionDialog, RemoveDialog, RestoreButton } from '@/features/rating-admin';
import { EmptyBox } from '@/shared/kit/app';
import { PlayerProfileView } from '@/widgets/national';
import { CardHistory } from '@/widgets/rating';
import { RatingShell } from './RatingShell';

export function PlayerCardView({ userId }: { userId: string }) {
  const card = useRatingCard(userId);
  const { data, loading, error, reload } = card;
  const { isGskChairman } = useSession();
  const [done, setDone] = useState<string | null>(null);

  const finish = (entry: RatingEntry) => {
    // Удаление и возврат полосой «Записано» не отмечаются ✳ (27.11.2026,
    // решение владельца продукта): видно по строке в шапке профиля.
    if (entry.kind === 'remove' || entry.kind === 'restore') setDone(null);
    else setDone(entry.kindLabel.replace(/\s*\(.*\)$/, '') + ': ' + signed2(entry.delta) + ' → ' + num2(entry.after));
    reload();
  };

  // «Редактировать» ✳ (03.11.2026) и «Удалить из рейтинга» ✳ (27.11.2026,
  // решение владельца продукта). Удалённому — только «Вернуть в рейтинг».
  const removed = Boolean(data?.profile.removedAt);
  const actions =
    data && isGskChairman ? (
      removed ? (
        <RestoreButton userId={userId} onDone={finish} />
      ) : (
        <span className="flex items-center gap-2">
          <RemoveDialog userId={userId} name={data.profile.name} onDone={finish} />
          <CorrectionDialog userId={userId} name={data.profile.name} current={data.profile.value} onDone={finish} />
        </span>
      )
    ) : undefined;

  return (
    <RatingShell actions={actions} bleed>
      {done && (
        <p
          data-testid="chairman-result"
          className="shrink-0 border-b border-green-200 bg-green-50 px-6 py-2.5 text-[13px] text-green-800"
        >
          Записано — {done}
        </p>
      )}
      {error && (
        <div className="p-6">
          <EmptyBox
            title={error.includes('карточк') ? 'Карточки нет' : 'Карточка не загрузилась'}
            text={
              error.includes('карточк')
                ? 'У этого спортсмена ещё нет рейтинговой карточки — он не сыграл ни одного рейтингового матча.'
                : error + '. Проверьте, что рейтинговый сервис запущен.'
            }
          />
        </div>
      )}
      {!error && loading && !data && <p className="px-6 py-6 text-[13px] text-neutral-500">Карточка загружается…</p>}
      {!error && data && (
        <PlayerProfileView userId={userId} card={card} ownPage>
          <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white" data-testid="player-card">
            <h2 className="m-0 px-5 pt-5 pb-3 text-[15px] font-semibold">История изменения рейтинга</h2>
            <CardHistory history={data.history} />
          </section>
        </PlayerProfileView>
      )}
    </RatingShell>
  );
}
