import type { Bracket, Side } from './model';

const s = (id: string, name: string, avatar: number): Side => ({
  id,
  name,
  avatarUrl: `https://randomuser.me/api/portraits/men/${avatar}.jpg`,
});

const smag = s('smag', 'Смагулов А.', 32);
const aba = s('aba', 'Абаев Д.', 45);
const kim = s('kim', 'Ким Г.', 44);
const tok = s('tok', 'Токаев М.', 51);
const zhu = s('zhu', 'Жумабеков Р.', 22);
const ser = s('ser', 'Сериков Н.', 64);
const gla = s('gla', 'Гладун И.', 56);
const bai = s('bai', 'Байжанов А.', 85);

/** Демо-сетка на 8 участников: 1/4 сыграны, 1/2 в игре, финал пуст. */
export const sampleBracket: Bracket = {
  format: 'single_elimination',
  title: 'Чемпионат Казахстана 2026',
  matches: [
    // круг 0 — 1/4 финала
    { id: 'qf1', round: 0, slot: 0, a: smag, b: aba, scoreA: 3, scoreB: 1, winner: 'a', status: 'done' },
    { id: 'qf2', round: 0, slot: 1, a: kim, b: tok, scoreA: 2, scoreB: 3, winner: 'b', status: 'done' },
    { id: 'qf3', round: 0, slot: 2, a: zhu, b: ser, scoreA: 3, scoreB: 0, winner: 'a', status: 'done' },
    { id: 'qf4', round: 0, slot: 3, a: gla, b: bai, scoreA: 1, scoreB: 3, winner: 'b', status: 'done' },
    // круг 1 — 1/2 финала
    { id: 'sf1', round: 1, slot: 0, a: smag, b: tok, scoreA: 2, scoreB: 1, winner: null, status: 'live' },
    { id: 'sf2', round: 1, slot: 1, a: zhu, b: bai, scoreA: null, scoreB: null, winner: null, status: 'pending' },
    // круг 2 — финал
    { id: 'f', round: 2, slot: 0, a: null, b: null, status: 'pending' },
  ],
};
