// Адреса табло. Запросы из браузера идут на относительный путь — его
// проксирует next.config.ts в Django, поэтому куки остаются первой стороной.

export const DEFAULT_BOARD_KEY = 'main';

/** Ручка одной доски: GET — счёт, PUT — новое состояние. */
export function boardUrl(key: string): string {
  return `/api/scoreboard/${encodeURIComponent(key)}/`;
}

/** Поток изменений доски: одно соединение вместо череды запросов. */
export function boardStreamUrl(key: string): string {
  return `${boardUrl(key)}stream/`;
}

/** Ключ доски из адреса страницы: столов в турнире может быть несколько. */
export function boardKeyFrom(value: string | string[] | undefined): string {
  const key = Array.isArray(value) ? value[0] : value;
  return key && /^[-\w]+$/.test(key) ? key : DEFAULT_BOARD_KEY;
}
