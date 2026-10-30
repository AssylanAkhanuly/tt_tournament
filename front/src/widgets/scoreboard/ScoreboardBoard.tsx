// Плашка счёта — то, что видит зритель. Чистая отрисовка состояния: ни сети, ни
// собственного состояния, чтобы одну и ту же плашку показывать и в эфире, и
// предпросмотром на пульте.
//
// Все размеры — от `--sb-unit`, поэтому плашку целиком можно масштабировать
// одной переменной (в OBS источник тоже тянется мышью). Внутри плашки шаг
// Tailwind `--spacing` равен этой единице: `w-860` — 860 единиц, `px-14` — 14,
// а `--spacing(17)` — то же самое в произвольном значении (кегль, рамка).
// Масштаб задаётся снаружи (`--sb-scale`): в эфире плашка натуральная, в
// предпросмотре на пульте её ужимают под ширину экрана.

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

/** Размер плашки = размер источника «Браузер» в OBS.
 *  Высота — с верхней строкой счёта команд; в одиночном и парном разряде
 *  плашка ниже, лишнее место в источнике остаётся прозрачным и в кадре не
 *  видно. В парном разряде вторая фамилия помещается в ту же высоту, поэтому
 *  источник в OBS перенастраивать не нужно. */
export const BOARD_SIZE = { width: 860, height: 170 } as const;

/** Узкий тяжёлый гротеск вещательной графики; общий с полосой партнёров. */
export const SB_FONT = "font-[family-name:'Arial_Narrow','Segoe_UI',var(--font)]";

/** Строка имени: слева место под указатель подачи, чтобы фамилии не съезжали. */
function NameLine({
  name,
  serving,
  slot,
  doubles,
}: {
  name: string;
  serving: boolean;
  slot: string;
  doubles: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-8">
      {/* Указатель подачи — треугольник из рамок. Место под него занято
          всегда, иначе фамилии съезжают, когда подача переходит на другую
          строку. В паре он меньше: две фамилии в той же высоте строки. */}
      <span
        className={
          'h-0 w-0 flex-none border-y-transparent border-l-transparent data-on:border-l-sb-ink ' +
          (doubles
            ? 'border-y-[length:--spacing(5)] border-l-[length:--spacing(8)]'
            : 'border-y-[length:--spacing(7)] border-l-[length:--spacing(11)]')
        }
        data-on={serving || undefined}
        data-testid={`serve-${slot}`}
        aria-hidden="true"
      />
      {/* В паре в ту же высоту строки помещаются две фамилии — размер
          источника в OBS менять не приходится. */}
      <span
        className={
          'truncate uppercase ' +
          (doubles ? 'text-[length:--spacing(19)] leading-21' : 'text-[length:--spacing(30)]')
        }
      >
        {name}
      </span>
    </span>
  );
}

/** Партии и очки — одинаковые клетки, разные по громкости заливки. */
const SCORE_CELL = 'grid h-46 place-items-center text-[length:--spacing(32)] tabular-nums';

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
    /* Строка раскрывается в общую сетку — колонки счёта у обоих игроков совпадают. */
    <div className="contents">
      <div
        className="flex h-46 min-w-0 items-center justify-between gap-10 bg-sb-navy px-14"
        data-side={side}
        data-doubles={doubles || undefined}
      >
        <div className="flex min-w-0 flex-col justify-center">
          <NameLine
            name={player.name}
            serving={server === `${side}1`}
            slot={`${side}1`}
            doubles={doubles}
          />
          {doubles ? (
            <NameLine
              name={player.name2}
              serving={server === `${side}2`}
              slot={`${side}2`}
              doubles={doubles}
            />
          ) : null}
        </div>

        {/* Отметки: тайм-аут и карточка. */}
        <div className="flex flex-none items-center gap-6">
          {player.timeout ? (
            <span
              className="grid size-24 place-items-center bg-sb-ink text-[length:--spacing(15)] text-sb-navy"
              data-testid={`timeout-${side}`}
            >
              Т
            </span>
          ) : null}
          {player.card ? (
            <span
              className="h-24 w-17 data-[card=red]:bg-sb-red data-[card=yellow]:bg-sb-yellow"
              data-card={player.card}
              data-testid={`card-${side}`}
              aria-label={player.card === 'red' ? 'красная карточка' : 'жёлтая карточка'}
            />
          ) : null}
        </div>
      </div>

      <div className={`${SCORE_CELL} bg-sb-games`} data-testid={`games-${side}`}>
        {player.games}
      </div>
      <div className={`${SCORE_CELL} bg-sb-points`} data-testid={`points-${side}`}>
        {player.points}
      </div>
    </div>
  );
}

/** Название и его счёт — одной группой ✳ (01.09.2026): число прижато к своей
 *  команде. Раньше названия стояли по краям, а счёт посередине, и связь
 *  «чей это счёт» зритель достраивал сам. */
const TEAM_SIDE = 'flex min-w-0 items-center gap-10';
const TEAM_NAME = 'truncate text-[length:--spacing(21)] tracking-[0.04em] uppercase';
/** Счёт команды. Ведущая залита акцентом — «кто выигрывает» читается цветом
 *  раньше, чем человек сравнил цифры. Отстающая остаётся на фоне полосы. */
const TEAM_NUM =
  'grid h-28 min-w-34 place-items-center rounded-[--spacing(4)] px-6 ' +
  'bg-[color-mix(in_srgb,var(--sb-ink)_12%,transparent)] text-[length:--spacing(22)] font-extrabold tabular-nums ' +
  'data-lead:bg-sb-azure data-lead:text-sb-ink';

/** Счёт командной встречи — над игроками: он про всю встречу, а не про этот
 *  стол, и зритель читает его первым (образец федерации, 29.08.2026). Названия
 *  по краям тянутся, счёт держится у своего названия и не гуляет от их длины. */
function TeamStrip({ state }: { state: ScoreboardState }) {
  const left = teamLabel(state, 'left');
  const right = teamLabel(state, 'right');
  /* Названия команд заполняют не всегда, а в начале встречи — почти никогда.
     Без них полоса вырождалась в пару чисел посреди пустоты, и зритель не
     понимал, чей это счёт: всей встречи или этого стола. Пустое название
     заменяем подписью «СЧЁТ ВСТРЕЧИ» в середине — у чисел появляется хозяин,
     и плашка остаётся читаемой в эфире с первой секунды. */
  const named = Boolean(left || right);
  /* Кто ведёт. При равенстве — никто: ничья это ничья, а не «оба ведут». */
  const lead =
    state.team.left === state.team.right ? null : state.team.left > state.team.right ? 'left' : 'right';
  return (
    <div
      /* relative — подпись «счёт встречи» лежит по центру поверх полосы */
      className="relative grid h-34 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-10 bg-sb-navy px-14"
      data-testid="team-score"
      data-named={named || undefined}
    >
      {/* Подпись — только когда названий команд нет: с названиями она лишняя,
          «АЛАТАУ 1 : 2 БАРЫС» и так читается однозначно. В сетке она не
          участвует, а лежит по центру поверх полосы: иначе занимает
          собственную строку и выталкивает счёт за пределы полосы
          фиксированной высоты. */}
      {!named && (
        <span className="absolute top-1/2 right-0 left-0 [transform:translateY(-50%)] text-center text-[length:--spacing(15)] tracking-[0.08em] text-sb-ink-dim uppercase">
          счёт встречи
        </span>
      )}

      {/* Число прижато к своей команде, а не стоит посреди полосы: иначе
          связь «это счёт вот этой команды» приходится достраивать в уме. */}
      <span className={TEAM_SIDE}>
        <span className={TEAM_NAME}>{left}</span>
        <b className={TEAM_NUM} data-lead={lead === 'left' || undefined} data-testid="team-left">
          {state.team.left}
        </b>
      </span>

      {/* Двоеточия между половинами нет ✳: числа стоят у своих названий, и
          разделять нечего — одинокий знак посреди метра пустоты только
          сообщал бы, что счёт всё-таки где-то в середине. */}

      <span className={`${TEAM_SIDE} justify-end`} data-side="right">
        <b className={TEAM_NUM} data-lead={lead === 'right' || undefined} data-testid="team-right">
          {state.team.right}
        </b>
        <span className={TEAM_NAME}>{right}</span>
      </span>
    </div>
  );
}

/** Сегмент верхней полосы: тип матча, круг, статус. */
const CHIP = 'whitespace-nowrap px-10 py-4';

export function ScoreboardBoard({ state }: { state: ScoreboardState }) {
  const status = statusText(state);
  const server = currentServer(state);
  const doubles = isDoubles(state);

  return (
    <div
      className={
        '[--sb-unit:var(--sb-scale,1px)] [--spacing:var(--sb-unit)] ' +
        `block w-860 bg-sb-azure text-sb-ink ${SB_FONT} font-extrabold tracking-[0.01em] leading-none ` +
        /* «Скрыть плашку» на пульте: в эфире уезжает мягко, а не пропадает рывком. */
        '[transition:opacity_200ms_ease] data-hidden:pointer-events-none data-hidden:opacity-0'
      }
      data-hidden={!state.visible || undefined}
      data-testid="board"
    >
      {/* Просвет между блоками (2 единицы) — «волосяная» линия. */}
      <div className="flex flex-col gap-2 px-8 py-6">
        {/* Верхняя полоса: тип матча | круг | статус. Разделители между
            сегментами — тонкие линии, как в вещательных плашках. */}
        <div
          className={
            'flex min-h-26 items-center gap-10 text-[length:--spacing(17)] uppercase ' +
            '[&>*+*]:[border-left:--spacing(2)_solid_color-mix(in_srgb,var(--sb-ink)_45%,transparent)]'
          }
        >
          {state.match_label ? <span className={CHIP}>{state.match_label}</span> : null}
          {state.round_label ? <span className={CHIP}>{state.round_label}</span> : null}
          {status ? (
            <span
              className={`${CHIP} text-sb-ink [text-shadow:0_0_--spacing(12)_color-mix(in_srgb,var(--sb-ink)_60%,transparent)]`}
              data-testid="status"
            >
              {status}
            </span>
          ) : null}
        </div>

        {isTeamMatch(state) ? <TeamStrip state={state} /> : null}

        {/* Строки игроков: фамилии и две колонки счёта по 72 единицы. */}
        <div className="grid grid-cols-[minmax(0,1fr)_--spacing(72)_--spacing(72)] gap-2">
          <Row player={state.left} side="left" server={server} doubles={doubles} />
          <Row player={state.right} side="right" server={server} doubles={doubles} />
        </div>
      </div>
    </div>
  );
}
