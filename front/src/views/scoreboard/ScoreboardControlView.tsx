'use client';

// Пульт табло. Оператор ведёт счёт здесь — в эфире он меняется через доли
// секунды. Счёт хранит Django (строка на стол), пульт пишет туда получившееся
// состояние, плашка в OBS его опрашивает. Локально действие применяется сразу,
// поэтому кнопки не «залипают» на время запроса.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { DEFAULT_BOARD_KEY } from '@/entities/scoreboard/api';

import {
  isGameOver,
  statusText,
  type ScoreboardState,
  type SideKey,
} from '@/entities/scoreboard/model';
import { useScoreboardControl } from '@/features/scoreboard-live/useScoreboardChannel';
import { BOARD_SIZE, ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';

import styles from './ScoreboardControlView.module.css';

const OVERLAY_PATH = '/scoreboard/overlay';

const overlayPathFor = (key: string) =>
  key === DEFAULT_BOARD_KEY ? OVERLAY_PATH : `${OVERLAY_PATH}?board=${encodeURIComponent(key)}`;

// Полный адрес оверлея нужен для OBS, но на сервере origin неизвестен.
// Читаем его как «внешний источник»: на сервере — путь, на клиенте — полный
// адрес; гидрация проходит без расхождения и без setState в эффекте.
const noopSubscribe = () => () => {};

// Горячие клавиши — по `event.code`, а не по букве: раскладка (рус/eng) на них
// не влияет, оператору не нужно переключаться посреди партии.
const HOTKEYS = [
  { code: 'Digit1', hint: '1', label: 'очко слева' },
  { code: 'Digit2', hint: '2', label: 'очко справа' },
  { code: 'KeyQ', hint: 'Q', label: 'минус слева' },
  { code: 'KeyW', hint: 'W', label: 'минус справа' },
  { code: 'KeyG', hint: 'G', label: 'завершить партию' },
  { code: 'KeyH', hint: 'H', label: 'скрыть / показать' },
] as const;

export function ScoreboardControlView({ initial }: { initial: ScoreboardState }) {
  const { state, connected, send } = useScoreboardControl(initial);
  const [copied, setCopied] = useState(false);

  const overlayPath = overlayPathFor(state.key);
  const overlayUrl = useSyncExternalStore(
    noopSubscribe,
    useCallback(() => `${window.location.origin}${overlayPath}`, [overlayPath]),
    useCallback(() => overlayPath, [overlayPath]),
  );

  // Горячие клавиши: не перехватываем набор в полях ввода.
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

  const copyOverlayUrl = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false); // нет доступа к буферу — ссылка видна рядом, скопируют руками
    }
  };

  const sideBlock = (side: SideKey, title: string) => {
    const player = state[side];
    return (
      <section className={styles.side} key={side}>
        <h2 className={styles.sideTitle}>{title}</h2>

        {/* Имя и страна — в одну строку: на планшете вертикаль дороже ширины. */}
        <div className={styles.identity}>
          <label className={styles.field}>
            <span className={styles.label}>Фамилия и имя</span>
            <input
              className={styles.input}
              value={player.name}
              aria-label={`Имя — ${title}`}
              onChange={(event) =>
                send({
                  type: 'patch',
                  patch: { [side]: { name: event.target.value } },
                })
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Страна</span>
            <input
              className={`${styles.input} ${styles.inputShort}`}
              value={player.country}
              maxLength={3}
              aria-label={`Страна — ${title}`}
              onChange={(event) =>
                send({
                  type: 'patch',
                  patch: { [side]: { country: event.target.value } },
                })
              }
            />
          </label>
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
      <header className={styles.top}>
        <div>
          <h1 className={styles.title}>
            Табло трансляции
            {state.title || state.key !== DEFAULT_BOARD_KEY ? (
              <span className={styles.board}> · {state.title || state.key}</span>
            ) : null}
          </h1>
          <p className={styles.hint}>
            Источник «Браузер» в OBS: {BOARD_SIZE.width} × {BOARD_SIZE.height}, фон прозрачный.
          </p>
        </div>
        <div className={styles.topRight}>
          <span className={styles.status} data-connected={connected || undefined}>
            {connected ? 'в эфире' : 'нет связи'}
          </span>
          <code className={styles.url}>{overlayUrl}</code>
          <button type="button" className={styles.ghost} onClick={copyOverlayUrl}>
            {copied ? 'Скопировано' : 'Копировать ссылку'}
          </button>
          <a className={styles.ghost} href={overlayPath} target="_blank" rel="noreferrer">
            Открыть оверлей
          </a>
        </div>
      </header>

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
        <button
          type="button"
          className={styles.action}
          onClick={() => send({ type: 'resetPoints' })}
        >
          Обнулить очки
        </button>
        <button type="button" className={styles.action} onClick={() => send({ type: 'swap' })}>
          Поменять сторонами
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={() => send({ type: 'resetMatch' })}
        >
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

      <section className={styles.meta}>
        <label className={styles.field}>
          <span className={styles.label}>Тип матча</span>
          <input
            className={`${styles.input} ${styles.inputShort}`}
            value={state.match_label}
            aria-label="Тип матча"
            onChange={(event) =>
              send({
                type: 'patch',
                patch: { match_label: event.target.value },
              })
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Круг</span>
          <input
            className={`${styles.input} ${styles.inputShort}`}
            value={state.round_label}
            aria-label="Круг"
            onChange={(event) =>
              send({
                type: 'patch',
                patch: { round_label: event.target.value },
              })
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Матч до</span>
          <select
            className={styles.input}
            value={state.best_of}
            aria-label="Матч до"
            onChange={(event) =>
              send({
                type: 'patch',
                patch: { best_of: Number(event.target.value) },
              })
            }
          >
            <option value={5}>3 побед (из 5)</option>
            <option value={7}>4 побед (из 7)</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Язык подписи</span>
          <select
            className={styles.input}
            value={state.status_lang}
            aria-label="Язык подписи"
            onChange={(event) =>
              send({
                type: 'patch',
                patch: {
                  status_lang: event.target.value === 'ru' ? 'ru' : 'en',
                },
              })
            }
          >
            <option value="en">GAME POINT</option>
            <option value="ru">СЕТБОЛ</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Подпись {state.status_override === null ? '(авто)' : '(вручную)'}
          </span>
          <input
            className={styles.input}
            value={state.status_override ?? statusText(state)}
            placeholder="считается по счёту"
            aria-label="Подпись"
            onChange={(event) =>
              send({
                type: 'patch',
                patch: { status_override: event.target.value },
              })
            }
          />
        </label>

        <button
          type="button"
          className={styles.action}
          onClick={() => send({ type: 'patch', patch: { status_override: null } })}
        >
          Вернуть авто-подпись
        </button>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={state.team.enabled}
            aria-label="Командный матч"
            onChange={(event) =>
              send({
                type: 'patch',
                patch: { team: { enabled: event.target.checked } },
              })
            }
          />
          <span>Командный матч (нижняя строка со счётом команд)</span>
        </label>
      </section>

      <footer className={styles.hotkeys}>
        {HOTKEYS.map((key) => (
          <span key={key.code} className={styles.hotkey}>
            <kbd className={styles.kbd}>{key.hint}</kbd> {key.label}
          </span>
        ))}
      </footer>
    </main>
  );
}
