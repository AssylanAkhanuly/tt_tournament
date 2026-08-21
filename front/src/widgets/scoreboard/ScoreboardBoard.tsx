// Плашка счёта — то, что видит зритель. Чистая отрисовка состояния: ни сети, ни
// собственного состояния, чтобы одну и ту же плашку показывать и в эфире, и
// предпросмотром на пульте.

import { statusText, type PlayerState, type ScoreboardState } from '@/entities/scoreboard/model';

import styles from './ScoreboardBoard.module.css';

/** Размер плашки = размер источника «Браузер» в OBS.
 *  Высота — с нижней строкой командного счёта; без неё плашка ниже,
 *  лишнее место в источнике остаётся прозрачным и в кадре не видно. */
export const BOARD_SIZE = { width: 860, height: 160 } as const;

function Row({ player, side }: { player: PlayerState; side: 'left' | 'right' }) {
  return (
    <div className={styles.row}>
      <div className={styles.nameCell} data-side={side}>
        <span className={styles.name}>{player.name}</span>
      </div>
      <div className={styles.gamesCell} data-testid={`games-${side}`}>
        {player.games}
      </div>
      <div className={styles.pointsCell} data-testid={`points-${side}`}>
        {player.points}
      </div>
    </div>
  );
}

export function ScoreboardBoard({ state }: { state: ScoreboardState }) {
  const status = statusText(state);

  return (
    <div className={styles.board} data-hidden={!state.visible || undefined} data-testid="board">
      <div className={styles.body}>
        <div className={styles.header}>
          {state.match_label ? <span className={styles.chip}>{state.match_label}</span> : null}
          {state.round_label ? <span className={styles.chip}>{state.round_label}</span> : null}
          {status ? (
            <span className={styles.chipStatus} data-testid="status">
              {status}
            </span>
          ) : null}
        </div>

        <div className={styles.rows}>
          <Row player={state.left} side="left" />
          <Row player={state.right} side="right" />
        </div>

        {state.team.enabled ? (
          <div className={styles.footer} data-testid="team-score">
            {state.left.country} {state.team.left}-{state.team.right} {state.right.country}
          </div>
        ) : null}
      </div>
    </div>
  );
}
