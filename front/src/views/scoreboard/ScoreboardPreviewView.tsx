'use client';

// Предпросмотр эфира: плашка счёта и полоса партнёров в одном кадре 16:9
// поверх нарисованного зала. В OBS это два отдельных источника, и где им
// стоять, решает режиссёр; здесь они расставлены так, как на образце — счёт
// слева сверху, партнёры слева снизу, на тёмном полу.
// Счёт живой: кадр слушает ту же доску, что и оверлей.

import { useScoreboardMirror } from '@/features/scoreboard-live/useScoreboardChannel';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';
import { SponsorStrip } from '@/widgets/scoreboard/SponsorStrip';
import type { ScoreboardState } from '@/entities/scoreboard/model';

import styles from './ScoreboardPreviewView.module.css';

export function ScoreboardPreviewView({
  initial,
  label,
  light = false,
}: {
  initial: ScoreboardState;
  label?: string;
  /** Светлый кадр: проверить, читаются ли белые знаки без тёмного пола. */
  light?: boolean;
}) {
  const { state } = useScoreboardMirror(initial);

  return (
    <div className={styles.screen}>
      <div className={styles.frame} data-light={light || undefined} data-testid="preview-frame">
        <div className={styles.hall} aria-hidden>
          <div className={styles.floor} />
          <div className={styles.table} />
          <div className={styles.net} />
        </div>
        <div className={styles.board}>
          <ScoreboardBoard state={state} />
        </div>
        <div className={styles.sponsors}>
          <SponsorStrip label={label} />
        </div>
      </div>
    </div>
  );
}
