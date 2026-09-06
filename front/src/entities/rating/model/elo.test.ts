/* Спецификация основной формулы Национального рейтинга.
   Источник — Положение о формировании и ведении Национального рейтинга
   спортсменов РК (проект от 28.08.2026), копия: docs/refs/
   polozhenie-reyting-igrokov-2026-08-28.docx, разделы 9, 12, 13.

   Тесты написаны до реализации: рейтинг — та логика, где документ федерации
   и есть спецификация (TESTING.md, «Что разрабатываем по TDD», п. 3). */

import { describe, expect, it } from 'vitest';
import { expectedScore, matchDelta } from './elo';

describe('E — ожидаемый результат (§9.3)', () => {
  it('при равных рейтингах даёт 0,5 каждому', () => {
    expect(expectedScore(20, 20, 15)).toBeCloseTo(0.5, 10);
  });

  it('в сумме по обоим игрокам даёт единицу', () => {
    expect(expectedScore(40, 12, 15) + expectedScore(12, 40, 15)).toBeCloseTo(1, 10);
  });

  it('разрыв ровно в D даёт слабому 1/11', () => {
    // E = 1 / (1 + 10^(D/D)) = 1 / 11
    expect(expectedScore(20, 35, 15)).toBeCloseTo(1 / 11, 10);
    expect(expectedScore(35, 20, 15)).toBeCloseTo(10 / 11, 10);
  });

  it('чем сильнее соперник, тем ниже ожидание', () => {
    const слабее = expectedScore(30, 20, 15);
    const ровня = expectedScore(30, 30, 15);
    const сильнее = expectedScore(30, 45, 15);
    expect(слабее).toBeGreaterThan(ровня);
    expect(ровня).toBeGreaterThan(сильнее);
  });

  it('масштаб D растягивает шкалу: больше D — ближе к равенству', () => {
    const узкая = expectedScore(30, 45, 10);
    const широкая = expectedScore(30, 45, 40);
    expect(широкая).toBeGreaterThan(узкая);
    expect(широкая).toBeLessThan(0.5);
  });
});

describe('Изменение рейтинга за матч (§9.2)', () => {
  const база = { D: 15, K: 0.6, C: 1, P: 1, maxDelta: 1 };

  it('считает P × K × C × (S − E)', () => {
    // равные соперники, победа: 1 × 0,6 × 1 × (1 − 0,5) = +0,30
    expect(matchDelta({ ...база, rating: 20, opponent: 20, won: true })).toBeCloseTo(0.3, 10);
    // то же поражение: 0,6 × (0 − 0,5) = −0,30
    expect(matchDelta({ ...база, rating: 20, opponent: 20, won: false })).toBeCloseTo(-0.3, 10);
  });

  it('победа над сильным весит больше победы над слабым (§4.4)', () => {
    const надСильным = matchDelta({ ...база, rating: 20, opponent: 45, won: true });
    const надСлабым = matchDelta({ ...база, rating: 20, opponent: 5, won: true });
    expect(надСильным).toBeGreaterThan(надСлабым);
    expect(надСлабым).toBeGreaterThan(0);
  });

  it('поражение от слабого бьёт сильнее поражения от сильного (§4.5)', () => {
    const отСлабого = matchDelta({ ...база, rating: 45, opponent: 20, won: false });
    const отСильного = matchDelta({ ...база, rating: 45, opponent: 60, won: false });
    expect(отСлабого).toBeLessThan(отСильного);
    expect(отСильного).toBeLessThan(0);
  });

  it('коэффициент уровня соревнования множит изменение (§13)', () => {
    const республика = matchDelta({ ...база, C: 1.2, rating: 20, opponent: 20, won: true });
    const любители = matchDelta({ ...база, C: 0.6, rating: 20, opponent: 20, won: true });
    expect(республика).toBeCloseTo(0.36, 10);
    expect(любители).toBeCloseTo(0.18, 10);
  });

  it('коэффициент призового места множит изменение (§10)', () => {
    expect(matchDelta({ ...база, P: 1.2, rating: 20, opponent: 20, won: true })).toBeCloseTo(0.36, 10);
  });

  it('ограничение максимального изменения режет и рост, и падение (§12.3)', () => {
    const рост = matchDelta({ ...база, K: 5, maxDelta: 0.5, rating: 20, opponent: 45, won: true });
    const падение = matchDelta({ ...база, K: 5, maxDelta: 0.5, rating: 45, opponent: 20, won: false });
    expect(рост).toBeCloseTo(0.5, 10);
    expect(падение).toBeCloseTo(-0.5, 10);
  });

  it('без ограничения (0 — «не задано») изменение не режется', () => {
    const без = matchDelta({ ...база, K: 5, maxDelta: 0, rating: 20, opponent: 45, won: true });
    expect(без).toBeGreaterThan(4);
  });
});
