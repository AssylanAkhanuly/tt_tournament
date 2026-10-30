/* Сетка месяца для календаря турниров: шесть недель с понедельника, чтобы
   высота календаря не прыгала от месяца к месяцу. Чистая функция — без React. */

export type GridDay = { date: Date; inMonth: boolean };

/** Ключ дня в местном времени: турнир «29-го» стоит на 29-м и в Алматы, и в
 *  браузере с другим поясом не уезжает — дата берётся местная. */
export const dayKey = (d: Date) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export function monthGrid(year: number, month: number): GridDay[] {
  const first = new Date(year, month, 1);
  const shift = (first.getDay() + 6) % 7; // понедельник — 0
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(year, month, 1 - shift + i);
    return { date, inMonth: date.getMonth() === month };
  });
}
