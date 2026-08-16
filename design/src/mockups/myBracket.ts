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
function build(): Match[] {
  const matches: Match[] = [];
  let round: (Side | null)[] = sides;

  for (let r = 0; r < 5; r++) {
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

export const myBracket: Bracket = {
  format: 'single_elimination',
  title: 'Кубок Алматы 2026',
  matches: build(),
};
