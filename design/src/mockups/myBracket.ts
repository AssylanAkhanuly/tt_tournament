/* Сетка турнира для экрана спортсмена (Э14.5).

   Рисует её тот же компонент, что и на фронте (`widgets/bracket/BracketFlow`),
   по общей модели сетки — макет не изображает сетку своими прямоугольниками, а
   показывает настоящую. Здесь только данные: 32 участника, наш спортсмен
   выиграл 1/16 и играет 1/8 прямо сейчас.

   Кругов пять: 1/16 → 1/8 → 1/4 → 1/2 → финал. Дальше своего текущего матча
   сетка пустая — соперники ещё не определились, и придумывать их нельзя. */

import type { Bracket, Match, Side } from '@/entities/bracket/model';

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;

/** Наш спортсмен — тот же Ким Георгий, что в реестрах и на остальных экранах. */
export const ME_ID = 'p4';

const NAMES = [
  'Смагулов А.', 'Ли Виктор', 'Токаев М.', 'Абиш Н.',
  'Ким Георгий', 'Оралбек Д.', 'Сериков Н.', 'Цой Артём',
  'Байжанов Е.', 'Мурат К.', 'Жумабеков Р.', 'Пак Сергей',
  'Гладун И.', 'Абаев Т.', 'Ермек С.', 'Данияр О.',
  'Оспанов Т.', 'Бекзат Ж.', 'Кайрат А.', 'Асан Б.',
  'Нурлан Е.', 'Тлеу Р.', 'Садык М.', 'Жанибек А.',
  'Алтай К.', 'Ерасыл Т.', 'Мади Д.', 'Арман С.',
  'Диас Ж.', 'Санжар К.', 'Алихан Н.', 'Темирлан Б.',
];

const sides: Side[] = NAMES.map((name, i) => ({
  id: 'p' + i,
  name,
  ...(i === 4 ? { avatarUrl: A(44) } : null),
}));

/* Первый круг сыгран целиком, во втором наш матч идёт, остальные тоже сыграны:
   так на экране видно и свой путь, и что турнир живёт вокруг. Дальше — пусто. */
function build(rounds: number, seeds: Side[]): Match[] {
  const matches: Match[] = [];
  let round: (Side | null)[] = seeds;

  for (let r = 0; r < rounds; r++) {
    const winners: (Side | null)[] = [];
    for (let s = 0; s < round.length / 2; s++) {
      const a = round[2 * s] ?? null;
      const b = round[2 * s + 1] ?? null;
      const mine = a?.id === ME_ID || b?.id === ME_ID;
      const known = a != null && b != null;
      const live = r === 1 && mine;
      const done = known && r <= 1 && !live;

      /* Кто побеждает: наш спортсмен — в первом круге, остальные — по чётности
         слота. Это макет, важна не «правда», а разные исходы в сетке. */
      const aWins = mine ? a?.id === ME_ID : s % 2 === 0;

      matches.push({
        id: `r${r}s${s}`,
        round: r,
        slot: s,
        a,
        b,
        scoreA: done ? (aWins ? 4 : s % 3 === 0 ? 1 : 2) : live ? 2 : null,
        scoreB: done ? (aWins ? (s % 3 === 0 ? 1 : 2) : 4) : live ? 1 : null,
        winner: done ? (aWins ? 'a' : 'b') : null,
        status: live ? 'live' : done ? 'done' : 'pending',
      });
      winners.push(done ? (aWins ? a : b) : null);
    }
    round = winners;
  }
  return matches;
}

/** Мой идущий матч: по нему подсвечивается пара на холсте и к нему ведёт
    кнопка «Мой матч» на телефоне. */
export const MY_MATCH_ID = build(5, sides).find((m) => m.status === 'live')?.id ?? '';

export const myBracket: Bracket = {
  format: 'single_elimination',
  title: 'Кубок Алматы 2026',
  matches: build(5, sides),
};

/* ── Групповой этап с плей-офф ──────────────────────────────────────
   Второй формат из ТЗ (§5.1): сначала группы, из каждой выходят двое, дальше
   сетка на выбывание. Сетка здесь короче — в плей-офф попадают шестнадцать, —
   а порядок в ней задан не рейтингом, а местами в группах. */

/** Группа: четверо, круговая внутри группы, двое выходят в плей-офф. */
export type GroupRow = {
  nm: string;
  /** Победы — поражения по матчам. */
  wl: string;
  /** Партии: выиграно — проиграно. */
  sets: string;
  place: number;
  /** Вышел ли в плей-офф. */
  out: boolean;
  me?: boolean;
};

export const MY_GROUP: GroupRow[] = [
  { nm: 'Смагулов Алан', wl: '3 — 0', sets: '9 — 2', place: 1, out: true },
  { nm: 'Ким Георгий', wl: '2 — 1', sets: '7 — 5', place: 2, out: true, me: true },
  { nm: 'Оралбек Диас', wl: '1 — 2', sets: '4 — 7', place: 3, out: false },
  { nm: 'Цой Артём', wl: '0 — 3', sets: '1 — 9', place: 4, out: false },
];

/** Остальные группы — коротко: кто вышел и с каким результатом. */
export const OTHER_GROUPS = [
  { nm: 'Группа B', out: 'Токаев М. · Абиш Н.', sub: 'сыграна · 6 матчей из 6' },
  { nm: 'Группа C', out: 'Байжанов Е. · Пак С.', sub: 'сыграна · 6 матчей из 6' },
  { nm: 'Группа D', out: 'Гладун И. · Мурат К.', sub: 'идёт · 4 матча из 6' },
];

const PLAYOFF_NAMES = [
  'Смагулов А.', 'Абиш Н.', 'Ким Георгий', 'Токаев М.',
  'Байжанов Е.', 'Мурат К.', 'Пак Сергей', 'Гладун И.',
  'Оспанов Т.', 'Асан Б.', 'Кайрат А.', 'Бекзат Ж.',
  'Нурлан Е.', 'Садык М.', 'Тлеу Р.', 'Жанибек А.',
];

const playoffSides: Side[] = PLAYOFF_NAMES.map((name, i) => ({
  id: 'g' + i,
  name,
  ...(i === 2 ? { avatarUrl: A(44) } : null),
}));

/** Плей-офф после групп: шестнадцать вышедших, наш спортсмен — второй в группе. */
export const playoffBracket: Bracket = {
  format: 'single_elimination',
  title: 'Кубок Алматы 2026 · плей-офф',
  matches: build(4, playoffSides).map((m) =>
    /* В плей-офф наш матч тоже идёт: `build` ставит live во втором круге, а наш
       спортсмен здесь под другим идентификатором. */
    m.a?.id === 'g2' || m.b?.id === 'g2' ? m : m,
  ),
};
