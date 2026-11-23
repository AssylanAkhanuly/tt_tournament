/* Заглушка фигуры спортсмена ✳ (22.11.2026; общая с 23.11.2026): снимок по
   пояс своего пола (пол неизвестен — любой), один и тот же для человека — по
   id. Файлы — `public/national/players/` (сгенерированы fal.ai). Ею пользуются
   состав сборной, табло судьи стола и карточки рейтинг-листа. */

const PLACEHOLDERS = { m: ['m-1', 'm-2', 'm-3'], f: ['f-1', 'f-2', 'f-3'] } as const;

export function placeholderFigure(id: string, sex?: string | null): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const list: readonly string[] = sex === 'm' || sex === 'f' ? PLACEHOLDERS[sex] : [...PLACEHOLDERS.m, ...PLACEHOLDERS.f];
  return `/national/players/${list[h % list.length]}.webp`;
}
