// Плашка счёта — то, что видит зритель. Чистая отрисовка состояния: ни сети, ни
// собственного состояния, чтобы одну и ту же плашку показывать и в эфире, и
// предпросмотром на пульте.

import {
  currentServer,
  isDoubles,
  isTeamMatch,
  statusText,
  teamLabel,
  type PlayerState,
  type ScoreboardState,
  type ServerSlot,
  type SideKey,
} from '@/entities/scoreboard/model';

import styles from './ScoreboardBoard.module.css';

/** Размер плашки = размер источника «Браузер» в OBS.
 *  Высота — с верхней строкой счёта команд; в одиночном и парном разряде
 *  плашка ниже, лишнее место в источнике остаётся прозрачным и в кадре не
 *  видно. В парном разряде вторая фамилия помещается в ту же высоту, поэтому
 *  источник в OBS перенастраивать не нужно. */
export const BOARD_SIZE = { width: 860, height: 170 } as const;

/** Строка имени: слева место под указатель подачи, чтобы фамилии не съезжали. */
function NameLine({ name, serving, slot }: { name: string; serving: boolean; slot: string }) {
  return (
    <span className={styles.nameLine}>
      <span
        className={styles.serve}
        data-on={serving || undefined}
        data-testid={`serve-${slot}`}
        aria-hidden="true"
      />
      <span className={styles.name}>{name}</span>
    </span>
  );
}

function Row({
  player,
  side,
  server,
  doubles,
}: {
  player: PlayerState;
  side: SideKey;
  server: ServerSlot;
  doubles: boolean;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.nameCell} data-side={side} data-doubles={doubles || undefined}>
        <div className={styles.names}>
          <NameLine name={player.name} serving={server === `${side}1`} slot={`${side}1`} />
          {doubles ? (
            <NameLine name={player.name2} serving={server === `${side}2`} slot={`${side}2`} />
          ) : null}
        </div>

        <div className={styles.marks}>
          {player.timeout ? (
            <span className={styles.timeout} data-testid={`timeout-${side}`}>
              Т
            </span>
          ) : null}
          {player.card ? (
            <span
              className={styles.card}
              data-card={player.card}
              data-testid={`card-${side}`}
              aria-label={player.card === 'red' ? 'красная карточка' : 'жёлтая карточка'}
            />
          ) : null}
        </div>
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

/** Счёт командной встречи — над игроками: он про всю встречу, а не про этот
 *  стол, и зритель читает его первым (образец федерации, 29.08.2026). */
function TeamStrip({ state }: { state: ScoreboardState }) {
  const left = teamLabel(state, 'left');
  const right = teamLabel(state, 'right');
  /* Названия команд заполняют не всегда, а в начале встречи — почти никогда.
     Без них полоса вырождалась в пару чисел посреди пустоты, и зритель не
     понимал, чей это счёт: всей встречи или этого стола. Пустое название
     заменяем подписью «СЧЁТ ВСТРЕЧИ» в середине — у чисел появляется хозяин,
     и плашка остаётся читаемой в эфире с первой секунды. */
  const named = Boolean(left || right);
  return (
    <div className={styles.teams} data-testid="team-score" data-named={named || undefined}>
      <span className={styles.teamName}>{left}</span>
      <span className={styles.teamScore}>
        {!named && <span className={styles.teamCaption}>счёт встречи</span>}
        <span data-testid="team-left">{state.team.left}</span>
        <span className={styles.teamColon}>:</span>
        <span data-testid="team-right">{state.team.right}</span>
      </span>
      <span className={styles.teamName} data-side="right">
        {right}
      </span>
    </div>
  );
}

export function ScoreboardBoard({ state }: { state: ScoreboardState }) {
  const status = statusText(state);
  const server = currentServer(state);
  const doubles = isDoubles(state);

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

        {isTeamMatch(state) ? <TeamStrip state={state} /> : null}

        <div className={styles.rows}>
          <Row player={state.left} side="left" server={server} doubles={doubles} />
          <Row player={state.right} side="right" server={server} doubles={doubles} />
        </div>
      </div>
    </div>
  );
}
