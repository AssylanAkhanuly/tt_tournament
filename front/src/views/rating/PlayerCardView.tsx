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
   равно проверяет сервер. */

import { useState } from 'react';

import { num2, signed2, useRatingCard, type RatingEntry } from '@/entities/rating';
import { useSession } from '@/entities/session';
import { CorrectionDialog } from '@/features/rating-admin';
import { EmptyBox, useNarrow } from '@/shared/kit/app';
import { PlayerCard } from '@/widgets/rating';
import { RatingShell } from './RatingShell';

export function PlayerCardView({ userId }: { userId: string }) {
  const { data, loading, error, reload } = useRatingCard(userId);
  const { isGskChairman } = useSession();
  const narrow = useNarrow();
  const [done, setDone] = useState<string | null>(null);

  const finish = (entry: RatingEntry) => {
    setDone(entry.kindLabel.replace(/\s*\(.*\)$/, '') + ': ' + signed2(entry.delta) + ' → ' + num2(entry.after));
    reload();
  };

  // Одна кнопка — «Редактировать» ✳ (03.11.2026, решение владельца продукта).
  const actions =
    data && isGskChairman ? (
      <CorrectionDialog userId={userId} name={data.profile.name} current={data.profile.value} onDone={finish} />
    ) : undefined;

  // На всю рабочую область, без полей ✳ (03.11.2026): имя — в шапке карточки.
  // На телефоне имя несёт заголовок оболочки, и в карточке его не повторяем.
  return (
    <RatingShell title={narrow ? (data?.profile.name ?? 'Карточка спортсмена') : undefined} actions={actions} bleed>
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
      {!error && data && <PlayerCard card={data} showName={!narrow} />}
    </RatingShell>
  );
}
