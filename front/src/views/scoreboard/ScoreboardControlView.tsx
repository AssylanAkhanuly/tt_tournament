'use client';

// Пульт табло. Оператор ведёт счёт здесь — в эфире он меняется через доли
// секунды. Счёт хранит Django (строка на стол), пульт пишет туда получившееся
// состояние, плашка в OBS слушает поток изменений. Локально действие
// применяется сразу, поэтому кнопки не «залипают» на время запроса.
//
// На экране только то, чем ведут счёт: разряд встречи, предпросмотр эфира, две
// стороны и действия над партией. Остальные параметры матча (тип, круг, до
// скольких партий, коды стран) живут в состоянии доски и правятся через API.

import { useEffect } from 'react';

import {
  currentServer,
  isDoubles,
  isGameOver,
  isTeamMatch,
  type MatchMode,
  type ScoreboardState,
  type SideKey,
} from '@/entities/scoreboard/model';
import { useScoreboardControl } from '@/features/scoreboard-live/useScoreboardChannel';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';

import styles from './ScoreboardControlView.module.css';

// Разряд встречи выбирают таббаром сверху: он решает, что спрашивать у
// оператора (второго игрока пары, названия команд) и что показывать в эфире.
const MODES: { value: MatchMode; label: string }[] = [
  { value: 'single', label: 'Одиночный' },
  { value: 'doubles', label: 'Парный' },
  { value: 'team', label: 'Командный' },
];

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
  const doubles = isDoubles(state);
  const team = isTeamMatch(state);

  const sideBlock = (side: SideKey, title: string) => {
    const player = state[side];

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

        {/* Второе имя спрашиваем только там, где оно бывает: в паре. */}
        {doubles ? (
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
        ) : null}

        {/* Название команды — оно же подпись в верхней строке эфира. */}
        {team ? (
          <label className={styles.field}>
            <span className={styles.label}>Команда</span>
            <input
              className={styles.input}
              value={state.team[`${side}_name`]}
              aria-label={`Команда — ${title}`}
              onChange={(event) =>
                send({ type: 'patch', patch: { team: { [`${side}_name`]: event.target.value } } })
              }
            />
          </label>
        ) : null}

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

          {team ? (
            <div className={styles.counter}>
              <span className={styles.label}>Счёт встречи</span>
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
      <div className={styles.tabs} role="tablist" aria-label="Разряд встречи">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={state.mode === item.value}
            data-on={state.mode === item.value || undefined}
            onClick={() => send({ type: 'patch', patch: { mode: item.value } })}
          >
            {item.label}
          </button>
        ))}
      </div>

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
