/* Неактивность (§18) и возрастная выборка (§7.4) Положения. */

export type ActivityStatus = 'нет матчей' | 'активен' | 'неактивен' | 'обнулён';

/** Полных месяцев между датами. */
const monthsBetween = (from: Date, to: Date): number => {
  const m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  return to.getDate() < from.getDate() ? m - 1 : m;
};

/** §18.1 — 24 месяца без матчей дают статус «неактивен», рейтинг сохраняется
    (§18.2) и возвращается при возобновлении в пределах 60 месяцев (§18.3).
    §18.4 — после 60 месяцев рейтинг аннулируется.

    ⚠ Границу «ровно 60 месяцев» Положение не разводит: §18.3 даёт право
    вернуться «в течение 60 месяцев», §18.4 обнуляет «в течение 60 месяцев»
    без матчей. Здесь ровно 60 — уже обнуление. */
export const activityStatus = (
  lastMatch: Date | null | undefined,
  now: Date = new Date(),
): { status: ActivityStatus; months: number; ratingKept: boolean } => {
  if (!lastMatch) return { status: 'нет матчей', months: 0, ratingKept: true };
  const months = monthsBetween(lastMatch, now);
  if (months >= 60) return { status: 'обнулён', months, ratingKept: false };
  if (months >= 24) return { status: 'неактивен', months, ratingKept: true };
  return { status: 'активен', months, ratingKept: true };
};

export type AgeCategory = 'U11' | 'U13' | 'U15' | 'U17' | 'U19' | 'U21';

/* §7.4 задаёт саму разность — «год проведения соревнования минус год
   рождения», — но границы ступеней в Положении не написаны. Здесь взято
   правило ITTF: в категорию Un попадает тот, у кого разность не больше n − 1,
   то есть в год своего n-летия спортсмен из категории выходит. ⚠ Требует
   подтверждения федерации. */
const STEPS: [AgeCategory, number][] = [
  ['U11', 10],
  ['U13', 12],
  ['U15', 14],
  ['U17', 16],
  ['U19', 18],
  ['U21', 20],
];

export const ageCategory = (competitionYear: number, birthYear: number): AgeCategory | null => {
  const diff = competitionYear - birthYear;
  return STEPS.find(([, max]) => diff <= max)?.[0] ?? null;
};
