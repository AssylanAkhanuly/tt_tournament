import type { Bracket, Match, Side } from '@/entities/bracket/model';

// Большой реалистичный посев — чтобы видеть масштаб «как в жизни» (турнир на
// ~200 человек). Имена генерим, аватары не грузим (иначе сотни запросов).
export function makeBigBracket(rounds: number): Bracket {
  const surn = ['Смагулов', 'Ким', 'Токаев', 'Жумабеков', 'Сериков', 'Гладун', 'Байжанов',
    'Абаев', 'Оспанов', 'Пак', 'Ли', 'Цой', 'Нурлан', 'Абиш', 'Кайрат', 'Ермек', 'Данияр',
    'Асан', 'Мурат', 'Бекзат'];
  const N = 2 ** rounds;
  const matches: Match[] = [];
  let sides: Side[] = Array.from({ length: N }, (_, i) => ({
    id: 'p' + i,
    name: `${surn[i % surn.length]} ${String.fromCharCode(1040 + (i % 32))}.`,
  }));
  for (let r = 0; r < rounds; r++) {
    const winners: Side[] = [];
    for (let s = 0; s < sides.length / 2; s++) {
      const a = sides[2 * s];
      const b = sides[2 * s + 1];
      const aWin = (s + r) % 3 !== 0;
      matches.push({
        id: `r${r}s${s}`, round: r, slot: s, a, b,
        scoreA: aWin ? 3 : s % 2 ? 1 : 2, scoreB: aWin ? (s % 2 ? 1 : 2) : 3,
        winner: aWin ? 'a' : 'b', status: 'done',
      });
      winners.push(aWin ? a : b);
    }
    sides = winners;
  }
  const fin = matches[matches.length - 1]; // финал — live для акцента
  fin.status = 'live';
  fin.winner = null;
  fin.scoreA = 2;
  fin.scoreB = 1;
  return { format: 'single_elimination', title: 'Чемпионат Казахстана 2026', matches };
}

export const bigBracket = makeBigBracket(7); // 128 участников
