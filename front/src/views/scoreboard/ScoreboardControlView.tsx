'use client';

// Пульт табло. Оператор ведёт счёт здесь — в эфире он меняется через доли
// секунды. Счёт хранит Django (строка на стол), пульт пишет туда получившееся
// состояние, плашка в OBS слушает поток изменений. Локально действие
// применяется сразу, поэтому кнопки не «залипают» на время запроса.
//
// На экране только то, чем ведут счёт: предпросмотр эфира, две стороны и
// действия над партией. Параметры матча (тип, круг, до скольких партий,
// командная строка) живут в состоянии доски и правятся через API.

import { useEffect } from 'react';

import {
  currentServer,
  isGameOver,
  type ScoreboardState,
  type SideKey,
} from '@/entities/scoreboard/model';
import { useScoreboardControl } from '@/features/scoreboard-live/useScoreboardChannel';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';

import styles from './ScoreboardControlView.module.css';

export function ScoreboardControlView({ initial }: { initial: ScoreboardState }) {
  const { state, send } = useScoreboardControl(initial);

  // Горячие клавиши — по `event.code`, а не по букве: раскладка (рус/eng) на
  // них не влияет, оператору не нужно переключаться посреди партии. Набор в
  // полях ввода не перехватываем.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.code) {
        case 'Digit1':
          send({ type: 'point', side: 'left', delta: 1 });
          break;
        case 'Digit2':
          send({ type: 'point', side: 'right', delta: 1 });
          break;
        case 'KeyQ':
          send({ type: 'point', side: 'left', delta: -1 });
          break;
        case 'KeyW':
          send({ type: 'point', side: 'right', delta: -1 });
          break;
        case 'KeyG':
          send({ type: 'finishGame' });
          break;
        case 'KeyH':
          send({ type: 'patch', patch: { visible: !state.visible } });
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [send, state.visible]);

  // `title` на экране не подписан — стороны видно по расположению. Он остаётся
  // в aria-label: иначе две одинаковые пары кнопок неразличимы для читалки
  // экрана и для тестов.
  const server = currentServer(state);

  const sideBlock = (side: SideKey, title: string) => {
    const player = state[side];
    const doubles = Boolean(player.name2.trim() || state[side === 'left' ? 'right' : 'left'].name2.trim());

    return (
      <section className={styles.side} key={side} aria-label={title}>
        <label className={styles.field}>
          <span className={styles.label}>Фамилия и имя</span>
          <input
            className={styles.input}
            value={player.name}
            aria-label={`Имя — ${title}`}
            onChange={(event) =>
              send({ type: 'patch', patch: { [side]: { name: event.target.value } } })
            }
          />
        </label>

        {/* Заполненное второе имя и делает разряд парным — отдельного
            переключателя нет. */}
        <label className={styles.field}>
          <span className={styles.label}>Второй игрок (пары)</span>
          <input
            className={styles.input}
            value={player.name2}
            aria-label={`Второй игрок — ${title}`}
            onChange={(event) =>
              send({ type: 'patch', patch: { [side]: { name2: event.target.value } } })
            }
          />
        </label>

        <div className={styles.toggles}>
          <button
            type="button"
            className={styles.toggle}
            data-on={server === `${side}1` || undefined}
            aria-label={`Подача — ${title}`}
            onClick={() => send({ type: 'serve', slot: `${side}1` })}
          >
            Подача{doubles ? ' 1' : ''}
          </button>

          {doubles ? (
            <button
              type="button"
              className={styles.toggle}
              data-on={server === `${side}2` || undefined}
              aria-label={`Подача второго — ${title}`}
              onClick={() => send({ type: 'serve', slot: `${side}2` })}
            >
              Подача 2
            </button>
          ) : null}

          <button
            type="button"
            className={styles.toggle}
            data-on={player.timeout || undefined}
            aria-label={`Тайм-аут — ${title}`}
            onClick={() => send({ type: 'timeout', side })}
          >
            Тайм-аут
          </button>

          <button
            type="button"
            className={styles.toggle}
            data-card={player.card || undefined}
            aria-label={`Карточка — ${title}`}
            onClick={() => send({ type: 'card', side })}
          >
            Карточка
          </button>
        </div>

        <div className={styles.counters}>
          <div className={styles.counter}>
            <span className={styles.label}>Очки</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.step}
                aria-label={`Очко минус — ${title}`}
                onClick={() => send({ type: 'point', side, delta: -1 })}
              >
                −
              </button>
              <output className={styles.value} data-testid={`ctl-points-${side}`}>
                {player.points}
              </output>
              <button
                type="button"
                className={`${styles.step} ${styles.stepPrimary}`}
                aria-label={`Очко плюс — ${title}`}
                onClick={() => send({ type: 'point', side, delta: 1 })}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.counter}>
            <span className={styles.label}>Партии</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.step}
                aria-label={`Партия минус — ${title}`}
                onClick={() => send({ type: 'game', side, delta: -1 })}
              >
                −
              </button>
              <output className={styles.value} data-testid={`ctl-games-${side}`}>
                {player.games}
              </output>
              <button
                type="button"
                className={styles.step}
                aria-label={`Партия плюс — ${title}`}
                onClick={() => send({ type: 'game', side, delta: 1 })}
              >
                +
              </button>
            </div>
          </div>

          {state.team.enabled ? (
            <div className={styles.counter}>
              <span className={styles.label}>Команда</span>
              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.step}
                  aria-label={`Командный счёт минус — ${title}`}
                  onClick={() => send({ type: 'teamScore', side, delta: -1 })}
                >
                  −
                </button>
                <output className={styles.value}>{state.team[side]}</output>
                <button
                  type="button"
                  className={styles.step}
                  aria-label={`Командный счёт плюс — ${title}`}
                  onClick={() => send({ type: 'teamScore', side, delta: 1 })}
                >
                  +
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.previewWrap} aria-label="Предпросмотр плашки">
        <div className={styles.preview}>
          <ScoreboardBoard state={state} />
        </div>
      </section>

      <div className={styles.sides}>
        {sideBlock('left', 'Слева')}
        {sideBlock('right', 'Справа')}
      </div>

      <section className={styles.actions}>
        <button
          type="button"
          className={`${styles.action} ${isGameOver(state) ? styles.actionHot : ''}`}
          onClick={() => send({ type: 'finishGame' })}
        >
          Завершить партию
        </button>
        <button type="button" className={styles.action} onClick={() => send({ type: 'resetMatch' })}>
          Новый матч
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={() => send({ type: 'patch', patch: { visible: !state.visible } })}
        >
          {state.visible ? 'Скрыть плашку' : 'Показать плашку'}
        </button>
      </section>
    </main>
  );
}
