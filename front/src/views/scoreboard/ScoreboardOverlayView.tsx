'use client';

// Страница-оверлей: её и вставляют источником «Браузер» в OBS.
// Ничего, кроме плашки: фон прозрачный, отступов нет — плашка прижата к
// левому верхнему углу, чтобы её было удобно позиционировать в сцене.

import { useScoreboardMirror } from '@/features/scoreboard-live/useScoreboardChannel';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';
import type { ScoreboardState } from '@/entities/scoreboard/model';

/** Прозрачный фон — OBS подкладывает под источник видео сцены. Фон страницы
 *  задан на `body` для всего приложения, поэтому сцена снимает его сама —
 *  только там, где стоит (`:has`). Селектор целиком в `:where()`, с нулевой
 *  специфичностью: фон, заданный странице поверх (свой CSS источника в OBS,
 *  синяя «сцена» в e2e-снимке), обязан его перебивать, как и раньше. Тот же
 *  класс у полосы партнёров. */
const STAGE = 'inline-block overflow-hidden [:where(:is(html,body):has(&))]:[background:transparent]';

export function ScoreboardOverlayView({ initial }: { initial: ScoreboardState }) {
  const { state } = useScoreboardMirror(initial);

  return (
    <div className={STAGE}>
      <ScoreboardBoard state={state} />
    </div>
  );
}
