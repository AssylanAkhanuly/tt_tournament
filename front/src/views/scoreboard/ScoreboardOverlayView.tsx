'use client';

// Страница-оверлей: её и вставляют источником «Браузер» в OBS.
// Ничего, кроме плашки: фон прозрачный, отступов нет — плашка прижата к
// левому верхнему углу, чтобы её было удобно позиционировать в сцене.

import { useScoreboardMirror } from '@/features/scoreboard-live/useScoreboardChannel';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';
import type { ScoreboardState } from '@/entities/scoreboard/model';

import styles from './ScoreboardOverlayView.module.css';

export function ScoreboardOverlayView({ initial }: { initial: ScoreboardState }) {
  const { state } = useScoreboardMirror(initial);

  return (
    <div className={styles.stage}>
      <ScoreboardBoard state={state} />
    </div>
  );
}
