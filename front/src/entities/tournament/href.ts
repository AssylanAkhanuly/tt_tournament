/* Адрес страницы турнира — в кабинете роли ✳ (30.10.2026, решение владельца
   продукта). Страница турнира — своя у каждого кабинета, с фиксированным
   адресом: `/dashboard/tournaments/<id>` у администратора федерации,
   `/gsk/tournaments/<id>` у председателя ГСК, `/referee/tournaments/<id>` у
   судьи. Адрес говорит, в какой роли человек смотрит: одна и та же ссылка
   всегда открывает одно и то же, а кабинет проверяет роль один раз в своей
   оболочке — без ветвлений «если администратор» внутри общей страницы.
   `/tournaments/<id>` — ссылка «поделиться»: она только ведёт в кабинет того,
   кто открыл. Строится здесь, чтобы календари, профиль человека и сами
   страницы не собирали адрес каждый у себя. */

/** Кабинет, в котором открыта страница турнира. `chief` — главный судья этого
 *  турнира ✳ (30.10.2026). */
export type TournamentCabinet = 'dashboard' | 'gsk' | 'chief' | 'referee';
export type TournamentSectionSlug = 'info' | 'players' | 'referees' | 'schedule';

export const tournamentHref = (cabinet: TournamentCabinet, id: string, section?: TournamentSectionSlug) =>
  '/' + cabinet + '/tournaments/' + id + (section ? '/' + section : '');

/** Кабинет для ссылки «поделиться»: старшая из ролей, у которых есть страница
 *  этого турнира (главный судья — только своего); ни одной — null (на вход). */
export function cabinetFor(
  roles: { kind: string; scope_id?: string | null }[],
  tournamentId: string,
): TournamentCabinet | null {
  const has = (k: string) => roles.some((r) => r.kind === k);
  if (has('federation_admin')) return 'dashboard';
  if (has('gsk_chairman')) return 'gsk';
  if (roles.some((r) => r.kind === 'chief_referee' && r.scope_id === tournamentId)) return 'chief';
  if (has('referee')) return 'referee';
  return null;
}
