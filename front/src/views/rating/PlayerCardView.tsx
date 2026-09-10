'use client';

/* Карточка спортсмена — публичная (ТЗ §3, экран Э0.4: «профиль игрока —
   рейтинг, статистика, история матчей»).

   Персональные данные ограничены рейтинговыми: п. 23.5 Положения разрешает
   публиковать только то, что нужно для идентификации спортсмена и работы
   рейтинга. Контакты и документы сюда не попадают вовсе — их нет в ответе.

   Председателю ГСК ✳ (10.09.2026) на той же карточке открываются правки — по
   образцу макетов его роли: главные кнопки в полосе действий внизу, каждая
   открывает диалог. Здесь же он регистрирует письменную апелляцию (п. 21.2) и
   объединяет дубль с этой карточкой (п. 5.3) ✳ (11.09.2026). Отдельного
   экрана под правки нет намеренно: править значение, не видя истории, из
   которой оно сложилось, нельзя. Права всё равно проверяет сервер. */

import { Button } from '@heroui/react';
import { Ban, Merge, PenLine, Scale } from 'lucide-react';
import { useState } from 'react';

import {
  num2,
  ruDate,
  signed2,
  useRatingCard,
  type RatingAppeal,
  type RatingEntry,
  type RatingProfile,
} from '@/entities/rating';
import { useSession } from '@/entities/session';
import { AppealDialog, CorrectionDialog, MergeDialog, NoShowDialog } from '@/features/rating-admin';
import { EmptyBox } from '@/shared/kit/app';
import { PlayerCard } from '@/widgets/rating';
import { RatingShell } from './RatingShell';

type Ask = 'no_show' | 'correction' | 'appeal' | 'merge' | null;

export function PlayerCardView({ userId }: { userId: string }) {
  const { data, loading, error, reload } = useRatingCard(userId);
  const { isGskChairman } = useSession();
  const [ask, setAsk] = useState<Ask>(null);
  const [done, setDone] = useState<string | null>(null);

  const finish = (entry: RatingEntry) => {
    setAsk(null);
    setDone(entry.kindLabel.replace(/\s*\(.*\)$/, '') + ': ' + signed2(entry.delta) + ' → ' + num2(entry.after));
    reload();
  };

  const appealed = (appeal: RatingAppeal) => {
    setAsk(null);
    setDone('Апелляция №' + appeal.id + ' · рассмотреть до ' + ruDate(appeal.reviewUntil));
  };

  const merged = (kept: RatingProfile, droppedName: string) => {
    setAsk(null);
    setDone('Объединено: ' + droppedName + ' → ' + num2(kept.value));
    reload();
  };

  const actions =
    data && isGskChairman ? (
      <>
        <Button variant="ghost" data-testid="merge-open" onPress={() => setAsk('merge')}>
          <Merge size={15} /> Объединить
        </Button>
        <Button variant="ghost" data-testid="appeal-open" onPress={() => setAsk('appeal')}>
          <Scale size={15} /> Апелляция
        </Button>
        <Button variant="ghost" data-testid="noshow-open" onPress={() => setAsk('no_show')}>
          <Ban size={15} /> Зафиксировать неявку
        </Button>
        <Button variant="primary" data-testid="correction-open" onPress={() => setAsk('correction')}>
          <PenLine size={15} /> Исправить значение
        </Button>
      </>
    ) : undefined;

  return (
    <RatingShell title={data?.profile.name ?? 'Карточка спортсмена'} actions={actions}>
      {done && (
        <p
          data-testid="chairman-result"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-800"
        >
          Записано — {done}
        </p>
      )}
      {error && (
        <EmptyBox
          title={error.includes('карточк') ? 'Карточки нет' : 'Карточка не загрузилась'}
          text={
            error.includes('карточк')
              ? 'У этого спортсмена ещё нет рейтинговой карточки — он не сыграл ни одного рейтингового матча.'
              : error + '. Проверьте, что рейтинговый сервис запущен.'
          }
        />
      )}
      {!error && loading && !data && <p className="py-6 text-[13px] text-neutral-500">Карточка загружается…</p>}
      {!error && data && <PlayerCard card={data} />}

      {data && ask === 'no_show' && (
        <NoShowDialog userId={userId} name={data.profile.name} onClose={() => setAsk(null)} onDone={finish} />
      )}
      {data && ask === 'correction' && (
        <CorrectionDialog
          userId={userId}
          name={data.profile.name}
          current={data.profile.value}
          onClose={() => setAsk(null)}
          onDone={finish}
        />
      )}
      {data && ask === 'appeal' && (
        <AppealDialog userId={userId} name={data.profile.name} onClose={() => setAsk(null)} onDone={appealed} />
      )}
      {data && ask === 'merge' && (
        <MergeDialog userId={userId} name={data.profile.name} onClose={() => setAsk(null)} onDone={merged} />
      )}
    </RatingShell>
  );
}
