// Модель табло трансляции (оверлей для OBS).
// Чистый TS: ни React, ни сети. Один и тот же редьюсер крутится и на сервере
// (источник правды), и на клиенте (оптимистичное обновление пульта) — поэтому
// пульт и эфир не расходятся.

export type SideKey = 'left' | 'right';

/** Карточка, выданная на столе. Пустая строка — карточки нет. */
export type Card = '' | 'yellow' | 'red';

/** Слот игрока: в одиночке заняты только первые, в паре — все четыре. */
export type ServerSlot = '' | 'left1' | 'left2' | 'right1' | 'right2';

export type PlayerState = {
  name: string;
  name2: string; // второй игрок пары; пусто — одиночный разряд
  country: string; // код страны как его ввели: 'KAZ', 'JPN' (до 3 букв)
  games: number; // выигранные партии
  points: number; // очки в текущей партии
  timeout: boolean; // тайм-аут взят (по правилам он один за матч)
  card: Card;
};

export type TeamState = {
  enabled: boolean; // нижняя строка «KAZ 1-2 JPN» (командные матчи)
  left: number;
  right: number;
};

export type StatusLang = 'ru' | 'en';

export type ScoreboardState = {
  key: string; // какая доска: столов в турнире может быть несколько
  title: string; // человеческое название доски, например «Стол 3»
  rev: number; // версия; растёт на каждое изменение, по ней клиент отбрасывает устаревшее
  match_label: string; // 'MT' — тип матча
  round_label: string; // 'R 16' — круг
  best_of: number; // до скольких партий играют (5 или 7)
  status_lang: StatusLang; // язык автоподписи «сетбол/матчбол»
  status_override: string | null; // ручная подпись вместо автоматической
  // Кто подавал первым в текущей партии. Текущего подающего из этого выводит
  // currentServer: оператору не надо щёлкать подачу каждые два очка.
  first_server: ServerSlot;
  visible: boolean; // показ плашки в эфире
  left: PlayerState;
  right: PlayerState;
  team: TeamState;
};

export const MAX_POINTS = 99;
export const MAX_GAMES = 9;

// Запасное состояние: показываем, пока бэкенд не ответил, и если он недоступен.
// Совпадает с тем, что Django ставит новой доске.
export const DEFAULT_STATE: ScoreboardState = {
  key: 'main',
  title: '',
  rev: 0,
  match_label: 'MT',
  round_label: 'R 16',
  best_of: 5,
  status_lang: 'en',
  status_override: null,
  visible: true,
  first_server: '',
  left: { name: '', name2: '', country: '', games: 0, points: 0, timeout: false, card: '' },
  right: { name: '', name2: '', country: '', games: 0, points: 0, timeout: false, card: '' },
  team: { enabled: false, left: 0, right: 0 },
};

// ── статус партии ────────────────────────────────────────────────────────
export type StatusKind = 'none' | 'deuce' | 'game' | 'match';

const STATUS_TEXT: Record<StatusLang, Record<Exclude<StatusKind, 'none'>, string>> = {
  ru: { deuce: 'РОВНО', game: 'СЕТБОЛ', match: 'МАТЧБОЛ' },
  en: { deuce: 'DEUCE', game: 'GAME POINT', match: 'MATCH POINT' },
};

/** Сколько партий нужно выиграть, чтобы взять матч. */
export function gamesToWin(best_of: number): number {
  return Math.floor(best_of / 2) + 1;
}

/** Автоподпись по счёту: ровно / сетбол / матчбол. */
export function computeStatus(s: ScoreboardState): StatusKind {
  const a = s.left.points;
  const b = s.right.points;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);

  if (a >= 10 && b >= 10 && a === b) return 'deuce';
  if (hi < 10) return 'none';
  if (hi >= 11 && hi - lo >= 2) return 'none'; // партия уже выиграна — ждём «завершить партию»

  const leader = a > b ? s.left : s.right;
  return leader.games + 1 >= gamesToWin(s.best_of) ? 'match' : 'game';
}

/** Готовая надпись для плашки: ручная имеет приоритет над автоматической. */
export function statusText(s: ScoreboardState): string {
  if (s.status_override !== null) return s.status_override;
  const kind = computeStatus(s);
  return kind === 'none' ? '' : STATUS_TEXT[s.status_lang][kind];
}

/** Партия доиграна по правилам (11 очков и разрыв в 2). */
export function isGameOver(s: ScoreboardState): boolean {
  const hi = Math.max(s.left.points, s.right.points);
  const lo = Math.min(s.left.points, s.right.points);
  return hi >= 11 && hi - lo >= 2;
}

/** Матч доигран: кто-то взял нужное число партий. */
export function isMatchOver(s: ScoreboardState): boolean {
  const need = gamesToWin(s.best_of);
  return s.left.games >= need || s.right.games >= need;
}

// ── подача ───────────────────────────────────────────────────────────────
// Подача меняется каждые два очка, а от 10:10 — каждое очко. Значит текущего
// подающего можно вывести из счёта, если известно, кто подавал первым в партии.
// Оператор отмечает это один раз, дальше плашка считает сама.
//
// В паре подающих четверо и они идут по кругу: подающий → принимающий →
// партнёр подающего → партнёр принимающего. Порядок тот же, просто цикл длиннее.

/** Парный разряд определяется тем, что заполнено второе имя. */
export function isDoubles(s: ScoreboardState): boolean {
  return Boolean(s.left.name2.trim() || s.right.name2.trim());
}

/** Круг подающих: двое в одиночке, четверо в паре. */
export function serveCycle(s: ScoreboardState): Exclude<ServerSlot, ''>[] {
  return isDoubles(s)
    ? ['left1', 'right1', 'left2', 'right2']
    : ['left1', 'right1'];
}

/** Сколько раз подача сменилась с начала партии. */
export function serveSwaps(s: ScoreboardState): number {
  const total = s.left.points + s.right.points;
  // До 10:10 подача переходит через два очка, после — каждое.
  return total < 20 ? Math.floor(total / 2) : 10 + (total - 20);
}

/** Кто подаёт сейчас. Пусто — первый подающий не отмечен. */
export function currentServer(s: ScoreboardState): ServerSlot {
  const cycle = serveCycle(s);
  const start = cycle.indexOf(s.first_server as Exclude<ServerSlot, ''>);
  if (start < 0) return ''; // не отмечен, либо слот пары в одиночном разряде
  return cycle[(start + serveSwaps(s)) % cycle.length];
}

/** Отметить, что подаёт этот слот: считаем назад, кто тогда начинал партию. */
function withServer(s: ScoreboardState, slot: ServerSlot): ScoreboardState {
  if (!slot) return { ...s, first_server: '' };
  const cycle = serveCycle(s);
  const target = cycle.indexOf(slot as Exclude<ServerSlot, ''>);
  if (target < 0) return s;
  const length = cycle.length;
  const first = cycle[(((target - serveSwaps(s)) % length) + length) % length];
  return { ...s, first_server: first };
}

const NEXT_CARD: Record<Card, Card> = { '': 'yellow', yellow: 'red', red: '' };

const SWAPPED_SLOT: Record<Exclude<ServerSlot, ''>, ServerSlot> = {
  left1: 'right1',
  left2: 'right2',
  right1: 'left1',
  right2: 'left2',
};

// ── действия пульта ──────────────────────────────────────────────────────
export type ScoreboardPatch = {
  match_label?: string;
  round_label?: string;
  best_of?: number;
  status_lang?: StatusLang;
  status_override?: string | null;
  visible?: boolean;
  left?: Partial<Pick<PlayerState, 'name' | 'name2' | 'country'>>;
  right?: Partial<Pick<PlayerState, 'name' | 'name2' | 'country'>>;
  team?: Partial<TeamState>;
};

export type ScoreboardAction =
  | { type: 'point'; side: SideKey; delta: number }
  | { type: 'game'; side: SideKey; delta: number }
  | { type: 'teamScore'; side: SideKey; delta: number }
  | { type: 'finishGame' } // партию — лидеру, очки обнуляем
  | { type: 'resetPoints' }
  | { type: 'resetMatch' } // очки и партии в ноль, имена оставляем
  | { type: 'swap' } // поменять игроков сторонами
  | { type: 'serve'; slot: ServerSlot } // отметить, кто подаёт сейчас
  | { type: 'timeout'; side: SideKey } // тайм-аут взят / снят
  | { type: 'card'; side: SideKey } // нет → жёлтая → красная → нет
  | { type: 'patch'; patch: ScoreboardPatch };

const clamp = (v: number, max: number) => Math.min(max, Math.max(0, Math.round(v)));

/** Чистый редьюсер. `rev` не трогает — версию проставляет хранилище. */
export function reduce(s: ScoreboardState, a: ScoreboardAction): ScoreboardState {
  switch (a.type) {
    case 'point': {
      const side = s[a.side];
      return { ...s, [a.side]: { ...side, points: clamp(side.points + a.delta, MAX_POINTS) } };
    }
    case 'game': {
      const side = s[a.side];
      return { ...s, [a.side]: { ...side, games: clamp(side.games + a.delta, MAX_GAMES) } };
    }
    case 'teamScore': {
      const key = a.side;
      return { ...s, team: { ...s.team, [key]: clamp(s.team[key] + a.delta, MAX_GAMES) } };
    }
    case 'finishGame': {
      if (s.left.points === s.right.points) return s; // ничьих в партии не бывает
      const winner: SideKey = s.left.points > s.right.points ? 'left' : 'right';
      // Новую партию начинает подачей следующий по кругу — тот, кто в прошлой
      // партии принимал.
      const cycle = serveCycle(s);
      const started = cycle.indexOf(s.first_server as Exclude<ServerSlot, ''>);
      return {
        ...s,
        first_server: started < 0 ? s.first_server : cycle[(started + 1) % cycle.length],
        left: { ...s.left, points: 0, games: s.left.games + (winner === 'left' ? 1 : 0) },
        right: { ...s.right, points: 0, games: s.right.games + (winner === 'right' ? 1 : 0) },
      };
    }
    case 'resetPoints':
      return { ...s, left: { ...s.left, points: 0 }, right: { ...s.right, points: 0 } };
    case 'resetMatch':
      // Новый матч: карточки, тайм-ауты и подача относились к прошлому.
      return {
        ...s,
        first_server: '',
        left: { ...s.left, points: 0, games: 0, timeout: false, card: '' },
        right: { ...s.right, points: 0, games: 0, timeout: false, card: '' },
      };
    case 'swap':
      return {
        ...s,
        left: s.right,
        right: s.left,
        first_server: s.first_server ? SWAPPED_SLOT[s.first_server] : '',
        team: { ...s.team, left: s.team.right, right: s.team.left },
      };
    case 'serve':
      return withServer(s, a.slot);
    case 'timeout': {
      const side = s[a.side];
      return { ...s, [a.side]: { ...side, timeout: !side.timeout } };
    }
    case 'card': {
      const side = s[a.side];
      return { ...s, [a.side]: { ...side, card: NEXT_CARD[side.card] } };
    }
    case 'patch':
      return applyPatch(s, a.patch);
    default:
      return s;
  }
}

const NAME_MAX = 40;
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);

function applyPatch(s: ScoreboardState, p: ScoreboardPatch): ScoreboardState {
  const next: ScoreboardState = { ...s, left: { ...s.left }, right: { ...s.right }, team: { ...s.team } };

  const match_label = text(p.match_label, 12);
  if (match_label !== undefined) next.match_label = match_label;
  const round_label = text(p.round_label, 16);
  if (round_label !== undefined) next.round_label = round_label;
  if (p.best_of === 5 || p.best_of === 7) next.best_of = p.best_of;
  if (p.status_lang === 'ru' || p.status_lang === 'en') next.status_lang = p.status_lang;
  if (p.status_override === null) next.status_override = null;
  else {
    const override = text(p.status_override, 24);
    if (override !== undefined) next.status_override = override;
  }
  if (typeof p.visible === 'boolean') next.visible = p.visible;

  for (const side of ['left', 'right'] as const) {
    const patch = p[side];
    if (!patch) continue;
    const name = text(patch.name, NAME_MAX);
    if (name !== undefined) next[side].name = name;
    const name2 = text(patch.name2, NAME_MAX);
    if (name2 !== undefined) next[side].name2 = name2;
    const country = text(patch.country, 3);
    if (country !== undefined) next[side].country = country.toUpperCase();
  }

  if (p.team) {
    if (typeof p.team.enabled === 'boolean') next.team.enabled = p.team.enabled;
    if (typeof p.team.left === 'number') next.team.left = clamp(p.team.left, MAX_GAMES);
    if (typeof p.team.right === 'number') next.team.right = clamp(p.team.right, MAX_GAMES);
  }

  return next;
}

