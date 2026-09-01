'use client';

// Пульт табло. Оператор ведёт счёт здесь — в эфире он меняется через доли
// секунды. Счёт хранит Django (строка на стол), пульт пишет туда получившееся
// состояние, плашка в OBS слушает поток изменений. Локально действие
// применяется сразу, поэтому кнопки не «залипают» на время запроса.
//
// Собран на ките (`@/shared/kit/app`) ✳ (01.09.2026) — первый рабочий экран
// приложения, который берёт компоненты оттуда же, откуда их берут макеты.
// Пульт стал светлым, как остальные экраны системы: тёмным он был единственным,
// и оператор в зале переключался между двумя разными продуктами.
//
// Плашка в предпросмотре при этом ОСТАЁТСЯ тёмной: это вещательная графика для
// OBS, её смотрят поверх видео, и с интерфейсом она совпадать не обязана.
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
import { Button } from '@heroui/react';

import { Panel, Segmented, TextInput } from '@/shared/kit/app';
import '@/shared/kit/tailwind.css';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';

import styles from './ScoreboardControlView.module.css';

// Разряд встречи выбирают таббаром сверху: он решает, что спрашивать у
// оператора (второго игрока пары, названия команд) и что показывать в эфире.
const MODES: { value: MatchMode; label: string }[] = [
  { value: 'single', label: 'Одиночный' },
  { value: 'doubles', label: 'Парный' },
  { value: 'team', label: 'Командный' },
];

/** Кнопка-переключатель стороны: подача, тайм-аут, карточка. Нажата — залита.
 *
 *  Своя, а не `Button` из HeroUI: у неё три состояния (обычное, нажатое,
 *  «карточка такого-то цвета»), и цвет карточки задаёт не тон кнопки, а сам
 *  предмет — жёлтая и красная не «второстепенная» и «опасная», а именно жёлтая
 *  и красная. */
function Toggle({
  on,
  card,
  label,
  onClick,
  children,
}: {
  on?: boolean;
  card?: 'yellow' | 'red' | '' | null;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tone = card === 'red'
    ? 'border-red-500 bg-red-500 text-white'
    : card === 'yellow'
    ? 'border-amber-400 bg-amber-400 text-neutral-900'
    : on
    ? 'border-blue-600 bg-blue-600 text-white'
    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50';
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={Boolean(on || card)}
      onClick={onClick}
      className={'h-11 rounded-lg border px-3 text-[13px] font-medium ' + tone}
    >
      {children}
    </button>
  );
}

/** Счётчик: подпись, «−», число, «+».
 *
 *  Плюс крупнее и залит: по нему бьют каждый розыгрыш, а по минусу — раз в
 *  партию, когда ошиблись. Число между ними — `output`, а не `div`: это
 *  результат действия кнопок, и читалка сообщает об изменении сама. */
function Counter({
  label,
  value,
  testId,
  minusLabel,
  plusLabel,
  hot,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  testId?: string;
  minusLabel: string;
  plusLabel: string;
  /** Главный счётчик стороны — очки: его нажимают чаще всего. */
  hot?: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const step = 'grid place-items-center rounded-lg border text-xl font-semibold ' +
    (hot ? 'h-14 w-14' : 'h-11 w-11');
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-neutral-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={minusLabel}
          onClick={onMinus}
          className={step + ' border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}
        >
          −
        </button>
        <output
          data-testid={testId}
          className={
            'block text-center font-bold tabular-nums ' + (hot ? 'w-14 text-4xl' : 'w-11 text-2xl')
          }
        >
          {value}
        </output>
        <button
          type="button"
          aria-label={plusLabel}
          onClick={onPlus}
          className={
            step + ' border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
          }
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ScoreboardControlView({ initial }: { initial: ScoreboardState }) {
  const { state, send } = useScoreboardControl(initial);

  // Горячие клавиши — по `event.code`, а не по букве: раскладка (рус/eng) на
  // них не влияет, оператору не нужно переключаться посреди партии. Набор в
  // README; здесь только проводка.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      switch (event.code) {
        case 'KeyQ':
          send({ type: 'point', side: 'left', delta: 1 });
          break;
        case 'KeyA':
          send({ type: 'point', side: 'left', delta: -1 });
          break;
        case 'KeyP':
          send({ type: 'point', side: 'right', delta: 1 });
          break;
        case 'KeyL':
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

  const server = currentServer(state);
  const doubles = isDoubles(state);
  const team = isTeamMatch(state);

  // `title` — «Слева» / «Справа». На экране он подписью не стоит: стороны видно
  // по расположению. Он остаётся в aria-label, иначе две одинаковые пары кнопок
  // неразличимы для читалки экрана и для тестов.
  const sideBlock = (side: SideKey, title: string) => {
    const player = state[side];

    return (
      <Panel key={side} title={title}>
        <div className="flex flex-col gap-3">
          <TextInput
            label="Фамилия и имя"
            ariaLabel={`Имя — ${title}`}
            value={player.name}
            wide
            onChange={(value) => send({ type: 'patch', patch: { [side]: { name: value } } })}
          />

          {/* Второе имя спрашиваем только там, где оно бывает: в паре. */}
          {doubles ? (
            <TextInput
              label="Второй игрок (пары)"
              ariaLabel={`Второй игрок — ${title}`}
              value={player.name2}
              wide
              onChange={(value) => send({ type: 'patch', patch: { [side]: { name2: value } } })}
            />
          ) : null}

          {/* Название команды — оно же подпись в верхней строке эфира. */}
          {team ? (
            <TextInput
              label="Команда"
              ariaLabel={`Команда — ${title}`}
              value={state.team[`${side}_name`]}
              wide
              onChange={(value) =>
                send({ type: 'patch', patch: { team: { [`${side}_name`]: value } } })
              }
            />
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <Toggle
              on={server === `${side}1`}
              label={`Подача — ${title}`}
              onClick={() => send({ type: 'serve', slot: `${side}1` })}
            >
              Подача{doubles ? ' 1' : ''}
            </Toggle>

            {doubles ? (
              <Toggle
                on={server === `${side}2`}
                label={`Подача второго — ${title}`}
                onClick={() => send({ type: 'serve', slot: `${side}2` })}
              >
                Подача 2
              </Toggle>
            ) : null}

            <Toggle
              on={player.timeout}
              label={`Тайм-аут — ${title}`}
              onClick={() => send({ type: 'timeout', side })}
            >
              Тайм-аут
            </Toggle>

            <Toggle
              card={player.card}
              label={`Карточка — ${title}`}
              onClick={() => send({ type: 'card', side })}
            >
              Карточка
            </Toggle>
          </div>

          <div className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
            <Counter
              hot
              label="Очки"
              value={player.points}
              testId={`ctl-points-${side}`}
              minusLabel={`Очко минус — ${title}`}
              plusLabel={`Очко плюс — ${title}`}
              onMinus={() => send({ type: 'point', side, delta: -1 })}
              onPlus={() => send({ type: 'point', side, delta: 1 })}
            />

            <Counter
              label="Партии"
              value={player.games}
              testId={`ctl-games-${side}`}
              minusLabel={`Партия минус — ${title}`}
              plusLabel={`Партия плюс — ${title}`}
              onMinus={() => send({ type: 'game', side, delta: -1 })}
              onPlus={() => send({ type: 'game', side, delta: 1 })}
            />

            {team ? (
              <Counter
                label="Счёт встречи"
                value={state.team[side]}
                minusLabel={`Командный счёт минус — ${title}`}
                plusLabel={`Командный счёт плюс — ${title}`}
                onMinus={() => send({ type: 'teamScore', side, delta: -1 })}
                onPlus={() => send({ type: 'teamScore', side, delta: 1 })}
              />
            ) : null}
          </div>
        </div>
      </Panel>
    );
  };

  return (
    /* `hero-scope` — тот же скоуп, в котором живут макеты: под ним лежит
       локальный сброс вместо preflight, без него кнопки и поля HeroUI
       приезжают с браузерными стилями. */
    <main className={`${styles.page} hero-scope`} data-theme="light">
      <Segmented
        ariaLabel="Разряд встречи"
        items={MODES.map((m) => m.label)}
        value={MODES.find((m) => m.value === state.mode)?.label ?? MODES[0].label}
        wide
        onPick={(label) => {
          const hit = MODES.find((m) => m.label === label);
          if (hit) send({ type: 'patch', patch: { mode: hit.value } });
        }}
      />

      {/* Предпросмотр эфира: плашка как есть, на клетчатом поле — так видно, что
          фон у неё прозрачный, и оператор понимает, что уйдёт в OBS. */}
      <section className={styles.previewWrap} aria-label="Предпросмотр плашки">
        <div className={styles.preview}>
          <ScoreboardBoard state={state} />
        </div>
      </section>

      <div className={styles.sides}>
        {sideBlock('left', 'Слева')}
        {sideBlock('right', 'Справа')}
      </div>

      {/* Решения над партией и матчем. «Завершить партию» становится главной
          кнопкой ровно тогда, когда партия доиграна: до этого она такая же, как
          соседние, и нажимать её незачем. */}
      <section className={styles.actions}>
        <Button
          className="h-12 w-full"
          variant={isGameOver(state) ? 'primary' : 'outline'}
          onPress={() => send({ type: 'finishGame' })}
        >
          Завершить партию
        </Button>
        <Button className="h-12 w-full" variant="outline" onPress={() => send({ type: 'resetMatch' })}>
          Новый матч
        </Button>
        <Button
          className="h-12 w-full"
          variant="outline"
          onPress={() => send({ type: 'patch', patch: { visible: !state.visible } })}
        >
          {state.visible ? 'Скрыть плашку' : 'Показать плашку'}
        </Button>
      </section>
    </main>
  );
}
